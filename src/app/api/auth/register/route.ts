import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';
import { Tenant } from '@/models/Tenant';
import { Category } from '@/models/Category';
import { hashPassword, signAuthToken, COOKIE_NAME } from '@/lib/auth';

function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
  return `${base}-${Math.random().toString(36).substring(2, 6)}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fullName, email, password, businessName, phone, address, currency = '$' } = body;

    if (!fullName || !email || !password || !businessName || !phone) {
      return NextResponse.json(
        { error: 'All required fields (Name, Email, Password, Business Name, Phone) must be provided' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Check if user already exists
    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email address already exists' },
        { status: 409 }
      );
    }

    // 15-Day Free Trial timestamps
    const now = new Date();
    const trialEndsAt = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);

    // Create Tenant
    const slug = generateSlug(businessName);
    const tenant = await Tenant.create({
      businessName: businessName.trim(),
      slug,
      phone: phone.trim(),
      currency,
      address: address ? address.trim() : '',
      status: 'ACTIVE',
      plan: 'FREE_TRIAL',
      trialStartsAt: now,
      trialEndsAt,
    });

    // Create Vendor User
    const passwordHash = await hashPassword(password);
    const user = await User.create({
      tenantId: tenant._id,
      fullName: fullName.trim(),
      email: normalizedEmail,
      passwordHash,
      role: 'VENDOR',
      isActive: true,
    });

    // Seed default starter categories
    await Category.create([
      { tenantId: tenant._id, name: 'Main Catalog', displayOrder: 1, isActive: true },
      { tenantId: tenant._id, name: 'Special Offers', displayOrder: 2, isActive: true },
    ]);

    // Sign JWT session token
    const token = signAuthToken({
      userId: user._id.toString(),
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      tenantId: tenant._id.toString(),
      businessName: tenant.businessName,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
      tenant: {
        id: tenant._id,
        businessName: tenant.businessName,
        phone: tenant.phone,
        trialEndsAt: tenant.trialEndsAt,
        plan: tenant.plan,
        daysRemaining: 15,
      },
    });

    // Set secure HTTP-only cookie
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 24 * 60 * 60, // 15 days
    });

    return response;
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to complete registration' },
      { status: 500 }
    );
  }
}
