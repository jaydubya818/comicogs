import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { requestLogger, logger } from './middleware/logger';
import { errorHandler } from './middleware/errorHandler';
import { mutationRateLimit } from './middleware/cache';
import { csrfToken, requireCsrf } from './middleware/csrf';
import { metricsMiddleware, metricsEndpoint, initializeFeatureFlagMetrics } from './middleware/metrics';
import { addFeatureFlagHeaders, requireFlag } from './middleware/featureGate';
import { logFlagStates, getAllFlags } from './lib/flags';
import comicsRouter from './routes/comics';
import listingsRouter from './routes/listings';
import wantlistRouter from './routes/wantlist';
import stripeRouter from './routes/stripe';
import checkoutRouter from './routes/checkout';
import ordersRouter from './routes/orders';
import savedSearchesRouter from './routes/savedSearches';
import uploadsRouter from './routes/uploads';
import alertsRouter from './routes/alerts';
import exportRouter from './routes/export';
import importRouter from './routes/import';

const app = express();
const PORT = process.env.API_PORT || 4000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Keep false until all script/img sources are listed
  frameguard: { action: "deny" },
  referrerPolicy: { policy: "no-referrer-when-downgrade" }
}));
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Metrics collection (before request logging)
app.use(metricsMiddleware);

// Request logging
app.use(requestLogger);

// Feature flag headers (in development)
app.use(addFeatureFlagHeaders);

// Stripe webhook needs raw body - must come before JSON middleware
app.use('/api/stripe', stripeRouter);

// Body parsing middleware with security limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

// CSRF protection (after body parsing, before API routes)
app.use(csrfToken);
app.use(requireCsrf);

// Apply mutation rate limiting to all API routes
app.use('/api', mutationRateLimit());

// Metrics endpoint for Prometheus
app.get('/metrics', metricsEndpoint);

// Enhanced health check with feature flag status
app.get('/health', (_req, res) => {
  const flags = getAllFlags();
  const health = {
    ok: true,
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    features: flags,
    services: {
      database: true, // TODO: Add actual DB health check
      redis: true,    // TODO: Add actual Redis health check
      stripe: flags.payments, 
    }
  };
  
  res.json(health);
});

// Readiness check (for k8s deployments)
app.get('/ready', (_req, res) => {
  // Check critical services are ready
  const ready = true; // TODO: Add actual readiness checks
  
  if (ready) {
    res.status(200).json({ ready: true, timestamp: new Date().toISOString() });
  } else {
    res.status(503).json({ ready: false, timestamp: new Date().toISOString() });
  }
});

// API routes with feature flags
app.use('/api/comics', comicsRouter);
app.use('/api/listings', requireFlag('search'), listingsRouter); // Search functionality
app.use('/api/wantlist', requireFlag('wantlist'), wantlistRouter);
app.use('/api/checkout', requireFlag('payments'), checkoutRouter);
app.use('/api/orders', ordersRouter); // Always available for viewing
app.use('/api/saved-searches', requireFlag('search'), savedSearchesRouter);
app.use('/api/uploads', requireFlag('uploads'), uploadsRouter);
app.use('/api/alerts', requireFlag('alerts'), alertsRouter);
app.use('/api/export', requireFlag('exports'), exportRouter);
app.use('/api/import', requireFlag('imports'), importRouter);

// Test routes (development/test only)
if (process.env.NODE_ENV !== 'production') {
  import('./routes/testAuth').then(({ default: testAuth }) => {
    app.use(testAuth);
    logger.info('Test authentication routes enabled');
  }).catch(error => {
    logger.warn('Failed to load test routes:', error);
  });
}

// Root API info
app.get('/api', (_req, res) => {
  res.json({ 
    message: 'Comicogs API',
    version: '2.0.0',
    status: 'running',
    endpoints: {
      comics: '/api/comics',
      listings: '/api/listings', 
      wantlist: '/api/wantlist',
      checkout: '/api/checkout',
      orders: '/api/orders',
      savedSearches: '/api/saved-searches',
      uploads: '/api/uploads',
      alerts: '/api/alerts',
      export: '/api/export',
      import: '/api/import',
      stripe: '/api/stripe/webhook',
      health: '/health',
    },
  });
});

// 404 handler for API routes
app.use('/api/*', (_req, res) => {
  res.status(404).json({ 
    error: 'Not found',
    message: 'The requested API endpoint was not found',
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Graceful shutdown
const server = app.listen(PORT, () => {
  // Initialize feature flag metrics
  initializeFeatureFlagMetrics();
  
  // Log feature flag states
  logFlagStates(logger);
  
  logger.info({
    port: PORT,
    env: process.env.NODE_ENV,
    version: '2.0.0',
  }, '🚀 Comicogs API server started');
  
  console.log(`🚀 Comicogs API server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📈 Metrics: http://localhost:${PORT}/metrics`);
  console.log(`🔄 Readiness: http://localhost:${PORT}/ready`);
  console.log(`📚 API endpoint: http://localhost:${PORT}/api`);
  console.log(`📖 Comics: http://localhost:${PORT}/api/comics`);
  console.log(`🏪 Listings: http://localhost:${PORT}/api/listings`);
  console.log(`❤️ Wantlist: http://localhost:${PORT}/api/wantlist`);
});

// Handle SIGTERM gracefully
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

// Handle SIGINT gracefully
process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully...');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

export default app;