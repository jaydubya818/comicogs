'use client';

import * as Sentry from "@sentry/nextjs";

// Initialize Sentry for the frontend
export function initSentry() {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
    console.warn("NEXT_PUBLIC_SENTRY_DSN not configured, skipping Sentry initialization");
    return;
  }

  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",
    
    // Performance monitoring
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    
    // Session replay (be careful with privacy)
    replaysSessionSampleRate: process.env.NODE_ENV === "production" ? 0.01 : 0.1,
    replaysOnErrorSampleRate: 1.0,
    
    integrations: [
      Sentry.replayIntegration({
        // Mask all text content for privacy
        maskAllText: true,
        maskAllInputs: true,
        // Block network requests with sensitive data
        blockAllMedia: true,
      }),
      
      // Browser tracing for performance
      Sentry.browserTracingIntegration({
        // Capture interactions
        enableInteractionInstrumentation: true,
        // Capture long tasks
        enableLongTaskInstrumentation: true,
      }),
      
      // Capture console logs as breadcrumbs
      Sentry.breadcrumbsIntegration({
        console: false, // Don't capture all console logs
        dom: true,
        fetch: true,
        history: true,
        sentry: true,
        xhr: true,
      }),
    ],
    
    // Release tracking
    release: process.env.NEXT_PUBLIC_SENTRY_RELEASE || process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
    
    // Custom tags
    initialScope: {
      tags: {
        component: "frontend",
        version: process.env.NEXT_PUBLIC_APP_VERSION || "unknown",
      },
    },
    
    // Before send hook to filter sensitive data
    beforeSend(event, hint) {
      // Filter out sensitive URLs
      if (event.request?.url) {
        // Don't send requests to sensitive endpoints
        const sensitivePatterns = ['/api/auth/', '/api/stripe/', '/api/admin/'];
        if (sensitivePatterns.some(pattern => event.request!.url!.includes(pattern))) {
          return null;
        }
      }
      
      // Filter out sensitive form data
      if (event.exception?.values) {
        event.exception.values = event.exception.values.map(exception => {
          if (exception.stacktrace?.frames) {
            exception.stacktrace.frames = exception.stacktrace.frames.map(frame => {
              // Remove sensitive variables
              if (frame.vars) {
                const sensitiveKeys = ['password', 'token', 'secret', 'key', 'auth'];
                sensitiveKeys.forEach(key => {
                  if (frame.vars![key]) {
                    frame.vars![key] = '[Filtered]';
                  }
                });
              }
              return frame;
            });
          }
          return exception;
        });
      }
      
      return event;
    },
    
    // Don't capture breadcrumbs for certain actions
    beforeBreadcrumb(breadcrumb) {
      // Filter out sensitive breadcrumbs
      if (breadcrumb.category === 'fetch' || breadcrumb.category === 'xhr') {
        if (breadcrumb.data?.url) {
          const sensitivePatterns = ['/api/auth/', '/api/stripe/', '/api/admin/'];
          if (sensitivePatterns.some(pattern => breadcrumb.data!.url!.includes(pattern))) {
            return null;
          }
        }
      }
      
      // Don't capture password input changes
      if (breadcrumb.category === 'ui.input' && breadcrumb.message?.includes('password')) {
        return null;
      }
      
      return breadcrumb;
    },
  });

  console.log("Sentry initialized successfully");
}

// Custom error capture with user context
export function captureErrorWithUser(error: Error, user?: { id: string; email?: string; name?: string }) {
  Sentry.withScope((scope) => {
    if (user) {
      scope.setUser({
        id: user.id,
        email: user.email,
        username: user.name,
      });
    }
    
    // Set error level
    if (error.name === 'ChunkLoadError' || error.name === 'TypeError') {
      scope.setLevel('warning');
    } else {
      scope.setLevel('error');
    }
    
    Sentry.captureException(error);
  });
}

// Capture user feedback
export function captureUserFeedback(feedback: {
  name?: string;
  email?: string;
  message: string;
  eventId?: string;
}) {
  Sentry.captureUserFeedback({
    name: feedback.name || 'Anonymous',
    email: feedback.email || 'anonymous@comicogs.com',
    comments: feedback.message,
    event_id: feedback.eventId || Sentry.lastEventId(),
  });
}

// Track page views
export function trackPageView(pageName: string, properties?: Record<string, any>) {
  Sentry.addBreadcrumb({
    message: `Page view: ${pageName}`,
    category: 'navigation',
    level: 'info',
    data: properties,
  });
}

// Track user actions
export function trackUserAction(action: string, properties?: Record<string, any>) {
  Sentry.addBreadcrumb({
    message: `User action: ${action}`,
    category: 'user',
    level: 'info',
    data: properties,
  });
}

// Performance tracking for frontend operations
export function trackPerformance(operation: string, duration: number, properties?: Record<string, any>) {
  Sentry.withScope((scope) => {
    scope.setTag('operation', operation);
    scope.setExtra('duration', duration);
    
    if (properties) {
      Object.keys(properties).forEach(key => {
        scope.setExtra(key, properties[key]);
      });
    }
    
    // Add performance breadcrumb
    Sentry.addBreadcrumb({
      message: `Performance: ${operation}`,
      category: 'performance',
      level: duration > 1000 ? 'warning' : 'info',
      data: {
        duration,
        ...properties,
      },
    });
  });
}

// Set user context
export function setUserContext(user: { id: string; email?: string; name?: string; role?: string }) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.name,
    role: user.role,
  });
}

// Clear user context (on logout)
export function clearUserContext() {
  Sentry.setUser(null);
}

// Set additional context
export function setContext(key: string, context: Record<string, any>) {
  Sentry.setContext(key, context);
}

// Create performance transaction
export function startTransaction(name: string, operation: string) {
  return Sentry.startTransaction({
    name,
    op: operation,
  });
}

// Error boundary integration
export function createErrorBoundary() {
  return Sentry.withErrorBoundary;
}

// Show user report dialog
export function showReportDialog() {
  Sentry.showReportDialog();
}

export { Sentry };