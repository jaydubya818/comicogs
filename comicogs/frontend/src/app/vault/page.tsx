"use client";

export const dynamic = 'force-dynamic'

import { Suspense, lazy, useState } from "react";

// Lazy load heavy components
const VaultTable = lazy(() => import("@/components/vault/VaultTable"));
const VaultFilters = lazy(() => import("@/components/vault/VaultFilters"));

// Loading components
function TableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-12 bg-muted rounded animate-pulse" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-16 bg-muted rounded animate-pulse" />
      ))}
    </div>
  );
}

function FiltersSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-10 bg-muted rounded animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-10 bg-muted rounded animate-pulse" />
        ))}
      </div>
    </div>
  );
}

export default function VaultPage() {
  const [filters, setFilters] = useState({
    search: "",
    publisher: "",
    grade: "",
    priceRange: "",
    viewMode: "grid",
    density: "comfortable",
  });

  const handleFiltersChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  return (
    <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-foreground">My Comic Vault</h1>
          <p className="text-muted-foreground">
            Manage your comic book collection, track values, and organize your library.
          </p>
        </div>

        {/* Filters */}
        <Suspense fallback={<FiltersSkeleton />}>
          <VaultFilters onFiltersChange={handleFiltersChange} />
        </Suspense>

        {/* Table */}
        <Suspense fallback={<TableSkeleton />}>
          <VaultTable filters={filters} />
        </Suspense>
      </div>
    </main>
  );
}
