import { NextRequest, NextResponse } from 'next/server';
import { authCookieOptions, computeTrialInfo, COOKIE_NAME, signAuthToken } from '@/lib/auth';
import { ACCESS_COOKIE, REFRESH_COOKIE, createPublicClient, createUserClient, throwIfError } from '@/lib/supabase';
import { fromSupabase } from '@/lib/supabase-mappers';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    const publicClient = createPublicClient();
    const { data, error } = await publicClient.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    if (error || !data.session || !data.user) return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });

    const supabase = createUserClient(data.session.access_token);

    const { data: profileRow, error: profileError } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
    throwIfError(profileError);
    const user: any = fromSupabase(profileRow);
    if (!user?.isActive) return NextResponse.json({ error: 'This account has been deactivated. Please contact support.' }, { status: 403 });

    let tenant: any = null;
    let trialInfo = null;
    if (user.tenantId) {
      const { data: tenantRow, error: tenantError } = await supabase.from('tenants').select('*').eq('id', user.tenantId).single();
      throwIfError(tenantError);
      tenant = fromSupabase(tenantRow);
      trialInfo = computeTrialInfo(tenant);
    }
    const role = user.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'VENDOR';
    const contextToken = signAuthToken({ userId: user.id, email: user.email, fullName: user.fullName, role,
      tenantId: tenant?.id, businessName: tenant?.businessName });
    const response = NextResponse.json({ success: true, user: { id: user.id, email: user.email, fullName: user.fullName, role },
      tenant: tenant ? { id: tenant.id, businessName: tenant.businessName, phone: tenant.phone, currency: tenant.currency,
        address: tenant.address, plan: tenant.plan, status: tenant.status, trialEndsAt: tenant.trialEndsAt,
        daysRemaining: trialInfo?.daysRemaining ?? 0, isExpired: trialInfo?.isExpired ?? false } : null });
    response.cookies.set(COOKIE_NAME, contextToken, authCookieOptions(15 * 86400));
    response.cookies.set(ACCESS_COOKIE, data.session.access_token, authCookieOptions(data.session.expires_in));
    response.cookies.set(REFRESH_COOKIE, data.session.refresh_token, authCookieOptions(15 * 86400));
    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: error.message || 'Login failed' }, { status: 500 });
  }
}
