import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserAndTenant } from '@/lib/auth';
import { fromSupabase, rowsFromSupabase, toSupabase } from '@/lib/supabase-mappers';

export async function GET(req: NextRequest) {
  const auth = await getAuthenticatedUserAndTenant();
  if (!auth?.tenant) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const params = new URL(req.url).searchParams;
  let query = auth.supabase.from('products').select('*, category:categories(id,name)').order('created_at', { ascending: false });
  if (params.get('categoryId')) query = query.eq('category_id', params.get('categoryId')!);
  if (params.get('availableOnly') === 'true') query = query.eq('is_available', true);
  const { data, error } = await query;
  const products = rowsFromSupabase(data).map((p: any) => ({ ...p, categoryId: p.category ? { _id: p.category.id, ...p.category } : p.categoryId }));
  return error ? NextResponse.json({ error: error.message }, { status: 500 }) : NextResponse.json({ success: true, products, currency: auth.tenant.currency || '$' });
}

export async function POST(req: NextRequest) {
  const auth = await getAuthenticatedUserAndTenant();
  if (!auth?.tenant) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (auth.trialInfo?.isExpired) return NextResponse.json({ error: 'TRIAL_EXPIRED', message: 'Your 15-day free trial has expired. Contact support to upgrade.' }, { status: 403 });
  const body = await req.json();
  const categoryId = typeof body.categoryId === 'object' ? body.categoryId?._id || body.categoryId?.id : body.categoryId;
  if (!categoryId || !body.name || body.price === undefined) return NextResponse.json({ error: 'Category, Product Name, and Price are required' }, { status: 400 });
  const { data: category } = await auth.supabase.from('categories').select('id').eq('id', categoryId).maybeSingle();
  if (!category) return NextResponse.json({ error: 'Invalid category for this store' }, { status: 400 });
  const value = {
    tenant_id: auth.tenant.id,
    category_id: categoryId,
    name: body.name.trim(),
    description: body.description?.trim() || '',
    price: Math.max(0, Number(body.price)),
    sku: body.sku?.trim() || '',
    is_available: body.isAvailable !== false,
    track_stock: Boolean(body.trackStock),
    stock_quantity: body.trackStock ? Math.max(0, parseInt(body.stockQuantity, 10) || 0) : 0,
    image_url: body.imageUrl?.trim() || '',
  };
  const { data, error } = await auth.supabase.from('products').insert(value).select().single();
  return error ? NextResponse.json({ error: error.message }, { status: 500 }) : NextResponse.json({ success: true, product: fromSupabase(data) }, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const auth = await getAuthenticatedUserAndTenant();
  if (!auth?.tenant) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (auth.trialInfo?.isExpired) return NextResponse.json({ error: 'TRIAL_EXPIRED', message: 'Trial expired. Cannot modify products.' }, { status: 403 });
  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
  const allowed = ['categoryId','name','description','price','sku','isAvailable','trackStock','stockQuantity','imageUrl'];
  const sanitized: Record<string, any> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) {
      if (key === 'categoryId') {
        sanitized[key] = typeof body[key] === 'object' ? body[key]?._id || body[key]?.id : body[key];
      } else {
        sanitized[key] = body[key];
      }
    }
  }
  const changes = toSupabase(sanitized);
  const { data, error } = await auth.supabase.from('products').update(changes).eq('id', body.id).select().maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return data ? NextResponse.json({ success: true, product: fromSupabase(data) }) : NextResponse.json({ error: 'Product not found' }, { status: 404 });
}

export async function DELETE(req: NextRequest) {
  const auth = await getAuthenticatedUserAndTenant();
  if (!auth?.tenant) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (auth.trialInfo?.isExpired) return NextResponse.json({ error: 'TRIAL_EXPIRED', message: 'Trial expired. Cannot delete products.' }, { status: 403 });
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
  const { error } = await auth.supabase.from('products').delete().eq('id', id);
  return error ? NextResponse.json({ error: error.message }, { status: 500 }) : NextResponse.json({ success: true, message: 'Product deleted' });
}
