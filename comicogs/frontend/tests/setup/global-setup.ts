import { chromium } from '@playwright/test'

async function globalSetup() {
  console.log('🔧 Setting up Playwright tests...')
  
  // Launch browser for setup
  const browser = await chromium.launch()
  const page = await browser.newPage()
  
  try {
    // Wait for server to be ready
    console.log('⏳ Waiting for development server...')
    await page.goto(process.env.BASE_URL || 'http://localhost:3000', {
      waitUntil: 'networkidle',
      timeout: 60000
    })
    
    console.log('✅ Development server is ready')
    
    // Set up test data if needed
    // await setupTestData(page)
    
  } catch (error) {
    console.error('❌ Global setup failed:', error)
    throw error
  } finally {
    await browser.close()
  }
}

export default globalSetup