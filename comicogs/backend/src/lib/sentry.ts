import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

// Initialize Sentry
export function initSentry() {
  if (!process.env.SENTRY_DSN) {
    console.warn("SENTRY_DSN not configured, skipping Sentry initialization");
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",
    
    // Performance monitoring
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    
    // Profiling
    profilesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    
    integrations: [
      // Add Node.js profiling integration
      nodeProfilingIntegration(),
      
      // HTTP integration for automatic request tracking
      Sentry.httpIntegration({ 
        tracing: true,
        breadcrumbs: true,
      }),
      
      // Console integration
      Sentry.consoleIntegration(),
      
      // Local variables in stack traces
      Sentry.localVariablesIntegration(),
      
      // Context lines in stack traces
      Sentry.contextLinesIntegration(),
    ],
    
    // Release tracking
    release: process.env.SENTRY_RELEASE || process.env.COMMIT_SHA,
    
    // Server name
    serverName: process.env.SERVER_NAME || process.env.HOSTNAME,
    
    // Custom tags
    initialScope: {
      tags: {
        component: "backend",
        version: process.env.npm_package_version || "unknown",
      },
    },
    
    // Before send hook to filter out sensitive data
    beforeSend(event, hint) {
      // Filter out sensitive data from the event
      if (event.request) {
        // Remove sensitive headers
        const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
        if (event.request.headers) {
          sensitiveHeaders.forEach(header => {
            if (event.request!.headers![header]) {
              event.request!.headers![header] = '[Filtered]';
            }
          });
        }
        
        // Remove sensitive query params
        const sensitiveParams = ['token', 'password', 'secret', 'key'];
        if (event.request.query_string) {
          sensitiveParams.forEach(param => {
            if (event.request!.query_string!.includes(param)) {
              event.request!.query_string = '[Filtered]';
            }
          });
        }
      }
      
      // Filter out sensitive data from extra context
      if (event.extra) {
        const sensitiveKeys = ['password', 'token', 'secret', 'key', 'auth'];
        sensitiveKeys.forEach(key => {
          if (event.extra![key]) {
            event.extra![key] = '[Filtered]';
          }
        });
      }
      
      return event;
    },
    
    // Custom error sampling
    beforeSendTransaction(event) {
      // Don't send health check transactions to reduce noise
      if (event.transaction?.includes('health') || event.transaction?.includes('ping')) {
        return null;
      }
      return event;
    },
  });

  console.log("Sentry initialized successfully");
}

// Custom error capture with context
export function captureErrorWithContext(error: Error, context: Record<string, any> = {}) {
  Sentry.withScope((scope) => {
    // Add custom context
    Object.keys(context).forEach(key => {
      scope.setExtra(key, context[key]);
    });
    
    // Set error level based on error type
    if (error.name === 'ValidationError') {
      scope.setLevel('warning');
    } else if (error.name === 'AuthError') {
      scope.setLevel('info');
    } else {
      scope.setLevel('error');
    }
    
    Sentry.captureException(error);
  });
}

// Capture performance timing
export function capturePerformance(operation: string, duration: number, context: Record<string, any> = {}) {
  Sentry.withScope((scope) => {
    scope.setTag('operation', operation);
    Object.keys(context).forEach(key => {
      scope.setExtra(key, context[key]);
    });
    
    // Create a custom event for performance tracking
    Sentry.addBreadcrumb({
      message: `Performance: ${operation}`,
      category: 'performance',
      level: 'info',
      data: {
        duration,
        ...context,
      },
    });
  });
}

// Create a transaction for tracking operations
export function createTransaction(name: string, operation: string) {
  return Sentry.startTransaction({
    name,
    op: operation,
  });
}

// Middleware to automatically capture request context
export function createSentryScope(req: any) {
  Sentry.setTag('endpoint', req.path);
  Sentry.setTag('method', req.method);
  
  if (req.user) {
    Sentry.setUser({
      id: req.user.id,
      email: req.user.email,
      username: req.user.name,
    });
  }
  
  if (req.ip) {
    Sentry.setTag('ip', req.ip);
  }
  
  // Add request ID if available
  if (req.id || req.requestId) {
    Sentry.setTag('requestId', req.id || req.requestId);
  }
}

// Health check for Sentry
export function sentryHealthCheck(): { status: 'ok' | 'error', configured: boolean } {
  const configured = !!process.env.SENTRY_DSN;
  
  if (!configured) {
    return { status: 'error', configured: false };
  }
  
  try {
    // Test Sentry by capturing a test message
    Sentry.addBreadcrumb({
      message: 'Sentry health check',
      category: 'health',
      level: 'info',
    });
    
    return { status: 'ok', configured: true };
  } catch (error) {
    return { status: 'error', configured: true };
  }
}

export { Sentry };