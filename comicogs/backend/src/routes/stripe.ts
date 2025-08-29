import { Router } from "express";
import Stripe from "stripe";
import express from "express";
import type { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { logger } from "../middleware/logger";

const router = Router();
const prisma = new PrismaClient();

// Initialize Stripe only if API key is provided
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, { 
  apiVersion: "2024-06-20" 
}) : null;

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Stripe webhook endpoint with raw body parsing
router.post("/webhook", express.raw({ type: "application/json" }), async (req: Request, res: Response) => {
  if (!stripe || !endpointSecret) {
    logger.warn("Stripe webhook called but Stripe is not configured");
    return res.status(400).json({ error: "Stripe not configured" });
  }

  const sig = req.headers["stripe-signature"] as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err: any) {
    logger.error({ err }, "Stripe signature verification failed");
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Idempotency: skip if already processed
  try {
    const exists = await prisma.webhookEvent.findUnique({ 
      where: { id: event.id }
    });
    
    if (exists) {
      logger.info({ eventId: event.id }, "Webhook event already processed");
      return res.status(200).send("ok");
    }

    // Record this event as processed
    await prisma.webhookEvent.create({ 
      data: { 
        id: event.id, 
        type: event.type 
      }
    });

    logger.info({ 
      eventId: event.id, 
      type: event.type 
    }, "Processing Stripe webhook event");

    // Process the webhook event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const listingId = session.metadata?.listingId;
        const buyerId = session.metadata?.buyerId;
        
        if (!listingId || !buyerId) {
          logger.warn({ 
            sessionId: session.id, 
            metadata: session.metadata 
          }, "Missing required metadata in checkout session");
          break;
        }

        // Use transaction to ensure consistency
        await prisma.$transaction(async (tx) => {
          // Update the existing pending order to paid
          const order = await tx.order.findUnique({
            where: { stripeSession: session.id }
          });

          if (order) {
            await tx.order.update({
              where: { id: order.id },
              data: {
                status: "paid",
                paymentIntent: session.payment_intent as string
              }
            });

            // Update listing to sold
            await tx.listing.update({
              where: { id: order.listingId },
              data: { status: "sold" },
              include: {
                comic: {
                  select: {
                    title: true,
                    series: true,
                    issue: true
                  }
                }
              }
            });

            logger.info({ 
              orderId: order.id,
              listingId: order.listingId,
              userId: order.userId,
              amount: order.amount / 100,
              sessionId: session.id
            }, "Order marked as paid from successful checkout");
          } else {
            logger.warn({ 
              sessionId: session.id 
            }, "No pending order found for completed checkout session");
          }
        });
        break;
      }

      case "charge.dispute.created": {
        const dispute = event.data.object as Stripe.Dispute;
        const charge = dispute.charge as string;
        
        logger.warn({ 
          disputeId: dispute.id,
          chargeId: charge,
          amount: dispute.amount / 100,
          reason: dispute.reason
        }, "Charge dispute created");
        
        // You could add logic here to handle disputes
        // e.g., notify admin, update order status, etc.
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId = typeof charge.payment_intent === "string" 
          ? charge.payment_intent 
          : charge.payment_intent?.id;
        
        if (paymentIntentId) {
          const order = await prisma.order.findFirst({
            where: { paymentIntent: paymentIntentId }
          });
          
          if (order) {
            await prisma.order.update({
              where: { id: order.id },
              data: { status: "refunded" }
            });
            
            logger.info({
              orderId: order.id,
              paymentIntentId,
              amount: charge.amount_refunded / 100
            }, "Order marked as refunded");
          } else {
            logger.warn({
              paymentIntentId,
              chargeId: charge.id
            }, "No order found for refunded charge");
          }
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        // Try to mark corresponding order as failed
        const order = await prisma.order.findUnique({
          where: { paymentIntent: paymentIntent.id }
        });
        
        if (order) {
          await prisma.order.update({
            where: { id: order.id },
            data: { status: "failed" }
          });
        }
        
        logger.warn({
          paymentIntentId: paymentIntent.id,
          amount: (paymentIntent.amount || 0) / 100,
          lastPaymentError: paymentIntent.last_payment_error,
          orderId: order?.id
        }, "Payment failed");
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Mark expired checkout sessions as canceled
        const order = await prisma.order.findUnique({
          where: { stripeSession: session.id }
        });
        
        if (order) {
          await prisma.order.update({
            where: { id: order.id },
            data: { status: "canceled" }
          });
          
          logger.info({
            sessionId: session.id,
            orderId: order.id
          }, "Order canceled due to expired checkout session");
        }
        break;
      }

      default:
        logger.info({ eventType: event.type }, "Unhandled webhook event type");
        break;
    }

    res.json({ received: true });
  } catch (err: any) {
    logger.error({ 
      error: err.message, 
      stack: err.stack,
      eventId: event.id,
      eventType: event.type
    }, "Webhook handling failed");
    
    res.status(500).json({ error: "webhook processing failed" });
  }
});

export default router;
