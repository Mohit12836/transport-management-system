import type { TdsSection } from '../types/tms.ts';

export interface GstTaxBreakdown {
  taxableAmount: number;
  isInterState: boolean;
  isRcm: boolean;
  cgstRatePercent: number;
  cgstAmount: number;
  sgstRatePercent: number;
  sgstAmount: number;
  igstRatePercent: number;
  igstAmount: number;
  totalGstAmount: number;
  grossInvoiceAmount: number;
  netPayableAmount: number; // In RCM cases, payable to transporter equals taxable amount only
}

export interface TdsCalculationResult {
  grossFreight: number;
  advancePaid: number;
  tdsSection: TdsSection;
  tdsRatePercent: number;
  tdsAmount: number;
  shortageDeductions: number;
  netPayable: number;
  panVerified: boolean;
  declarationUnder194C6: boolean;
  notes: string;
}

/**
 * Rounds any currency amount to exactly 2 decimal places to eliminate floating point issues
 */
export function roundToCurrency(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

/**
 * Calculates GST Breakdown for Freight Invoice
 * Intra-State (Same State): CGST (2.5%) + SGST (2.5%) = 5%
 * Inter-State (Different State): IGST (5.0%)
 * Under RCM (Reverse Charge Mechanism - Sec 9(3)), tax liability shifts to recipient
 */
export function calculateGstBreakdown(
  taxableAmount: number,
  originState: string,
  destinationState: string,
  isRcm: boolean = false
): GstTaxBreakdown {
  const cleanTaxable = roundToCurrency(Math.max(0, taxableAmount));
  const normOrigin = (originState || '').trim().toLowerCase();
  const normDest = (destinationState || '').trim().toLowerCase();
  
  const isInterState = normOrigin !== normDest && normOrigin.length > 0 && normDest.length > 0;

  let cgstRate = 0;
  let sgstRate = 0;
  let igstRate = 0;

  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;

  if (isInterState) {
    igstRate = 5.0;
    igstAmount = roundToCurrency((cleanTaxable * igstRate) / 100);
  } else {
    cgstRate = 2.5;
    sgstRate = 2.5;
    cgstAmount = roundToCurrency((cleanTaxable * cgstRate) / 100);
    sgstAmount = roundToCurrency((cleanTaxable * sgstRate) / 100);
  }

  const totalGstAmount = roundToCurrency(cgstAmount + sgstAmount + igstAmount);
  const grossInvoiceAmount = roundToCurrency(cleanTaxable + totalGstAmount);
  
  // Under RCM, consignor/consignee pays GST directly to govt; transporter receives only base taxable
  const netPayableAmount = isRcm ? cleanTaxable : grossInvoiceAmount;

  return {
    taxableAmount: cleanTaxable,
    isInterState,
    isRcm,
    cgstRatePercent: cgstRate,
    cgstAmount,
    sgstRatePercent: sgstRate,
    sgstAmount,
    igstRatePercent: igstRate,
    igstAmount,
    totalGstAmount,
    grossInvoiceAmount,
    netPayableAmount,
  };
}

/**
 * Validates Indian Income Tax Permanent Account Number (PAN)
 * Format: 5 uppercase letters, 4 digits, 1 uppercase letter (e.g. ABCDE1234F)
 */
export function validatePanNumber(pan?: string): boolean {
  if (!pan) return false;
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return panRegex.test(pan.trim().toUpperCase());
}

/**
 * Calculates TDS under Section 194C / Section 206AA
 * - Individual / Proprietorship: 1.0%
 * - Company / Partnership / LLP: 2.0%
 * - Sub-contractor with <= 10 vehicles declaration under Sec 194C(6) + valid PAN: 0.0%
 * - Without valid PAN: Sec 206AA penalty rate: 20.0%
 */
export function calculateTds194C(
  grossFreight: number,
  vendorCategory: 'individual' | 'company' | 'exempt',
  panNumber?: string,
  has194C6Declaration: boolean = false,
  advancePaid: number = 0,
  shortageDeductions: number = 0
): TdsCalculationResult {
  const cleanGross = roundToCurrency(Math.max(0, grossFreight));
  const cleanAdvance = roundToCurrency(Math.max(0, advancePaid));
  const cleanShortage = roundToCurrency(Math.max(0, shortageDeductions));
  const isPanValid = validatePanNumber(panNumber);

  let tdsSection: TdsSection = '194C_INDIVIDUAL';
  let tdsRate = 1.0;
  let notes = '';

  if (!isPanValid) {
    tdsSection = '206AA_HIGHER';
    tdsRate = 20.0;
    notes = 'Invalid or missing PAN. Higher deduction rate of 20% applied under Section 206AA.';
  } else if (has194C6Declaration || vendorCategory === 'exempt') {
    tdsSection = '194C_6_EXEMPT';
    tdsRate = 0.0;
    notes = 'Exempt from TDS deduction as per Section 194C(6) declaration (<= 10 commercial goods vehicles).';
  } else if (vendorCategory === 'company') {
    tdsSection = '194C_COMPANY';
    tdsRate = 2.0;
    notes = 'Standard TDS deduction of 2% applied for Company/Firm/LLP under Section 194C.';
  } else {
    tdsSection = '194C_INDIVIDUAL';
    tdsRate = 1.0;
    notes = 'Standard TDS deduction of 1% applied for Individual/HUF under Section 194C.';
  }

  const tdsAmount = roundToCurrency((cleanGross * tdsRate) / 100);
  const netPayable = roundToCurrency(cleanGross - cleanAdvance - tdsAmount - cleanShortage);

  return {
    grossFreight: cleanGross,
    advancePaid: cleanAdvance,
    tdsSection,
    tdsRatePercent: tdsRate,
    tdsAmount,
    shortageDeductions: cleanShortage,
    netPayable,
    panVerified: isPanValid,
    declarationUnder194C6: has194C6Declaration,
    notes,
  };
}
