import { NextResponse } from 'next/server';
import { getAuthenticatedUserAndTenant } from '@/lib/auth';

export async function GET() {
  try {
    const authData = await getAuthenticatedUserAndTenant();
    if (!authData) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const { user, tenant, trialInfo } = authData;

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
      tenant: tenant
        ? {
            id: tenant._id,
            businessName: tenant.businessName,
            businessType: tenant.businessType || 'Retail shops',
            slug: tenant.slug,
            phone: tenant.phone,
            currency: tenant.currency,
            address: tenant.address,
            gstNumber: tenant.gstNumber || '',
            showGstOnReceipt: Boolean(tenant.showGstOnReceipt),
            googleProfileUrl: tenant.googleProfileUrl || '',
            showGoogleReviewOnReceipt: Boolean(tenant.showGoogleReviewOnReceipt),
            status: tenant.status,
            plan: tenant.plan,
            trialStartsAt: tenant.trialStartsAt,
            trialEndsAt: tenant.trialEndsAt,
            daysRemaining: trialInfo?.daysRemaining ?? 0,
            isExpired: trialInfo?.isExpired ?? false,
            isPro: trialInfo?.isPro ?? false,
          }
        : null,
    });
  } catch (error: any) {
    console.error('Auth me error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch session' },
      { status: 500 }
    );
  }
}
