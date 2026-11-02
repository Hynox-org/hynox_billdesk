import { NextRequest, NextResponse } from 'next/server';
import { getPublicReceiptByIdentifier } from '@/lib/supabase';
import { generateReceiptPdf } from '@/lib/pdfReceipt';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ orderNumber: string }> }) {
  try {
    const clean = decodeURIComponent((await params).orderNumber || '').trim();
    if (!clean) return NextResponse.json({ error: 'Order number or token is required' }, { status: 400 });

    const order = await getPublicReceiptByIdentifier(clean);
    if (!order) return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });

    const displayOrderNumber = order.order_number || clean;
    const pdf = await generateReceiptPdf({
      orderNumber: displayOrderNumber,
      businessName: order.business_name || 'HYNOX Billing',
      businessType: order.business_type || '',
      businessAddress: order.business_address || '',
      businessPhone: order.business_phone || '',
      currency: order.currency || '$',
      customerName: order.customer_name || 'Valued Customer',
      customerPhone: order.customer_phone || '',
      createdAt: order.created_at || new Date().toISOString(),
      items: (order.items || []).map((i: any) => {
        const qty = Number(i.quantity || 1);
        const unitPrice = Number(i.unit_price || i.unitPrice || 0);
        const lineTotal = Number(i.line_total || i.lineTotal || (qty * unitPrice));
        return {
          productName: String(i.product_name || i.name || i.productName || 'Custom Item'),
          quantity: qty,
          unitPrice,
          lineTotal,
          sku: i.sku || '',
        };
      }),
      subtotal: Number(order.subtotal || 0),
      tax: Number(order.tax || 0),
      taxRate: order.tax_rate !== undefined ? Number(order.tax_rate) : undefined,
      taxName: order.tax_name || 'GST',
      isTaxIncluded: Boolean(order.is_tax_included),
      taxType: order.tax_type,
      discount: Number(order.discount || 0),
      totalAmount: Number(order.total_amount || 0),
      paymentStatus: order.payment_status,
      paymentMethod: order.payment_method,
      paymentReference: order.payment_reference,
      employee: order.employee || 'Cashier',
      notes: order.notes || '',
      gstNumber: order.gst_number || '',
      showGstOnReceipt: Boolean(order.show_gst),
      googleProfileUrl: order.google_profile_url || '',
      showGoogleReviewOnReceipt: Boolean(order.show_google),
    });

    return new NextResponse(Buffer.from(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="receipt-${displayOrderNumber}.pdf"`,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to generate PDF receipt' }, { status: 500 });
  }
}
