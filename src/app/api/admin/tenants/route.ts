import { NextResponse } from 'next/server';
import { getAuthenticatedUserAndTenant } from '@/lib/auth';
import { Tenant } from '@/models/Tenant';
import { User } from '@/models/User';
import { Product } from '@/models/Product';
import { Order } from '@/models/Order';
import { computeTrialInfo } from '@/lib/auth';

export async function GET() {
  try {
    const auth = await getAuthenticatedUserAndTenant();
    if (!auth || auth.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Super Admin access required' }, { status: 403 });
    }

    const tenants = await Tenant.find().sort({ createdAt: -1 });

    // Enrich each tenant with user details, product count, and order stats
    const enrichedTenants = await Promise.all(
      tenants.map(async (tenant) => {
        const [ownerUser, productCount, orderAgg] = await Promise.all([
          User.findOne({ tenantId: tenant._id }),
          Product.countDocuments({ tenantId: tenant._id }),
          Order.aggregate([
            { $match: { tenantId: tenant._id } },
            {
              $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                totalGmv: { $sum: '$totalAmount' },
              },
            },
          ]),
        ]);

        const trialInfo = computeTrialInfo(tenant);

        // Keep tenant status synchronized
        if (trialInfo.isExpired && tenant.status === 'ACTIVE') {
          tenant.status = 'EXPIRED';
          await tenant.save();
        }

        const totalOrders = orderAgg[0]?.totalOrders || 0;
        const totalGmv = orderAgg[0]?.totalGmv || 0;

        return {
          id: tenant._id,
          businessName: tenant.businessName,
          slug: tenant.slug,
          phone: tenant.phone,
          currency: tenant.currency,
          address: tenant.address,
          status: tenant.status,
          plan: tenant.plan,
          trialStartsAt: tenant.trialStartsAt,
          trialEndsAt: tenant.trialEndsAt,
          daysRemaining: trialInfo.daysRemaining,
          isExpired: trialInfo.isExpired,
          isPro: trialInfo.isPro,
          createdAt: tenant.createdAt,
          owner: ownerUser
            ? {
                fullName: ownerUser.fullName,
                email: ownerUser.email,
                isActive: ownerUser.isActive,
              }
            : null,
          productCount,
          totalOrders,
          totalGmv: Number(totalGmv.toFixed(2)),
        };
      })
    );

    // Compute Global Admin Stats
    const stats = {
      totalTenants: enrichedTenants.length,
      activeTrials: enrichedTenants.filter((t) => !t.isPro && !t.isExpired && t.status === 'ACTIVE').length,
      expiredTrials: enrichedTenants.filter((t) => t.isExpired || t.status === 'EXPIRED').length,
      proSubscribers: enrichedTenants.filter((t) => t.isPro).length,
      totalOrders: enrichedTenants.reduce((acc, t) => acc + t.totalOrders, 0),
      totalGmv: Number(enrichedTenants.reduce((acc, t) => acc + t.totalGmv, 0).toFixed(2)),
    };

    return NextResponse.json({ success: true, stats, tenants: enrichedTenants });
  } catch (error: any) {
    console.error('Super Admin fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Error fetching system tenants' },
      { status: 500 }
    );
  }
}
