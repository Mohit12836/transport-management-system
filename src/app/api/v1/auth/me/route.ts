import { NextResponse } from 'next/server.js';
import { verifyApiAuth, createApiSuccessResponse } from '../../../../../lib/supabase/api-guard.ts';

export async function GET(req: Request) {
  const auth = await verifyApiAuth(req);
  if (!auth.success) {
    return auth.response;
  }

  return createApiSuccessResponse(
    {
      user: {
        id: auth.session.userId,
        fullName: auth.session.fullName,
        email: auth.session.email,
        role: auth.session.role,
        organizationId: auth.session.organizationId,
        branchId: auth.session.branchId,
      },
      authMode: auth.session.authMode,
    },
    undefined,
    200
  );
}
