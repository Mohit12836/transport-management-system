// LR / Bilty Validation Engine
// Pure functional validators with detailed error envelopes

export interface LRValidationInput {
  lrNumber: string;
  consignorName: string;
  consignorAddress: string;
  consignorGstin?: string;
  consigneeName: string;
  consigneeAddress: string;
  consigneeGstin?: string;
  originCity: string;
  destinationCity: string;
  goodsDescription: string;
  packagesCount: number;
  actualWeightTon: number;
  chargedWeightTon: number;
  freightRatePerTon: number;
  loadingCharges?: number;
  unloadingCharges?: number;
  insuranceCharges?: number;
  paymentType: string;
  ewayBillNumber?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

// Indian GSTIN validation regex (15 alphanumeric characters: 2 state digits + 10 PAN + 1 entity + 1 'Z' + 1 checksum)
export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

// 12-digit Indian e-Way Bill number format
export const EWAY_BILL_REGEX = /^\d{12}$/;

export function validateLRConsignment(data: Partial<LRValidationInput>): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.lrNumber || data.lrNumber.trim().length === 0) {
    errors.lrNumber = 'LR / Bilty Number is required.';
  } else if (!/^[A-Z0-9\-\/]{3,20}$/i.test(data.lrNumber.trim())) {
    errors.lrNumber = 'LR Number must be 3-20 alphanumeric characters (hyphens and slashes allowed).';
  }

  if (!data.consignorName || data.consignorName.trim().length < 2) {
    errors.consignorName = 'Consignor (Sender) company name is required.';
  }

  if (!data.consignorAddress || data.consignorAddress.trim().length < 5) {
    errors.consignorAddress = 'Valid Consignor pickup address is required.';
  }

  if (data.consignorGstin && data.consignorGstin.trim().length > 0) {
    if (!GSTIN_REGEX.test(data.consignorGstin.trim().toUpperCase())) {
      errors.consignorGstin = 'Invalid Consignor GSTIN format (e.g. 08AABCN1234D1Z5).';
    }
  }

  if (!data.consigneeName || data.consigneeName.trim().length < 2) {
    errors.consigneeName = 'Consignee (Receiver) company name is required.';
  }

  if (!data.consigneeAddress || data.consigneeAddress.trim().length < 5) {
    errors.consigneeAddress = 'Valid Consignee delivery address is required.';
  }

  if (data.consigneeGstin && data.consigneeGstin.trim().length > 0) {
    if (!GSTIN_REGEX.test(data.consigneeGstin.trim().toUpperCase())) {
      errors.consigneeGstin = 'Invalid Consignee GSTIN format.';
    }
  }

  if (!data.originCity || data.originCity.trim().length < 2) {
    errors.originCity = 'Origin city is required.';
  }

  if (!data.destinationCity || data.destinationCity.trim().length < 2) {
    errors.destinationCity = 'Destination city is required.';
  }

  if (data.originCity && data.destinationCity && data.originCity.trim().toLowerCase() === data.destinationCity.trim().toLowerCase()) {
    errors.destinationCity = 'Origin and destination cities cannot be identical.';
  }

  if (!data.goodsDescription || data.goodsDescription.trim().length < 2) {
    errors.goodsDescription = 'Description of goods is required.';
  }

  if (data.packagesCount === undefined || data.packagesCount < 1) {
    errors.packagesCount = 'Package count must be at least 1.';
  }

  if (data.actualWeightTon === undefined || data.actualWeightTon <= 0) {
    errors.actualWeightTon = 'Actual weight must be greater than 0.';
  }

  if (data.chargedWeightTon === undefined || data.chargedWeightTon <= 0) {
    errors.chargedWeightTon = 'Charged weight must be greater than 0.';
  } else if (data.actualWeightTon && data.chargedWeightTon < data.actualWeightTon) {
    errors.chargedWeightTon = 'Charged weight cannot be less than actual weight.';
  }

  if (data.freightRatePerTon === undefined || data.freightRatePerTon < 0) {
    errors.freightRatePerTon = 'Freight rate must be 0 or positive.';
  }

  if (data.ewayBillNumber && data.ewayBillNumber.trim().length > 0) {
    if (!EWAY_BILL_REGEX.test(data.ewayBillNumber.trim())) {
      errors.ewayBillNumber = 'e-Way Bill number must be exactly 12 numeric digits.';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
