import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';
import { Tenant } from '@/models/Tenant';
import { comparePassword, signAuthToken, computeTrialInfo, COOKIE_NAME } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: 'This account has been deactivated. Please contact support.' },
        { status: 403 }
      );
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    let tenant = null;
    let trialInfo = null;

    if (user.role === 'VENDOR' && user.tenantId) {
      tenant = await Tenant.findById(user.tenantId);
      if (tenant) {
        trialInfo = computeTrialInfo(tenant);
        if (trialInfo.isExpired && tenant.status === 'ACTIVE') {
          tenant.status = 'EXPIRED';
          await tenant.save();
        }
      }
    }

    // Create session token
    const token = signAuthToken({
      userId: user._id.toString(),
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      tenantId: tenant ? tenant._id.toString() : undefined,
      businessName: tenant ? tenant.businessName : undefined,
    });

    const response = NextResponse.json({
      success: true,
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
            phone: tenant.phone,
            currency: tenant.currency,
            address: tenant.address,
            plan: tenant.plan,
            status: tenant.status,
            trialEndsAt: tenant.trialEndsAt,
            daysRemaining: trialInfo?.daysRemaining ?? 0,
            isExpired: trialInfo?.isExpired ?? false,
          }
        : null,
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
    console.error('Login error:', error);
    return NextResponse.json(
      { error: error.message || 'Login failed' },
      { status: 500 }
    );
  }
}
