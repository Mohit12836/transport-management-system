import { NextResponse } from 'next/server.js';
import {
  verifyApiAuth,
  createApiErrorResponse,
  createApiSuccessResponse,
  shouldFallbackToDemoData,
} from '../../../../../lib/supabase/api-guard.ts';
import { validateLRConsignment } from '../../../../../lib/validators.ts';
import { DEMO_LRS } from '../../../../../lib/mock-tms-data.ts';
import { getSupabaseServerClient } from '../../../../../lib/supabase/server.ts';

export async function GET(req: Request) {
  const auth = await verifyApiAuth(req, {
    allowedRoles: ['superadmin', 'owner', 'manager', 'accountant'],
  });
  if (!auth.success) return auth.response;

  const supabase = await getSupabaseServerClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('lr_consignment_notes')
      .select('*')
      .eq('organization_id', auth.session.organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      return createApiErrorResponse(error.message, 500, 'DATABASE_QUERY_ERROR');
    }
    return createApiSuccessResponse(data || [], { count: data?.length || 0 });
  }

  // Memory fallback strictly for local demo/test mode
  if (shouldFallbackToDemoData(auth.session.authMode)) {
    return createApiSuccessResponse(DEMO_LRS, { count: DEMO_LRS.length });
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

    // STRICT SERVER-SIDE VALIDATION
    const validation = validateLRConsignment(body);
    if (!validation.isValid) {
      const errorMsg = Object.values(validation.errors)[0] || 'Invalid LR consignment details.';
      return createApiErrorResponse(
        errorMsg,
        422,
        'VALIDATION_FAILED'
      );
    }

    const lrNumber = body.lrNumber || `LR-JPR-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const newLR = {
      id: `lr-${Date.now()}`,
      organization_id: auth.session.organizationId,
      branch_id: auth.session.branchId || 'br-jaipur',
      lr_number: lrNumber,
      lr_date: body.lrDate || new Date().toISOString().split('T')[0],
      consignor_name: body.consignorName,
      consignor_address: body.consignorAddress,
      consignor_gstin: body.consignorGstin,
      consignee_name: body.consigneeName,
      consignee_address: body.consigneeAddress,
      consignee_gstin: body.consigneeGstin,
      origin_city: body.originCity,
      destination_city: body.destinationCity,
      goods_description: body.goodsDescription,
      packages_count: Number(body.packagesCount),
      package_type: body.packageType || 'Box',
      actual_weight_ton: Number(body.actualWeightTon),
      charged_weight_ton: Number(body.chargedWeightTon),
      freight_rate_per_ton: Number(body.freightRatePerTon),
      total_freight_amount: Number(body.totalFreightAmount),
      loading_charges: Number(body.loadingCharges || 0),
      unloading_charges: Number(body.unloadingCharges || 0),
      insurance_charges: Number(body.insuranceCharges || 0),
      net_total_amount: Number(body.netTotalAmount),
      payment_type: body.paymentType || 'tbb',
      status: 'generated',
      created_at: new Date().toISOString(),
    };

    const supabase = await getSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('lr_consignment_notes')
        .insert([newLR])
        .select()
        .single();

      if (error) {
        return createApiErrorResponse(`Database insert failed: ${error.message}`, 500, 'DATABASE_WRITE_ERROR');
      }
      return createApiSuccessResponse(data, undefined, 201);
    }

    if (shouldFallbackToDemoData(auth.session.authMode)) {
      return createApiSuccessResponse(newLR, undefined, 201);
    }

    return createApiErrorResponse(
      'Cannot create LR: Database connection is unavailable in production.',
      503,
      'DATABASE_UNAVAILABLE'
    );
  } catch (err: any) {
    return createApiErrorResponse(err.message || 'Error creating LR', 500);
  }
}
