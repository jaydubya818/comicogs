import { test as base, expect as baseExpect } from "@playwright/test";

export type TestFixtures = {
  loginAs: (email: string) => Promise<void>;
  api: (path: string, init?: RequestInit) => Promise<Response>;
  seedTestData: () => Promise<void>;
  clearTestData: () => Promise<void>;
};

export const test = base.extend<TestFixtures>({
  loginAs: async ({ request, context, baseURL }, use) => {
    await use(async (email: string) => {
      console.log(`🔐 Logging in as: ${email}`);
      
      const res = await request.post(`${baseURL}/api/_test/login`, {
        headers: { "content-type": "application/json" },
        data: { email }
      });
      
      if (!res.ok()) {
        const errorText = await res.text();
        throw new Error(`Test login failed for ${email}: ${res.status()} ${errorText}`);
      }
      
      // The response should set session cookies
      const responseBody = await res.json();
      console.log(`✅ Login successful for ${email}:`, responseBody);
      
      // Cookies should be automatically persisted to the context
      const cookies = await context.cookies();
      console.log(`🍪 Session cookies set:`, cookies.map(c => c.name));
    });
  },

  api: async ({ request, baseURL }, use) => {
    await use(async (path: string, init?: RequestInit) => {
      const url = `${baseURL}${path}`;
      console.log(`🌐 API call: ${init?.method || 'GET'} ${url}`);
      
      const response = await request.fetch(url, {
        ...init,
        headers: {
          'content-type': 'application/json',
          ...init?.headers,
        },
      });
      
      console.log(`📡 API response: ${response.status()}`);
      return response;
    });
  },

  seedTestData: async ({ api }, use) => {
    await use(async () => {
      console.log(`🌱 Seeding test data...`);
      
      try {
        const response = await api('/api/_test/seed', {
          method: 'POST',
          body: JSON.stringify({ reset: true }),
        });
        
        if (!response.ok()) {
          const errorText = await response.text();
          throw new Error(`Seed failed: ${response.status()} ${errorText}`);
        }
        
        const result = await response.json();
        console.log(`✅ Test data seeded:`, result);
      } catch (error) {
        console.warn(`⚠️  Seed endpoint not available, continuing without seeding:`, error);
      }
    });
  },

  clearTestData: async ({ api }, use) => {
    await use(async () => {
      console.log(`🧹 Clearing test data...`);
      
      try {
        const response = await api('/api/_test/cleanup', {
          method: 'POST',
        });
        
        if (response.ok()) {
          console.log(`✅ Test data cleared`);
        } else {
          console.log(`ℹ️  Cleanup endpoint returned ${response.status()}`);
        }
      } catch (error) {
        console.warn(`⚠️  Cleanup endpoint not available:`, error);
      }
    });
  },
});

export const expect = baseExpect;

// Helper utilities for common test patterns
export class TestHelpers {
  static async waitForToast(page: any, expectedText?: string) {
    const toast = page.getByTestId("toast").or(page.locator('.toast')).first();
    await expect(toast).toBeVisible({ timeout: 5000 });
    
    if (expectedText) {
      await expect(toast).toContainText(expectedText, { timeout: 2000 });
    }
    
    console.log(`🍞 Toast appeared: ${expectedText || 'unspecified text'}`);
    return toast;
  }

  static async waitForPageLoad(page: any, path?: string) {
    if (path) {
      await page.goto(path);
    }
    
    await page.waitForLoadState("domcontentloaded");
    await page.waitForLoadState("networkidle", { timeout: 10000 });
    
    // Wait for any React hydration
    await page.waitForTimeout(1000);
    
    console.log(`📄 Page loaded: ${page.url()}`);
  }

  static async fillForm(page: any, formData: Record<string, string>) {
    for (const [selector, value] of Object.entries(formData)) {
      const field = page.locator(selector);
      await expect(field).toBeVisible({ timeout: 5000 });
      await field.fill(value);
      console.log(`📝 Filled ${selector}: ${value}`);
    }
  }

  static async waitForElement(page: any, selector: string, timeout = 10000) {
    const element = page.locator(selector);
    await expect(element).toBeVisible({ timeout });
    console.log(`👁️  Element visible: ${selector}`);
    return element;
  }

  static async clickAndWait(page: any, selector: string, waitForNavigation = false) {
    const element = await TestHelpers.waitForElement(page, selector);
    
    if (waitForNavigation) {
      await Promise.all([
        page.waitForNavigation({ timeout: 10000 }),
        element.click(),
      ]);
    } else {
      await element.click();
    }
    
    console.log(`👆 Clicked: ${selector}`);
    return element;
  }

  static async searchAndSelectFirst(page: any, searchInput: string, searchTerm: string, resultSelector: string) {
    // Fill search
    await TestHelpers.fillForm(page, { [searchInput]: searchTerm });
    
    // Submit search
    await page.press(searchInput, "Enter");
    
    // Wait for results
    await TestHelpers.waitForElement(page, resultSelector);
    
    // Click first result
    const firstResult = page.locator(resultSelector).first();
    await firstResult.click();
    
    console.log(`🔍 Searched "${searchTerm}" and selected first result`);
  }

  static async verifyUrl(page: any, expectedPath: string) {
    const currentUrl = new URL(page.url());
    expect(currentUrl.pathname).toBe(expectedPath);
    console.log(`🔗 URL verified: ${expectedPath}`);
  }

  static async takeScreenshot(page: any, name: string) {
    const screenshot = await page.screenshot({ 
      fullPage: true,
      path: `test-results/screenshots/${name}-${Date.now()}.png`
    });
    console.log(`📸 Screenshot taken: ${name}`);
    return screenshot;
  }
}
