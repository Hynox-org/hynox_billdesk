import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserAndTenant, signAuthToken, COOKIE_NAME } from '@/lib/auth';
import { User } from '@/models/User';
import { Tenant } from '@/models/Tenant';

export async function GET() {
  try {
    const auth = await getAuthenticatedUserAndTenant();
    if (!auth || !auth.user || !auth.tenant) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user, tenant, trialInfo } = auth;

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
      tenant: {
        id: tenant._id,
        businessName: tenant.businessName,
        slug: tenant.slug,
        phone: tenant.phone,
        currency: tenant.currency || '$',
        address: tenant.address || '',
        plan: tenant.plan,
        status: tenant.status,
        trialStartsAt: tenant.trialStartsAt,
        trialEndsAt: tenant.trialEndsAt,
        daysRemaining: trialInfo?.daysRemaining ?? 0,
        isExpired: trialInfo?.isExpired ?? false,
        isPro: trialInfo?.isPro ?? false,
        createdAt: tenant.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Settings GET error:', error);
    return NextResponse.json({ error: error.message || 'Failed to load profile settings' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUserAndTenant();
    if (!auth || !auth.user || !auth.tenant) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { fullName, businessName, phone, address, currency } = body;

    // 1. Update personal information (fullName)
    if (fullName && fullName.trim()) {
      await User.findByIdAndUpdate(auth.user._id, {
        fullName: fullName.trim(),
      });
    }

    // 2. Update business information (businessName, phone, address, currency)
    // Restricted fields like slug, plan, status, trialEndsAt are deliberately omitted and preserved!
    const tenantUpdate: Record<string, any> = {};
    if (businessName && businessName.trim()) tenantUpdate.businessName = businessName.trim();
    if (phone && phone.trim()) tenantUpdate.phone = phone.trim();
    if (address !== undefined) tenantUpdate.address = address.trim();
    if (currency && currency.trim()) tenantUpdate.currency = currency.trim();

    if (Object.keys(tenantUpdate).length > 0) {
      await Tenant.findByIdAndUpdate(auth.tenant._id, tenantUpdate);
    }

    // Refresh JWT session cookie with updated names
    const updatedUser = await User.findById(auth.user._id);
    const updatedTenant = await Tenant.findById(auth.tenant._id);

    const token = signAuthToken({
      userId: updatedUser!._id.toString(),
      email: updatedUser!.email,
      fullName: updatedUser!.fullName,
      role: updatedUser!.role,
      tenantId: updatedTenant!._id.toString(),
      businessName: updatedTenant!.businessName,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Business and personal profile saved successfully',
      user: {
        id: updatedUser!._id,
        fullName: updatedUser!.fullName,
        email: updatedUser!.email,
        role: updatedUser!.role,
      },
      tenant: {
        id: updatedTenant!._id,
        businessName: updatedTenant!.businessName,
        phone: updatedTenant!.phone,
        currency: updatedTenant!.currency,
        address: updatedTenant!.address,
      },
    });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 24 * 60 * 60,
    });

    return response;
  } catch (error: any) {
    console.error('Settings PUT error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update settings' }, { status: 500 });
  }
}
