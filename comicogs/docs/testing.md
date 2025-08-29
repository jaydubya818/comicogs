# Testing Guide

This document explains how to run and manage the comprehensive test suite for Comicogs.

## Test Types

### 🎨 Visual Regression Testing
Captures screenshots of all pages across themes and viewports to detect unintended UI changes.

```bash
# Generate screenshots for all routes
npm run snap:serve

# Clean previous screenshots
npm run snap:clean

# Run just visual tests
npm run snap
```

**Output**: `docs/screenshots/{theme}/{viewport}/*.png`

### 🔄 End-to-End (E2E) Testing
Tests complete user workflows using real browser automation.

```bash
# Run all E2E tests with dev server
npm run test:e2e:serve

# Run E2E tests (server must be running)
npm run test:e2e

# Run with UI mode for debugging
npm run test:e2e:ui
```

**Test Scenarios**:
- Marketplace search → listing view → add to vault
- Seller creates listing → buyer checkout flow
- Authentication and permissions
- Theme switching

### 💨 Smoke Testing
Quick health checks for critical functionality.

```bash
npm run test:smoke
```

### ♿ Accessibility Testing
Automated accessibility checks using axe-core.

```bash
npm run test:a11y
```

## Test Data Management

### E2E Test Data
Isolated test data for E2E scenarios:

```bash
# Seed test data
npm run db:seed:e2e

# Or via backend workspace
npm run --workspace=backend db:seed:e2e
```

**Test Users**:
- `buyer@example.com` - Regular user for purchasing
- `seller@example.com` - Verified seller for listing creation
- `admin@example.com` - Admin user for management features

### Test Authentication
E2E tests use special authentication endpoints (development only):

```typescript
// Login during tests
await loginAs("buyer@example.com");

// Available test endpoints:
// POST /api/_test/login
// POST /api/_test/logout  
// POST /api/_test/seed
// POST /api/_test/cleanup
// POST /api/_test/webhook
```

## Running Tests Locally

### Prerequisites
```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install --with-deps

# Setup database
npm run db:setup
npm run db:migrate
```

### Development Workflow
```bash
# 1. Start development server
npm run dev

# 2. In another terminal, run specific tests
npm run test:e2e        # E2E tests
npm run snap           # Visual regression
npm run test:smoke     # Smoke tests
npm run test:a11y      # Accessibility

# Or run everything with automatic server management
npm run test:e2e:serve
npm run snap:serve
```

### Debugging Tests
```bash
# Run with UI mode for interactive debugging
npm run test:e2e:ui

# Run specific test file
npx playwright test tests/e2e/marketplace.spec.ts

# Run with headed browser (see what's happening)
npx playwright test --headed

# Debug specific test
npx playwright test --debug tests/e2e/marketplace.spec.ts
```

## CI/CD Integration

### GitHub Actions
The test suite runs automatically on:
- Push to `main` or `develop` branches
- Pull requests
- Manual workflow dispatch

```yaml
# Trigger specific test types
gh workflow run test-visual-e2e.yml -f test_type=visual
gh workflow run test-visual-e2e.yml -f test_type=e2e
gh workflow run test-visual-e2e.yml -f test_type=smoke
```

### Artifacts
CI generates the following artifacts:
- **Site Screenshots**: Visual regression captures
- **Playwright Reports**: Interactive HTML reports with traces
- **Test Results**: Raw test data and videos

## Configuration

### Playwright Config
Main configuration in `playwright.config.ts`:
- Test directories and patterns
- Browser configurations
- Timeout and retry settings
- Reporter configurations

### Routes for Visual Testing
Managed in `scripts/snap-routes.json`:
```json
[
  "/",
  "/marketplace",
  "/vault", 
  "/account",
  "/marketplace/listings",
  "/marketplace/search?query=spider",
  "/comic-dna"
]
```

### Test Fixtures
Reusable test utilities in `tests/e2e/fixtures.ts`:
- `loginAs()` - Authentication helper
- `api()` - API testing helper  
- `seedTestData()` - Data setup
- `TestHelpers` - Common UI interactions

## Best Practices

### Writing E2E Tests
```typescript
import { test, expect, TestHelpers } from "./fixtures";

test("descriptive test name", async ({ page, loginAs }) => {
  // Setup
  await loginAs("buyer@example.com");
  await TestHelpers.waitForPageLoad(page, "/marketplace");
  
  // Action
  await TestHelpers.searchAndSelectFirst(
    page, 
    '[data-test="search-input"]', 
    "Spider-Man",
    '[data-test="listing-card"]'
  );
  
  // Assertion
  await expect(page.locator("h1")).toContainText(/Amazing Spider-Man/i);
  
  // Optional: Screenshot for debugging
  await TestHelpers.takeScreenshot(page, "test-result");
});
```

### Test Data Attributes
Use consistent `data-test` attributes for reliable element selection:

```tsx
// ✅ Good
<button data-test="add-to-vault">Add to Vault</button>
<div data-test="listing-card" data-id={listing.id}>

// ❌ Avoid
<button className="btn-primary">Add to Vault</button>
```

### Error Handling
Tests are designed to be resilient:
- Graceful fallbacks when UI elements aren't found
- Informative console logs for debugging
- Screenshots captured on failures
- Retry logic for flaky operations

## Troubleshooting

### Common Issues

**Tests fail with "element not found"**:
- Check if `data-test` attributes exist in components
- Verify test data is properly seeded
- Use `TestHelpers.takeScreenshot()` to debug UI state

**Visual tests show differences**:
- Fonts or images might not be loading consistently
- Check for animations or dynamic content
- Verify theme switching is working correctly

**E2E tests timeout**:
- Increase timeout in test or playwright config
- Check if backend/database is running properly
- Look for network issues or slow API responses

**Authentication fails**:
- Ensure test users exist in seeded data
- Check JWT_SECRET environment variable
- Verify test auth endpoints are enabled (development only)

### Debug Commands
```bash
# Check test status endpoint
curl http://localhost:4000/api/_test/status

# Verify seeded data
npm run db:studio

# Check server logs during tests
npm run dev:backend

# Run single test with full output
npx playwright test tests/e2e/marketplace.spec.ts --reporter=line
```

## Performance Considerations

- Visual tests run serially to avoid interference
- E2E tests use single worker for consistency  
- Database is reset between test suites
- Screenshots are compressed and cleaned up
- Traces only captured on failures to save space

For questions or issues with the test suite, check the GitHub Actions logs or open an issue with the failing test details.
