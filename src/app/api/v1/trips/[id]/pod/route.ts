import { NextResponse } from 'next/server.js';
import {
  verifyApiAuth,
  createApiErrorResponse,
  createApiSuccessResponse,
  shouldFallbackToDemoData,
} from '../../../../../../lib/supabase/api-guard.ts';
import { validatePODSubmissionInput, validatePODDecision } from '../../../../../../lib/dispatch-engine.ts';
import { DEMO_PODS } from '../../../../../../lib/mock-tms-data.ts';
import { getSupabaseServerClient } from '../../../../../../lib/supabase/server.ts';

export async function POST(
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

    // SERVER-SIDE POD SUBMISSION VALIDATION
    const validation = validatePODSubmissionInput({
      receiverName: body.receiverName,
      deliveredAt: body.deliveredAt || new Date().toISOString(),
      podImageUrl: body.podImageUrl || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c',
      shortageQuantity: body.shortageQuantity,
    });

    if (!validation.isValid) {
      return createApiErrorResponse(
        Object.values(validation.errors)[0] || 'Invalid POD data.',
        422,
        'VALIDATION_FAILED'
      );
    }

    const newPOD = {
      id: `pod-${Date.now()}`,
      lr_id: body.lrId || 'lr-101',
      trip_id: id,
      delivered_at: body.deliveredAt || new Date().toISOString(),
      pod_image_url: body.podImageUrl,
      received_by_name: body.receiverName,
      received_by_phone: body.receiverPhone,
      shortage_quantity: Number(body.shortageQuantity || 0),
      damage_remarks: body.damageRemarks,
      status: 'pending_verification',
      created_at: new Date().toISOString(),
    };

    const supabase = await getSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('proofs_of_delivery')
        .insert([newPOD])
        .select()
        .single();

      if (error) {
        return createApiErrorResponse(`Database insert failed: ${error.message}`, 500, 'DATABASE_WRITE_ERROR');
      }
      return createApiSuccessResponse(data, undefined, 201);
    }

    if (shouldFallbackToDemoData(auth.session.authMode)) {
      return createApiSuccessResponse(newPOD, undefined, 201);
    }

    return createApiErrorResponse(
      'Cannot submit POD: Database connection is unavailable in production.',
      503,
      'DATABASE_UNAVAILABLE'
    );
  } catch (err: any) {
    return createApiErrorResponse(err.message || 'Error submitting POD', 500);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyApiAuth(req, {
    allowedRoles: ['superadmin', 'owner', 'manager', 'accountant'],
  });
  if (!auth.success) return auth.response;

  try {
    const { id } = await params;
    const body = await req.json();
    const { decision, rejectionReason, podId } = body;

    const check = validatePODDecision(decision, rejectionReason);
    if (!check.isValid) {
      return createApiErrorResponse(check.error || 'Invalid decision', 422, 'AUDIT_DECISION_INVALID');
    }

    const targetStatus = decision === 'verify' ? 'verified' : 'rejected';

    const supabase = await getSupabaseServerClient();
    if (supabase && podId) {
      const { data, error } = await supabase
        .from('proofs_of_delivery')
        .update({
          status: targetStatus,
          verified_by: auth.session.userId,
          verified_at: new Date().toISOString(),
          rejection_reason: decision === 'reject' ? rejectionReason : null,
        })
        .eq('id', podId)
        .select()
        .single();

      if (error) {
        return createApiErrorResponse(`Database update failed: ${error.message}`, 500, 'DATABASE_UPDATE_ERROR');
      }
      return createApiSuccessResponse({
        decision,
        pod: data,
        status: targetStatus,
        verifiedBy: auth.session.fullName,
        verifiedAt: new Date().toISOString(),
      });
    }

    return createApiSuccessResponse({
      decision,
      status: targetStatus,
      verifiedBy: auth.session.fullName,
      verifiedAt: new Date().toISOString(),
      rejectionReason: decision === 'reject' ? rejectionReason : undefined,
    });
  } catch (err: any) {
    return createApiErrorResponse(err.message || 'Error updating POD status', 500);
  }
}
