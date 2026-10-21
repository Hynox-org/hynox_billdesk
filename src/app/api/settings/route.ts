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
        businessType: tenant.businessType || 'Retail shops',
        slug: tenant.slug,
        phone: tenant.phone,
        currency: tenant.currency || '$',
        address: tenant.address || '',
        location: tenant.location || 'Main Store',
        city: tenant.city || '',
        province: tenant.province || '',
        provinceCode: tenant.provinceCode || '',
        zip: tenant.zip || '',
        country: tenant.country || '',
        defaultEmployee: tenant.defaultEmployee || '',
        defaultTaxName: tenant.defaultTaxName || 'GST 18%',
        defaultTaxRate: tenant.defaultTaxRate !== undefined ? tenant.defaultTaxRate : 18,
        defaultTax2Name: tenant.defaultTax2Name || '',
        deviceId: tenant.deviceId || '',
        gstNumber: tenant.gstNumber || '',
        showGstOnReceipt: Boolean(tenant.showGstOnReceipt),
        enableTaxOnCheckout: Boolean(tenant.enableTaxOnCheckout),
        googleProfileUrl: tenant.googleProfileUrl || '',
        showGoogleReviewOnReceipt: Boolean(tenant.showGoogleReviewOnReceipt),
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
    const {
      fullName,
      businessName,
      businessType,
      phone,
      address,
      currency,
      location,
      city,
      province,
      provinceCode,
      zip,
      country,
      defaultEmployee,
      defaultTaxName,
      defaultTaxRate,
      defaultTax2Name,
      deviceId,
      gstNumber,
      showGstOnReceipt,
      enableTaxOnCheckout,
      googleProfileUrl,
      showGoogleReviewOnReceipt,
    } = body;

    // 1. Update personal information (fullName)
    if (fullName && fullName.trim()) {
      await User.findByIdAndUpdate(auth.user._id, {
        fullName: fullName.trim(),
      });
    }

    // 2. Update business information
    const tenantUpdate: Record<string, any> = {};
    if (businessName && businessName.trim()) tenantUpdate.businessName = businessName.trim();
    if (businessType && businessType.trim()) tenantUpdate.businessType = businessType.trim();
    if (phone && phone.trim()) tenantUpdate.phone = phone.trim();
    if (address !== undefined) tenantUpdate.address = address.trim();
    if (currency && currency.trim()) tenantUpdate.currency = currency.trim();
    if (location !== undefined) tenantUpdate.location = location.trim();
    if (city !== undefined) tenantUpdate.city = city.trim();
    if (province !== undefined) tenantUpdate.province = province.trim();
    if (provinceCode !== undefined) tenantUpdate.provinceCode = provinceCode.trim();
    if (zip !== undefined) tenantUpdate.zip = zip.trim();
    if (country !== undefined) tenantUpdate.country = country.trim();
    if (defaultEmployee !== undefined) tenantUpdate.defaultEmployee = defaultEmployee.trim();
    if (defaultTaxName !== undefined) tenantUpdate.defaultTaxName = defaultTaxName.trim();
    if (defaultTaxRate !== undefined) tenantUpdate.defaultTaxRate = Math.max(0, Number(defaultTaxRate) || 0);
    if (defaultTax2Name !== undefined) tenantUpdate.defaultTax2Name = defaultTax2Name.trim();
    if (deviceId !== undefined) tenantUpdate.deviceId = deviceId.trim();
    if (gstNumber !== undefined) tenantUpdate.gstNumber = typeof gstNumber === 'string' ? gstNumber.trim() : '';
    if (showGstOnReceipt !== undefined) tenantUpdate.showGstOnReceipt = Boolean(showGstOnReceipt);
    if (enableTaxOnCheckout !== undefined) tenantUpdate.enableTaxOnCheckout = Boolean(enableTaxOnCheckout);
    if (googleProfileUrl !== undefined) tenantUpdate.googleProfileUrl = typeof googleProfileUrl === 'string' ? googleProfileUrl.trim() : '';
    if (showGoogleReviewOnReceipt !== undefined) tenantUpdate.showGoogleReviewOnReceipt = Boolean(showGoogleReviewOnReceipt);

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
        businessType: updatedTenant!.businessType || 'Retail shops',
        phone: updatedTenant!.phone,
        currency: updatedTenant!.currency,
        address: updatedTenant!.address,
        location: updatedTenant!.location || 'Main Store',
        city: updatedTenant!.city || '',
        province: updatedTenant!.province || '',
        provinceCode: updatedTenant!.provinceCode || '',
        zip: updatedTenant!.zip || '',
        country: updatedTenant!.country || '',
        defaultEmployee: updatedTenant!.defaultEmployee || '',
        defaultTaxName: updatedTenant!.defaultTaxName || 'GST 18%',
        defaultTax2Name: updatedTenant!.defaultTax2Name || '',
        deviceId: updatedTenant!.deviceId || '',
        gstNumber: updatedTenant!.gstNumber || '',
        showGstOnReceipt: Boolean(updatedTenant!.showGstOnReceipt),
        googleProfileUrl: updatedTenant!.googleProfileUrl || '',
        showGoogleReviewOnReceipt: Boolean(updatedTenant!.showGoogleReviewOnReceipt),
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
