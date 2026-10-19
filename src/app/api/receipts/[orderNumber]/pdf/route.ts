import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Order } from '@/models/Order';
import { Tenant } from '@/models/Tenant';
import { generateReceiptPdf } from '@/lib/pdfReceipt';

interface RouteParams {
  params: Promise<{ orderNumber: string }>;
}

export async function GET(req: NextRequest, context: RouteParams) {
  try {
    const { orderNumber } = await context.params;
    if (!orderNumber) {
      return NextResponse.json({ error: 'Order number is required' }, { status: 400 });
    }

    await connectToDatabase();

    const cleanOrderNumber = decodeURIComponent(orderNumber).trim();
    const order = await Order.findOne({
      orderNumber: { $regex: new RegExp(`^${cleanOrderNumber.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
    });
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const tenant = await Tenant.findById(order.tenantId);

    // Determine GST and Google Review from order snapshot or tenant settings
    const showGst = tenant ? Boolean(tenant.showGstOnReceipt) : Boolean(order.gstNumber);
    const gstNumber = order.gstNumber || (tenant ? tenant.gstNumber : '');

    const showGoogle = tenant ? Boolean(tenant.showGoogleReviewOnReceipt) : Boolean(order.googleProfileUrl);
    const googleProfileUrl = order.googleProfileUrl || (tenant ? tenant.googleProfileUrl : '');

    const pdfBytes = await generateReceiptPdf({
      orderNumber: order.orderNumber,
      businessName: tenant?.businessName || 'Business Receipt',
      businessAddress: tenant?.address || '',
      businessPhone: tenant?.phone || '',
      currency: order.currency || tenant?.currency || '$',
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      createdAt: order.createdAt,
      items: order.items.map((i: any) => ({
        productName: i.productName,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        lineTotal: i.lineTotal,
      })),
      subtotal: order.subtotal,
      tax: order.tax,
      discount: order.discount,
      totalAmount: order.totalAmount,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      gstNumber,
      showGstOnReceipt: showGst,
      googleProfileUrl,
      showGoogleReviewOnReceipt: showGoogle,
    });

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="receipt-${order.orderNumber}.pdf"`,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error: any) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate PDF receipt' },
      { status: 500 }
    );
  }
}
