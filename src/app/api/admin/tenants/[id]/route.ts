import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserAndTenant } from '@/lib/auth';
import { fromSupabase } from '@/lib/supabase-mappers';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getAuthenticatedUserAndTenant();
    if (!auth || auth.user.role !== 'SUPER_ADMIN') return NextResponse.json({ error: 'Super Admin access required' }, { status: 403 });
    const { id } = await params; const { action, days = 15, status } = await req.json();
    let data: any; let error: any;
    if (action === 'SET_STATUS') ({ data, error } = await auth.supabase.from('tenants').update({ status }).eq('id', id).select().maybeSingle());
    else ({ data, error } = await auth.supabase.rpc('admin_manage_tenant', { tenant_id: id, action, days: action === 'ACTIVATE_PRO' ? 365 : Math.max(1, Number(days) || 15) }));
    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    return NextResponse.json({ success: true, message: 'Tenant updated successfully', tenant: fromSupabase(data) });
  } catch (error: any) { return NextResponse.json({ error: error.message || 'Failed to update tenant' }, { status: 500 }); }
}
