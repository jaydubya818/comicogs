'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-muted shimmer',
        className
      )}
      {...props}
    />
  )
}

interface SkeletonGridProps {
  count?: number
  variant?: 'card' | 'list' | 'table' | 'comic' | 'listing' | 'profile' | 'stats'
  columns?: 1 | 2 | 3 | 4 | 5 | 6
  className?: string
  itemClassName?: string
}

const VARIANT_CONFIGS = {
  card: {
    container: 'grid gap-6',
    defaultColumns: 3,
    item: (
      <div className="space-y-3">
        <Skeleton className="aspect-[3/4] w-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    ),
  },
  list: {
    container: 'space-y-4',
    defaultColumns: 1,
    item: (
      <div className="flex items-center space-x-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <Skeleton className="h-8 w-20" />
      </div>
    ),
  },
  table: {
    container: 'space-y-3',
    defaultColumns: 1,
    item: (
      <div className="flex items-center space-x-4 p-4 border border-border rounded-md">
        <Skeleton className="h-4 w-1/6" />
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/5" />
        <Skeleton className="h-4 w-1/6" />
        <Skeleton className="h-4 w-1/8" />
        <Skeleton className="h-8 w-16" />
      </div>
    ),
  },
  comic: {
    container: 'grid gap-6',
    defaultColumns: 4,
    item: (
      <div className="space-y-3">
        <Skeleton className="aspect-[2/3] w-full rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-3 w-3/4" />
          <div className="flex justify-between">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-4 w-1/4 font-semibold" />
          </div>
        </div>
      </div>
    ),
  },
  listing: {
    container: 'grid gap-4',
    defaultColumns: 2,
    item: (
      <div className="border border-border rounded-lg p-4 space-y-3">
        <div className="flex space-x-4">
          <Skeleton className="h-20 w-16 rounded" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <div className="flex justify-between items-center">
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-5 w-16" />
            </div>
          </div>
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-border">
          <Skeleton className="h-6 w-12 rounded-full" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    ),
  },
  profile: {
    container: 'space-y-6',
    defaultColumns: 1,
    item: (
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex space-x-4">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-18" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center space-y-1">
            <Skeleton className="h-6 w-12 mx-auto" />
            <Skeleton className="h-3 w-16 mx-auto" />
          </div>
          <div className="text-center space-y-1">
            <Skeleton className="h-6 w-12 mx-auto" />
            <Skeleton className="h-3 w-16 mx-auto" />
          </div>
          <div className="text-center space-y-1">
            <Skeleton className="h-6 w-12 mx-auto" />
            <Skeleton className="h-3 w-16 mx-auto" />
          </div>
        </div>
      </div>
    ),
  },
  stats: {
    container: 'grid gap-6',
    defaultColumns: 4,
    item: (
      <div className="border border-border rounded-lg p-6 space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-4 w-4 rounded" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-24" />
        </div>
        <div className="flex items-center space-x-2">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    ),
  },
} as const

export function SkeletonGrid({
  count = 6,
  variant = 'card',
  columns,
  className,
  itemClassName,
}: SkeletonGridProps) {
  const config = VARIANT_CONFIGS[variant]
  const gridColumns = columns || config.defaultColumns
  
  const getGridClasses = () => {
    if (config.defaultColumns === 1) {
      return config.container
    }
    
    const baseClasses = config.container
    const columnClasses = {
      1: 'grid-cols-1',
      2: 'grid-cols-1 sm:grid-cols-2',
      3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
      4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
      5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5',
      6: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6',
    }
    
    return `${baseClasses} ${columnClasses[gridColumns as keyof typeof columnClasses]}`
  }

  return (
    <div 
      className={cn(getGridClasses(), className)}
      role="status"
      aria-label="Loading content..."
    >
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className={cn('animate-pulse', itemClassName)}>
          {config.item}
        </div>
      ))}
    </div>
  )
}

// Specialized skeleton components
export function ComicGridSkeleton({ 
  count = 8, 
  columns = 4,
  ...props 
}: Omit<SkeletonGridProps, 'variant'>) {
  return (
    <SkeletonGrid
      variant="comic"
      count={count}
      columns={columns}
      {...props}
    />
  )
}

export function ListingGridSkeleton({ 
  count = 6, 
  columns = 2,
  ...props 
}: Omit<SkeletonGridProps, 'variant'>) {
  return (
    <SkeletonGrid
      variant="listing"
      count={count}
      columns={columns}
      {...props}
    />
  )
}

export function ListSkeleton({ 
  count = 5,
  ...props 
}: Omit<SkeletonGridProps, 'variant' | 'columns'>) {
  return (
    <SkeletonGrid
      variant="list"
      count={count}
      {...props}
    />
  )
}

export function TableSkeleton({ 
  count = 8,
  ...props 
}: Omit<SkeletonGridProps, 'variant' | 'columns'>) {
  return (
    <SkeletonGrid
      variant="table"
      count={count}
      {...props}
    />
  )
}

export function StatsSkeleton({ 
  count = 4,
  columns = 4,
  ...props 
}: Omit<SkeletonGridProps, 'variant'>) {
  return (
    <SkeletonGrid
      variant="stats"
      count={count}
      columns={columns}
      {...props}
    />
  )
}

export function ProfileSkeleton(props: Omit<SkeletonGridProps, 'variant' | 'count' | 'columns'>) {
  return (
    <SkeletonGrid
      variant="profile"
      count={1}
      {...props}
    />
  )
}

// Loading states for specific pages
export function MarketplaceLoadingSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      
      {/* Filters skeleton */}
      <div className="flex space-x-4 pb-4 border-b border-border">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-28" />
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-20" />
      </div>
      
      {/* Results skeleton */}
      <ComicGridSkeleton count={12} />
    </div>
  )
}

export function CollectionLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats skeleton */}
      <StatsSkeleton count={3} columns={3} />
      
      {/* Collection grid skeleton */}
      <ComicGridSkeleton count={16} />
    </div>
  )
}

export function DashboardLoadingSkeleton() {
  return (
    <div className="space-y-8">
      {/* Welcome section */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      
      {/* Stats overview */}
      <StatsSkeleton count={4} />
      
      {/* Recent activity */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-1/4" />
        <ListSkeleton count={5} />
      </div>
      
      {/* Quick actions */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-1/5" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-24 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  )
}