'use client'

import { ReactNode, forwardRef, HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

// Skip link component for keyboard navigation
interface SkipLinkProps extends HTMLAttributes<HTMLAnchorElement> {
  href: string
  children: ReactNode
}

export const SkipLink = forwardRef<HTMLAnchorElement, SkipLinkProps>(
  ({ href, children, className, ...props }, ref) => {
    return (
      <a
        ref={ref}
        href={href}
        className={cn(
          // Hidden by default, visible when focused
          "sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4",
          "z-50 bg-primary text-primary-foreground px-4 py-2 rounded-md",
          "font-medium text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary",
          className
        )}
        {...props}
      >
        {children}
      </a>
    )
  }
)

SkipLink.displayName = 'SkipLink'

// Visually hidden text for screen readers
interface VisuallyHiddenProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode
  asChild?: boolean
}

export const VisuallyHidden = forwardRef<HTMLElement, VisuallyHiddenProps>(
  ({ children, className, asChild = false, ...props }, ref) => {
    if (asChild) {
      return (
        <div
          ref={ref as React.Ref<HTMLDivElement>}
          className={cn("sr-only", className)}
          {...props}
        >
          {children}
        </div>
      )
    }
    
    return (
      <span
        ref={ref as React.Ref<HTMLSpanElement>}
        className={cn("sr-only", className)}
        {...props}
      >
        {children}
      </span>
    )
  }
)

VisuallyHidden.displayName = 'VisuallyHidden'

// Accessible heading component that maintains proper hierarchy
interface AccessibleHeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  level: 1 | 2 | 3 | 4 | 5 | 6
  children: ReactNode
  visualLevel?: 1 | 2 | 3 | 4 | 5 | 6
}

export const AccessibleHeading = forwardRef<HTMLHeadingElement, AccessibleHeadingProps>(
  ({ level, visualLevel, children, className, ...props }, ref) => {
    const visualClass = visualLevel ? getHeadingClass(visualLevel) : getHeadingClass(level)
    
    const headingProps = {
      ref,
      className: cn(visualClass, className),
      ...props,
      children
    }
    
    switch (level) {
      case 1:
        return <h1 {...headingProps} />
      case 2:
        return <h2 {...headingProps} />
      case 3:
        return <h3 {...headingProps} />
      case 4:
        return <h4 {...headingProps} />
      case 5:
        return <h5 {...headingProps} />
      case 6:
        return <h6 {...headingProps} />
      default:
        return <h1 {...headingProps} />
    }
  }
)

AccessibleHeading.displayName = 'AccessibleHeading'

function getHeadingClass(level: 1 | 2 | 3 | 4 | 5 | 6): string {
  const classes = {
    1: 'text-3xl font-bold tracking-tight',
    2: 'text-2xl font-semibold tracking-tight',
    3: 'text-xl font-semibold tracking-tight',
    4: 'text-lg font-semibold',
    5: 'text-base font-semibold',
    6: 'text-sm font-semibold'
  }
  return classes[level]
}

// Focus trap component for modals and dropdowns
interface FocusTrapProps {
  children: ReactNode
  enabled?: boolean
  autoFocus?: boolean
}

export function FocusTrap({ children, enabled = true, autoFocus = true }: FocusTrapProps) {
  if (!enabled) {
    return <>{children}</>
  }

  // This is a simplified focus trap - in production, you'd use a library like focus-trap-react
  return (
    <div
      onKeyDown={(e) => {
        if (e.key === 'Tab') {
          // Handle tab key to trap focus within the container
          const focusableElements = e.currentTarget.querySelectorAll(
            'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select, [tabindex]:not([tabindex="-1"])'
          )
          
          const firstElement = focusableElements[0] as HTMLElement
          const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement
          
          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              e.preventDefault()
              lastElement?.focus()
            }
          } else {
            if (document.activeElement === lastElement) {
              e.preventDefault()
              firstElement?.focus()
            }
          }
        }
      }}
    >
      {children}
    </div>
  )
}

// Accessible status announcer for dynamic content changes
interface LiveRegionProps extends HTMLAttributes<HTMLDivElement> {
  politeness?: 'polite' | 'assertive' | 'off'
  atomic?: boolean
  relevant?: 'additions' | 'removals' | 'text' | 'all'
  children?: ReactNode
}

export const LiveRegion = forwardRef<HTMLDivElement, LiveRegionProps>(
  ({ politeness = 'polite', atomic = false, relevant = 'all', children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        aria-live={politeness}
        aria-atomic={atomic}
        aria-relevant={relevant}
        className={cn('sr-only', className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)

LiveRegion.displayName = 'LiveRegion'

// Landmark component for better page structure
interface LandmarkProps extends HTMLAttributes<HTMLElement> {
  type: 'main' | 'navigation' | 'banner' | 'contentinfo' | 'complementary' | 'search' | 'region'
  label?: string
  children: ReactNode
}

export const Landmark = forwardRef<HTMLElement, LandmarkProps>(
  ({ type, label, children, className, ...props }, ref) => {
    const elementProps = {
      ref: ref as any,
      role: type === 'region' ? 'region' : undefined,
      'aria-label': label,
      className,
      ...props,
      children
    }
    
    switch (type) {
      case 'main':
        return <main {...elementProps} />
      case 'navigation':
        return <nav {...elementProps} />
      case 'banner':
        return <header {...elementProps} />
      case 'contentinfo':
        return <footer {...elementProps} />
      case 'complementary':
        return <aside {...elementProps} />
      case 'search':
        return <search {...elementProps} />
      case 'region':
        return <section {...elementProps} />
      default:
        return <div {...elementProps} />
    }
  }
)

Landmark.displayName = 'Landmark'

// Progress indicator with proper accessibility attributes
interface ProgressIndicatorProps extends HTMLAttributes<HTMLDivElement> {
  value: number
  max?: number
  label?: string
  valueText?: string
}

export const ProgressIndicator = forwardRef<HTMLDivElement, ProgressIndicatorProps>(
  ({ value, max = 100, label, valueText, children, className, ...props }, ref) => {
    const percentage = Math.round((value / max) * 100)
    
    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuetext={valueText || `${percentage}%`}
        aria-label={label}
        className={className}
        {...props}
      >
        {children}
      </div>
    )
  }
)

ProgressIndicator.displayName = 'ProgressIndicator'

// Expandable content with proper ARIA attributes
interface ExpandableContentProps extends HTMLAttributes<HTMLDivElement> {
  trigger: ReactNode
  children: ReactNode
  expanded?: boolean
  onExpandedChange?: (expanded: boolean) => void
  expandedByDefault?: boolean
}

export function ExpandableContent({
  trigger,
  children,
  expanded,
  onExpandedChange,
  expandedByDefault = false,
  className,
  ...props
}: ExpandableContentProps) {
  const [isExpanded, setIsExpanded] = useState(expanded ?? expandedByDefault)
  
  const handleToggle = () => {
    const newExpanded = !isExpanded
    setIsExpanded(newExpanded)
    onExpandedChange?.(newExpanded)
  }
  
  const triggerId = `expandable-trigger-${Math.random().toString(36).substr(2, 9)}`
  const contentId = `expandable-content-${Math.random().toString(36).substr(2, 9)}`
  
  return (
    <div className={className} {...props}>
      <div
        id={triggerId}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-controls={contentId}
        onClick={handleToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleToggle()
          }
        }}
        className="cursor-pointer"
      >
        {trigger}
      </div>
      <div
        id={contentId}
        role="region"
        aria-labelledby={triggerId}
        hidden={!isExpanded}
      >
        {children}
      </div>
    </div>
  )
}

// Import useState
import { useState } from 'react'