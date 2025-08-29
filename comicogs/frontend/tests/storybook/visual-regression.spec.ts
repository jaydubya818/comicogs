import { test, expect } from '@playwright/test';

// Stories to test for visual regression
const storiesToTest = [
  'ui-navbar--default',
  'ui-navbar--light-theme', 
  'ui-navbar--dark-theme',
  'ui-hero--default',
  'ui-listingcard--default',
  'ui-listingcard--light-theme',
  'ui-listingcard--dark-theme',
  'ui-thememenu--default',
  'example-button--primary',
  'example-button--secondary',
  'example-header--default',
  'example-page--default',
];

test.describe('Storybook Visual Regression', () => {
  storiesToTest.forEach((storyId) => {
    test(`${storyId} should match screenshot`, async ({ page }) => {
      // Navigate to the specific story
      await page.goto(`/iframe.html?id=${storyId}&viewMode=story`);
      
      // Wait for story to load
      await page.waitForSelector('[data-testid="story-container"], #storybook-root > *', { 
        timeout: 10000 
      });
      
      // Wait a bit more for animations/transitions
      await page.waitForTimeout(500);
      
      // Take screenshot of the story
      await expect(page).toHaveScreenshot(`${storyId}.png`, {
        fullPage: true,
        animations: 'disabled',
      });
    });
  });

  test.describe('Theme Switching', () => {
    test('should handle theme changes correctly', async ({ page }) => {
      await page.goto('/iframe.html?id=ui-navbar--default&viewMode=story');
      
      // Wait for story to load
      await page.waitForSelector('#storybook-root > *');
      
      // Take screenshot in light theme
      await expect(page).toHaveScreenshot('navbar-light-theme.png');
      
      // Switch to dark theme via URL parameter
      await page.goto('/iframe.html?id=ui-navbar--default&viewMode=story&globals=theme:dark');
      await page.waitForSelector('#storybook-root > *');
      await page.waitForTimeout(500);
      
      // Take screenshot in dark theme
      await expect(page).toHaveScreenshot('navbar-dark-theme.png');
    });
  });

  test.describe('Responsive Design', () => {
    const viewports = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1280, height: 720 },
    ];

    viewports.forEach(({ name, width, height }) => {
      test(`navbar should render correctly on ${name}`, async ({ page }) => {
        await page.setViewportSize({ width, height });
        await page.goto('/iframe.html?id=ui-navbar--default&viewMode=story');
        
        await page.waitForSelector('#storybook-root > *');
        await page.waitForTimeout(500);
        
        await expect(page).toHaveScreenshot(`navbar-${name}.png`);
      });
    });
  });

  test.describe('Interactive States', () => {
    test('button hover states', async ({ page }) => {
      await page.goto('/iframe.html?id=example-button--primary&viewMode=story');
      await page.waitForSelector('button');
      
      // Normal state
      await expect(page.locator('button').first()).toHaveScreenshot('button-normal.png');
      
      // Hover state
      await page.locator('button').first().hover();
      await page.waitForTimeout(200);
      await expect(page.locator('button').first()).toHaveScreenshot('button-hover.png');
      
      // Focus state
      await page.locator('button').first().focus();
      await page.waitForTimeout(200);
      await expect(page.locator('button').first()).toHaveScreenshot('button-focus.png');
    });
  });

  test.describe('Error States', () => {
    test('error components should render correctly', async ({ page }) => {
      // Test error boundary component if it exists
      await page.goto('/iframe.html?id=example-page--default&viewMode=story');
      await page.waitForSelector('#storybook-root > *');
      
      // Simulate error state by injecting error into the story
      await page.evaluate(() => {
        const errorElement = document.createElement('div');
        errorElement.className = 'error-state';
        errorElement.textContent = 'Something went wrong!';
        errorElement.style.cssText = 'color: red; padding: 16px; border: 1px solid red; border-radius: 4px;';
        document.querySelector('#storybook-root')?.appendChild(errorElement);
      });
      
      await expect(page).toHaveScreenshot('error-state.png');
    });
  });

  test.describe('Accessibility', () => {
    test('components should have proper focus indicators', async ({ page }) => {
      await page.goto('/iframe.html?id=ui-navbar--default&viewMode=story');
      await page.waitForSelector('#storybook-root > *');
      
      // Tab through focusable elements
      const focusableElements = await page.locator('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])').all();
      
      for (let i = 0; i < Math.min(focusableElements.length, 5); i++) {
        await focusableElements[i].focus();
        await page.waitForTimeout(200);
        
        // Check if focus indicator is visible
        const focusedElement = await page.locator(':focus').first();
        if (await focusedElement.count() > 0) {
          await expect(focusedElement).toHaveScreenshot(`focus-indicator-${i}.png`);
        }
      }
    });
  });

  test.describe('Content Variations', () => {
    test('components should handle different content lengths', async ({ page }) => {
      // Test with long content
      await page.goto('/iframe.html?id=ui-listingcard--default&viewMode=story');
      await page.waitForSelector('#storybook-root > *');
      
      // Inject long content
      await page.evaluate(() => {
        const card = document.querySelector('[data-testid="listing-card"], .listing-card, .card');
        if (card) {
          const title = card.querySelector('h1, h2, h3, .title');
          if (title) {
            title.textContent = 'This is a very long title that should test how the component handles text overflow and wrapping behavior in various scenarios';
          }
        }
      });
      
      await expect(page).toHaveScreenshot('long-content.png');
      
      // Test with minimal content
      await page.evaluate(() => {
        const card = document.querySelector('[data-testid="listing-card"], .listing-card, .card');
        if (card) {
          const title = card.querySelector('h1, h2, h3, .title');
          if (title) {
            title.textContent = 'Short';
          }
        }
      });
      
      await expect(page).toHaveScreenshot('short-content.png');
    });
  });
});
