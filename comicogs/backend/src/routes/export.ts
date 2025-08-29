import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { prisma } from "../lib/prisma";
import { asyncHandler, AppError } from "../middleware/errorHandler";

const router = Router();

// Helper function to safely quote CSV values
function quoteCsv(value: string | null | undefined): string {
  if (value == null) return '""';
  const str = String(value);
  // Escape quotes by doubling them, then wrap in quotes
  return `"${str.replace(/"/g, '""')}"`;
}

// GET /api/export/collection.csv - Export user's collection as CSV
router.get("/collection.csv", requireAuth, asyncHandler(async (req, res) => {
  try {
    const items = await prisma.collectionItem.findMany({
      where: { userId: req.user!.id },
      include: { 
        comic: {
          select: {
            id: true,
            title: true,
            series: true,
            issue: true,
            grade: true,
            format: true,
            tags: true,
            coverUrl: true,
            year: true
          }
        } 
      },
      orderBy: [
        { comic: { series: 'asc' } },
        { comic: { issue: 'asc' } }
      ]
    });

    // CSV header
    const header = [
      "series", "issue", "title", "grade", "format", "tags", 
      "notes", "acquiredAt", "year", "coverUrl"
    ].join(",");

    // CSV rows
    const rows = items.map(item => [
      quoteCsv(item.comic.series),
      quoteCsv(item.comic.issue),
      quoteCsv(item.comic.title),
      quoteCsv(item.comic.grade),
      quoteCsv(item.comic.format),
      quoteCsv((item.comic.tags ?? []).join("|")),
      quoteCsv(item.notes),
      quoteCsv(item.acquiredAt?.toISOString()),
      quoteCsv(item.comic.year?.toString()),
      quoteCsv(item.comic.coverUrl)
    ].join(","));

    const csvContent = [header, ...rows].join("\n");

    req.logger.info({
      userId: req.user!.id,
      itemCount: items.length
    }, 'Collection exported as CSV');

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="comicogs-collection-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvContent);

  } catch (error: any) {
    req.logger.error({
      error: error.message,
      userId: req.user!.id
    }, 'Failed to export collection');
    
    throw new AppError('Failed to export collection', 500);
  }
}));

// GET /api/export/listings.csv - Export user's listings as CSV
router.get("/listings.csv", requireAuth, asyncHandler(async (req, res) => {
  try {
    const listings = await prisma.listing.findMany({
      where: { sellerId: req.user!.id },
      include: { 
        comic: {
          select: {
            id: true,
            title: true,
            series: true,
            issue: true,
            grade: true,
            format: true,
            tags: true,
            coverUrl: true,
            year: true
          }
        } 
      },
      orderBy: [
        { status: 'asc' },
        { comic: { series: 'asc' } },
        { comic: { issue: 'asc' } }
      ]
    });

    // CSV header
    const header = [
      "series", "issue", "title", "grade", "format", "tags", 
      "price", "status", "description", "condition", "year", "coverUrl"
    ].join(",");

    // CSV rows
    const rows = listings.map(listing => [
      quoteCsv(listing.comic.series),
      quoteCsv(listing.comic.issue),
      quoteCsv(listing.comic.title),
      quoteCsv(listing.comic.grade),
      quoteCsv(listing.comic.format),
      quoteCsv((listing.comic.tags ?? []).join("|")),
      quoteCsv(listing.price.toString()),
      quoteCsv(listing.status),
      quoteCsv(listing.description),
      quoteCsv(listing.condition),
      quoteCsv(listing.comic.year?.toString()),
      quoteCsv(listing.comic.coverUrl)
    ].join(","));

    const csvContent = [header, ...rows].join("\n");

    req.logger.info({
      userId: req.user!.id,
      listingCount: listings.length
    }, 'Listings exported as CSV');

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="comicogs-listings-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvContent);

  } catch (error: any) {
    req.logger.error({
      error: error.message,
      userId: req.user!.id
    }, 'Failed to export listings');
    
    throw new AppError('Failed to export listings', 500);
  }
}));

export default router;
