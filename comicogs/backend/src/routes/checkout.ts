import { Router } from "express";
import Stripe from "stripe";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "../middleware/auth";
import { asyncHandler, AppError } from "../middleware/errorHandler";
import { z } from "zod";

const router = Router();
const prisma = new PrismaClient();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { 
  apiVersion: "2024-06-20" 
});

const CheckoutSchema = z.object({
  listingId: z.string(),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

// Create checkout session
router.post("/", requireAuth, asyncHandler(async (req, res) => {
  const { listingId, successUrl, cancelUrl } = CheckoutSchema.parse(req.body);
  
  try {
    // Get listing details
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        comic: {
          select: {
            id: true,
            title: true,
            series: true,
            issue: true,
            coverUrl: true,
          }
        },
        seller: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    if (!listing) {
      throw new AppError('Listing not found', 404);
    }

    if (listing.status !== 'active') {
      throw new AppError('Listing is no longer available', 400);
    }

    if (listing.sellerId === req.user!.id) {
      throw new AppError('You cannot buy your own listing', 400);
    }

    // Create product name
    const productName = `${listing.comic.series} #${listing.comic.issue}`;
    const description = listing.comic.title ? 
      `${listing.comic.title} - Grade: ${listing.comic.grade || 'Ungraded'}` : 
      `Grade: ${listing.comic.grade || 'Ungraded'}`;

    const amount = Math.round(Number(listing.price) * 100); // Convert to cents

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: { 
            name: productName,
            description: description,
            images: listing.comic.coverUrl ? [listing.comic.coverUrl] : undefined,
          },
          unit_amount: amount,
        },
        quantity: 1
      }],
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      metadata: { 
        listingId: listing.id, 
        buyerId: req.user!.id,
        sellerId: listing.sellerId,
        comicId: listing.comicId
      },
      customer_email: req.user!.email,
      // Add shipping if needed
      shipping_address_collection: {
        allowed_countries: ['US', 'CA'],
      },
      // Payment method types
      payment_method_types: ['card'],
      // Billing address collection
      billing_address_collection: 'required',
    });

    // Create pending order in database
    await prisma.order.create({
      data: {
        userId: req.user!.id,
        listingId: listing.id,
        amount,
        currency: "usd",
        status: "pending",
        stripeSession: session.id,
      }
    });

    req.logger.info({ 
      sessionId: session.id,
      listingId,
      buyerId: req.user!.id,
      amount: listing.price
    }, 'Checkout session created');

    res.json({ 
      url: session.url, 
      sessionId: session.id,
      listing: {
        id: listing.id,
        comic: listing.comic,
        price: listing.price,
        seller: listing.seller
      }
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    req.logger.error({ error, listingId, userId: req.user!.id }, 'Failed to create checkout session');
    throw new AppError('Failed to create checkout session', 500);
  }
}));

export default router;
