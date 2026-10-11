import { NextResponse } from 'next/server.js';
import {
  verifyApiAuth,
  createApiErrorResponse,
  createApiSuccessResponse,
  shouldFallbackToDemoData,
} from '../../../../../lib/supabase/api-guard.ts';
import { validateDriverInput, calculateComplianceStatus } from '../../../../../lib/dispatch-engine.ts';
import { DEMO_DRIVERS } from '../../../../../lib/mock-tms-data.ts';
import { getSupabaseServerClient } from '../../../../../lib/supabase/server.ts';

export async function GET(req: Request) {
  const auth = await verifyApiAuth(req, {
    allowedRoles: ['superadmin', 'owner', 'manager', 'accountant'],
  });
  if (!auth.success) return auth.response;

  const supabase = await getSupabaseServerClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('organization_id', auth.session.organizationId);

    if (error) {
      return createApiErrorResponse(error.message, 500, 'DATABASE_QUERY_ERROR');
    }
    return createApiSuccessResponse(data || [], { count: data?.length || 0 });
  }

  if (shouldFallbackToDemoData(auth.session.authMode)) {
    return createApiSuccessResponse(DEMO_DRIVERS, { count: DEMO_DRIVERS.length });
  }

  return createApiErrorResponse(
    'Database connection is unavailable and demo mode is disabled in production.',
    503,
    'DATABASE_UNAVAILABLE'
  );
}

export async function POST(req: Request) {
  const auth = await verifyApiAuth(req, {
    allowedRoles: ['superadmin', 'owner', 'manager'],
  });
  if (!auth.success) return auth.response;

  try {
    const body = await req.json();

    // SERVER-SIDE VALIDATION
    const validation = validateDriverInput(body, DEMO_DRIVERS);
    if (!validation.isValid) {
      return createApiErrorResponse(
        Object.values(validation.errors)[0] || 'Invalid driver details.',
        422,
        'VALIDATION_FAILED'
      );
    }

    const comp = calculateComplianceStatus(body.licenseExpiryDate);

    // Mask Aadhaar identity (KYC Privacy Protection)
    let maskedAadhaar = undefined;
    if (body.aadhaarNumber && body.aadhaarNumber.length >= 4) {
      const lastFour = body.aadhaarNumber.slice(-4);
      maskedAadhaar = `XXXX-XXXX-${lastFour}`;
    }

    const newDriver = {
      id: `drv-${Date.now()}`,
      organization_id: auth.session.organizationId,
      full_name: body.fullName.trim(),
      phone: body.phone.trim(),
      alternate_phone: body.alternatePhone,
      license_number: body.licenseNumber.trim().toUpperCase(),
      license_category: body.licenseCategory || 'HGMV',
      license_expiry_date: body.licenseExpiryDate,
      license_days_remaining: comp.daysRemaining,
      license_status: comp.status,
      aadhaar_masked: maskedAadhaar || 'XXXX-XXXX-8921',
      current_advance_balance: 0,
      monthly_salary: Number(body.monthlySalary || 22000),
      is_active: true,
      created_at: new Date().toISOString(),
    };

    const supabase = await getSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase.from('drivers').insert([newDriver]).select().single();
      if (error) {
        return createApiErrorResponse(`Database insert failed: ${error.message}`, 500, 'DATABASE_WRITE_ERROR');
      }
      return createApiSuccessResponse(data, undefined, 201);
    }

    if (shouldFallbackToDemoData(auth.session.authMode)) {
      return createApiSuccessResponse(newDriver, undefined, 201);
    }

    return createApiErrorResponse(
      'Cannot register driver: Database connection is unavailable in production.',
      503,
      'DATABASE_UNAVAILABLE'
    );
  } catch (err: any) {
    return createApiErrorResponse(err.message || 'Error registering driver', 500);
  }
}
