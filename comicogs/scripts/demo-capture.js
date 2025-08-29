#!/usr/bin/env node

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function captureScreenshots() {
  console.log('🚀 Starting demo capture...');
  
  // Create docs/captures directory
  const capturesDir = path.join(__dirname, '..', 'docs', 'captures');
  if (!fs.existsSync(capturesDir)) {
    fs.mkdirSync(capturesDir, { recursive: true });
  }

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  // Screenshots to capture
  const screenshots = [
    {
      url: '/',
      name: 'homepage',
      description: 'Homepage with hero section and features'
    },
    {
      url: '/marketplace',
      name: 'marketplace',
      description: 'Comic marketplace with listings grid'
    },
    {
      url: '/vault',
      name: 'vault',
      description: 'User collection management interface'
    },
    {
      url: '/wishlist',
      name: 'wishlist',
      description: 'User wishlist with wanted comics'
    },
    {
      url: '/account/saved-searches',
      name: 'saved-searches',
      description: 'Saved search alerts management'
    }
  ];

  const results = [];

  for (const shot of screenshots) {
    try {
      console.log(`📸 Capturing ${shot.name}...`);
      
      await page.goto(`http://localhost:3000${shot.url}`, {
        waitUntil: 'networkidle'
      });

      // Wait for any animations to complete
      await page.waitForTimeout(2000);

      // Disable animations for consistent screenshots
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

      // Take screenshot
      const screenshotPath = path.join(capturesDir, `${shot.name}.png`);
      await page.screenshot({
        path: screenshotPath,
        fullPage: true
      });

      results.push({
        ...shot,
        path: screenshotPath,
        relativePath: `docs/captures/${shot.name}.png`,
        success: true
      });

      console.log(`✅ Captured ${shot.name} → ${shot.name}.png`);
    } catch (error) {
      console.error(`❌ Failed to capture ${shot.name}:`, error.message);
      results.push({
        ...shot,
        success: false,
        error: error.message
      });
    }
  }

  await browser.close();

  // Generate documentation
  const readme = generateReadmeSection(results);
  const readmePath = path.join(capturesDir, 'README.md');
  fs.writeFileSync(readmePath, readme);

  console.log(`\n📝 Generated documentation: ${readmePath}`);
  console.log(`\n🎉 Demo capture complete! Captured ${results.filter(r => r.success).length}/${results.length} screenshots`);

  return results;
}

function generateReadmeSection(results) {
  const successfulCaptures = results.filter(r => r.success);
  
  let markdown = `# Comicogs Demo Screenshots

Generated on: ${new Date().toISOString()}

## Interface Screenshots

`;

  successfulCaptures.forEach(capture => {
    markdown += `### ${capture.name.charAt(0).toUpperCase() + capture.name.slice(1).replace('-', ' ')}\n\n`;
    markdown += `${capture.description}\n\n`;
    markdown += `![${capture.description}](${capture.name}.png)\n\n`;
  });

  markdown += `## Usage

These screenshots are automatically generated and can be embedded in documentation:

\`\`\`markdown
![Comicogs Homepage](docs/captures/homepage.png)
\`\`\`

## Regenerating Screenshots

To update these screenshots:

\`\`\`bash
npm run demo:capture
\`\`\`

## Notes

- Screenshots are captured at 1280x720 resolution
- Animations are disabled for consistency
- Full page screenshots include all content
- Images are optimized for documentation use
`;

  return markdown;
}

// Add script to package.json
function addScriptToPackageJson() {
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    if (!packageJson.scripts) {
      packageJson.scripts = {};
    }
    
    packageJson.scripts['demo:capture'] = 'node scripts/demo-capture.js';
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('✅ Added demo:capture script to package.json');
  }
}

if (require.main === module) {
  captureScreenshots()
    .then(() => {
      addScriptToPackageJson();
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Demo capture failed:', error);
      process.exit(1);
    });
}

module.exports = { captureScreenshots, generateReadmeSection };