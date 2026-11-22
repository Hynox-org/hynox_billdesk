import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserAndTenant } from '@/lib/auth';
import { fromSupabase, rowsFromSupabase } from '@/lib/supabase-mappers';

export async function GET() {
  const auth = await getAuthenticatedUserAndTenant();
  if (!auth?.tenant) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data, error } = await auth.supabase.from('categories').select('*').order('display_order').order('created_at');
  return error ? NextResponse.json({ error: error.message }, { status: 500 }) : NextResponse.json({ success: true, categories: rowsFromSupabase(data) });
}

export async function POST(req: NextRequest) {
  const auth = await getAuthenticatedUserAndTenant();
  if (!auth?.tenant) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (auth.trialInfo?.isExpired) return NextResponse.json({ error: 'TRIAL_EXPIRED', message: 'Your 15-day free trial has expired. Please contact support to upgrade to Pro.' }, { status: 403 });
  const { name, displayOrder = 0 } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
  const { data, error } = await auth.supabase.from('categories').insert({ tenant_id: auth.tenant.id, name: name.trim(), display_order: Number(displayOrder) || 0 }).select().single();
  if (error) return NextResponse.json({ error: error.code === '23505' ? 'A category with this name already exists in your catalog' : error.message }, { status: error.code === '23505' ? 409 : 500 });
  return NextResponse.json({ success: true, category: fromSupabase(data) }, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const auth = await getAuthenticatedUserAndTenant();
  if (!auth?.tenant) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (auth.trialInfo?.isExpired) return NextResponse.json({ error: 'TRIAL_EXPIRED', message: 'Trial expired. Cannot modify categories.' }, { status: 403 });
  const { id, name, displayOrder, isActive } = await req.json();
  if (!id) return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
  const changes: Record<string, any> = {};
  if (name !== undefined) changes.name = name.trim();
  if (displayOrder !== undefined) changes.display_order = Number(displayOrder);
  if (isActive !== undefined) changes.is_active = Boolean(isActive);
  const { data, error } = await auth.supabase.from('categories').update(changes).eq('id', id).select().maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return data ? NextResponse.json({ success: true, category: fromSupabase(data) }) : NextResponse.json({ error: 'Category not found' }, { status: 404 });
}

export async function DELETE(req: NextRequest) {
  const auth = await getAuthenticatedUserAndTenant();
  if (!auth?.tenant) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (auth.trialInfo?.isExpired) return NextResponse.json({ error: 'TRIAL_EXPIRED', message: 'Trial expired. Cannot delete categories.' }, { status: 403 });
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
  const { count } = await auth.supabase.from('products').select('id', { count: 'exact', head: true }).eq('category_id', id);
  if (count) return NextResponse.json({ error: `Cannot delete category containing ${count} items. Move or delete items first.` }, { status: 400 });
  const { error } = await auth.supabase.from('categories').delete().eq('id', id);
  return error ? NextResponse.json({ error: error.message }, { status: 500 }) : NextResponse.json({ success: true, message: 'Category deleted' });
}
