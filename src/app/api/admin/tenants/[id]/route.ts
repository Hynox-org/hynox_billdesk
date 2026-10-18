import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserAndTenant } from '@/lib/auth';
import { Tenant } from '@/models/Tenant';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedUserAndTenant();
    if (!auth || auth.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Super Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const { action, days = 15, status } = await req.json();

    const tenant = await Tenant.findById(id);
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    if (action === 'EXTEND_TRIAL') {
      const additionalDays = Math.max(1, parseInt(days, 10) || 15);
      const baseDate = new Date(tenant.trialEndsAt).getTime() > Date.now()
        ? new Date(tenant.trialEndsAt)
        : new Date();
      
      const newTrialEnd = new Date(baseDate.getTime() + additionalDays * 24 * 60 * 60 * 1000);
      tenant.trialEndsAt = newTrialEnd;
      tenant.status = 'ACTIVE';
      await tenant.save();

      return NextResponse.json({
        success: true,
        message: `Extended trial by ${additionalDays} days until ${newTrialEnd.toLocaleDateString()}`,
        tenant,
      });
    }

    if (action === 'ACTIVATE_PRO') {
      tenant.plan = 'PRO';
      tenant.status = 'ACTIVE';
      // Pro subscription valid for 1 year or perpetual
      tenant.proExpiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      await tenant.save();

      return NextResponse.json({
        success: true,
        message: 'Tenant successfully upgraded to PRO status',
        tenant,
      });
    }

    if (action === 'DOWNGRADE_TRIAL') {
      tenant.plan = 'FREE_TRIAL';
      await tenant.save();

      return NextResponse.json({
        success: true,
        message: 'Tenant reverted to Free Trial plan',
        tenant,
      });
    }

    if (action === 'SET_STATUS') {
      if (!['ACTIVE', 'SUSPENDED', 'EXPIRED'].includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }
      tenant.status = status;
      await tenant.save();

      return NextResponse.json({
        success: true,
        message: `Tenant status updated to ${status}`,
        tenant,
      });
    }

    return NextResponse.json({ error: 'Unknown action specified' }, { status: 400 });
  } catch (error: any) {
    console.error('Super Admin action error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update tenant' },
      { status: 500 }
    );
  }
}
