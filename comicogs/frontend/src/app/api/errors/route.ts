import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const errorData = await request.json()

    // Basic validation
    if (!errorData.message || !errorData.timestamp) {
      return NextResponse.json(
        { error: 'Missing required error data' },
        { status: 400 }
      )
    }

    // Log error data (in production, you'd send this to a monitoring service)
    console.error('Client Error Report:', {
      message: errorData.message,
      stack: errorData.stack,
      componentStack: errorData.componentStack,
      level: errorData.level,
      timestamp: errorData.timestamp,
      url: errorData.url,
      userAgent: errorData.userAgent,
      // Add user context if available
      userId: request.headers.get('x-user-id'),
      sessionId: request.headers.get('x-session-id')
    })

    // In production, integrate with error monitoring services:
    // - Sentry: Sentry.captureException(error)
    // - LogRocket: LogRocket.captureException(error)
    // - Bugsnag: Bugsnag.notify(error)
    // - DataDog: datadogRum.addError(error)

    // Example Sentry integration (uncomment when Sentry is configured):
    /*
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      const Sentry = require('@sentry/nextjs')
      Sentry.withScope((scope) => {
        scope.setTag('errorBoundary', true)
        scope.setLevel('error')
        scope.setContext('errorInfo', {
          componentStack: errorData.componentStack,
          level: errorData.level,
          url: errorData.url,
          userAgent: errorData.userAgent
        })
        Sentry.captureException(new Error(errorData.message))
      })
    }
    */

    return NextResponse.json(
      { success: true, message: 'Error reported successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Failed to process error report:', error)
    return NextResponse.json(
      { error: 'Failed to process error report' },
      { status: 500 }
    )
  }
}