import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "../middleware/auth";
import { asyncHandler, AppError } from "../middleware/errorHandler";
import { z } from "zod";

const router = Router();
const prisma = new PrismaClient();

const SavedSearchSchema = z.object({
  name: z.string().min(1).max(100),
  queryJson: z.record(z.any()),
  cadence: z.enum(["daily", "weekly"]).default("weekly"),
});

const SavedSearchParamsSchema = z.object({
  id: z.string(),
});

// GET /api/saved-searches - List user's saved searches
router.get("/", requireAuth, asyncHandler(async (req, res) => {
  try {
    const savedSearches = await prisma.savedSearch.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' }
    });

    req.logger.info({
      userId: req.user!.id,
      count: savedSearches.length
    }, 'Saved searches retrieved');

    res.json({
      savedSearches: savedSearches.map(search => ({
        id: search.id,
        name: search.name,
        queryJson: search.queryJson,
        cadence: search.cadence,
        lastRunAt: search.lastRunAt,
        createdAt: search.createdAt
      }))
    });
  } catch (error) {
    req.logger.error({ error, userId: req.user!.id }, 'Failed to retrieve saved searches');
    throw new AppError('Failed to retrieve saved searches', 500);
  }
}));

// POST /api/saved-searches - Create a new saved search
router.post("/", requireAuth, asyncHandler(async (req, res) => {
  const data = SavedSearchSchema.parse(req.body);

  try {
    // Check if user already has a search with this name
    const existing = await prisma.savedSearch.findFirst({
      where: {
        userId: req.user!.id,
        name: data.name
      }
    });

    if (existing) {
      throw new AppError('You already have a saved search with this name', 409);
    }

    // Create the saved search
    const savedSearch = await prisma.savedSearch.create({
      data: {
        ...data,
        userId: req.user!.id
      }
    });

    req.logger.info({
      savedSearchId: savedSearch.id,
      userId: req.user!.id,
      name: data.name,
      cadence: data.cadence
    }, 'Saved search created');

    res.status(201).json({
      savedSearch: {
        id: savedSearch.id,
        name: savedSearch.name,
        queryJson: savedSearch.queryJson,
        cadence: savedSearch.cadence,
        lastRunAt: savedSearch.lastRunAt,
        createdAt: savedSearch.createdAt
      }
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    req.logger.error({ error, userId: req.user!.id, data }, 'Failed to create saved search');
    throw new AppError('Failed to create saved search', 500);
  }
}));

// PUT /api/saved-searches/:id - Update a saved search
router.put("/:id", requireAuth, asyncHandler(async (req, res) => {
  const { id } = SavedSearchParamsSchema.parse(req.params);
  const data = SavedSearchSchema.parse(req.body);

  try {
    // Check ownership
    const existing = await prisma.savedSearch.findUnique({
      where: { id }
    });

    if (!existing) {
      throw new AppError('Saved search not found', 404);
    }

    if (existing.userId !== req.user!.id) {
      throw new AppError('Access denied', 403);
    }

    // Check for name conflicts (excluding current search)
    const nameConflict = await prisma.savedSearch.findFirst({
      where: {
        userId: req.user!.id,
        name: data.name,
        id: { not: id }
      }
    });

    if (nameConflict) {
      throw new AppError('You already have a saved search with this name', 409);
    }

    // Update the search
    const updatedSearch = await prisma.savedSearch.update({
      where: { id },
      data
    });

    req.logger.info({
      savedSearchId: id,
      userId: req.user!.id,
      name: data.name
    }, 'Saved search updated');

    res.json({
      savedSearch: {
        id: updatedSearch.id,
        name: updatedSearch.name,
        queryJson: updatedSearch.queryJson,
        cadence: updatedSearch.cadence,
        lastRunAt: updatedSearch.lastRunAt,
        createdAt: updatedSearch.createdAt
      }
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    req.logger.error({ error, userId: req.user!.id, searchId: id }, 'Failed to update saved search');
    throw new AppError('Failed to update saved search', 500);
  }
}));

// DELETE /api/saved-searches/:id - Delete a saved search
router.delete("/:id", requireAuth, asyncHandler(async (req, res) => {
  const { id } = SavedSearchParamsSchema.parse(req.params);

  try {
    // Check ownership
    const existing = await prisma.savedSearch.findUnique({
      where: { id }
    });

    if (!existing) {
      throw new AppError('Saved search not found', 404);
    }

    if (existing.userId !== req.user!.id) {
      throw new AppError('Access denied', 403);
    }

    // Delete the search
    await prisma.savedSearch.delete({
      where: { id }
    });

    req.logger.info({
      savedSearchId: id,
      userId: req.user!.id,
      name: existing.name
    }, 'Saved search deleted');

    res.json({ 
      success: true,
      message: 'Saved search deleted successfully'
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    req.logger.error({ error, userId: req.user!.id, searchId: id }, 'Failed to delete saved search');
    throw new AppError('Failed to delete saved search', 500);
  }
}));

// GET /api/saved-searches/match - Check if current query matches any saved search
router.get("/match", requireAuth, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const allSaved = await prisma.savedSearch.findMany({ where: { userId } });
  
  // Naive match: stringify queryJson and current query, compare normalized keys
  const current = req.query; // from ?search=...&series=... etc
  const normalize = (o: any) => JSON.stringify(o, Object.keys(o).sort());
  
  const match = allSaved.find(s => {
    try {
      return normalize(s.queryJson as any) === normalize(current);
    } catch {
      return false;
    }
  });
  
  res.json(match ?? null);
}));

export default router;
