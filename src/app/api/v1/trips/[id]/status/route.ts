import { NextResponse } from 'next/server.js';
import {
  verifyApiAuth,
  createApiErrorResponse,
  createApiSuccessResponse,
} from '../../../../../../lib/supabase/api-guard.ts';
import { validateTripTransition } from '../../../../../../lib/dispatch-engine.ts';
import { DEMO_TRIPS } from '../../../../../../lib/mock-tms-data.ts';
import { getSupabaseServerClient } from '../../../../../../lib/supabase/server.ts';
import type { TripStatus } from "../../../../../../types/tms.ts";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyApiAuth(req, {
    allowedRoles: ['superadmin', 'owner', 'manager', 'driver'],
  });
  if (!auth.success) return auth.response;

  try {
    const { id } = await params;
    const body = await req.json();
    const { targetStatus, odometerKm, location, reason } = body;

    const trip = DEMO_TRIPS.find((t) => t.id === id);
    if (!trip) {
      return createApiErrorResponse('Trip not found.', 404);
    }

    // SERVER-SIDE STATE MACHINE TRANSITION VALIDATION
    const check = validateTripTransition(trip.status, targetStatus as TripStatus, {
      hasVerifiedPOD: trip.podRecord?.status === 'verified',
      hasAssignedLRs: trip.assignedLRs.length > 0,
      cancellationReason: reason,
    });

    if (!check.allowed) {
      return createApiErrorResponse(
        check.errors[0]?.message || 'Invalid state transition.',
        422,
        check.errors[0]?.code || 'INVALID_TRANSITION'
      );
    }

    const updatedTrip = {
      ...trip,
      status: targetStatus,
      endOdometerKm: targetStatus === 'delivered' ? odometerKm || trip.endOdometerKm : trip.endOdometerKm,
      updated_at: new Date().toISOString(),
    };

    const supabase = await getSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('trips')
        .update({
          status: targetStatus,
          end_odometer_km: updatedTrip.endOdometerKm,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('organization_id', auth.session.organizationId)
        .select()
        .single();

      if (error) {
        return createApiErrorResponse(`Database status update failed: ${error.message}`, 500, 'DATABASE_UPDATE_ERROR');
      }

      // Record audit timeline event
      await supabase.from('trip_timeline_events').insert([{
        id: `evt-${Date.now()}`,
        trip_id: id,
        event_type: targetStatus,
        location: location || 'Highway Checkpoint',
        remarks: reason || `Status updated to ${targetStatus} by ${auth.session.fullName}`,
        created_at: new Date().toISOString(),
      }]);

      return createApiSuccessResponse({
        trip: data,
        transition: `${trip.status} -> ${targetStatus}`,
        timestamp: new Date().toISOString(),
      });
    }

    return createApiSuccessResponse({
      trip: updatedTrip,
      transition: `${trip.status} -> ${targetStatus}`,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return createApiErrorResponse(err.message || 'Error updating trip status', 500);
  }
}
