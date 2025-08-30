'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  level?: 'page' | 'component' | 'app'
  showDetails?: boolean
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  eventId?: string
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to monitoring service
    this.logErrorToService(error, errorInfo)

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    this.setState({
      error,
      errorInfo
    })
  }

  private logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error)
      console.error('Error Info:', errorInfo)
    }

    // Send to monitoring service (Sentry, LogRocket, etc.)
    if (typeof window !== 'undefined') {
      // Example integration with error reporting service
      try {
        const errorData = {
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          level: this.props.level || 'component',
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent
        }

        // Send to your error reporting service
        fetch('/api/errors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(errorData)
        }).catch(console.error)
      } catch (reportingError) {
        console.error('Failed to report error:', reportingError)
      }
    }
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: undefined
    })
  }

  private handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      const { level = 'component', showDetails = false } = this.props
      const { error, errorInfo } = this.state

      // Different UI based on error level
      if (level === 'app') {
        return (
          <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="max-w-md w-full text-center space-y-6">
              <div className="flex justify-center">
                <div className="rounded-full bg-destructive/10 p-3">
                  <AlertTriangle className="h-8 w-8 text-destructive" />
                </div>
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tight">
                  Something went wrong
                </h1>
                <p className="text-muted-foreground">
                  The application encountered an unexpected error. Please try refreshing the page.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={this.handleRetry} className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Try again
                </Button>
                <Button variant="outline" onClick={this.handleGoHome} className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Go home
                </Button>
              </div>
              {showDetails && error && (
                <details className="text-left mt-6">
                  <summary className="cursor-pointer text-sm text-muted-foreground mb-2">
                    Error details
                  </summary>
                  <div className="bg-muted rounded-md p-3 text-sm font-mono overflow-auto max-h-32">
                    <div className="text-destructive font-semibold mb-1">
                      {error.name}: {error.message}
                    </div>
                    {error.stack && (
                      <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
                        {error.stack}
                      </pre>
                    )}
                  </div>
                </details>
              )}
            </div>
          </div>
        )
      }

      if (level === 'page') {
        return (
          <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-destructive/10 p-3">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
            </div>
            <h2 className="text-xl font-semibold mb-2">Page Error</h2>
            <p className="text-muted-foreground mb-4 max-w-md">
              This page encountered an error and couldn't load properly.
            </p>
            <div className="flex gap-3">
              <Button onClick={this.handleRetry} size="sm" className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Try again
              </Button>
              <Button variant="outline" onClick={this.handleGoHome} size="sm" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Go home
              </Button>
            </div>
            {showDetails && error && (
              <details className="mt-4 max-w-md">
                <summary className="cursor-pointer text-sm text-muted-foreground mb-2">
                  Error details
                </summary>
                <div className="bg-muted rounded-md p-3 text-sm font-mono overflow-auto max-h-24">
                  {error.message}
                </div>
              </details>
            )}
          </div>
        )
      }

      // Component level error
      return (
        <div className={cn(
          "border border-destructive/20 rounded-md p-4 bg-destructive/5",
          "flex items-center gap-3"
        )}>
          <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-destructive">
              Component Error
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {error?.message || 'An unexpected error occurred'}
            </p>
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={this.handleRetry}
            className="flex-shrink-0"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}

// Convenience wrapper components
export function AppErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary level="app" showDetails={process.env.NODE_ENV === 'development'}>
      {children}
    </ErrorBoundary>
  )
}

export function PageErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary level="page" showDetails={process.env.NODE_ENV === 'development'}>
      {children}
    </ErrorBoundary>
  )
}

export function ComponentErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary level="component">
      {children}
    </ErrorBoundary>
  )
}

// Legacy default export
export default ErrorBoundary
