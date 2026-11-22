import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { email, type, password, metadata } = await req.json();
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail))
      return NextResponse.json({ error: 'Invalid email address format' }, { status: 400 });
    const supabase = createPublicClient();
    let error: { message: string } | null = null;
    if (type === 'REGISTER') {
      if (!password || String(password).length < 6) return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
      ({ error } = await supabase.auth.signUp({ email: normalizedEmail, password, options: { data: metadata || {} } }));
      if (error && error.message.toLowerCase().includes('already registered')) {
        const resendResult = await supabase.auth.resend({ type: 'signup', email: normalizedEmail });
        if (!resendResult.error) {
          error = null;
        }
      }
    } else if (type === 'FORGOT_PASSWORD') {
      ({ error } = await supabase.auth.resetPasswordForEmail(normalizedEmail));
    } else {
      return NextResponse.json({ error: 'Password-change verification must be requested while signed in' }, { status: 400 });
    }
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true, message: `Verification code dispatched to ${normalizedEmail}` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to send verification code' }, { status: 500 });
  }
}
