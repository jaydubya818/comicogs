import { test, expect } from '@playwright/test'
import { injectAxe, checkA11y } from 'axe-playwright'

test.describe('Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Inject axe-core into every page
    await injectAxe(page)
  })

  test('Homepage accessibility', async ({ page }) => {
    await page.goto('/')
    
    // Wait for page to load
    await page.waitForLoadState('networkidle')
    
    // Run accessibility check
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true }
    })
  })

  test('Collection page accessibility', async ({ page }) => {
    await page.goto('/collection')
    await page.waitForLoadState('networkidle')
    await checkA11y(page)
  })

  test('Search page accessibility', async ({ page }) => {
    await page.goto('/search')
    await page.waitForLoadState('networkidle')
    await checkA11y(page)
  })

  test('Marketplace accessibility', async ({ page }) => {
    await page.goto('/marketplace')
    await page.waitForLoadState('networkidle')
    await checkA11y(page)
  })

  test('Login form accessibility', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    
    // Check form has proper labels
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    
    await checkA11y(page)
  })

  test('Keyboard navigation', async ({ page }) => {
    await page.goto('/')
    
    // Test tab navigation
    await page.keyboard.press('Tab')
    const focusedElement = await page.locator(':focus')
    await expect(focusedElement).toBeVisible()
    
    // Check skip link functionality
    await page.keyboard.press('Tab')
    const skipLink = page.getByText(/skip to main content/i)
    if (await skipLink.isVisible()) {
      await skipLink.click()
      const mainContent = page.locator('main')
      await expect(mainContent).toBeFocused()
    }
  })

  test('Color contrast', async ({ page }) => {
    await page.goto('/')
    await checkA11y(page, null, {
      rules: {
        'color-contrast': { enabled: true }
      }
    })
  })

  test('Error page accessibility', async ({ page }) => {
    // Navigate to non-existent page to trigger 404
    await page.goto('/non-existent-page')
    await page.waitForLoadState('networkidle')
    
    // Check error page is accessible
    await expect(page.getByRole('heading', { name: /page not found/i })).toBeVisible()
    await checkA11y(page)
  })

  test('Onboarding modal accessibility', async ({ page }) => {
    // This would need to be triggered based on your onboarding logic
    await page.goto('/?onboarding=true')
    
    // Check if modal appears and is accessible
    const modal = page.getByRole('dialog')
    if (await modal.isVisible()) {
      // Check focus trap
      await page.keyboard.press('Tab')
      const focusedElement = await page.locator(':focus')
      expect(await modal.locator('*').contains(focusedElement).count()).toBeGreaterThan(0)
      
      await checkA11y(page)
    }
  })
})