import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';
import { hashPassword } from '@/lib/auth';

/**
 * Endpoint to wipe all database collections and initialize a fresh Super Admin.
 * Usage: GET or POST /api/admin/init-fresh
 */
export async function GET(req: NextRequest) {
  return handleInit();
}

export async function POST(req: NextRequest) {
  return handleInit();
}

async function handleInit() {
  try {
    await connectToDatabase();
    const db = mongoose.connection.db;

    if (!db) {
      throw new Error('Database connection not established');
    }

    const collections = ['users', 'tenants', 'categories', 'products', 'orders'];
    const summary: Record<string, number> = {};

    for (const col of collections) {
      try {
        const count = await db.collection(col).countDocuments();
        if (count > 0) {
          await db.collection(col).deleteMany({});
        }
        summary[col] = count;
      } catch {
        summary[col] = 0;
      }
    }

    // Create fresh Super Admin
    const email = 'admin@saas.com';
    const password = 'admin123456';
    const passwordHash = await hashPassword(password);

    const admin = await User.create({
      fullName: 'System Super Admin',
      email,
      passwordHash,
      role: 'SUPER_ADMIN',
      isActive: true,
    });

    return NextResponse.json({
      success: true,
      message: 'Database purged successfully. Single Super Admin created.',
      deletedRecords: summary,
      superAdmin: {
        id: admin._id,
        email: admin.email,
        role: admin.role,
        defaultPassword: password,
      },
      nextSteps: [
        'Login as Super Admin at /login using admin@saas.com / admin123456',
        'Register fresh vendors at /register',
        'Manage all vendors from /admin',
      ],
    });
  } catch (error: any) {
    console.error('Init fresh DB error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to initialize database',
      },
      { status: 500 }
    );
  }
}
