import { z } from 'zod';

// Comics validation schemas
export const ComicQuerySchema = z.object({
  search: z.string().optional(),
  series: z.string().optional(),
  issue: z.string().optional(),
  grade: z.string().optional(),
  format: z.enum(['slab', 'raw']).optional(),
  minPrice: z.string().transform(val => val ? parseFloat(val) : undefined).optional(),
  maxPrice: z.string().transform(val => val ? parseFloat(val) : undefined).optional(),
  page: z.string().transform(val => parseInt(val) || 1).optional(),
  limit: z.string().transform(val => {
    const num = parseInt(val) || 20;
    return Math.min(num, 100); // Max 100 items per page
  }).optional(),
});

export const ComicParamsSchema = z.object({
  id: z.string().cuid(),
});

// Listings validation schemas
export const ListingQuerySchema = z.object({
  status: z.enum(['active', 'sold', 'draft']).optional(),
  page: z.string().transform(val => parseInt(val) || 1).optional(),
  limit: z.string().transform(val => {
    const num = parseInt(val) || 20;
    return Math.min(num, 100);
  }).optional(),
});

export const CreateListingSchema = z.object({
  comicId: z.string().cuid(),
  price: z.number().positive().max(1000000), // Max $1M
});

export const ListingParamsSchema = z.object({
  id: z.string().cuid(),
});

// Wantlist validation schemas
export const WantlistQuerySchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1).optional(),
  limit: z.string().transform(val => {
    const num = parseInt(val) || 20;
    return Math.min(num, 100);
  }).optional(),
});

export const CreateWantItemSchema = z.object({
  series: z.string().min(1).max(255),
  issue: z.string().min(1).max(50),
  maxPrice: z.number().positive().max(1000000).optional(),
});

export const WantItemParamsSchema = z.object({
  id: z.string().cuid(),
});

// General response schemas
export const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
  requestId: z.string().optional(),
});

export const PaginationSchema = z.object({
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
});

// Export types
export type ComicQuery = z.infer<typeof ComicQuerySchema>;
export type ComicParams = z.infer<typeof ComicParamsSchema>;
export type ListingQuery = z.infer<typeof ListingQuerySchema>;
export type CreateListing = z.infer<typeof CreateListingSchema>;
export type ListingParams = z.infer<typeof ListingParamsSchema>;
export type WantlistQuery = z.infer<typeof WantlistQuerySchema>;
export type CreateWantItem = z.infer<typeof CreateWantItemSchema>;
export type WantItemParams = z.infer<typeof WantItemParamsSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type Pagination = z.infer<typeof PaginationSchema>;
