import {
  verifyApiAuth,
  createApiErrorResponse,
  createApiSuccessResponse,
  shouldFallbackToDemoData,
} from '../../../../../../lib/supabase/api-guard.ts';
import {
  calculateDriverTripSettlement,
  generateJournalEntryForDriverSettlement,
} from '../../../../../../lib/financial-engine.ts';
import { DEMO_DRIVER_ADVANCES, DEMO_TRIP_EXPENSES, DEMO_TRIPS } from '../../../../../../lib/mock-tms-data.ts';
import { getSupabaseServerClient } from '../../../../../../lib/supabase/server.ts';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyApiAuth(req, {
    allowedRoles: ['superadmin', 'owner', 'accountant'],
  });
  if (!auth.success) return auth.response;

  try {
    const { id } = await params;
    const body = await req.json();
    const { driverId, shortageDeductions, remarks } = body;

    const trip = DEMO_TRIPS.find((t) => t.id === id);
    if (!trip) return createApiErrorResponse('Trip not found.', 404);

    const targetDriverId = driverId || trip.driverId;

    // COMPUTE SERVER-SIDE SETTLEMENT RECONCILIATION
    const summary = calculateDriverTripSettlement(
      id,
      targetDriverId,
      DEMO_DRIVER_ADVANCES,
      DEMO_TRIP_EXPENSES,
      Number(shortageDeductions || 0)
    );

    const settlementNumber = `SETTLE-2026-${Math.floor(100 + Math.random() * 900)}`;

    const newSettlement = {
      id: `set-${Date.now()}`,
      organization_id: auth.session.organizationId,
      settlement_number: settlementNumber,
      driver_id: targetDriverId,
      driver_name: trip.driverName,
      trip_id: trip.id,
      trip_number: trip.tripNumber,
      settlement_date: new Date().toISOString().split('T')[0],
      total_advance_disbursed: summary.totalAdvancesDisbursed,
      total_approved_expenses: summary.totalApprovedExpenses,
      total_rejected_expenses: summary.totalRejectedExpenses,
      shortage_deductions: summary.shortageDeductions,
      net_payable_or_recoverable: summary.netAmount,
      settlement_status: 'settled',
      settled_by: auth.session.fullName,
      remarks: remarks || 'Reconciliation finalized via API.',
      created_at: new Date().toISOString(),
    };

    // GENERATE BALANCED GENERAL LEDGER JOURNAL ENTRY
    const journalEntry = generateJournalEntryForDriverSettlement(
      {
        ...newSettlement,
        organizationId: auth.session.organizationId,
        settlementNumber,
        driverId: targetDriverId,
        driverName: trip.driverName,
        tripId: trip.id,
        tripNumber: trip.tripNumber,
        settlementDate: newSettlement.settlement_date,
        totalAdvanceDisbursed: newSettlement.total_advance_disbursed,
        totalApprovedExpenses: newSettlement.total_approved_expenses,
        totalRejectedExpenses: newSettlement.total_rejected_expenses,
        shortageDeductions: newSettlement.shortage_deductions,
        netPayableOrRecoverable: newSettlement.net_payable_or_recoverable,
        settlementStatus: 'settled',
        settledBy: auth.session.fullName,
        createdAt: newSettlement.created_at,
      },
      summary.expenseCategoryBreakdown
    );

    const supabase = await getSupabaseServerClient();
    if (supabase) {
      // 1. Insert Driver Settlement
      const { data: settleData, error: settleErr } = await supabase
        .from('driver_settlements')
        .insert([newSettlement])
        .select()
        .single();

      if (settleErr) {
        return createApiErrorResponse(`Database settlement write failed: ${settleErr.message}`, 500, 'DATABASE_WRITE_ERROR');
      }

      // 2. Insert Balanced Journal Entry
      const { data: journalData, error: journalErr } = await supabase
        .from('journal_entries')
        .insert([{
          id: journalEntry.id,
          organization_id: auth.session.organizationId,
          journal_number: journalEntry.entryNumber,
          entry_date: journalEntry.entryDate,
          source_module: journalEntry.referenceType,
          source_document_id: newSettlement.id,
          source_document_number: settlementNumber,
          total_debit: journalEntry.totalDebit,
          total_credit: journalEntry.totalCredit,
          is_balanced: journalEntry.isBalanced,
          created_by: auth.session.fullName,
          remarks: journalEntry.description,
          created_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (journalErr) {
        return createApiErrorResponse(`Database journal write failed: ${journalErr.message}`, 500, 'DATABASE_WRITE_ERROR');
      }

      return createApiSuccessResponse(
        {
          settlement: settleData,
          journalEntry,
          summary,
        },
        undefined,
        201
      );
    }

    if (shouldFallbackToDemoData(auth.session.authMode)) {
      return createApiSuccessResponse(
        {
          settlement: newSettlement,
          journalEntry,
          summary,
        },
        undefined,
        201
      );
    }

    return createApiErrorResponse(
      'Cannot finalize settlement: Database connection is unavailable in production.',
      503,
      'DATABASE_UNAVAILABLE'
    );
  } catch (err: any) {
    return createApiErrorResponse(err.message || 'Error finalizing trip settlement', 500);
  }
}
