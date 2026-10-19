import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserAndTenant } from '@/lib/auth';
import { Order } from '@/models/Order';
import { Product } from '@/models/Product';
import { generateWhatsAppUrl } from '@/lib/whatsapp';

function generateOrderNumber(): string {
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const now = new Date();
  const dateCode = `${now.getFullYear().toString().slice(-2)}${(now.getMonth() + 1)
    .toString()
    .padStart(2, '0')}`;
  return `ORD-${dateCode}-${randomSuffix}`;
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUserAndTenant();
    if (!auth || !auth.tenant) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Trial Paywall enforcement: block orders if trial is expired
    if (auth.trialInfo?.isExpired) {
      return NextResponse.json(
        {
          error: 'TRIAL_EXPIRED',
          message:
            'Your 15-day free trial has expired. Point-of-Sale order creation is locked. Please upgrade to Pro.',
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      customerName = 'Valued Customer',
      customerPhone,
      items,
      tax = 0,
      paymentStatus = 'PAID_CASH',
      paymentMethod = 'CASH',
      notes = '',
    } = body;
    const rawDiscount = body.discount !== undefined ? body.discount : body.discountAmount;

    if (!customerPhone || !customerPhone.trim()) {
      return NextResponse.json(
        { error: 'Customer WhatsApp phone number is required to generate receipt' },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Cart must contain at least one item' }, { status: 400 });
    }

    // Normalize payment status against allowed schema values
    const validStatuses = ['PAID_CASH', 'PAID_ONLINE', 'PENDING', 'COD', 'PAID'];
    const normalizedPaymentStatus = validStatuses.includes(paymentStatus)
      ? paymentStatus
      : 'PAID_CASH';

    // Calculate line totals and subtotal
    const sanitizedItems = items.map((item: any) => {
      const unitPrice = Math.max(0, Number(item.unitPrice) || 0);
      const quantity = Math.max(1, parseInt(item.quantity, 10) || 1);
      const lineTotal = Number((unitPrice * quantity).toFixed(2));
      return {
        productId: item.productId || undefined,
        productName: item.productName || 'Custom Item',
        unitPrice,
        quantity,
        lineTotal,
      };
    });

    const subtotal = sanitizedItems.reduce((acc: number, item: any) => acc + item.lineTotal, 0);
    const taxAmount = Math.max(0, Number(tax) || 0);
    const parsedDiscount = Math.max(0, Number(rawDiscount) || 0);
    const discountAmount = Math.min(subtotal + taxAmount, parsedDiscount);
    const totalAmount = Number((subtotal + taxAmount - discountAmount).toFixed(2));

    const orderNumber = generateOrderNumber();

    const envAppUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost:3000';
    const proto = req.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
    const baseUrl = envAppUrl ? envAppUrl.replace(/\/+$/, '') : `${proto}://${host}`;
    const receiptUrl = `${baseUrl}/receipt/${orderNumber}`;
    const pdfUrl = `${baseUrl}/api/receipts/${orderNumber}/pdf`;

    // Generate WhatsApp Receipt & deep link
    const { cleanPhone, url, rawText } = generateWhatsAppUrl({
      businessName: auth.tenant.businessName,
      businessPhone: auth.tenant.phone,
      businessAddress: auth.tenant.address,
      currency: auth.tenant.currency || '$',
      orderNumber,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      items: sanitizedItems,
      subtotal,
      tax: taxAmount,
      discount: discountAmount,
      totalAmount,
      paymentStatus: normalizedPaymentStatus,
      paymentMethod,
      defaultCountryCode: auth.tenant.countryCode || '1',
      gstNumber: auth.tenant.gstNumber,
      showGstOnReceipt: Boolean(auth.tenant.showGstOnReceipt),
      googleProfileUrl: auth.tenant.googleProfileUrl,
      showGoogleReviewOnReceipt: Boolean(auth.tenant.showGoogleReviewOnReceipt),
      receiptUrl,
    });

    // Save Order into Database
    const order = await Order.create({
      tenantId: auth.tenant._id,
      orderNumber,
      customerName: customerName.trim(),
      customerPhone: cleanPhone,
      items: sanitizedItems,
      subtotal,
      tax: taxAmount,
      discount: discountAmount,
      totalAmount,
      currency: auth.tenant.currency || '$',
      paymentStatus: normalizedPaymentStatus,
      whatsappStatus: 'GENERATED',
      notes: notes ? notes.trim() : '',
      gstNumber: auth.tenant.showGstOnReceipt && auth.tenant.gstNumber ? auth.tenant.gstNumber.trim() : '',
      googleProfileUrl: auth.tenant.showGoogleReviewOnReceipt && auth.tenant.googleProfileUrl ? auth.tenant.googleProfileUrl.trim() : '',
    });

    // Decrement inventory for tracked items
    for (const item of sanitizedItems) {
      if ((item as any).productId) {
        await Product.findOneAndUpdate(
          { _id: (item as any).productId, tenantId: auth.tenant._id, trackStock: true },
          { $inc: { stockQuantity: -item.quantity } }
        );
      }
    }

    return NextResponse.json(
      {
        success: true,
        order,
        whatsappUrl: url,
        cleanPhone,
        rawReceiptText: rawText,
        pdfUrl,
        receiptUrl,
        gstNumber: auth.tenant.showGstOnReceipt && auth.tenant.gstNumber ? auth.tenant.gstNumber.trim() : null,
        googleProfileUrl: auth.tenant.showGoogleReviewOnReceipt && auth.tenant.googleProfileUrl ? auth.tenant.googleProfileUrl.trim() : null,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('POS order creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create order' },
      { status: 500 }
    );
  }
}
