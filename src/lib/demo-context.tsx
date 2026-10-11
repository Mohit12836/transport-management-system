'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  UserRole,
  LRConsignmentNote,
  Vehicle,
  Driver,
  Trip,
  CustomerInvoice,
  CustomerInvoiceItem,
  Organization,
  ProofOfDelivery,
  TripStatus,
  TripTimelineEvent,
  DriverAdvance,
  TripExpense,
  DriverSettlement,
  VendorSettlement,
  JournalEntry,
  TdsSection,
  PaymentMode,
  ExpenseCategory,
} from '../types/tms';
import {
  DEMO_ORGANIZATION,
  DEMO_VEHICLES,
  DEMO_DRIVERS,
  DEMO_LRS,
  DEMO_TRIPS,
  DEMO_INVOICES,
  DEMO_PODS,
  DEMO_DRIVER_ADVANCES,
  DEMO_TRIP_EXPENSES,
  DEMO_DRIVER_SETTLEMENTS,
  DEMO_VENDOR_SETTLEMENTS,
  DEMO_JOURNAL_ENTRIES,
} from './mock-tms-data';
import {
  validateVehicleInput,
  validateDriverInput,
  isVehicleAvailableForTrip,
  isDriverAvailableForTrip,
  validateTripTransition,
  validatePODSubmissionInput,
  validatePODDecision,
  calculateComplianceStatus,
} from './dispatch-engine';
import {
  calculateDriverTripSettlement,
  detectDuplicateExpense,
  validateLRInvoiceEligibility,
  generateJournalEntryForDriverAdvance,
  generateJournalEntryForDriverSettlement,
  generateJournalEntryForCustomerInvoice,
} from './financial-engine';
import { calculateGstBreakdown, calculateTds194C, roundToCurrency } from './tax-rules';
import { api } from './api-client';

interface DemoContextType {
  isDemoMode: boolean;
  setIsDemoMode: (val: boolean) => void;
  isServerSyncing: boolean;
  syncStatus: { lastSync?: string; error?: string };
  syncWithBackend: () => Promise<{ success: boolean; error?: string }>;
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  organization: Organization;
  vehicles: Vehicle[];
  drivers: Driver[];
  lrs: LRConsignmentNote[];
  trips: Trip[];
  pods: ProofOfDelivery[];
  invoices: CustomerInvoice[];
  advances: DriverAdvance[];
  expenses: TripExpense[];
  driverSettlements: DriverSettlement[];
  vendorSettlements: VendorSettlement[];
  journalEntries: JournalEntry[];

  // Modal target selections
  activeLRForPrint: LRConsignmentNote | null;
  selectedVehicleForModal: Vehicle | null;
  selectedDriverForModal: Driver | null;
  selectedTripForModal: Trip | null;
  activeInvoiceForPrint: CustomerInvoice | null;
  activeDriverSettlementForPrint: DriverSettlement | null;
  activeVendorSettlementForPrint: VendorSettlement | null;

  // Modals & Navigation triggers
  openLRPrint: (lr: LRConsignmentNote) => void;
  closeLRPrint: () => void;
  openVehicleDetails: (v: Vehicle) => void;
  closeVehicleDetails: () => void;
  openDriverDetails: (d: Driver) => void;
  closeDriverDetails: () => void;
  openTripDetails: (t: Trip) => void;
  closeTripDetails: () => void;
  openInvoicePrint: (inv: CustomerInvoice) => void;
  closeInvoicePrint: () => void;
  openDriverSettlementPrint: (s: DriverSettlement) => void;
  closeDriverSettlementPrint: () => void;
  openVendorSettlementPrint: (vs: VendorSettlement) => void;
  closeVendorSettlementPrint: () => void;

  // Fleet & Dispatch Actions
  createNewLR: (newLR: Omit<LRConsignmentNote, 'id' | 'createdAt'>) => LRConsignmentNote;
  registerVehicle: (v: Omit<Vehicle, 'id' | 'complianceRecords' | 'maintenanceLogs' | 'createdAt'>) => { success: boolean; vehicle?: Vehicle; error?: string };
  registerDriver: (d: Omit<Driver, 'id' | 'licenseDaysRemaining' | 'licenseStatus' | 'createdAt'>) => { success: boolean; driver?: Driver; error?: string };
  createAndScheduleTrip: (input: {
    vehicleId: string;
    driverId: string;
    originCity: string;
    destinationCity: string;
    assignedLRIds: string[];
    plannedDepartureDate?: string;
    expectedArrivalDate?: string;
    startOdometerKm?: number;
  }) => { success: boolean; trip?: Trip; error?: string };
  advanceTripStatus: (tripId: string, targetStatus: TripStatus, options?: { odometerKm?: number; location?: string; note?: string }) => { success: boolean; error?: string };
  cancelTrip: (tripId: string, reason: string) => { success: boolean; error?: string };
  submitPOD: (tripId: string, lrId: string, input: { receiverName: string; receiverPhone?: string; shortageQuantity: number; damageRemarks?: string; podImageUrl: string }) => { success: boolean; pod?: ProofOfDelivery; error?: string };
  reviewPODDecision: (podId: string, decision: 'verify' | 'reject', rejectionReason?: string) => { success: boolean; error?: string };

  // Financial Engine Actions
  addDriverAdvance: (input: {
    driverId: string;
    tripId?: string;
    amount: number;
    paymentMode: PaymentMode;
    transactionRef?: string;
  }) => { success: boolean; advance?: DriverAdvance; error?: string };
  submitTripExpense: (input: {
    tripId: string;
    driverId?: string;
    expenseCategory: ExpenseCategory;
    amount: number;
    paidBy: 'Driver_Advance' | 'Company_Bank' | 'Fuel_Card';
    slipNumber?: string;
    vendorName?: string;
    receiptImageUrl?: string;
  }) => { success: boolean; expense?: TripExpense; error?: string };
  approveTripExpense: (expenseId: string) => { success: boolean; error?: string };
  rejectTripExpense: (expenseId: string, reason: string) => { success: boolean; error?: string };
  createDriverSettlement: (input: {
    driverId: string;
    tripId: string;
    shortageDeductions: number;
    remarks?: string;
  }) => { success: boolean; settlement?: DriverSettlement; error?: string };
  createCustomerInvoice: (input: {
    customerId: string;
    customerName: string;
    customerGstin?: string;
    billingAddress: string;
    originState: string;
    destinationState: string;
    isRcmApplicable: boolean;
    selectedLRIds: string[];
    dueDate: string;
  }) => { success: boolean; invoice?: CustomerInvoice; error?: string };
  createVendorSettlement: (input: {
    vendorId: string;
    vendorName: string;
    vendorType: 'Fuel_Station' | 'Truck_Broker' | 'Maintenance_Workshop' | 'Tyre_Vendor';
    tripId?: string;
    grossFreight: number;
    advancePaid: number;
    tdsSection: TdsSection;
    tdsRatePercent: number;
    shortageDeductions: number;
    panNumber?: string;
    paymentRef?: string;
    paymentDate?: string;
    remarks?: string;
  }) => { success: boolean; voucher?: VendorSettlement; error?: string };
  recordTripOdometer: (tripId: string, type: 'start' | 'end', odometerKm: number) => { success: boolean; error?: string };

  resetToDefaultDemo: () => void;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);
const LOCAL_STORAGE_KEY = 'nextgen_tms_demo_state_v4';

export const DemoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeRole, setActiveRoleState] = useState<UserRole>('owner');
  const [vehicles, setVehicles] = useState<Vehicle[]>(DEMO_VEHICLES);
  const [drivers, setDrivers] = useState<Driver[]>(DEMO_DRIVERS);
  const [lrs, setLrs] = useState<LRConsignmentNote[]>(DEMO_LRS);
  const [trips, setTrips] = useState<Trip[]>(DEMO_TRIPS);
  const [pods, setPods] = useState<ProofOfDelivery[]>(DEMO_PODS);
  const [invoices, setInvoices] = useState<CustomerInvoice[]>(DEMO_INVOICES);
  const [advances, setAdvances] = useState<DriverAdvance[]>(DEMO_DRIVER_ADVANCES);
  const [expenses, setExpenses] = useState<TripExpense[]>(DEMO_TRIP_EXPENSES);
  const [driverSettlements, setDriverSettlements] = useState<DriverSettlement[]>(DEMO_DRIVER_SETTLEMENTS);
  const [vendorSettlements, setVendorSettlements] = useState<VendorSettlement[]>(DEMO_VENDOR_SETTLEMENTS);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(DEMO_JOURNAL_ENTRIES);

  // Modal active states
  const [activeLRForPrint, setActiveLRForPrint] = useState<LRConsignmentNote | null>(null);
  const [selectedVehicleForModal, setSelectedVehicleForModal] = useState<Vehicle | null>(null);
  const [selectedDriverForModal, setSelectedDriverForModal] = useState<Driver | null>(null);
  const [selectedTripForModal, setSelectedTripForModal] = useState<Trip | null>(null);
  const [activeInvoiceForPrint, setActiveInvoiceForPrint] = useState<CustomerInvoice | null>(null);
  const [activeDriverSettlementForPrint, setActiveDriverSettlementForPrint] = useState<DriverSettlement | null>(null);
  const [activeVendorSettlementForPrint, setActiveVendorSettlementForPrint] = useState<VendorSettlement | null>(null);

  const [isDemoMode, setIsDemoModeState] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    try {
      const mode = localStorage.getItem('nextgen_tms_mode');
      return mode !== 'live';
    } catch {
      return true;
    }
  });
  const [isServerSyncing, setIsServerSyncing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<{ lastSync?: string; error?: string }>({});

  const syncWithBackend = async (): Promise<{ success: boolean; error?: string }> => {
    setIsServerSyncing(true);
    try {
      const [lrsRes, vehRes, drvRes, tripsRes, invRes, billsRes] = await Promise.allSettled([
        api.getLRs(),
        api.getVehicles(),
        api.getDrivers(),
        api.getTrips(),
        api.getInvoices(),
        api.getVendorBills(),
      ]);

      if (lrsRes.status === 'fulfilled' && lrsRes.value.success && Array.isArray(lrsRes.value.data)) {
        if (lrsRes.value.data.length > 0) setLrs(lrsRes.value.data);
      }
      if (vehRes.status === 'fulfilled' && vehRes.value.success && Array.isArray(vehRes.value.data)) {
        if (vehRes.value.data.length > 0) setVehicles(vehRes.value.data);
      }
      if (drvRes.status === 'fulfilled' && drvRes.value.success && Array.isArray(drvRes.value.data)) {
        if (drvRes.value.data.length > 0) setDrivers(drvRes.value.data);
      }
      if (tripsRes.status === 'fulfilled' && tripsRes.value.success && Array.isArray(tripsRes.value.data)) {
        if (tripsRes.value.data.length > 0) setTrips(tripsRes.value.data);
      }
      if (invRes.status === 'fulfilled' && invRes.value.success && Array.isArray(invRes.value.data)) {
        if (invRes.value.data.length > 0) setInvoices(invRes.value.data);
      }
      if (billsRes.status === 'fulfilled' && billsRes.value.success && Array.isArray(billsRes.value.data)) {
        if (billsRes.value.data.length > 0) setVendorSettlements(billsRes.value.data);
      }

      const now = new Date().toLocaleTimeString();
      setSyncStatus({ lastSync: now });
      return { success: true };
    } catch (err: any) {
      const msg = err.message || 'Server sync failed';
      setSyncStatus({ error: msg });
      return { success: false, error: msg };
    } finally {
      setIsServerSyncing(false);
    }
  };

  const setIsDemoMode = (val: boolean) => {
    setIsDemoModeState(val);
    try {
      localStorage.setItem('nextgen_tms_mode', val ? 'demo' : 'live');
    } catch {}
    if (!val) {
      syncWithBackend();
    }
  };

  // Load from local storage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.vehicles) setVehicles(parsed.vehicles);
        if (parsed.drivers) setDrivers(parsed.drivers);
        if (parsed.lrs) setLrs(parsed.lrs);
        if (parsed.trips) setTrips(parsed.trips);
        if (parsed.pods) setPods(parsed.pods);
        if (parsed.invoices) setInvoices(parsed.invoices);
        if (parsed.advances) setAdvances(parsed.advances);
        if (parsed.expenses) setExpenses(parsed.expenses);
        if (parsed.driverSettlements) setDriverSettlements(parsed.driverSettlements);
        if (parsed.vendorSettlements) setVendorSettlements(parsed.vendorSettlements);
        if (parsed.journalEntries) setJournalEntries(parsed.journalEntries);
        if (parsed.activeRole) setActiveRoleState(parsed.activeRole);
      }
      const mode = localStorage.getItem('nextgen_tms_mode');
      if (mode === 'live') {
        syncWithBackend();
      }
    } catch {}
  }, []);

  const persistState = (
    v = vehicles,
    d = drivers,
    l = lrs,
    t = trips,
    p = pods,
    inv = invoices,
    adv = advances,
    exp = expenses,
    ds = driverSettlements,
    vs = vendorSettlements,
    je = journalEntries,
    role = activeRole
  ) => {
    try {
      localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify({
          vehicles: v,
          drivers: d,
          lrs: l,
          trips: t,
          pods: p,
          invoices: inv,
          advances: adv,
          expenses: exp,
          driverSettlements: ds,
          vendorSettlements: vs,
          journalEntries: je,
          activeRole: role,
        })
      );
    } catch {}
  };

  const setActiveRole = (role: UserRole) => {
    setActiveRoleState(role);
    persistState(
      vehicles,
      drivers,
      lrs,
      trips,
      pods,
      invoices,
      advances,
      expenses,
      driverSettlements,
      vendorSettlements,
      journalEntries,
      role
    );
  };

  // 1. Create New LR
  const createNewLR = (newLRData: Omit<LRConsignmentNote, 'id' | 'createdAt'>): LRConsignmentNote => {
    const newLR: LRConsignmentNote = {
      ...newLRData,
      id: `lr-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const updatedLrs = [newLR, ...lrs];
    setLrs(updatedLrs);
    persistState(vehicles, drivers, updatedLrs, trips, pods, invoices, advances, expenses, driverSettlements, vendorSettlements, journalEntries);
    if (!isDemoMode || (typeof window !== 'undefined' && localStorage.getItem('tms_auth_token'))) {
      api.createLR(newLR).catch(() => {});
    }
    return newLR;
  };

  // 2. Register Vehicle
  const registerVehicle = (vData: Omit<Vehicle, 'id' | 'complianceRecords' | 'maintenanceLogs' | 'createdAt'>) => {
    const validation = validateVehicleInput(vData, vehicles);
    if (!validation.isValid) {
      return { success: false, error: Object.values(validation.errors)[0] || 'Invalid vehicle details' };
    }

    const defaultCompliance = [
      { docType: 'Insurance' as const, expiry: vData.insuranceExpiry },
      { docType: 'Fitness' as const, expiry: vData.fitnessExpiry },
      { docType: 'RC' as const, expiry: vData.rcExpiry },
      { docType: 'National_Permit' as const, expiry: vData.permitExpiry },
      { docType: 'PUC' as const, expiry: vData.pucExpiry },
    ]
      .filter((c) => !!c.expiry)
      .map((c, idx) => {
        const comp = calculateComplianceStatus(c.expiry!);
        return {
          id: `comp-gen-${Date.now()}-${idx}`,
          docType: c.docType,
          docNumber: `DOC-${vData.vehicleNumber.replace(/[^A-Za-z0-9]/g, '')}-${idx + 1}`,
          validFrom: new Date().toISOString().split('T')[0],
          validUntil: c.expiry!,
          daysRemaining: comp.daysRemaining,
          status: comp.status,
        };
      });

    const newVehicle: Vehicle = {
      ...vData,
      id: `veh-${Date.now()}`,
      complianceRecords: defaultCompliance,
      maintenanceLogs: [],
      createdAt: new Date().toISOString(),
    };

    const updated = [newVehicle, ...vehicles];
    setVehicles(updated);
    persistState(updated, drivers, lrs, trips, pods, invoices, advances, expenses, driverSettlements, vendorSettlements, journalEntries);
    if (!isDemoMode || (typeof window !== 'undefined' && localStorage.getItem('tms_auth_token'))) {
      api.createVehicle(newVehicle).catch(() => {});
    }
    return { success: true, vehicle: newVehicle };
  };

  // 3. Register Driver
  const registerDriver = (dData: Omit<Driver, 'id' | 'licenseDaysRemaining' | 'licenseStatus' | 'createdAt'>) => {
    const validation = validateDriverInput(dData, drivers);
    if (!validation.isValid) {
      return { success: false, error: Object.values(validation.errors)[0] || 'Invalid driver details' };
    }

    const comp = calculateComplianceStatus(dData.licenseExpiryDate);
    const newDriver: Driver = {
      ...dData,
      id: `drv-${Date.now()}`,
      licenseDaysRemaining: comp.daysRemaining,
      licenseStatus: comp.status,
      createdAt: new Date().toISOString(),
    };

    const updated = [newDriver, ...drivers];
    setDrivers(updated);
    persistState(vehicles, updated, lrs, trips, pods, invoices, advances, expenses, driverSettlements, vendorSettlements, journalEntries);
    if (!isDemoMode || (typeof window !== 'undefined' && localStorage.getItem('tms_auth_token'))) {
      api.createDriver(newDriver).catch(() => {});
    }
    return { success: true, driver: newDriver };
  };

  // 4. Create and Schedule Trip
  const createAndScheduleTrip = (input: {
    vehicleId: string;
    driverId: string;
    originCity: string;
    destinationCity: string;
    assignedLRIds: string[];
    plannedDepartureDate?: string;
    expectedArrivalDate?: string;
    startOdometerKm?: number;
  }) => {
    const vehicle = vehicles.find((v) => v.id === input.vehicleId);
    const driver = drivers.find((d) => d.id === input.driverId);

    if (!vehicle) return { success: false, error: 'Vehicle not found.' };
    if (!driver) return { success: false, error: 'Driver not found.' };

    const vehAvail = isVehicleAvailableForTrip(vehicle, trips);
    if (!vehAvail.isAvailable) return { success: false, error: vehAvail.conflictReason };

    const drvAvail = isDriverAvailableForTrip(driver, trips);
    if (!drvAvail.isAvailable) return { success: false, error: drvAvail.conflictReason };

    const selectedLRs = lrs.filter((l) => input.assignedLRIds.includes(l.id));
    const totalRevenue = selectedLRs.reduce((sum, l) => sum + (l.netTotalAmount || 0), 0);

    const tripId = `trip-${Date.now()}`;
    const tripNumber = `TRIP-2026-${Math.floor(100 + Math.random() * 900)}`;

    const initialEvent: TripTimelineEvent = {
      id: `evt-${Date.now()}-1`,
      tripId,
      status: 'scheduled',
      eventTitle: 'Trip Scheduled & Manifest Created',
      description: `Assigned vehicle ${vehicle.vehicleNumber} and driver ${driver.fullName}. Cargo: ${selectedLRs.length} LRs.`,
      timestamp: new Date().toISOString(),
      location: `${input.originCity} Hub`,
      recordedBy: `${activeRole.toUpperCase()} (Operations Dispatch)`,
    };

    const newTrip: Trip = {
      id: tripId,
      organizationId: DEMO_ORGANIZATION.id,
      tripNumber,
      vehicleId: vehicle.id,
      vehicleNumber: vehicle.vehicleNumber,
      driverId: driver.id,
      driverName: driver.fullName,
      driverPhone: driver.phone,
      originCity: input.originCity,
      destinationCity: input.destinationCity,
      status: 'scheduled',
      plannedDepartureDate: input.plannedDepartureDate,
      expectedArrivalDate: input.expectedArrivalDate,
      totalFreightRevenue: totalRevenue,
      totalTripExpenses: 0,
      netProfitLoss: totalRevenue,
      assignedLRs: selectedLRs,
      startOdometerKm: input.startOdometerKm || vehicle.odometerKm,
      timelineEvents: [initialEvent],
      createdAt: new Date().toISOString(),
    };

    const updatedLrs = lrs.map((lr) => {
      if (input.assignedLRIds.includes(lr.id)) {
        return {
          ...lr,
          status: 'dispatched' as const,
          vehicleId: vehicle.id,
          vehicleNumber: vehicle.vehicleNumber,
          driverId: driver.id,
          driverName: driver.fullName,
        };
      }
      return lr;
    });

    const updatedVehicles = vehicles.map((v) =>
      v.id === vehicle.id ? { ...v, status: 'in_transit' as const, assignedDriverId: driver.id, assignedDriverName: driver.fullName } : v
    );

    const updatedDrivers = drivers.map((d) =>
      d.id === driver.id ? { ...d, assignedVehicleId: vehicle.id, assignedVehicleNumber: vehicle.vehicleNumber } : d
    );

    const updatedTrips = [newTrip, ...trips];

    setTrips(updatedTrips);
    setLrs(updatedLrs);
    setVehicles(updatedVehicles);
    setDrivers(updatedDrivers);
    persistState(updatedVehicles, updatedDrivers, updatedLrs, updatedTrips, pods, invoices, advances, expenses, driverSettlements, vendorSettlements, journalEntries);

    if (!isDemoMode || (typeof window !== 'undefined' && localStorage.getItem('tms_auth_token'))) {
      api.scheduleTrip(newTrip).catch(() => {});
    }

    return { success: true, trip: newTrip };
  };

  // 5. Advance Trip Status
  const advanceTripStatus = (
    tripId: string,
    targetStatus: TripStatus,
    options?: { odometerKm?: number; location?: string; note?: string }
  ) => {
    const trip = trips.find((t) => t.id === tripId);
    if (!trip) return { success: false, error: 'Trip not found.' };

    const transitionCheck = validateTripTransition(trip.status, targetStatus, {
      hasVerifiedPOD: trip.podRecord?.status === 'verified',
      hasAssignedLRs: trip.assignedLRs.length > 0,
    });

    if (!transitionCheck.allowed) {
      return { success: false, error: transitionCheck.errors[0]?.message || 'Invalid state transition.' };
    }

    const newEvent: TripTimelineEvent = {
      id: `evt-${Date.now()}`,
      tripId,
      status: targetStatus,
      eventTitle: `Trip transitioned to ${targetStatus.toUpperCase().replace('_', ' ')}`,
      description: options?.note || `Odometer: ${options?.odometerKm || 'N/A'} KM. Status updated by ${activeRole}.`,
      timestamp: new Date().toISOString(),
      location: options?.location || `${trip.destinationCity} Gateway`,
      recordedBy: `${activeRole.toUpperCase()} (Operations)`,
    };

    let updatedEndOdo = trip.endOdometerKm;
    if (targetStatus === 'delivered' && options?.odometerKm) {
      updatedEndOdo = options.odometerKm;
    }

    const updatedTrips = trips.map((t) => {
      if (t.id !== tripId) return t;
      return {
        ...t,
        status: targetStatus,
        endOdometerKm: updatedEndOdo,
        timelineEvents: [newEvent, ...t.timelineEvents],
      };
    });

    let updatedVehicles = vehicles;
    let updatedDrivers = drivers;

    if (targetStatus === 'closed') {
      updatedVehicles = vehicles.map((v) =>
        v.id === trip.vehicleId
          ? {
              ...v,
              status: 'available' as const,
              odometerKm: updatedEndOdo || v.odometerKm,
              assignedDriverId: undefined,
              assignedDriverName: undefined,
            }
          : v
      );
      updatedDrivers = drivers.map((d) =>
        d.id === trip.driverId
          ? { ...d, assignedVehicleId: undefined, assignedVehicleNumber: undefined }
          : d
      );
    }

    setTrips(updatedTrips);
    setVehicles(updatedVehicles);
    setDrivers(updatedDrivers);
    persistState(updatedVehicles, updatedDrivers, lrs, updatedTrips, pods, invoices, advances, expenses, driverSettlements, vendorSettlements, journalEntries);

    if (!isDemoMode || (typeof window !== 'undefined' && localStorage.getItem('tms_auth_token'))) {
      api.updateTripStatus(tripId, {
        targetStatus,
        odometerKm: options?.odometerKm,
        location: options?.location,
        reason: options?.note,
      }).catch(() => {});
    }

    return { success: true };
  };

  // 6. Cancel Trip
  const cancelTrip = (tripId: string, reason: string) => {
    if (!reason || reason.trim().length < 5) {
      return { success: false, error: 'Cancellation requires a detailed reason of at least 5 characters.' };
    }
    const trip = trips.find((t) => t.id === tripId);
    if (!trip) return { success: false, error: 'Trip not found.' };

    if (trip.status === 'closed' || trip.status === 'cancelled') {
      return { success: false, error: `Trip is already ${trip.status} and cannot be cancelled.` };
    }

    const updatedTrips = trips.map((t) => {
      if (t.id !== tripId) return t;
      return {
        ...t,
        status: 'cancelled' as const,
        cancellationReason: reason,
        cancelledBy: `${activeRole.toUpperCase()} (Operations)`,
        cancelledAt: new Date().toISOString(),
      };
    });

    const updatedVehicles = vehicles.map((v) =>
      v.id === trip.vehicleId ? { ...v, status: 'available' as const, assignedDriverId: undefined, assignedDriverName: undefined } : v
    );
    const updatedDrivers = drivers.map((d) =>
      d.id === trip.driverId ? { ...d, assignedVehicleId: undefined, assignedVehicleNumber: undefined } : d
    );

    setTrips(updatedTrips);
    setVehicles(updatedVehicles);
    setDrivers(updatedDrivers);
    persistState(updatedVehicles, updatedDrivers, lrs, updatedTrips, pods, invoices, advances, expenses, driverSettlements, vendorSettlements, journalEntries);

    if (!isDemoMode || (typeof window !== 'undefined' && localStorage.getItem('tms_auth_token'))) {
      api.updateTripStatus(tripId, { targetStatus: 'cancelled', reason }).catch(() => {});
    }

    return { success: true };
  };

  // 7. Submit POD
  const submitPOD = (
    tripId: string,
    lrId: string,
    input: { receiverName: string; receiverPhone?: string; shortageQuantity: number; damageRemarks?: string; podImageUrl: string }
  ) => {
    const validation = validatePODSubmissionInput({
      receiverName: input.receiverName,
      deliveredAt: new Date().toISOString(),
      podImageUrl: input.podImageUrl,
      shortageQuantity: input.shortageQuantity,
    });
    if (!validation.isValid) {
      return { success: false, error: Object.values(validation.errors)[0] || 'Invalid POD submission data.' };
    }

    const newPOD: ProofOfDelivery = {
      id: `pod-${Date.now()}`,
      lrId,
      tripId,
      deliveredAt: new Date().toISOString(),
      podImageUrl: input.podImageUrl,
      receivedByName: input.receiverName,
      receivedByPhone: input.receiverPhone,
      shortageQuantity: input.shortageQuantity,
      damageRemarks: input.damageRemarks,
      status: 'pending_verification',
      createdAt: new Date().toISOString(),
    };

    const updatedPods = [newPOD, ...pods.filter((p) => p.lrId !== lrId)];

    const updatedTrips = trips.map((t) => {
      if (t.id !== tripId) return t;
      return {
        ...t,
        podRecord: newPOD,
        status: t.status === 'in_transit' ? ('delivered' as const) : t.status,
      };
    });

    setPods(updatedPods);
    setTrips(updatedTrips);
    persistState(vehicles, drivers, lrs, updatedTrips, updatedPods, invoices, advances, expenses, driverSettlements, vendorSettlements, journalEntries);

    if (!isDemoMode || (typeof window !== 'undefined' && localStorage.getItem('tms_auth_token'))) {
      api.submitPOD(tripId, {
        lrId,
        receiverName: input.receiverName,
        receiverPhone: input.receiverPhone,
        shortageQuantity: input.shortageQuantity,
        damageRemarks: input.damageRemarks,
        podImageUrl: input.podImageUrl,
      }).catch(() => {});
    }

    return { success: true, pod: newPOD };
  };

  // 8. Review POD Decision
  const reviewPODDecision = (podId: string, decision: 'verify' | 'reject', rejectionReason?: string) => {
    const pod = pods.find((p) => p.id === podId);
    if (!pod) return { success: false, error: 'POD record not found.' };

    const check = validatePODDecision(decision, rejectionReason);
    if (!check.isValid) {
      return { success: false, error: check.error };
    }

    const newStatus = decision === 'verify' ? ('verified' as const) : ('rejected' as const);

    const updatedPods = pods.map((p) => {
      if (p.id !== podId) return p;
      return {
        ...p,
        status: newStatus,
        verifiedBy: `${activeRole.toUpperCase()} (Manager/Accountant)`,
        verifiedAt: new Date().toISOString(),
        rejectionReason: decision === 'reject' ? rejectionReason : undefined,
      };
    });

    const updatedTrips = trips.map((t) => {
      if (t.id !== pod.tripId) return t;
      const updatedPodRecord = updatedPods.find((p) => p.id === podId);
      return {
        ...t,
        podRecord: updatedPodRecord,
      };
    });

    setPods(updatedPods);
    setTrips(updatedTrips);
    persistState(vehicles, drivers, lrs, updatedTrips, updatedPods, invoices, advances, expenses, driverSettlements, vendorSettlements, journalEntries);

    if (!isDemoMode || (typeof window !== 'undefined' && localStorage.getItem('tms_auth_token'))) {
      api.reviewPOD(pod.tripId, {
        decision,
        rejectionReason,
        podId,
      }).catch(() => {});
    }

    return { success: true };
  };

  // 9. FINANCIAL ENGINE: Add Driver Advance
  const addDriverAdvance = (input: {
    driverId: string;
    tripId?: string;
    amount: number;
    paymentMode: PaymentMode;
    transactionRef?: string;
  }) => {
    if (input.amount <= 0) {
      return { success: false, error: 'Advance amount must be greater than zero.' };
    }

    const driver = drivers.find((d) => d.id === input.driverId);
    if (!driver) return { success: false, error: 'Driver not found.' };

    const trip = input.tripId ? trips.find((t) => t.id === input.tripId) : undefined;

    const newAdvance: DriverAdvance = {
      id: `adv-${Date.now()}`,
      organizationId: DEMO_ORGANIZATION.id,
      driverId: driver.id,
      driverName: driver.fullName,
      tripId: input.tripId,
      tripNumber: trip?.tripNumber,
      amount: roundToCurrency(input.amount),
      paymentMode: input.paymentMode,
      transactionRef: input.transactionRef || `TXN-${Date.now().toString().slice(-6)}`,
      disbursedAt: new Date().toISOString(),
      disbursedBy: `${activeRole.toUpperCase()} (Accountant/Manager)`,
      isSettled: false,
    };

    // Generate balanced double-entry journal entry
    const journalEntry = generateJournalEntryForDriverAdvance(newAdvance, driver.fullName);

    const updatedAdvances = [newAdvance, ...advances];
    const updatedJournals = [journalEntry, ...journalEntries];

    // Update driver advance balance
    const updatedDrivers = drivers.map((d) =>
      d.id === driver.id ? { ...d, currentAdvanceBalance: roundToCurrency(d.currentAdvanceBalance + input.amount) } : d
    );

    setAdvances(updatedAdvances);
    setJournalEntries(updatedJournals);
    setDrivers(updatedDrivers);
    persistState(vehicles, updatedDrivers, lrs, trips, pods, invoices, updatedAdvances, expenses, driverSettlements, vendorSettlements, updatedJournals);

    return { success: true, advance: newAdvance };
  };

  // 10. FINANCIAL ENGINE: Submit Trip Expense
  const submitTripExpense = (input: {
    tripId: string;
    driverId?: string;
    expenseCategory: ExpenseCategory;
    amount: number;
    paidBy: 'Driver_Advance' | 'Company_Bank' | 'Fuel_Card';
    slipNumber?: string;
    vendorName?: string;
    receiptImageUrl?: string;
  }) => {
    if (input.amount <= 0) {
      return { success: false, error: 'Expense amount must be greater than zero.' };
    }

    // Check duplicate detection
    const duplicateCheck = detectDuplicateExpense(
      {
        tripId: input.tripId,
        amount: input.amount,
        expenseCategory: input.expenseCategory,
        slipNumber: input.slipNumber,
      },
      expenses
    );

    if (duplicateCheck.isDuplicate) {
      return { success: false, error: `Duplicate Warning: ${duplicateCheck.reason}` };
    }

    const newExpense: TripExpense = {
      id: `exp-${Date.now()}`,
      organizationId: DEMO_ORGANIZATION.id,
      tripId: input.tripId,
      driverId: input.driverId,
      expenseCategory: input.expenseCategory,
      amount: roundToCurrency(input.amount),
      paidBy: input.paidBy,
      slipNumber: input.slipNumber,
      vendorName: input.vendorName,
      receiptImageUrl: input.receiptImageUrl || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
      isApproved: false,
      approvalStatus: 'pending',
      createdAt: new Date().toISOString(),
    };

    const updatedExpenses = [newExpense, ...expenses];
    setExpenses(updatedExpenses);
    persistState(vehicles, drivers, lrs, trips, pods, invoices, advances, updatedExpenses, driverSettlements, vendorSettlements, journalEntries);

    if (!isDemoMode || (typeof window !== 'undefined' && localStorage.getItem('tms_auth_token'))) {
      api.submitTripExpense(input.tripId, input).catch(() => {});
    }

    return { success: true, expense: newExpense };
  };

  // 11. FINANCIAL ENGINE: Approve Trip Expense
  const approveTripExpense = (expenseId: string) => {
    const exp = expenses.find((e) => e.id === expenseId);
    if (!exp) return { success: false, error: 'Expense record not found.' };

    const updatedExpenses = expenses.map((e) => {
      if (e.id !== expenseId) return e;
      return {
        ...e,
        isApproved: true,
        approvalStatus: 'approved' as const,
        verifiedBy: `${activeRole.toUpperCase()} (Accountant)`,
        verifiedAt: new Date().toISOString(),
      };
    });

    // Update trip total expenses
    const updatedTrips = trips.map((t) => {
      if (t.id !== exp.tripId) return t;
      const tripExpList = updatedExpenses.filter((e) => e.tripId === t.id && e.approvalStatus === 'approved');
      const totalExp = tripExpList.reduce((s, e) => s + e.amount, 0);
      return {
        ...t,
        totalTripExpenses: totalExp,
        netProfitLoss: roundToCurrency(t.totalFreightRevenue - totalExp),
      };
    });

    setExpenses(updatedExpenses);
    setTrips(updatedTrips);
    persistState(vehicles, drivers, lrs, updatedTrips, pods, invoices, advances, updatedExpenses, driverSettlements, vendorSettlements, journalEntries);

    return { success: true };
  };

  // 12. FINANCIAL ENGINE: Reject Trip Expense
  const rejectTripExpense = (expenseId: string, reason: string) => {
    if (!reason || reason.trim().length < 3) {
      return { success: false, error: 'Rejection requires a brief explanation (min 3 chars).' };
    }

    const updatedExpenses = expenses.map((e) => {
      if (e.id !== expenseId) return e;
      return {
        ...e,
        isApproved: false,
        approvalStatus: 'rejected' as const,
        rejectionReason: reason,
        verifiedBy: `${activeRole.toUpperCase()} (Accountant)`,
        verifiedAt: new Date().toISOString(),
      };
    });

    setExpenses(updatedExpenses);
    persistState(vehicles, drivers, lrs, trips, pods, invoices, advances, updatedExpenses, driverSettlements, vendorSettlements, journalEntries);

    return { success: true };
  };

  // 13. FINANCIAL ENGINE: Create Driver Settlement Voucher
  const createDriverSettlement = (input: {
    driverId: string;
    tripId: string;
    shortageDeductions: number;
    remarks?: string;
  }) => {
    const driver = drivers.find((d) => d.id === input.driverId);
    const trip = trips.find((t) => t.id === input.tripId);
    if (!driver) return { success: false, error: 'Driver not found.' };
    if (!trip) return { success: false, error: 'Trip not found.' };

    const summary = calculateDriverTripSettlement(
      input.tripId,
      input.driverId,
      advances,
      expenses,
      input.shortageDeductions
    );

    const settlementNumber = `SETTLE-2026-${Math.floor(100 + Math.random() * 900)}`;
    const newSettlement: DriverSettlement = {
      id: `set-${Date.now()}`,
      organizationId: DEMO_ORGANIZATION.id,
      settlementNumber,
      driverId: driver.id,
      driverName: driver.fullName,
      tripId: trip.id,
      tripNumber: trip.tripNumber,
      settlementDate: new Date().toISOString().split('T')[0],
      totalAdvanceDisbursed: summary.totalAdvancesDisbursed,
      totalApprovedExpenses: summary.totalApprovedExpenses,
      totalRejectedExpenses: summary.totalRejectedExpenses,
      shortageDeductions: summary.shortageDeductions,
      netPayableOrRecoverable: summary.netAmount,
      settlementStatus: 'settled',
      settledBy: `${activeRole.toUpperCase()} (Accountant)`,
      remarks: input.remarks || 'Driver advance and expense reconciliation completed.',
      createdAt: new Date().toISOString(),
    };

    // Mark advances as settled
    const updatedAdvances = advances.map((a) => {
      if (a.driverId === input.driverId && (!a.tripId || a.tripId === input.tripId)) {
        return { ...a, isSettled: true, settledAt: new Date().toISOString() };
      }
      return a;
    });

    // Generate balanced double-entry journal entry
    const journalEntry = generateJournalEntryForDriverSettlement(newSettlement, summary.expenseCategoryBreakdown);

    const updatedSettlements = [newSettlement, ...driverSettlements];
    const updatedJournals = [journalEntry, ...journalEntries];

    setDriverSettlements(updatedSettlements);
    setAdvances(updatedAdvances);
    setJournalEntries(updatedJournals);
    persistState(vehicles, drivers, lrs, trips, pods, invoices, updatedAdvances, expenses, updatedSettlements, vendorSettlements, updatedJournals);

    if (!isDemoMode || (typeof window !== 'undefined' && localStorage.getItem('tms_auth_token'))) {
      api.settleTrip(input.tripId, {
        shortageDeductions: input.shortageDeductions,
        remarks: input.remarks,
      }).catch(() => {});
    }

    return { success: true, settlement: newSettlement };
  };

  // 14. FINANCIAL ENGINE: Create Customer GST Invoice (with POD Gate)
  const createCustomerInvoice = (input: {
    customerId: string;
    customerName: string;
    customerGstin?: string;
    billingAddress: string;
    originState: string;
    destinationState: string;
    isRcmApplicable: boolean;
    selectedLRIds: string[];
    dueDate: string;
  }) => {
    if (input.selectedLRIds.length === 0) {
      return { success: false, error: 'Please select at least one LR consignment to invoice.' };
    }

    const selectedLRs = lrs.filter((l) => input.selectedLRIds.includes(l.id));

    // STRICT INVOICE GATE: Check POD for each selected LR
    for (const lr of selectedLRs) {
      const linkedPod = pods.find((p) => p.lrId === lr.id);
      const gateCheck = validateLRInvoiceEligibility(lr, linkedPod);
      if (!gateCheck.eligible) {
        return { success: false, error: `Invoice Gate Block: ${gateCheck.reason}` };
      }
    }

    const subtotal = roundToCurrency(selectedLRs.reduce((sum, l) => sum + (l.netTotalAmount || 0), 0));
    const gstBreakdown = calculateGstBreakdown(subtotal, input.originState, input.destinationState, input.isRcmApplicable);

    const invoiceNumber = `INV/2026-27/${Math.floor(1000 + Math.random() * 9000)}`;

    const items: CustomerInvoiceItem[] = selectedLRs.map((l) => ({
      lrId: l.id,
      lrNumber: l.lrNumber,
      lrDate: l.lrDate,
      originCity: l.originCity,
      destinationCity: l.destinationCity,
      packagesCount: l.packagesCount,
      goodsDescription: l.goodsDescription,
      chargedWeightTon: l.chargedWeightTon,
      ratePerTon: l.freightRatePerTon,
      freightAmount: l.totalFreightAmount,
      surchargesAmount: roundToCurrency((l.loadingCharges || 0) + (l.unloadingCharges || 0) + (l.insuranceCharges || 0)),
      netItemAmount: l.netTotalAmount,
    }));

    const newInvoice: CustomerInvoice = {
      id: `inv-${Date.now()}`,
      organizationId: DEMO_ORGANIZATION.id,
      invoiceNumber,
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: input.dueDate,
      customerId: input.customerId,
      customerName: input.customerName,
      customerGstin: input.customerGstin,
      billingAddress: input.billingAddress,
      originState: input.originState,
      destinationState: input.destinationState,
      isRcmApplicable: input.isRcmApplicable,
      subtotalAmount: gstBreakdown.taxableAmount,
      cgstRate: gstBreakdown.cgstRatePercent,
      cgstAmount: gstBreakdown.cgstAmount,
      sgstRate: gstBreakdown.sgstRatePercent,
      sgstAmount: gstBreakdown.sgstAmount,
      igstRate: gstBreakdown.igstRatePercent,
      igstAmount: gstBreakdown.igstAmount,
      totalGstAmount: gstBreakdown.totalGstAmount,
      grandTotal: gstBreakdown.grossInvoiceAmount,
      paidAmount: 0,
      balanceAmount: gstBreakdown.netPayableAmount,
      paymentStatus: 'unpaid',
      includedLRs: selectedLRs.map((l) => l.lrNumber),
      items,
      createdAt: new Date().toISOString(),
    };

    // Mark LRs as billed
    const updatedLrs = lrs.map((l) => {
      if (input.selectedLRIds.includes(l.id)) {
        return { ...l, status: 'billed' as const };
      }
      return l;
    });

    // Generate balanced double-entry journal entry
    const journalEntry = generateJournalEntryForCustomerInvoice(newInvoice);

    const updatedInvoices = [newInvoice, ...invoices];
    const updatedJournals = [journalEntry, ...journalEntries];

    setInvoices(updatedInvoices);
    setLrs(updatedLrs);
    setJournalEntries(updatedJournals);
    persistState(vehicles, drivers, updatedLrs, trips, pods, updatedInvoices, advances, expenses, driverSettlements, vendorSettlements, updatedJournals);

    if (!isDemoMode || (typeof window !== 'undefined' && localStorage.getItem('tms_auth_token'))) {
      api.createInvoice(newInvoice).catch(() => {});
    }

    return { success: true, invoice: newInvoice };
  };

  // 15. FINANCIAL ENGINE: Create Vendor Settlement Voucher (TDS Sec 194C)
  const createVendorSettlement = (input: {
    vendorId: string;
    vendorName: string;
    vendorType: 'Fuel_Station' | 'Truck_Broker' | 'Maintenance_Workshop' | 'Tyre_Vendor';
    tripId?: string;
    grossFreight: number;
    advancePaid: number;
    tdsSection: TdsSection;
    tdsRatePercent: number;
    shortageDeductions: number;
    panNumber?: string;
    paymentRef?: string;
    paymentDate?: string;
    remarks?: string;
  }) => {
    if (input.grossFreight <= 0) {
      return { success: false, error: 'Gross freight must be greater than zero.' };
    }

    const tdsResult = calculateTds194C(
      input.grossFreight,
      input.tdsSection === '194C_COMPANY' ? 'company' : input.tdsSection === '194C_6_EXEMPT' ? 'exempt' : 'individual',
      input.panNumber,
      input.tdsSection === '194C_6_EXEMPT',
      input.advancePaid,
      input.shortageDeductions
    );

    const trip = input.tripId ? trips.find((t) => t.id === input.tripId) : undefined;
    const voucherNumber = `VSET-2026-${Math.floor(100 + Math.random() * 900)}`;

    const newVoucher: VendorSettlement = {
      id: `vs-${Date.now()}`,
      organizationId: DEMO_ORGANIZATION.id,
      voucherNumber,
      vendorId: input.vendorId,
      vendorName: input.vendorName,
      vendorType: input.vendorType,
      tripId: input.tripId,
      tripNumber: trip?.tripNumber,
      grossFreight: tdsResult.grossFreight,
      advancePaid: tdsResult.advancePaid,
      tdsSection: tdsResult.tdsSection,
      tdsRatePercent: tdsResult.tdsRatePercent,
      tdsAmount: tdsResult.tdsAmount,
      shortageDeductions: tdsResult.shortageDeductions,
      netPayable: tdsResult.netPayable,
      settlementStatus: 'approved',
      panNumber: input.panNumber,
      paymentRef: input.paymentRef,
      paymentDate: input.paymentDate || new Date().toISOString().split('T')[0],
      remarks: input.remarks || tdsResult.notes,
      createdAt: new Date().toISOString(),
    };

    const updatedVendorSettlements = [newVoucher, ...vendorSettlements];
    setVendorSettlements(updatedVendorSettlements);
    persistState(vehicles, drivers, lrs, trips, pods, invoices, advances, expenses, driverSettlements, updatedVendorSettlements, journalEntries);

    if (!isDemoMode || (typeof window !== 'undefined' && localStorage.getItem('tms_auth_token'))) {
      api.createVendorBill(newVoucher).catch(() => {});
    }

    return { success: true, voucher: newVoucher };
  };

  // 16. Record Odometer Reading
  const recordTripOdometer = (tripId: string, type: 'start' | 'end', odometerKm: number) => {
    if (odometerKm <= 0) return { success: false, error: 'Invalid odometer reading' };

    const updatedTrips = trips.map((t) => {
      if (t.id !== tripId) return t;
      return {
        ...t,
        [type === 'start' ? 'startOdometerKm' : 'endOdometerKm']: odometerKm,
      };
    });

    setTrips(updatedTrips);
    persistState(vehicles, drivers, lrs, updatedTrips, pods, invoices, advances, expenses, driverSettlements, vendorSettlements, journalEntries);
    return { success: true };
  };

  // Modal handlers
  const openLRPrint = (lr: LRConsignmentNote) => setActiveLRForPrint(lr);
  const closeLRPrint = () => setActiveLRForPrint(null);
  const openVehicleDetails = (v: Vehicle) => setSelectedVehicleForModal(v);
  const closeVehicleDetails = () => setSelectedVehicleForModal(null);
  const openDriverDetails = (d: Driver) => setSelectedDriverForModal(d);
  const closeDriverDetails = () => setSelectedDriverForModal(null);
  const openTripDetails = (t: Trip) => setSelectedTripForModal(t);
  const closeTripDetails = () => setSelectedTripForModal(null);
  const openInvoicePrint = (inv: CustomerInvoice) => setActiveInvoiceForPrint(inv);
  const closeInvoicePrint = () => setActiveInvoiceForPrint(null);
  const openDriverSettlementPrint = (s: DriverSettlement) => setActiveDriverSettlementForPrint(s);
  const closeDriverSettlementPrint = () => setActiveDriverSettlementForPrint(null);
  const openVendorSettlementPrint = (vs: VendorSettlement) => setActiveVendorSettlementForPrint(vs);
  const closeVendorSettlementPrint = () => setActiveVendorSettlementForPrint(null);

  const resetToDefaultDemo = () => {
    setVehicles(DEMO_VEHICLES);
    setDrivers(DEMO_DRIVERS);
    setLrs(DEMO_LRS);
    setTrips(DEMO_TRIPS);
    setPods(DEMO_PODS);
    setInvoices(DEMO_INVOICES);
    setAdvances(DEMO_DRIVER_ADVANCES);
    setExpenses(DEMO_TRIP_EXPENSES);
    setDriverSettlements(DEMO_DRIVER_SETTLEMENTS);
    setVendorSettlements(DEMO_VENDOR_SETTLEMENTS);
    setJournalEntries(DEMO_JOURNAL_ENTRIES);
    setActiveRoleState('owner');
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch {}
  };

  return (
    <DemoContext.Provider
      value={{
        isDemoMode,
        setIsDemoMode,
        isServerSyncing,
        syncStatus,
        syncWithBackend,
        activeRole,
        setActiveRole,
        organization: DEMO_ORGANIZATION,
        vehicles,
        drivers,
        lrs,
        trips,
        pods,
        invoices,
        advances,
        expenses,
        driverSettlements,
        vendorSettlements,
        journalEntries,
        activeLRForPrint,
        selectedVehicleForModal,
        selectedDriverForModal,
        selectedTripForModal,
        activeInvoiceForPrint,
        activeDriverSettlementForPrint,
        activeVendorSettlementForPrint,
        openLRPrint,
        closeLRPrint,
        openVehicleDetails,
        closeVehicleDetails,
        openDriverDetails,
        closeDriverDetails,
        openTripDetails,
        closeTripDetails,
        openInvoicePrint,
        closeInvoicePrint,
        openDriverSettlementPrint,
        closeDriverSettlementPrint,
        openVendorSettlementPrint,
        closeVendorSettlementPrint,
        createNewLR,
        registerVehicle,
        registerDriver,
        createAndScheduleTrip,
        advanceTripStatus,
        cancelTrip,
        submitPOD,
        reviewPODDecision,
        addDriverAdvance,
        submitTripExpense,
        approveTripExpense,
        rejectTripExpense,
        createDriverSettlement,
        createCustomerInvoice,
        createVendorSettlement,
        recordTripOdometer,
        resetToDefaultDemo,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
};

export const useDemoTMS = () => {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error('useDemoTMS must be used within a DemoProvider');
  }
  return context;
};
