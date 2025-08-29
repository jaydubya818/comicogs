import { test, expect } from '@playwright/test';

test.describe('Marketplace Visual Regression Tests', () => {
  // Test different marketplace URL states for visual consistency
  const marketplaceUrls = [
    '/marketplace',
    '/marketplace?search=spider-man',
    '/marketplace?category=marvel&condition=mint',
    '/marketplace?sort=price-low&page=2',
    '/marketplace?search=batman&category=dc&condition=near-mint&sort=newest',
    '/marketplace?publisher=marvel&year_start=2020&year_end=2023',
    '/marketplace?price_min=10&price_max=100&grade=9.0',
    '/marketplace?search=x-men&category=marvel&condition=fine&sort=price-high&view=grid'
  ];

  marketplaceUrls.forEach((url, index) => {
    test(`Marketplace visual test - State ${index + 1}: ${url}`, async ({ page }) => {
      // Navigate to the marketplace URL
      await page.goto(url);
      
      // Wait for the page to fully load and filters to be applied
      await page.waitForSelector('[data-testid="marketplace-container"]', { timeout: 10000 });
      await page.waitForSelector('[data-testid="results-summary-bar"]', { timeout: 5000 });
      
      // Wait for any loading states to complete
      await page.waitForFunction(() => {
        const loader = document.querySelector('[data-testid="loading-spinner"]');
        return !loader || loader.style.display === 'none';
      }, { timeout: 10000 });
      
      // Ensure images are loaded
      await page.waitForLoadState('networkidle');
      
      // Take screenshot for visual comparison
      await expect(page).toHaveScreenshot(`marketplace-state-${index + 1}.png`, {
        fullPage: true,
        animations: 'disabled'
      });
      
      // Test filter chips visibility if filters are applied
      if (url.includes('?')) {
        await expect(page.locator('[data-testid="results-summary-bar"]')).toBeVisible();
        await expect(page.locator('[data-testid="filter-chip"]').first()).toBeVisible();
      }
      
      // Test responsive design - mobile view
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(500); // Allow layout to adjust
      
      await expect(page).toHaveScreenshot(`marketplace-state-${index + 1}-mobile.png`, {
        fullPage: true,
        animations: 'disabled'
      });
      
      // Reset viewport for next test
      await page.setViewportSize({ width: 1280, height: 720 });
    });
  });

  test('Filter chips interaction visual test', async ({ page }) => {
    // Navigate to marketplace with multiple filters
    await page.goto('/marketplace?search=batman&category=dc&condition=near-mint&sort=newest&grade=9.0');
    
    // Wait for components to load
    await page.waitForSelector('[data-testid="results-summary-bar"]');
    await page.waitForSelector('[data-testid="filter-chip"]');
    
    // Take baseline screenshot
    await expect(page).toHaveScreenshot('filter-chips-baseline.png');
    
    // Hover over first filter chip
    await page.locator('[data-testid="filter-chip"]').first().hover();
    await expect(page).toHaveScreenshot('filter-chips-hover.png');
    
    // Focus on first filter chip (keyboard navigation)
    await page.locator('[data-testid="filter-chip"]').first().focus();
    await expect(page).toHaveScreenshot('filter-chips-focus.png');
    
    // Click to remove first filter chip
    await page.locator('[data-testid="filter-chip-remove"]').first().click();
    await page.waitForTimeout(500); // Allow for transition
    await expect(page).toHaveScreenshot('filter-chips-after-removal.png');
  });

  test('Save search button visual states', async ({ page }) => {
    await page.goto('/marketplace?search=spider-man&category=marvel');
    
    // Wait for components
    await page.waitForSelector('[data-testid="save-search-button"]');
    
    // Default state
    await expect(page).toHaveScreenshot('save-search-default.png', {
      clip: { x: 0, y: 0, width: 200, height: 100 }
    });
    
    // Hover state
    await page.locator('[data-testid="save-search-button"]').hover();
    await expect(page).toHaveScreenshot('save-search-hover.png', {
      clip: { x: 0, y: 0, width: 200, height: 100 }
    });
    
    // Focus state (keyboard navigation)
    await page.locator('[data-testid="save-search-button"]').focus();
    await expect(page).toHaveScreenshot('save-search-focus.png', {
      clip: { x: 0, y: 0, width: 200, height: 100 }
    });
    
    // Clicked state
    await page.locator('[data-testid="save-search-button"]').click();
    await page.waitForTimeout(300);
    await expect(page).toHaveScreenshot('save-search-clicked.png', {
      clip: { x: 0, y: 0, width: 200, height: 100 }
    });
  });

  test('Dark mode marketplace visual test', async ({ page }) => {
    // Set dark mode preference
    await page.emulateMedia({ colorScheme: 'dark' });
    
    // Navigate to marketplace with filters
    await page.goto('/marketplace?search=x-men&category=marvel&condition=mint');
    
    // Wait for components to load
    await page.waitForSelector('[data-testid="marketplace-container"]');
    await page.waitForSelector('[data-testid="results-summary-bar"]');
    await page.waitForLoadState('networkidle');
    
    // Take dark mode screenshot
    await expect(page).toHaveScreenshot('marketplace-dark-mode.png', {
      fullPage: true,
      animations: 'disabled'
    });
    
    // Test mobile dark mode
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    await expect(page).toHaveScreenshot('marketplace-dark-mode-mobile.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('Accessibility visual indicators', async ({ page }) => {
    await page.goto('/marketplace?search=batman&category=dc&condition=fine');
    
    // Wait for components
    await page.waitForSelector('[data-testid="results-summary-bar"]');
    
    // Tab through filter chips to show focus indicators
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab'); // Should be on first filter chip
    
    await expect(page).toHaveScreenshot('accessibility-focus-indicators.png');
    
    // Test high contrast mode simulation
    await page.addStyleTag({
      content: `
        * {
          filter: contrast(200%) !important;
        }
      `
    });
    
    await expect(page).toHaveScreenshot('accessibility-high-contrast.png');
  });

  test('Loading states visual test', async ({ page }) => {
    // Intercept API calls to simulate loading
    await page.route('**/api/marketplace/**', async route => {
      await page.waitForTimeout(2000); // Simulate slow API
      await route.continue();
    });
    
    // Navigate and capture loading state
    const navigation = page.goto('/marketplace?search=superman&category=dc');
    
    // Wait for loading spinner to appear
    await page.waitForSelector('[data-testid="loading-spinner"]', { timeout: 1000 });
    
    // Take screenshot of loading state
    await expect(page).toHaveScreenshot('marketplace-loading-state.png');
    
    // Wait for navigation to complete
    await navigation;
    await page.waitForSelector('[data-testid="results-summary-bar"]');
    
    // Take screenshot of loaded state
    await expect(page).toHaveScreenshot('marketplace-loaded-state.png');
  });
});