/**
 * Feature Gate Middleware
 * 
 * Middleware to enforce feature flags on API routes.
 * Returns 503 Service Unavailable when a feature is disabled.
 */

import { Request, Response, NextFunction } from 'express';
import { FeatureFlags, isFeatureEnabled } from '../lib/flags';
import { logger } from './logger';
import { recordFeatureFlagBlock } from './metrics';

/**
 * Middleware factory to require a feature flag to be enabled
 */
export function requireFlag(feature: keyof FeatureFlags) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (isFeatureEnabled(feature)) {
      next();
    } else {
      logger.warn({ 
        feature, 
        path: req.path, 
        method: req.method,
        ip: req.ip 
      }, `🚫 Feature "${feature}" is disabled - request blocked`);
      
      // Record metrics
      recordFeatureFlagBlock(feature, req.path);
      
      res.status(503).json({
        error: 'Service Unavailable',
        message: `The ${feature} feature is currently disabled`,
        code: 'FEATURE_DISABLED',
        feature,
        retryAfter: 300 // Suggest retry after 5 minutes
      });
    }
  };
}

/**
 * Middleware to add feature flag status to response headers
 * Useful for debugging and monitoring
 */
export function addFeatureFlagHeaders(req: Request, res: Response, next: NextFunction): void {
  // Only add headers in development or if explicitly enabled
  if (process.env.NODE_ENV === 'development' || process.env.EXPOSE_FEATURE_FLAGS === 'true') {
    res.setHeader('X-Feature-Payments', isFeatureEnabled('payments') ? '1' : '0');
    res.setHeader('X-Feature-Search', isFeatureEnabled('search') ? '1' : '0');
    res.setHeader('X-Feature-Email', isFeatureEnabled('email') ? '1' : '0');
    res.setHeader('X-Feature-Uploads', isFeatureEnabled('uploads') ? '1' : '0');
  }
  next();
}

/**
 * Check if feature is enabled and return boolean
 * For use in route handlers where you need conditional logic
 */
export function checkFeature(feature: keyof FeatureFlags): boolean {
  return isFeatureEnabled(feature);
}
