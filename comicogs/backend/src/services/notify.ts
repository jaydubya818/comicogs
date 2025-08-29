import { logger } from "../middleware/logger";

export async function notify(text: string, options?: {
  channel?: string;
  severity?: 'info' | 'warning' | 'error';
  metadata?: Record<string, any>;
}) {
  const alertsWebhookUrl = process.env.ALERTS_WEBHOOK_URL;
  
  if (!alertsWebhookUrl) {
    logger.debug({ text, options }, 'Notification skipped - no webhook URL configured');
    return;
  }

  try {
    const payload = {
      text,
      channel: options?.channel,
      username: "Comicogs Monitor",
      icon_emoji: getSeverityEmoji(options?.severity),
      attachments: options?.metadata ? [{
        color: getSeverityColor(options?.severity),
        fields: Object.entries(options.metadata).map(([key, value]) => ({
          title: key,
          value: String(value),
          short: true
        }))
      }] : undefined
    };

    const response = await fetch(alertsWebhookUrl, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "User-Agent": "Comicogs/1.0"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
    }

    logger.info({ 
      text: text.substring(0, 100), 
      severity: options?.severity,
      webhookStatus: response.status 
    }, 'Notification sent successfully');

  } catch (error: any) {
    logger.error({
      error: error.message,
      text: text.substring(0, 100),
      webhookUrl: alertsWebhookUrl ? '[CONFIGURED]' : '[NOT_CONFIGURED]'
    }, 'Failed to send notification');
  }
}

function getSeverityEmoji(severity?: string): string {
  switch (severity) {
    case 'error': return ':rotating_light:';
    case 'warning': return ':warning:';
    case 'info': return ':information_source:';
    default: return ':robot_face:';
  }
}

function getSeverityColor(severity?: string): string {
  switch (severity) {
    case 'error': return 'danger';
    case 'warning': return 'warning';
    case 'info': return 'good';
    default: return '#36a64f';
  }
}

// Helper functions for common notification scenarios
export const notifications = {
  serverError: (error: Error, requestId?: string, method?: string, url?: string) => {
    return notify(
      `:rotating_light: 5xx Error on ${process.env.NEXT_PUBLIC_SITE_URL || 'Comicogs'} (${method} ${url}) requestId=${requestId}`,
      {
        severity: 'error',
        metadata: {
          error: error.message,
          requestId,
          method,
          url,
          stack: error.stack?.split('\n')[0]
        }
      }
    );
  },

  workerFailed: (jobName: string, jobId: string | number, error: string) => {
    return notify(
      `:exclamation: Worker failed: ${jobName} ${jobId} – ${error}`,
      {
        severity: 'warning',
        metadata: {
          jobName,
          jobId: String(jobId),
          error
        }
      }
    );
  },

  alertsCompleted: (processedCount: number, emailsSent: number, totalSearches: number) => {
    return notify(
      `:envelope: Alerts completed: ${emailsSent} emails sent, ${processedCount}/${totalSearches} searches processed`,
      {
        severity: 'info',
        metadata: {
          processedCount: String(processedCount),
          emailsSent: String(emailsSent),
          totalSearches: String(totalSearches)
        }
      }
    );
  },

  highMemoryUsage: (memoryUsage: number) => {
    return notify(
      `:chart_with_upwards_trend: High memory usage detected: ${memoryUsage}MB`,
      {
        severity: 'warning',
        metadata: {
          memoryUsageMB: String(memoryUsage),
          threshold: '500MB'
        }
      }
    );
  }
};
