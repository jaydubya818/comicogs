import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "../middleware/auth";
import { asyncHandler, AppError } from "../middleware/errorHandler";
import { z } from "zod";

const router = Router();
const prisma = new PrismaClient();

const CreateReportSchema = z.object({
  listingId: z.string(),
  reason: z.enum(["spam", "counterfeit", "offensive", "inappropriate", "copyright", "other"]),
  note: z.string().max(500).optional(),
});

// Create a new report (any authenticated user)
router.post("/", requireAuth, asyncHandler(async (req, res) => {
  const { listingId, reason, note } = CreateReportSchema.parse(req.body);
  
  // Check if listing exists and is not already reported by this user
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { id: true, status: true, sellerId: true }
  });

  if (!listing) {
    throw new AppError("Listing not found", 404);
  }

  if (listing.sellerId === req.user!.id) {
    throw new AppError("Cannot report your own listing", 400);
  }

  // Check for duplicate report from same user
  const existingReport = await prisma.report.findFirst({
    where: {
      listingId,
      reporterId: req.user!.id,
      status: { not: "dismissed" } // Allow new reports if previous ones were dismissed
    }
  });

  if (existingReport) {
    throw new AppError("You have already reported this listing", 400);
  }

  // Create the report
  const report = await prisma.report.create({
    data: {
      listingId,
      reporterId: req.user!.id,
      reason,
      note: note || null,
    },
    include: {
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

  req.logger?.info({
    reportId: report.id,
    listingId,
    reporterId: req.user!.id,
    reason,
  }, "New report created");

  // TODO: Send notification to admin team
  // This could be a Slack/Discord webhook, email, or internal notification

  res.status(201).json({
    report: {
      id: report.id,
      reason: report.reason,
      note: report.note,
      status: report.status,
      createdAt: report.createdAt,
    }
  });
}));

// Get user's own reports
router.get("/my-reports", requireAuth, asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
  const offset = (page - 1) * limit;

  const [reports, total] = await Promise.all([
    prisma.report.findMany({
      where: { reporterId: req.user!.id },
      skip: offset,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        listing: {
          include: {
            comic: {
              select: {
                title: true,
                series: true,
                issue: true,
                coverUrl: true,
              }
            }
          }
        }
      }
    }),
    prisma.report.count({ where: { reporterId: req.user!.id } })
  ]);

  res.json({
    reports,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

// Get specific report details (only reporter can see their own report)
router.get("/:id", requireAuth, asyncHandler(async (req, res) => {
  const report = await prisma.report.findUnique({
    where: { id: req.params.id },
    include: {
      listing: {
        include: {
          comic: true,
          seller: {
            select: {
              id: true,
              name: true,
            }
          }
        }
      }
    }
  });

  if (!report) {
    throw new AppError("Report not found", 404);
  }

  // Only the reporter or admin can view report details
  if (report.reporterId !== req.user!.id && req.user!.role !== "admin") {
    throw new AppError("Access denied", 403);
  }

  res.json({ report });
}));

export default router;