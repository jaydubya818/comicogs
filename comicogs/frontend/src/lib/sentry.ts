import * as Sentry from '@sentry/nextjs';
import { isAlpha, getReleaseChannel } from './release';

// Initialize Sentry only if DSN is provided
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    
    // Set sample rate based on environment
    tracesSampleRate: isAlpha ? 1.0 : 0.1,
    
    // Capture unhandled promise rejections is enabled by default
    
    // Set environment and release info
    environment: getReleaseChannel(),
    release: process.env.NEXT_PUBLIC_APP_VERSION || 'unknown',
    
    // Enhanced error tracking for alpha
    beforeSend(event, hint) {
      // Add extra context for alpha users
      if (isAlpha) {
        event.tags = {
          ...event.tags,
          release_channel: 'alpha',
          user_type: 'alpha_tester'
        };
        
        // Capture more detailed context
        event.extra = {
          ...event.extra,
          timestamp: new Date().toISOString(),
          user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
          url: typeof window !== 'undefined' ? window.location.href : 'unknown'
        };
      }
      
      return event;
    },

    // Filter out known non-critical errors
    beforeSendTransaction(event) {
      // Skip health check transactions
      if (event.transaction?.includes('/api/health')) {
        return null;
      }
      return event;
    }
  });
}

// Helper functions for manual error reporting
export function captureAlphaFeedback(feedback: {
  message: string;
  type: string;
  page?: string;
  userEmail?: string;
}) {
  if (isAlpha) {
    Sentry.addBreadcrumb({
      message: 'Alpha user feedback submitted',
      category: 'feedback',
      level: 'info',
      data: feedback
    });
  }
}

export function captureAlphaError(error: Error, context?: Record<string, any>) {
  if (isAlpha) {
    Sentry.withScope((scope) => {
      scope.setTag('alpha_error', true);
      scope.setLevel('error');
      
      if (context) {
        Object.entries(context).forEach(([key, value]) => {
          scope.setContext(key, value);
        });
      }
      
      Sentry.captureException(error);
    });
  }
}

export function captureAlphaMetric(metric: {
  name: string;
  value: number;
  unit?: string;
  tags?: Record<string, string>;
}) {
  if (isAlpha) {
    Sentry.addBreadcrumb({
      message: `Alpha metric: ${metric.name}`,
      category: 'metric',
      level: 'info',
      data: metric
    });
  }
}