import { connectToDatabase } from './mongodb';
import { User } from '@/models/User';
import { Tenant } from '@/models/Tenant';
import { Category } from '@/models/Category';
import { Product } from '@/models/Product';
import { hashPassword } from './auth';

export async function seedInitialData() {
  await connectToDatabase();

  // 1. Ensure Super Admin exists
  const existingAdmin = await User.findOne({ email: 'admin@saas.com' });
  if (!existingAdmin) {
    const adminPasswordHash = await hashPassword('admin123456');
    await User.create({
      fullName: 'System Super Administrator',
      email: 'admin@saas.com',
      passwordHash: adminPasswordHash,
      role: 'SUPER_ADMIN',
      isActive: true,
    });
    console.log('✅ Super Admin created: admin@saas.com / admin123456');
  }

  // 2. Ensure Active Demo Vendor exists
  let activeTenant = await Tenant.findOne({ slug: 'brew-and-bite-cafe' });
  if (!activeTenant) {
    activeTenant = await Tenant.create({
      businessName: 'Brew & Bite Artisan Cafe',
      slug: 'brew-and-bite-cafe',
      phone: '+1 555-0199',
      currency: '$',
      countryCode: '1',
      address: '742 Evergreen Terrace, Suite 101, Springfield',
      status: 'ACTIVE',
      plan: 'FREE_TRIAL',
      trialStartsAt: new Date(),
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000), // ~14.5 days remaining
    });

    const vendorPasswordHash = await hashPassword('vendor123456');
    await User.create({
      tenantId: activeTenant._id,
      fullName: 'Oliver Vance',
      email: 'cafe@vendor.com',
      passwordHash: vendorPasswordHash,
      role: 'VENDOR',
      isActive: true,
    });

    // Create Categories & Products for Cafe
    const catCoffee = await Category.create({
      tenantId: activeTenant._id,
      name: 'Espresso & Beverages',
      displayOrder: 1,
      isActive: true,
    });

    const catBakery = await Category.create({
      tenantId: activeTenant._id,
      name: 'Artisan Bakery',
      displayOrder: 2,
      isActive: true,
    });

    const catBites = await Category.create({
      tenantId: activeTenant._id,
      name: 'Savory & Brunch',
      displayOrder: 3,
      isActive: true,
    });

    await Product.create([
      {
        tenantId: activeTenant._id,
        categoryId: catCoffee._id,
        name: 'Oat Milk Flat White',
        description: 'Velvety micro-foam espresso with organic oat milk',
        price: 4.75,
        sku: 'COF-01',
        isAvailable: true,
      },
      {
        tenantId: activeTenant._id,
        categoryId: catCoffee._id,
        name: 'Iced Spanish Latte',
        description: 'Double espresso with sweet condensed milk over crushed ice',
        price: 5.5,
        sku: 'COF-02',
        isAvailable: true,
      },
      {
        tenantId: activeTenant._id,
        categoryId: catCoffee._id,
        name: 'Ceremonial Matcha Latte',
        description: 'Uji single-origin green tea whisked with almond milk',
        price: 6.0,
        sku: 'COF-03',
        isAvailable: true,
      },
      {
        tenantId: activeTenant._id,
        categoryId: catBakery._id,
        name: 'Almond Twice-Baked Croissant',
        description: 'Flaky French butter pastry filled with rich almond frangipane',
        price: 4.25,
        sku: 'BAK-01',
        isAvailable: true,
      },
      {
        tenantId: activeTenant._id,
        categoryId: catBakery._id,
        name: 'Cinnamon Swirl Brioche',
        description: 'Warm spiced brioche with vanilla cream cheese glaze',
        price: 4.5,
        sku: 'BAK-02',
        isAvailable: true,
      },
      {
        tenantId: activeTenant._id,
        categoryId: catBites._id,
        name: 'Truffle Mushroom Panini',
        description: 'Wild forest mushrooms, gruyere, and black truffle aioli',
        price: 9.75,
        sku: 'SAV-01',
        isAvailable: true,
      },
      {
        tenantId: activeTenant._id,
        categoryId: catBites._id,
        name: 'Smoked Salmon Sourdough Bagel',
        description: 'Norwegian salmon, dill caper cream cheese, pickled red onion',
        price: 11.5,
        sku: 'SAV-02',
        isAvailable: true,
      },
    ]);
  }

  // 3. Ensure Expired Demo Vendor exists for instant Paywall testing
  let expiredTenant = await Tenant.findOne({ slug: 'vintage-threads' });
  if (!expiredTenant) {
    const expiredPastDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000); // 3 days ago
    expiredTenant = await Tenant.create({
      businessName: 'Vintage Threads Boutique',
      slug: 'vintage-threads',
      phone: '+1 555-0822',
      currency: '$',
      countryCode: '1',
      address: '104 Retro Lane, Austin, TX',
      status: 'EXPIRED',
      plan: 'FREE_TRIAL',
      trialStartsAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000), // 18 days ago
      trialEndsAt: expiredPastDate,
    });

    const expiredVendorPasswordHash = await hashPassword('vendor123456');
    await User.create({
      tenantId: expiredTenant._id,
      fullName: 'Maya Lin',
      email: 'expired@vendor.com',
      passwordHash: expiredVendorPasswordHash,
      role: 'VENDOR',
      isActive: true,
    });

    const catApparel = await Category.create({
      tenantId: expiredTenant._id,
      name: 'Vintage Apparel',
      displayOrder: 1,
      isActive: true,
    });

    await Product.create({
      tenantId: expiredTenant._id,
      categoryId: catApparel._id,
      name: 'Retro 90s Denim Jacket',
      description: 'Classic oversized stonewash denim jacket',
      price: 65.0,
      sku: 'VNT-01',
      isAvailable: true,
    });
  }

  return { success: true, message: 'Initial seed data provisioned successfully' };
}
