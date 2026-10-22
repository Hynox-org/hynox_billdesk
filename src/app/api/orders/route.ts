import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserAndTenant } from '@/lib/auth';
import { Order } from '@/models/Order';
import { generateWhatsAppUrl } from '@/lib/whatsapp';


export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUserAndTenant();
    if (!auth || !auth.tenant) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(1000, Math.max(1, parseInt(searchParams.get('limit') || '500', 10)));
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const skip = (page - 1) * limit;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [orders, totalCount, todayOrders] = await Promise.all([
      Order.find({ tenantId: auth.tenant._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments({ tenantId: auth.tenant._id }),
      Order.find({
        tenantId: auth.tenant._id,
        createdAt: { $gte: startOfToday },
      })
        .select('totalAmount')
        .lean(),
    ]);

    const todayRevenue = todayOrders.reduce((acc: number, o: any) => acc + (o.totalAmount || 0), 0);
    const todayCount = todayOrders.length;
    const avgOrder = todayCount > 0 ? todayRevenue / todayCount : 0;

    return NextResponse.json({
      success: true,
      orders,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      stats: {
        todayRevenue: Number(todayRevenue.toFixed(2)),
        todayCount,
        avgOrder: Number(avgOrder.toFixed(2)),
      },
      currency: auth.tenant.currency || '$',
      tenant: {
        businessName: auth.tenant.businessName,
        businessType: auth.tenant.businessType || 'Retail shops',
        phone: auth.tenant.phone,
        address: auth.tenant.address,
        location: auth.tenant.location || 'Main Store',
        city: auth.tenant.city || '',
        province: auth.tenant.province || '',
        provinceCode: auth.tenant.provinceCode || '',
        zip: auth.tenant.zip || '',
        country: auth.tenant.country || '',
        defaultEmployee: auth.tenant.defaultEmployee || '',
        defaultTaxName: auth.tenant.defaultTaxName || 'GST 18%',
        defaultTaxRate: auth.tenant.defaultTaxRate !== undefined ? auth.tenant.defaultTaxRate : 18,
        defaultTax2Name: auth.tenant.defaultTax2Name || '',
        deviceId: auth.tenant.deviceId || '',
        gstNumber: auth.tenant.gstNumber || '',
        showGstOnReceipt: Boolean(auth.tenant.showGstOnReceipt),
        enableTaxOnCheckout: Boolean(auth.tenant.enableTaxOnCheckout),
        defaultTaxType: auth.tenant.defaultTaxType || 'EXCLUDED',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error fetching orders' }, { status: 500 });
  }
}

/**
 * Resend / Regenerate WhatsApp link for an existing order
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUserAndTenant();
    if (!auth || !auth.tenant) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId } = await req.json();
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const order = await Order.findOne({ _id: orderId, tenantId: auth.tenant._id });
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const envAppUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost:3000';
    const proto = req.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
    const baseUrl = envAppUrl ? envAppUrl.replace(/\/+$/, '') : `${proto}://${host}`;
    const receiptUrl = `${baseUrl}/receipt/${order.orderNumber}`;
    const pdfUrl = `${baseUrl}/api/receipts/${order.orderNumber}/pdf`;

    const { cleanPhone, url, rawText } = generateWhatsAppUrl({
      businessName: auth.tenant.businessName,
      businessType: auth.tenant.businessType || '',
      businessPhone: auth.tenant.phone,
      businessAddress: auth.tenant.address,
      currency: auth.tenant.currency || '$',
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      createdAt: order.createdAt,
      items: (order.items || []).map((i: any) => ({
        productName: i.productName,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        lineTotal: i.lineTotal,
        sku: i.sku || '',
      })),
      subtotal: order.subtotal,
      tax: order.tax,
      discount: order.discount,
      totalAmount: order.totalAmount,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      paymentReference: order.paymentReference,
      employee: order.employee || auth.tenant.defaultEmployee,
      notes: order.notes,
      defaultCountryCode: auth.tenant.countryCode || '1',
      gstNumber: auth.tenant.gstNumber,
      showGstOnReceipt: Boolean(auth.tenant.showGstOnReceipt),
      googleProfileUrl: auth.tenant.googleProfileUrl,
      showGoogleReviewOnReceipt: Boolean(auth.tenant.showGoogleReviewOnReceipt),
      receiptUrl,
      pdfUrl,
    });

    return NextResponse.json({
      success: true,
      whatsappUrl: url,
      cleanPhone,
      rawReceiptText: rawText,
      receiptUrl,
      pdfUrl,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error generating link' }, { status: 500 });
  }
}

/**
 * Delete one or multiple orders securely for the authenticated tenant
 */
export async function DELETE(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUserAndTenant();
    if (!auth || !auth.tenant) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const orderIds: string[] = Array.isArray(body.orderIds)
      ? body.orderIds
      : body.orderId
      ? [body.orderId]
      : [];

    if (orderIds.length === 0) {
      return NextResponse.json({ error: 'No order IDs provided for deletion' }, { status: 400 });
    }

    const result = await Order.deleteMany({
      _id: { $in: orderIds },
      tenantId: auth.tenant._id,
    });

    return NextResponse.json({
      success: true,
      deletedCount: result.deletedCount,
      message: `Successfully deleted ${result.deletedCount} order(s)`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete order(s)' },
      { status: 500 }
    );
  }
}

