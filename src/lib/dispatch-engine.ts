// Fleet & Dispatch Core Engine
// Strict validation rules, state machine transitions, and compliance calculators
import type {
  TripStatus,
  Vehicle,
  Driver,
  Trip,
  ProofOfDelivery,
  ComplianceStatus,
} from '../types/tms.ts';

export interface DispatchEngineError {
  code: string;
  field?: string;
  message: string;
}

export interface TransitionValidationResult {
  allowed: boolean;
  errors: DispatchEngineError[];
  reason?: string;
}

// 1. Compliance Days Remaining & Status Calculator
export function calculateComplianceStatus(expiryDateStr: string, thresholdDays = 30): {
  daysRemaining: number;
  status: ComplianceStatus;
} {
  if (!expiryDateStr) {
    return { daysRemaining: -999, status: 'EXPIRED' };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiry = new Date(expiryDateStr);
  expiry.setHours(0, 0, 0, 0);

  const diffTime = expiry.getTime() - today.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let status: ComplianceStatus = 'VALID';
  if (daysRemaining <= 0) {
    status = 'EXPIRED';
  } else if (daysRemaining <= thresholdDays) {
    status = 'EXPIRING_SOON';
  }

  return { daysRemaining, status };
}

// 2. Vehicle Registration & Conflict Checks
export function validateVehicleInput(
  input: {
    vehicleNumber: string;
    vehicleType: string;
    carryingCapacityTon: number;
    ownershipType: string;
    rcExpiry?: string;
    insuranceExpiry?: string;
    fitnessExpiry?: string;
  },
  existingVehicles: Vehicle[] = []
): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (!input.vehicleNumber || input.vehicleNumber.trim().length < 4) {
    errors.vehicleNumber = 'Valid registration vehicle number is required.';
  } else {
    const formattedNumber = input.vehicleNumber.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    const isDuplicate = existingVehicles.some(
      (v) => v.vehicleNumber.toUpperCase().replace(/[^A-Z0-9]/g, '') === formattedNumber
    );
    if (isDuplicate) {
      errors.vehicleNumber = `Vehicle number "${input.vehicleNumber}" is already registered in this organization.`;
    }
  }

  if (!input.vehicleType || input.vehicleType.trim().length === 0) {
    errors.vehicleType = 'Vehicle type is required (e.g. 10-Wheeler, 12-Wheeler, Trailer).';
  }

  if (input.carryingCapacityTon === undefined || Number(input.carryingCapacityTon) <= 0) {
    errors.carryingCapacityTon = 'Carrying capacity must be greater than 0 Tons.';
  }

  if (input.insuranceExpiry) {
    const { status } = calculateComplianceStatus(input.insuranceExpiry);
    if (status === 'EXPIRED') {
      errors.insuranceExpiry = 'Insurance is expired. A valid future policy is required.';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function isVehicleAvailableForTrip(
  vehicle: Vehicle,
  activeTrips: Trip[] = []
): { isAvailable: boolean; conflictReason?: string } {
  if (vehicle.status === 'maintenance') {
    return { isAvailable: false, conflictReason: `Vehicle ${vehicle.vehicleNumber} is currently under maintenance.` };
  }
  if (vehicle.status === 'out_of_service') {
    return { isAvailable: false, conflictReason: `Vehicle ${vehicle.vehicleNumber} is marked out of service.` };
  }

  const activeTrip = activeTrips.find(
    (t) => t.vehicleId === vehicle.id && (t.status === 'scheduled' || t.status === 'in_transit')
  );

  if (activeTrip) {
    return {
      isAvailable: false,
      conflictReason: `Vehicle ${vehicle.vehicleNumber} is already allocated to active trip #${activeTrip.tripNumber} (${activeTrip.status}).`,
    };
  }

  return { isAvailable: true };
}

// 3. Driver Validation & Conflict Checks
export function validateDriverInput(
  input: {
    fullName: string;
    phone: string;
    licenseNumber: string;
    licenseExpiryDate: string;
    licenseCategory?: string;
  },
  existingDrivers: Driver[] = []
): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (!input.fullName || input.fullName.trim().length < 2) {
    errors.fullName = 'Full driver name is required.';
  }

  if (!input.phone || !/^\+?[0-9\s\-]{10,14}$/.test(input.phone.trim())) {
    errors.phone = 'Valid 10-digit driver mobile number is required.';
  }

  if (!input.licenseNumber || input.licenseNumber.trim().length < 5) {
    errors.licenseNumber = 'Valid commercial driving license number is required.';
  } else {
    const cleanLic = input.licenseNumber.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    const isDuplicate = existingDrivers.some(
      (d) => d.licenseNumber.toUpperCase().replace(/[^A-Z0-9]/g, '') === cleanLic
    );
    if (isDuplicate) {
      errors.licenseNumber = `Driver with license "${input.licenseNumber}" is already registered.`;
    }
  }

  if (!input.licenseExpiryDate) {
    errors.licenseExpiryDate = 'Driving license expiry date is required.';
  } else {
    const { status } = calculateComplianceStatus(input.licenseExpiryDate);
    if (status === 'EXPIRED') {
      errors.licenseExpiryDate = 'Driver license is expired. Renewal is mandatory before assignment.';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function isDriverAvailableForTrip(
  driver: Driver,
  activeTrips: Trip[] = []
): { isAvailable: boolean; conflictReason?: string } {
  if (!driver.isActive) {
    return { isAvailable: false, conflictReason: `Driver ${driver.fullName} is currently marked inactive.` };
  }

  const { status } = calculateComplianceStatus(driver.licenseExpiryDate);
  if (status === 'EXPIRED') {
    return { isAvailable: false, conflictReason: `Driver ${driver.fullName}'s driving licence has expired.` };
  }

  const activeTrip = activeTrips.find(
    (t) => t.driverId === driver.id && (t.status === 'scheduled' || t.status === 'in_transit')
  );

  if (activeTrip) {
    return {
      isAvailable: false,
      conflictReason: `Driver ${driver.fullName} is already assigned to active trip #${activeTrip.tripNumber}.`,
    };
  }

  return { isAvailable: true };
}

// 4. State Machine Transition Validator for Trips
// Lifecycle: Draft -> Scheduled -> In Transit -> Delivered -> Closed (or Cancelled)
export function validateTripTransition(
  currentStatus: TripStatus,
  targetStatus: TripStatus,
  context: {
    hasAssignedVehicle?: boolean;
    hasAssignedDriver?: boolean;
    hasAssignedLRs?: boolean;
    hasStartOdometer?: boolean;
    hasEndOdometer?: boolean;
    hasVerifiedPOD?: boolean;
    cancellationReason?: string;
  }
): TransitionValidationResult {
  const errors: DispatchEngineError[] = [];

  // No-op same state
  if (currentStatus === targetStatus) {
    return { allowed: true, errors: [] };
  }

  // Once closed or cancelled, trip cannot change status
  if (currentStatus === 'closed') {
    return {
      allowed: false,
      errors: [{ code: 'TRIP_ALREADY_CLOSED', message: 'Closed trips are immutable and cannot be re-opened.' }],
    };
  }
  if (currentStatus === 'cancelled') {
    return {
      allowed: false,
      errors: [{ code: 'TRIP_ALREADY_CANCELLED', message: 'Cancelled trips cannot undergo further status transitions.' }],
    };
  }

  // Handle Cancellation Workflow
  if (targetStatus === 'cancelled') {
    if (!context.cancellationReason || context.cancellationReason.trim().length < 5) {
      errors.push({
        code: 'MISSING_CANCELLATION_REASON',
        field: 'cancellationReason',
        message: 'A detailed cancellation audit reason (minimum 5 characters) is mandatory.',
      });
    }
    return {
      allowed: errors.length === 0,
      errors,
      reason: context.cancellationReason,
    };
  }

  // Enforce Forward Pipeline
  switch (currentStatus) {
    case 'draft':
      if (targetStatus !== 'scheduled') {
        errors.push({
          code: 'INVALID_TRANSITION',
          message: `Cannot transition draft trip directly to "${targetStatus}". Must be "scheduled" first.`,
        });
      }
      if (!context.hasAssignedVehicle) {
        errors.push({ code: 'MISSING_VEHICLE', field: 'vehicleId', message: 'A vehicle must be assigned before scheduling.' });
      }
      if (!context.hasAssignedDriver) {
        errors.push({ code: 'MISSING_DRIVER', field: 'driverId', message: 'A driver must be assigned before scheduling.' });
      }
      if (!context.hasAssignedLRs) {
        errors.push({ code: 'MISSING_LRS', field: 'assignedLRs', message: 'At least one consignment (LR) must be linked to schedule.' });
      }
      break;

    case 'scheduled':
      if (targetStatus !== 'in_transit') {
        errors.push({
          code: 'INVALID_TRANSITION',
          message: `Scheduled trip can only transition to "in_transit" (or "cancelled").`,
        });
      }
      if (!context.hasStartOdometer) {
        errors.push({ code: 'MISSING_START_ODOMETER', field: 'startOdometerKm', message: 'Starting odometer reading is required for dispatch.' });
      }
      break;

    case 'in_transit':
      if (targetStatus !== 'delivered') {
        errors.push({
          code: 'INVALID_TRANSITION',
          message: `In-transit trip can only transition to "delivered" upon arrival.`,
        });
      }
      break;

    case 'delivered':
      if (targetStatus !== 'closed') {
        errors.push({
          code: 'INVALID_TRANSITION',
          message: `Delivered trip can only transition to "closed" after accounting and POD verification.`,
        });
      }
      if (!context.hasVerifiedPOD) {
        errors.push({
          code: 'UNVERIFIED_POD_BLOCK',
          message: 'Cannot close trip without an approved / verified Proof of Delivery (POD) record.',
        });
      }
      break;

    default:
      errors.push({ code: 'UNKNOWN_STATE', message: `Unknown current status: ${currentStatus}` });
  }

  return {
    allowed: errors.length === 0,
    errors,
  };
}

// 5. Proof of Delivery (POD) Validation & Verification Gates
export function validatePODSubmissionInput(input: {
  receiverName: string;
  deliveredAt: string;
  podImageUrl: string;
  shortageQuantity?: number;
}): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (!input.receiverName || input.receiverName.trim().length < 2) {
    errors.receiverName = 'Receiver name / Authorized store manager is required.';
  }

  if (!input.deliveredAt) {
    errors.deliveredAt = 'Delivery timestamp is required.';
  }

  if (!input.podImageUrl || input.podImageUrl.trim().length < 5) {
    errors.podImageUrl = 'Signed and stamped POD photograph/document is required.';
  }

  if (input.shortageQuantity !== undefined && Number(input.shortageQuantity) < 0) {
    errors.shortageQuantity = 'Shortage package count cannot be negative.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validatePODDecision(
  decision: 'verify' | 'reject',
  reason?: string
): { isValid: boolean; error?: string } {
  if (decision === 'reject' && (!reason || reason.trim().length < 5)) {
    return {
      isValid: false,
      error: 'Rejection reason is mandatory (e.g. "Signature missing", "Stamp unreadable", "Damaged goods disputed").',
    };
  }
  return { isValid: true };
}

// 6. Invoice Gate Rule: An LR can only be invoiced if a verified POD exists
export function isInvoiceEligibleForLR(
  lrId: string,
  pod?: ProofOfDelivery | null
): { isEligible: boolean; reason?: string } {
  if (!pod) {
    return {
      isEligible: false,
      reason: 'No Proof of Delivery (POD) has been submitted for this consignment.',
    };
  }

  if (pod.status === 'pending_verification') {
    return {
      isEligible: false,
      reason: 'POD is pending verification by the accounts/dispatch manager.',
    };
  }

  if (pod.status === 'rejected') {
    return {
      isEligible: false,
      reason: `POD was rejected: ${pod.rejectionReason || 'Requires resubmission'}`,
    };
  }

  if (pod.status === 'verified') {
    return { isEligible: true };
  }

  return { isEligible: false, reason: 'Invalid POD status' };
}
