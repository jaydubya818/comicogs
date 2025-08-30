import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div 
      className={cn(
        "animate-pulse rounded-md bg-muted",
        className
      )} 
    />
  )
}

interface SkeletonGridProps {
  count?: number
  variant?: 'card' | 'list' | 'table' | 'comic'
  className?: string
}

export function SkeletonGrid({ 
  count = 6, 
  variant = 'card',
  className 
}: SkeletonGridProps) {
  const skeletons = Array.from({ length: count }, (_, i) => i)

  if (variant === 'list') {
    return (
      <div className={cn("space-y-3", className)}>
        {skeletons.map((i) => (
          <div key={i} className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (variant === 'table') {
    return (
      <div className={cn("space-y-3", className)}>
        {skeletons.map((i) => (
          <div key={i} className="flex items-center space-x-4">
            <Skeleton className="h-6 w-6" />
            <Skeleton className="h-6 flex-1" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-16" />
          </div>
        ))}
      </div>
    )
  }

  if (variant === 'comic') {
    return (
      <div className={cn(
        "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4",
        className
      )}>
        {skeletons.map((i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="aspect-[2/3] w-full rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Default card variant
  return (
    <div className={cn(
      "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
      className
    )}>
      {skeletons.map((i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-48 w-full rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  )
}