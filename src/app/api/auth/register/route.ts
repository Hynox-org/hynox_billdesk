import { NextRequest, NextResponse } from 'next/server';
import { authCookieOptions, COOKIE_NAME, signAuthToken } from '@/lib/auth';
import { ACCESS_COOKIE, REFRESH_COOKIE, createPublicClient, createUserClient, throwIfError } from '@/lib/supabase';
import { fromSupabase } from '@/lib/supabase-mappers';

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail || !otp) return NextResponse.json({ error: 'Email verification code is required' }, { status: 400 });
    const { data, error } = await createPublicClient().auth.verifyOtp({ email: normalizedEmail, token: String(otp).trim(), type: 'signup' });
    if (error || !data.session || !data.user) return NextResponse.json({ error: error?.message || 'Invalid verification code' }, { status: 400 });
    const supabase = createUserClient(data.session.access_token);
    const { data: profileRow, error: profileError } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
    throwIfError(profileError);
    const user: any = fromSupabase(profileRow);
    const { data: tenantRow, error: tenantError } = await supabase.from('tenants').select('*').eq('id', user.tenantId).single();
    throwIfError(tenantError);
    const tenant: any = fromSupabase(tenantRow);
    supabase.functions.invoke('login-notification', {
      body: { businessName: tenant.businessName },
    }).catch(() => undefined);
    const token = signAuthToken({ userId: user.id, email: user.email, fullName: user.fullName, role: 'VENDOR',
      tenantId: tenant.id, businessName: tenant.businessName });
    const response = NextResponse.json({ success: true,
      user: { id: user.id, email: user.email, fullName: user.fullName, role: 'VENDOR' },
      tenant: { id: tenant.id, businessName: tenant.businessName, businessType: tenant.businessType,
        phone: tenant.phone, currency: tenant.currency, trialEndsAt: tenant.trialEndsAt, plan: tenant.plan, daysRemaining: 15 } });
    response.cookies.set(COOKIE_NAME, token, authCookieOptions(15 * 86400));
    response.cookies.set(ACCESS_COOKIE, data.session.access_token, authCookieOptions(data.session.expires_in));
    response.cookies.set(REFRESH_COOKIE, data.session.refresh_token, authCookieOptions(15 * 86400));
    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to complete registration' }, { status: 500 });
  }
}
