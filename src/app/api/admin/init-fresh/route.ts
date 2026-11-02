import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ error: 'Destructive database reset is disabled for the shared Supabase project.' }, { status: 410 });
}
