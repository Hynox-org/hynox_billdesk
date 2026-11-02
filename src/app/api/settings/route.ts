import { NextRequest, NextResponse } from 'next/server';
import { authCookieOptions, getAuthenticatedUserAndTenant, signAuthToken, COOKIE_NAME } from '@/lib/auth';
import { fromSupabase, toSupabase } from '@/lib/supabase-mappers';

export async function GET() {
  const auth = await getAuthenticatedUserAndTenant();
  if (!auth?.tenant) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json({ success: true, user: auth.user, tenant: { ...auth.tenant,
    daysRemaining: auth.trialInfo?.daysRemaining ?? 0, isExpired: auth.trialInfo?.isExpired ?? false, isPro: auth.trialInfo?.isPro ?? false } });
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUserAndTenant();
    if (!auth?.tenant) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    if (body.fullName?.trim()) await auth.supabase.from('profiles').update({ full_name: body.fullName.trim() }).eq('id', auth.user.id);
    const allowed = ['businessName','businessType','phone','address','currency','location','city','province','provinceCode','zip','country',
      'defaultEmployee','defaultTaxName','defaultTaxRate','defaultTax2Name','deviceId','gstNumber','showGstOnReceipt','enableTaxOnCheckout',
      'defaultTaxType','googleProfileUrl','showGoogleReviewOnReceipt'];
    const changes = toSupabase(Object.fromEntries(allowed.filter((key) => body[key] !== undefined).map((key) => [key, typeof body[key] === 'string' ? body[key].trim() : body[key]])));
    if (Object.keys(changes).length) await auth.supabase.from('tenants').update(changes).eq('id', auth.tenant.id);
    const [{ data: userRow }, { data: tenantRow }] = await Promise.all([
      auth.supabase.from('profiles').select('*').eq('id', auth.user.id).single(), auth.supabase.from('tenants').select('*').eq('id', auth.tenant.id).single(),
    ]);
    const user: any = fromSupabase(userRow); const tenant: any = fromSupabase(tenantRow);
    const token = signAuthToken({ userId: user.id, email: user.email, fullName: user.fullName,
      role: user.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'VENDOR', tenantId: tenant.id, businessName: tenant.businessName });
    const response = NextResponse.json({ success: true, message: 'Business and personal profile saved successfully', user, tenant });
    response.cookies.set(COOKIE_NAME, token, authCookieOptions(15 * 86400));
    return response;
  } catch (error: any) { return NextResponse.json({ error: error.message || 'Failed to update settings' }, { status: 500 }); }
}
