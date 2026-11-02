import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserAndTenant } from '@/lib/auth';
import { fromSupabase } from '@/lib/supabase-mappers';
import { generateWhatsAppUrl } from '@/lib/whatsapp';

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUserAndTenant();
    if (!auth?.tenant) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (auth.trialInfo?.isExpired) return NextResponse.json({ error: 'TRIAL_EXPIRED', message: 'Your 15-day free trial has expired. Point-of-Sale order creation is locked. Please upgrade to Pro.' }, { status: 403 });
    const body = await req.json();
    if (!body.customerPhone?.trim()) return NextResponse.json({ error: 'Customer WhatsApp phone number is required to generate receipt' }, { status: 400 });
    if (!Array.isArray(body.items) || !body.items.length) return NextResponse.json({ error: 'Cart must contain at least one item' }, { status: 400 });
    const rpcItems = body.items.map((item: any) => ({ product_id: item.productId, quantity: Math.max(1, parseInt(item.quantity, 10) || 1) }));
    const { data: row, error } = await auth.supabase.rpc('create_pos_order', {
      customer_name: body.customerName?.trim() || 'Valued Customer', customer_phone: body.customerPhone.trim(),
      payment_method: body.paymentMethod || 'CASH', discount: Math.max(0, Number(body.discount ?? body.discountAmount) || 0),
      items: rpcItems, notes: body.notes?.trim() || '',
    });
    if (error) return NextResponse.json({ error: error.message }, { status: error.message.includes('TRIAL_EXPIRED') ? 403 : 400 });
    const order: any = fromSupabase(row);
    const envUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost:3000';
    const proto = req.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
    const baseUrl = envUrl?.replace(/\/+$/, '') || `${proto}://${host}`;
    const receiptUrl = `${baseUrl}/receipt/${encodeURIComponent(order.orderNumber)}`;
    const pdfUrl = `${baseUrl}/api/receipts/${encodeURIComponent(order.orderNumber)}/pdf`;
    const shared = generateWhatsAppUrl({
      businessName: auth.tenant.businessName, businessType: auth.tenant.businessType || '', businessPhone: auth.tenant.phone,
      businessAddress: auth.tenant.address, currency: order.currency, orderNumber: order.orderNumber,
      customerName: order.customerName, customerPhone: order.customerPhone, createdAt: new Date(order.createdAt), items: order.items,
      subtotal: Number(order.subtotal), tax: Number(order.tax), discount: Number(order.discount), totalAmount: Number(order.totalAmount),
      paymentStatus: order.paymentStatus, paymentMethod: order.paymentMethod, paymentReference: order.paymentReference,
      employee: order.employee, notes: order.notes, defaultCountryCode: auth.tenant.countryCode || '91',
      gstNumber: auth.tenant.gstNumber, showGstOnReceipt: Boolean(auth.tenant.showGstOnReceipt),
      googleProfileUrl: auth.tenant.googleProfileUrl, showGoogleReviewOnReceipt: Boolean(auth.tenant.showGoogleReviewOnReceipt),
      receiptUrl, pdfUrl,
    });
    return NextResponse.json({ success: true, order, whatsappUrl: shared.url, cleanPhone: shared.cleanPhone,
      rawReceiptText: shared.rawText, pdfUrl, receiptUrl,
      gstNumber: auth.tenant.showGstOnReceipt ? auth.tenant.gstNumber : null,
      googleProfileUrl: auth.tenant.showGoogleReviewOnReceipt ? auth.tenant.googleProfileUrl : null }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create order' }, { status: 500 });
  }
}
