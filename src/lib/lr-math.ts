// LR Mathematical Calculation Engine & Three-Copy Consistency Builder
import type { LRConsignmentNote } from '../types/tms.ts';

export interface LRChargesBreakdown {
  chargedWeightTon: number;
  ratePerTon: number;
  baseFreightAmount: number;
  loadingCharges: number;
  unloadingCharges: number;
  insuranceCharges: number;
  subtotalAmount: number;
  cgstRatePercent: number;
  cgstAmount: number;
  sgstRatePercent: number;
  sgstAmount: number;
  igstRatePercent: number;
  igstAmount: number;
  netTotalAmount: number;
}

export function calculateLRCharges(
  chargedWeightTon: number,
  ratePerTon: number,
  loadingCharges = 0,
  unloadingCharges = 0,
  insuranceCharges = 0,
  isInterState = false,
  isRcmApplicable = false
): LRChargesBreakdown {
  const safeWeight = Math.max(0, Number(chargedWeightTon) || 0);
  const safeRate = Math.max(0, Number(ratePerTon) || 0);
  const safeLoading = Math.max(0, Number(loadingCharges) || 0);
  const safeUnloading = Math.max(0, Number(unloadingCharges) || 0);
  const safeInsurance = Math.max(0, Number(insuranceCharges) || 0);

  const baseFreightAmount = Math.round(safeWeight * safeRate * 100) / 100;
  const subtotalAmount = Math.round((baseFreightAmount + safeLoading + safeUnloading + safeInsurance) * 100) / 100;

  let cgstRatePercent = 0;
  let cgstAmount = 0;
  let sgstRatePercent = 0;
  let sgstAmount = 0;
  let igstRatePercent = 0;
  let igstAmount = 0;

  // In Indian GTA (Goods Transport Agency), 5% GST without ITC or RCM is standard
  if (!isRcmApplicable) {
    if (isInterState) {
      igstRatePercent = 5.0;
      igstAmount = Math.round(subtotalAmount * 0.05 * 100) / 100;
    } else {
      cgstRatePercent = 2.5;
      cgstAmount = Math.round(subtotalAmount * 0.025 * 100) / 100;
      sgstRatePercent = 2.5;
      sgstAmount = Math.round(subtotalAmount * 0.025 * 100) / 100;
    }
  }

  const netTotalAmount = Math.round((subtotalAmount + cgstAmount + sgstAmount + igstAmount) * 100) / 100;

  return {
    chargedWeightTon: safeWeight,
    ratePerTon: safeRate,
    baseFreightAmount,
    loadingCharges: safeLoading,
    unloadingCharges: safeUnloading,
    insuranceCharges: safeInsurance,
    subtotalAmount,
    cgstRatePercent,
    cgstAmount,
    sgstRatePercent,
    sgstAmount,
    igstRatePercent,
    igstAmount,
    netTotalAmount,
  };
}

export type LRCopyType = 'CONSIGNOR_COPY' | 'CONSIGNEE_COPY' | 'OFFICE_DRIVER_COPY';

export interface RenderedLRCopy {
  copyType: LRCopyType;
  copyTitle: string;
  copySubtitle: string;
  sourceRecord: LRConsignmentNote;
  watermark: string;
  checksum: string;
}

// Generate simple hash/checksum to mathematically prove 3-copy record consistency
export function generateLRChecksum(record: LRConsignmentNote): string {
  const payload = `${record.lrNumber}|${record.lrDate}|${record.consignorName}|${record.consigneeName}|${record.chargedWeightTon}|${record.netTotalAmount}|${record.paymentType}`;
  let hash = 0;
  for (let i = 0; i < payload.length; i++) {
    hash = (hash << 5) - hash + payload.charCodeAt(i);
    hash |= 0;
  }
  return `CRC-${Math.abs(hash).toString(16).toUpperCase()}`;
}

export function generateThreeCopies(record: LRConsignmentNote, isDemo = true): RenderedLRCopy[] {
  const checksum = generateLRChecksum(record);
  const watermark = isDemo ? 'DEMO / PROTOTYPE RECORD — NOT LEGAL CONSIGNMENT' : 'ORIGINAL CONSIGNMENT NOTE';

  return [
    {
      copyType: 'CONSIGNOR_COPY',
      copyTitle: 'CONSIGNOR COPY (Sender / Booking Branch Copy)',
      copySubtitle: 'To be retained by the booking party as proof of dispatch',
      sourceRecord: record,
      watermark,
      checksum,
    },
    {
      copyType: 'CONSIGNEE_COPY',
      copyTitle: 'CONSIGNEE COPY (Receiver / Delivery Note)',
      copySubtitle: 'To be presented at the destination warehouse for goods handover',
      sourceRecord: record,
      watermark,
      checksum,
    },
    {
      copyType: 'OFFICE_DRIVER_COPY',
      copyTitle: 'OFFICE & DRIVER COPY (POD / Billing Record)',
      copySubtitle: 'Driver carries en-route; destination party stamps as Proof of Delivery',
      sourceRecord: record,
      watermark,
      checksum,
    },
  ];
}

export function verifyThreeCopyConsistency(copies: RenderedLRCopy[]): boolean {
  if (!copies || copies.length !== 3) return false;
  const expectedChecksum = copies[0].checksum;
  const expectedLR = copies[0].sourceRecord.lrNumber;
  const expectedAmount = copies[0].sourceRecord.netTotalAmount;

  return copies.every(
    (copy) =>
      copy.checksum === expectedChecksum &&
      copy.sourceRecord.lrNumber === expectedLR &&
      copy.sourceRecord.netTotalAmount === expectedAmount
  );
}
