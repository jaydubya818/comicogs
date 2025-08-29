import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { WantlistQuerySchema, CreateWantItemSchema, WantItemParamsSchema } from '../types/validation';
import { asyncHandler, AppError } from '../middleware/errorHandler';

const router = Router();
const prisma = new PrismaClient();

// GET /api/wantlist - Get user's want list
router.get('/', asyncHandler(async (req, res) => {
  const query = WantlistQuerySchema.parse(req.query);
  const page = query.page || 1;
  const limit = query.limit || 20;
  const skip = (page - 1) * limit;

  // For demo purposes, we'll use the demo user
  // In a real app, this would come from authentication middleware
  try {
    const demoUser = await prisma.user.findFirst({
      where: { email: 'demo@comicogs.com' },
      select: { id: true },
    });

    if (!demoUser) {
      throw new AppError('User not found', 404);
    }

    // Get total count for pagination
    const total = await prisma.wantItem.count({
      where: { userId: demoUser.id },
    });
    
    // Get want list items
    const wantItems = await prisma.wantItem.findMany({
      where: { userId: demoUser.id },
      orderBy: [
        { id: 'desc' },
        { series: 'asc' },
        { issue: 'asc' },
      ],
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    req.logger.info({ 
      userId: demoUser.id,
      total, 
      page, 
      limit 
    }, 'Want list retrieved');

    res.json({
      wantItems,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    req.logger.error({ error }, 'Failed to retrieve want list');
    throw new AppError('Failed to retrieve want list', 500);
  }
}));

// GET /api/wantlist/:id - Get single want item
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = WantItemParamsSchema.parse(req.params);

  try {
    const wantItem = await prisma.wantItem.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!wantItem) {
      throw new AppError('Want item not found', 404);
    }

    req.logger.info({ wantItemId: id }, 'Want item retrieved');

    res.json({
      wantItem,
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    req.logger.error({ error, wantItemId: id }, 'Failed to retrieve want item');
    throw new AppError('Failed to retrieve want item', 500);
  }
}));

// POST /api/wantlist - Add item to want list
router.post('/', asyncHandler(async (req, res) => {
  const data = CreateWantItemSchema.parse(req.body);
  
  try {
    // Get demo user for testing
    const demoUser = await prisma.user.findFirst({
      where: { email: 'demo@comicogs.com' },
      select: { id: true },
    });

    if (!demoUser) {
      throw new AppError('User not found', 404);
    }

    // Check if this series/issue combination already exists in user's want list
    const existingWantItem = await prisma.wantItem.findFirst({
      where: {
        userId: demoUser.id,
        series: data.series,
        issue: data.issue,
      },
    });

    if (existingWantItem) {
      throw new AppError('This item is already in your want list', 409);
    }

    // Create the want item
    const wantItem = await prisma.wantItem.create({
      data: {
        userId: demoUser.id,
        series: data.series,
        issue: data.issue,
        maxPrice: data.maxPrice,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    req.logger.info({ 
      wantItemId: wantItem.id, 
      series: data.series, 
      issue: data.issue,
      maxPrice: data.maxPrice 
    }, 'Want item created');

    res.status(201).json({
      wantItem,
      message: 'Item added to want list successfully',
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    req.logger.error({ error, data }, 'Failed to create want item');
    throw new AppError('Failed to create want item', 500);
  }
}));

// DELETE /api/wantlist/:id - Remove item from want list
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = WantItemParamsSchema.parse(req.params);

  try {
    // Get demo user for testing
    const demoUser = await prisma.user.findFirst({
      where: { email: 'demo@comicogs.com' },
      select: { id: true },
    });

    if (!demoUser) {
      throw new AppError('User not found', 404);
    }

    // Check if want item exists and belongs to user
    const wantItem = await prisma.wantItem.findFirst({
      where: {
        id,
        userId: demoUser.id,
      },
    });

    if (!wantItem) {
      throw new AppError('Want item not found', 404);
    }

    // Delete the want item
    await prisma.wantItem.delete({
      where: { id },
    });

    req.logger.info({ 
      wantItemId: id, 
      userId: demoUser.id 
    }, 'Want item deleted');

    res.json({
      message: 'Item removed from want list successfully',
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    req.logger.error({ error, wantItemId: id }, 'Failed to delete want item');
    throw new AppError('Failed to delete want item', 500);
  }
}));

// PUT /api/wantlist/:id - Update want item
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = WantItemParamsSchema.parse(req.params);
  const data = CreateWantItemSchema.parse(req.body);

  try {
    // Get demo user for testing
    const demoUser = await prisma.user.findFirst({
      where: { email: 'demo@comicogs.com' },
      select: { id: true },
    });

    if (!demoUser) {
      throw new AppError('User not found', 404);
    }

    // Check if want item exists and belongs to user
    const existingWantItem = await prisma.wantItem.findFirst({
      where: {
        id,
        userId: demoUser.id,
      },
    });

    if (!existingWantItem) {
      throw new AppError('Want item not found', 404);
    }

    // Update the want item
    const wantItem = await prisma.wantItem.update({
      where: { id },
      data: {
        series: data.series,
        issue: data.issue,
        maxPrice: data.maxPrice,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    req.logger.info({ 
      wantItemId: id, 
      series: data.series, 
      issue: data.issue,
      maxPrice: data.maxPrice 
    }, 'Want item updated');

    res.json({
      wantItem,
      message: 'Want item updated successfully',
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    req.logger.error({ error, wantItemId: id, data }, 'Failed to update want item');
    throw new AppError('Failed to update want item', 500);
  }
}));

export default router;
