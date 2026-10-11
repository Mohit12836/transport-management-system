import { NextResponse } from 'next/server.js';
import {
  verifyApiAuth,
  createApiErrorResponse,
  createApiSuccessResponse,
  shouldFallbackToDemoData,
} from '../../../../../lib/supabase/api-guard.ts';
import {
  validateLRInvoiceEligibility,
  generateJournalEntryForCustomerInvoice,
} from '../../../../../lib/financial-engine.ts';
import { calculateGstBreakdown, roundToCurrency } from '../../../../../lib/tax-rules.ts';
import { DEMO_INVOICES, DEMO_LRS, DEMO_PODS } from '../../../../../lib/mock-tms-data.ts';
import { getSupabaseServerClient } from '../../../../../lib/supabase/server.ts';
import type { CustomerInvoice } from "../../../../../types/tms.ts";

export async function GET(req: Request) {
  const auth = await verifyApiAuth(req, {
    allowedRoles: ['superadmin', 'owner', 'accountant'],
  });
  if (!auth.success) return auth.response;

  const supabase = await getSupabaseServerClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('customer_invoices_v2')
      .select('*')
      .eq('organization_id', auth.session.organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      return createApiErrorResponse(error.message, 500, 'DATABASE_QUERY_ERROR');
    }
    return createApiSuccessResponse(data || [], { count: data?.length || 0 });
  }

  if (shouldFallbackToDemoData(auth.session.authMode)) {
    return createApiSuccessResponse(DEMO_INVOICES, { count: DEMO_INVOICES.length });
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
      customerId,
      customerName,
      customerGstin,
      billingAddress,
      originState,
      destinationState,
      isRcmApplicable,
      selectedLRIds,
      dueDate,
    } = body;

    if (!customerName || !selectedLRIds || !Array.isArray(selectedLRIds) || selectedLRIds.length === 0) {
      return createApiErrorResponse('Customer name and selected LR consignments are required.', 400);
    }

    const selectedLRs = DEMO_LRS.filter((l) => selectedLRIds.includes(l.id));
    if (selectedLRs.length === 0) {
      return createApiErrorResponse('No valid LRs found for the provided IDs.', 404);
    }

    // STRICT SERVER-SIDE POD GATE ENFORCEMENT
    for (const lr of selectedLRs) {
      const linkedPod = DEMO_PODS.find((p) => p.lrId === lr.id);
      const gateCheck = validateLRInvoiceEligibility(lr, linkedPod);
      if (!gateCheck.eligible) {
        return createApiErrorResponse(
          `Invoice Gate Blocked: ${gateCheck.reason}`,
          422,
          'POD_VERIFICATION_REQUIRED'
        );
      }
    }

    // CALCULATE GST TAX BREAKDOWN
    const subtotal = roundToCurrency(selectedLRs.reduce((sum, l) => sum + (l.netTotalAmount || 0), 0));
    const gstBreakdown = calculateGstBreakdown(
      subtotal,
      originState || 'Rajasthan',
      destinationState || 'Rajasthan',
      Boolean(isRcmApplicable)
    );

    const invoiceNumber = `INV/2026-27/${Math.floor(1000 + Math.random() * 9000)}`;

    const newInvoice: CustomerInvoice = {
      id: `inv-${Date.now()}`,
      organizationId: auth.session.organizationId,
      branchId: auth.session.branchId,
      invoiceNumber,
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      customerId: customerId || `cust-${Date.now()}`,
      customerName,
      customerGstin,
      billingAddress: billingAddress || 'Registered Office Address',
      originState: originState || 'Rajasthan',
      destinationState: destinationState || 'Rajasthan',
      isRcmApplicable: Boolean(isRcmApplicable),
      subtotalAmount: gstBreakdown.taxableAmount,
      cgstRate: gstBreakdown.cgstRatePercent,
      cgstAmount: gstBreakdown.cgstAmount,
      sgstRate: gstBreakdown.sgstRatePercent,
      sgstAmount: gstBreakdown.sgstAmount,
      igstRate: gstBreakdown.igstRatePercent,
      igstAmount: gstBreakdown.igstAmount,
      totalGstAmount: gstBreakdown.totalGstAmount,
      grandTotal: gstBreakdown.grossInvoiceAmount,
      paidAmount: 0,
      balanceAmount: gstBreakdown.netPayableAmount,
      paymentStatus: 'unpaid',
      includedLRs: selectedLRs.map((l) => l.lrNumber),
      createdAt: new Date().toISOString(),
    };

    // GENERATE BALANCED GENERAL LEDGER JOURNAL
    const journalEntry = generateJournalEntryForCustomerInvoice(newInvoice);

    const supabase = await getSupabaseServerClient();
    if (supabase) {
      // 1. Insert invoice into customer_invoices_v2
      const { data: invData, error: invErr } = await supabase
        .from('customer_invoices_v2')
        .insert([{
          id: newInvoice.id,
          organization_id: auth.session.organizationId,
          branch_id: auth.session.branchId,
          invoice_number: newInvoice.invoiceNumber,
          invoice_date: newInvoice.invoiceDate,
          due_date: newInvoice.dueDate,
          customer_id: newInvoice.customerId,
          customer_name: newInvoice.customerName,
          customer_gstin: newInvoice.customerGstin,
          billing_address: newInvoice.billingAddress,
          origin_state: newInvoice.originState,
          destination_state: newInvoice.destinationState,
          is_rcm_applicable: newInvoice.isRcmApplicable,
          subtotal_amount: newInvoice.subtotalAmount,
          cgst_rate: newInvoice.cgstRate,
          cgst_amount: newInvoice.cgstAmount,
          sgst_rate: newInvoice.sgstRate,
          sgst_amount: newInvoice.sgstAmount,
          igst_rate: newInvoice.igstRate,
          igst_amount: newInvoice.igstAmount,
          total_gst_amount: newInvoice.totalGstAmount,
          grand_total: newInvoice.grandTotal,
          balance_amount: newInvoice.balanceAmount,
          payment_status: newInvoice.paymentStatus,
          created_at: newInvoice.createdAt,
        }])
        .select()
        .single();

      if (invErr) {
        return createApiErrorResponse(`Database invoice write failed: ${invErr.message}`, 500, 'DATABASE_WRITE_ERROR');
      }

      // 2. Insert Balanced Journal Entry
      await supabase.from('journal_entries').insert([{
        id: journalEntry.id,
        organization_id: auth.session.organizationId,
        journal_number: journalEntry.entryNumber,
        entry_date: journalEntry.entryDate,
        source_module: journalEntry.referenceType,
        source_document_id: newInvoice.id,
        source_document_number: invoiceNumber,
        total_debit: journalEntry.totalDebit,
        total_credit: journalEntry.totalCredit,
        is_balanced: journalEntry.isBalanced,
        created_by: auth.session.fullName,
        remarks: journalEntry.description,
        created_at: new Date().toISOString(),
      }]);

      return createApiSuccessResponse(
        {
          invoice: invData,
          journalEntry,
          taxBreakdown: gstBreakdown,
        },
        undefined,
        201
      );
    }

    if (shouldFallbackToDemoData(auth.session.authMode)) {
      return createApiSuccessResponse(
        {
          invoice: newInvoice,
          journalEntry,
          taxBreakdown: gstBreakdown,
        },
        undefined,
        201
      );
    }

    return createApiErrorResponse(
      'Cannot generate invoice: Database connection is unavailable in production.',
      503,
      'DATABASE_UNAVAILABLE'
    );
  } catch (err: any) {
    return createApiErrorResponse(err.message || 'Error generating customer invoice', 500);
  }
}
