import { NextResponse } from 'next/server.js';
import { createApiSuccessResponse } from '../../../../../lib/supabase/api-guard.ts';
import { getSupabaseServerClient } from '../../../../../lib/supabase/server.ts';

export async function POST(req: Request) {
  const supabase = await getSupabaseServerClient();
  if (supabase) {
    await supabase.auth.signOut();
  }

  return createApiSuccessResponse({ message: 'Session logged out successfully.' });
}
