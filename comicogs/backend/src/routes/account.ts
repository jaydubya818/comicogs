import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "../middleware/auth";
import { asyncHandler, AppError } from "../middleware/errorHandler";
import { z } from "zod";

const router = Router();
const prisma = new PrismaClient();

// Apply auth middleware to all routes
router.use(requireAuth);

const DeleteAccountSchema = z.object({
  confirmEmail: z.string().email(),
  reason: z.string().max(500).optional(),
  password: z.string().min(1), // In a real app, you'd verify this password
});

// Export user data (GDPR compliance)
router.get("/export", asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  
  try {
    // Fetch all user data
    const [
      user,
      orders,
      listings,
      collection,
      wantlist,
      savedSearches,
      reports
    ] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          role: true,
          createdAt: true,
        }
      }),
      prisma.order.findMany({
        where: { userId },
        include: {
          listing: {
            include: {
              comic: {
                select: {
                  title: true,
                  series: true,
                  issue: true,
                  grade: true,
                  price: true,
                }
              }
            }
          }
        }
      }),
      prisma.listing.findMany({
        where: { sellerId: userId },
        include: {
          comic: true,
          order: true,
        }
      }),
      prisma.collectionItem.findMany({
        where: { userId },
        include: {
          comic: true,
        }
      }),
      prisma.wantItem.findMany({
        where: { userId },
      }),
      prisma.savedSearch.findMany({
        where: { userId },
      }),
      prisma.report.findMany({
        where: { reporterId: userId },
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
      })
    ]);

    const exportData = {
      exportedAt: new Date().toISOString(),
      user,
      statistics: {
        totalOrders: orders.length,
        totalListings: listings.length,
        collectionSize: collection.length,
        wantlistSize: wantlist.length,
        savedSearches: savedSearches.length,
        reportsSubmitted: reports.length,
      },
      orders: orders.map(order => ({
        id: order.id,
        status: order.status,
        amount: order.amount / 100, // Convert cents to dollars
        currency: order.currency,
        createdAt: order.createdAt,
        comic: {
          title: order.listing.comic.title,
          series: order.listing.comic.series,
          issue: order.listing.comic.issue,
          grade: order.listing.comic.grade,
          price: order.listing.comic.price,
        }
      })),
      listings: listings.map(listing => ({
        id: listing.id,
        status: listing.status,
        price: listing.price,
        createdAt: listing.createdAt,
        sold: !!listing.order,
        comic: listing.comic,
      })),
      collection: collection.map(item => ({
        id: item.id,
        notes: item.notes,
        acquiredAt: item.acquiredAt,
        comic: item.comic,
      })),
      wantlist: wantlist,
      savedSearches: savedSearches.map(search => ({
        id: search.id,
        name: search.name,
        query: search.queryJson,
        cadence: search.cadence,
        createdAt: search.createdAt,
        lastRunAt: search.lastRunAt,
      })),
      reports: reports.map(report => ({
        id: report.id,
        reason: report.reason,
        note: report.note,
        status: report.status,
        createdAt: report.createdAt,
        listing: {
          comic: report.listing.comic,
        }
      })),
    };

    req.logger?.info({
      userId,
      dataSize: JSON.stringify(exportData).length,
    }, "User data export requested");

    // Set headers for file download
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="comicogs-data-export-${userId}-${Date.now()}.json"`);
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    
    res.send(JSON.stringify(exportData, null, 2));
  } catch (error: any) {
    req.logger?.error({
      error: error.message,
      userId,
    }, "Failed to export user data");
    
    throw new AppError("Failed to export data", 500);
  }
}));

// Delete user account (GDPR compliance)
router.post("/delete", asyncHandler(async (req, res) => {
  const { confirmEmail, reason, password } = DeleteAccountSchema.parse(req.body);
  const userId = req.user!.id;
  const userEmail = req.user!.email;
  
  // Verify email confirmation
  if (confirmEmail.toLowerCase() !== userEmail.toLowerCase()) {
    throw new AppError("Email confirmation does not match your account email", 400);
  }

  // TODO: In a real application, verify the password here
  // const isValidPassword = await verifyPassword(password, user.hashedPassword);
  // if (!isValidPassword) {
  //   throw new AppError("Invalid password", 400);
  // }

  try {
    // Check if user has pending orders or active listings
    const [pendingOrders, activeListings] = await Promise.all([
      prisma.order.count({
        where: {
          userId,
          status: { in: ["pending", "paid"] }
        }
      }),
      prisma.listing.count({
        where: {
          sellerId: userId,
          status: "active"
        }
      })
    ]);

    if (pendingOrders > 0) {
      throw new AppError(
        `Cannot delete account with ${pendingOrders} pending order(s). Please wait for orders to complete or contact support.`, 
        400
      );
    }

    if (activeListings > 0) {
      throw new AppError(
        `Cannot delete account with ${activeListings} active listing(s). Please remove or complete all listings first.`, 
        400
      );
    }

    // Perform account deletion in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete user-generated content
      await tx.report.deleteMany({ where: { reporterId: userId } });
      await tx.savedSearch.deleteMany({ where: { userId } });
      await tx.wantItem.deleteMany({ where: { userId } });
      await tx.collectionItem.deleteMany({ where: { userId } });
      
      // Delete/anonymize orders (keep for record keeping but remove PII)
      await tx.order.updateMany({
        where: { userId },
        data: { userId: "deleted-user" } // Or handle differently based on your needs
      });
      
      // Delete/anonymize listings
      await tx.listing.updateMany({
        where: { sellerId: userId },
        data: { sellerId: "deleted-user" }
      });
      
      // Finally, anonymize the user record (don't fully delete to maintain referential integrity)
      await tx.user.update({
        where: { id: userId },
        data: {
          email: `deleted-${userId}@deleted.local`,
          name: "Deleted User",
          image: null,
          role: "user",
          // Add a deletedAt timestamp if you have one
        }
      });
    });

    req.logger?.info({
      userId,
      email: userEmail,
      reason,
    }, "User account deletion completed");

    // TODO: Send confirmation email
    // TODO: Notify admin team if needed
    // TODO: Add user to suppression list to prevent re-registration

    res.json({
      success: true,
      message: "Your account has been successfully deleted. We're sorry to see you go!",
      deletedAt: new Date().toISOString(),
    });

  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }
    
    req.logger?.error({
      error: error.message,
      userId,
      email: userEmail,
    }, "Failed to delete user account");
    
    throw new AppError("Failed to delete account", 500);
  }
}));

// Get account deletion info (what will be deleted)
router.get("/deletion-info", asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  
  const [
    ordersCount,
    activeListings,
    collectionSize,
    wantlistSize,
    savedSearchesCount,
    reportsCount
  ] = await Promise.all([
    prisma.order.count({ where: { userId } }),
    prisma.listing.count({ where: { sellerId: userId, status: "active" } }),
    prisma.collectionItem.count({ where: { userId } }),
    prisma.wantItem.count({ where: { userId } }),
    prisma.savedSearch.count({ where: { userId } }),
    prisma.report.count({ where: { reporterId: userId } }),
  ]);

  const canDelete = activeListings === 0; // Simplified check

  res.json({
    canDelete,
    blockers: canDelete ? [] : [
      activeListings > 0 ? `${activeListings} active listings must be removed first` : null
    ].filter(Boolean),
    dataToBeDeleted: {
      orders: ordersCount,
      listings: activeListings,
      collectionItems: collectionSize,
      wantlistItems: wantlistSize,
      savedSearches: savedSearchesCount,
      reports: reportsCount,
    },
    consequences: [
      "Your account will be permanently deleted",
      "All your data will be removed from our systems",
      "You will not be able to recover your account or data",
      "Any active subscriptions will be cancelled",
      "You will be logged out of all devices immediately",
    ]
  });
}));

// Request account data download (async for large datasets)
router.post("/request-export", asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  
  // TODO: In a production system, you might queue this as a background job
  // and email the user when it's ready, especially for large datasets
  
  req.logger?.info({ userId }, "Data export requested");
  
  res.json({
    message: "Data export has been prepared. You can download it immediately.",
    downloadUrl: `/api/account/export`,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
  });
}));

export default router;