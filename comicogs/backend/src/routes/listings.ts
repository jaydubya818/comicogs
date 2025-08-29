import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { ListingQuerySchema, CreateListingSchema, ListingParamsSchema } from '../types/validation';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { requireAuth, requireRole, requireOwnership, optionalAuth } from '../middleware/auth';
import { SearchQuerySchema } from '../schemas/search';
import { searchToPrisma, parseSearchParams } from '../lib/searchToPrisma';

const router = Router();
const prisma = new PrismaClient();

// GET /api/listings - List active listings with pagination (public endpoint)
router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  const query = ListingQuerySchema.parse(req.query);
  const page = query.page || 1;
  const limit = query.limit || 20;
  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = {};
  if (query.status) {
    where.status = query.status;
  }

  try {
    // Get total count for pagination
    const total = await prisma.listing.count({ where });
    
    // Get listings with comic and seller details
    const listings = await prisma.listing.findMany({
      where,
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
          },
        },
        seller: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { createdAt: 'desc' },
        { price: 'asc' },
      ],
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    req.logger.info({ 
      total, 
      page, 
      limit, 
      status: query.status 
    }, 'Listings retrieved');

    res.json({
      listings,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    req.logger.error({ error }, 'Failed to retrieve listings');
    throw new AppError('Failed to retrieve listings', 500);
  }
}));

// GET /api/listings/:id - Get single listing with full details (public endpoint)
router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
  const { id } = ListingParamsSchema.parse(req.params);

  try {
    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        comic: true,
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        order: {
          select: {
            id: true,
            status: true,
            total: true,
            createdAt: true,
            buyer: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!listing) {
      throw new AppError('Listing not found', 404);
    }

    req.logger.info({ listingId: id }, 'Listing retrieved');

    res.json({
      listing,
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    req.logger.error({ error, listingId: id }, 'Failed to retrieve listing');
    throw new AppError('Failed to retrieve listing', 500);
  }
}));

// POST /api/listings - Create new listing (requires seller or admin role)
router.post('/', requireAuth, requireRole('seller', 'admin'), asyncHandler(async (req, res) => {
  const data = CreateListingSchema.parse(req.body);

  try {
    // Check if comic exists
    const comic = await prisma.comic.findUnique({
      where: { id: data.comicId },
      select: { id: true, title: true, series: true, issue: true },
    });

    if (!comic) {
      throw new AppError('Comic not found', 404);
    }

    // Use authenticated user as seller
    const listing = await prisma.listing.create({
      data: {
        comicId: data.comicId,
        sellerId: req.user!.id, // Use authenticated user
        price: data.price,
        status: 'active',
      },
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
          },
        },
        seller: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    req.logger.info({ 
      listingId: listing.id, 
      comicId: data.comicId, 
      price: data.price,
      sellerId: req.user!.id,
      sellerRole: req.user!.role
    }, 'Listing created');

    res.status(201).json({
      listing,
      message: 'Listing created successfully',
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    req.logger.error({ error, data }, 'Failed to create listing');
    throw new AppError('Failed to create listing', 500);
  }
}));

// PATCH /api/listings/:id - Update listing status (requires seller/admin role + ownership)
router.patch('/:id', requireAuth, requireRole('seller', 'admin'), requireOwnership(async (req) => {
  const { id } = req.params;
  const listing = await prisma.listing.findUnique({
    where: { id },
    select: { sellerId: true }
  });
  return listing?.sellerId || null;
}), asyncHandler(async (req, res) => {
  const { id } = ListingParamsSchema.parse(req.params);
  const { status } = req.body;

  if (!['active', 'sold', 'draft'].includes(status)) {
    throw new AppError('Invalid status. Must be active, sold, or draft', 400);
  }

  try {
    const listing = await prisma.listing.update({
      where: { id },
      data: { status },
      include: {
        comic: {
          select: {
            id: true,
            title: true,
            series: true,
            issue: true,
          },
        },
      },
    });

    req.logger.info({ 
      listingId: id, 
      newStatus: status 
    }, 'Listing status updated');

    res.json({
      listing,
      message: 'Listing updated successfully',
    });
  } catch (error) {
    req.logger.error({ error, listingId: id, status }, 'Failed to update listing');
    throw new AppError('Failed to update listing', 500);
  }
}));

// DELETE /api/listings/:id - Delete listing (admin only)
router.delete('/:id', requireAuth, requireRole('admin'), asyncHandler(async (req, res) => {
  const { id } = ListingParamsSchema.parse(req.params);

  try {
    // Check if listing exists
    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        comic: {
          select: { title: true, series: true, issue: true }
        }
      }
    });

    if (!listing) {
      throw new AppError('Listing not found', 404);
    }

    // Delete the listing
    await prisma.listing.delete({
      where: { id }
    });

    req.logger.info({ 
      listingId: id,
      adminId: req.user!.id,
      deletedListing: {
        comic: listing.comic,
        price: listing.price,
        seller: listing.sellerId
      }
    }, 'Listing deleted by admin');

    res.json({
      message: 'Listing deleted successfully',
      deletedListing: {
        id: listing.id,
        comic: listing.comic,
        price: listing.price
      }
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    req.logger.error({ error, listingId: id, adminId: req.user!.id }, 'Failed to delete listing');
    throw new AppError('Failed to delete listing', 500);
  }
}));

export default router;
