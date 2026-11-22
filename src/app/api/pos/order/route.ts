import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserAndTenant } from '@/lib/auth';
import { fromSupabase } from '@/lib/supabase-mappers';
import { generateWhatsAppUrl } from '@/lib/whatsapp';

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUserAndTenant();
    if (!auth?.tenant) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (auth.trialInfo?.isExpired) {
      return NextResponse.json(
        {
          error: 'TRIAL_EXPIRED',
          message: 'Your 15-day free trial has expired. Point-of-Sale order creation is locked. Please upgrade to Pro.',
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    if (!body.customerPhone?.trim()) {
      return NextResponse.json({ error: 'Customer WhatsApp phone number is required to generate receipt' }, { status: 400 });
    }
    if (!Array.isArray(body.items) || !body.items.length) {
      return NextResponse.json({ error: 'Cart must contain at least one item' }, { status: 400 });
    }

    const rpcItems = body.items.map((item: any) => ({
      product_id: item.productId,
      quantity: Math.max(1, parseInt(item.quantity, 10) || 1),
    }));

    const rawDiscount = Math.max(0, Number(body.discount ?? body.discountAmount) || 0);

    const { data: row, error } = await auth.supabase.rpc('create_pos_order', {
      customer_name: body.customerName?.trim() || 'Valued Customer',
      customer_phone: body.customerPhone.trim(),
      payment_method: body.paymentMethod || 'CASH',
      discount: rawDiscount,
      items: rpcItems,
      notes: body.notes?.trim() || '',
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: error.message.includes('TRIAL_EXPIRED') ? 403 : 400 });
    }

    // Determine exact tax and totals from checkout request
    const isTaxIncluded =
      body.isTaxIncluded !== undefined
        ? Boolean(body.isTaxIncluded)
        : body.taxType
        ? body.taxType === 'INCLUDED'
        : Boolean(row.is_tax_included);
    const taxType = isTaxIncluded ? 'INCLUDED' : 'EXCLUDED';
    const taxRate =
      body.taxRate !== undefined
        ? Math.max(0, Number(body.taxRate) || 0)
        : Number(row.tax_rate ?? auth.tenant.defaultTaxRate ?? 18);
    const taxName = body.taxName || row.tax_name || auth.tenant.defaultTaxName || 'GST';

    const subtotal = Number(row.subtotal || 0);
    const discount = Number(row.discount || 0);
    const taxable = Math.max(0, subtotal - discount);

    let finalTax: number;
    let finalTotal: number;

    if (body.tax !== undefined && body.totalAmount !== undefined) {
      finalTax = Number(Number(body.tax).toFixed(2));
      finalTotal = Number(Number(body.totalAmount).toFixed(2));
    } else if (taxRate > 0) {
      if (isTaxIncluded) {
        finalTax = Number((taxable - (taxable / (1 + (taxRate / 100)))).toFixed(2));
        finalTotal = Number(taxable.toFixed(2));
      } else {
        finalTax = Number(((taxable * taxRate) / 100).toFixed(2));
        finalTotal = Number((taxable + finalTax).toFixed(2));
      }
    } else {
      finalTax = 0;
      finalTotal = Number(taxable.toFixed(2));
    }

    // Update order number prefix from INV- to ORD-
    const orderNumber = (row.order_number || '').replace(/^INV-/i, 'ORD-');

    // Persist exact checkout tax configuration and ORD- order number into Supabase orders table
    const { data: updatedRow } = await auth.supabase
      .from('orders')
      .update({
        order_number: orderNumber,
        tax: finalTax,
        tax_rate: taxRate,
        tax_name: taxName,
        tax_type: taxType,
        is_tax_included: isTaxIncluded,
        total_amount: finalTotal,
      })
      .eq('id', row.id)
      .select()
      .maybeSingle();

    const finalRow = updatedRow || {
      ...row,
      order_number: orderNumber,
      tax: finalTax,
      tax_rate: taxRate,
      tax_name: taxName,
      tax_type: taxType,
      is_tax_included: isTaxIncluded,
      total_amount: finalTotal,
    };

    const order: any = fromSupabase(finalRow);

    const envUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost:3000';
    const proto = req.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
    const baseUrl = envUrl?.replace(/\/+$/, '') || `${proto}://${host}`;
    const pdfUrl = `${baseUrl}/api/receipts/${encodeURIComponent(order.orderNumber)}/pdf`;
    const receiptUrl = pdfUrl; // Send direct PDF URL as requested

    const shared = generateWhatsAppUrl({
      businessName: auth.tenant.businessName,
      businessType: auth.tenant.businessType || '',
      businessPhone: auth.tenant.phone,
      businessAddress: auth.tenant.address,
      currency: order.currency,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      createdAt: new Date(order.createdAt),
      items: order.items,
      subtotal: Number(order.subtotal),
      tax: Number(order.tax),
      discount: Number(order.discount),
      totalAmount: Number(order.totalAmount),
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      paymentReference: order.paymentReference,
      employee: order.employee,
      notes: order.notes,
      defaultCountryCode: auth.tenant.countryCode || '91',
      gstNumber: auth.tenant.gstNumber,
      showGstOnReceipt: Boolean(auth.tenant.showGstOnReceipt),
      googleProfileUrl: auth.tenant.googleProfileUrl,
      showGoogleReviewOnReceipt: Boolean(auth.tenant.showGoogleReviewOnReceipt),
      receiptUrl: pdfUrl,
      pdfUrl,
    });

    return NextResponse.json(
      {
        success: true,
        order,
        whatsappUrl: shared.url,
        cleanPhone: shared.cleanPhone,
        rawReceiptText: shared.rawText,
        pdfUrl,
        receiptUrl,
        gstNumber: auth.tenant.showGstOnReceipt ? auth.tenant.gstNumber : null,
        googleProfileUrl: auth.tenant.showGoogleReviewOnReceipt ? auth.tenant.googleProfileUrl : null,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create order' }, { status: 500 });
  }
}
