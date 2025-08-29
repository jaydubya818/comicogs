"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Filter, Columns, Grid, List } from "lucide-react";
import { Button } from "@/components/ui/button";

// Custom hook for debounced values
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

interface VaultFiltersProps {
  onFiltersChange?: (filters: {
    search: string;
    publisher: string;
    grade: string;
    priceRange: string;
    viewMode: string;
    density: string;
  }) => void;
}

export default function VaultFilters({ onFiltersChange }: VaultFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Initialize state from URL params
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [selectedPublisher, setSelectedPublisher] = useState(searchParams.get("publisher") || "");
  const [selectedGrade, setSelectedGrade] = useState(searchParams.get("grade") || "");
  const [priceRange, setPriceRange] = useState(searchParams.get("priceRange") || "");
  const [viewMode, setViewMode] = useState(searchParams.get("view") || "grid");
  const [density, setDensity] = useState(() => {
    // Try to get from localStorage first, then URL params
    if (typeof window !== "undefined") {
      return localStorage.getItem("vault-density") || searchParams.get("density") || "comfortable";
    }
    return "comfortable";
  });

  // Debounce search query
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const publishers = ["All Publishers", "Marvel Comics", "DC Comics", "Image Comics", "Dark Horse"];
  const grades = ["All Grades", "10.0", "9.8", "9.6", "9.4", "9.2", "9.0", "8.5", "8.0"];
  const priceRanges = ["All Prices", "$0 - $100", "$100 - $500", "$500 - $1000", "$1000+"];

  // Update URL when filters change
  const updateURL = useCallback((newFilters: Record<string, string>) => {
    const params = new URLSearchParams();
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value && value !== "All Publishers" && value !== "All Grades" && value !== "All Prices") {
        params.set(key, value);
      }
    });

    const newURL = params.toString() ? `/vault?${params.toString()}` : "/vault";
    router.replace(newURL, { scroll: false });
  }, [router]);

  // Update localStorage for density
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("vault-density", density);
    }
  }, [density]);

  // Sync filters with URL and parent component
  useEffect(() => {
    const filters = {
      search: debouncedSearchQuery,
      publisher: selectedPublisher,
      grade: selectedGrade,
      priceRange,
      viewMode,
      density,
    };

    // Update URL
    updateURL({
      search: debouncedSearchQuery,
      publisher: selectedPublisher === "All Publishers" ? "" : selectedPublisher,
      grade: selectedGrade === "All Grades" ? "" : selectedGrade,
      priceRange: priceRange === "All Prices" ? "" : priceRange,
      view: viewMode,
      density,
    });

    // Notify parent component
    onFiltersChange?.(filters);
  }, [debouncedSearchQuery, selectedPublisher, selectedGrade, priceRange, viewMode, density, updateURL, onFiltersChange]);

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedPublisher("");
    setSelectedGrade("");
    setPriceRange("");
    setViewMode("grid");
    setDensity("comfortable");
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-muted-foreground" />
        </div>
        <input
          type="search"
          placeholder="Search your collection..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="block w-full pl-10 pr-3 py-3 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      {/* View Controls Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* View Mode Toggle */}
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-foreground">View:</span>
            <div className="flex bg-muted rounded-md p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded text-sm transition-colors ${
                  viewMode === "grid"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                aria-label="Grid view"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded text-sm transition-colors ${
                  viewMode === "list"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                aria-label="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Density Control */}
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-foreground">Density:</span>
            <select
              value={density}
              onChange={(e) => setDensity(e.target.value)}
              className="text-sm px-2 py-1 border border-border rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="compact">Compact</option>
              <option value="comfortable">Comfortable</option>
              <option value="spacious">Spacious</option>
            </select>
          </div>
        </div>

        {/* Column visibility control (placeholder for future) */}
        <Button variant="outline" size="sm" className="flex items-center space-x-1">
          <Columns className="w-4 h-4" />
          <span>Columns</span>
        </Button>
      </div>

      {/* Filter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Publisher Filter */}
        <div>
          <label htmlFor="publisher" className="block text-sm font-medium text-foreground mb-2">
            Publisher
          </label>
          <select
            id="publisher"
            value={selectedPublisher}
            onChange={(e) => setSelectedPublisher(e.target.value)}
            className="block w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            {publishers.map((publisher) => (
              <option key={publisher} value={publisher}>
                {publisher}
              </option>
            ))}
          </select>
        </div>

        {/* Grade Filter */}
        <div>
          <label htmlFor="grade" className="block text-sm font-medium text-foreground mb-2">
            Grade
          </label>
          <select
            id="grade"
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
            className="block w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            {grades.map((grade) => (
              <option key={grade} value={grade}>
                {grade}
              </option>
            ))}
          </select>
        </div>

        {/* Price Range Filter */}
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-foreground mb-2">
            Price Range
          </label>
          <select
            id="price"
            value={priceRange}
            onChange={(e) => setPriceRange(e.target.value)}
            className="block w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            {priceRanges.map((range) => (
              <option key={range} value={range}>
                {range}
              </option>
            ))}
          </select>
        </div>

        {/* Actions */}
        <div className="flex items-end space-x-2">
          <Button variant="outline" size="sm" className="flex items-center space-x-1">
            <Filter className="w-4 h-4" />
            <span>More Filters</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={clearAllFilters}
          >
            Clear All
          </Button>
        </div>
      </div>

      {/* Active Filters */}
      {(searchQuery || selectedPublisher || selectedGrade || priceRange) && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          
          {searchQuery && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
              Search: "{searchQuery}"
              <button
                onClick={() => setSearchQuery("")}
                className="ml-1 hover:text-primary/80"
              >
                ×
              </button>
            </span>
          )}
          
          {selectedPublisher && selectedPublisher !== "All Publishers" && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-secondary/10 text-secondary">
              {selectedPublisher}
              <button
                onClick={() => setSelectedPublisher("")}
                className="ml-1 hover:text-secondary/80"
              >
                ×
              </button>
            </span>
          )}
          
          {selectedGrade && selectedGrade !== "All Grades" && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-accent/10 text-accent">
              Grade: {selectedGrade}
              <button
                onClick={() => setSelectedGrade("")}
                className="ml-1 hover:text-accent/80"
              >
                ×
              </button>
            </span>
          )}
          
          {priceRange && priceRange !== "All Prices" && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-muted-foreground/10 text-muted-foreground">
              {priceRange}
              <button
                onClick={() => setPriceRange("")}
                className="ml-1 hover:text-muted-foreground/80"
              >
                ×
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
