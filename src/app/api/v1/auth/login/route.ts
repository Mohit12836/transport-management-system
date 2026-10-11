import { NextResponse } from 'next/server.js';
import { createApiErrorResponse, createApiSuccessResponse } from '../../../../../lib/supabase/api-guard.ts';
import { getSupabaseServerClient } from '../../../../../lib/supabase/server.ts';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return createApiErrorResponse('Email and password are required.', 400, 'MISSING_CREDENTIALS');
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Try real Supabase auth if configured
    const supabase = await getSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (!error && data.session) {
        return createApiSuccessResponse({
          token: data.session.access_token,
          user: data.user,
          authMode: 'supabase',
        });
      }
    }

    // 2. Verified Demo Persona Authentication Fallback
    const demoAccounts: Record<string, { role: string; token: string; name: string }> = {
      'superadmin@tms.com': { role: 'superadmin', token: 'demo-superadmin-token', name: 'Super Admin' },
      'owner@tms.com': { role: 'owner', token: 'demo-owner-token', name: 'Fleet Owner' },
      'manager@tms.com': { role: 'manager', token: 'demo-manager-token', name: 'Arun Sharma (Manager)' },
      'accountant@tms.com': { role: 'accountant', token: 'demo-accountant-token', name: 'Suresh Verma (Accountant)' },
      'driver@tms.com': { role: 'driver', token: 'demo-driver-token', name: 'Mukesh Yadav (Driver)' },
      'vendor@tms.com': { role: 'vendor', token: 'demo-vendor-token', name: 'Gujarat Roadlines Broker' },
    };

    const matchedAccount = demoAccounts[cleanEmail];
    if (matchedAccount && password === 'password') {
      return createApiSuccessResponse({
        token: matchedAccount.token,
        user: {
          email: cleanEmail,
          fullName: matchedAccount.name,
          role: matchedAccount.role,
          organizationId: 'org-demo-001',
        },
        authMode: 'mock_authenticated',
      });
    }

    return createApiErrorResponse('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
  } catch (err: any) {
    return createApiErrorResponse(err.message || 'Authentication error', 500);
  }
}
