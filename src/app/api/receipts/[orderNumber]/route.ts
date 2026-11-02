import { NextRequest, NextResponse } from 'next/server';
import { getPublicReceiptByIdentifier } from '@/lib/supabase';
import { generateWhatsAppUrl } from '@/lib/whatsapp';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const rawParam = (await params).orderNumber;
    const clean = decodeURIComponent(rawParam || '').trim();
    if (!clean) {
      return NextResponse.json({ error: 'Order number or token is required' }, { status: 400 });
    }

    const order = await getPublicReceiptByIdentifier(clean);
    if (!order) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
    }

    const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost:3000';
    const proto = req.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
    const base = (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || `${proto}://${host}`).replace(/\/+$/, '');

    const displayOrderNumber = order.order_number || clean;
    const receiptUrl = `${base}/receipt/${encodeURIComponent(displayOrderNumber)}`;
    const pdfUrl = `${base}/api/receipts/${encodeURIComponent(displayOrderNumber)}/pdf`;

    const shared = generateWhatsAppUrl({
      businessName: order.business_name || 'HYNOX Store',
      businessType: order.business_type || '',
      businessPhone: order.business_phone || '',
      businessAddress: order.business_address || '',
      currency: order.currency || '$',
      orderNumber: displayOrderNumber,
      customerName: order.customer_name || 'Valued Customer',
      customerPhone: order.customer_phone || '',
      createdAt: order.created_at ? new Date(order.created_at) : new Date(),
      items: (order.items || []).map((i: any) => ({
        productName: i.product_name || i.name || i.productName || 'Custom Item',
        quantity: Number(i.quantity || 1),
        unitPrice: Number(i.unit_price || i.unitPrice || 0),
        lineTotal: Number(i.line_total || i.lineTotal || 0),
        sku: i.sku || undefined,
      })),
      subtotal: Number(order.subtotal || 0),
      tax: Number(order.tax || 0),
      discount: Number(order.discount || 0),
      totalAmount: Number(order.total_amount || 0),
      paymentStatus: order.payment_status,
      paymentMethod: order.payment_method,
      paymentReference: order.payment_reference,
      employee: order.employee,
      notes: order.notes,
      gstNumber: order.gst_number,
      showGstOnReceipt: Boolean(order.show_gst),
      googleProfileUrl: order.google_profile_url,
      showGoogleReviewOnReceipt: Boolean(order.show_google),
      receiptUrl,
      pdfUrl,
    });

    return NextResponse.json(
      {
        success: true,
        order,
        receiptUrl,
        pdfUrl,
        whatsappUrl: shared.url,
        cleanPhone: shared.cleanPhone,
        rawReceiptText: shared.rawText,
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=60, s-maxage=60',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch receipt' }, { status: 500 });
  }
}
