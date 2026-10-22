import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserAndTenant } from '@/lib/auth';
import { Order } from '@/models/Order';
import { Product } from '@/models/Product';
import { Category } from '@/models/Category';

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUserAndTenant();
    if (!auth || !auth.tenant) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || '30d'; // 'today', '7d', '30d', 'all'

    const now = new Date();
    let startDate: Date | null = null;
    let prevStartDate: Date | null = null;
    let prevEndDate: Date | null = null;

    if (period === 'today') {
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);

      prevStartDate = new Date(startDate);
      prevStartDate.setDate(prevStartDate.getDate() - 1);
      prevEndDate = new Date(startDate);
    } else if (period === '7d') {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);

      prevStartDate = new Date(startDate);
      prevStartDate.setDate(prevStartDate.getDate() - 7);
      prevEndDate = new Date(startDate);
    } else if (period === '30d') {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);

      prevStartDate = new Date(startDate);
      prevStartDate.setDate(prevStartDate.getDate() - 30);
      prevEndDate = new Date(startDate);
    }

    const orderFilter: Record<string, any> = { tenantId: auth.tenant._id };
    if (startDate) {
      orderFilter.createdAt = { $gte: startDate };
    }

    // Fetch current period orders, comparison orders, products, and categories in parallel
    const [orders, prevOrders, allProducts, allCategories] = await Promise.all([
      Order.find(orderFilter).sort({ createdAt: -1 }).lean(),
      prevStartDate && prevEndDate
        ? Order.find({
            tenantId: auth.tenant._id,
            createdAt: { $gte: prevStartDate, $lt: prevEndDate },
          })
            .select('totalAmount')
            .lean()
        : Promise.resolve([]),
      Product.find({ tenantId: auth.tenant._id }).populate('categoryId', 'name').lean(),
      Category.find({ tenantId: auth.tenant._id }).lean(),
    ]);

    const prevRevenue = prevOrders.reduce((acc: number, o: any) => acc + (o.totalAmount || 0), 0);
    const prevCount = prevOrders.length;

    // Calculate basic revenue stats
    const totalRevenue = orders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);
    const totalSubtotal = orders.reduce((acc, o) => acc + (o.subtotal || 0), 0);
    const totalTax = orders.reduce((acc, o) => acc + (o.tax || 0), 0);
    const totalDiscount = orders.reduce((acc, o) => acc + (o.discount || 0), 0);
    const orderCount = orders.length;
    const averageOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;

    // Revenue growth comparison
    let revenueGrowth = 0;
    if (prevRevenue > 0) {
      revenueGrowth = Number((((totalRevenue - prevRevenue) / prevRevenue) * 100).toFixed(1));
    } else if (totalRevenue > 0) {
      revenueGrowth = 100;
    }

    let ordersGrowth = 0;
    if (prevCount > 0) {
      ordersGrowth = Number((((orderCount - prevCount) / prevCount) * 100).toFixed(1));
    } else if (orderCount > 0) {
      ordersGrowth = 100;
    }

    // Daily Timeline
    const dailyMap = new Map<string, { date: string; label: string; revenue: number; orders: number }>();
    const numDays = period === 'today' ? 1 : period === '7d' ? 7 : 30;

    // Pre-populate days
    for (let i = numDays - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      dailyMap.set(key, { date: key, label, revenue: 0, orders: 0 });
    }

    orders.forEach((o) => {
      const dStr = new Date(o.createdAt).toISOString().split('T')[0];
      const existing = dailyMap.get(dStr);
      if (existing) {
        existing.revenue = Number((existing.revenue + (o.totalAmount || 0)).toFixed(2));
        existing.orders += 1;
      } else if (period === 'all') {
        const dObj = new Date(o.createdAt);
        const label = dObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        dailyMap.set(dStr, {
          date: dStr,
          label,
          revenue: Number((o.totalAmount || 0).toFixed(2)),
          orders: 1,
        });
      }
    });

    const dailyTimeline = Array.from(dailyMap.values()).map((item) => ({
      ...item,
      aov: item.orders > 0 ? Number((item.revenue / item.orders).toFixed(2)) : 0,
    }));

    // Hourly Distribution (0 to 23 hours)
    const hourlyDistribution = Array.from({ length: 24 }, (_, hour) => {
      const hour12 = hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`;
      return { hour, hourLabel: hour12, orders: 0, revenue: 0 };
    });

    orders.forEach((o) => {
      const h = new Date(o.createdAt).getHours();
      if (hourlyDistribution[h]) {
        hourlyDistribution[h].orders += 1;
        hourlyDistribution[h].revenue = Number(
          (hourlyDistribution[h].revenue + (o.totalAmount || 0)).toFixed(2)
        );
      }
    });

    // Peak hour
    const peakHour = [...hourlyDistribution].sort((a, b) => b.orders - a.orders)[0];

    // Product & Category Sales Performance
    const productStatsMap = new Map<string, { productId?: string; name: string; unitsSold: number; totalRevenue: number }>();
    orders.forEach((o) => {
      o.items?.forEach((item) => {
        const key = item.productName || 'Unknown Item';
        const existing = productStatsMap.get(key) || {
          productId: item.productId?.toString(),
          name: key,
          unitsSold: 0,
          totalRevenue: 0,
        };
        existing.unitsSold += item.quantity || 1;
        existing.totalRevenue = Number((existing.totalRevenue + (item.lineTotal || 0)).toFixed(2));
        productStatsMap.set(key, existing);
      });
    });

    const sortedProducts = Array.from(productStatsMap.values())
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .map((p) => ({
        ...p,
        percentage: totalRevenue > 0 ? Number(((p.totalRevenue / totalRevenue) * 100).toFixed(1)) : 0,
      }));

    // Payment Methods Breakdown
    const paymentMap: Record<string, { count: number; total: number }> = {
      PAID_CASH: { count: 0, total: 0 },
      PAID_ONLINE: { count: 0, total: 0 },
      COD: { count: 0, total: 0 },
      PENDING: { count: 0, total: 0 },
    };

    orders.forEach((o) => {
      const method = o.paymentStatus || 'PAID_CASH';
      if (!paymentMap[method]) {
        paymentMap[method] = { count: 0, total: 0 };
      }
      paymentMap[method].count += 1;
      paymentMap[method].total = Number((paymentMap[method].total + (o.totalAmount || 0)).toFixed(2));
    });

    const paymentLabels: Record<string, string> = {
      PAID_CASH: 'Cash',
      PAID_ONLINE: 'Online / UPI',
      COD: 'Cash on Delivery',
      PENDING: 'Pending',
    };

    const paymentBreakdown = Object.entries(paymentMap).map(([key, data]) => ({
      method: key,
      label: paymentLabels[key] || key,
      count: data.count,
      total: data.total,
      percentage: totalRevenue > 0 ? Number(((data.total / totalRevenue) * 100).toFixed(1)) : 0,
    }));

    // Customer Insights & Retention
    const customerMap = new Map<
      string,
      { name: string; phone: string; ordersCount: number; totalSpent: number; lastOrderDate: string }
    >();

    orders.forEach((o) => {
      const key = o.customerPhone ? o.customerPhone.trim() : 'Anonymous';
      const existing = customerMap.get(key) || {
        name: o.customerName || 'Valued Customer',
        phone: o.customerPhone || '—',
        ordersCount: 0,
        totalSpent: 0,
        lastOrderDate: o.createdAt.toISOString(),
      };
      existing.ordersCount += 1;
      existing.totalSpent = Number((existing.totalSpent + (o.totalAmount || 0)).toFixed(2));
      if (new Date(o.createdAt) > new Date(existing.lastOrderDate)) {
        existing.lastOrderDate = o.createdAt.toISOString();
      }
      customerMap.set(key, existing);
    });

    const allCustomers = Array.from(customerMap.values());
    const totalCustomers = allCustomers.length;
    const repeatCustomers = allCustomers.filter((c) => c.ordersCount > 1).length;
    const repeatRate = totalCustomers > 0 ? Number(((repeatCustomers / totalCustomers) * 100).toFixed(1)) : 0;
    const topCustomers = [...allCustomers].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 10);

    // Products & Inventory Health
    const totalProducts = allProducts.length;
    const trackedProducts = allProducts.filter((p) => p.trackStock).length;
    const liveCounterProducts = totalProducts - trackedProducts;
    const outOfStockItems = allProducts.filter((p) => p.trackStock && (p.stockQuantity ?? 0) <= 0);
    const lowStockItems = allProducts.filter((p) => p.trackStock && (p.stockQuantity ?? 0) > 0 && (p.stockQuantity ?? 0) <= 5);
    const inStockCount = allProducts.filter((p) => !p.trackStock || (p.stockQuantity ?? 0) > 5).length;

    // Category Sales Breakdown
    const categoryRevenueMap = new Map<string, { categoryId: string; name: string; revenue: number; itemsCount: number }>();
    allCategories.forEach((c) => {
      categoryRevenueMap.set(c._id.toString(), {
        categoryId: c._id.toString(),
        name: c.name,
        revenue: 0,
        itemsCount: 0,
      });
    });

    allProducts.forEach((p) => {
      const rawCat = (p as any).categoryId;
      const catId = rawCat && typeof rawCat === 'object' ? rawCat._id?.toString() : rawCat ? String(rawCat) : null;
      if (catId && categoryRevenueMap.has(catId)) {
        categoryRevenueMap.get(catId)!.itemsCount += 1;
      }
    });

    orders.forEach((o) => {
      o.items?.forEach((item) => {
        if (item.productId) {
          const matchedProd = allProducts.find((p) => p._id.toString() === item.productId?.toString());
          if (matchedProd) {
            const rawCat = (matchedProd as any).categoryId;
            const catId = rawCat && typeof rawCat === 'object' ? rawCat._id?.toString() : rawCat ? String(rawCat) : null;
            if (catId && categoryRevenueMap.has(catId)) {
              const catStat = categoryRevenueMap.get(catId)!;
              catStat.revenue = Number((catStat.revenue + (item.lineTotal || 0)).toFixed(2));
            }
          }
        }
      });
    });

    const categoryBreakdown = Array.from(categoryRevenueMap.values()).map((c) => ({
      ...c,
      percentage: totalRevenue > 0 ? Number(((c.revenue / totalRevenue) * 100).toFixed(1)) : 0,
    }));

    return NextResponse.json({
      success: true,
      currency: auth.tenant.currency || '$',
      businessName: auth.tenant.businessName,
      businessType: auth.tenant.businessType || 'Retail shops',
      period,
      revenueSummary: {
        totalRevenue: Number(totalRevenue.toFixed(2)),
        totalSubtotal: Number(totalSubtotal.toFixed(2)),
        totalTax: Number(totalTax.toFixed(2)),
        totalDiscount: Number(totalDiscount.toFixed(2)),
        orderCount,
        averageOrderValue: Number(averageOrderValue.toFixed(2)),
        revenueGrowth,
        ordersGrowth,
        prevRevenue: Number(prevRevenue.toFixed(2)),
        prevCount,
      },
      dailyTimeline,
      hourlyDistribution,
      peakHour: peakHour?.orders > 0 ? peakHour : null,
      topProducts: sortedProducts.slice(0, 10),
      allProductStats: sortedProducts,
      categoryBreakdown,
      paymentBreakdown,
      customerAnalytics: {
        totalCustomers,
        repeatCustomers,
        repeatRate,
        topCustomers,
      },
      inventoryHealth: {
        totalProducts,
        trackedProducts,
        liveCounterProducts,
        inStockCount,
        lowStockCount: lowStockItems.length,
        outOfStockCount: outOfStockItems.length,
        lowStockList: lowStockItems.map((p) => ({
          _id: p._id,
          name: p.name,
          sku: p.sku,
          stockQuantity: p.stockQuantity,
          price: p.price,
        })),
        outOfStockList: outOfStockItems.map((p) => ({
          _id: p._id,
          name: p.name,
          sku: p.sku,
          stockQuantity: p.stockQuantity,
          price: p.price,
        })),
      },
      recentOrders: orders.slice(0, 8).map((o) => ({
        _id: o._id,
        orderNumber: o.orderNumber,
        customerName: o.customerName,
        customerPhone: o.customerPhone,
        totalAmount: o.totalAmount,
        paymentStatus: o.paymentStatus,
        createdAt: o.createdAt,
        itemsCount: o.items?.length || 0,
      })),
    });
  } catch (error: any) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: error.message || 'Error computing analytics' },
      { status: 500 }
    );
  }
}
