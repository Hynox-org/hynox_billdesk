import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserAndTenant, comparePassword, hashPassword } from '@/lib/auth';
import { User } from '@/models/User';
import { Otp } from '@/models/Otp';
import { sendEmail, buildBrandedEmailHtml } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUserAndTenant();
    if (!auth || !auth.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { currentPassword, newPassword, confirmPassword, otp } = await req.json();

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: 'Current password, new password, and password confirmation are required' },
        { status: 400 }
      );
    }

    if (!otp || !otp.trim()) {
      return NextResponse.json(
        { error: 'Email verification code is required. Please click "Send Verification Code" first.' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters in length' },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'New password and confirmation password do not match' },
        { status: 400 }
      );
    }

    // Verify current password against database hash
    const isCurrentValid = await comparePassword(currentPassword, auth.user.passwordHash);
    if (!isCurrentValid) {
      return NextResponse.json(
        { error: 'The current password you entered is incorrect' },
        { status: 400 }
      );
    }

    // Verify OTP for this user's email
    const normalizedEmail = auth.user.email.toLowerCase().trim();
    const otpDoc = await Otp.findOne({
      email: normalizedEmail,
      type: 'RESET_PASSWORD',
    });

    if (!otpDoc) {
      return NextResponse.json(
        { error: 'Email verification code expired or not found. Please request a new code.' },
        { status: 400 }
      );
    }

    if (otpDoc.otp !== otp.trim()) {
      otpDoc.attempts += 1;
      await otpDoc.save();
      return NextResponse.json(
        { error: 'Invalid verification code. Please check the 6-digit code sent to your email.' },
        { status: 400 }
      );
    }

    // Delete verified OTP
    await Otp.deleteOne({ _id: otpDoc._id });

    // Hash new password and update user record
    const newPasswordHash = await hashPassword(newPassword);
    await User.findByIdAndUpdate(auth.user._id, {
      passwordHash: newPasswordHash,
    });

    // Send security notification email
    const noticeHtml = buildBrandedEmailHtml({
      title: 'Security Alert: Password Changed',
      preheader: 'Your HYNOX Billing account password was successfully updated.',
      contentHtml: `
        <h2 style="color: #25D366; margin-top: 0;">Password Successfully Changed</h2>
        <p>Hello <strong>${auth.user.fullName}</strong>,</p>
        <p>Your HYNOX Billing password has been updated from the store settings security panel.</p>
        <div style="background: rgba(37, 211, 102, 0.08); border-left: 4px solid #25D366; padding: 12px 16px; margin: 20px 0; border-radius: 4px;">
          <strong style="color: #ffffff;">Account:</strong> ${auth.user.email}<br/>
          <strong style="color: #ffffff;">Date & Time:</strong> ${new Date().toUTCString()}
        </div>
        <p style="color: #94a3b8; font-size: 13px;">
          If you did not perform this change, please contact support immediately to lock and secure your account.
        </p>
      `,
    });

    sendEmail({
      to: { email: auth.user.email, name: auth.user.fullName },
      subject: 'HYNOX Billing - Security Alert: Password Updated',
      htmlContent: noticeHtml,
      textContent: 'Your HYNOX Billing password was recently updated in your account settings.',
    }).catch((e) => console.error('[Password Change Notice Failed]:', e));

    return NextResponse.json({
      success: true,
      message: 'Your password has been successfully reset. Please use your new password next time you sign in.',
    });
  } catch (error: any) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to reset password' },
      { status: 500 }
    );
  }
}
