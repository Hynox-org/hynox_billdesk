import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserAndTenant } from '@/lib/auth';
import { createPublicClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const auth = await getAuthenticatedUserAndTenant();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { currentPassword, newPassword, confirmPassword } = await req.json();
  if (!currentPassword) return NextResponse.json({ error: 'Please enter your current password' }, { status: 400 });
  if (!newPassword || newPassword.length < 6 || newPassword !== confirmPassword) return NextResponse.json({ error: 'Enter matching new passwords of at least 6 characters' }, { status: 400 });
  const client = createPublicClient();
  const { error: signInError } = await client.auth.signInWithPassword({ email: auth.user.email, password: currentPassword });
  if (signInError) return NextResponse.json({ error: 'The current password you entered is incorrect' }, { status: 400 });
  const { error } = await client.auth.reauthenticate();
  return error ? NextResponse.json({ error: error.message }, { status: 400 }) : NextResponse.json({ success: true, message: `Current password verified. A 6-digit verification code has been dispatched to ${auth.user.email}.` });
}
