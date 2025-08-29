import { Router } from "express";
import Stripe from "stripe";
import { PrismaClient } from "@prisma/client";
import { requireAuth, requireRole } from "../middleware/auth";
import { asyncHandler, AppError } from "../middleware/errorHandler";
import { z } from "zod";

const router = Router();
const prisma = new PrismaClient();

// Initialize Stripe only if API key is provided
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20"
}) : null;

const OrderParamsSchema = z.object({
  id: z.string(),
});

// GET /api/orders/:id - Get order details
router.get("/:id", requireAuth, asyncHandler(async (req, res) => {
  const { id } = OrderParamsSchema.parse(req.params);
  
  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        listing: {
          include: {
            comic: {
              select: {
                id: true,
                title: true,
                series: true,
                issue: true,
                grade: true,
                format: true,
                coverUrl: true,
                tags: true,
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
        },
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    // Check access: buyer, seller, or admin can view
    const isAuthorized = order.buyerId === req.user!.id || 
                        order.listing.sellerId === req.user!.id ||
                        req.user!.role === 'admin';

    if (!isAuthorized) {
      throw new AppError('Access denied', 403);
    }

    req.logger.info({ 
      orderId: id,
      viewerId: req.user!.id,
      viewerRole: req.user!.role
    }, 'Order viewed');

    res.json({
      order: {
        id: order.id,
        status: order.status,
        total: order.total,
        createdAt: order.createdAt,
        listing: order.listing,
        buyer: order.buyer,
        // Only show seller details to buyer/admin
        seller: (order.buyerId === req.user!.id || req.user!.role === 'admin') ? 
                order.listing.seller : { id: order.listing.seller.id, name: order.listing.seller.name }
      }
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    req.logger.error({ error, orderId: id, userId: req.user!.id }, 'Failed to retrieve order');
    throw new AppError('Failed to retrieve order', 500);
  }
}));

// GET /api/orders - List user's orders
router.get("/", requireAuth, asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const skip = (page - 1) * limit;

  try {
    // Build where clause based on user role
    let where: any = {};
    
    if (req.user!.role === 'admin') {
      // Admin can see all orders
      where = {};
    } else {
      // Regular users see only their orders (as buyer or seller)
      where = {
        OR: [
          { buyerId: req.user!.id },
          { listing: { sellerId: req.user!.id } }
        ]
      };
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          listing: {
            include: {
              comic: {
                select: {
                  id: true,
                  title: true,
                  series: true,
                  issue: true,
                  grade: true,
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
          },
          buyer: {
            select: {
              id: true,
              name: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);

    req.logger.info({ 
      userId: req.user!.id,
      userRole: req.user!.role,
      total,
      page,
      limit
    }, 'Orders listed');

    res.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    req.logger.error({ error, userId: req.user!.id }, 'Failed to list orders');
    throw new AppError('Failed to retrieve orders', 500);
  }
}));

// POST /api/orders/:id/refund - Admin refund endpoint
router.post("/:id/refund", requireAuth, requireRole("admin"), asyncHandler(async (req, res) => {
  const { id } = OrderParamsSchema.parse(req.params);
  const { reason } = req.body;

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        listing: {
          include: {
            comic: {
              select: {
                title: true,
                series: true,
                issue: true,
              }
            }
          }
        }
      }
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (order.status !== 'paid') {
      throw new AppError('Order cannot be refunded', 400);
    }

    // For demo purposes, we'll simulate finding the payment intent
    // In production, you'd store the payment_intent_id with the order
    const paymentIntents = await stripe.paymentIntents.list({
      limit: 100,
    });

    // Find the payment intent that matches our order amount and timing
    const matchingIntent = paymentIntents.data.find(pi => 
      pi.amount === Math.round(Number(order.total) * 100) &&
      pi.status === 'succeeded' &&
      Math.abs(new Date(pi.created * 1000).getTime() - order.createdAt.getTime()) < 300000 // within 5 minutes
    );

    if (!matchingIntent) {
      throw new AppError('Payment intent not found for refund', 404);
    }

    // Create the refund
    const refund = await stripe.refunds.create({ 
      payment_intent: matchingIntent.id,
      reason: 'requested_by_customer',
      metadata: {
        orderId: order.id,
        adminId: req.user!.id,
        adminReason: reason || 'Admin initiated refund'
      }
    });

    // Update order status
    await prisma.order.update({ 
      where: { id: order.id }, 
      data: { status: "refunded" }
    });

    // Update listing back to active if needed
    await prisma.listing.update({
      where: { id: order.listingId },
      data: { status: "active" }
    });

    req.logger.info({ 
      orderId: order.id,
      refundId: refund.id,
      amount: order.total,
      adminId: req.user!.id,
      reason
    }, 'Order refunded by admin');

    res.json({ 
      success: true, 
      refundId: refund.id,
      amount: Number(order.total),
      order: {
        id: order.id,
        status: 'refunded',
        comic: order.listing.comic
      }
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    req.logger.error({ error, orderId: id, adminId: req.user!.id }, 'Failed to process refund');
    throw new AppError('Failed to process refund', 500);
  }
}));

export default router;
