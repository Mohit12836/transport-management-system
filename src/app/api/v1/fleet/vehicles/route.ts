import { NextResponse } from 'next/server.js';
import {
  verifyApiAuth,
  createApiErrorResponse,
  createApiSuccessResponse,
  shouldFallbackToDemoData,
} from '../../../../../lib/supabase/api-guard.ts';
import { validateVehicleInput } from '../../../../../lib/dispatch-engine.ts';
import { DEMO_VEHICLES } from '../../../../../lib/mock-tms-data.ts';
import { getSupabaseServerClient } from '../../../../../lib/supabase/server.ts';

export async function GET(req: Request) {
  const auth = await verifyApiAuth(req, {
    allowedRoles: ['superadmin', 'owner', 'manager', 'accountant'],
  });
  if (!auth.success) return auth.response;

  const supabase = await getSupabaseServerClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*, vehicle_compliance(*)')
      .eq('organization_id', auth.session.organizationId);

    if (error) {
      return createApiErrorResponse(error.message, 500, 'DATABASE_QUERY_ERROR');
    }
    return createApiSuccessResponse(data || [], { count: data?.length || 0 });
  }

  if (shouldFallbackToDemoData(auth.session.authMode)) {
    return createApiSuccessResponse(DEMO_VEHICLES, { count: DEMO_VEHICLES.length });
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
    const validation = validateVehicleInput(body, DEMO_VEHICLES);
    if (!validation.isValid) {
      return createApiErrorResponse(
        Object.values(validation.errors)[0] || 'Invalid vehicle details.',
        422,
        'VALIDATION_FAILED'
      );
    }

    const newVehicle = {
      id: `veh-${Date.now()}`,
      organization_id: auth.session.organizationId,
      branch_id: auth.session.branchId,
      vehicle_number: body.vehicleNumber.trim().toUpperCase(),
      vehicle_type: body.vehicleType,
      ownership_type: body.ownershipType || 'owned',
      carrying_capacity_ton: Number(body.carryingCapacityTon),
      status: 'available',
      odometer_km: Number(body.odometerKm || 0),
      created_at: new Date().toISOString(),
    };

    const supabase = await getSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase.from('vehicles').insert([newVehicle]).select().single();
      if (error) {
        return createApiErrorResponse(`Database insert failed: ${error.message}`, 500, 'DATABASE_WRITE_ERROR');
      }
      return createApiSuccessResponse(data, undefined, 201);
    }

    if (shouldFallbackToDemoData(auth.session.authMode)) {
      return createApiSuccessResponse(newVehicle, undefined, 201);
    }

    return createApiErrorResponse(
      'Cannot register vehicle: Database connection is unavailable in production.',
      503,
      'DATABASE_UNAVAILABLE'
    );
  } catch (err: any) {
    return createApiErrorResponse(err.message || 'Error registering vehicle', 500);
  }
}
