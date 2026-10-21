/**
 * Brevo Email Verification Script
 * Usage: node scripts/test-brevo-email.js [recipient-email]
 */

const fs = require('fs');
const path = require('path');

// Load environment variables manually from .env
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.slice(1, -1);
        } else if (val.startsWith("'") && val.endsWith("'")) {
          val = val.slice(1, -1);
        }
        process.env[key] = val;
      }
    }
  });
}

const apiKey = process.env.BREVO_API_KEY;
const senderEmail = process.env.BREVO_SENDER_EMAIL;
const senderName = process.env.BREVO_SENDER_NAME || 'HYNOX Billing';
const targetEmail = process.argv[2] || senderEmail;

console.log('--- Brevo Configuration Check ---');
console.log('API Key configured:', apiKey ? 'YES (starts with ' + apiKey.slice(0, 10) + '...)' : 'MISSING');
console.log('Sender Email:', senderEmail || 'MISSING');
console.log('Sender Name:', senderName);
console.log('Target Recipient:', targetEmail || 'MISSING');
console.log('---------------------------------');

if (!apiKey) {
  console.error('ERROR: BREVO_API_KEY is not set in .env.');
  console.error('Please add: BREVO_API_KEY="xkeysib-..." to your .env file.');
  process.exit(1);
}

if (!senderEmail) {
  console.error('ERROR: BREVO_SENDER_EMAIL is not set in .env.');
  console.error('Please add: BREVO_SENDER_EMAIL="notifications@yourdomain.com" to your .env file.');
  process.exit(1);
}

if (!targetEmail) {
  console.error('ERROR: Please specify a recipient email: node scripts/test-brevo-email.js <your-email>');
  process.exit(1);
}

async function run() {
  console.log(`Sending test email to ${targetEmail} via Brevo REST API v3...`);

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': apiKey.trim(),
      },
      body: JSON.stringify({
        sender: {
          name: senderName,
          email: senderEmail,
        },
        to: [
          {
            email: targetEmail,
            name: 'BillDesk Administrator',
          },
        ],
        subject: 'BillDesk - Brevo Configuration Verified',
        htmlContent: `
          <div style="font-family: sans-serif; background: #0b0f17; color: #e2e8f0; padding: 32px; border-radius: 12px;">
            <h1 style="color: #25D366; margin: 0 0 16px 0;">BillDesk Brevo Email Verified</h1>
            <p>Your Brevo transactional email configuration is active and connected to domain <strong>${senderEmail.split('@')[1]}</strong>.</p>
            <p>Ready to dispatch customer invoices, receipts, and order updates.</p>
            <p style="color: #64748b; font-size: 12px; margin-top: 24px;">Sent from BillDesk CLI test utility.</p>
          </div>
        `,
      }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      console.error('Brevo API Error:', res.status, data);
      process.exit(1);
    }

    console.log('SUCCESS: Email sent successfully!');
    console.log('Message ID:', data && data.messageId);
    console.log(`Please check the inbox of ${targetEmail}.`);
  } catch (err) {
    console.error('Failed to send test email:', err.message);
    process.exit(1);
  }
}

run();
