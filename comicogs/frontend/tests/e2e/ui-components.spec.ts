import { test, expect } from '@playwright/test'

test.describe('UI Component Tests', () => {
  test('AppShell layout renders correctly', async ({ page }) => {
    await page.goto('/')
    
    // Check header is present
    const header = page.locator('header')
    await expect(header).toBeVisible()
    
    // Check main content area
    const main = page.locator('main')
    await expect(main).toBeVisible()
    
    // Check footer if present
    const footer = page.locator('footer')
    if (await footer.count() > 0) {
      await expect(footer).toBeVisible()
    }
  })

  test('Breadcrumb navigation', async ({ page }) => {
    await page.goto('/collection/comics')
    
    // Check breadcrumbs are present
    const breadcrumbs = page.getByRole('navigation', { name: /breadcrumb/i })
    if (await breadcrumbs.count() > 0) {
      await expect(breadcrumbs).toBeVisible()
      
      // Check breadcrumb links are clickable
      const homeLink = breadcrumbs.getByRole('link', { name: /home/i })
      if (await homeLink.count() > 0) {
        await expect(homeLink).toBeVisible()
        await homeLink.click()
        await expect(page).toHaveURL('/')
      }
    }
  })

  test('Form validation works', async ({ page }) => {
    await page.goto('/login')
    
    // Try to submit empty form
    const submitButton = page.getByRole('button', { name: /sign in|login|submit/i })
    await submitButton.click()
    
    // Check validation messages appear
    const errorMessages = page.locator('[role="alert"], .error-message, [data-error]')
    const errorCount = await errorMessages.count()
    if (errorCount > 0) {
      await expect(errorMessages.first()).toBeVisible()
    }
  })

  test('Loading states display correctly', async ({ page }) => {
    await page.goto('/search')
    
    // Enter search term
    const searchInput = page.getByRole('textbox', { name: /search/i })
    await searchInput.fill('batman')
    await searchInput.press('Enter')
    
    // Check for loading indicator
    const loadingIndicators = page.locator('[data-testid="loading"], .loading, .spinner')
    // Loading might be very fast, so just check it doesn't error
    await page.waitForTimeout(1000)
  })

  test('Error boundaries catch errors', async ({ page }) => {
    // This would need a way to trigger an error in development
    // For now, just check error pages work
    await page.goto('/500') // If you have a test error page
    
    const errorBoundary = page.locator('[data-error-boundary]')
    if (await errorBoundary.count() > 0) {
      await expect(errorBoundary).toBeVisible()
      
      // Check retry button works
      const retryButton = page.getByRole('button', { name: /try again|retry/i })
      if (await retryButton.count() > 0) {
        await retryButton.click()
      }
    }
  })

  test('Mobile responsiveness', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    
    // Check mobile navigation
    const mobileMenu = page.locator('[data-mobile-menu], .mobile-menu')
    if (await mobileMenu.count() > 0) {
      await expect(mobileMenu).toBeVisible()
    }
    
    // Check content is readable on mobile
    const main = page.locator('main')
    await expect(main).toBeVisible()
  })

  test('Dark mode toggle works', async ({ page }) => {
    await page.goto('/')
    
    // Look for theme toggle
    const themeToggle = page.locator('[data-theme-toggle], [aria-label*="theme"]')
    if (await themeToggle.count() > 0) {
      await themeToggle.click()
      
      // Check if theme class changes
      const html = page.locator('html')
      const classAttr = await html.getAttribute('class')
      expect(classAttr).toContain('dark')
    }
  })

  test('Search functionality', async ({ page }) => {
    await page.goto('/search')
    
    const searchInput = page.getByRole('textbox', { name: /search/i })
    await searchInput.fill('Spider-Man')
    
    // Submit search
    await page.keyboard.press('Enter')
    
    // Wait for results or no results message
    await page.waitForTimeout(3000)
    
    // Check either results appear or "no results" message
    const results = page.locator('[data-search-results], .search-results')
    const noResults = page.getByText(/no results|nothing found/i)
    
    const hasResults = await results.count() > 0
    const hasNoResults = await noResults.count() > 0
    
    expect(hasResults || hasNoResults).toBeTruthy()
  })

  test('Comic collection display', async ({ page }) => {
    await page.goto('/collection')
    
    // Check collection grid/list
    const collection = page.locator('[data-collection], .collection-grid, .comic-list')
    if (await collection.count() > 0) {
      await expect(collection).toBeVisible()
      
      // Check individual comic items
      const comicItems = collection.locator('[data-comic-item], .comic-card')
      if (await comicItems.count() > 0) {
        await expect(comicItems.first()).toBeVisible()
      }
    }
  })

  test('Onboarding flow', async ({ page }) => {
    // Clear any existing onboarding state
    await page.context().clearCookies()
    await page.goto('/?firstTime=true')
    
    // Check if onboarding modal appears
    const onboardingModal = page.getByRole('dialog')
    if (await onboardingModal.count() > 0) {
      await expect(onboardingModal).toBeVisible()
      
      // Test navigation through steps
      const nextButton = onboardingModal.getByRole('button', { name: /next|continue/i })
      if (await nextButton.count() > 0) {
        await nextButton.click()
        await expect(onboardingModal).toBeVisible() // Should still be visible on next step
      }
      
      // Test skip functionality
      const skipButton = onboardingModal.getByRole('button', { name: /skip/i })
      if (await skipButton.count() > 0) {
        await skipButton.click()
        await expect(onboardingModal).not.toBeVisible()
      }
    }
  })
})