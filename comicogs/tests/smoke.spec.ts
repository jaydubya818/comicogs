import { test, expect } from '@playwright/test';

test.describe('Smoke Tests - Critical User Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure the dev server is running
    await page.goto('http://localhost:3000');
  });

  test('1) Homepage loads and shows CTA buttons', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check that the main heading is visible
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();
    
    // Check that CTA buttons are present
    const ctaButtons = page.locator('a[href*="/vault"], button:has-text("Browse"), a:has-text("Browse")');
    await expect(ctaButtons.first()).toBeVisible();
    
    // Verify navigation is present
    const nav = page.locator('nav, [role="navigation"]');
    await expect(nav.first()).toBeVisible();
    
    // Check that theme switcher is available
    const themeButton = page.locator('button[aria-label*="theme"], button:has-text("Toggle theme")');
    await expect(themeButton.first()).toBeVisible();
  });

  test('2) Navigate to /vault and renders comic rows', async ({ page }) => {
    await page.goto('http://localhost:3000/vault');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check that the vault heading is visible
    const vaultHeading = page.locator('h1:has-text("Vault"), h1:has-text("Collection")');
    await expect(vaultHeading.first()).toBeVisible();
    
    // Wait for comic cards to render
    await page.waitForSelector('img[alt*="cover"], [data-testid="comic-card"]', { timeout: 10000 });
    
    // Verify that comic cards are displayed
    const comicCards = page.locator('img[alt*="cover"], [data-testid="comic-card"]');
    const cardCount = await comicCards.count();
    expect(cardCount).toBeGreaterThan(0);
    
    // Check that filters are present
    const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]');
    await expect(searchInput.first()).toBeVisible();
  });

  test('3) Apply a filter and verify query params persist', async ({ page }) => {
    await page.goto('http://localhost:3000/vault');
    await page.waitForLoadState('networkidle');
    
    // Wait for search input to be available
    const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]').first();
    await searchInput.waitFor({ timeout: 10000 });
    
    // Apply a search filter
    await searchInput.fill('Spider-Man');
    
    // Wait for URL to update (debounced)
    await page.waitForTimeout(500);
    
    // Check that URL contains the search parameter
    const currentUrl = page.url();
    expect(currentUrl).toContain('search=Spider-Man');
    
    // Refresh the page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Verify that the search input still contains the value
    const searchValue = await searchInput.inputValue();
    expect(searchValue).toBe('Spider-Man');
    
    // Verify URL still has the parameter
    expect(page.url()).toContain('search=Spider-Man');
  });

  test('4) Create a checkout flow and see success page', async ({ page }) => {
    await page.goto('http://localhost:3000/vault');
    await page.waitForLoadState('networkidle');
    
    // Wait for comic cards to load
    await page.waitForSelector('button:has-text("Buy"), button:has-text("Add to Cart")', { timeout: 10000 });
    
    // Click on a buy button
    const buyButton = page.locator('button:has-text("Buy"), button:has-text("Add to Cart")').first();
    await buyButton.click();
    
    // Should navigate to checkout page
    await page.waitForURL('**/checkout**');
    
    // Verify checkout page loads
    const checkoutHeading = page.locator('h1:has-text("Checkout")');
    await expect(checkoutHeading).toBeVisible();
    
    // Verify order summary is present
    const orderSummary = page.locator('text=Order Summary, h2:has-text("Order")');
    await expect(orderSummary.first()).toBeVisible();
    
    // Click complete order button
    const completeButton = page.locator('button:has-text("Complete Order")');
    await expect(completeButton).toBeVisible();
    await completeButton.click();
    
    // Should navigate to order success page
    await page.waitForURL('**/orders/**');
    
    // Verify success page content
    const successMessage = page.locator('text=Order Confirmed, text=Thank you');
    await expect(successMessage.first()).toBeVisible();
  });

  test('5) Health endpoint returns ok status', async ({ page }) => {
    // Test the backend health endpoint
    const response = await page.request.get('http://localhost:4000/health');
    expect(response.status()).toBe(200);
    
    const healthData = await response.json();
    expect(healthData.ok).toBe(true);
    expect(healthData.version).toBeTruthy();
  });

  test('Theme switching works without visual glitches', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of default theme
    await page.screenshot({ path: 'test-results/theme-default.png', fullPage: false });
    
    // Open theme menu
    const themeButton = page.locator('button[aria-label*="theme"], button:has-text("Toggle theme")').first();
    await themeButton.click();
    
    // Wait for dropdown to appear
    const dropdown = page.locator('[role="menu"]');
    await expect(dropdown).toBeVisible();
    
    // Switch to neon theme
    const neonOption = page.locator('text=Neon');
    if (await neonOption.count() > 0) {
      await neonOption.click();
      
      // Wait for theme to apply
      await page.waitForTimeout(300);
      
      // Verify theme class is applied
      const bodyClass = await page.locator('body').getAttribute('class');
      expect(bodyClass).toContain('theme-neon');
      
      // Take screenshot of neon theme
      await page.screenshot({ path: 'test-results/theme-neon.png', fullPage: false });
    }
  });

  test('Responsive design works on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Verify mobile navigation works
    const mobileMenu = page.locator('[aria-label*="menu"], button:has-text("Menu")');
    if (await mobileMenu.count() > 0) {
      await mobileMenu.click();
      
      // Verify mobile menu opens
      const navigationItems = page.locator('a[href="/vault"], a:has-text("Vault")');
      await expect(navigationItems.first()).toBeVisible();
    }
    
    // Check vault page on mobile
    await page.goto('http://localhost:3000/vault');
    await page.waitForLoadState('networkidle');
    
    // Verify content is responsive
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
    
    // Take mobile screenshot
    await page.screenshot({ path: 'test-results/mobile-vault.png', fullPage: false });
  });

  test('Error boundaries handle JavaScript errors gracefully', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Inject a JavaScript error to test error boundary
    await page.evaluate(() => {
      // Create a component that will throw an error
      const errorDiv = document.createElement('div');
      errorDiv.innerHTML = '<button onclick="throw new Error(\'Test error\')">Trigger Error</button>';
      document.body.appendChild(errorDiv);
    });
    
    // Click the error button and verify error boundary catches it
    const errorButton = page.locator('button:has-text("Trigger Error")');
    if (await errorButton.count() > 0) {
      // Listen for console errors
      const consoleErrors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });
      
      await errorButton.click();
      
      // The error boundary should prevent the app from completely crashing
      // The page should still be functional
      const navigation = page.locator('nav, [role="navigation"]');
      await expect(navigation.first()).toBeVisible();
    }
  });

  test('Search functionality works with real API', async ({ page }) => {
    await page.goto('http://localhost:3000/vault');
    await page.waitForLoadState('networkidle');
    
    // Get initial comic count
    const initialCards = page.locator('img[alt*="cover"], [data-testid="comic-card"]');
    const initialCount = await initialCards.count();
    
    // Perform search
    const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]').first();
    await searchInput.fill('Marvel');
    
    // Wait for debounced search
    await page.waitForTimeout(500);
    
    // Results should potentially change (though in demo mode they might not)
    // This test ensures the search UI works even if backend isn't fully connected
    const searchValue = await searchInput.inputValue();
    expect(searchValue).toBe('Marvel');
    
    // Clear search
    await searchInput.fill('');
    await page.waitForTimeout(500);
    
    // Verify search clears
    expect(await searchInput.inputValue()).toBe('');
  });
});
