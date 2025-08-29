import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Test data constants
const TEST_USER_EMAIL = 'test-buyer@example.com';
const TEST_USER_PASSWORD = 'testpassword123';
const TEST_SELLER_EMAIL = 'test-seller@example.com';

test.describe('E2E Payment Flow Tests', () => {
  let testListingId: string;
  let testOrderId: string;

  // Setup test data before running tests
  test.beforeAll(async () => {
    // Clean up any existing test data
    await prisma.order.deleteMany({
      where: {
        buyer: { email: { in: [TEST_USER_EMAIL, TEST_SELLER_EMAIL] } }
      }
    });
    await prisma.listing.deleteMany({
      where: {
        seller: { email: { in: [TEST_USER_EMAIL, TEST_SELLER_EMAIL] } }
      }
    });
    await prisma.user.deleteMany({
      where: { email: { in: [TEST_USER_EMAIL, TEST_SELLER_EMAIL] } }
    });

    // Create test users
    const testBuyer = await prisma.user.create({
      data: {
        email: TEST_USER_EMAIL,
        name: 'Test Buyer',
        role: 'user',
      }
    });

    const testSeller = await prisma.user.create({
      data: {
        email: TEST_SELLER_EMAIL,
        name: 'Test Seller',
        role: 'seller',
      }
    });

    // Create a test comic
    const testComic = await prisma.comic.create({
      data: {
        title: 'Test Comic for E2E',
        series: 'E2E Test Series',
        issue: '1',
        grade: 'VF+',
        format: 'slab',
        price: 100.00,
        coverUrl: 'https://via.placeholder.com/300x450',
        tags: ['test', 'e2e'],
      }
    });

    // Create a test listing
    const testListing = await prisma.listing.create({
      data: {
        comicId: testComic.id,
        sellerId: testSeller.id,
        price: 99.99,
        status: 'active',
      }
    });

    testListingId = testListing.id;
  });

  // Clean up after tests
  test.afterAll(async () => {
    // Clean up test data
    await prisma.order.deleteMany({
      where: {
        buyer: { email: { in: [TEST_USER_EMAIL, TEST_SELLER_EMAIL] } }
      }
    });
    await prisma.listing.deleteMany({
      where: {
        seller: { email: { in: [TEST_USER_EMAIL, TEST_SELLER_EMAIL] } }
      }
    });
    await prisma.comic.deleteMany({
      where: { title: 'Test Comic for E2E' }
    });
    await prisma.user.deleteMany({
      where: { email: { in: [TEST_USER_EMAIL, TEST_SELLER_EMAIL] } }
    });
  });

  test('Complete payment flow: browse → buy → checkout → success', async ({ page }) => {
    // Step 1: Navigate to marketplace
    await page.goto('/marketplace');
    await expect(page).toHaveTitle(/Marketplace/);

    // Step 2: Find and view the test listing
    await page.getByText('E2E Test Series #1').click();
    await expect(page).toHaveURL(/\/comics\//);
    await expect(page.getByText('$99.99')).toBeVisible();

    // Step 3: Click buy button to start checkout
    const buyButton = page.getByRole('button', { name: /buy now|purchase|buy/i });
    await expect(buyButton).toBeVisible();
    await buyButton.click();

    // Step 4: Should redirect to login if not authenticated
    // For this test, we'll mock the login or use a test authentication
    if (await page.getByText('Sign In').isVisible()) {
      await page.getByRole('textbox', { name: /email/i }).fill(TEST_USER_EMAIL);
      await page.getByRole('textbox', { name: /password/i }).fill(TEST_USER_PASSWORD);
      await page.getByRole('button', { name: /sign in/i }).click();
    }

    // Step 5: Create checkout session (mocked Stripe flow)
    // In a real test, this would redirect to Stripe
    // For E2E testing, we can mock the checkout success
    
    // Check that checkout session was created
    await page.waitForURL(/checkout|orders/);
    
    // In CI/testing, we can simulate webhook by making API call directly
    if (process.env.CI || process.env.NODE_ENV === 'test') {
      // Simulate successful payment webhook
      const response = await page.request.post('/api/stripe/webhook', {
        data: {
          type: 'checkout.session.completed',
          data: {
            object: {
              id: 'cs_test_mock',
              payment_intent: 'pi_test_mock',
              metadata: {
                listingId: testListingId,
                buyerId: 'test-buyer-id',
              },
              amount_total: 9999, // $99.99 in cents
            }
          }
        },
        headers: {
          'content-type': 'application/json',
        }
      });

      expect(response.ok()).toBeTruthy();
    }

    // Step 6: Verify order completion
    await page.goto('/orders');
    await expect(page.getByText('E2E Test Series #1')).toBeVisible();
    await expect(page.getByText('paid')).toBeVisible();
  });

  test('Admin refund flow', async ({ page }) => {
    // This test requires admin access
    await page.goto('/admin/login');
    
    // Mock admin login
    if (await page.getByRole('button', { name: /sign in/i }).isVisible()) {
      await page.getByRole('textbox', { name: /email/i }).fill('admin@comicogs.com');
      await page.getByRole('textbox', { name: /password/i }).fill('adminpassword');
      await page.getByRole('button', { name: /sign in/i }).click();
    }

    // Navigate to admin orders
    await page.goto('/admin/orders');
    await expect(page).toHaveTitle(/Admin Orders/);

    // Find the test order
    await page.getByText('E2E Test Series #1').click();
    
    // Verify order details
    await expect(page.getByText('$99.99')).toBeVisible();
    await expect(page.getByText('paid')).toBeVisible();

    // Issue refund
    const refundButton = page.getByRole('button', { name: /refund|issue refund/i });
    await expect(refundButton).toBeVisible();
    await refundButton.click();

    // Fill refund form
    await page.getByRole('textbox', { name: /reason/i }).fill('E2E test refund');
    await page.getByRole('button', { name: /confirm refund/i }).click();

    // Verify refund success
    await expect(page.getByText('Refund issued successfully')).toBeVisible();
    await expect(page.getByText('refunded')).toBeVisible();
  });

  test('Error handling and edge cases', async ({ page }) => {
    // Test 1: Try to buy own listing (should fail)
    await page.goto('/marketplace');
    
    // Mock login as seller
    if (await page.getByText('Sign In').isVisible()) {
      await page.getByRole('textbox', { name: /email/i }).fill(TEST_SELLER_EMAIL);
      await page.getByRole('textbox', { name: /password/i }).fill(TEST_USER_PASSWORD);
      await page.getByRole('button', { name: /sign in/i }).click();
    }

    await page.getByText('E2E Test Series #1').click();
    const buyButton = page.getByRole('button', { name: /buy now/i });
    await buyButton.click();

    // Should show error
    await expect(page.getByText(/cannot buy your own listing/i)).toBeVisible();

    // Test 2: Try to buy already sold listing
    // First mark listing as sold in database
    await prisma.listing.update({
      where: { id: testListingId },
      data: { status: 'sold' }
    });

    await page.reload();
    await expect(page.getByText(/no longer available|sold/i)).toBeVisible();
    
    // Reset listing status
    await prisma.listing.update({
      where: { id: testListingId },
      data: { status: 'active' }
    });
  });

  test('Payment security and validation', async ({ page }) => {
    // Test checkout session validation
    const response = await page.request.post('/api/checkout', {
      data: {
        listingId: 'invalid-listing-id',
        successUrl: 'https://comicogs.com/success',
        cancelUrl: 'https://comicogs.com/cancel'
      }
    });

    expect(response.status()).toBe(404);

    // Test webhook signature validation (if not in test mode)
    if (process.env.NODE_ENV !== 'test') {
      const webhookResponse = await page.request.post('/api/stripe/webhook', {
        data: JSON.stringify({
          type: 'checkout.session.completed',
          data: { object: { id: 'fake' } }
        }),
        headers: {
          'content-type': 'application/json',
          'stripe-signature': 'invalid-signature'
        }
      });

      expect(webhookResponse.status()).toBe(400);
    }
  });

  test('Order status transitions', async ({ page }) => {
    // Create a new test order
    const order = await prisma.order.create({
      data: {
        userId: (await prisma.user.findFirst({ where: { email: TEST_USER_EMAIL } }))!.id,
        listingId: testListingId,
        amount: 9999,
        currency: 'usd',
        status: 'pending',
        stripeSession: 'cs_test_' + Date.now(),
      }
    });

    testOrderId = order.id;

    // Test webhook processing for different statuses
    const webhookPayloads = [
      {
        type: 'checkout.session.completed',
        data: {
          object: {
            id: order.stripeSession,
            payment_intent: 'pi_test_' + Date.now(),
            metadata: {
              listingId: testListingId,
              buyerId: order.userId,
            }
          }
        }
      },
      {
        type: 'charge.refunded',
        data: {
          object: {
            payment_intent: 'pi_test_' + Date.now(),
            amount_refunded: 9999,
          }
        }
      }
    ];

    for (const payload of webhookPayloads) {
      const response = await page.request.post('/api/stripe/webhook', {
        data: JSON.stringify(payload),
        headers: {
          'content-type': 'application/json',
          'stripe-signature': 'test-signature', // Mock signature for testing
        }
      });

      if (process.env.NODE_ENV === 'test') {
        expect(response.status()).toBe(200);
      }
    }

    // Verify order status was updated
    const updatedOrder = await prisma.order.findUnique({
      where: { id: order.id }
    });

    expect(updatedOrder?.status).toBe('paid');
  });

  test('Performance and reliability', async ({ page }) => {
    // Test checkout endpoint performance
    const startTime = Date.now();
    
    const response = await page.request.post('/api/checkout', {
      data: {
        listingId: testListingId,
        successUrl: 'https://comicogs.com/success',
        cancelUrl: 'https://comicogs.com/cancel'
      }
    });

    const duration = Date.now() - startTime;
    
    expect(response.status()).toBe(200);
    expect(duration).toBeLessThan(2000); // Should respond within 2 seconds

    // Test concurrent requests
    const concurrentRequests = Array(5).fill(null).map(() => 
      page.request.get('/api/listings?status=active&limit=10')
    );

    const responses = await Promise.all(concurrentRequests);
    responses.forEach(response => {
      expect(response.status()).toBe(200);
    });
  });

  test('Data consistency and integrity', async ({ page }) => {
    // Create order and verify database consistency
    const initialListingCount = await prisma.listing.count({
      where: { status: 'active' }
    });

    const initialOrderCount = await prisma.order.count();

    // Simulate successful purchase
    const order = await prisma.order.create({
      data: {
        userId: (await prisma.user.findFirst({ where: { email: TEST_USER_EMAIL } }))!.id,
        listingId: testListingId,
        amount: 9999,
        currency: 'usd',
        status: 'paid',
      }
    });

    await prisma.listing.update({
      where: { id: testListingId },
      data: { status: 'sold' }
    });

    // Verify counts
    const finalListingCount = await prisma.listing.count({
      where: { status: 'active' }
    });

    const finalOrderCount = await prisma.order.count();

    expect(finalListingCount).toBe(initialListingCount - 1);
    expect(finalOrderCount).toBe(initialOrderCount + 1);

    // Verify referential integrity
    const orderWithListing = await prisma.order.findUnique({
      where: { id: order.id },
      include: { listing: { include: { comic: true } } }
    });

    expect(orderWithListing?.listing.comic.title).toBe('Test Comic for E2E');

    // Clean up
    await prisma.order.delete({ where: { id: order.id } });
    await prisma.listing.update({
      where: { id: testListingId },
      data: { status: 'active' }
    });
  });
});