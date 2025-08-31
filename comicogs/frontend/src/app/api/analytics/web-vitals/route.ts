import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const webVitalSchema = z.object({
  metric: z.enum(['CLS', 'INP', 'FCP', 'LCP', 'TTFB']),
  value: z.number(),
  rating: z.enum(['good', 'needs-improvement', 'poor']),
  id: z.string(),
  url: z.string(),
  timestamp: z.number(),
  user_agent: z.string().optional(),
  connection: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const vitalData = webVitalSchema.parse(body);

    // Log to console for alpha debugging
    console.log('📊 Web Vital Received:', {
      metric: vitalData.metric,
      value: Math.round(vitalData.value * 100) / 100,
      rating: vitalData.rating,
      url: vitalData.url,
      timestamp: new Date(vitalData.timestamp).toISOString(),
    });

    // Store in database (uncomment when ready)
    /*
    await prisma.webVital.create({
      data: {
        metric: vitalData.metric,
        value: vitalData.value,
        rating: vitalData.rating,
        url: vitalData.url,
        userAgent: vitalData.user_agent,
        connection: vitalData.connection,
        timestamp: new Date(vitalData.timestamp),
      }
    });
    */

    // Send to external analytics service (if configured)
    const analyticsWebhook = process.env.ANALYTICS_WEBHOOK_URL;
    if (analyticsWebhook) {
      await fetch(analyticsWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'web_vital',
          ...vitalData,
        }),
      });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Web vitals logging error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid web vital data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to log web vital' },
      { status: 500 }
    );
  }
}
