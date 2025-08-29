// Lightweight, client-safe HTML (tables render well in email clients)
export function renderReceiptEmail({
  orderId,
  total,
  listingTitle = "Comic listing",
  listingUrl = "#",
}: {
  orderId: string;
  total: number;
  listingTitle?: string;
  listingUrl?: string;
}) {
  const currency = new Intl.NumberFormat("en-US", { 
    style: "currency", 
    currency: "USD" 
  }).format(total);

  return `
  <!doctype html>
  <html>
    <head>
      <meta name="viewport" content="width=device-width"/>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
      <title>Comicogs Receipt</title>
      <style>
        body { 
          background:#f6f6f6; 
          font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; 
          margin:0; 
          padding:20px; 
        }
        .wrapper { 
          max-width:600px; 
          margin:0 auto; 
          background:#ffffff; 
          border-radius:12px; 
          overflow:hidden; 
          box-shadow:0 1px 4px rgba(0,0,0,0.06); 
        }
        .header { 
          padding:20px 24px; 
          border-bottom:1px solid #eee; 
          font-weight:600; 
          font-size:18px; 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        .content { 
          padding:20px 24px; 
          color:#111; 
        }
        .muted { 
          color:#666; 
          font-size:12px; 
        }
        .table { 
          width:100%; 
          border-collapse:collapse; 
          margin-top:12px; 
        }
        .table td { 
          padding:8px 0; 
          border-bottom:1px solid #eee; 
        }
        .total { 
          font-weight:700; 
          font-size: 16px;
        }
        .cta { 
          display:inline-block; 
          margin-top:16px; 
          padding:10px 14px; 
          background:#111; 
          color:#fff; 
          text-decoration:none; 
          border-radius:8px; 
        }
        .footer { 
          padding:16px 24px; 
          color:#666; 
          font-size:12px; 
          background: #f8f9fa;
        }
        .success-badge {
          display: inline-block;
          background: #10b981;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 16px;
        }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          📧 Comicogs Receipt
        </div>
        <div class="content">
          <div class="success-badge">✓ Payment Successful</div>
          <p>Thanks for your purchase! Here are your order details:</p>
          
          <table class="table">
            <tr>
              <td><strong>Order Number</strong></td>
              <td><strong>#${orderId}</strong></td>
            </tr>
            <tr>
              <td>Item</td>
              <td><a href="${listingUrl}" style="color: #667eea; text-decoration: none;">${listingTitle}</a></td>
            </tr>
            <tr class="total">
              <td>Total Paid</td>
              <td>${currency}</td>
            </tr>
          </table>
          
          <a class="cta" href="${listingUrl}">View Order Details</a>
          
          <div style="margin-top: 24px; padding: 16px; background: #f8f9fa; border-radius: 8px;">
            <h4 style="margin: 0 0 8px 0;">What's Next?</h4>
            <ul style="margin: 0; padding-left: 20px; color: #666;">
              <li>The seller will be notified of your purchase</li>
              <li>You'll receive shipping information once the item is sent</li>
              <li>Questions? Reply to this email for support</li>
            </ul>
          </div>
          
          <p class="muted">This is an automated email. If you have any questions, reply to this message and we'll help you out!</p>
        </div>
        <div class="footer">
          <strong>Comicogs</strong> · The Ultimate Comic Collection Platform<br>
          © ${new Date().getFullYear()} · <a href="#" style="color: #666;">Unsubscribe</a> · <a href="#" style="color: #666;">Support</a>
        </div>
      </div>
    </body>
  </html>
  `;
}
