'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to monitoring service
    console.error('Global error:', error)

    // Report to error tracking service
    if (typeof window !== 'undefined') {
      try {
        fetch('/api/errors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: error.message,
            stack: error.stack,
            digest: error.digest,
            level: 'error',
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            context: {
              component: 'GlobalError',
              action: 'pageError'
            }
          })
        }).catch(console.error)
      } catch (reportError) {
        console.error('Failed to report global error:', reportError)
      }
    }
  }, [error])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Error Icon */}
        <div className="flex justify-center">
          <div className="rounded-full bg-destructive/10 p-4">
            <AlertTriangle className="h-12 w-12 text-destructive" />
          </div>
        </div>

        {/* Error Content */}
        <div className="space-y-4">
          <h1 className="text-3xl font-bold tracking-tight">
            Something went wrong
          </h1>
          <p className="text-lg text-muted-foreground">
            We encountered an unexpected error while loading this page.
          </p>
          
          {/* Error Details (Development Only) */}
          {process.env.NODE_ENV === 'development' && (
            <details className="text-left mt-6 p-4 bg-muted rounded-md">
              <summary className="cursor-pointer text-sm font-medium text-destructive mb-2">
                Error Details (Development)
              </summary>
              <div className="text-xs text-muted-foreground space-y-2">
                <div>
                  <strong>Message:</strong> {error.message}
                </div>
                {error.digest && (
                  <div>
                    <strong>Digest:</strong> {error.digest}
                  </div>
                )}
                {error.stack && (
                  <div>
                    <strong>Stack Trace:</strong>
                    <pre className="mt-1 whitespace-pre-wrap text-xs overflow-auto max-h-32 bg-background p-2 rounded border">
                      {error.stack}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={reset} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
          
          <Button variant="outline" asChild>
            <Link href="/" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Go Home
            </Link>
          </Button>
          
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Page
          </Button>
        </div>

        {/* Support Information */}
        <div className="text-sm text-muted-foreground space-y-2">
          <p>If this error continues to occur, please let us know.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="mailto:support@comicogs.com"
              className="flex items-center gap-2 text-primary hover:underline"
            >
              <Bug className="h-4 w-4" />
              Report Issue
            </a>
            <Link 
              href="/help"
              className="text-primary hover:underline"
            >
              Help Center
            </Link>
          </div>
        </div>

        {/* Error ID for Support */}
        {error.digest && (
          <div className="text-xs text-muted-foreground bg-muted rounded p-2">
            <strong>Error ID:</strong> {error.digest}
            <br />
            <em>Please include this ID when reporting the issue</em>
          </div>
        )}
      </div>
    </div>
  )
}