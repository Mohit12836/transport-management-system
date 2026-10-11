import test from 'node:test';
import assert from 'node:assert/strict';

import { generateThreeCopies, verifyThreeCopyConsistency, generateLRChecksum } from '../src/lib/lr-math.ts';

test('Three-Copy LR - Generates Exactly 3 Distinct Role Copies from Single Source Record', () => {
  const sampleLR = {
    id: 'lr-test-101',
    organizationId: 'org-demo-001',
    branchId: 'br-jaipur',
    lrNumber: 'LR-JPR-2026-9999',
    lrDate: '2026-10-10',
    consignorName: 'Rajasthan Textile Mills',
    consignorAddress: 'Mansarovar, Jaipur',
    consignorGstin: '08AABCR4433E1Z1',
    consigneeName: 'Vikas Garment Exporters',
    consigneeAddress: 'Sector 37, Gurugram',
    consigneeGstin: '06AABCV9988D1Z3',
    originCity: 'Jaipur',
    destinationCity: 'Gurugram',
    goodsDescription: 'Cotton Fabric Rolls',
    packagesCount: 50,
    packageType: 'Bales',
    actualWeightTon: 10.0,
    chargedWeightTon: 10.0,
    freightRatePerTon: 1500,
    totalFreightAmount: 15000,
    loadingCharges: 500,
    unloadingCharges: 0,
    insuranceCharges: 250,
    netTotalAmount: 15750,
    paymentType: 'tbb',
    status: 'generated',
    createdAt: '2026-10-10T12:00:00.000Z',
  };

  const copies = generateThreeCopies(sampleLR, true);

  assert.equal(copies.length, 3, 'Must produce exactly 3 copies');
  assert.equal(copies[0].copyType, 'CONSIGNOR_COPY');
  assert.equal(copies[1].copyType, 'CONSIGNEE_COPY');
  assert.equal(copies[2].copyType, 'OFFICE_DRIVER_COPY');

  // Verify all 3 point to the exact same immutable source record
  assert.equal(copies[0].sourceRecord.lrNumber, 'LR-JPR-2026-9999');
  assert.equal(copies[1].sourceRecord.lrNumber, 'LR-JPR-2026-9999');
  assert.equal(copies[2].sourceRecord.lrNumber, 'LR-JPR-2026-9999');

  // Verify consistency verification algorithm
  const isConsistent = verifyThreeCopyConsistency(copies);
  assert.equal(isConsistent, true, 'All 3 copies must share mathematical checksum consistency');
});

test('Three-Copy LR - Detects Data Tampering between copies', () => {
  const sampleLR = {
    id: 'lr-test-tamper',
    organizationId: 'org-demo-001',
    branchId: 'br-jaipur',
    lrNumber: 'LR-SAFE-01',
    lrDate: '2026-10-10',
    consignorName: 'Consignor A',
    consignorAddress: 'Address A',
    consigneeName: 'Consignee B',
    consigneeAddress: 'Address B',
    originCity: 'City A',
    destinationCity: 'City B',
    goodsDescription: 'Goods',
    packagesCount: 1,
    packageType: 'Box',
    actualWeightTon: 1,
    chargedWeightTon: 1,
    freightRatePerTon: 100,
    totalFreightAmount: 100,
    loadingCharges: 0,
    unloadingCharges: 0,
    insuranceCharges: 0,
    netTotalAmount: 100,
    paymentType: 'tbb',
    status: 'generated',
    createdAt: '2026-10-10T12:00:00.000Z',
  };

  const copies = generateThreeCopies(sampleLR, true);

  // Intentionally mutate copy 2
  copies[1] = {
    ...copies[1],
    sourceRecord: {
      ...copies[1].sourceRecord,
      netTotalAmount: 999999, // Tampered amount
    },
  };

  const isConsistent = verifyThreeCopyConsistency(copies);
  assert.equal(isConsistent, false, 'Tampered copy must fail consistency check');
});
