import test from 'node:test';
import assert from 'node:assert/strict';

import {
  calculateComplianceStatus,
  validateVehicleInput,
  isVehicleAvailableForTrip,
  validateDriverInput,
  isDriverAvailableForTrip,
  validateTripTransition,
  validatePODSubmissionInput,
  validatePODDecision,
  isInvoiceEligibleForLR,
} from '../src/lib/dispatch-engine.ts';

// 1. Compliance Calculator Tests
test('Compliance Engine - Categorizes Valid, Expiring Soon, and Expired Dates', () => {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 90);
  const validRes = calculateComplianceStatus(futureDate.toISOString().split('T')[0]);
  assert.equal(validRes.status, 'VALID');
  assert.ok(validRes.daysRemaining > 30);

  const soonDate = new Date();
  soonDate.setDate(soonDate.getDate() + 15);
  const soonRes = calculateComplianceStatus(soonDate.toISOString().split('T')[0]);
  assert.equal(soonRes.status, 'EXPIRING_SOON');
  assert.ok(soonRes.daysRemaining <= 30 && soonRes.daysRemaining > 0);

  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 5);
  const expiredRes = calculateComplianceStatus(pastDate.toISOString().split('T')[0]);
  assert.equal(expiredRes.status, 'EXPIRED');
  assert.ok(expiredRes.daysRemaining <= 0);
});

// 2. Vehicle Registration & Duplicate Prevention
test('Vehicle Validation - Accepts Valid Truck & Rejects Duplicates', () => {
  const existing = [
    { id: 'v1', vehicleNumber: 'RJ14-GB-4592', vehicleType: '12-Wheeler', carryingCapacityTon: 25, status: 'available' },
  ];

  const validTruck = {
    vehicleNumber: 'RJ14-GA-9900',
    vehicleType: '10-Wheeler',
    carryingCapacityTon: 16,
    ownershipType: 'owned',
  };
  const validRes = validateVehicleInput(validTruck, existing);
  assert.equal(validRes.isValid, true);

  const duplicateTruck = {
    vehicleNumber: 'rj14 gb 4592', // same number formatted differently
    vehicleType: '10-Wheeler',
    carryingCapacityTon: 16,
    ownershipType: 'owned',
  };
  const dupRes = validateVehicleInput(duplicateTruck, existing);
  assert.equal(dupRes.isValid, false);
  assert.ok(dupRes.errors.vehicleNumber, 'Must reject duplicate vehicle number');
});

test('Vehicle Validation - Rejects Zero or Negative Capacity', () => {
  const invalidCap = {
    vehicleNumber: 'HR55-AA-1234',
    vehicleType: 'Trailer',
    carryingCapacityTon: 0,
    ownershipType: 'market',
  };
  const res = validateVehicleInput(invalidCap, []);
  assert.equal(res.isValid, false);
  assert.ok(res.errors.carryingCapacityTon);
});

// 3. Vehicle Availability & Conflict Checks
test('Vehicle Availability - Blocks Vehicle Under Maintenance or Active Trip', () => {
  const maintenanceTruck = {
    id: 'v-maint',
    vehicleNumber: 'RJ14-MN-01',
    status: 'maintenance',
    carryingCapacityTon: 20,
  };
  const checkMaint = isVehicleAvailableForTrip(maintenanceTruck, []);
  assert.equal(checkMaint.isAvailable, false);
  assert.match(checkMaint.conflictReason, /maintenance/);

  const freeTruck = {
    id: 'v-free',
    vehicleNumber: 'RJ14-FR-02',
    status: 'available',
    carryingCapacityTon: 20,
  };
  const activeTrips = [
    { id: 't1', tripNumber: 'TRIP-101', vehicleId: 'v-free', status: 'in_transit' },
  ];
  const checkBusy = isVehicleAvailableForTrip(freeTruck, activeTrips);
  assert.equal(checkBusy.isAvailable, false);
  assert.match(checkBusy.conflictReason, /already allocated/);
});

// 4. Driver Validation & Conflict Checks
test('Driver Validation - Rejects Expired Driving Licence', () => {
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 10);

  const expiredDriver = {
    fullName: 'Ramesh Gurjar',
    phone: '+91 94140 12345',
    licenseNumber: 'RJ14 20100012345',
    licenseExpiryDate: pastDate.toISOString().split('T')[0],
  };

  const res = validateDriverInput(expiredDriver, []);
  assert.equal(res.isValid, false);
  assert.ok(res.errors.licenseExpiryDate, 'Must reject expired licence');
});

test('Driver Availability - Blocks Inactive Driver or Driver on Another Active Trip', () => {
  const inactiveDriver = {
    id: 'd-off',
    fullName: 'Suresh Kumar',
    isActive: false,
    licenseExpiryDate: '2029-01-01',
  };
  const resInactive = isDriverAvailableForTrip(inactiveDriver, []);
  assert.equal(resInactive.isAvailable, false);
  assert.match(resInactive.conflictReason, /inactive/);

  const activeDriver = {
    id: 'd-on',
    fullName: 'Mukesh Yadav',
    isActive: true,
    licenseExpiryDate: '2029-01-01',
  };
  const trips = [
    { id: 't1', tripNumber: 'TRIP-001', driverId: 'd-on', status: 'scheduled' },
  ];
  const resBusy = isDriverAvailableForTrip(activeDriver, trips);
  assert.equal(resBusy.isAvailable, false);
  assert.match(resBusy.conflictReason, /already assigned/);
});

// 5. Trip State Machine Transition Validation
test('Trip State Machine - Enforces Valid Forward Lifecycle (Draft -> Scheduled -> In Transit -> Delivered -> Closed)', () => {
  // 1. Draft -> Scheduled
  const resDraftToSched = validateTripTransition('draft', 'scheduled', {
    hasAssignedVehicle: true,
    hasAssignedDriver: true,
    hasAssignedLRs: true,
  });
  assert.equal(resDraftToSched.allowed, true);

  // Draft -> In Transit (Invalid direct jump)
  const resInvalidSkip = validateTripTransition('draft', 'in_transit', {});
  assert.equal(resInvalidSkip.allowed, false);

  // 2. Scheduled -> In Transit (Requires start odometer)
  const resSchedToTransit = validateTripTransition('scheduled', 'in_transit', {
    hasStartOdometer: true,
  });
  assert.equal(resSchedToTransit.allowed, true);

  // 3. In Transit -> Delivered
  const resTransitToDel = validateTripTransition('in_transit', 'delivered', {});
  assert.equal(resTransitToDel.allowed, true);

  // 4. Delivered -> Closed without verified POD is BLOCKED
  const resBlockClose = validateTripTransition('delivered', 'closed', {
    hasVerifiedPOD: false,
  });
  assert.equal(resBlockClose.allowed, false);
  assert.equal(resBlockClose.errors[0].code, 'UNVERIFIED_POD_BLOCK');

  // 5. Delivered -> Closed with verified POD is ALLOWED
  const resAllowClose = validateTripTransition('delivered', 'closed', {
    hasVerifiedPOD: true,
  });
  assert.equal(resAllowClose.allowed, true);
});

test('Trip Cancellation - Requires Minimum 5-Character Audit Reason', () => {
  const cancelNoReason = validateTripTransition('scheduled', 'cancelled', { cancellationReason: '' });
  assert.equal(cancelNoReason.allowed, false);

  const cancelValid = validateTripTransition('scheduled', 'cancelled', {
    cancellationReason: 'Consignor cancelled order due to plant closure',
  });
  assert.equal(cancelValid.allowed, true);
});

test('Trip Immutability - Closed and Cancelled Trips Cannot Change Status', () => {
  const closedRes = validateTripTransition('closed', 'in_transit', {});
  assert.equal(closedRes.allowed, false);
  assert.equal(closedRes.errors[0].code, 'TRIP_ALREADY_CLOSED');

  const cancelRes = validateTripTransition('cancelled', 'scheduled', {});
  assert.equal(cancelRes.allowed, false);
  assert.equal(cancelRes.errors[0].code, 'TRIP_ALREADY_CANCELLED');
});

// 6. Proof of Delivery (POD) Validation & Invoice Eligibility Gate
test('POD Verification - Rejection Requires Detailed Reason', () => {
  const checkApprove = validatePODDecision('verify');
  assert.equal(checkApprove.isValid, true);

  const checkRejectNoReason = validatePODDecision('reject', '');
  assert.equal(checkRejectNoReason.isValid, false);

  const checkRejectWithReason = validatePODDecision('reject', 'Receiving stamp is blurred and unreadable');
  assert.equal(checkRejectWithReason.isValid, true);
});

test('Invoice Gate - Blocks Invoice Generation Unless Verified POD Exists', () => {
  // Case A: No POD submitted
  const gateNoPod = isInvoiceEligibleForLR('lr-1', null);
  assert.equal(gateNoPod.isEligible, false);

  // Case B: Pending POD
  const gatePending = isInvoiceEligibleForLR('lr-1', { id: 'p1', status: 'pending_verification' });
  assert.equal(gatePending.isEligible, false);

  // Case C: Rejected POD
  const gateRejected = isInvoiceEligibleForLR('lr-1', { id: 'p1', status: 'rejected', rejectionReason: 'Signature mismatch' });
  assert.equal(gateRejected.isEligible, false);

  // Case D: Verified POD -> INVOICE UNLOCKED
  const gateVerified = isInvoiceEligibleForLR('lr-1', { id: 'p1', status: 'verified' });
  assert.equal(gateVerified.isEligible, true, 'Verified POD must unlock invoice generation');
});
