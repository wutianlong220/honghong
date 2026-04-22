import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseCredentials } from '@/storage/database/supabase-client';

export const runtime = 'nodejs';


export async function GET(request: NextRequest) {
  try {
    const { url, anonKey } = getSupabaseCredentials();

    if (!url || !anonKey) {
      return NextResponse.json(
        { error: 'Supabase credentials not configured' },
        { status: 500 }
      );
    }

    return NextResponse.json({ url, anonKey });
  } catch (error) {
    console.error('Failed to get Supabase config:', error);
    return NextResponse.json(
      { error: 'Failed to get Supabase config' },
      { status: 500 }
    );
  }
}
