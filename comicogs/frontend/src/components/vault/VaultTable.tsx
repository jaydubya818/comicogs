"use client";

import { useState, useMemo } from "react";
import { ListingCard } from "@/components/ui/patterns";

// Mock data for the vault
const mockComics = [
  {
    id: "1",
    title: "Amazing Spider-Man",
    issue: "#1",
    series: "Amazing Spider-Man",
    publisher: "Marvel Comics",
    grade: "9.8",
    price: 2500,
    coverImage: "",
    condition: "Near Mint",
    viewCount: 245,
  },
  {
    id: "2", 
    title: "X-Men",
    issue: "#1",
    series: "X-Men",
    publisher: "Marvel Comics", 
    grade: "9.0",
    price: 1800,
    originalPrice: 2200,
    coverImage: "",
    condition: "Very Fine",
    viewCount: 189,
  },
  {
    id: "3",
    title: "Batman",
    issue: "#1",
    series: "Batman",
    publisher: "DC Comics",
    grade: "8.5",
    price: 3200,
    coverImage: "",
    condition: "Very Fine",
    viewCount: 312,
  },
];

interface VaultTableProps {
  filters?: {
    search: string;
    publisher: string;
    grade: string;
    priceRange: string;
    viewMode: string;
    density: string;
  };
}

export default function VaultTable({ filters }: VaultTableProps) {
  const [comics] = useState(mockComics);

  // Filter comics based on active filters
  const filteredComics = useMemo(() => {
    if (!filters) return comics;

    return comics.filter((comic) => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          comic.title.toLowerCase().includes(searchLower) ||
          comic.series.toLowerCase().includes(searchLower) ||
          comic.publisher.toLowerCase().includes(searchLower) ||
          comic.issue.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
      }

      // Publisher filter
      if (filters.publisher && filters.publisher !== "All Publishers") {
        if (comic.publisher !== filters.publisher) return false;
      }

      // Grade filter
      if (filters.grade && filters.grade !== "All Grades") {
        if (comic.grade !== filters.grade) return false;
      }

      // Price range filter
      if (filters.priceRange && filters.priceRange !== "All Prices") {
        const price = comic.price;
        switch (filters.priceRange) {
          case "$0 - $100":
            if (price > 100) return false;
            break;
          case "$100 - $500":
            if (price < 100 || price > 500) return false;
            break;
          case "$500 - $1000":
            if (price < 500 || price > 1000) return false;
            break;
          case "$1000+":
            if (price < 1000) return false;
            break;
        }
      }

      return true;
    });
  }, [comics, filters]);

  // Get grid classes based on view mode and density
  const getGridClasses = () => {
    if (filters?.viewMode === "list") {
      return "grid grid-cols-1 gap-4";
    }

    const densityClasses = {
      compact: "gap-3",
      comfortable: "gap-6", 
      spacious: "gap-8",
    };

    const gap = densityClasses[filters?.density as keyof typeof densityClasses] || "gap-6";
    
    return `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${gap}`;
  };

  // Get card classes based on density
  const getCardClasses = () => {
    if (filters?.density === "compact") return "scale-90";
    if (filters?.density === "spacious") return "scale-105";
    return "";
  };

  return (
    <div className="space-y-6">
      {/* Sticky Header */}
      <div className="sticky top-16 bg-background/95 backdrop-blur-md border-b border-border py-4 z-40">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold">
              Collection ({filteredComics.length}
              {filteredComics.length !== comics.length && ` of ${comics.length}`})
            </h2>
            <div className="text-sm text-muted-foreground">
              Total Value: ${filteredComics.reduce((sum, comic) => sum + comic.price, 0).toLocaleString()}
            </div>
          </div>
          
          {filters?.search && (
            <div className="text-sm text-muted-foreground">
              Showing results for "{filters.search}"
            </div>
          )}
        </div>
      </div>

      {/* Comics Grid */}
      <div className={getGridClasses()}>
        {filteredComics.map((comic) => (
          <ListingCard
            key={comic.id}
            id={comic.id}
            title={comic.title}
            issue={comic.issue}
            series={comic.series}
            publisher={comic.publisher}
            grade={comic.grade}
            price={comic.price}
            originalPrice={comic.originalPrice}
            coverImage={comic.coverImage}
            condition={comic.condition}
            viewCount={comic.viewCount}
            sellerName="My Collection"
            className={getCardClasses()}
            onView={() => console.log(`Viewing comic ${comic.id}`)}
            onAddToCart={() => console.log(`Adding comic ${comic.id} to cart`)}
            onToggleWishlist={() => console.log(`Toggling wishlist for comic ${comic.id}`)}
          />
        ))}
      </div>

      {/* Empty State */}
      {filteredComics.length === 0 && filters?.search && (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            <svg className="mx-auto h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">No comics found</h3>
          <p className="text-muted-foreground mb-6">
            No comics match your current search and filter criteria.
          </p>
          <button 
            onClick={() => window.location.href = '/vault'}
            className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Original Empty State */}
      {comics.length === 0 && (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            <svg className="mx-auto h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">No comics in your vault</h3>
          <p className="text-muted-foreground mb-6">Start building your collection by adding comics.</p>
          <button className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
            Add Your First Comic
          </button>
        </div>
      )}
    </div>
  );
}
