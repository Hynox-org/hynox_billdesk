import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { email, otp, newPassword, confirmPassword } = await req.json();
    if (!email || !otp || !newPassword || newPassword !== confirmPassword)
      return NextResponse.json({ error: 'Email, matching passwords, and verification code are required' }, { status: 400 });
    if (newPassword.length < 6) return NextResponse.json({ error: 'New password must be at least 6 characters long' }, { status: 400 });
    const supabase = createPublicClient();
    const { data, error } = await supabase.auth.verifyOtp({ email: email.trim().toLowerCase(), token: otp.trim(), type: 'recovery' });
    if (error || !data.session) return NextResponse.json({ error: error?.message || 'Invalid verification code' }, { status: 400 });
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });
    await supabase.auth.signOut();
    return NextResponse.json({ success: true, message: 'Password reset successfully. You can now sign in with your new password.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to reset password' }, { status: 500 });
  }
}
