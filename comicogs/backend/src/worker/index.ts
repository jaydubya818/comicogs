import { Worker } from "bullmq";
import { connection } from "../queues";
import { sendReceiptEmail, sendAlertEmail, sendDigestEmail } from "../services/email";
import { PrismaClient } from "@prisma/client";
import { logger } from "../middleware/logger";
import { notifications } from "../services/notify";

const prisma = new PrismaClient();

// Email worker
export const emailWorker = new Worker("email", async (job) => {
  const { type, data } = job.data;
  
  logger.info({ 
    jobId: job.id, 
    type, 
    data: { ...data, to: data.to } 
  }, "Processing email job");

  switch (type) {
    case "receipt":
      return await sendReceiptEmail(data);
    
    case "alert":
      return await sendAlertEmail(data);
    
    case "digest":
      return await sendDigestEmail(data);
    
    default:
      throw new Error(`Unknown email type: ${type}`);
  }
}, { 
  connection,
  concurrency: 5 
});

// Alerts worker with proper search conversion
export const alertsWorker = new Worker("alerts", async (job) => {
  if (job.name !== "run-saved-search-digests") {
    logger.warn({ jobId: job.id, jobName: job.name }, "Unknown alerts job type");
    return;
  }

  logger.info({ 
    jobId: job.id, 
    data: job.data 
  }, "Processing saved search digests job");
  
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const now = new Date();

  // Get all saved searches with users
  const searches = await prisma.savedSearch.findMany({
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        }
      }
    }
  });

  let processedCount = 0;
  let emailsSent = 0;

  for (const search of searches) {
    try {
      // Calculate time window based on cadence
      const since = search.lastRunAt ?? new Date(0);
      let shouldRun = false;
      
      if (search.cadence === "daily") {
        shouldRun = now.getTime() - since.getTime() > 24 * 60 * 60 * 1000; // 24 hours
      } else if (search.cadence === "weekly") {
        shouldRun = now.getTime() - since.getTime() > 7 * 24 * 60 * 60 * 1000; // 7 days
      }
      
      if (!shouldRun) {
        logger.debug({
          searchId: search.id,
          searchName: search.name,
          lastRunAt: search.lastRunAt,
          cadence: search.cadence
        }, "Skipping search - not due to run yet");
        continue;
      }

      // Convert saved query to Prisma filters
      const searchQuery = search.queryJson as any;
      const { where, orderBy } = require("../lib/searchToPrisma").searchToPrisma(searchQuery);

      // Only get new matches since last run
      const timeFilteredWhere = {
        AND: [
          where,
          { createdAt: { gt: since } }
        ]
      };

      const listings = await prisma.listing.findMany({
        where: timeFilteredWhere,
        include: {
          comic: {
            select: {
              id: true,
              title: true,
              series: true,
              issue: true,
              grade: true,
              coverUrl: true,
            }
          },
          seller: {
            select: {
              id: true,
              name: true,
            }
          }
        },
        orderBy,
        take: 20 // Limit matches per alert
      });

      if (listings.length === 0 || !search.user?.email) {
        logger.debug({
          searchId: search.id,
          searchName: search.name,
          matchCount: listings.length,
          hasEmail: !!search.user?.email
        }, "No matches or email for search");
        
        // Still update lastRunAt even if no matches
        await prisma.savedSearch.update({
          where: { id: search.id },
          data: { lastRunAt: now }
        });
        
        processedCount++;
        continue;
      }

      // Build digest items
      const items = listings.map((listing) => ({
        title: `${listing.comic?.series ?? "Series"} #${listing.comic?.issue ?? "?"} – ${listing.comic?.title ?? "Comic"}`,
        url: `${base}/marketplace?listing=${listing.id}`,
        price: Number(listing.price),
        grade: listing.comic?.grade || "Ungraded",
        seller: listing.seller?.name || "Unknown"
      }));

      // Queue digest email
      await emailQueue.add("email", {
        type: "digest",
        data: {
          to: search.user.email,
          items,
          searchName: search.name,
          searchUrl: `${base}/marketplace?${buildQueryString(searchQuery)}`
        }
      });

      // Update last run time
      await prisma.savedSearch.update({
        where: { id: search.id },
        data: { lastRunAt: now }
      });

      logger.info({
        searchId: search.id,
        userId: search.userId,
        searchName: search.name,
        matchCount: listings.length,
        userEmail: search.user.email
      }, "Digest email queued for saved search");

      processedCount++;
      emailsSent++;

    } catch (error: any) {
      logger.error({
        error: error.message,
        stack: error.stack,
        searchId: search.id,
        searchName: search.name
      }, "Failed to process saved search");
    }
  }

  const result = {
    processedCount,
    totalSearches: searches.length,
    emailsSent,
    completedAt: new Date().toISOString()
  };

  logger.info(result, "Saved search digest job completed");
  return result;
}, { 
  connection,
  concurrency: 1 // Run alerts sequentially
});

// Helper function to build query string from search object
function buildQueryString(searchQuery: any): string {
  const params = new URLSearchParams();
  
  for (const [key, value] of Object.entries(searchQuery)) {
    if (value == null || value === undefined) continue;
    
    if (Array.isArray(value)) {
      value.forEach((v) => params.append(key, String(v)));
    } else {
      params.append(key, String(value));
    }
  }
  
  return params.toString();
}

// Error handling
emailWorker.on('failed', (job, err) => {
  logger.error({
    jobId: job?.id,
    error: err.message,
    stack: err.stack
  }, 'Email job failed');
  
  // Send notification for worker failure
  notifications.workerFailed('emailWorker', job?.id || 'unknown', err.message);
});

alertsWorker.on('failed', (job, err) => {
  logger.error({
    jobId: job?.id,
    error: err.message,
    stack: err.stack
  }, 'Alerts job failed');
  
  // Send notification for worker failure
  notifications.workerFailed('alertsWorker', job?.id || 'unknown', err.message);
});

// Success logging
emailWorker.on('completed', (job) => {
  logger.info({
    jobId: job.id,
    type: job.data.type
  }, 'Email job completed');
});

alertsWorker.on('completed', (job, result) => {
  logger.info({
    jobId: job.id,
    result
  }, 'Alerts job completed');
});

logger.info("Workers started: email, alerts");

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Shutting down workers...');
  await emailWorker.close();
  await alertsWorker.close();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('Shutting down workers...');
  await emailWorker.close();
  await alertsWorker.close();
  await prisma.$disconnect();
  process.exit(0);
});
