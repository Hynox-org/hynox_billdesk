import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ success: false, error: 'Database seeding is disabled for the shared Supabase project.' }, { status: 410 });
}
