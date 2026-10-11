import test from 'node:test';
import assert from 'node:assert/strict';

import {
  roundToCurrency,
  calculateGstBreakdown,
  calculateTds194C,
  validatePanNumber,
} from '../src/lib/tax-rules.ts';

import {
  calculateDriverTripSettlement,
  detectDuplicateExpense,
  validateLRInvoiceEligibility,
  generateJournalEntryForDriverAdvance,
  generateJournalEntryForDriverSettlement,
  generateJournalEntryForCustomerInvoice,
  validateJournalIntegrity,
} from '../src/lib/financial-engine.ts';

test('Tax Rules - GST Intra-State vs Inter-State and RCM Calculations', () => {
  // Test 1: Intra-State (Rajasthan -> Rajasthan)
  const intraState = calculateGstBreakdown(100000, 'Rajasthan', 'Rajasthan', false);
  assert.equal(intraState.isInterState, false);
  assert.equal(intraState.cgstRatePercent, 2.5);
  assert.equal(intraState.cgstAmount, 2500);
  assert.equal(intraState.sgstRatePercent, 2.5);
  assert.equal(intraState.sgstAmount, 2500);
  assert.equal(intraState.igstAmount, 0);
  assert.equal(intraState.grossInvoiceAmount, 105000);
  assert.equal(intraState.netPayableAmount, 105000);

  // Test 2: Inter-State (Rajasthan -> Maharashtra)
  const interState = calculateGstBreakdown(100000, 'Rajasthan', 'Maharashtra', false);
  assert.equal(interState.isInterState, true);
  assert.equal(interState.cgstAmount, 0);
  assert.equal(interState.sgstAmount, 0);
  assert.equal(interState.igstRatePercent, 5.0);
  assert.equal(interState.igstAmount, 5000);
  assert.equal(interState.grossInvoiceAmount, 105000);
  assert.equal(interState.netPayableAmount, 105000);

  // Test 3: Reverse Charge Mechanism (RCM)
  const rcmCase = calculateGstBreakdown(100000, 'Rajasthan', 'Gujarat', true);
  assert.equal(rcmCase.isRcm, true);
  assert.equal(rcmCase.igstAmount, 5000);
  assert.equal(rcmCase.grossInvoiceAmount, 105000);
  assert.equal(rcmCase.netPayableAmount, 100000); // Under RCM, customer pays GST directly to govt; transporter bills base freight only
});

test('Tax Rules - TDS Section 194C & 206AA Verification', () => {
  assert.equal(validatePanNumber('ABCDE1234F'), true);
  assert.equal(validatePanNumber('INVALID'), false);
  assert.equal(validatePanNumber(''), false);

  // Individual Transporter (1% TDS)
  const indResult = calculateTds194C(50000, 'individual', 'ABCDE1234F', false, 10000, 500);
  assert.equal(indResult.tdsRatePercent, 1.0);
  assert.equal(indResult.tdsAmount, 500); // 1% of 50000
  // Net = 50000 - 10000 (adv) - 500 (tds) - 500 (shortage) = 39000
  assert.equal(indResult.netPayable, 39000);

  // Company Transporter (2% TDS)
  const compResult = calculateTds194C(100000, 'company', 'AABCZ1234F', false, 20000, 0);
  assert.equal(compResult.tdsRatePercent, 2.0);
  assert.equal(compResult.tdsAmount, 2000); // 2% of 100000
  assert.equal(compResult.netPayable, 78000);

  // Section 194C(6) Declaration Exemption (0% TDS)
  const exemptResult = calculateTds194C(80000, 'individual', 'ABCDE1234F', true, 0, 0);
  assert.equal(exemptResult.tdsSection, '194C_6_EXEMPT');
  assert.equal(exemptResult.tdsRatePercent, 0.0);
  assert.equal(exemptResult.tdsAmount, 0);
  assert.equal(exemptResult.netPayable, 80000);

  // Missing / Invalid PAN -> Section 206AA Penalty Rate (20% TDS)
  const noPanResult = calculateTds194C(50000, 'individual', 'INVALID_PAN', false, 0, 0);
  assert.equal(noPanResult.tdsSection, '206AA_HIGHER');
  assert.equal(noPanResult.tdsRatePercent, 20.0);
  assert.equal(noPanResult.tdsAmount, 10000); // 20% of 50000
  assert.equal(noPanResult.netPayable, 40000);
});

test('Financial Engine - Driver Trip Settlement Calculation (Refund vs Reimbursement)', () => {
  const advances = [
    {
      id: 'adv-01',
      driverId: 'drv-01',
      tripId: 'trip-01',
      amount: 15000,
      paymentMode: 'Cash',
      disbursedAt: '2026-10-09',
      isSettled: false,
    },
    {
      id: 'adv-02',
      driverId: 'drv-01',
      tripId: 'trip-01',
      amount: 5000,
      paymentMode: 'UPI',
      disbursedAt: '2026-10-10',
      isSettled: false,
    },
  ];

  const expenses = [
    {
      id: 'exp-01',
      tripId: 'trip-01',
      driverId: 'drv-01',
      expenseCategory: 'Fuel',
      amount: 11500,
      paidBy: 'Driver_Advance',
      isApproved: true,
      approvalStatus: 'approved',
      createdAt: '2026-10-09',
    },
    {
      id: 'exp-02',
      tripId: 'trip-01',
      driverId: 'drv-01',
      expenseCategory: 'Toll_FASTag',
      amount: 2200,
      paidBy: 'Driver_Advance',
      isApproved: true,
      approvalStatus: 'approved',
      createdAt: '2026-10-10',
    },
    {
      id: 'exp-03',
      tripId: 'trip-01',
      driverId: 'drv-01',
      expenseCategory: 'Loading',
      amount: 800,
      paidBy: 'Driver_Advance',
      isApproved: false,
      approvalStatus: 'rejected',
      rejectionReason: 'No receipt voucher attached',
      createdAt: '2026-10-10',
    },
  ];

  // Case 1: Total Advance = 20,000. Approved = 13,700. Shortage = 500.
  // Net Recoverable = 20000 - 13700 + 500 = +6800 (Driver owes company refund of unspent advance + shortage)
  const settle1 = calculateDriverTripSettlement('trip-01', 'drv-01', advances, expenses, 500);
  assert.equal(settle1.totalAdvancesDisbursed, 20000);
  assert.equal(settle1.totalApprovedExpenses, 13700);
  assert.equal(settle1.totalRejectedExpenses, 800);
  assert.equal(settle1.shortageDeductions, 500);
  assert.equal(settle1.netAmount, 6800);
  assert.equal(settle1.isDriverOwingCompany, true);
  assert.equal(settle1.expenseCategoryBreakdown['Fuel'], 11500);
  assert.equal(settle1.expenseCategoryBreakdown['Toll_FASTag'], 2200);

  // Case 2: Expenses exceed advances (Company owes driver reimbursement)
  const extraExpenses = [
    ...expenses,
    {
      id: 'exp-04',
      tripId: 'trip-01',
      driverId: 'drv-01',
      expenseCategory: 'Repair',
      amount: 8000,
      paidBy: 'Driver_Advance',
      isApproved: true,
      approvalStatus: 'approved',
      createdAt: '2026-10-11',
    },
  ];
  // Advance = 20000. Approved = 13700 + 8000 = 21700. Shortage = 0.
  // Net = 20000 - 21700 = -1700 (Company owes driver)
  const settle2 = calculateDriverTripSettlement('trip-01', 'drv-01', advances, extraExpenses, 0);
  assert.equal(settle2.totalApprovedExpenses, 21700);
  assert.equal(settle2.netAmount, -1700);
  assert.equal(settle2.isDriverOwingCompany, false);
});

test('Financial Engine - Duplicate Expense Receipt Detection', () => {
  const existingExpenses = [
    {
      id: 'exp-01',
      tripId: 'trip-01',
      expenseCategory: 'Fuel',
      amount: 4500,
      slipNumber: 'IOCL-98214',
      paidBy: 'Driver_Advance',
      isApproved: true,
      approvalStatus: 'approved',
      createdAt: '2026-10-09',
    },
  ];

  // Duplicate slip number
  const dupSlip = detectDuplicateExpense(
    {
      tripId: 'trip-01',
      amount: 4500,
      expenseCategory: 'Fuel',
      slipNumber: 'iocl-98214', // case insensitive
    },
    existingExpenses
  );
  assert.equal(dupSlip.isDuplicate, true);
  assert.match(dupSlip.reason, /Duplicate receipt slip number/);

  // Duplicate trip + category + exact amount
  const dupCatAmt = detectDuplicateExpense(
    {
      tripId: 'trip-01',
      amount: 4500,
      expenseCategory: 'Fuel',
    },
    existingExpenses
  );
  assert.equal(dupCatAmt.isDuplicate, true);

  // Valid non-duplicate entry
  const validEntry = detectDuplicateExpense(
    {
      tripId: 'trip-01',
      amount: 1200,
      expenseCategory: 'Toll_FASTag',
      slipNumber: 'FASTAG-1109',
    },
    existingExpenses
  );
  assert.equal(validEntry.isDuplicate, false);
});

test('Financial Engine - Invoice Gate Enforces Verified POD', () => {
  const sampleLR = {
    id: 'lr-01',
    organizationId: 'org-01',
    branchId: 'br-01',
    lrNumber: 'LR-2026-001',
    lrDate: '2026-10-09',
    consignorName: 'ABC Ltd',
    consignorAddress: 'Jaipur',
    consigneeName: 'XYZ Ltd',
    consigneeAddress: 'Mumbai',
    originCity: 'Jaipur',
    destinationCity: 'Mumbai',
    goodsDescription: 'Industrial Spares',
    packagesCount: 10,
    packageType: 'Box',
    actualWeightTon: 5.0,
    chargedWeightTon: 5.0,
    freightRatePerTon: 2000,
    totalFreightAmount: 10000,
    loadingCharges: 500,
    unloadingCharges: 500,
    insuranceCharges: 0,
    netTotalAmount: 11000,
    paymentType: 'tbb',
    status: 'delivered',
    createdAt: '2026-10-09',
  };

  // Missing POD -> Block
  const res1 = validateLRInvoiceEligibility(sampleLR, undefined);
  assert.equal(res1.eligible, false);
  assert.match(res1.reason, /missing Proof of Delivery/);

  // Pending verification POD -> Block
  const pendingPod = {
    id: 'pod-01',
    lrId: 'lr-01',
    tripId: 'trip-01',
    deliveredAt: '2026-10-10',
    podImageUrl: 'https://example.com/pod.jpg',
    receivedByName: 'Praveen',
    shortageQuantity: 0,
    status: 'pending_verification',
    createdAt: '2026-10-10',
  };
  const res2 = validateLRInvoiceEligibility(sampleLR, pendingPod);
  assert.equal(res2.eligible, false);
  assert.match(res2.reason, /awaiting manager verification/);

  // Rejected POD -> Block
  const rejectedPod = {
    ...pendingPod,
    status: 'rejected',
    rejectionReason: 'Illegible receiver stamp',
  };
  const res3 = validateLRInvoiceEligibility(sampleLR, rejectedPod);
  assert.equal(res3.eligible, false);
  assert.match(res3.reason, /was rejected/);

  // Verified POD -> Pass
  const verifiedPod = {
    ...pendingPod,
    status: 'verified',
    verifiedBy: 'Arun Sharma',
    verifiedAt: '2026-10-10T12:00:00Z',
  };
  const res4 = validateLRInvoiceEligibility(sampleLR, verifiedPod);
  assert.equal(res4.eligible, true);
});

test('Financial Engine - Double-Entry Balanced Journal Generation & Ledger Integrity', () => {
  // 1. Advance Journal Entry
  const advJournal = generateJournalEntryForDriverAdvance(
    {
      id: 'adv-01',
      driverId: 'drv-01',
      tripId: 'trip-01',
      tripNumber: 'TRIP-2026-041',
      amount: 15000,
      paymentMode: 'Cash',
      disbursedAt: '2026-10-09',
      isSettled: false,
    },
    'Mukesh Yadav'
  );
  assert.equal(advJournal.isBalanced, true);
  assert.equal(advJournal.totalDebit, 15000);
  assert.equal(advJournal.totalCredit, 15000);

  // 2. Settlement Journal Entry (Balanced Debits & Credits)
  const settleJournal = generateJournalEntryForDriverSettlement(
    {
      id: 'settle-01',
      organizationId: 'org-01',
      settlementNumber: 'SETTLE-2026-001',
      driverId: 'drv-01',
      driverName: 'Mukesh Yadav',
      tripId: 'trip-01',
      tripNumber: 'TRIP-2026-041',
      settlementDate: '2026-10-11',
      totalAdvanceDisbursed: 15000,
      totalApprovedExpenses: 11000,
      totalRejectedExpenses: 500,
      shortageDeductions: 500,
      netPayableOrRecoverable: 4500, // Driver refunds ₹4,500 (₹4,000 unspent cash + ₹500 shortage penalty)
      settlementStatus: 'settled',
      settledBy: 'Accountant',
      createdAt: '2026-10-11',
    },
    { Fuel: 9000, Toll_FASTag: 2000 }
  );
  assert.equal(settleJournal.isBalanced, true);
  assert.equal(settleJournal.totalDebit, 15500);
  assert.equal(settleJournal.totalCredit, 15500);

  // 3. Customer Invoice Journal Entry (Balanced Debits & Credits)
  const invoiceJournal = generateJournalEntryForCustomerInvoice({
    id: 'inv-01',
    invoiceNumber: 'INV/2026/001',
    invoiceDate: '2026-10-11',
    customerId: 'cust-01',
    customerName: 'Gupta Steel Ltd',
    billingAddress: 'Jaipur',
    originState: 'Rajasthan',
    destinationState: 'Rajasthan',
    isRcmApplicable: false,
    subtotalAmount: 60000,
    cgstRate: 2.5,
    cgstAmount: 1500,
    sgstRate: 2.5,
    sgstAmount: 1500,
    igstRate: 0,
    igstAmount: 0,
    totalGstAmount: 3000,
    grandTotal: 63000,
    paidAmount: 0,
    balanceAmount: 63000,
    paymentStatus: 'unpaid',
    dueDate: '2026-11-11',
    includedLRs: ['LR-001'],
  });
  assert.equal(invoiceJournal.isBalanced, true);
  assert.equal(invoiceJournal.totalDebit, 63000);
  assert.equal(invoiceJournal.totalCredit, 63000);

  // 4. Ledger Integrity Validator
  const integrity = validateJournalIntegrity([advJournal, settleJournal, invoiceJournal]);
  assert.equal(integrity.isBalanced, true);
  assert.equal(integrity.discrepancy, 0);
  assert.equal(integrity.unbalancedEntriesCount, 0);
});
