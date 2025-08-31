import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

const feedbackSchema = z.object({
  message: z.string().min(1).max(1000),
  type: z.enum(['bug', 'feature', 'general']).optional().default('general'),
  page: z.string().optional(),
  userAgent: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { message, type, page, userAgent } = feedbackSchema.parse(body);

    const feedbackData = {
      message,
      type,
      page,
      userAgent,
      userEmail: session.user.email,
      userName: session.user.name || 'Unknown',
      timestamp: new Date().toISOString(),
    };

    // Option 1: Send to Slack webhook (if configured)
    const webhookUrl = process.env.FEEDBACK_WEBHOOK_URL;
    if (webhookUrl) {
      const slackMessage = {
        text: `New Alpha Feedback - ${type}`,
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: `🔸 Alpha Feedback: ${type.toUpperCase()}`
            }
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*User:* ${feedbackData.userName} (${feedbackData.userEmail})`
              },
              {
                type: 'mrkdwn',
                text: `*Page:* ${page || 'Unknown'}`
              }
            ]
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Message:*\n${message}`
            }
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `User Agent: ${userAgent || 'Unknown'} | ${feedbackData.timestamp}`
              }
            ]
          }
        ]
      };

      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slackMessage),
      });
    }

    // Option 2: Store in database (if Prisma is available)
    // Uncomment when database schema is ready:
    /*
    const feedback = await prisma.feedback.create({
      data: {
        message,
        type,
        page,
        userAgent,
        userEmail: session.user.email,
        userName: session.user.name || 'Unknown',
      }
    });
    */

    // For now, just log to console
    console.log('Alpha Feedback Received:', feedbackData);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Feedback submission error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid feedback data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}
