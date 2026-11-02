import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAuthenticatedUserAndTenant } from '@/lib/auth';
import { ACCESS_COOKIE, REFRESH_COOKIE, createPublicClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const auth = await getAuthenticatedUserAndTenant();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { currentPassword, newPassword, confirmPassword, otp } = await req.json();
  if (!currentPassword || !otp) return NextResponse.json({ error: 'Current password and email verification code are required' }, { status: 400 });
  if (!newPassword || newPassword.length < 6 || newPassword !== confirmPassword) return NextResponse.json({ error: 'Enter matching new passwords of at least 6 characters' }, { status: 400 });
  const client = createPublicClient();
  const { error: currentError } = await client.auth.signInWithPassword({ email: auth.user.email, password: currentPassword });
  if (currentError) return NextResponse.json({ error: 'The current password you entered is incorrect' }, { status: 400 });
  const store = await cookies();
  const { error: sessionError } = await client.auth.setSession({ access_token: store.get(ACCESS_COOKIE)?.value || '', refresh_token: store.get(REFRESH_COOKIE)?.value || '' });
  if (sessionError) return NextResponse.json({ error: 'Your session expired. Please sign in again.' }, { status: 401 });
  const { error } = await client.auth.updateUser({ password: newPassword, nonce: String(otp).trim() });
  return error ? NextResponse.json({ error: error.message }, { status: 400 }) : NextResponse.json({ success: true, message: 'Your password has been successfully reset.' });
}
