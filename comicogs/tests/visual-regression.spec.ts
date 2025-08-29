import { test, expect } from '@playwright/test';

test.describe('Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Wait for any animations to complete
    await page.waitForTimeout(1000);
  });

  test('Homepage renders correctly', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    
    // Hide dynamic content that might change
    await page.addStyleTag({
      content: `
        [data-testid="timestamp"], 
        .animate-pulse, 
        .motion-safe\\:animate-pulse {
          animation: none !important;
          opacity: 1 !important;
        }
      `
    });
    
    // Take screenshot of the full page
    await expect(page).toHaveScreenshot('homepage.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('Vault page renders correctly', async ({ page }) => {
    await page.goto('/vault');
    await page.waitForLoadState('networkidle');
    
    // Disable animations
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
      `
    });
    
    await expect(page).toHaveScreenshot('vault-page.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('Marketplace with filters open', async ({ page }) => {
    await page.goto('/marketplace');
    await page.waitForLoadState('networkidle');
    
    // Open filters if they exist
    const filtersButton = page.locator('[data-testid="filters-toggle"], button:has-text("Filters")').first();
    if (await filtersButton.isVisible()) {
      await filtersButton.click();
      await page.waitForTimeout(500); // Wait for filter panel to open
    }
    
    // Disable animations
    await page.addStyleTag({
      content: `
        * { animation: none !important; transition: none !important; }
      `
    });
    
    await expect(page).toHaveScreenshot('marketplace-filters-open.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('Listing detail page renders correctly', async ({ page }) => {
    // First go to marketplace to get a listing
    await page.goto('/marketplace');
    await page.waitForLoadState('networkidle');
    
    // Look for the first listing link
    const firstListing = page.locator('a[href*="/listing/"], a[href*="/comics/"]').first();
    
    if (await firstListing.isVisible()) {
      await firstListing.click();
      await page.waitForLoadState('networkidle');
      
      // Disable animations
      await page.addStyleTag({
        content: `
          * { animation: none !important; transition: none !important; }
        `
      });
      
      await expect(page).toHaveScreenshot('listing-detail.png', {
        fullPage: true,
        animations: 'disabled'
      });
    } else {
      // If no listings available, take screenshot of empty state
      await expect(page).toHaveScreenshot('marketplace-empty.png', {
        fullPage: true,
        animations: 'disabled'
      });
    }
  });

  test('Wishlist page renders correctly', async ({ page }) => {
    await page.goto('/wishlist');
    await page.waitForLoadState('networkidle');
    
    // Disable animations
    await page.addStyleTag({
      content: `
        * { animation: none !important; transition: none !important; }
      `
    });
    
    await expect(page).toHaveScreenshot('wishlist-page.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('Saved searches page renders correctly', async ({ page }) => {
    await page.goto('/account/saved-searches');
    await page.waitForLoadState('networkidle');
    
    // Disable animations
    await page.addStyleTag({
      content: `
        * { animation: none !important; transition: none !important; }
      `
    });
    
    await expect(page).toHaveScreenshot('saved-searches.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('Navigation components render correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of just the navigation area
    const navbar = page.locator('nav, header').first();
    if (await navbar.isVisible()) {
      await expect(navbar).toHaveScreenshot('navbar.png', {
        animations: 'disabled'
      });
    }
  });

  test('Footer components render correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    
    // Take screenshot of footer
    const footer = page.locator('footer').first();
    if (await footer.isVisible()) {
      await expect(footer).toHaveScreenshot('footer.png', {
        animations: 'disabled'
      });
    }
  });

  // Mobile-specific visual tests
  test('Mobile homepage renders correctly', async ({ page, browserName }) => {
    // Only run on mobile projects
    test.skip(browserName !== 'chromium' || !page.viewportSize()?.width || page.viewportSize()?.width > 500);
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Disable animations
    await page.addStyleTag({
      content: `
        * { animation: none !important; transition: none !important; }
      `
    });
    
    await expect(page).toHaveScreenshot('mobile-homepage.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('Mobile navigation menu renders correctly', async ({ page, browserName }) => {
    // Only run on mobile projects
    test.skip(browserName !== 'chromium' || !page.viewportSize()?.width || page.viewportSize()?.width > 500);
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Open mobile menu
    const menuButton = page.locator('button[aria-label*="menu"], button:has-text("Menu")').first();
    if (await menuButton.isVisible()) {
      await menuButton.click();
      await page.waitForTimeout(500);
      
      await expect(page).toHaveScreenshot('mobile-menu-open.png', {
        animations: 'disabled'
      });
    }
  });
});

test.describe('Component Visual Tests', () => {
  test('Upload component renders correctly', async ({ page }) => {
    // Create a test page with upload component
    await page.goto('/');
    
    // If there's an upload component on any page, test it
    const uploadArea = page.locator('[data-testid="upload-drop"], .upload-area, input[type="file"]').first();
    if (await uploadArea.isVisible()) {
      await expect(uploadArea).toHaveScreenshot('upload-component.png', {
        animations: 'disabled'
      });
    }
  });

  test('Search filters render correctly', async ({ page }) => {
    await page.goto('/marketplace');
    await page.waitForLoadState('networkidle');
    
    // Look for filter components
    const filters = page.locator('[data-testid="filters"], .filters, .search-filters').first();
    if (await filters.isVisible()) {
      await expect(filters).toHaveScreenshot('search-filters.png', {
        animations: 'disabled'
      });
    }
  });

  test('Loading states render correctly', async ({ page }) => {
    await page.goto('/marketplace');
    
    // Try to capture loading state (this might be quick)
    const loadingSpinner = page.locator('.animate-spin, .loading, [data-testid="loading"]').first();
    if (await loadingSpinner.isVisible()) {
      await expect(loadingSpinner).toHaveScreenshot('loading-spinner.png', {
        animations: 'disabled'
      });
    }
  });
});
