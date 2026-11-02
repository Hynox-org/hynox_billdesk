import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ahnuolokraefnmtqahhn.supabase.co';
export const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

export const ACCESS_COOKIE = 'hynox_access_token';
export const REFRESH_COOKIE = 'hynox_refresh_token';

export function createPublicClient(): SupabaseClient {
  if (!SUPABASE_KEY) throw new Error('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is not configured');
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function createUserClient(accessToken: string): SupabaseClient {
  if (!SUPABASE_KEY) throw new Error('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is not configured');
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function getUserClient(): Promise<SupabaseClient | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;
  return accessToken ? createUserClient(accessToken) : null;
}

export function throwIfError(error: { message: string } | null): void {
  if (error) throw new Error(error.message);
}

export async function getPublicReceiptByOrderNumber(orderNumber: string) {
  const { data, error } = await createPublicClient().rpc('get_public_receipt_by_order_number', {
    requested_order_number: orderNumber,
  });
  if (error) throw new Error(error.message);
  return data as Record<string, any> | null;
}

export async function getPublicReceiptByToken(token: string) {
  const { data, error } = await createPublicClient().rpc('get_public_receipt', {
    token,
  });
  if (error) throw new Error(error.message);
  return data as Record<string, any> | null;
}

export async function getPublicReceiptByIdentifier(identifier: string) {
  const clean = decodeURIComponent(identifier || '').trim();
  if (!clean) return null;

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clean);

  if (isUuid) {
    try {
      const byToken = await getPublicReceiptByToken(clean);
      if (byToken) return byToken;
    } catch {
      // Fall through to order number lookup
    }
  }

  try {
    const byOrderNum = await getPublicReceiptByOrderNumber(clean);
    if (byOrderNum) return byOrderNum;
  } catch {
    // Fall through
  }

  if (!isUuid) {
    try {
      const byTokenFallback = await getPublicReceiptByToken(clean);
      if (byTokenFallback) return byTokenFallback;
    } catch {
      // Fall through
    }
  }

  return null;
}

