import type { Prisma } from "@prisma/client";
import type { SearchQuery } from "../schemas/search";

export function searchToPrisma(q: SearchQuery) {
  const where: Prisma.ListingWhereInput = {};
  const comicWhere: Prisma.ComicWhereInput = {};

  // Status filter (default to active)
  if (q.status?.length) {
    where.status = { in: q.status };
  } else {
    where.status = "active"; // Default to active listings
  }

  // Price range filter
  if (typeof q.minPrice === "number" || typeof q.maxPrice === "number") {
    where.price = {
      gte: typeof q.minPrice === "number" ? q.minPrice : undefined,
      lte: typeof q.maxPrice === "number" ? q.maxPrice : undefined,
    };
  }

  // Series filter (exact match for any in array)
  if (q.series?.length) {
    comicWhere.series = { in: q.series };
  }

  // Issue filter (convert to string for comparison)
  if (q.issue !== undefined && q.issue !== null && `${q.issue}`.trim() !== "") {
    comicWhere.issue = { equals: String(q.issue) };
  }

  // Grade filter (exact match for any in array)
  if (q.grade?.length) {
    comicWhere.grade = { in: q.grade };
  }

  // Format filter
  if (q.format?.length) {
    comicWhere.format = { in: q.format };
  }

  // Tags filter (array contains ANY of the specified tags)
  if (q.tags?.length) {
    comicWhere.tags = { hasSome: q.tags };
  }

  // Full-text search on title and series (case-insensitive)
  if (q.search?.trim()) {
    const searchTerm = q.search.trim();
    comicWhere.OR = [
      { title: { contains: searchTerm, mode: "insensitive" } },
      { series: { contains: searchTerm, mode: "insensitive" } },
    ];
  }

  // Apply comic filters to listing query
  if (Object.keys(comicWhere).length > 0) {
    where.comic = comicWhere;
  }

  // Sort order
  const orderBy: Prisma.ListingOrderByWithRelationInput[] = [];
  switch (q.sort) {
    case "priceAsc":
      orderBy.push({ price: "asc" });
      break;
    case "priceDesc":
      orderBy.push({ price: "desc" });
      break;
    case "popularity":
      // Note: This requires a views field on listings
      // For now, fallback to createdAt desc
      orderBy.push({ createdAt: "desc" });
      break;
    case "newest":
    default:
      orderBy.push({ createdAt: "desc" });
      break;
  }

  return { where, orderBy };
}

// Helper function to convert URL search params to SearchQuery
export function parseSearchParams(params: Record<string, string | string[] | undefined>): SearchQuery {
  const asArray = <T>(v: T | T[] | undefined): T[] | undefined => {
    if (v === undefined) return undefined;
    return Array.isArray(v) ? v : [v];
  };

  const asNumber = (v: string | undefined): number | undefined => {
    if (!v) return undefined;
    const num = parseFloat(v);
    return isNaN(num) ? undefined : num;
  };

  return {
    search: typeof params.search === "string" ? params.search : undefined,
    series: asArray(params.series) as string[] | undefined,
    issue: typeof params.issue === "string" ? params.issue : undefined,
    grade: asArray(params.grade) as string[] | undefined,
    format: asArray(params.format) as ("slab" | "raw")[] | undefined,
    minPrice: asNumber(typeof params.minPrice === "string" ? params.minPrice : undefined),
    maxPrice: asNumber(typeof params.maxPrice === "string" ? params.maxPrice : undefined),
    tags: asArray(params.tags) as string[] | undefined,
    status: (asArray(params.status) as ("active" | "sold")[] | undefined) ?? ["active"],
    sort: (params.sort as "newest" | "priceAsc" | "priceDesc" | "popularity") ?? "newest",
  };
}
