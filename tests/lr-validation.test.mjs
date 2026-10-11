import test from 'node:test';
import assert from 'node:assert/strict';

// Direct import of validation logic for automated verification
import { validateLRConsignment, GSTIN_REGEX, EWAY_BILL_REGEX } from '../src/lib/validators.ts';
import { calculateLRCharges } from '../src/lib/lr-math.ts';

test('LR Validation - Valid Input Passes', () => {
  const validData = {
    lrNumber: 'LR-JPR-2026-001',
    consignorName: 'Gupta Steel Pipes Ltd',
    consignorAddress: 'Plot 42, VKIA, Jaipur',
    consignorGstin: '08AABCG9876E1Z4',
    consigneeName: 'Reliance Retail Hub',
    consigneeAddress: 'Bhiwandi Logistics Park',
    consigneeGstin: '27AAACR1234F1Z8',
    originCity: 'Jaipur',
    destinationCity: 'Mumbai',
    goodsDescription: 'Steel Pipes & GI Bundles',
    packagesCount: 100,
    actualWeightTon: 20.0,
    chargedWeightTon: 21.0,
    freightRatePerTon: 2500,
    ewayBillNumber: '123456789012',
    paymentType: 'tbb',
  };

  const result = validateLRConsignment(validData);
  assert.equal(result.isValid, true, 'Valid LR data should return isValid=true');
  assert.equal(Object.keys(result.errors).length, 0);
});

test('LR Validation - Catches Missing Required Fields', () => {
  const emptyData = {};
  const result = validateLRConsignment(emptyData);

  assert.equal(result.isValid, false, 'Empty LR data must fail validation');
  assert.ok(result.errors.lrNumber, 'Should require LR number');
  assert.ok(result.errors.consignorName, 'Should require consignor name');
  assert.ok(result.errors.consigneeName, 'Should require consignee name');
  assert.ok(result.errors.originCity, 'Should require origin city');
  assert.ok(result.errors.destinationCity, 'Should require destination city');
});

test('LR Validation - Rejects Same Origin and Destination', () => {
  const sameCityData = {
    lrNumber: 'LR-TEST-01',
    consignorName: 'Test Sender',
    consignorAddress: 'Address 1',
    consigneeName: 'Test Receiver',
    consigneeAddress: 'Address 2',
    originCity: 'Jaipur',
    destinationCity: 'jaipur', // identical city
    goodsDescription: 'Goods',
    packagesCount: 10,
    actualWeightTon: 5,
    chargedWeightTon: 5,
    freightRatePerTon: 1000,
    paymentType: 'tbb',
  };

  const result = validateLRConsignment(sameCityData);
  assert.equal(result.isValid, false);
  assert.ok(result.errors.destinationCity, 'Should reject identical origin and destination');
});

test('LR Validation - Rejects Charged Weight Less Than Actual Weight', () => {
  const weightMismatch = {
    lrNumber: 'LR-TEST-02',
    consignorName: 'Sender A',
    consignorAddress: 'Address A',
    consigneeName: 'Receiver B',
    consigneeAddress: 'Address B',
    originCity: 'Jaipur',
    destinationCity: 'Delhi',
    goodsDescription: 'Cargo',
    packagesCount: 10,
    actualWeightTon: 25.0,
    chargedWeightTon: 20.0, // Invalid: less than actual
    freightRatePerTon: 1000,
    paymentType: 'tbb',
  };

  const result = validateLRConsignment(weightMismatch);
  assert.equal(result.isValid, false);
  assert.ok(result.errors.chargedWeightTon, 'Should reject charged weight < actual weight');
});

test('LR Validation - Validates GSTIN Regex', () => {
  assert.equal(GSTIN_REGEX.test('08AABCG9876E1Z4'), true);
  assert.equal(GSTIN_REGEX.test('INVALID_GSTIN_123'), false);
});

test('LR Validation - Validates 12-Digit e-Way Bill Regex', () => {
  assert.equal(EWAY_BILL_REGEX.test('123456789012'), true);
  assert.equal(EWAY_BILL_REGEX.test('12345'), false);
  assert.equal(EWAY_BILL_REGEX.test('12345678901234'), false);
});

test('LR Math - Accurately Computes Base Freight and Surcharges', () => {
  // 20 Tons at ₹2,500/Ton = ₹50,000 base
  // Loading ₹1,000 + Unloading ₹800 + Insurance ₹200 = ₹2,000 surcharges
  // Subtotal = ₹52,000
  // Inter-state IGST 5% = ₹2,600
  // Net Total = ₹54,600
  const calculation = calculateLRCharges(20, 2500, 1000, 800, 200, true, false);

  assert.equal(calculation.baseFreightAmount, 50000);
  assert.equal(calculation.subtotalAmount, 52000);
  assert.equal(calculation.igstAmount, 2600);
  assert.equal(calculation.netTotalAmount, 54600);
});
