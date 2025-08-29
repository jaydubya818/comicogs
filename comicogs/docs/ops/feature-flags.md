# Feature Flags & Kill Switches

This document explains how to use Comicogs' feature flag system for safe deployments and emergency controls.

## Overview

The feature flag system allows you to:
- **Kill switches**: Instantly disable features during incidents
- **Canary deployments**: Safely test new features with gradual rollout  
- **Emergency controls**: Disable high-risk features during peak traffic
- **A/B testing**: Enable features for specific user segments

## Available Feature Flags

| Flag | Environment Variable | Default | Controls |
|------|---------------------|---------|----------|
| `payments` | `FLAG_PAYMENTS` | `on` | Checkout, Stripe webhooks |
| `search` | `FLAG_SEARCH` | `on` | Listings, saved searches |
| `email` | `FLAG_EMAIL` | `on` | Email notifications |
| `uploads` | `FLAG_UPLOADS` | `on` | Image uploads |
| `exports` | `FLAG_EXPORTS` | `on` | Data export functionality |
| `imports` | `FLAG_IMPORTS` | `on` | CSV import functionality |
| `alerts` | `FLAG_ALERTS` | `on` | Alert system |
| `wantlist` | `FLAG_WANTLIST` | `on` | Wantlist functionality |

## Quick Usage

### 🚨 Emergency: Disable Feature
```bash
# Disable payments immediately
export FLAG_PAYMENTS=off

# Restart server to apply
pm2 restart comicogs-api
# OR for development
npm run dev
```

### ✅ Re-enable Feature
```bash
# Re-enable payments
export FLAG_PAYMENTS=on
# OR remove the flag entirely (defaults to on)
unset FLAG_PAYMENTS

# Restart server
pm2 restart comicogs-api
```

### 📊 Check Current Status
```bash
# View all feature flags in health endpoint
curl http://localhost:4000/health | jq '.features'

# View Prometheus metrics
curl http://localhost:4000/metrics | grep feature_flag
```

## Environment Configuration

### Production (.env)
```bash
# Feature Flags (set to "off" to disable)
FLAG_PAYMENTS=""          # Empty = enabled
FLAG_SEARCH=""            # Empty = enabled
FLAG_EMAIL="off"          # Explicitly disabled
FLAG_UPLOADS=""           # Empty = enabled
FLAG_EXPORTS=""           # Empty = enabled
FLAG_IMPORTS="off"        # Explicitly disabled
FLAG_ALERTS=""            # Empty = enabled
FLAG_WANTLIST=""          # Empty = enabled

# Debug headers (development only)
EXPOSE_FEATURE_FLAGS="false"
```

### Development
```bash
# Enable debug headers to see flags in response
EXPOSE_FEATURE_FLAGS="true"
```

## API Behavior

### When Feature is Enabled
```bash
curl -X GET http://localhost:4000/api/listings
# Returns: 200 OK with listings data
```

### When Feature is Disabled
```bash
curl -X GET http://localhost:4000/api/listings
# Returns: 503 Service Unavailable
{
  "error": "Service Unavailable",
  "message": "The search feature is currently disabled",
  "code": "FEATURE_DISABLED",
  "feature": "search",
  "retryAfter": 300
}
```

### Debug Headers (Development)
```bash
curl -I http://localhost:4000/api/listings
# Returns headers:
X-Feature-Payments: 1
X-Feature-Search: 0
X-Feature-Email: 1
X-Feature-Uploads: 1
```

## Monitoring & Metrics

### Prometheus Metrics
```
# Feature flag status (1=enabled, 0=disabled)
feature_flag_status{feature="payments"} 1
feature_flag_status{feature="search"} 0

# Blocked requests counter
feature_flag_blocked_total{feature="search",route="/api/listings"} 42

# HTTP request metrics with feature context
http_requests_total{method="GET",route="/api/listings",status_code="503"} 42
```

### Health Check
```bash
curl http://localhost:4000/health
```

```json
{
  "ok": true,
  "version": "2.0.0",
  "timestamp": "2024-12-19T10:30:00.000Z",
  "uptime": 3600,
  "environment": "production",
  "features": {
    "payments": true,
    "search": false,
    "email": true,
    "uploads": true,
    "exports": true,
    "imports": false,
    "alerts": true,
    "wantlist": true
  },
  "services": {
    "database": true,
    "redis": true,
    "stripe": true
  }
}
```

## Canary Deployment Process

### 1. Deploy Canary
```bash
# GitHub Actions automatically triggers on main branch push
git push origin main

# OR manual trigger with custom settings
gh workflow run canary-deploy.yml \
  -f canary_percentage=25 \
  -f rollback_on_error=true
```

### 2. Monitor Canary
```bash
# Check canary health
curl http://staging.comicogs.com/health

# Monitor metrics
curl http://staging.comicogs.com/metrics | grep -E "(http_request_duration|http_errors_total)"
```

### 3. Automatic Promotion or Rollback
- ✅ **Auto-promote**: If health, smoke tests, and performance checks pass
- ❌ **Auto-rollback**: If any check fails
- 📊 **Manual decision**: Override via GitHub Actions interface

## Emergency Procedures

### 🚨 Complete Site Disable
```bash
# Kill all features except core functionality
export FLAG_PAYMENTS=off
export FLAG_SEARCH=off
export FLAG_UPLOADS=off
export FLAG_EXPORTS=off
export FLAG_IMPORTS=off
export FLAG_ALERTS=off
export FLAG_WANTLIST=off

# Restart
pm2 restart comicogs-api
```

### 🔄 Gradual Recovery
```bash
# Re-enable features one by one, monitoring each
export FLAG_SEARCH=on && pm2 restart comicogs-api
# Wait 5 minutes, monitor metrics
export FLAG_WANTLIST=on && pm2 restart comicogs-api
# Wait 5 minutes, monitor metrics
export FLAG_PAYMENTS=on && pm2 restart comicogs-api
```

### 💳 Payments-Only Disable
```bash
# Disable just payments during Stripe issues
export FLAG_PAYMENTS=off
pm2 restart comicogs-api

# Users can still browse, search, add to wantlist
# But cannot checkout
```

## Testing

### Manual Testing
```bash
# Run the feature flag test suite
node test_feature_flags.js
```

### Automated Testing
```bash
# Include in CI/CD pipeline
npm run test:feature-flags

# Test with different flag combinations
FLAG_PAYMENTS=off npm run test:api
FLAG_SEARCH=off npm run test:api
```

## Development

### Adding New Feature Flags

1. **Update flags configuration**:
```typescript
// backend/src/lib/flags.ts
export const flags: FeatureFlags = {
  // ... existing flags
  newFeature: process.env.FLAG_NEW_FEATURE !== "off",
};
```

2. **Add middleware to route**:
```typescript
// backend/src/server.ts
app.use('/api/new-feature', requireFlag('newFeature'), newFeatureRouter);
```

3. **Update environment template**:
```bash
# env.example
FLAG_NEW_FEATURE=""
```

### Route Protection Patterns

#### Full Route Protection
```typescript
// Protect entire route
app.use('/api/payments', requireFlag('payments'), paymentsRouter);
```

#### Conditional Logic
```typescript
// Inside route handler
import { checkFeature } from '../middleware/featureGate';

router.get('/listings', (req, res) => {
  if (!checkFeature('search')) {
    return res.status(503).json({ error: 'Search disabled' });
  }
  // ... normal logic
});
```

#### Gradual Feature Rollout
```typescript
// Enable for specific user segments
router.get('/beta-feature', (req, res) => {
  const isEnabled = checkFeature('betaFeature') && 
                   (req.user?.role === 'admin' || req.user?.betaTester);
                   
  if (!isEnabled) {
    return res.status(404).json({ error: 'Not found' });
  }
  // ... beta feature logic
});
```

## Troubleshooting

### Feature Not Disabling
1. Check environment variable: `echo $FLAG_PAYMENTS`
2. Restart server: `pm2 restart comicogs-api`
3. Verify health endpoint: `curl /health | jq '.features'`
4. Check server logs: `pm2 logs comicogs-api`

### Metrics Not Updating
1. Check metrics endpoint: `curl /metrics | grep feature_flag`
2. Verify Prometheus scraping: Check Grafana dashboard
3. Restart metrics collection: `pm2 restart comicogs-api`

### Canary Deployment Stuck
1. Check GitHub Actions logs
2. Verify staging environment health
3. Manual rollback: `gh workflow run rollback.yml`

## Related Documentation

- [Monitoring & Alerting](./monitoring.md)
- [Deployment Guide](./deployment.md)
- [Disaster Recovery](./dr.md)
- [API Documentation](../api/README.md)
