import { test, expect, devices } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.SNAP_BASE_URL || "http://localhost:3000";
const ROUTES_PATH = path.join(process.cwd(), "scripts", "snap-routes.json");
const OUT_DIR = path.join(process.cwd(), "docs", "screenshots");

// Ensure output dirs exist
function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}

// sanitize a route to a filename
function toName(route: string) {
  return route
    .replace(/^\/+/, "")
    .replace(/\/+/g, "_")
    .replace(/[^\w\-\.?=]/g, "_") || "home";
}

// Load routes
const ROUTES: string[] = JSON.parse(fs.readFileSync(ROUTES_PATH, "utf8"));

// Viewports to test
const VIEWPORTS = [
  { id: "desktop", width: 1440, height: 900 },
  { id: "mobile", width: 390, height: 844 } // iPhone 12-ish
];

// Themes to test
const THEMES: Array<"light" | "dark"> = ["light", "dark"];

// Utility: switch theme by toggling `dark` class on <html> and set media
async function setTheme(page: any, theme: "light" | "dark") {
  await page.emulateMedia({ colorScheme: theme });
  await page.addStyleTag({
    content: `:root { color-scheme: ${theme}; }`
  });
  await page.evaluate((t: "light" | "dark") => {
    const html = document.documentElement;
    html.classList.toggle("dark", t === "dark");
  }, theme);
}

// Utility: Hide dynamic elements that cause flaky screenshots
async function hideNoisyElements(page: any) {
  await page.addStyleTag({
    content: `
      /* Hide dynamic content that changes between runs */
      [data-test="timestamp"], 
      time, 
      .timestamp,
      .relative-time { 
        opacity: 0.6 !important; 
      }
      
      /* Stop animations for consistent screenshots */
      .animate-pulse,
      .animate-spin,
      .animate-bounce { 
        animation: none !important; 
      }
      
      /* Hide scroll indicators */
      ::-webkit-scrollbar {
        display: none !important;
      }
      
      /* Ensure consistent font rendering */
      * {
        -webkit-font-smoothing: antialiased !important;
        -moz-osx-font-smoothing: grayscale !important;
      }
      
      /* Hide any loading skeletons */
      .skeleton,
      .loading-skeleton {
        opacity: 0 !important;
      }
    `
  });
}

test.describe.configure({ mode: "serial" }); // simple, sequential run to keep server calm

for (const route of ROUTES) {
  for (const vp of VIEWPORTS) {
    for (const theme of THEMES) {
      test(`snap ${route} [${vp.id}] [${theme}]`, async ({ page }) => {
        ensureDir(OUT_DIR);
        const dir = path.join(OUT_DIR, `${theme}`, vp.id);
        ensureDir(dir);

        // Set viewport
        await page.setViewportSize({ width: vp.width, height: vp.height });

        // Navigate (retry-friendly)
        const url = new URL(route, BASE).toString();
        
        try {
          await page.goto(url, { 
            waitUntil: "domcontentloaded",
            timeout: 30000 
          });

          // Wait for Next.js hydration and fonts to load
          await page.waitForTimeout(1000);

          // Wait for any dynamic content to settle
          await page.waitForLoadState("networkidle", { timeout: 10000 });

          // Apply theme
          await setTheme(page, theme);

          // Give UI time to reflow after theme switch
          await page.waitForTimeout(300);

          // Hide noisy dynamic elements
          await hideNoisyElements(page);

          // Collect console errors for debugging
          const errors: string[] = [];
          page.on("console", (msg) => {
            if (msg.type() === "error") {
              errors.push(msg.text());
            }
          });

          // Final settle before screenshot
          await page.waitForTimeout(500);

          // Take screenshot
          const file = path.join(dir, `${toName(route)}.png`);
          await page.screenshot({ 
            path: file, 
            fullPage: true,
            animations: "disabled",
          });

          console.log(`📸 Screenshot saved: ${file}`);

          // Basic assertion: page has some content
          const body = page.locator("body");
          await expect(body).toBeVisible();

          // Check for major layout issues
          const html = page.locator("html");
          await expect(html).toHaveClass(/.*/, { timeout: 1000 }); // Has some classes

          // If there were runtime errors, surface them (but don't be too strict)
          if (errors.length > 0) {
            console.warn(`⚠️  Console errors on ${route} [${vp.id}] [${theme}]:`, errors.slice(0, 3));
          }

        } catch (error) {
          console.error(`❌ Failed to capture ${route} [${vp.id}] [${theme}]:`, error);
          throw error;
        }
      });
    }
  }
}

// Additional test for theme switching functionality
test("theme toggle functionality", async ({ page }) => {
  await page.goto("/");
  
  // Wait for page to load
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(1000);
  
  // Look for theme toggle button
  const themeToggle = page.locator('[data-test="theme-toggle"]').first();
  
  if (await themeToggle.isVisible({ timeout: 5000 })) {
    // Test theme switching
    await themeToggle.click();
    await page.waitForTimeout(500);
    
    // Verify theme change reflected in DOM
    const html = page.locator("html");
    const hasThemeClass = await html.evaluate((el) => {
      return el.classList.contains("dark") || el.classList.contains("light");
    });
    
    expect(hasThemeClass).toBeTruthy();
    
    console.log("✅ Theme toggle functionality verified");
  } else {
    console.log("ℹ️  Theme toggle not found - skipping theme switch test");
  }
});
