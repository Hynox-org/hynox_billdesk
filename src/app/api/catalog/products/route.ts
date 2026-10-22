import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserAndTenant } from '@/lib/auth';
import { Product } from '@/models/Product';
import { Category } from '@/models/Category';


export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUserAndTenant();
    if (!auth || !auth.tenant) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('categoryId');
    const availableOnly = searchParams.get('availableOnly') === 'true';

    const filter: Record<string, any> = { tenantId: auth.tenant._id };
    if (categoryId) filter.categoryId = categoryId;
    if (availableOnly) filter.isAvailable = true;

    const products = await Product.find(filter)
      .populate('categoryId', 'name')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, products, currency: auth.tenant.currency || '$' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error fetching products' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUserAndTenant();
    if (!auth || !auth.tenant) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (auth.trialInfo?.isExpired) {
      return NextResponse.json(
        {
          error: 'TRIAL_EXPIRED',
          message: 'Your 15-day free trial has expired. Contact support to upgrade.',
        },
        { status: 403 }
      );
    }

    const {
      categoryId,
      name,
      description,
      price,
      sku,
      isAvailable = true,
      trackStock = false,
      stockQuantity = 0,
      imageUrl,
    } = await req.json();

    if (!categoryId || !name || price === undefined) {
      return NextResponse.json(
        { error: 'Category, Product Name, and Price are required' },
        { status: 400 }
      );
    }

    // Verify category belongs to this tenant
    const category = await Category.findOne({ _id: categoryId, tenantId: auth.tenant._id });
    if (!category) {
      return NextResponse.json({ error: 'Invalid category for this store' }, { status: 400 });
    }

    const product = await Product.create({
      tenantId: auth.tenant._id,
      categoryId,
      name: name.trim(),
      description: description ? description.trim() : '',
      price: Math.max(0, Number(price)),
      sku: sku ? sku.trim() : '',
      isAvailable: Boolean(isAvailable),
      trackStock: Boolean(trackStock),
      stockQuantity: trackStock ? Math.max(0, parseInt(stockQuantity, 10) || 0) : 0,
      imageUrl: imageUrl ? imageUrl.trim() : '',
    });

    return NextResponse.json({ success: true, product }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error creating product' }, { status: 500 });
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
        { error: 'TRIAL_EXPIRED', message: 'Trial expired. Cannot modify products.' },
        { status: 403 }
      );
    }

    const {
      id,
      categoryId,
      name,
      description,
      price,
      sku,
      isAvailable,
      trackStock,
      stockQuantity,
      imageUrl,
    } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const updateData: Record<string, any> = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (price !== undefined) updateData.price = Math.max(0, Number(price));
    if (sku !== undefined) updateData.sku = sku.trim();
    if (isAvailable !== undefined) updateData.isAvailable = Boolean(isAvailable);
    if (trackStock !== undefined) updateData.trackStock = Boolean(trackStock);
    if (stockQuantity !== undefined) updateData.stockQuantity = Math.max(0, parseInt(stockQuantity, 10) || 0);
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl.trim();
    if (categoryId) {
      const category = await Category.findOne({ _id: categoryId, tenantId: auth.tenant._id });
      if (!category) {
        return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
      }
      updateData.categoryId = categoryId;
    }

    const product = await Product.findOneAndUpdate(
      { _id: id, tenantId: auth.tenant._id },
      updateData,
      { new: true }
    );

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error updating product' }, { status: 500 });
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
        { error: 'TRIAL_EXPIRED', message: 'Trial expired. Cannot delete products.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    await Product.findOneAndDelete({ _id: id, tenantId: auth.tenant._id });

    return NextResponse.json({ success: true, message: 'Product deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error deleting product' }, { status: 500 });
  }
}
