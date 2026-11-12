import { NextResponse } from 'next/server';
import { getAuthenticatedUserAndTenant } from '@/lib/auth';
import { fromSupabase } from '@/lib/supabase-mappers';

export async function GET() {
  try {
    const auth = await getAuthenticatedUserAndTenant();
    if (!auth || auth.user.role !== 'SUPER_ADMIN') return NextResponse.json({ error: 'Super Admin access required' }, { status: 403 });
    const { data, error } = await auth.supabase.rpc('admin_get_tenants_overview');
    if (error) throw error;
    const tenants = (data.tenants || []).map((row: any) => {
      const tenant: any = fromSupabase(row);
      const isPro = tenant.plan !== 'FREE_TRIAL';
      const accessEnd = new Date(isPro ? tenant.proExpiresAt || 0 : tenant.trialEndsAt);
      const isExpired = tenant.status !== 'ACTIVE' || accessEnd.getTime() <= Date.now();
      return { ...tenant, accessEndsAt: accessEnd.toISOString(), daysRemaining: Math.max(0, Math.ceil((accessEnd.getTime() - Date.now()) / 86400000)), isExpired, isPro,
        owner: { fullName: row.owner_name, email: row.owner_email, isActive: true } };
    });
    return NextResponse.json({ success: true, stats: fromSupabase(data.stats), tenants });
  } catch (error: any) { return NextResponse.json({ error: error.message || 'Error fetching system tenants' }, { status: 500 }); }
}
