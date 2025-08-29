import { alertsQueue } from "../queues";
import { logger } from "../middleware/logger";

async function triggerAlerts() {
  try {
    logger.info("Starting alerts trigger script");
    
    const job = await alertsQueue.add("run-saved-search-digests", { 
      triggeredAt: new Date().toISOString(),
      triggeredBy: "cli-script",
      scriptVersion: "1.0.0"
    });

    logger.info({
      jobId: job.id,
      triggeredBy: "cli-script"
    }, "Alerts job enqueued successfully");

    console.log(`✅ [alerts] enqueued run-saved-search-digests (Job ID: ${job.id})`);
    
    // Wait a moment to ensure job is processed
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    process.exit(0);
  } catch (error: any) {
    logger.error({
      error: error.message,
      stack: error.stack
    }, "Failed to trigger alerts");
    
    console.error("❌ [alerts] Failed to enqueue job:", error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  triggerAlerts();
}

export { triggerAlerts };
