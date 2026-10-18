import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, buildBrandedEmailHtml } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { to } = body;

    const targetEmail = to || process.env.BREVO_SENDER_EMAIL;

    if (!targetEmail) {
      return NextResponse.json(
        {
          error:
            'Please provide a recipient email address in the request body, or configure BREVO_SENDER_EMAIL in .env',
        },
        { status: 400 }
      );
    }

    const htmlContent = buildBrandedEmailHtml({
      title: 'Brevo Configuration Verified',
      preheader: 'Your Brevo email notifications are now active.',
      contentHtml: `
        <h2 style="color: #25D366; margin-top: 0;">Configuration Successful</h2>
        <p>Your <strong>Brevo</strong> domain and API integration with <strong>BillDesk</strong> is configured and operational.</p>
        <p>Transactional notifications, billing confirmations, and account security alerts can now be dispatched securely through your verified domain.</p>
        <div style="background: rgba(37, 211, 102, 0.08); border-left: 4px solid #25D366; padding: 12px 16px; margin: 20px 0; border-radius: 4px;">
          <strong style="color: #ffffff;">Sender Identity:</strong> ${process.env.BREVO_SENDER_NAME || 'BillDesk'} &lt;${process.env.BREVO_SENDER_EMAIL}&gt;<br/>
          <strong style="color: #ffffff;">Status:</strong> Connected via Brevo REST API v3
        </div>
      `,
      actionButton: {
        text: 'Go to BillDesk Dashboard',
        url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000/dashboard',
      },
      footerNote: 'Sent to verify transactional email delivery.',
    });

    const result = await sendEmail({
      to: { email: targetEmail },
      subject: 'BillDesk - Brevo Email Notification Test',
      htmlContent,
      textContent:
        'Your Brevo email configuration with BillDesk is active and operational.',
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Test email successfully dispatched to ${targetEmail}`,
      messageId: result.messageId,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal server error while testing Brevo email' },
      { status: 500 }
    );
  }
}
