// TypeScript Domain Models for NextGen TMS (Milestone 3 Enhanced)
// Strict typing matching PostgreSQL schema (docs/DATABASE_SCHEMA.md)

export type UserRole = 'superadmin' | 'owner' | 'manager' | 'accountant' | 'driver' | 'vendor';

export type VehicleOwnership = 'owned' | 'attached' | 'market';
export type VehicleStatus = 'available' | 'in_transit' | 'maintenance' | 'out_of_service';
export type LRPaymentType = 'to_pay' | 'paid' | 'tbb';
export type LRStatus = 'draft' | 'generated' | 'dispatched' | 'delivered' | 'billed' | 'cancelled';
export type TripStatus = 'draft' | 'scheduled' | 'in_transit' | 'delivered' | 'closed' | 'cancelled';
export type ComplianceDocType = 'RC' | 'Insurance' | 'Fitness' | 'National_Permit' | 'PUC' | 'Road_Tax';
export type ComplianceStatus = 'VALID' | 'EXPIRING_SOON' | 'EXPIRED';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  gstin?: string;
  pan?: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  logoUrl?: string;
  subscriptionPlan: 'starter' | 'pro' | 'enterprise';
  isActive: boolean;
  createdAt: string;
}

export interface Branch {
  id: string;
  organizationId: string;
  name: string;
  branchCode: string;
  city: string;
  state: string;
  address?: string;
  contactPerson?: string;
  phone?: string;
  isHeadOffice: boolean;
}

export interface UserProfile {
  id: string;
  organizationId: string;
  branchId?: string;
  role: UserRole;
  fullName: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  isActive: boolean;
}

export interface ComplianceRecord {
  id: string;
  docType: ComplianceDocType;
  docNumber: string;
  validFrom: string;
  validUntil: string;
  daysRemaining: number;
  status: ComplianceStatus;
}

export interface VehicleMaintenanceLog {
  id: string;
  vehicleId: string;
  serviceDate: string;
  serviceType: string; // e.g. Engine Oil, Brake Overhaul, Tyre Replacement
  workshopName: string;
  cost: number;
  odometerKm: number;
  remarks?: string;
}

export interface Vehicle {
  id: string;
  organizationId: string;
  branchId?: string;
  vehicleNumber: string;
  vehicleType: string;
  ownershipType: VehicleOwnership;
  chassisNumber?: string;
  engineNumber?: string;
  carryingCapacityTon: number;
  status: VehicleStatus;
  odometerKm: number;
  assignedDriverId?: string;
  assignedDriverName?: string;
  complianceRecords: ComplianceRecord[];
  maintenanceLogs: VehicleMaintenanceLog[];
  rcExpiry?: string;
  fitnessExpiry?: string;
  insuranceExpiry?: string;
  permitExpiry?: string;
  pucExpiry?: string;
  createdAt: string;
}

export interface Driver {
  id: string;
  organizationId: string;
  fullName: string;
  phone: string;
  alternatePhone?: string;
  licenseNumber: string;
  licenseCategory: string; // e.g. HGMV, LMV, Trans
  licenseExpiryDate: string;
  licenseDaysRemaining: number;
  licenseStatus: ComplianceStatus;
  aadhaarMasked?: string; // e.g. 'XXXX-XXXX-8921'
  assignedVehicleId?: string;
  assignedVehicleNumber?: string;
  currentAdvanceBalance: number;
  monthlySalary: number;
  isActive: boolean;
  emergencyContact?: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  organizationId: string;
  companyName: string;
  contactName?: string;
  email?: string;
  phone: string;
  gstin?: string;
  billingAddress: string;
  outstandingBalance: number;
}

export interface Vendor {
  id: string;
  organizationId: string;
  vendorName: string;
  vendorType: 'Fuel_Station' | 'Truck_Broker' | 'Maintenance_Workshop' | 'Tyre_Vendor';
  contactPerson?: string;
  phone: string;
  gstin?: string;
  tdsRatePercent: number;
  outstandingPayable: number;
}

export interface LRConsignmentNote {
  id: string;
  organizationId: string;
  branchId: string;
  lrNumber: string;
  lrDate: string;
  consignorName: string;
  consignorAddress: string;
  consignorGstin?: string;
  consigneeName: string;
  consigneeAddress: string;
  consigneeGstin?: string;
  originCity: string;
  destinationCity: string;
  ewayBillNumber?: string;
  ewayBillValidUntil?: string;
  goodsDescription: string;
  packagesCount: number;
  packageType: string;
  actualWeightTon: number;
  chargedWeightTon: number;
  freightRatePerTon: number;
  totalFreightAmount: number;
  loadingCharges: number;
  unloadingCharges: number;
  insuranceCharges: number;
  netTotalAmount: number;
  paymentType: LRPaymentType;
  status: LRStatus;
  vehicleId?: string;
  vehicleNumber?: string;
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  createdAt: string;
}

export interface TripTimelineEvent {
  id: string;
  tripId: string;
  status: TripStatus;
  eventTitle: string;
  description: string;
  timestamp: string;
  location?: string;
  recordedBy: string;
}

export interface ProofOfDelivery {
  id: string;
  lrId: string;
  tripId: string;
  deliveredAt: string;
  podImageUrl: string;
  receivedByName: string;
  receivedByPhone?: string;
  shortageQuantity: number;
  damageRemarks?: string;
  status: 'pending_verification' | 'verified' | 'rejected';
  verifiedBy?: string;
  verifiedAt?: string;
  rejectionReason?: string;
  createdAt: string;
}

export interface Trip {
  id: string;
  organizationId: string;
  branchId?: string;
  tripNumber: string;
  vehicleId: string;
  vehicleNumber: string;
  driverId: string;
  driverName: string;
  driverPhone?: string;
  originCity: string;
  destinationCity: string;
  status: TripStatus;
  plannedDepartureDate?: string;
  expectedArrivalDate?: string;
  totalFreightRevenue: number;
  totalTripExpenses: number;
  netProfitLoss: number;
  assignedLRs: LRConsignmentNote[];
  startOdometerKm?: number;
  endOdometerKm?: number;
  timelineEvents: TripTimelineEvent[];
  podRecord?: ProofOfDelivery;
  cancellationReason?: string;
  cancelledBy?: string;
  cancelledAt?: string;
  createdAt: string;
}

export type ExpenseCategory = 'Fuel' | 'Toll_FASTag' | 'Loading' | 'Unloading' | 'Repair' | 'Driver_Allowance' | 'Miscellaneous';
export type PaymentMode = 'Cash' | 'Bank_Transfer' | 'UPI' | 'Fuel_Card' | 'Cheque';
export type TdsSection = '194C_INDIVIDUAL' | '194C_COMPANY' | '194C_6_EXEMPT' | '206AA_HIGHER';

export interface TripExpense {
  id: string;
  organizationId?: string;
  tripId: string;
  driverId?: string;
  expenseCategory: ExpenseCategory;
  amount: number;
  paidBy: 'Driver_Advance' | 'Company_Bank' | 'Fuel_Card';
  slipNumber?: string;
  vendorName?: string;
  receiptImageUrl?: string;
  isApproved: boolean;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  createdAt: string;
}

export interface DriverAdvance {
  id: string;
  organizationId?: string;
  driverId: string;
  driverName?: string;
  tripId?: string;
  tripNumber?: string;
  amount: number;
  paymentMode: PaymentMode;
  transactionRef?: string;
  disbursedAt: string;
  disbursedBy?: string;
  isSettled: boolean;
  settledAt?: string;
}

export interface DriverSettlement {
  id: string;
  organizationId: string;
  settlementNumber: string;
  driverId: string;
  driverName: string;
  tripId: string;
  tripNumber: string;
  settlementDate: string;
  totalAdvanceDisbursed: number;
  totalApprovedExpenses: number;
  totalRejectedExpenses: number;
  shortageDeductions: number;
  netPayableOrRecoverable: number; // positive = driver refunds company; negative = company pays driver
  settlementStatus: 'draft' | 'settled' | 'disputed';
  settledBy: string;
  remarks?: string;
  createdAt: string;
}

export interface VendorSettlement {
  id: string;
  organizationId: string;
  voucherNumber: string;
  vendorId: string;
  vendorName: string;
  vendorType: 'Fuel_Station' | 'Truck_Broker' | 'Maintenance_Workshop' | 'Tyre_Vendor';
  tripId?: string;
  tripNumber?: string;
  grossFreight: number;
  advancePaid: number;
  tdsSection: TdsSection;
  tdsRatePercent: number;
  tdsAmount: number;
  shortageDeductions: number;
  netPayable: number;
  settlementStatus: 'pending' | 'approved' | 'paid';
  panNumber?: string;
  paymentRef?: string;
  paymentDate?: string;
  remarks?: string;
  createdAt: string;
}

export interface CustomerInvoiceItem {
  lrId: string;
  lrNumber: string;
  lrDate: string;
  originCity: string;
  destinationCity: string;
  packagesCount: number;
  goodsDescription: string;
  chargedWeightTon: number;
  ratePerTon: number;
  freightAmount: number;
  surchargesAmount: number;
  netItemAmount: number;
}

export interface CustomerInvoice {
  id: string;
  organizationId?: string;
  branchId?: string;
  invoiceNumber: string;
  invoiceDate: string;
  customerId: string;
  customerName: string;
  customerGstin?: string;
  billingAddress: string;
  originState: string;
  destinationState: string;
  isRcmApplicable: boolean; // Reverse Charge Mechanism under GTA
  subtotalAmount: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  totalGstAmount: number;
  grandTotal: number;
  paidAmount: number;
  balanceAmount: number;
  paymentStatus: 'unpaid' | 'partially_paid' | 'paid';
  dueDate: string;
  includedLRs: string[];
  items?: CustomerInvoiceItem[];
  createdAt?: string;
}

export interface JournalEntryLine {
  accountName: string;
  accountType: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  debitAmount: number;
  creditAmount: number;
}

export interface JournalEntry {
  id: string;
  entryNumber: string;
  organizationId?: string;
  entryDate: string;
  description: string;
  referenceType: 'INVOICE' | 'DRIVER_ADVANCE' | 'DRIVER_SETTLEMENT' | 'VENDOR_SETTLEMENT' | 'TRIP_EXPENSE';
  referenceId: string;
  lines: JournalEntryLine[];
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
  createdAt: string;
}
