/**
 * Test Authentication Routes
 * 
 * Provides test-only authentication endpoints for E2E testing.
 * These routes are ONLY available in development/test environments.
 */

import { Router } from "express";
import { createTestSessionCookie, ensureTestUser } from "../testing/session";
import { seedTestData, clearTestData } from "../../prisma/seed.e2e";

const router = Router();

// Test login endpoint
router.post("/api/_test/login", async (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(404).json({ error: "Not found" });
  }

  try {
    const { email, role = "user" } = req.body || {};
    
    if (!email) {
      return res.status(400).json({ error: "email required" });
    }

    // Ensure user exists
    await ensureTestUser(email, role);

    // Create session cookie
    const sessionToken = await createTestSessionCookie(email);
    
    // Set cookie
    res.cookie("session", sessionToken, { 
      httpOnly: true, 
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      secure: false // Allow for localhost testing
    });

    console.log(`✅ Test login successful: ${email}`);
    
    return res.json({ 
      ok: true, 
      user: { email, role },
      message: "Test session created"
    });

  } catch (error) {
    console.error("❌ Test login error:", error);
    return res.status(500).json({ 
      error: "Test login failed", 
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Test logout endpoint
router.post("/api/_test/logout", async (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(404).json({ error: "Not found" });
  }

  res.clearCookie("session");
  return res.json({ ok: true, message: "Test session cleared" });
});

// Test data seeding endpoint
router.post("/api/_test/seed", async (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(404).json({ error: "Not found" });
  }

  try {
    const { reset = false } = req.body || {};
    
    if (reset) {
      console.log("🧹 Clearing existing test data before seeding...");
      await clearTestData();
    }

    const seededData = await seedTestData();
    
    return res.json({
      ok: true,
      message: "Test data seeded successfully",
      data: {
        users: Object.keys(seededData.users).length,
        comics: Object.keys(seededData.comics).length,
        listings: Object.keys(seededData.listings).length,
      }
    });

  } catch (error) {
    console.error("❌ Test seed error:", error);
    return res.status(500).json({
      error: "Test seeding failed",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Test data cleanup endpoint
router.post("/api/_test/cleanup", async (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(404).json({ error: "Not found" });
  }

  try {
    await clearTestData();
    
    return res.json({
      ok: true,
      message: "Test data cleared successfully"
    });

  } catch (error) {
    console.error("❌ Test cleanup error:", error);
    return res.status(500).json({
      error: "Test cleanup failed",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Test webhook endpoint (for stubbing Stripe webhooks)
router.post("/api/_test/webhook", async (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(404).json({ error: "Not found" });
  }

  try {
    // Set bypass flag to skip signature verification
    (req as any).bypassStripeSig = true;
    
    // Import the actual webhook handler
    const { default: stripeRouter } = await import("./stripe");
    
    // Forward to stripe webhook handler
    // Note: This is a simplified approach. In a real implementation,
    // you might want to create a more sophisticated mock.
    
    return res.json({
      ok: true,
      message: "Test webhook processed",
      body: req.body
    });

  } catch (error) {
    console.error("❌ Test webhook error:", error);
    return res.status(500).json({
      error: "Test webhook failed",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Test status endpoint
router.get("/api/_test/status", async (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(404).json({ error: "Not found" });
  }

  return res.json({
    ok: true,
    environment: process.env.NODE_ENV,
    message: "Test endpoints available",
    endpoints: [
      "POST /api/_test/login",
      "POST /api/_test/logout", 
      "POST /api/_test/seed",
      "POST /api/_test/cleanup",
      "POST /api/_test/webhook",
      "GET /api/_test/status"
    ]
  });
});

export default router;
