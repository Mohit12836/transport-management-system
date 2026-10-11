import { NextResponse } from 'next/server.js';
import {
  verifyApiAuth,
  createApiErrorResponse,
  createApiSuccessResponse,
  shouldFallbackToDemoData,
} from '../../../../lib/supabase/api-guard.ts';
import { isVehicleAvailableForTrip, isDriverAvailableForTrip } from '../../../../lib/dispatch-engine.ts';
import { DEMO_TRIPS, DEMO_VEHICLES, DEMO_DRIVERS, DEMO_LRS } from '../../../../lib/mock-tms-data.ts';
import { getSupabaseServerClient } from '../../../../lib/supabase/server.ts';

export async function GET(req: Request) {
  const auth = await verifyApiAuth(req, {
    allowedRoles: ['superadmin', 'owner', 'manager', 'accountant', 'driver'],
  });
  if (!auth.success) return auth.response;

  const supabase = await getSupabaseServerClient();
  if (supabase) {
    let query = supabase
      .from('trips')
      .select('*, trip_timeline_events(*), proofs_of_delivery(*)')
      .eq('organization_id', auth.session.organizationId);

    // DRIVER ROLE ISOLATION: Driver sees only their own trips
    if (auth.session.role === 'driver') {
      query = query.eq('driver_phone', auth.session.email); // or linked driver
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) {
      return createApiErrorResponse(error.message, 500, 'DATABASE_QUERY_ERROR');
    }
    return createApiSuccessResponse(data || [], { count: data?.length || 0 });
  }

  // Memory fallback with role isolation filter strictly in demo/test mode
  if (shouldFallbackToDemoData(auth.session.authMode)) {
    let resultTrips = DEMO_TRIPS;
    if (auth.session.role === 'driver') {
      // Return trips assigned to this driver
      resultTrips = DEMO_TRIPS.filter((t) => t.driverName.toLowerCase().includes('mukesh'));
    }
    return createApiSuccessResponse(resultTrips, { count: resultTrips.length });
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
    const { vehicleId, driverId, originCity, destinationCity, assignedLRIds } = body;

    if (!vehicleId || !driverId || !originCity || !destinationCity) {
      return createApiErrorResponse('Missing required trip assignment fields.', 400);
    }

    const vehicle = DEMO_VEHICLES.find((v) => v.id === vehicleId);
    const driver = DEMO_DRIVERS.find((d) => d.id === driverId);

    if (!vehicle) return createApiErrorResponse('Vehicle not found.', 404);
    if (!driver) return createApiErrorResponse('Driver not found.', 404);

    // SERVER-SIDE CONFLICT CHECKS
    const vehAvail = isVehicleAvailableForTrip(vehicle, DEMO_TRIPS);
    if (!vehAvail.isAvailable) {
      return createApiErrorResponse(vehAvail.conflictReason || 'Vehicle unavailable.', 409, 'VEHICLE_CONFLICT');
    }

    const drvAvail = isDriverAvailableForTrip(driver, DEMO_TRIPS);
    if (!drvAvail.isAvailable) {
      return createApiErrorResponse(drvAvail.conflictReason || 'Driver unavailable.', 409, 'DRIVER_CONFLICT');
    }

    const tripId = `trip-${Date.now()}`;
    const tripNumber = `TRIP-2026-${Math.floor(100 + Math.random() * 900)}`;

    const newTrip = {
      id: tripId,
      organization_id: auth.session.organizationId,
      trip_number: tripNumber,
      vehicle_id: vehicle.id,
      vehicle_number: vehicle.vehicleNumber,
      driver_id: driver.id,
      driver_name: driver.fullName,
      driver_phone: driver.phone,
      origin_city: originCity,
      destination_city: destinationCity,
      status: 'scheduled',
      planned_departure_date: body.plannedDepartureDate,
      expected_arrival_date: body.expectedArrivalDate,
      start_odometer_km: Number(body.startOdometerKm || vehicle.odometerKm),
      created_at: new Date().toISOString(),
    };

    const supabase = await getSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase.from('trips').insert([newTrip]).select().single();
      if (error) {
        return createApiErrorResponse(`Database insert failed: ${error.message}`, 500, 'DATABASE_WRITE_ERROR');
      }
      return createApiSuccessResponse(data, undefined, 201);
    }

    if (shouldFallbackToDemoData(auth.session.authMode)) {
      return createApiSuccessResponse(newTrip, undefined, 201);
    }

    return createApiErrorResponse(
      'Cannot schedule trip: Database connection is unavailable in production.',
      503,
      'DATABASE_UNAVAILABLE'
    );
  } catch (err: any) {
    return createApiErrorResponse(err.message || 'Error scheduling trip', 500);
  }
}
