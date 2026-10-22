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
  return `ORD_${dateCode}_${randomSuffix}`;
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
      tax,
      taxRate,
      taxName,
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

    const tenant = auth.tenant;

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
        compareAtPrice: Number(item.compareAtPrice) || 0,
        sku: item.sku || '',
        requiresShipping: Boolean(item.requiresShipping),
        taxable: item.taxable !== undefined ? Boolean(item.taxable) : true,
        fulfillmentStatus: item.fulfillmentStatus || 'fulfilled',
        discount: Number(item.discount) || 0,
        vendor: item.vendor || tenant.businessName,
      };
    });

    const subtotal = sanitizedItems.reduce((acc: number, item: any) => acc + item.lineTotal, 0);
    const parsedDiscount = Math.max(0, Number(rawDiscount) || 0);
    const discountAmount = Math.min(subtotal, parsedDiscount);
    const taxableAmount = Math.max(0, subtotal - discountAmount);

    const isTaxIncluded = Boolean(body.isTaxIncluded || body.taxType === 'INCLUDED');
    const taxType = isTaxIncluded ? 'INCLUDED' : 'EXCLUDED';

    const resolvedTaxRate = taxRate !== undefined
      ? Math.max(0, Number(taxRate) || 0)
      : (auth.tenant.defaultTaxRate !== undefined ? auth.tenant.defaultTaxRate : 18);

    const taxAmount = tax !== undefined
      ? Math.max(0, Number(tax) || 0)
      : Number(((taxableAmount * resolvedTaxRate) / 100).toFixed(2));

    const totalAmount = body.totalAmount !== undefined
      ? Number(body.totalAmount)
      : (isTaxIncluded
          ? Number(taxableAmount.toFixed(2))
          : Number((taxableAmount + taxAmount).toFixed(2)));

    const orderNumber = generateOrderNumber();
    const now = new Date();
    const isPaid = normalizedPaymentStatus !== 'PENDING';

    const envAppUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost:3000';
    const proto = req.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
    const baseUrl = envAppUrl ? envAppUrl.replace(/\/+$/, '') : `${proto}://${host}`;
    const receiptUrl = `${baseUrl}/receipt/${orderNumber}`;
    const pdfUrl = `${baseUrl}/api/receipts/${orderNumber}/pdf`;

    // Generate WhatsApp Receipt & deep link
    const { cleanPhone, url, rawText } = generateWhatsAppUrl({
      businessName: auth.tenant.businessName,
      businessType: auth.tenant.businessType || '',
      businessPhone: auth.tenant.phone,
      businessAddress: auth.tenant.address,
      currency: auth.tenant.currency || '$',
      orderNumber,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      createdAt: now,
      items: sanitizedItems.map((i: any) => ({
        productName: i.productName,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        lineTotal: i.lineTotal,
        sku: i.sku || '',
      })),
      subtotal,
      tax: taxAmount,
      discount: discountAmount,
      totalAmount,
      paymentStatus: normalizedPaymentStatus,
      paymentMethod,
      paymentReference: body.paymentReference || `#${orderNumber}`,
      employee: body.employee || auth.tenant.defaultEmployee || 'Cashier',
      notes: body.notes || '',
      defaultCountryCode: auth.tenant.countryCode || '1',
      gstNumber: auth.tenant.gstNumber,
      showGstOnReceipt: Boolean(auth.tenant.showGstOnReceipt),
      googleProfileUrl: auth.tenant.googleProfileUrl,
      showGoogleReviewOnReceipt: Boolean(auth.tenant.showGoogleReviewOnReceipt),
      receiptUrl,
      pdfUrl,
    });

    // Save Order into Database with complete vendor and Shopify-standard export attributes
    const order = await Order.create({
      tenantId: auth.tenant._id,
      orderNumber,
      customerName: customerName.trim() || 'Valued Customer',
      customerPhone: cleanPhone,
      customerEmail: body.customerEmail || '',
      acceptsMarketing: Boolean(body.acceptsMarketing),
      items: sanitizedItems,
      subtotal,
      tax: taxAmount,
      taxRate: resolvedTaxRate,
      taxName: taxName || auth.tenant.defaultTaxName || (resolvedTaxRate > 0 ? `GST ${resolvedTaxRate}%` : ''),
      taxType,
      isTaxIncluded,
      discount: discountAmount,
      totalAmount,
      currency: auth.tenant.currency || '$',
      paymentStatus: normalizedPaymentStatus,
      paymentMethod,
      whatsappStatus: 'GENERATED',
      notes: notes ? notes.trim() : '',
      financialStatus: isPaid ? 'paid' : 'pending',
      paidAt: isPaid ? now : undefined,
      fulfillmentStatus: 'fulfilled',
      fulfilledAt: now,
      shippingMethod: paymentMethod === 'COD' ? 'CASH ON DELIVERY' : 'Store POS / Walk-in',
      shippingCost: Number(body.shippingCost) || 0,
      discountCode: body.discountCode || '',
      refundedAmount: 0,
      outstandingBalance: isPaid ? 0 : totalAmount,
      vendor: auth.tenant.businessName,
      businessType: auth.tenant.businessType || 'Retail shops',
      employee: auth.user?.fullName || auth.tenant.defaultEmployee || 'Cashier',
      location: auth.tenant.location || 'Main Store',
      deviceId: auth.tenant.deviceId || '',
      tags: body.tags || 'POS, WALK_IN',
      riskLevel: 'Low',
      source: 'POS',
      receiptNumber: orderNumber,
      paymentReference: `#${orderNumber}`,
      paymentId: `#${orderNumber}`,
      paymentReferences: `#${orderNumber}`,
      // Billing Address
      billingName: customerName.trim() || 'Valued Customer',
      billingStreet: auth.tenant.address || '',
      billingAddress1: auth.tenant.address || '',
      billingAddress2: '',
      billingCompany: '',
      billingCity: auth.tenant.city || '',
      billingZip: auth.tenant.zip || '',
      billingProvince: auth.tenant.provinceCode || 'TN',
      billingProvinceName: auth.tenant.province || 'Tamil Nadu',
      billingCountry: auth.tenant.country || 'IN',
      billingPhone: cleanPhone,
      // Shipping Address
      shippingName: customerName.trim() || 'Valued Customer',
      shippingStreet: auth.tenant.address || '',
      shippingAddress1: auth.tenant.address || '',
      shippingAddress2: '',
      shippingCompany: '',
      shippingCity: auth.tenant.city || '',
      shippingZip: auth.tenant.zip || '',
      shippingProvince: auth.tenant.provinceCode || 'TN',
      shippingProvinceName: auth.tenant.province || 'Tamil Nadu',
      shippingCountry: auth.tenant.country || 'IN',
      shippingPhone: cleanPhone,
      // Tax Breakdown
      tax1Name: taxAmount > 0 ? (taxName || auth.tenant.defaultTaxName || `GST ${resolvedTaxRate}%`) : '',
      tax1Value: taxAmount,
      tax2Name: auth.tenant.defaultTax2Name || '',
      tax2Value: 0,
      gstNumber: auth.tenant.gstNumber ? auth.tenant.gstNumber.trim() : '',
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
