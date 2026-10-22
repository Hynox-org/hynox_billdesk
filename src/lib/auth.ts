import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { connectToDatabase } from './mongodb';
import { Tenant, ITenant } from '@/models/Tenant';
import { User, IUser } from '@/models/User';

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

export interface TenantTrialInfo {
  isExpired: boolean;
  daysRemaining: number;
  isPro: boolean;
  plan: 'FREE_TRIAL' | 'PRO';
  status: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED';
  trialEndsAt: Date;
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signAuthToken(payload: AuthSession): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '15d' });
}

export function verifyAuthToken(token: string): AuthSession | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthSession;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<AuthSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAuthToken(token);
}

export function computeTrialInfo(tenant: ITenant): TenantTrialInfo {
  const isPro = tenant.plan === 'PRO' && tenant.status !== 'SUSPENDED';
  const now = new Date().getTime();
  const endsAt = new Date(tenant.trialEndsAt).getTime();
  const diffMs = endsAt - now;
  const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  const isExpired = !isPro && diffMs <= 0;

  return {
    isExpired,
    daysRemaining: isPro ? 999 : daysRemaining,
    isPro,
    plan: tenant.plan,
    status: isExpired ? 'EXPIRED' : tenant.status,
    trialEndsAt: tenant.trialEndsAt,
  };
}

export async function getAuthenticatedUserAndTenant(): Promise<{
  session: AuthSession;
  user: IUser;
  tenant: ITenant | null;
  trialInfo: TenantTrialInfo | null;
} | null> {
  const session = await getSession();
  if (!session) return null;

  await connectToDatabase();
  const [user, tenantDoc] = await Promise.all([
    User.findById(session.userId),
    session.tenantId ? Tenant.findById(session.tenantId) : Promise.resolve(null),
  ]);
  if (!user || !user.isActive) return null;

  let tenant: ITenant | null = tenantDoc;
  let trialInfo: TenantTrialInfo | null = null;

  if (tenant) {
    trialInfo = computeTrialInfo(tenant);
    // Auto-sync status if expired
    if (trialInfo.isExpired && tenant.status === 'ACTIVE') {
      tenant.status = 'EXPIRED';
      await tenant.save();
    }
  }

  return { session, user, tenant, trialInfo };
}

export { COOKIE_NAME };
