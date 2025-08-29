import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { ComicQuerySchema, ComicParamsSchema } from '../types/validation';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { conditionalGet } from '../middleware/cache';

const router = Router();
const prisma = new PrismaClient();

// GET /api/comics - List comics with filtering and pagination
router.get('/', conditionalGet, asyncHandler(async (req: any, res: any) => {
  const query = ComicQuerySchema.parse(req.query);
  const page = query.page || 1;
  const limit = query.limit || 20;
  const skip = (page - 1) * limit;

  // Build where clause for filtering
  const where: any = {};
  
  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: 'insensitive' } },
      { series: { contains: query.search, mode: 'insensitive' } },
    ];
  }
  
  if (query.series) {
    where.series = { contains: query.series, mode: 'insensitive' };
  }
  
  if (query.issue) {
    where.issue = { contains: query.issue, mode: 'insensitive' };
  }
  
  if (query.grade) {
    where.grade = { contains: query.grade, mode: 'insensitive' };
  }
  
  if (query.format) {
    where.format = query.format;
  }
  
  if (query.minPrice || query.maxPrice) {
    where.price = {};
    if (query.minPrice) where.price.gte = query.minPrice;
    if (query.maxPrice) where.price.lte = query.maxPrice;
  }

  try {
    // Get total count for pagination
    const total = await prisma.comic.count({ where });
    
    // Get comics with listings for market data
    const comics = await prisma.comic.findMany({
      where,
      select: {
        id: true,
        title: true,
        series: true,
        issue: true,
        grade: true,
        format: true,
        price: true,
        coverUrl: true,
        tags: true,
        createdAt: true,
        updatedAt: true,
        listings: {
          where: { status: 'active' },
          select: {
            id: true,
            price: true,
            seller: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { price: 'asc' },
          take: 1, // Get cheapest active listing
        },
      },
      orderBy: [
        { createdAt: 'desc' },
        { title: 'asc' },
      ],
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    req.logger.info({ 
      total, 
      page, 
      limit, 
      filters: query 
    }, 'Comics retrieved');

    const lastModified = comics.length > 0 ? comics[0].updatedAt : new Date();

    res.sendCached({
      comics,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    }, lastModified);
  } catch (error) {
    req.logger.error({ error }, 'Failed to retrieve comics');
    throw new AppError('Failed to retrieve comics', 500);
  }
}));

// GET /api/comics/:id - Get single comic with full details
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = ComicParamsSchema.parse(req.params);

  try {
    const comic = await prisma.comic.findUnique({
      where: { id },
      include: {
        listings: {
          where: { status: 'active' },
          include: {
            seller: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { price: 'asc' },
        },
        collectionItems: {
          select: {
            id: true,
            notes: true,
            acquiredAt: true,
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!comic) {
      throw new AppError('Comic not found', 404);
    }

    req.logger.info({ comicId: id }, 'Comic retrieved');

    res.json({
      comic,
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    req.logger.error({ error, comicId: id }, 'Failed to retrieve comic');
    throw new AppError('Failed to retrieve comic', 500);
  }
}));

export default router;
