import { Router } from "express";
import { alertsQueue } from "../queues";
import { asyncHandler, AppError } from "../middleware/errorHandler";
import { logger } from "../middleware/logger";

const router = Router();

// Simple HMAC-ish token check (shared secret in environment variables)
function isAuthorized(req: any) {
  const token = req.headers["x-cron-token"] || req.query.token;
  const expectedToken = process.env.CRON_TOKEN;
  
  if (!expectedToken) {
    logger.warn("CRON_TOKEN not configured - alerts trigger disabled");
    return false;
  }
  
  return token && token === expectedToken;
}

// POST /api/alerts/trigger - Secure trigger for nightly alerts
router.post("/trigger", asyncHandler(async (req, res) => {
  if (!isAuthorized(req)) {
    logger.warn({
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      hasToken: !!(req.headers["x-cron-token"] || req.query.token)
    }, "Unauthorized alerts trigger attempt");
    
    return res.status(401).json({ error: "unauthorized" });
  }

  try {
    // Add job to alerts queue
    const job = await alertsQueue.add("run-saved-search-digests", { 
      triggeredAt: new Date().toISOString(),
      triggeredBy: "cron",
      requestId: req.id
    });

    logger.info({
      jobId: job.id,
      triggeredBy: "cron",
      requestId: req.id
    }, "Alerts job enqueued successfully");

    res.json({ 
      success: true,
      jobId: job.id,
      message: "Alerts job enqueued successfully"
    });
  } catch (error: any) {
    logger.error({
      error: error.message,
      stack: error.stack,
      requestId: req.id
    }, "Failed to enqueue alerts job");
    
    throw new AppError("Failed to enqueue alerts job", 500);
  }
}));

// GET /api/alerts/status - Check alerts system status
router.get("/status", asyncHandler(async (req, res) => {
  try {
    const [waiting, active, completed, failed] = await Promise.all([
      alertsQueue.getWaiting(),
      alertsQueue.getActive(),
      alertsQueue.getCompleted(),
      alertsQueue.getFailed()
    ]);

    const status = {
      queue: "alerts",
      status: "healthy",
      jobs: {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length
      },
      lastCompleted: completed.length > 0 ? {
        id: completed[0].id,
        processedOn: completed[0].processedOn,
        finishedOn: completed[0].finishedOn
      } : null,
      lastFailed: failed.length > 0 ? {
        id: failed[0].id,
        failedReason: failed[0].failedReason,
        processedOn: failed[0].processedOn
      } : null
    };

    res.json(status);
  } catch (error: any) {
    logger.error({
      error: error.message,
      stack: error.stack
    }, "Failed to get alerts status");
    
    res.status(500).json({
      queue: "alerts",
      status: "error",
      error: error.message
    });
  }
}));

export default router;
