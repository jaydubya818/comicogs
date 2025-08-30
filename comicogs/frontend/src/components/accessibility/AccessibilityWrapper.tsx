'use client'

import { useEffect, ReactNode } from 'react'
import { accessibilityChecker } from '@/lib/accessibility/AccessibilityChecker'

interface AccessibilityWrapperProps {
  children: ReactNode
  context?: string
  enableAutoAudit?: boolean
  auditOnMount?: boolean
  auditOnUpdate?: boolean
}

export function AccessibilityWrapper({
  children,
  context = 'component',
  enableAutoAudit = true,
  auditOnMount = false,
  auditOnUpdate = false
}: AccessibilityWrapperProps) {
  useEffect(() => {
    if (!enableAutoAudit) return

    // Auto-audit on mount if requested
    if (auditOnMount) {
      const timer = setTimeout(() => {
        accessibilityChecker.auditPage(context as any)
      }, 1000) // Delay to ensure DOM is ready

      return () => clearTimeout(timer)
    }
  }, [enableAutoAudit, auditOnMount, context])

  useEffect(() => {
    if (!enableAutoAudit || !auditOnUpdate) return

    // Auto-audit on updates (with debouncing)
    const timer = setTimeout(() => {
      accessibilityChecker.auditPage(context as any)
    }, 2000)

    return () => clearTimeout(timer)
  }, [children, enableAutoAudit, auditOnUpdate, context])

  return <>{children}</>
}

// Higher-order component for wrapping components with accessibility auditing
export function withAccessibilityAudit<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    context?: string
    auditOnMount?: boolean
    auditOnUpdate?: boolean
  } = {}
) {
  const WrappedComponent = (props: P) => {
    return (
      <AccessibilityWrapper
        context={options.context}
        auditOnMount={options.auditOnMount}
        auditOnUpdate={options.auditOnUpdate}
      >
        <Component {...props} />
      </AccessibilityWrapper>
    )
  }

  WrappedComponent.displayName = `withAccessibilityAudit(${Component.displayName || Component.name})`
  
  return WrappedComponent
}