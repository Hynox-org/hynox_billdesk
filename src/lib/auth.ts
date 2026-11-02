import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { ACCESS_COOKIE, REFRESH_COOKIE, createPublicClient, createUserClient, throwIfError } from './supabase';
import { fromSupabase } from './supabase-mappers';

const JWT_SECRET = process.env.JWT_SECRET || 'whatsapp_saas_default_secret_key_change_me';
const COOKIE_NAME = 'wa_saas_token';

export interface AuthSession {
  userId: string;
  email: string;
  fullName: string;
  role: 'SUPER_ADMIN' | 'VENDOR';
  tenantId?: string;
  businessName?: string;
}

export interface ProfileRecord extends Record<string, any> {
  _id: string; id: string; tenantId?: string; fullName: string; email: string;
  role: 'SUPER_ADMIN' | 'VENDOR'; isActive: boolean;
}

export interface TenantRecord extends Record<string, any> {
  _id: string; id: string; plan: 'FREE_TRIAL' | 'PRO';
  status: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED'; trialEndsAt: string;
}

export interface TenantTrialInfo {
  isExpired: boolean; daysRemaining: number; isPro: boolean;
  plan: 'FREE_TRIAL' | 'PRO'; status: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED'; trialEndsAt: Date;
}

export function signAuthToken(payload: AuthSession): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '15d' });
}

export function verifyAuthToken(token: string): AuthSession | null {
  try { return jwt.verify(token, JWT_SECRET) as AuthSession; } catch { return null; }
}

export async function getSession(): Promise<AuthSession | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  return token ? verifyAuthToken(token) : null;
}

export function computeTrialInfo(tenant: TenantRecord): TenantTrialInfo {
  const isPro = tenant.plan === 'PRO' && tenant.status !== 'SUSPENDED';
  const trialEndsAt = new Date(tenant.trialEndsAt);
  const daysRemaining = Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / 86400000));
  const isExpired = !isPro && daysRemaining === 0;
  return { isExpired, daysRemaining: isPro ? 999 : daysRemaining, isPro, plan: tenant.plan,
    status: isExpired ? 'EXPIRED' : tenant.status, trialEndsAt };
}

async function authenticatedClient() {
  const cookieStore = await cookies();
  let accessToken = cookieStore.get(ACCESS_COOKIE)?.value;
  if (!accessToken) return null;
  let client = createUserClient(accessToken);
  let { data: { user } } = await client.auth.getUser(accessToken);
  if (!user) {
    const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value;
    if (!refreshToken) return null;
    const { data, error } = await createPublicClient().auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
    if (error || !data.session) return null;
    accessToken = data.session.access_token;
    client = createUserClient(accessToken);
    user = data.user;
    try {
      cookieStore.set(ACCESS_COOKIE, accessToken, authCookieOptions(data.session.expires_in));
      cookieStore.set(REFRESH_COOKIE, data.session.refresh_token, authCookieOptions(15 * 86400));
    } catch {}
  }
  return { client, user };
}

export async function getAuthenticatedUserAndTenant() {
  const auth = await authenticatedClient();
  if (!auth?.user) return null;

  const session = await getSession();
  if (session && session.userId !== auth.user.id) return null;

  const { data: profileRow, error: profileError } = await auth.client
    .from('profiles')
    .select('*')
    .eq('id', auth.user.id)
    .single();

  if (profileError || !profileRow || !profileRow.is_active) return null;
  const user = fromSupabase<ProfileRecord>(profileRow)!;
  let tenant: TenantRecord | null = null;
  if (user.tenantId) {
    const { data, error } = await auth.client.from('tenants').select('*').eq('id', user.tenantId).single();
    throwIfError(error);
    tenant = fromSupabase<TenantRecord>(data);
  }
  const trialInfo = tenant ? computeTrialInfo(tenant) : null;
  if (tenant && trialInfo?.isExpired && tenant.status === 'ACTIVE') {
    await auth.client.from('tenants').update({ status: 'EXPIRED' }).eq('id', tenant.id);
    tenant.status = 'EXPIRED';
  }

  const currentSession: AuthSession = session || {
    userId: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    tenantId: tenant?.id,
    businessName: tenant?.businessName,
  };

  return { session: currentSession, user, tenant, trialInfo, supabase: auth.client };
}

export function authCookieOptions(maxAge: number) {
  return { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/', maxAge };
}

export { COOKIE_NAME };
