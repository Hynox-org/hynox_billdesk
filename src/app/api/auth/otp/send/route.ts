import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';
import { Otp, OtpType } from '@/models/Otp';
import { sendEmail, buildBrandedEmailHtml } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, type } = body as { email?: string; type?: OtpType };

    if (!email || !email.trim()) {
      return NextResponse.json({ error: 'Email address is required' }, { status: 400 });
    }

    if (!type || !['REGISTER', 'RESET_PASSWORD', 'FORGOT_PASSWORD'].includes(type)) {
      return NextResponse.json({ error: 'Valid verification type is required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json({ error: 'Invalid email address format' }, { status: 400 });
    }

    await connectToDatabase();

    // Context-specific validations
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (type === 'REGISTER') {
      if (existingUser) {
        return NextResponse.json(
          { error: 'An account with this email address already exists. Please log in.' },
          { status: 409 }
        );
      }
    } else if (type === 'FORGOT_PASSWORD') {
      if (!existingUser) {
        return NextResponse.json(
          { error: 'No account was found with this email address.' },
          { status: 404 }
        );
      }
    } else if (type === 'RESET_PASSWORD') {
      if (!existingUser) {
        return NextResponse.json(
          { error: 'Account not found.' },
          { status: 404 }
        );
      }
    }

    // Rate-limiting check: Ensure at least 45 seconds between requests
    const recentOtp = await Otp.findOne({
      email: normalizedEmail,
      type,
      createdAt: { $gt: new Date(Date.now() - 45 * 1000) },
    });

    if (recentOtp) {
      return NextResponse.json(
        { error: 'Please wait 45 seconds before requesting another verification code.' },
        { status: 429 }
      );
    }

    // Generate 6-digit numeric OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Remove any previous active OTPs of this type for this email
    await Otp.deleteMany({ email: normalizedEmail, type });

    // Store new OTP
    await Otp.create({
      email: normalizedEmail,
      otp: otpCode,
      type,
      expiresAt,
    });

    // Content configuration based on type
    let subject = 'BillDesk - Email Verification Code';
    let title = 'Verify Your Email';
    let actionDesc = 'verify your email and complete your vendor account registration.';

    if (type === 'FORGOT_PASSWORD') {
      subject = 'BillDesk - Password Reset Code';
      title = 'Reset Your Password';
      actionDesc = 'reset your account password. If you did not request this, you can safely ignore this email.';
    } else if (type === 'RESET_PASSWORD') {
      subject = 'BillDesk - Security Verification Code';
      title = 'Password Change Request';
      actionDesc = 'confirm your password change in your store settings. If you did not perform this action, please secure your account immediately.';
    }

    const htmlContent = buildBrandedEmailHtml({
      title,
      preheader: `Your verification code is ${otpCode}`,
      contentHtml: `
        <h2 style="color: #ffffff; margin-top: 0; font-size: 20px;">${title}</h2>
        <p style="color: #cbd5e1; font-size: 15px;">
          Use the following 6-digit verification code to ${actionDesc}
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
          Never share this code with anyone. BillDesk staff will never ask for your verification code.
        </p>
      `,
      footerNote: 'This is an automated security verification message from BillDesk.',
    });

    const emailResult = await sendEmail({
      to: { email: normalizedEmail, name: existingUser?.fullName || 'Valued User' },
      subject,
      htmlContent,
      textContent: `Your BillDesk verification code is ${otpCode}. It expires in 10 minutes.`,
    });

    if (!emailResult.success) {
      console.error('[OTP Send Error]:', emailResult.error);
      return NextResponse.json(
        { error: 'Failed to dispatch verification email. Please check your email address or try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Verification code dispatched to ${normalizedEmail}`,
    });
  } catch (err: any) {
    console.error('[OTP Route Error]:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error while sending verification code' },
      { status: 500 }
    );
  }
}
