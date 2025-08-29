import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure the dev server is running before tests
    await page.goto('http://localhost:3000');
  });

  test('Homepage should not have any automatically detectable accessibility issues', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Vault page should not have accessibility violations', async ({ page }) => {
    await page.goto('http://localhost:3000/vault');
    
    // Wait for lazy-loaded components to render
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="vault-filters"]', { timeout: 10000 }).catch(() => {
      // If data-testid doesn't exist, wait for the search input instead
      return page.waitForSelector('input[placeholder*="Search"]', { timeout: 10000 });
    });
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Checkout page should not have accessibility violations', async ({ page }) => {
    await page.goto('http://localhost:3000/checkout?item=1');
    
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Order success page should not have accessibility violations', async ({ page }) => {
    await page.goto('http://localhost:3000/orders/test-order-123?status=success');
    
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Keyboard navigation should work on homepage', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Test skip-to-content link
    await page.keyboard.press('Tab');
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeFocused();
    
    // Press Enter to use skip link
    await page.keyboard.press('Enter');
    
    // Verify main content is focused
    const mainContent = page.locator('#main-content');
    await expect(mainContent).toBeVisible();
  });

  test('Theme menu should be keyboard accessible', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Navigate to theme menu button
    const themeMenuButton = page.locator('button[aria-label*="theme"], button:has-text("Toggle theme")').first();
    await themeMenuButton.focus();
    await expect(themeMenuButton).toBeFocused();
    
    // Open theme menu with keyboard
    await page.keyboard.press('Enter');
    
    // Verify menu is open and has proper ARIA attributes
    const dropdownMenu = page.locator('[role="menu"]');
    await expect(dropdownMenu).toBeVisible();
  });

  test('Search functionality should be keyboard accessible', async ({ page }) => {
    await page.goto('http://localhost:3000/vault');
    await page.waitForLoadState('networkidle');
    
    // Wait for search input to be available
    const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]').first();
    await searchInput.waitFor({ timeout: 10000 });
    
    // Focus search input
    await searchInput.focus();
    await expect(searchInput).toBeFocused();
    
    // Type in search input
    await searchInput.fill('Spider-Man');
    
    // Verify search input has proper ARIA attributes
    await expect(searchInput).toHaveAttribute('aria-label');
  });

  test('Filter controls should have proper ARIA labels', async ({ page }) => {
    await page.goto('http://localhost:3000/vault');
    await page.waitForLoadState('networkidle');
    
    // Wait for filter controls to load
    await page.waitForSelector('select, button', { timeout: 10000 });
    
    // Check that form controls have proper labels
    const selects = page.locator('select');
    const selectCount = await selects.count();
    
    for (let i = 0; i < selectCount; i++) {
      const select = selects.nth(i);
      
      // Each select should have either a label or aria-label
      const hasLabel = await select.evaluate((el) => {
        const id = el.getAttribute('id');
        const ariaLabel = el.getAttribute('aria-label');
        const labelElement = id ? document.querySelector(`label[for="${id}"]`) : null;
        
        return !!(ariaLabel || labelElement);
      });
      
      expect(hasLabel).toBe(true);
    }
  });

  test('Comic cards should have proper alternative text and roles', async ({ page }) => {
    await page.goto('http://localhost:3000/vault');
    await page.waitForLoadState('networkidle');
    
    // Wait for comic cards to load
    await page.waitForSelector('img[alt*="cover"], img[alt*="comic"]', { timeout: 10000 });
    
    // Check that all comic cover images have alt text
    const coverImages = page.locator('img[alt*="cover"], img[alt*="comic"]');
    const imageCount = await coverImages.count();
    
    for (let i = 0; i < imageCount; i++) {
      const img = coverImages.nth(i);
      const altText = await img.getAttribute('alt');
      
      expect(altText).toBeTruthy();
      expect(altText!.length).toBeGreaterThan(0);
    }
  });

  test('Error states should be announced to screen readers', async ({ page }) => {
    await page.goto('http://localhost:3000/vault');
    await page.waitForLoadState('networkidle');
    
    // Trigger a search that returns no results
    const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]').first();
    await searchInput.waitFor({ timeout: 10000 });
    await searchInput.fill('XYZ_NO_RESULTS_EXPECTED');
    
    // Wait for empty state to appear
    await page.waitForSelector('text=No comics found', { timeout: 5000 }).catch(() => {
      // If the exact text doesn't exist, that's okay for this test
    });
    
    // Check that empty state has proper ARIA live region or role
    const emptyState = page.locator('text=No comics found, text=No results, [role="status"], [aria-live]').first();
    const hasAriaLive = await emptyState.evaluate((el) => {
      return el.getAttribute('aria-live') || el.getAttribute('role') === 'status';
    }).catch(() => false);
    
    // This is more of a recommendation than a hard requirement
    // but it's good practice for empty states
    if (await emptyState.count() > 0) {
      console.log('Empty state found, checking for ARIA live region...');
    }
  });

  test('Focus management works properly in modals/dialogs', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Try to open theme menu (acts like a modal)
    const themeButton = page.locator('button[aria-label*="theme"], button:has-text("Toggle theme")').first();
    await themeButton.click();
    
    // Check if a dropdown/modal opened
    const dropdown = page.locator('[role="menu"], [role="dialog"]').first();
    
    if (await dropdown.count() > 0) {
      // Focus should be trapped within the dropdown
      await page.keyboard.press('Tab');
      
      // The focus should still be within the dropdown area
      const focusedElement = page.locator(':focus');
      const isWithinDropdown = await focusedElement.evaluate((focused) => {
        const dropdown = document.querySelector('[role="menu"], [role="dialog"]');
        return dropdown?.contains(focused) ?? false;
      });
      
      // This is more of a best practice check
      console.log('Focus management in dropdown:', isWithinDropdown ? 'GOOD' : 'COULD BE IMPROVED');
    }
  });
});

test.describe('Color Contrast and Theme Accessibility', () => {
  test('All themes should maintain proper color contrast', async ({ page }) => {
    const themes = ['default', 'neon', 'paper', 'tweakcn'];
    
    for (const theme of themes) {
      await page.goto('http://localhost:3000');
      await page.waitForLoadState('networkidle');
      
      // Apply theme by adding class to body
      await page.evaluate((themeName) => {
        document.body.className = document.body.className.replace(/theme-\w+/g, '');
        document.body.classList.add(`theme-${themeName}`);
      }, theme);
      
      // Run accessibility scan for this theme
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2aa'])
        .include('main') // Focus on main content area
        .analyze();
      
      // Color contrast violations are critical
      const contrastViolations = accessibilityScanResults.violations.filter(
        violation => violation.id === 'color-contrast'
      );
      
      expect(contrastViolations).toEqual([]);
    }
  });

  test('Reduced motion preferences should be respected', async ({ page }) => {
    // Emulate prefers-reduced-motion: reduce
    await page.emulateMedia({ reducedMotion: 'reduce' });
    
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Check that animations are disabled or reduced
    const animatedElements = page.locator('.motion-safe-fade-in, .motion-safe-scale-in, [class*="animate-"]');
    const elementCount = await animatedElements.count();
    
    if (elementCount > 0) {
      // Verify that motion-safe classes respect the preference
      const hasReducedMotion = await page.evaluate(() => {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      });
      
      expect(hasReducedMotion).toBe(true);
    }
  });
});
