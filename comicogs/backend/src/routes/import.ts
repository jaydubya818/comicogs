import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { prisma } from "../lib/prisma";
import { asyncHandler, AppError } from "../middleware/errorHandler";
import Papa from "papaparse";
import { z } from "zod";

const router = Router();

const ImportSchema = z.object({
  csv: z.string().min(1, "CSV content is required"),
  mode: z.enum(["collection", "listings"]).default("collection")
});

// POST /api/import/collection.csv - Import collection from CSV
router.post("/collection.csv", requireAuth, asyncHandler(async (req, res) => {
  try {
    const { csv } = ImportSchema.parse(req.body);
    
    const parseResult = Papa.parse<string[]>(csv.trim(), { 
      skipEmptyLines: true,
      header: false // We'll handle headers manually for better control
    });
    
    if (parseResult.errors.length > 0) {
      return res.status(400).json({ 
        error: "CSV parsing failed",
        details: parseResult.errors 
      });
    }

    const [header, ...rows] = parseResult.data;
    
    if (!header || rows.length === 0) {
      throw new AppError("CSV file is empty or invalid", 400);
    }

    // Map header to indices for flexible column ordering
    const getIndex = (name: string) => {
      const idx = header.findIndex(h => h.toLowerCase().trim() === name.toLowerCase());
      return idx >= 0 ? idx : -1;
    };

    const seriesIdx = getIndex("series");
    const issueIdx = getIndex("issue");
    const titleIdx = getIndex("title");
    const gradeIdx = getIndex("grade");
    const formatIdx = getIndex("format");
    const tagsIdx = getIndex("tags");
    const notesIdx = getIndex("notes");
    const acquiredAtIdx = getIndex("acquiredAt");
    const yearIdx = getIndex("year");
    const coverUrlIdx = getIndex("coverUrl");

    if (seriesIdx === -1 || issueIdx === -1 || titleIdx === -1) {
      throw new AppError("CSV must contain 'series', 'issue', and 'title' columns", 400);
    }

    let created = 0;
    let errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      try {
        // Extract data from row
        const series = row[seriesIdx]?.trim();
        const issue = row[issueIdx]?.trim();
        const title = row[titleIdx]?.trim();
        
        if (!series || !issue || !title) {
          errors.push(`Row ${i + 2}: Missing required fields (series, issue, title)`);
          continue;
        }

        // Parse optional fields
        const grade = gradeIdx >= 0 ? row[gradeIdx]?.trim() || null : null;
        const format = formatIdx >= 0 ? row[formatIdx]?.trim() || null : null;
        const tags = tagsIdx >= 0 
          ? (row[tagsIdx] || "").split("|").map(t => t.trim()).filter(Boolean)
          : [];
        const notes = notesIdx >= 0 ? row[notesIdx]?.trim() || null : null;
        const coverUrl = coverUrlIdx >= 0 ? row[coverUrlIdx]?.trim() || null : null;
        
        // Parse year
        let year: number | null = null;
        if (yearIdx >= 0 && row[yearIdx]?.trim()) {
          const yearStr = row[yearIdx].trim();
          const parsedYear = parseInt(yearStr, 10);
          if (!isNaN(parsedYear) && parsedYear > 1900 && parsedYear <= new Date().getFullYear() + 5) {
            year = parsedYear;
          }
        }

        // Parse acquired date
        let acquiredAt: Date | null = null;
        if (acquiredAtIdx >= 0 && row[acquiredAtIdx]?.trim()) {
          try {
            acquiredAt = new Date(row[acquiredAtIdx].trim());
            if (isNaN(acquiredAt.getTime())) {
              acquiredAt = null;
            }
          } catch {
            acquiredAt = null;
          }
        }

        // Create or find comic
        let comic = await prisma.comic.findFirst({
          where: {
            series: { equals: series, mode: 'insensitive' },
            issue: { equals: issue, mode: 'insensitive' },
            title: { equals: title, mode: 'insensitive' }
          }
        });

        if (!comic) {
          comic = await prisma.comic.create({
            data: {
              series,
              issue,
              title,
              grade,
              format,
              tags,
              year,
              coverUrl
            }
          });
        }

        // Check if user already has this in collection
        const existing = await prisma.collectionItem.findFirst({
          where: {
            userId: req.user!.id,
            comicId: comic.id
          }
        });

        if (!existing) {
          await prisma.collectionItem.create({
            data: {
              userId: req.user!.id,
              comicId: comic.id,
              notes,
              acquiredAt
            }
          });
          created++;
        }

      } catch (error: any) {
        errors.push(`Row ${i + 2}: ${error.message}`);
      }
    }

    req.logger.info({
      userId: req.user!.id,
      totalRows: rows.length,
      created,
      errors: errors.length
    }, 'Collection import completed');

    res.json({ 
      success: true,
      created,
      totalRows: rows.length,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error: any) {
    if (error instanceof AppError) throw error;
    
    req.logger.error({
      error: error.message,
      userId: req.user!.id
    }, 'Collection import failed');
    
    throw new AppError('Import failed', 500);
  }
}));

export default router;
