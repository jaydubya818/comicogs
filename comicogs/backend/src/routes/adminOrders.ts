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

// Middleware to require admin role
const requireAdmin = (req: any, res: any, next: any) => {
  if (req.user?.role !== "admin") {
    throw new AppError("Admin access required", 403);
  }
  next();
};

// Apply auth and admin middleware to all routes
router.use(requireAuth, requireAdmin);

const RefundSchema = z.object({
  reason: z.string().optional(),
  amount: z.number().positive().optional(), // Partial refund amount in cents
  notifyCustomer: z.boolean().default(true),
});

// Get all orders (admin view)
router.get("/", asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const status = req.query.status as string;
  const offset = (page - 1) * limit;

  const where = status ? { status } : {};

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip: offset,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        listing: {
          include: {
            comic: {
              select: {
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
                email: true,
              }
            }
          }
        }
      }
    }),
    prisma.order.count({ where })
  ]);

  res.json({
    orders,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

// Get specific order details
router.get("/:id", asyncHandler(async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: {
      buyer: {
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        }
      },
      listing: {
        include: {
          comic: true,
          seller: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          }
        }
      }
    }
  });

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  // Get Stripe payment intent details if available
  let stripeDetails = null;
  if (order.paymentIntent) {
    try {
      stripeDetails = await stripe.paymentIntents.retrieve(order.paymentIntent, {
        expand: ['charges', 'latest_charge.refunds']
      });
    } catch (error) {
      req.logger?.warn({ paymentIntentId: order.paymentIntent }, "Could not retrieve Stripe details");
    }
  }

  res.json({
    order,
    stripeDetails
  });
}));

// Issue full or partial refund
router.post("/:id/refund", asyncHandler(async (req, res) => {
  const { reason, amount, notifyCustomer } = RefundSchema.parse(req.body);
  
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: {
      buyer: { select: { email: true, name: true } },
      listing: {
        include: {
          comic: { select: { title: true, series: true, issue: true } },
          seller: { select: { email: true, name: true } }
        }
      }
    }
  });

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  if (order.status !== "paid") {
    throw new AppError(`Cannot refund order with status: ${order.status}`, 400);
  }

  if (!order.paymentIntent) {
    throw new AppError("No payment intent found for this order", 400);
  }

  try {
    // Create refund in Stripe
    const refundParams: Stripe.RefundCreateParams = {
      payment_intent: order.paymentIntent,
      reason: reason === "duplicate" ? "duplicate" : 
              reason === "fraudulent" ? "fraudulent" : 
              "requested_by_customer",
      metadata: {
        orderId: order.id,
        adminId: req.user!.id,
        adminReason: reason || "Admin refund"
      }
    };

    // Add partial refund amount if specified
    if (amount && amount < order.amount) {
      refundParams.amount = amount;
    }

    const refund = await stripe.refunds.create(refundParams);

    // Log the refund action
    req.logger?.info({
      orderId: order.id,
      refundId: refund.id,
      amount: refund.amount / 100,
      adminId: req.user!.id,
      reason
    }, "Admin refund issued");

    // Note: Order status will be updated to "refunded" by webhook
    // But we could update immediately for better UX
    if (refund.amount === order.amount) {
      // Full refund - update order status immediately
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "refunded" }
      });
    }

    // TODO: Send notification emails if notifyCustomer is true
    // This would typically integrate with your email service

    res.json({
      refund: {
        id: refund.id,
        amount: refund.amount / 100,
        status: refund.status,
        reason: refund.reason,
      },
      order: {
        id: order.id,
        status: refund.amount === order.amount ? "refunded" : "paid"
      }
    });

  } catch (error: any) {
    req.logger?.error({
      error: error.message,
      orderId: order.id,
      adminId: req.user!.id
    }, "Failed to process refund");

    if (error.type === "StripeError") {
      throw new AppError(`Stripe error: ${error.message}`, 400);
    }
    
    throw new AppError("Failed to process refund", 500);
  }
}));

// Cancel pending order
router.post("/:id/cancel", asyncHandler(async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id }
  });

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  if (order.status !== "pending") {
    throw new AppError(`Cannot cancel order with status: ${order.status}`, 400);
  }

  // Cancel/expire the Stripe checkout session if it exists
  if (order.stripeSession) {
    try {
      await stripe.checkout.sessions.expire(order.stripeSession);
    } catch (error) {
      req.logger?.warn({
        sessionId: order.stripeSession,
        error: error.message
      }, "Could not expire Stripe session");
    }
  }

  // Update order status
  await prisma.order.update({
    where: { id: order.id },
    data: { status: "canceled" }
  });

  req.logger?.info({
    orderId: order.id,
    adminId: req.user!.id
  }, "Order canceled by admin");

  res.json({
    order: {
      id: order.id,
      status: "canceled"
    }
  });
}));

// Get order statistics for admin dashboard
router.get("/stats/overview", asyncHandler(async (req, res) => {
  const now = new Date();
  const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
  
  const [
    totalOrders,
    paidOrders,
    refundedOrders,
    recentOrders,
    monthlyRevenue
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: "paid" } }),
    prisma.order.count({ where: { status: "refunded" } }),
    prisma.order.count({ where: { createdAt: { gte: monthAgo } } }),
    prisma.order.aggregate({
      where: { 
        status: "paid",
        createdAt: { gte: monthAgo }
      },
      _sum: { amount: true }
    })
  ]);

  res.json({
    stats: {
      totalOrders,
      paidOrders,
      refundedOrders,
      recentOrders,
      monthlyRevenue: (monthlyRevenue._sum.amount || 0) / 100, // Convert cents to dollars
      refundRate: paidOrders > 0 ? (refundedOrders / paidOrders * 100).toFixed(2) : "0.00"
    }
  });
}));

export default router;