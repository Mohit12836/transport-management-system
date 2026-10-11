'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Calculator,
  Truck,
  Check,
  AlertCircle,
  X,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { useDemoTMS } from '../../lib/demo-context';
import { validateLRConsignment, ValidationResult } from '../../lib/validators';
import { calculateLRCharges } from '../../lib/lr-math';
import { LRPaymentType, LRStatus } from '../../types/tms';

interface LRBookingFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LRBookingForm: React.FC<LRBookingFormProps> = ({ isOpen, onClose }) => {
  const { createNewLR, openLRPrint, vehicles, drivers } = useDemoTMS();

  // Form State
  const [lrNumber, setLrNumber] = useState(`LR-JPR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [lrDate, setLrDate] = useState(new Date().toISOString().split('T')[0]);
  const [consignorName, setConsignorName] = useState('Gupta Steel & Structural Pipes Ltd.');
  const [consignorAddress, setConsignorAddress] = useState('Plot 42, VKIA Industrial Area, Jaipur, Rajasthan');
  const [consignorGstin, setConsignorGstin] = useState('08AABCG9876E1Z4');

  const [consigneeName, setConsigneeName] = useState('Reliance Retail Supply Chain Hub');
  const [consigneeAddress, setConsigneeAddress] = useState('Gala 101, Bhiwandi Logistics Park, Thane, Maharashtra');
  const [consigneeGstin, setConsigneeGstin] = useState('27AAACR1234F1Z8');

  const [originCity, setOriginCity] = useState('Jaipur');
  const [destinationCity, setDestinationCity] = useState('Mumbai / Bhiwandi');
  const [ewayBillNumber, setEwayBillNumber] = useState('891244569012');

  const [goodsDescription, setGoodsDescription] = useState('Galvanized Steel Pipes & Tubes (Bundles)');
  const [packagesCount, setPackagesCount] = useState<number>(120);
  const [packageType, setPackageType] = useState('Heavy Bundles');

  const [actualWeightTon, setActualWeightTon] = useState<number>(21.5);
  const [chargedWeightTon, setChargedWeightTon] = useState<number>(22.0);
  const [freightRatePerTon, setFreightRatePerTon] = useState<number>(2850);

  const [loadingCharges, setLoadingCharges] = useState<number>(1200);
  const [unloadingCharges, setUnloadingCharges] = useState<number>(1000);
  const [insuranceCharges, setInsuranceCharges] = useState<number>(500);
  const [paymentType, setPaymentType] = useState<LRPaymentType>('tbb');

  const [selectedVehicle, setSelectedVehicle] = useState(vehicles[0]?.vehicleNumber || 'RJ14-GB-4592');
  const [selectedDriver, setSelectedDriver] = useState(drivers[0]?.fullName || 'Mukesh Yadav');
  const [driverPhone, setDriverPhone] = useState(drivers[0]?.phone || '+91 94140 77889');

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Synchronize driver phone when vehicle/driver changes
  useEffect(() => {
    const drv = drivers.find((d) => d.fullName === selectedDriver);
    if (drv) setDriverPhone(drv.phone);
  }, [selectedDriver, drivers]);

  // Live calculation breakdown
  const isInterState = originCity.toLowerCase() !== destinationCity.toLowerCase() && !destinationCity.toLowerCase().includes('rajasthan');
  const calculation = calculateLRCharges(
    chargedWeightTon,
    freightRatePerTon,
    loadingCharges,
    unloadingCharges,
    insuranceCharges,
    isInterState,
    false
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const inputData = {
      lrNumber,
      consignorName,
      consignorAddress,
      consignorGstin,
      consigneeName,
      consigneeAddress,
      consigneeGstin,
      originCity,
      destinationCity,
      goodsDescription,
      packagesCount,
      actualWeightTon,
      chargedWeightTon,
      freightRatePerTon,
      loadingCharges,
      unloadingCharges,
      insuranceCharges,
      paymentType,
      ewayBillNumber,
    };

    const validation: ValidationResult = validateLRConsignment(inputData);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }

    setValidationErrors({});

    const created = createNewLR({
      organizationId: 'org-demo-001',
      branchId: 'br-jaipur',
      lrNumber,
      lrDate,
      consignorName,
      consignorAddress,
      consignorGstin,
      consigneeName,
      consigneeAddress,
      consigneeGstin,
      originCity,
      destinationCity,
      ewayBillNumber,
      goodsDescription,
      packagesCount,
      packageType,
      actualWeightTon,
      chargedWeightTon,
      freightRatePerTon,
      totalFreightAmount: calculation.baseFreightAmount,
      loadingCharges: calculation.loadingCharges,
      unloadingCharges: calculation.unloadingCharges,
      insuranceCharges: calculation.insuranceCharges,
      netTotalAmount: calculation.netTotalAmount,
      paymentType,
      status: 'generated' as LRStatus,
      vehicleNumber: selectedVehicle,
      driverName: selectedDriver,
      driverPhone,
    });

    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      onClose();
      openLRPrint(created);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-white my-8">
        {/* Header */}
        <div className="flex items-start justify-between pb-6 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 mb-2">
              <FileText className="w-3.5 h-3.5" />
              Consignment Note Generator (LR / Bilty)
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              Create New Lorry Receipt
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Pre-calculates freight, GST & surcharges, and generates the standard 3-copy printable documentation.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Section 1: Header Meta */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-850/50 border border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">LR Number *</label>
              <input
                type="text"
                value={lrNumber}
                onChange={(e) => setLrNumber(e.target.value)}
                className={`w-full bg-slate-900 border rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:ring-2 focus:ring-red-500 ${
                  validationErrors.lrNumber ? 'border-red-500' : 'border-slate-700'
                }`}
              />
              {validationErrors.lrNumber && (
                <p className="text-[11px] text-red-400 mt-1">{validationErrors.lrNumber}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">LR Date *</label>
              <input
                type="date"
                value={lrDate}
                onChange={(e) => setLrDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Payment Terms *</label>
              <select
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value as LRPaymentType)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="tbb">T.B.B. (To Be Billed / Credit)</option>
                <option value="to_pay">To Pay (Consignee Pays at Delivery)</option>
                <option value="paid">Paid (Consignor Advance Settled)</option>
              </select>
            </div>
          </div>

          {/* Section 2: Consignor & Consignee */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Consignor */}
            <div className="p-4 rounded-2xl bg-slate-850/40 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                <span>Consignor (Sender / Dispatcher)</span>
              </h4>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Company Name *</label>
                <input
                  type="text"
                  value={consignorName}
                  onChange={(e) => setConsignorName(e.target.value)}
                  className={`w-full bg-slate-900 border rounded-xl px-3 py-2 text-xs text-white focus:ring-2 focus:ring-red-500 ${
                    validationErrors.consignorName ? 'border-red-500' : 'border-slate-700'
                  }`}
                />
                {validationErrors.consignorName && (
                  <p className="text-[11px] text-red-400 mt-0.5">{validationErrors.consignorName}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Pickup Address *</label>
                <input
                  type="text"
                  value={consignorAddress}
                  onChange={(e) => setConsignorAddress(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Origin City *</label>
                  <input
                    type="text"
                    value={originCity}
                    onChange={(e) => setOriginCity(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Consignor GSTIN</label>
                  <input
                    type="text"
                    value={consignorGstin}
                    onChange={(e) => setConsignorGstin(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white"
                    placeholder="08AABC..."
                  />
                </div>
              </div>
            </div>

            {/* Consignee */}
            <div className="p-4 rounded-2xl bg-slate-850/40 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <span>Consignee (Receiver / Destination)</span>
              </h4>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Company Name *</label>
                <input
                  type="text"
                  value={consigneeName}
                  onChange={(e) => setConsigneeName(e.target.value)}
                  className={`w-full bg-slate-900 border rounded-xl px-3 py-2 text-xs text-white focus:ring-2 focus:ring-red-500 ${
                    validationErrors.consigneeName ? 'border-red-500' : 'border-slate-700'
                  }`}
                />
                {validationErrors.consigneeName && (
                  <p className="text-[11px] text-red-400 mt-0.5">{validationErrors.consigneeName}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Delivery Address *</label>
                <input
                  type="text"
                  value={consigneeAddress}
                  onChange={(e) => setConsigneeAddress(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Destination City *</label>
                  <input
                    type="text"
                    value={destinationCity}
                    onChange={(e) => setDestinationCity(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Consignee GSTIN</label>
                  <input
                    type="text"
                    value={consigneeGstin}
                    onChange={(e) => setConsigneeGstin(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white"
                    placeholder="27AAAC..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Goods & Freight Calculation */}
          <div className="p-4 rounded-2xl bg-slate-850/50 border border-slate-800 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
              <Calculator className="w-4 h-4 text-red-400" />
              <span>Goods Description, Weight & Freight Calculations</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-300 mb-1">Goods Description *</label>
                <input
                  type="text"
                  value={goodsDescription}
                  onChange={(e) => setGoodsDescription(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">e-Way Bill Number (12 Digits)</label>
                <input
                  type="text"
                  value={ewayBillNumber}
                  onChange={(e) => setEwayBillNumber(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white"
                  placeholder="891244569012"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Packages Count</label>
                <input
                  type="number"
                  value={packagesCount}
                  onChange={(e) => setPackagesCount(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Actual Weight (Tons)</label>
                <input
                  type="number"
                  step="0.1"
                  value={actualWeightTon}
                  onChange={(e) => setActualWeightTon(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Charged Weight (Tons) *</label>
                <input
                  type="number"
                  step="0.1"
                  value={chargedWeightTon}
                  onChange={(e) => setChargedWeightTon(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Rate per Ton (₹) *</label>
                <input
                  type="number"
                  value={freightRatePerTon}
                  onChange={(e) => setFreightRatePerTon(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>
            </div>

            {/* Surcharges Row */}
            <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-800">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Loading Labor (₹)</label>
                <input
                  type="number"
                  value={loadingCharges}
                  onChange={(e) => setLoadingCharges(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Unloading (₹)</label>
                <input
                  type="number"
                  value={unloadingCharges}
                  onChange={(e) => setUnloadingCharges(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Transit Insurance (₹)</label>
                <input
                  type="number"
                  value={insuranceCharges}
                  onChange={(e) => setInsuranceCharges(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                />
              </div>
            </div>

            {/* Calculation Summary Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-red-500/20 flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-xs text-slate-400">
                  Base Freight: ₹{calculation.baseFreightAmount.toLocaleString('en-IN')} ({chargedWeightTon} Tons × ₹{freightRatePerTon})
                </div>
                <div className="text-xs text-slate-400">
                  Surcharges: ₹{(loadingCharges + unloadingCharges + insuranceCharges).toLocaleString('en-IN')} | GST (5%): ₹{(calculation.cgstAmount + calculation.sgstAmount + calculation.igstAmount).toLocaleString('en-IN')}
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase tracking-wider text-red-400 font-bold block">Net Invoiceable Freight</span>
                <span className="text-2xl font-black text-white font-mono">
                  ₹{calculation.netTotalAmount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Section 4: Vehicle & Driver Assignment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-850/40 border border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Assign Vehicle *</label>
              <select
                value={selectedVehicle}
                onChange={(e) => setSelectedVehicle(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white"
              >
                {vehicles.map((v) => (
                  <option key={v.id} value={v.vehicleNumber}>
                    {v.vehicleNumber} — {v.vehicleType} ({v.ownershipType.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Assign Driver *</label>
              <select
                value={selectedDriver}
                onChange={(e) => setSelectedDriver(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white"
              >
                {drivers.map((d) => (
                  <option key={d.id} value={d.fullName}>
                    {d.fullName} (Phone: {d.phone})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs sm:text-sm font-medium text-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitted}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-xs sm:text-sm font-bold text-white shadow-lg shadow-red-900/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {isSubmitted ? (
                <>
                  <Check className="w-4 h-4 animate-bounce" />
                  Generating LR...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate LR & Open 3-Copy Print
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
