import { z } from "zod";

export const SearchQuerySchema = z.object({
  search: z.string().trim().optional(),
  series: z.array(z.string().min(1)).optional(),
  issue: z.union([z.string(), z.number()]).optional(),
  grade: z.array(z.string()).optional(),
  format: z.array(z.enum(["slab","raw"])).optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  tags: z.array(z.string()).optional(),
  status: z.array(z.enum(["active","sold"])).optional(),
  sort: z.enum(["newest","priceAsc","priceDesc","popularity"]).optional(),
}).strict();

export type SearchQuery = z.infer<typeof SearchQuerySchema>;
