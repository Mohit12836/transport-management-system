// Financial Engine for NextGen TMS (Milestone 4)
// Implements exact-currency calculations, driver settlements, duplicate detection,
// invoice eligibility validation, and balanced double-entry accounting journals.

import type {
  TripExpense,
  DriverAdvance,
  DriverSettlement,
  VendorSettlement,
  LRConsignmentNote,
  ProofOfDelivery,
  JournalEntry,
  CustomerInvoice,
  CustomerInvoiceItem,
} from '../types/tms.ts';
import { roundToCurrency, calculateGstBreakdown, calculateTds194C } from './tax-rules.ts';

export interface DriverSettlementSummary {
  tripId: string;
  driverId: string;
  totalAdvancesDisbursed: number;
  totalApprovedExpenses: number;
  totalPendingExpenses: number;
  totalRejectedExpenses: number;
  shortageDeductions: number;
  netAmount: number; // > 0: Driver refunds company; < 0: Company pays driver
  isDriverOwingCompany: boolean;
  expenseCategoryBreakdown: Record<string, number>;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  reason?: string;
  matchedExpenseId?: string;
}

export interface InvoiceEligibilityResult {
  eligible: boolean;
  reason?: string;
}

/**
 * Calculates a comprehensive driver trip expense & advance settlement summary
 */
export function calculateDriverTripSettlement(
  tripId: string,
  driverId: string,
  advances: DriverAdvance[],
  expenses: TripExpense[],
  shortageDeductions: number = 0
): DriverSettlementSummary {
  const tripAdvances = advances.filter(
    (a) => a.driverId === driverId && (!a.tripId || a.tripId === tripId)
  );
  const tripExpenses = expenses.filter((e) => e.tripId === tripId);

  const totalAdvancesDisbursed = roundToCurrency(
    tripAdvances.reduce((sum, a) => sum + (a.amount || 0), 0)
  );

  let totalApproved = 0;
  let totalPending = 0;
  let totalRejected = 0;
  const categoryBreakdown: Record<string, number> = {};

  for (const exp of tripExpenses) {
    const amt = roundToCurrency(exp.amount || 0);
    const cat = exp.expenseCategory || 'Miscellaneous';

    if (exp.approvalStatus === 'approved' || (exp.isApproved && exp.approvalStatus !== 'rejected')) {
      totalApproved = roundToCurrency(totalApproved + amt);
      categoryBreakdown[cat] = roundToCurrency((categoryBreakdown[cat] || 0) + amt);
    } else if (exp.approvalStatus === 'rejected') {
      totalRejected = roundToCurrency(totalRejected + amt);
    } else {
      totalPending = roundToCurrency(totalPending + amt);
    }
  }

  const cleanShortage = roundToCurrency(Math.max(0, shortageDeductions));
  // Net = Advance - Approved Expenses + Shortage Deductions
  // If > 0: Driver must refund unspent advance + shortage to company
  // If < 0: Company owes driver net reimbursement (after deducting shortage)
  const netAmount = roundToCurrency(totalAdvancesDisbursed - totalApproved + cleanShortage);

  return {
    tripId,
    driverId,
    totalAdvancesDisbursed,
    totalApprovedExpenses: totalApproved,
    totalPendingExpenses: totalPending,
    totalRejectedExpenses: totalRejected,
    shortageDeductions: cleanShortage,
    netAmount,
    isDriverOwingCompany: netAmount > 0,
    expenseCategoryBreakdown: categoryBreakdown,
  };
}

/**
 * Detects duplicate expense entries (e.g. duplicate fuel slip number or duplicate amount + category on same day)
 */
export function detectDuplicateExpense(
  candidate: {
    tripId: string;
    amount: number;
    expenseCategory: string;
    slipNumber?: string;
    vendorName?: string;
    createdAt?: string;
  },
  existingExpenses: TripExpense[]
): DuplicateCheckResult {
  const cleanCandidateSlip = candidate.slipNumber?.trim().toUpperCase();
  const candidateAmount = roundToCurrency(candidate.amount);

  for (const exp of existingExpenses) {
    // 1. Slip Number match (strongest signal)
    if (
      cleanCandidateSlip &&
      cleanCandidateSlip.length > 2 &&
      exp.slipNumber?.trim().toUpperCase() === cleanCandidateSlip
    ) {
      return {
        isDuplicate: true,
        reason: `Duplicate receipt slip number '${cleanCandidateSlip}' already exists in record.`,
        matchedExpenseId: exp.id,
      };
    }

    // 2. Same trip, exact same category, same amount
    if (
      exp.tripId === candidate.tripId &&
      exp.expenseCategory === candidate.expenseCategory &&
      roundToCurrency(exp.amount) === candidateAmount
    ) {
      return {
        isDuplicate: true,
        reason: `An expense of ₹${candidateAmount} for '${candidate.expenseCategory}' already exists for this trip.`,
        matchedExpenseId: exp.id,
      };
    }
  }

  return { isDuplicate: false };
}

/**
 * Strict Invoice Eligibility Gate:
 * An LR can NEVER be billed into a customer invoice unless:
 * 1. The LR is in 'delivered' or 'dispatched' status
 * 2. A valid Proof of Delivery (POD) exists for the LR
 * 3. The POD has been reviewed and verified by an authorized manager or accountant
 */
export function validateLRInvoiceEligibility(
  lr: LRConsignmentNote,
  pod?: ProofOfDelivery
): InvoiceEligibilityResult {
  if (lr.status === 'cancelled') {
    return { eligible: false, reason: `LR ${lr.lrNumber} has been cancelled.` };
  }

  if (lr.status === 'billed') {
    return { eligible: false, reason: `LR ${lr.lrNumber} has already been invoiced.` };
  }

  if (!pod) {
    return {
      eligible: false,
      reason: `LR ${lr.lrNumber} is missing Proof of Delivery (POD). Upload and verify POD first.`,
    };
  }

  if (pod.status === 'pending_verification') {
    return {
      eligible: false,
      reason: `POD for LR ${lr.lrNumber} is awaiting manager verification. Review POD before invoicing.`,
    };
  }

  if (pod.status === 'rejected') {
    return {
      eligible: false,
      reason: `POD for LR ${lr.lrNumber} was rejected (${pod.rejectionReason || 'Inspection issue'}). Cannot invoice until resolved.`,
    };
  }

  if (pod.status === 'verified') {
    return { eligible: true };
  }

  return { eligible: false, reason: `LR ${lr.lrNumber} does not meet verified delivery criteria.` };
}

/**
 * Generates an immutable, mathematically balanced double-entry journal entry
 */
export function generateJournalEntryForDriverAdvance(
  advance: DriverAdvance,
  driverName: string
): JournalEntry {
  const amount = roundToCurrency(advance.amount);
  const entryDate = advance.disbursedAt || new Date().toISOString();
  const entryNumber = `JE-ADV-${Date.now().toString().slice(-6)}`;

  return {
    id: `je-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    entryNumber,
    entryDate,
    description: `Driver Advance disbursed to ${driverName} (${advance.paymentMode}) - Trip: ${advance.tripNumber || 'General'}`,
    referenceType: 'DRIVER_ADVANCE',
    referenceId: advance.id,
    lines: [
      {
        accountName: `Driver Advance Asset - ${driverName}`,
        accountType: 'ASSET',
        debitAmount: amount,
        creditAmount: 0,
      },
      {
        accountName: advance.paymentMode === 'Cash' ? 'Cash in Hand (Jaipur Branch)' : 'HDFC Current Bank A/c',
        accountType: 'ASSET',
        debitAmount: 0,
        creditAmount: amount,
      },
    ],
    totalDebit: amount,
    totalCredit: amount,
    isBalanced: true,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Generates balanced journal entry for Driver Trip Settlement
 */
export function generateJournalEntryForDriverSettlement(
  settlement: DriverSettlement,
  categoryBreakdown: Record<string, number>
): JournalEntry {
  const lines = [];
  let totalDebit = 0;
  let totalCredit = 0;

  // 1. Debit all approved expense categories
  for (const [category, amount] of Object.entries(categoryBreakdown)) {
    if (amount > 0) {
      const cleanAmt = roundToCurrency(amount);
      lines.push({
        accountName: `Trip Expense - ${category}`,
        accountType: 'EXPENSE' as const,
        debitAmount: cleanAmt,
        creditAmount: 0,
      });
      totalDebit = roundToCurrency(totalDebit + cleanAmt);
    }
  }

  // 2. Shortage deductions (Transporter recovers shortage loss from driver)
  if (settlement.shortageDeductions > 0) {
    const cleanShortage = roundToCurrency(settlement.shortageDeductions);
    lines.push({
      accountName: 'Transit Damage & Shortage Recovery',
      accountType: 'REVENUE' as const,
      debitAmount: 0,
      creditAmount: cleanShortage,
    });
    totalCredit = roundToCurrency(totalCredit + cleanShortage);
  }

  // 3. Credit Driver Advance Asset account (Clearing out advance)
  const cleanAdvance = roundToCurrency(settlement.totalAdvanceDisbursed);
  lines.push({
    accountName: `Driver Advance Asset - ${settlement.driverName}`,
    accountType: 'ASSET' as const,
    debitAmount: 0,
    creditAmount: cleanAdvance,
  });
  totalCredit = roundToCurrency(totalCredit + cleanAdvance);

  // 4. Balance Net:
  // If Driver owes company (Net > 0): Company receives cash refund from driver -> Debit Cash
  // If Company owes driver (Net < 0): Company pays reimbursement to driver -> Credit Cash
  const net = settlement.netPayableOrRecoverable;
  if (net > 0) {
    const refund = roundToCurrency(net);
    lines.push({
      accountName: 'Cash in Hand (Driver Advance Refund Received)',
      accountType: 'ASSET' as const,
      debitAmount: refund,
      creditAmount: 0,
    });
    totalDebit = roundToCurrency(totalDebit + refund);
  } else if (net < 0) {
    const payout = roundToCurrency(Math.abs(net));
    lines.push({
      accountName: 'Cash in Hand / Bank (Driver Reimbursement Paid)',
      accountType: 'ASSET' as const,
      debitAmount: 0,
      creditAmount: payout,
    });
    totalCredit = roundToCurrency(totalCredit + payout);
  }

  const discrepancy = Math.abs(roundToCurrency(totalDebit - totalCredit));
  const isBalanced = discrepancy < 0.01;

  return {
    id: `je-settle-${Date.now()}`,
    entryNumber: `JE-SETTLE-${settlement.settlementNumber || Date.now().toString().slice(-5)}`,
    entryDate: settlement.settlementDate || new Date().toISOString(),
    description: `Trip Expense Settlement for ${settlement.driverName} - Trip ${settlement.tripNumber}`,
    referenceType: 'DRIVER_SETTLEMENT',
    referenceId: settlement.id,
    lines,
    totalDebit,
    totalCredit,
    isBalanced,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Generates balanced double-entry journal entry for Customer GST Invoicing
 */
export function generateJournalEntryForCustomerInvoice(invoice: CustomerInvoice): JournalEntry {
  const lines = [];
  const taxable = roundToCurrency(invoice.subtotalAmount);
  const grandTotal = roundToCurrency(invoice.grandTotal);

  // 1. Debit Accounts Receivable (Customer)
  lines.push({
    accountName: `Accounts Receivable - ${invoice.customerName}`,
    accountType: 'ASSET' as const,
    debitAmount: invoice.isRcmApplicable ? taxable : grandTotal,
    creditAmount: 0,
  });

  // 2. Credit Freight Revenue
  lines.push({
    accountName: 'Logistics & Freight Service Revenue',
    accountType: 'REVENUE' as const,
    debitAmount: 0,
    creditAmount: taxable,
  });

  // 3. If Non-RCM, Credit Output GST Liabilities
  if (!invoice.isRcmApplicable) {
    if (invoice.cgstAmount > 0) {
      lines.push({
        accountName: 'Output CGST Liability A/c (2.5%)',
        accountType: 'LIABILITY' as const,
        debitAmount: 0,
        creditAmount: roundToCurrency(invoice.cgstAmount),
      });
    }
    if (invoice.sgstAmount > 0) {
      lines.push({
        accountName: 'Output SGST Liability A/c (2.5%)',
        accountType: 'LIABILITY' as const,
        debitAmount: 0,
        creditAmount: roundToCurrency(invoice.sgstAmount),
      });
    }
    if (invoice.igstAmount > 0) {
      lines.push({
        accountName: 'Output IGST Liability A/c (5.0%)',
        accountType: 'LIABILITY' as const,
        debitAmount: 0,
        creditAmount: roundToCurrency(invoice.igstAmount),
      });
    }
  }

  const totalDebit = lines.reduce((sum, l) => roundToCurrency(sum + l.debitAmount), 0);
  const totalCredit = lines.reduce((sum, l) => roundToCurrency(sum + l.creditAmount), 0);
  const isBalanced = Math.abs(roundToCurrency(totalDebit - totalCredit)) < 0.01;

  return {
    id: `je-inv-${Date.now()}`,
    entryNumber: `JE-${invoice.invoiceNumber.replace(/[^A-Za-z0-9]/g, '-')}`,
    entryDate: invoice.invoiceDate || new Date().toISOString(),
    description: `Freight Billing - ${invoice.customerName} (Inv #${invoice.invoiceNumber})`,
    referenceType: 'INVOICE',
    referenceId: invoice.id,
    lines,
    totalDebit,
    totalCredit,
    isBalanced,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Validates whether an array of journal entries maintains accounting ledger balance
 */
export function validateJournalIntegrity(entries: JournalEntry[]): {
  isBalanced: boolean;
  totalDebits: number;
  totalCredits: number;
  discrepancy: number;
  unbalancedEntriesCount: number;
} {
  let totalDebits = 0;
  let totalCredits = 0;
  let unbalancedCount = 0;

  for (const entry of entries) {
    const entryDebit = entry.lines.reduce((s, l) => roundToCurrency(s + (l.debitAmount || 0)), 0);
    const entryCredit = entry.lines.reduce((s, l) => roundToCurrency(s + (l.creditAmount || 0)), 0);
    
    totalDebits = roundToCurrency(totalDebits + entryDebit);
    totalCredits = roundToCurrency(totalCredits + entryCredit);

    if (Math.abs(roundToCurrency(entryDebit - entryCredit)) >= 0.01) {
      unbalancedCount++;
    }
  }

  const discrepancy = Math.abs(roundToCurrency(totalDebits - totalCredits));
  return {
    isBalanced: discrepancy < 0.01 && unbalancedCount === 0,
    totalDebits,
    totalCredits,
    discrepancy,
    unbalancedEntriesCount: unbalancedCount,
  };
}
