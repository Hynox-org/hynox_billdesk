/**
 * Brevo (formerly Sendinblue) Transactional Email Service
 * Uses Brevo REST API v3 (POST https://api.brevo.com/v3/smtp/email)
 * Requires no external dependencies, works seamlessly in Next.js.
 */

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface SendEmailOptions {
  to: EmailRecipient | EmailRecipient[];
  subject: string;
  htmlContent: string;
  textContent?: string;
  senderName?: string;
  senderEmail?: string;
  replyTo?: EmailRecipient;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Sends a transactional email using the Brevo REST API v3.
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const apiKey = process.env.BREVO_API_KEY;
  const defaultSenderEmail = process.env.BREVO_SENDER_EMAIL;
  const defaultSenderName = process.env.BREVO_SENDER_NAME || 'HYNOX Billing';

  if (!apiKey) {
    console.error('[Brevo Email] BREVO_API_KEY is not defined in environment variables.');
    return {
      success: false,
      error: 'Brevo API key is not configured in .env',
    };
  }

  const senderEmail = options.senderEmail || defaultSenderEmail;
  if (!senderEmail) {
    console.error('[Brevo Email] BREVO_SENDER_EMAIL is not defined in environment variables.');
    return {
      success: false,
      error: 'Brevo sender email is not configured in .env',
    };
  }

  const senderName = options.senderName || defaultSenderName;
  const recipients = Array.isArray(options.to) ? options.to : [options.to];

  if (recipients.length === 0) {
    return {
      success: false,
      error: 'No recipients provided',
    };
  }

  const payload: Record<string, any> = {
    sender: {
      name: senderName,
      email: senderEmail,
    },
    to: recipients.map((r) => ({
      email: r.email,
      name: r.name || r.email.split('@')[0],
    })),
    subject: options.subject,
    htmlContent: options.htmlContent,
  };

  if (options.textContent) {
    payload.textContent = options.textContent;
  }

  if (options.replyTo) {
    payload.replyTo = options.replyTo;
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': apiKey.trim(),
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg = data?.message || `Brevo API returned status ${response.status}`;
      console.error('[Brevo Email Error]:', errorMsg, data);
      return {
        success: false,
        error: errorMsg,
      };
    }

    return {
      success: true,
      messageId: data?.messageId,
    };
  } catch (err: any) {
    console.error('[Brevo Network Error]:', err);
    return {
      success: false,
      error: err.message || 'Failed to communicate with Brevo API',
    };
  }
}

/**
 * Standard branded email layout wrapper for HYNOX Billing notifications.
 * Uses clean green palette (#25D366, #059669) and responsive structure.
 */
export function buildBrandedEmailHtml(params: {
  title: string;
  preheader?: string;
  contentHtml: string;
  actionButton?: {
    text: string;
    url: string;
  };
  footerNote?: string;
}): string {
  const { title, preheader = '', contentHtml, actionButton, footerNote } = params;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0b0f17;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #e2e8f0;
      line-height: 1.6;
    }
    .wrapper {
      width: 100%;
      background-color: #0b0f17;
      padding: 40px 16px;
    }
    .container {
      max-width: 580px;
      margin: 0 auto;
      background-color: #111827;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    }
    .header {
      padding: 28px 32px;
      background: linear-gradient(135deg, #064e3b 0%, #047857 100%);
      border-bottom: 1px solid rgba(74, 222, 128, 0.2);
    }
    .brand-title {
      font-size: 20px;
      font-weight: 800;
      color: #ffffff;
      margin: 0;
      letter-spacing: -0.02em;
    }
    .brand-subtitle {
      font-size: 12px;
      color: #a7f3d0;
      margin: 4px 0 0 0;
      font-weight: 500;
    }
    .body-content {
      padding: 32px;
      color: #cbd5e1;
      font-size: 15px;
    }
    .btn {
      display: inline-block;
      padding: 12px 28px;
      background: #25D366;
      color: #052e16 !important;
      text-decoration: none;
      font-weight: 700;
      border-radius: 8px;
      font-size: 14px;
      margin-top: 20px;
    }
    .footer {
      padding: 20px 32px;
      background-color: #0d131f;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      font-size: 12px;
      color: #64748b;
      text-align: center;
    }
  </style>
</head>
<body>
  <div style="display:none;font-size:1px;color:#0b0f17;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${preheader}
  </div>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1 class="brand-title">HYNOX Billing</h1>
        <p class="brand-subtitle">Order & Billing Workspace</p>
      </div>
      <div class="body-content">
        ${contentHtml}
        ${actionButton ? `<div style="text-align: center; margin-top: 28px;"><a href="${actionButton.url}" class="btn" target="_blank">${actionButton.text}</a></div>` : ''}
      </div>
      <div class="footer">
        <p style="margin: 0 0 6px 0;">This is an automated notification from HYNOX Billing.</p>
        ${footerNote ? `<p style="margin: 0;">${footerNote}</p>` : ''}
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}
