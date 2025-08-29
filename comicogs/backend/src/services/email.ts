import { Resend } from "resend";
import { renderReceiptEmail } from "./emailTemplates/receipt";
import { logger } from "../middleware/logger";

// Only initialize Resend if API key is available
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.EMAIL_FROM || "Comicogs <no-reply@comicogs.com>";

export async function sendReceiptEmail({
  to, 
  orderId, 
  total, 
  listingTitle, 
  listingUrl
}: {
  to: string; 
  orderId: string; 
  total: number; 
  listingTitle?: string; 
  listingUrl?: string;
}) {
  if (!resend) {
    logger.info({
      type: 'email',
      to,
      orderId,
      total,
      listingTitle,
      listingUrl
    }, "[email:dev] sendReceiptEmail - No API key, logging only");
    return { id: 'dev-email-' + orderId };
  }

  try {
    const html = renderReceiptEmail({ 
      orderId, 
      total, 
      listingTitle, 
      listingUrl 
    });

    const result = await resend.emails.send({
      from: FROM,
      to,
      subject: `Your Comicogs receipt · Order ${orderId}`,
      html
    });

    logger.info({
      emailId: result.data?.id,
      to,
      orderId,
      total
    }, "Receipt email sent successfully");

    return result.data;
  } catch (error) {
    logger.error({
      error,
      to,
      orderId,
      total
    }, "Failed to send receipt email");
    
    // Don't throw - email failure shouldn't break the order process
    return null;
  }
}

export async function sendAlertEmail({
  to,
  searchName,
  matches,
  searchUrl
}: {
  to: string;
  searchName: string;
  matches: any[];
  searchUrl?: string;
}) {
  if (!resend) {
    logger.info({
      type: 'email',
      to,
      searchName,
      matchCount: matches.length,
      searchUrl
    }, "[email:dev] sendAlertEmail - No API key, logging only");
    return { id: 'dev-alert-' + Date.now() };
  }

  try {
    const subject = `${matches.length} new matches for "${searchName}"`;
    const html = renderAlertEmail({ searchName, matches, searchUrl });

    const result = await resend.emails.send({
      from: FROM,
      to,
      subject,
      html
    });

    logger.info({
      emailId: result.data?.id,
      to,
      searchName,
      matchCount: matches.length
    }, "Alert email sent successfully");

    return result.data;
  } catch (error) {
    logger.error({
      error,
      to,
      searchName,
      matchCount: matches.length
    }, "Failed to send alert email");
    
    return null;
  }
}

export async function sendDigestEmail({
  to,
  items
}: {
  to: string;
  items: Array<{
    title: string;
    url: string;
    price: number;
  }>;
}) {
  if (!resend) {
    logger.info({
      type: 'email',
      to,
      itemCount: items.length
    }, "[email:dev] sendDigestEmail - No API key, logging only");
    return { id: 'dev-digest-' + Date.now() };
  }

  try {
    const subject = `${items.length} new matches for your saved searches`;
    const html = renderDigestEmail({ items });

    const result = await resend.emails.send({
      from: FROM,
      to,
      subject,
      html
    });

    logger.info({
      emailId: result.data?.id,
      to,
      itemCount: items.length
    }, "Digest email sent successfully");

    return result.data;
  } catch (error) {
    logger.error({
      error,
      to,
      itemCount: items.length
    }, "Failed to send digest email");
    
    return null;
  }
}

function renderAlertEmail({
  searchName,
  matches,
  searchUrl = "#"
}: {
  searchName: string;
  matches: any[];
  searchUrl?: string;
}) {
  const matchList = matches.map(match => `
    <tr style="border-bottom: 1px solid #eee;">
      <td style="padding: 8px 0;">
        <strong>${match.comic?.series} #${match.comic?.issue}</strong><br>
        <span style="color: #666; font-size: 14px;">${match.comic?.title || ''}</span>
      </td>
      <td style="padding: 8px 0; text-align: right;">
        <strong>$${Number(match.price).toLocaleString()}</strong>
      </td>
    </tr>
  `).join('');

  return `
  <!doctype html>
  <html>
    <head>
      <meta name="viewport" content="width=device-width"/>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
      <title>Comicogs Alert</title>
      <style>
        body { background:#f6f6f6; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; margin:0; padding:20px; }
        .wrapper { max-width:600px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 1px 4px rgba(0,0,0,0.06); }
        .header { padding:20px 24px; border-bottom:1px solid #eee; font-weight:600; font-size:18px; }
        .content { padding:20px 24px; color:#111; }
        .table { width:100%; border-collapse:collapse; margin-top:12px; }
        .table td { padding:8px 0; border-bottom:1px solid #eee; }
        .cta { display:inline-block; margin-top:16px; padding:10px 14px; background:#111; color:#fff; text-decoration:none; border-radius:8px; }
        .footer { padding:16px 24px; color:#666; font-size:12px; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">🔍 Comicogs Alert</div>
        <div class="content">
          <p>Great news! We found <strong>${matches.length} new matches</strong> for your saved search "<strong>${searchName}</strong>":</p>
          <table class="table">
            ${matchList}
          </table>
          <a class="cta" href="${searchUrl}">View all matches</a>
        </div>
        <div class="footer">
          Comicogs · © ${new Date().getFullYear()}
        </div>
      </div>
    </body>
  </html>
  `;
}

function renderDigestEmail({
  items
}: {
  items: Array<{
    title: string;
    url: string;
    price: number;
  }>;
}) {
  const itemList = items.map(item => `
    <tr style="border-bottom: 1px solid #eee;">
      <td style="padding: 8px 0;">
        <a href="${item.url}" style="color: #667eea; text-decoration: none; font-weight: 500;">
          ${item.title}
        </a>
      </td>
      <td style="padding: 8px 0; text-align: right;">
        <strong>$${item.price.toLocaleString()}</strong>
      </td>
    </tr>
  `).join('');

  return `
  <!doctype html>
  <html>
    <head>
      <meta name="viewport" content="width=device-width"/>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
      <title>Comicogs Digest</title>
      <style>
        body { background:#f6f6f6; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; margin:0; padding:20px; }
        .wrapper { max-width:600px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 1px 4px rgba(0,0,0,0.06); }
        .header { padding:20px 24px; border-bottom:1px solid #eee; font-weight:600; font-size:18px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
        .content { padding:20px 24px; color:#111; }
        .table { width:100%; border-collapse:collapse; margin-top:12px; }
        .table td { padding:8px 0; border-bottom:1px solid #eee; }
        .cta { display:inline-block; margin-top:16px; padding:10px 14px; background:#111; color:#fff; text-decoration:none; border-radius:8px; }
        .footer { padding:16px 24px; color:#666; font-size:12px; background: #f8f9fa; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          🔍 Comicogs Digest
        </div>
        <div class="content">
          <p>Great news! We found <strong>${items.length} new matches</strong> for your saved searches:</p>
          <table class="table">
            ${itemList}
          </table>
          <a class="cta" href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/marketplace">Browse Marketplace</a>
        </div>
        <div class="footer">
          <strong>Comicogs</strong> · The Ultimate Comic Collection Platform<br>
          © ${new Date().getFullYear()} · <a href="#" style="color: #666;">Unsubscribe</a> · <a href="#" style="color: #666;">Manage Alerts</a>
        </div>
      </div>
    </body>
  </html>
  `;
}
