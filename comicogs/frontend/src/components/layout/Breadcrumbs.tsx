'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BreadcrumbItem {
  label: string
  href: string
  icon?: React.ComponentType<{ className?: string }>
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[]
  className?: string
  showHome?: boolean
}

// Route metadata for generating breadcrumbs
const ROUTE_META: Record<string, { label: string; icon?: React.ComponentType<{ className?: string }> }> = {
  '': { label: 'Home', icon: Home },
  'marketplace': { label: 'Marketplace' },
  'collection': { label: 'Collection' },
  'wantlist': { label: 'Wantlist' },
  'grading': { label: 'Grading' },
  'forum': { label: 'Forum' },
  'profile': { label: 'Profile' },
  'settings': { label: 'Settings' },
  'admin': { label: 'Admin' },
  'comics': { label: 'Comics' },
  'listings': { label: 'Listings' },
  'orders': { label: 'Orders' },
  'dashboard': { label: 'Dashboard' },
  'analytics': { label: 'Analytics' },
  'reports': { label: 'Reports' },
  'users': { label: 'Users' },
  'search': { label: 'Search' },
  'help': { label: 'Help' },
  'support': { label: 'Support' },
  'api': { label: 'API' },
  'docs': { label: 'Documentation' },
  'pricing': { label: 'Pricing' },
  'terms': { label: 'Terms of Service' },
  'privacy': { label: 'Privacy Policy' },
  'contact': { label: 'Contact Us' },
}

function generateBreadcrumbsFromPath(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean)
  const breadcrumbs: BreadcrumbItem[] = []
  
  let currentPath = ''
  
  for (const segment of segments) {
    currentPath += `/${segment}`
    const meta = ROUTE_META[segment]
    
    if (meta) {
      breadcrumbs.push({
        label: meta.label,
        href: currentPath,
        icon: meta.icon,
      })
    } else {
      // Format dynamic segments (like IDs) nicely
      const label = segment
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase())
      
      breadcrumbs.push({
        label,
        href: currentPath,
      })
    }
  }
  
  return breadcrumbs
}

export function Breadcrumbs({ 
  items, 
  className, 
  showHome = true 
}: BreadcrumbsProps) {
  const pathname = usePathname()
  
  // Use provided items or generate from pathname
  const breadcrumbItems = items || generateBreadcrumbsFromPath(pathname)
  
  // Add home breadcrumb if requested and not already present
  const finalItems = showHome && pathname !== '/' && !breadcrumbItems.some(item => item.href === '/') 
    ? [{ label: 'Home', href: '/', icon: Home }, ...breadcrumbItems]
    : breadcrumbItems
  
  if (finalItems.length <= 1) {
    return null
  }
  
  return (
    <nav 
      aria-label="Breadcrumb navigation" 
      className={cn('flex items-center space-x-1 text-sm', className)}
    >
      <ol className="flex items-center space-x-1">
        {finalItems.map((item, index) => {
          const isLast = index === finalItems.length - 1
          const Icon = item.icon
          
          return (
            <li key={item.href} className="flex items-center">
              {/* Separator */}
              {index > 0 && (
                <ChevronRight 
                  className="h-4 w-4 text-muted-foreground mx-2" 
                  aria-hidden="true" 
                />
              )}
              
              {/* Breadcrumb item */}
              {isLast ? (
                <span 
                  className="flex items-center text-foreground font-medium"
                  aria-current="page"
                >
                  {Icon && (
                    <Icon className="h-4 w-4 mr-2" aria-hidden="true" />
                  )}
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="flex items-center text-muted-foreground hover:text-foreground transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm px-1 py-1"
                >
                  {Icon && (
                    <Icon className="h-4 w-4 mr-2" aria-hidden="true" />
                  )}
                  {item.label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

// Structured data breadcrumbs for SEO
export function BreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.label,
      "item": `${process.env.NEXT_PUBLIC_SITE_URL || 'https://comicogs.com'}${item.href}`
    }))
  }
  
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}

// Hook for programmatically setting breadcrumbs
export function useBreadcrumbs() {
  const pathname = usePathname()
  
  const setBreadcrumbs = React.useCallback((items: BreadcrumbItem[]) => {
    // This could be enhanced to work with a breadcrumb context
    // For now, it's a placeholder for future state management
    console.debug('Breadcrumbs set:', items)
  }, [])
  
  const currentBreadcrumbs = React.useMemo(() => 
    generateBreadcrumbsFromPath(pathname), 
    [pathname]
  )
  
  return {
    breadcrumbs: currentBreadcrumbs,
    setBreadcrumbs,
  }
}