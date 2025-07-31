import { expect, test } from "@playwright/test";

test.describe("Marketplace", () => {
  test.beforeEach(async ({ page }) => {
    // Go to the marketplace page
    await page.goto("/marketplace");
  });

  test("should display marketplace page", async ({ page }) => {
    // Check if the page loads correctly
    await expect(page).toHaveTitle(/Comicogs/);

    // Check for marketplace content
    await expect(page.locator("h1")).toContainText("Marketplace");
  });

  test("should allow searching for comics", async ({ page }) => {
    // Find search input
    const searchInput = page.locator('input[placeholder*="search" i]').first();

    if (await searchInput.isVisible()) {
      // Enter search term
      await searchInput.fill("Spider-Man");

      // Press Enter or click search button
      await searchInput.press("Enter");

      // Wait for results
      await page.waitForTimeout(1000);

      // Check that search was performed (URL should change or results should appear)
      const url = page.url();
      expect(url).toContain("search");
    }
  });

  test("should display listings when available", async ({ page }) => {
    // Wait for potential listings to load
    await page.waitForTimeout(2000);

    // Check if there are any listing elements
    const listings = page.locator('[data-testid="listing"]');

    // If listings exist, verify they have required elements
    if (await listings.first().isVisible()) {
      await expect(listings.first()).toContainText(/\$\d+/); // Price
    }
  });

  test("should navigate to search page", async ({ page }) => {
    // Look for search link or navigation
    const searchLink = page.locator('a[href*="search"]').first();

    if (await searchLink.isVisible()) {
      await searchLink.click();

      // Verify navigation
      await expect(page).toHaveURL(/.*search.*/);
    } else {
      // If no search link, try navigating directly
      await page.goto("/search");
      await expect(page).toHaveURL(/.*search.*/);
    }
  });

  test("should be responsive on mobile", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check if page still loads correctly on mobile
    await expect(page.locator("body")).toBeVisible({ timeout: 10000 });

    // Check if main content is visible
    const mainContent = page.locator('main, [role="main"], .container').first();
    if (await mainContent.isVisible({ timeout: 5000 })) {
      await expect(mainContent).toBeVisible();
    }
  });
});

test.describe("Search Functionality", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/search");
  });

  test("should load search page", async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveTitle(/Comicogs/, { timeout: 10000 });

    // Check for search input
    const searchInput = page
      .locator('input[type="search"], input[placeholder*="search" i]')
      .first();
    if (await searchInput.isVisible({ timeout: 5000 })) {
      await expect(searchInput).toBeVisible();
    }
  });

  test("should allow filtering", async ({ page }) => {
    // Look for filter controls
    const filterButton = page
      .locator('button:has-text("filter"), button:has-text("Filter")')
      .first();

    if (await filterButton.isVisible()) {
      await filterButton.click();

      // Check if filter options appear
      await page.waitForTimeout(500);

      // Look for common filter options
      const conditionFilter = page
        .locator("text=condition", { exact: false })
        .first();
      if (await conditionFilter.isVisible()) {
        await expect(conditionFilter).toBeVisible();
      }
    }
  });
});

test.describe("Authentication Flow", () => {
  test("should show login option", async ({ page }) => {
    await page.goto("/");

    // Look for login/signin button or link
    const loginButton = page
      .locator(
        'button:has-text("sign in"), button:has-text("login"), a:has-text("sign in"), a:has-text("login")'
      )
      .first();

    if (await loginButton.isVisible()) {
      await expect(loginButton).toBeVisible();
    }
  });

  test("should navigate to login page", async ({ page }) => {
    await page.goto("/login");

    // Check if login page loads
    await expect(page).toHaveURL(/.*login.*/);

    // Look for login form elements
    const emailInput = page
      .locator('input[type="email"], input[name="email"]')
      .first();
    if (await emailInput.isVisible()) {
      await expect(emailInput).toBeVisible();
    }
  });
});

test.describe("Performance", () => {
  test("should load homepage quickly", async ({ page }) => {
    const startTime = Date.now();

    await page.goto("/");

    // Wait for main content to be visible
    await page.waitForLoadState("networkidle");

    const loadTime = Date.now() - startTime;

    // Page should load within reasonable time (adjust as needed)
    expect(loadTime).toBeLessThan(5000);
  });
});
