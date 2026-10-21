import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';
import { Tenant } from '@/models/Tenant';
import { Category } from '@/models/Category';
import { Otp } from '@/models/Otp';
import { hashPassword, signAuthToken, COOKIE_NAME } from '@/lib/auth';
import { sendEmail, buildBrandedEmailHtml } from '@/lib/email';

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
    const { fullName, email, password, businessName, businessType = 'Retail shops', phone, address, currency = '$', otp } = body;

    if (!fullName || !email || !password || !businessName || !phone) {
      return NextResponse.json(
        { error: 'All required fields (Name, Email, Password, Business Name, Phone) must be provided' },
        { status: 400 }
      );
    }

    if (!otp || !otp.trim()) {
      return NextResponse.json(
        { error: 'Email verification code is required. Please verify your email.' },
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

    const normalizedEmail = email.toLowerCase().trim();

    // Verify Email OTP
    const otpDoc = await Otp.findOne({
      email: normalizedEmail,
      type: 'REGISTER',
    });

    if (!otpDoc) {
      return NextResponse.json(
        { error: 'Verification code expired or not found. Please request a new code.' },
        { status: 400 }
      );
    }

    if (otpDoc.otp !== otp.trim()) {
      otpDoc.attempts += 1;
      await otpDoc.save();
      return NextResponse.json(
        { error: 'Invalid verification code. Please check your inbox and enter the 6-digit code.' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email address already exists. Please log in.' },
        { status: 409 }
      );
    }

    // Delete verified OTP
    await Otp.deleteOne({ _id: otpDoc._id });

    // 15-Day Free Trial timestamps
    const now = new Date();
    const trialEndsAt = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);

    // Create Tenant
    const slug = generateSlug(businessName);
    const tenant = await Tenant.create({
      businessName: businessName.trim(),
      businessType: businessType ? businessType.trim() : 'Retail shops',
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

    // Send welcome email asynchronously
    const welcomeHtml = buildBrandedEmailHtml({
      title: 'Welcome to HYNOX Billing',
      preheader: `Your store workspace "${tenant.businessName}" is ready.`,
      contentHtml: `
        <h2 style="color: #25D366; margin-top: 0;">Welcome aboard, ${user.fullName}!</h2>
        <p>Your store workspace <strong>${tenant.businessName}</strong> has been created on HYNOX Billing.</p>
        <p>You have full access to create orders, manage your catalog, and dispatch instant WhatsApp receipts during your <strong>15-day free trial</strong>.</p>
        <div style="background: rgba(37, 211, 102, 0.08); border-left: 4px solid #25D366; padding: 12px 16px; margin: 20px 0; border-radius: 4px;">
          <strong style="color: #ffffff;">Store Slug:</strong> ${tenant.slug}<br/>
          <strong style="color: #ffffff;">Selected Currency:</strong> ${tenant.currency}<br/>
          <strong style="color: #ffffff;">Free Trial Period:</strong> 15 Days
        </div>
      `,
      actionButton: {
        text: 'Open Store Workspace',
        url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/pos`,
      },
    });

    sendEmail({
      to: { email: user.email, name: user.fullName },
      subject: `Welcome to HYNOX Billing, ${user.fullName}!`,
      htmlContent: welcomeHtml,
      textContent: `Welcome to HYNOX Billing! Your store workspace "${tenant.businessName}" is now ready.`,
    }).catch((e) => console.error('[Welcome Email Failed]:', e));

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
        businessType: tenant.businessType || 'Retail shops',
        phone: tenant.phone,
        currency: tenant.currency,
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
