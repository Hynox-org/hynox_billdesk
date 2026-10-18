import { NextResponse } from 'next/server';
import { seedInitialData } from '@/lib/seed';

export async function GET() {
  try {
    const result = await seedInitialData();
    return NextResponse.json({ success: true, message: result.message });
  } catch (error: any) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to seed database' },
      { status: 500 }
    );
  }
}
