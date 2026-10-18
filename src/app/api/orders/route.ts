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
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const skip = (page - 1) * limit;

    const [orders, totalCount] = await Promise.all([
      Order.find({ tenantId: auth.tenant._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments({ tenantId: auth.tenant._id }),
    ]);

    // Calculate Today's stats
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayOrders = await Order.find({
      tenantId: auth.tenant._id,
      createdAt: { $gte: startOfToday },
    });

    const todayRevenue = todayOrders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);
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

    const { cleanPhone, url, rawText } = generateWhatsAppUrl({
      businessName: auth.tenant.businessName,
      businessPhone: auth.tenant.phone,
      businessAddress: auth.tenant.address,
      currency: auth.tenant.currency || '$',
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      items: order.items,
      subtotal: order.subtotal,
      tax: order.tax,
      discount: order.discount,
      totalAmount: order.totalAmount,
      paymentStatus: order.paymentStatus,
      defaultCountryCode: auth.tenant.countryCode || '1',
      gstNumber: auth.tenant.gstNumber,
      showGstOnReceipt: Boolean(auth.tenant.showGstOnReceipt),
      googleProfileUrl: auth.tenant.googleProfileUrl,
      showGoogleReviewOnReceipt: Boolean(auth.tenant.showGoogleReviewOnReceipt),
    });

    return NextResponse.json({
      success: true,
      whatsappUrl: url,
      cleanPhone,
      rawReceiptText: rawText,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error generating link' }, { status: 500 });
  }
}
