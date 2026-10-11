// Production API Security Guard & Tenant Context Resolver
// Enforces default-deny access, JWT / session verification, role-based RBAC,
// and multi-tenant organization confinement for all protected API route handlers.

import { NextResponse } from 'next/server.js';
import type { UserRole } from '../../types/tms.ts';
import { getSupabaseServerClient } from './server.ts';
import { getSupabaseAdminClient } from './admin.ts';

export interface AuthSessionContext {
  userId: string;
  organizationId: string;
  branchId?: string;
  role: UserRole;
  fullName: string;
  email: string;
  authMode: 'supabase' | 'mock_authenticated';
}

export interface VerifyAuthOptions {
  allowedRoles?: UserRole[];
  requireOrgMatch?: string; // Verify that request matches user's organization
}

export type AuthResult =
  | { success: true; session: AuthSessionContext }
  | { success: false; response: NextResponse };

/**
 * Standard API error response generator
 */
export function createApiErrorResponse(message: string, statusCode: number = 400, code?: string) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: code || `HTTP_${statusCode}`,
        message,
      },
      timestamp: new Date().toISOString(),
    },
    { status: statusCode }
  );
}

/**
 * Standard API success response generator
 */
export function createApiSuccessResponse<T>(data: T, meta?: Record<string, any>, statusCode: number = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
      meta,
      timestamp: new Date().toISOString(),
    },
    { status: statusCode }
  );
}

/**
 * Verifies API authentication and permissions on the server
 */
export async function verifyApiAuth(
  req: Request,
  options?: VerifyAuthOptions
): Promise<AuthResult> {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

  // 1. Check for real Supabase authentication first if configured
  const supabase = await getSupabaseServerClient();
  if (supabase) {
    try {
      let authUser = null;
      if (token) {
        const { data, error } = await supabase.auth.getUser(token);
        if (!error && data.user) {
          authUser = data.user;
        }
      } else {
        const { data, error } = await supabase.auth.getUser();
        if (!error && data.user) {
          authUser = data.user;
        }
      }

      if (authUser) {
        // Query database profile to obtain organization and verified role
        const adminClient = getSupabaseAdminClient() || supabase;
        const { data: profile, error: profileErr } = await adminClient
          .from('users')
          .select('id, organization_id, branch_id, role, full_name, email, is_active')
          .eq('id', authUser.id)
          .single();

        if (profile && !profileErr && profile.is_active) {
          const role = profile.role as UserRole;

          // Check role permissions
          if (options?.allowedRoles && !options.allowedRoles.includes(role)) {
            return {
              success: false,
              response: createApiErrorResponse(
                `Access Denied: Role '${role}' lacks required permissions for this operation.`,
                403,
                'FORBIDDEN_ROLE'
              ),
            };
          }

          // Check tenant match
          if (options?.requireOrgMatch && options.requireOrgMatch !== profile.organization_id) {
            return {
              success: false,
              response: createApiErrorResponse(
                'Cross-Tenant Access Violation: Cannot access records belonging to another organization.',
                403,
                'TENANT_ISOLATION_VIOLATION'
              ),
            };
          }

          return {
            success: true,
            session: {
              userId: profile.id,
              organizationId: profile.organization_id,
              branchId: profile.branch_id,
              role,
              fullName: profile.full_name,
              email: profile.email,
              authMode: 'supabase',
            },
          };
        }
      }
    } catch {
      // Fall through to simulated/development credentials check
    }
  }

  // 2. Reject any client-supplied mock identity headers (Security Hardening)
  // Client headers like x-mock-role or x-mock-org-id MUST NEVER grant authorization.
  const clientMockRoleHeader = req.headers.get('x-mock-role');
  const clientMockOrgHeader = req.headers.get('x-mock-org-id');
  if (clientMockRoleHeader || clientMockOrgHeader) {
    // In production, immediately reject client mock spoofing attempts
    if (process.env.NODE_ENV === 'production') {
      return {
        success: false,
        response: createApiErrorResponse(
          'Security Violation: Client mock identity headers are strictly prohibited in production.',
          403,
          'SPOOFING_ATTEMPT_BLOCKED'
        ),
      };
    }
  }

  // 3. Isolated Development / Test Harness Token Resolver
  // STRICT RULE: This block is ONLY accessible in development/test environments.
  // In production, the system fails closed immediately.
  const isDevOrTest = process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
  const isTestHarnessEnabled = process.env.ENABLE_TEST_AUTH_HARNESS === 'true' || isDevOrTest;

  if (isTestHarnessEnabled && process.env.NODE_ENV !== 'production') {
    // Strict simulated test tokens with hardcoded non-client identities
    const validTestTokens: Record<string, { role: UserRole; orgId: string; userId: string; name: string; email: string }> = {
      'demo-superadmin-token': { role: 'superadmin', orgId: 'org-demo-001', userId: 'usr-superadmin', name: 'Super Admin', email: 'superadmin@tms.com' },
      'demo-owner-token': { role: 'owner', orgId: 'org-demo-001', userId: 'usr-owner', name: 'Fleet Owner', email: 'owner@tms.com' },
      'demo-manager-token': { role: 'manager', orgId: 'org-demo-001', userId: 'usr-manager', name: 'Arun Sharma (Manager)', email: 'manager@tms.com' },
      'demo-accountant-token': { role: 'accountant', orgId: 'org-demo-001', userId: 'usr-accountant', name: 'Suresh Verma (Accountant)', email: 'accountant@tms.com' },
      'demo-driver-token': { role: 'driver', orgId: 'org-demo-001', userId: 'usr-driver-01', name: 'Mukesh Yadav (Driver)', email: 'driver@tms.com' },
      'demo-vendor-token': { role: 'vendor', orgId: 'org-demo-001', userId: 'usr-vendor-01', name: 'Gujarat Roadlines (Broker)', email: 'vendor@tms.com' },
    };

    let testIdentity = token ? validTestTokens[token] : null;

    // In unit test runner only: if explicit test runner secret header is present AND test env is set
    const testSecret = req.headers.get('x-test-harness-secret');
    if (!testIdentity && testSecret === 'tms-isolated-test-runner-2026') {
      const testRole = req.headers.get('x-test-role') as UserRole | null;
      const testOrg = req.headers.get('x-test-org-id') || 'org-demo-001';
      const testUserId = req.headers.get('x-test-user-id') || 'test-user-001';

      if (testRole) {
        testIdentity = {
          role: testRole,
          orgId: testOrg,
          userId: testUserId,
          name: `Test ${testRole.toUpperCase()}`,
          email: `test-${testRole}@tms.local`,
        };
      }
    }

    if (testIdentity) {
      if (options?.allowedRoles && !options.allowedRoles.includes(testIdentity.role)) {
        return {
          success: false,
          response: createApiErrorResponse(
            `Access Denied: Role '${testIdentity.role}' lacks required permissions for this operation.`,
            403,
            'FORBIDDEN_ROLE'
          ),
        };
      }

      if (options?.requireOrgMatch && options.requireOrgMatch !== testIdentity.orgId) {
        return {
          success: false,
          response: createApiErrorResponse(
            'Cross-Tenant Access Violation: Cannot access records belonging to another organization.',
            403,
            'TENANT_ISOLATION_VIOLATION'
          ),
        };
      }

      return {
        success: true,
        session: {
          userId: testIdentity.userId,
          organizationId: testIdentity.orgId,
          branchId: 'br-jaipur',
          role: testIdentity.role,
          fullName: testIdentity.name,
          email: testIdentity.email,
          authMode: 'mock_authenticated',
        },
      };
    }
  }

  // 4. Default Deny: In production or without valid session/token, reject immediately
  return {
    success: false,
    response: createApiErrorResponse(
      'Authentication Required: Missing, expired, or invalid authorization session.',
      401,
      'UNAUTHORIZED'
    ),
  };
}

/**
 * Helper to determine if an endpoint should fall back to demo fixtures.
 * STRICT RULE: Only allowed if NOT in production AND Supabase is unconfigured.
 */
export function shouldFallbackToDemoData(sessionAuthMode?: string): boolean {
  if (process.env.NODE_ENV === 'production') {
    return false;
  }
  const hasSupabase = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  if (hasSupabase) {
    return false;
  }
  return sessionAuthMode === 'mock_authenticated';
}

