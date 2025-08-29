'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { 
  Archive, 
  Search, 
  Plus, 
  ShoppingBag, 
  BookOpen,
  Heart,
  Star,
  FileX,
  Inbox,
  Users
} from 'lucide-react'

interface EmptyProps {
  title: string
  description?: string
  icon?: React.ComponentType<{ className?: string }>
  variant?: 'default' | 'search' | 'collection' | 'marketplace' | 'wantlist' | 'orders' | 'reviews' | 'users'
  action?: {
    label: string
    onClick: () => void
    variant?: 'default' | 'outline' | 'secondary'
  }
  secondaryAction?: {
    label: string
    onClick: () => void
    variant?: 'outline' | 'ghost' | 'link'
  }
  children?: React.ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const VARIANT_CONFIGS = {
  default: {
    icon: Archive,
    iconColor: 'text-muted-foreground',
    bgGradient: 'from-muted/20 to-muted/10',
  },
  search: {
    icon: Search,
    iconColor: 'text-blue-500',
    bgGradient: 'from-blue-50 to-blue-25',
  },
  collection: {
    icon: BookOpen,
    iconColor: 'text-green-500',
    bgGradient: 'from-green-50 to-green-25',
  },
  marketplace: {
    icon: ShoppingBag,
    iconColor: 'text-orange-500',
    bgGradient: 'from-orange-50 to-orange-25',
  },
  wantlist: {
    icon: Heart,
    iconColor: 'text-pink-500',
    bgGradient: 'from-pink-50 to-pink-25',
  },
  orders: {
    icon: Inbox,
    iconColor: 'text-purple-500',
    bgGradient: 'from-purple-50 to-purple-25',
  },
  reviews: {
    icon: Star,
    iconColor: 'text-yellow-500',
    bgGradient: 'from-yellow-50 to-yellow-25',
  },
  users: {
    icon: Users,
    iconColor: 'text-indigo-500',
    bgGradient: 'from-indigo-50 to-indigo-25',
  },
} as const

const SIZE_CONFIGS = {
  sm: {
    container: 'py-8 px-4',
    iconSize: 'h-12 w-12',
    titleSize: 'text-lg',
    descriptionSize: 'text-sm',
    spacing: 'space-y-3',
  },
  md: {
    container: 'py-12 px-6',
    iconSize: 'h-16 w-16',
    titleSize: 'text-xl',
    descriptionSize: 'text-base',
    spacing: 'space-y-4',
  },
  lg: {
    container: 'py-16 px-8',
    iconSize: 'h-20 w-20',
    titleSize: 'text-2xl',
    descriptionSize: 'text-lg',
    spacing: 'space-y-6',
  },
} as const

export function Empty({
  title,
  description,
  icon: CustomIcon,
  variant = 'default',
  action,
  secondaryAction,
  children,
  className,
  size = 'md',
}: EmptyProps) {
  const config = VARIANT_CONFIGS[variant]
  const sizeConfig = SIZE_CONFIGS[size]
  const Icon = CustomIcon || config.icon

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center rounded-lg border border-dashed border-border bg-gradient-to-br',
        config.bgGradient,
        sizeConfig.container,
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className={cn('flex flex-col items-center', sizeConfig.spacing)}>
        {/* Icon */}
        <div
          className={cn(
            'flex items-center justify-center rounded-full bg-background/80 backdrop-blur-sm',
            sizeConfig.iconSize === 'h-12 w-12' ? 'p-3' : sizeConfig.iconSize === 'h-16 w-16' ? 'p-4' : 'p-5'
          )}
        >
          <Icon 
            className={cn(sizeConfig.iconSize, config.iconColor)}
            aria-hidden="true"
          />
        </div>

        {/* Text content */}
        <div className="space-y-2 max-w-md">
          <h3 className={cn('font-semibold text-foreground', sizeConfig.titleSize)}>
            {title}
          </h3>
          {description && (
            <p className={cn('text-muted-foreground leading-relaxed', sizeConfig.descriptionSize)}>
              {description}
            </p>
          )}
        </div>

        {/* Custom children content */}
        {children && (
          <div className="mt-4">
            {children}
          </div>
        )}

        {/* Actions */}
        {(action || secondaryAction) && (
          <div className="flex flex-col sm:flex-row items-center gap-3 mt-2">
            {action && (
              <Button
                onClick={action.onClick}
                variant={action.variant || 'default'}
                size={size === 'sm' ? 'sm' : 'default'}
                className="min-w-[120px]"
              >
                {action.label}
              </Button>
            )}
            {secondaryAction && (
              <Button
                onClick={secondaryAction.onClick}
                variant={secondaryAction.variant || 'outline'}
                size={size === 'sm' ? 'sm' : 'default'}
              >
                {secondaryAction.label}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Specialized empty state components
export function SearchEmpty({
  query,
  ...props
}: Omit<EmptyProps, 'variant' | 'title' | 'description'> & { query?: string }) {
  return (
    <Empty
      variant="search"
      title={query ? `No results for "${query}"` : 'No search results'}
      description={
        query
          ? 'Try adjusting your search terms or filters to find what you\'re looking for.'
          : 'Start searching to find comics, collections, and more.'
      }
      action={{
        label: 'Clear filters',
        onClick: () => window.location.reload(),
        variant: 'outline',
      }}
      {...props}
    />
  )
}

export function CollectionEmpty(props: Omit<EmptyProps, 'variant' | 'title' | 'description'>) {
  return (
    <Empty
      variant="collection"
      title="Your collection is empty"
      description="Start building your comic collection by adding your first comic book."
      action={{
        label: 'Add Comic',
        onClick: () => console.log('Add comic clicked'),
        variant: 'default',
      }}
      secondaryAction={{
        label: 'Browse Marketplace',
        onClick: () => console.log('Browse marketplace clicked'),
        variant: 'outline',
      }}
      {...props}
    />
  )
}

export function MarketplaceEmpty(props: Omit<EmptyProps, 'variant' | 'title' | 'description'>) {
  return (
    <Empty
      variant="marketplace"
      title="No listings available"
      description="There are currently no comics available for sale. Check back later or create your own listing."
      action={{
        label: 'Create Listing',
        onClick: () => console.log('Create listing clicked'),
        variant: 'default',
      }}
      {...props}
    />
  )
}

export function WantlistEmpty(props: Omit<EmptyProps, 'variant' | 'title' | 'description'>) {
  return (
    <Empty
      variant="wantlist"
      title="Your wantlist is empty"
      description="Add comics to your wantlist to keep track of what you're looking for."
      action={{
        label: 'Add to Wantlist',
        onClick: () => console.log('Add to wantlist clicked'),
        variant: 'default',
      }}
      secondaryAction={{
        label: 'Browse Comics',
        onClick: () => console.log('Browse comics clicked'),
        variant: 'outline',
      }}
      {...props}
    />
  )
}

export function OrdersEmpty(props: Omit<EmptyProps, 'variant' | 'title' | 'description'>) {
  return (
    <Empty
      variant="orders"
      title="No orders yet"
      description="Your purchase history will appear here once you make your first order."
      action={{
        label: 'Browse Marketplace',
        onClick: () => console.log('Browse marketplace clicked'),
        variant: 'default',
      }}
      {...props}
    />
  )
}

export function ReviewsEmpty(props: Omit<EmptyProps, 'variant' | 'title' | 'description'>) {
  return (
    <Empty
      variant="reviews"
      title="No reviews yet"
      description="Reviews from buyers and sellers will appear here."
      {...props}
    />
  )
}

// Error state variant
export function ErrorEmpty({
  error,
  onRetry,
  ...props
}: Omit<EmptyProps, 'variant' | 'title' | 'description' | 'icon'> & {
  error?: string
  onRetry?: () => void
}) {
  return (
    <Empty
      icon={FileX}
      title="Something went wrong"
      description={error || 'An unexpected error occurred. Please try again.'}
      action={
        onRetry
          ? {
              label: 'Try Again',
              onClick: onRetry,
              variant: 'default',
            }
          : undefined
      }
      {...props}
    />
  )
}