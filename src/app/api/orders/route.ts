import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserAndTenant } from '@/lib/auth';
import { fromSupabase, rowsFromSupabase } from '@/lib/supabase-mappers';
import { generateWhatsAppUrl } from '@/lib/whatsapp';

const receiptUrls = (req: NextRequest, orderNumber: string) => {
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost:3000';
  const proto = req.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  const base = (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || `${proto}://${host}`).replace(/\/+$/, '');
  return { receiptUrl: `${base}/receipt/${encodeURIComponent(orderNumber)}`, pdfUrl: `${base}/api/receipts/${encodeURIComponent(orderNumber)}/pdf` };
};

export async function GET(req: NextRequest) {
  const auth = await getAuthenticatedUserAndTenant();
  if (!auth?.tenant) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const params = new URL(req.url).searchParams;
  const limit = Math.min(1000, Math.max(1, parseInt(params.get('limit') || '500', 10)));
  const page = Math.max(1, parseInt(params.get('page') || '1', 10));
  const start = (page - 1) * limit;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const [{ data, count, error }, { data: todayRows }] = await Promise.all([
    auth.supabase.from('orders').select('*', { count: 'exact' }).order('created_at', { ascending: false }).range(start, start + limit - 1),
    auth.supabase.from('orders').select('total_amount').gte('created_at', today.toISOString()),
  ]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const orders = rowsFromSupabase(data); const total = (todayRows || []).reduce((sum, row) => sum + Number(row.total_amount || 0), 0);
  return NextResponse.json({ success: true, orders, pagination: { page, limit, totalCount: count || 0, totalPages: Math.ceil((count || 0) / limit) },
    stats: { todayRevenue: Number(total.toFixed(2)), todayCount: todayRows?.length || 0, avgOrder: todayRows?.length ? Number((total / todayRows.length).toFixed(2)) : 0 },
    currency: auth.tenant.currency || '$', tenant: auth.tenant });
}

export async function POST(req: NextRequest) {
  const auth = await getAuthenticatedUserAndTenant();
  if (!auth?.tenant) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { orderId } = await req.json();
  const { data, error } = await auth.supabase.from('orders').select('*').eq('id', orderId).maybeSingle();
  if (error || !data) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  const order: any = fromSupabase(data); const urls = receiptUrls(req, order.orderNumber);
  const shared = generateWhatsAppUrl({ businessName: auth.tenant.businessName, businessType: auth.tenant.businessType || '',
    businessPhone: auth.tenant.phone, businessAddress: auth.tenant.address, currency: order.currency, orderNumber: order.orderNumber,
    customerName: order.customerName, customerPhone: order.customerPhone, createdAt: new Date(order.createdAt), items: order.items,
    subtotal: Number(order.subtotal), tax: Number(order.tax), discount: Number(order.discount), totalAmount: Number(order.totalAmount),
    paymentStatus: order.paymentStatus, paymentMethod: order.paymentMethod, paymentReference: order.paymentReference,
    employee: order.employee, notes: order.notes, defaultCountryCode: auth.tenant.countryCode || '91', gstNumber: auth.tenant.gstNumber,
    showGstOnReceipt: Boolean(auth.tenant.showGstOnReceipt), googleProfileUrl: auth.tenant.googleProfileUrl,
    showGoogleReviewOnReceipt: Boolean(auth.tenant.showGoogleReviewOnReceipt), ...urls });
  return NextResponse.json({ success: true, whatsappUrl: shared.url, cleanPhone: shared.cleanPhone, rawReceiptText: shared.rawText, ...urls });
}

export async function DELETE(req: NextRequest) {
  const auth = await getAuthenticatedUserAndTenant();
  if (!auth?.tenant) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json(); const ids: string[] = body.orderIds || (body.orderId ? [body.orderId] : []);
  if (!ids.length) return NextResponse.json({ error: 'No order IDs provided for deletion' }, { status: 400 });
  const { data, error } = await auth.supabase.from('orders').delete().in('id', ids).select('id');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, deletedCount: data.length, message: `Successfully deleted ${data.length} order(s)` });
}
