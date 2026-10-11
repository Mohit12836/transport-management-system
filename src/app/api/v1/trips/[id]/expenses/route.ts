import { NextResponse } from 'next/server.js';
import {
  verifyApiAuth,
  createApiErrorResponse,
  createApiSuccessResponse,
  shouldFallbackToDemoData,
} from '../../../../../../lib/supabase/api-guard.ts';
import { detectDuplicateExpense } from '../../../../../../lib/financial-engine.ts';
import { DEMO_TRIP_EXPENSES } from '../../../../../../lib/mock-tms-data.ts';
import { getSupabaseServerClient } from '../../../../../../lib/supabase/server.ts';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyApiAuth(req, {
    allowedRoles: ['superadmin', 'owner', 'manager', 'accountant', 'driver'],
  });
  if (!auth.success) return auth.response;

  const { id } = await params;
  const supabase = await getSupabaseServerClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('trip_expenses')
      .select('*')
      .eq('trip_id', id)
      .eq('organization_id', auth.session.organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      return createApiErrorResponse(error.message, 500, 'DATABASE_QUERY_ERROR');
    }
    return createApiSuccessResponse(data || [], { count: data?.length || 0 });
  }

  if (shouldFallbackToDemoData(auth.session.authMode)) {
    const tripExpenses = DEMO_TRIP_EXPENSES.filter((e) => e.tripId === id);
    return createApiSuccessResponse(tripExpenses, { count: tripExpenses.length });
  }

  return createApiErrorResponse(
    'Database connection is unavailable and demo mode is disabled in production.',
    503,
    'DATABASE_UNAVAILABLE'
  );
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyApiAuth(req, {
    allowedRoles: ['superadmin', 'owner', 'manager', 'accountant', 'driver'],
  });
  if (!auth.success) return auth.response;

  try {
    const { id } = await params;
    const body = await req.json();

    if (!body.amount || Number(body.amount) <= 0 || !body.expenseCategory) {
      return createApiErrorResponse('Valid amount and expense category are required.', 400);
    }

    // SERVER-SIDE DUPLICATE RECEIPT DETECTION
    const dupCheck = detectDuplicateExpense(
      {
        tripId: id,
        amount: Number(body.amount),
        expenseCategory: body.expenseCategory,
        slipNumber: body.slipNumber,
      },
      DEMO_TRIP_EXPENSES
    );

    if (dupCheck.isDuplicate) {
      return createApiErrorResponse(
        `Duplicate Expense Rejected: ${dupCheck.reason}`,
        409,
        'DUPLICATE_EXPENSE_CLAIM'
      );
    }

    const newExpense = {
      id: `exp-${Date.now()}`,
      organization_id: auth.session.organizationId,
      trip_id: id,
      driver_id: auth.session.userId,
      expense_category: body.expenseCategory,
      amount: Number(body.amount),
      paid_by: body.paidBy || 'Driver_Advance',
      slip_number: body.slipNumber,
      vendor_name: body.vendorName,
      receipt_image_url: body.receiptImageUrl || 'https://example.com/receipt.jpg',
      approval_status: 'pending',
      created_at: new Date().toISOString(),
    };

    const supabase = await getSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('trip_expenses')
        .insert([newExpense])
        .select()
        .single();

      if (error) {
        return createApiErrorResponse(`Database insert failed: ${error.message}`, 500, 'DATABASE_WRITE_ERROR');
      }
      return createApiSuccessResponse(data, undefined, 201);
    }

    if (shouldFallbackToDemoData(auth.session.authMode)) {
      return createApiSuccessResponse(newExpense, undefined, 201);
    }

    return createApiErrorResponse(
      'Cannot submit expense: Database connection is unavailable in production.',
      503,
      'DATABASE_UNAVAILABLE'
    );
  } catch (err: any) {
    return createApiErrorResponse(err.message || 'Error submitting expense', 500);
  }
}
