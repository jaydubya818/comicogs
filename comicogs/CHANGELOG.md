# Changelog

All notable changes to the Comicogs project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.1] - 2025-01-29

### 🐛 Fixed
- **Critical Server Startup**: Fixed backend server failing to start due to missing Stripe API key
- **Environment Configuration**: Made Stripe initialization conditional to prevent crashes
- **TypeScript Compilation**: Resolved 30+ TypeScript errors in frontend
  - Fixed duplicate function implementations in Field.tsx
  - Resolved Navbar import/export conflicts
  - Fixed Form.tsx Zod schema compatibility issues
  - Updated tsconfig.json with proper moduleResolution
- **Sentry Integration**: Updated to latest API (captureFeedback, startSpan)
- **Build System**: Fixed "tsc: command not found" error by adding npx prefix

### ✨ Added
- **Feature Flags System**: Comprehensive feature flag implementation with environment-based configuration
- **Monitoring & Metrics**: Prometheus metrics middleware for performance monitoring
- **Health Checks**: Enhanced /health endpoint with feature flag status and service checks
- **Testing Framework**: Complete visual regression and E2E testing setup
  - Playwright-based visual testing across themes and viewports
  - E2E test fixtures with authentication helpers
  - Test seed data and utilities
- **Backup & Recovery**: PostgreSQL backup scripts with S3 integration
- **Canary Deployment**: GitHub Actions workflow for staged rollouts
- **Documentation**: Comprehensive testing guide and feature flag documentation

### 🔧 Improved
- **Development Experience**: Backend now starts reliably in development
- **Error Handling**: Graceful degradation when external services are unavailable
- **Code Quality**: Resolved linting and type safety issues
- **Testing Infrastructure**: Automated visual regression and E2E testing

### 📊 Technical Details
- **Frontend**: TypeScript compilation now error-free (30+ errors resolved)
- **Backend**: Server starts successfully on port 4000 with all features operational
- **Feature Flags**: All 8 feature categories working (payments, search, email, etc.)
- **Health Status**: All services reporting healthy (database, redis, stripe)

## [2.0.0] - 2025-01-29

### 🚀 Initial Release
- **Core Platform**: Comic book collection management system
- **Marketplace**: Buy/sell comics with Stripe integration
- **Vault Management**: Personal collection tracking
- **Search & Discovery**: Advanced comic search functionality
- **User Authentication**: Secure user accounts and sessions
- **Modern Stack**: Next.js frontend with Node.js/Express backend
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS with dark/light theme support
