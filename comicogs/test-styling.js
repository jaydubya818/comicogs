const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Go to the local site
  await page.goto('http://localhost:3002');
  
  // Wait for page to load
  await page.waitForLoadState('networkidle');
  
  // Take a screenshot
  await page.screenshot({ path: 'homepage-styling-debug.png', fullPage: true });
  
  // Check if CSS is loaded
  const stylesheets = await page.$$eval('link[rel="stylesheet"]', links => 
    links.map(link => link.href)
  );
  console.log('Loaded stylesheets:', stylesheets);
  
  // Check computed styles on body
  const bodyStyles = await page.evaluate(() => {
    const body = document.body;
    const computed = window.getComputedStyle(body);
    return {
      fontFamily: computed.fontFamily,
      backgroundColor: computed.backgroundColor,
      color: computed.color,
      fontSize: computed.fontSize
    };
  });
  console.log('Body computed styles:', bodyStyles);
  
  // Check CSS variables
  const cssVars = await page.evaluate(() => {
    const computed = window.getComputedStyle(document.documentElement);
    return {
      fontSans: computed.getPropertyValue('--font-sans'),
      background: computed.getPropertyValue('--background'),
      foreground: computed.getPropertyValue('--foreground'),
      primary: computed.getPropertyValue('--primary')
    };
  });
  console.log('CSS variables:', cssVars);
  
  await browser.close();
})();
