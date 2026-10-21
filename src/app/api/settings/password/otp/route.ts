import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserAndTenant, comparePassword } from '@/lib/auth';
import { Otp } from '@/models/Otp';
import { sendEmail, buildBrandedEmailHtml } from '@/lib/email';
import { connectToDatabase } from '@/lib/mongodb';

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUserAndTenant();
    if (!auth || !auth.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { currentPassword, newPassword, confirmPassword } = body;

    // 1. Validate required fields
    if (!currentPassword || !currentPassword.trim()) {
      return NextResponse.json(
        { error: 'Please enter your current password' },
        { status: 400 }
      );
    }

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    if (!confirmPassword) {
      return NextResponse.json(
        { error: 'Please confirm your new password' },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'New password and confirmation password do not match' },
        { status: 400 }
      );
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        { error: 'New password must be different from your current password' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // 2. Validate current password against stored database hash FIRST
    const isCurrentValid = await comparePassword(currentPassword, auth.user.passwordHash);
    if (!isCurrentValid) {
      return NextResponse.json(
        { error: 'The current password you entered is incorrect' },
        { status: 400 }
      );
    }

    const normalizedEmail = auth.user.email.toLowerCase().trim();

    // 3. Rate limiting check: 45 seconds cooldown
    const recentOtp = await Otp.findOne({
      email: normalizedEmail,
      type: 'RESET_PASSWORD',
      createdAt: { $gt: new Date(Date.now() - 45 * 1000) },
    });

    if (recentOtp) {
      return NextResponse.json(
        { error: 'Please wait 45 seconds before requesting another verification code' },
        { status: 429 }
      );
    }

    // 4. Generate 6-digit numeric OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Clean up any old reset OTPs
    await Otp.deleteMany({ email: normalizedEmail, type: 'RESET_PASSWORD' });

    // Save new OTP
    await Otp.create({
      email: normalizedEmail,
      otp: otpCode,
      type: 'RESET_PASSWORD',
      expiresAt,
    });

    // 5. Build and send branded verification email via Brevo
    const htmlContent = buildBrandedEmailHtml({
      title: 'Password Change Verification',
      preheader: `Your verification code is ${otpCode}`,
      contentHtml: `
        <h2 style="color: #ffffff; margin-top: 0; font-size: 20px;">Password Change Verification</h2>
        <p style="color: #cbd5e1; font-size: 15px;">
          Hello <strong>${auth.user.fullName}</strong>,<br/>
          Your current password was successfully verified. To finalize changing your password, enter the following 6-digit security code:
        </p>

        <div style="background: rgba(37, 211, 102, 0.08); border: 1px solid rgba(37, 211, 102, 0.3); border-radius: 12px; padding: 24px; text-align: center; margin: 28px 0;">
          <div style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #25D366; font-family: monospace;">
            ${otpCode}
          </div>
          <p style="color: #94a3b8; font-size: 13px; margin: 10px 0 0 0;">
            This code will expire in <strong>10 minutes</strong>.
          </p>
        </div>

        <p style="color: #64748b; font-size: 13px; margin-top: 24px;">
          If you did not initiate this password change request, please contact administrator immediately.
        </p>
      `,
      footerNote: 'This is an automated security verification message from HYNOX Billing.',
    });

    const emailResult = await sendEmail({
      to: { email: normalizedEmail, name: auth.user.fullName },
      subject: 'HYNOX Billing - Security Verification Code for Password Reset',
      htmlContent,
      textContent: `Your password reset verification code is ${otpCode}. It expires in 10 minutes.`,
    });

    if (!emailResult.success) {
      return NextResponse.json(
        { error: 'Failed to send verification email. Please try again later.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Current password verified. A 6-digit verification code has been dispatched to ${normalizedEmail}.`,
    });
  } catch (err: any) {
    console.error('[Settings Password OTP Error]:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error while verifying and sending code' },
      { status: 500 }
    );
  }
}
