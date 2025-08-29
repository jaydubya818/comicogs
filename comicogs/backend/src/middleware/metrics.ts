/**
 * Prometheus Metrics Middleware
 * 
 * Collects application metrics for monitoring and alerting.
 * Tracks HTTP request duration, error rates, and feature flag usage.
 */

import { Request, Response, NextFunction } from 'express';
import { register, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';
import { logger } from './logger';
import { getAllFlags } from '../lib/flags';

// Enable default metrics collection (CPU, memory, etc.)
collectDefaultMetrics({ register });

// HTTP request duration histogram
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10], // Response time buckets
});

// HTTP request counter
export const httpRequestTotal = new Counter({
  name: 'http_requests_total', 
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

// Error rate counter
export const httpErrorsTotal = new Counter({
  name: 'http_errors_total',
  help: 'Total number of HTTP errors',
  labelNames: ['method', 'route', 'status_code', 'error_type'],
});

// Feature flag blocked requests
export const featureFlagBlockedTotal = new Counter({
  name: 'feature_flag_blocked_total',
  help: 'Total requests blocked by feature flags',
  labelNames: ['feature', 'route'],
});

// Active connections gauge
export const activeConnections = new Gauge({
  name: 'http_active_connections',
  help: 'Number of active HTTP connections',
});

// Queue depth gauge (for future BullMQ integration)
export const queueDepth = new Gauge({
  name: 'queue_depth_total',
  help: 'Number of jobs in processing queues',
  labelNames: ['queue_name'],
});

// Feature flag status gauge
export const featureFlagStatus = new Gauge({
  name: 'feature_flag_status',
  help: 'Current status of feature flags (1=enabled, 0=disabled)',
  labelNames: ['feature'],
});

/**
 * Initialize feature flag metrics
 */
export function initializeFeatureFlagMetrics(): void {
  const flags = getAllFlags();
  Object.entries(flags).forEach(([feature, enabled]) => {
    featureFlagStatus.set({ feature }, enabled ? 1 : 0);
  });
}

/**
 * Middleware to collect HTTP metrics
 */
export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  
  // Increment active connections
  activeConnections.inc();
  
  // Extract route pattern for consistent labeling
  const route = getRoutePattern(req);
  
  // Override res.end to capture metrics when response finishes
  const originalEnd = res.end;
  res.end = function(this: Response, ...args: any[]): Response {
    const duration = (Date.now() - start) / 1000;
    const statusCode = res.statusCode.toString();
    
    // Record metrics
    httpRequestDuration
      .labels(req.method, route, statusCode)
      .observe(duration);
      
    httpRequestTotal
      .labels(req.method, route, statusCode)
      .inc();
    
    // Track errors (4xx and 5xx)
    if (res.statusCode >= 400) {
      const errorType = res.statusCode >= 500 ? 'server_error' : 'client_error';
      httpErrorsTotal
        .labels(req.method, route, statusCode, errorType)
        .inc();
    }
    
    // Decrement active connections
    activeConnections.dec();
    
    // Call original end method
    return originalEnd.call(this, ...args) as Response;
  };
  
  next();
}

/**
 * Extract route pattern from request
 * Normalizes dynamic segments to avoid high cardinality
 */
function getRoutePattern(req: Request): string {
  let path = req.path;
  
  // Replace UUIDs and numeric IDs with placeholders
  path = path.replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:uuid');
  path = path.replace(/\/\d+/g, '/:id');
  
  // Keep the route pattern clean
  return path || '/';
}

/**
 * Endpoint to expose metrics for Prometheus scraping
 */
export async function metricsEndpoint(req: Request, res: Response): Promise<void> {
  try {
    // Update feature flag metrics before serving
    initializeFeatureFlagMetrics();
    
    res.set('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.send(metrics);
  } catch (error) {
    logger.error({ error }, 'Failed to generate metrics');
    res.status(500).json({ error: 'Failed to generate metrics' });
  }
}

/**
 * Record a feature flag block event
 */
export function recordFeatureFlagBlock(feature: string, route: string): void {
  featureFlagBlockedTotal.labels(feature, route).inc();
}

/**
 * Update queue depth metric (for BullMQ integration)
 */
export function updateQueueDepth(queueName: string, depth: number): void {
  queueDepth.set({ queue_name: queueName }, depth);
}
