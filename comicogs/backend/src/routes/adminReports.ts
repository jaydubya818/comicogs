import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "../middleware/auth";
import { asyncHandler, AppError } from "../middleware/errorHandler";
import { z } from "zod";

const router = Router();
const prisma = new PrismaClient();

// Middleware to require admin role
const requireAdmin = (req: any, res: any, next: any) => {
  if (req.user?.role !== "admin") {
    throw new AppError("Admin access required", 403);
  }
  next();
};

// Apply auth and admin middleware to all routes
router.use(requireAuth, requireAdmin);

const ActionSchema = z.object({
  action: z.enum(["hide", "delete", "dismiss"]),
  note: z.string().max(500).optional(),
  notifySeller: z.boolean().default(true),
  notifyReporter: z.boolean().default(true),
});

// Get all reports (admin queue)
router.get("/", asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const status = req.query.status as string || "open";
  const reason = req.query.reason as string;
  const offset = (page - 1) * limit;

  const where: any = {};
  if (status) where.status = status;
  if (reason) where.reason = reason;

  const [reports, total] = await Promise.all([
    prisma.report.findMany({
      where,
      skip: offset,
      take: limit,
      orderBy: { createdAt: "asc" }, // Oldest first for FIFO processing
      include: {
        listing: {
          include: {
            comic: {
              select: {
                title: true,
                series: true,
                issue: true,
                coverUrl: true,
                price: true,
              }
            },
            seller: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              }
            }
          }
        },
        reporter: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          }
        }
      }
    }),
    prisma.report.count({ where })
  ]);

  // Add additional context for each report
  const enrichedReports = await Promise.all(
    reports.map(async (report) => {
      // Count other reports against this listing
      const otherReportsCount = await prisma.report.count({
        where: {
          listingId: report.listingId,
          id: { not: report.id }
        }
      });

      // Count reports by this reporter
      const reporterHistoryCount = await prisma.report.count({
        where: { reporterId: report.reporterId }
      });

      // Count reports against this seller
      const sellerReportsCount = await prisma.report.count({
        where: {
          listing: { sellerId: report.listing.seller.id }
        }
      });

      return {
        ...report,
        context: {
          otherReportsOnListing: otherReportsCount,
          reporterTotalReports: reporterHistoryCount,
          sellerTotalReports: sellerReportsCount,
        }
      };
    })
  );

  res.json({
    reports: enrichedReports,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

// Take action on a report
router.post("/:id/action", asyncHandler(async (req, res) => {
  const { action, note, notifySeller, notifyReporter } = ActionSchema.parse(req.body);
  
  const report = await prisma.report.findUnique({
    where: { id: req.params.id },
    include: {
      listing: {
        include: {
          comic: {
            select: {
              title: true,
              series: true,
              issue: true,
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
      reporter: {
        select: {
          id: true,
          name: true,
          email: true,
        }
      }
    }
  });

  if (!report) {
    throw new AppError("Report not found", 404);
  }

  if (report.status !== "open") {
    throw new AppError("Report has already been processed", 400);
  }

  // Perform the action in a transaction
  await prisma.$transaction(async (tx) => {
    // Update report status
    const newStatus = action === "dismiss" ? "dismissed" : "actioned";
    await tx.report.update({
      where: { id: report.id },
      data: { 
        status: newStatus,
        // TODO: Add adminId and actionNote fields to schema
      }
    });

    // Take action on the listing
    if (action === "hide") {
      await tx.listing.update({
        where: { id: report.listingId },
        data: { status: "hidden" }
      });
    } else if (action === "delete") {
      // Soft delete by setting status to deleted
      await tx.listing.update({
        where: { id: report.listingId },
        data: { status: "deleted" }
      });
    }

    // If hiding or deleting, also handle other open reports for the same listing
    if (action === "hide" || action === "delete") {
      await tx.report.updateMany({
        where: {
          listingId: report.listingId,
          status: "open",
          id: { not: report.id }
        },
        data: { status: "actioned" }
      });
    }
  });

  req.logger?.info({
    reportId: report.id,
    listingId: report.listingId,
    action,
    adminId: req.user!.id,
    note
  }, "Report action taken");

  // TODO: Send notifications
  // if (notifySeller && report.listing.seller.email) {
  //   await sendSellerNotification(report, action, note);
  // }
  // if (notifyReporter && report.reporter.email) {
  //   await sendReporterNotification(report, action);
  // }

  const actionMessage = {
    hide: `Listing "${report.listing.comic.series} #${report.listing.comic.issue}" has been hidden due to policy violations.`,
    delete: `Listing "${report.listing.comic.series} #${report.listing.comic.issue}" has been removed due to policy violations.`,
    dismiss: `Report has been reviewed and dismissed. No action taken on the listing.`
  };

  res.json({
    success: true,
    action,
    message: actionMessage[action],
    report: {
      id: report.id,
      status: action === "dismiss" ? "dismissed" : "actioned"
    }
  });
}));

// Get reports statistics for admin dashboard
router.get("/stats", asyncHandler(async (req, res) => {
  const [
    openReports,
    actionedReports,
    dismissedReports,
    recentReports,
    reportsByReason
  ] = await Promise.all([
    prisma.report.count({ where: { status: "open" } }),
    prisma.report.count({ where: { status: "actioned" } }),
    prisma.report.count({ where: { status: "dismissed" } }),
    prisma.report.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    }),
    prisma.report.groupBy({
      by: ['reason'],
      _count: { reason: true },
      orderBy: { _count: { reason: 'desc' } }
    })
  ]);

  // Get top reported listings
  const topReportedListings = await prisma.report.groupBy({
    by: ['listingId'],
    _count: { listingId: true },
    where: { status: 'open' },
    orderBy: { _count: { listingId: 'desc' } },
    take: 5
  });

  // Get details for top reported listings
  const topReportedDetails = await Promise.all(
    topReportedListings.map(async (group) => {
      const listing = await prisma.listing.findUnique({
        where: { id: group.listingId },
        include: {
          comic: {
            select: {
              title: true,
              series: true,
              issue: true,
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

      return {
        listing,
        reportCount: group._count.listingId
      };
    })
  );

  res.json({
    stats: {
      openReports,
      actionedReports,
      dismissedReports,
      recentReports,
      totalReports: openReports + actionedReports + dismissedReports
    },
    reportsByReason: reportsByReason.map(r => ({
      reason: r.reason,
      count: r._count.reason
    })),
    topReportedListings: topReportedDetails.filter(item => item.listing !== null)
  });
}));

// Bulk action on multiple reports
router.post("/bulk-action", asyncHandler(async (req, res) => {
  const BulkActionSchema = z.object({
    reportIds: z.array(z.string()).min(1).max(50),
    action: z.enum(["dismiss", "mark-reviewed"]),
    note: z.string().max(500).optional(),
  });

  const { reportIds, action, note } = BulkActionSchema.parse(req.body);

  // Verify all reports exist and are open
  const reports = await prisma.report.findMany({
    where: { 
      id: { in: reportIds },
      status: "open"
    }
  });

  if (reports.length !== reportIds.length) {
    throw new AppError("Some reports not found or already processed", 400);
  }

  // Perform bulk action
  await prisma.report.updateMany({
    where: { id: { in: reportIds } },
    data: { 
      status: action === "dismiss" ? "dismissed" : "open" // mark-reviewed keeps them open but could add a flag
    }
  });

  req.logger?.info({
    reportIds,
    action,
    adminId: req.user!.id,
    count: reportIds.length
  }, "Bulk action performed on reports");

  res.json({
    success: true,
    action,
    processedCount: reportIds.length,
    message: `${reportIds.length} reports ${action === "dismiss" ? "dismissed" : "marked as reviewed"}`
  });
}));

export default router;