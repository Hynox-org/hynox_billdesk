import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';
import { Otp } from '@/models/Otp';
import { hashPassword } from '@/lib/auth';
import { sendEmail, buildBrandedEmailHtml } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, otp, newPassword, confirmPassword } = body;

    if (!email || !otp || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: 'All fields (Email, Verification Code, New Password, Confirm Password) are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'New password and confirmation password do not match' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const normalizedEmail = email.toLowerCase().trim();

    // Verify OTP
    const otpDoc = await Otp.findOne({
      email: normalizedEmail,
      type: 'FORGOT_PASSWORD',
    });

    if (!otpDoc) {
      return NextResponse.json(
        { error: 'Verification code expired or not found. Please request a new code.' },
        { status: 400 }
      );
    }

    if (otpDoc.otp !== otp.trim()) {
      otpDoc.attempts += 1;
      await otpDoc.save();
      return NextResponse.json(
        { error: 'Invalid verification code. Please check your inbox and try again.' },
        { status: 400 }
      );
    }

    // Find User
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return NextResponse.json(
        { error: 'No account found with this email address' },
        { status: 404 }
      );
    }

    // Update password
    const newHash = await hashPassword(newPassword);
    user.passwordHash = newHash;
    await user.save();

    // Delete verified OTP
    await Otp.deleteOne({ _id: otpDoc._id });

    // Send security notification email
    const securityEmailHtml = buildBrandedEmailHtml({
      title: 'Password Reset Successful',
      preheader: 'Your BillDesk account password was successfully reset.',
      contentHtml: `
        <h2 style="color: #25D366; margin-top: 0;">Password Successfully Reset</h2>
        <p>Hello <strong>${user.fullName}</strong>,</p>
        <p>Your BillDesk account password has been reset successfully using email verification.</p>
        <p>You can now sign in with your new password.</p>
        <div style="background: rgba(37, 211, 102, 0.08); border-left: 4px solid #25D366; padding: 12px 16px; margin: 20px 0; border-radius: 4px;">
          <strong style="color: #ffffff;">Account:</strong> ${user.email}<br/>
          <strong style="color: #ffffff;">Time:</strong> ${new Date().toUTCString()}
        </div>
        <p style="color: #94a3b8; font-size: 13px;">
          If you did not make this change, please contact your administrator or reply to this email immediately.
        </p>
      `,
      actionButton: {
        text: 'Sign In to BillDesk',
        url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login`,
      },
    });

    sendEmail({
      to: { email: user.email, name: user.fullName },
      subject: 'BillDesk - Your Password Was Reset',
      htmlContent: securityEmailHtml,
      textContent: 'Your BillDesk account password was successfully reset.',
    }).catch((e) => console.error('[Password Reset Notice Failed]:', e));

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully. You can now sign in with your new password.',
    });
  } catch (err: any) {
    console.error('[Forgot Password Error]:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error while resetting password' },
      { status: 500 }
    );
  }
}
