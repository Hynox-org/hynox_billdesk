import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserAndTenant } from '@/lib/auth';
import { Category } from '@/models/Category';
import { Product } from '@/models/Product';

export async function GET() {
  try {
    const auth = await getAuthenticatedUserAndTenant();
    if (!auth || !auth.tenant) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const categories = await Category.find({ tenantId: auth.tenant._id })
      .sort({ displayOrder: 1, createdAt: 1 })
      .lean();

    return NextResponse.json({ success: true, categories });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error fetching categories' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUserAndTenant();
    if (!auth || !auth.tenant) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Trial Paywall enforcement: block writes if trial is expired
    if (auth.trialInfo?.isExpired) {
      return NextResponse.json(
        {
          error: 'TRIAL_EXPIRED',
          message: 'Your 15-day free trial has expired. Please contact support to upgrade to Pro.',
        },
        { status: 403 }
      );
    }

    const { name, displayOrder = 0 } = await req.json();
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    const category = await Category.create({
      tenantId: auth.tenant._id,
      name: name.trim(),
      displayOrder: Number(displayOrder) || 0,
      isActive: true,
    });

    return NextResponse.json({ success: true, category }, { status: 201 });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'A category with this name already exists in your catalog' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message || 'Error creating category' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUserAndTenant();
    if (!auth || !auth.tenant) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (auth.trialInfo?.isExpired) {
      return NextResponse.json(
        { error: 'TRIAL_EXPIRED', message: 'Trial expired. Cannot modify categories.' },
        { status: 403 }
      );
    }

    const { id, name, displayOrder, isActive } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    const category = await Category.findOneAndUpdate(
      { _id: id, tenantId: auth.tenant._id },
      {
        ...(name !== undefined && { name: name.trim() }),
        ...(displayOrder !== undefined && { displayOrder: Number(displayOrder) }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
      },
      { new: true }
    );

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, category });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error updating category' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUserAndTenant();
    if (!auth || !auth.tenant) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (auth.trialInfo?.isExpired) {
      return NextResponse.json(
        { error: 'TRIAL_EXPIRED', message: 'Trial expired. Cannot delete categories.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    // Check if category has products
    const productCount = await Product.countDocuments({
      tenantId: auth.tenant._id,
      categoryId: id,
    });

    if (productCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete category containing ${productCount} items. Move or delete items first.`,
        },
        { status: 400 }
      );
    }

    await Category.findOneAndDelete({ _id: id, tenantId: auth.tenant._id });

    return NextResponse.json({ success: true, message: 'Category deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error deleting category' }, { status: 500 });
  }
}
