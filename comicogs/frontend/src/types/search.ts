export type SearchSort = "newest" | "priceAsc" | "priceDesc" | "popularity";

export type SearchQuery = {
  search?: string;            // full-text on title/series
  series?: string[];
  issue?: string | number;
  grade?: string[];           // e.g., ["CGC 9.8","Raw"]
  format?: ("slab" | "raw")[];
  minPrice?: number;
  maxPrice?: number;
  tags?: string[];            // ["key-issue","silver-age"]
  status?: ("active"|"sold")[]; // usually ["active"]
  sort?: SearchSort;
};
