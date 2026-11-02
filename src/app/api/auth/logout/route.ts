import { NextResponse } from 'next/server';
import { COOKIE_NAME } from '@/lib/auth';
import { ACCESS_COOKIE, REFRESH_COOKIE, getUserClient } from '@/lib/supabase';

export async function POST() {
  await (await getUserClient())?.auth.signOut().catch(() => undefined);
  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
  for (const name of [COOKIE_NAME, ACCESS_COOKIE, REFRESH_COOKIE]) response.cookies.set(name, '', { path: '/', maxAge: 0 });
  return response;
}
