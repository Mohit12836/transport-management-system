import { NextResponse } from 'next/server.js';
import {
  verifyApiAuth,
  createApiErrorResponse,
  createApiSuccessResponse,
  shouldFallbackToDemoData,
} from '../../../../../lib/supabase/api-guard.ts';
import { calculateTds194C } from '../../../../../lib/tax-rules.ts';
import { DEMO_VENDOR_SETTLEMENTS } from '../../../../../lib/mock-tms-data.ts';
import { getSupabaseServerClient } from '../../../../../lib/supabase/server.ts';

export async function GET(req: Request) {
  const auth = await verifyApiAuth(req, {
    allowedRoles: ['superadmin', 'owner', 'accountant', 'vendor'],
  });
  if (!auth.success) return auth.response;

  const supabase = await getSupabaseServerClient();
  if (supabase) {
    let query = supabase
      .from('vendor_settlements')
      .select('*')
      .eq('organization_id', auth.session.organizationId);

    if (auth.session.role === 'vendor') {
      query = query.eq('vendor_id', auth.session.userId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) {
      return createApiErrorResponse(error.message, 500, 'DATABASE_QUERY_ERROR');
    }
    return createApiSuccessResponse(data || [], { count: data?.length || 0 });
  }

  if (shouldFallbackToDemoData(auth.session.authMode)) {
    let result = DEMO_VENDOR_SETTLEMENTS;
    if (auth.session.role === 'vendor') {
      result = DEMO_VENDOR_SETTLEMENTS.filter((v) =>
        v.vendorName.toLowerCase().includes('gujarat')
      );
    }
    return createApiSuccessResponse(result, { count: result.length });
  }

  return createApiErrorResponse(
    'Database connection is unavailable and demo mode is disabled in production.',
    503,
    'DATABASE_UNAVAILABLE'
  );
}

export async function POST(req: Request) {
  const auth = await verifyApiAuth(req, {
    allowedRoles: ['superadmin', 'owner', 'accountant'],
  });
  if (!auth.success) return auth.response;

  try {
    const body = await req.json();
    const {
      vendorId,
      vendorName,
      vendorType,
      tripId,
      grossFreight,
      advancePaid,
      tdsCategory,
      panNumber,
      has194C6Declaration,
      shortageDeductions,
      paymentRef,
    } = body;

    const grossNum = Number(grossFreight);
    if (!vendorName || isNaN(grossNum) || grossNum <= 0) {
      return createApiErrorResponse('Valid vendor name and gross freight amount are required.', 400);
    }

    // SERVER-SIDE SECTION 194C TDS CALCULATION
    const tdsResult = calculateTds194C(
      grossNum,
      tdsCategory || 'company',
      panNumber,
      Boolean(has194C6Declaration),
      Number(advancePaid || 0),
      Number(shortageDeductions || 0)
    );

    const voucherNumber = `VSET-2026-${Math.floor(100 + Math.random() * 900)}`;

    const newVoucher = {
      id: `vset-${Date.now()}`,
      organization_id: auth.session.organizationId,
      voucher_number: voucherNumber,
      vendor_id: vendorId || `ven-${Date.now()}`,
      vendor_name: vendorName,
      vendor_type: vendorType || 'Truck_Broker',
      trip_id: tripId,
      gross_freight: tdsResult.grossFreight,
      advance_paid: tdsResult.advancePaid,
      tds_section: tdsResult.tdsSection,
      tds_rate_percent: tdsResult.tdsRatePercent,
      tds_amount: tdsResult.tdsAmount,
      shortage_deductions: tdsResult.shortageDeductions,
      net_payable: tdsResult.netPayable,
      settlement_status: 'approved',
      pan_number: panNumber?.toUpperCase(),
      payment_ref: paymentRef,
      payment_date: new Date().toISOString().split('T')[0],
      remarks: tdsResult.notes,
      created_at: new Date().toISOString(),
    };

    const supabase = await getSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('vendor_settlements')
        .insert([newVoucher])
        .select()
        .single();

      if (error) {
        return createApiErrorResponse(`Database insert failed: ${error.message}`, 500, 'DATABASE_WRITE_ERROR');
      }
      return createApiSuccessResponse(data, undefined, 201);
    }

    if (shouldFallbackToDemoData(auth.session.authMode)) {
      return createApiSuccessResponse(newVoucher, undefined, 201);
    }

    return createApiErrorResponse(
      'Cannot create vendor bill: Database connection is unavailable in production.',
      503,
      'DATABASE_UNAVAILABLE'
    );
  } catch (err: any) {
    return createApiErrorResponse(err.message || 'Error creating vendor settlement', 500);
  }
}
