'use client';

import React, { useState } from 'react';
import { useDemoTMS } from '../../lib/demo-context';
import { TdsSection } from '../../types/tms';
import { calculateTds194C, validatePanNumber } from '../../lib/tax-rules';

interface VendorSettlementModalProps {
  onClose: () => void;
}

export const VendorSettlementModal: React.FC<VendorSettlementModalProps> = ({ onClose }) => {
  const { trips, createVendorSettlement, openVendorSettlementPrint } = useDemoTMS();

  const [vendorName, setVendorName] = useState<string>('Rajasthan Gujarat Roadlines Broker');
  const [vendorType, setVendorType] = useState<'Fuel_Station' | 'Truck_Broker' | 'Maintenance_Workshop' | 'Tyre_Vendor'>('Truck_Broker');
  const [tripId, setTripId] = useState<string>(trips[0]?.id || '');
  const [grossFreight, setGrossFreight] = useState<string>('45000');
  const [advancePaid, setAdvancePaid] = useState<string>('15000');
  const [panNumber, setPanNumber] = useState<string>('AABCR8821F');
  const [tdsCategory, setTdsCategory] = useState<'individual' | 'company' | 'exempt'>('company');
  const [has194C6Declaration, setHas194C6Declaration] = useState<boolean>(false);
  const [shortageDeductions, setShortageDeductions] = useState<string>('0');
  const [paymentRef, setPaymentRef] = useState<string>('NEFT-HDFC-99128');
  const [remarks, setRemarks] = useState<string>('Market truck hire freight settlement');
  const [formError, setFormError] = useState<string | null>(null);

  const grossNum = parseFloat(grossFreight) || 0;
  const advanceNum = parseFloat(advancePaid) || 0;
  const shortageNum = parseFloat(shortageDeductions) || 0;

  const tdsResult = calculateTds194C(
    grossNum,
    tdsCategory,
    panNumber,
    has194C6Declaration,
    advanceNum,
    shortageNum
  );

  const isPanValid = validatePanNumber(panNumber);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (grossNum <= 0) {
      setFormError('Gross freight amount must be greater than zero.');
      return;
    }

    const res = createVendorSettlement({
      vendorId: `ven-${Date.now()}`,
      vendorName,
      vendorType,
      tripId: tripId || undefined,
      grossFreight: grossNum,
      advancePaid: advanceNum,
      tdsSection: tdsResult.tdsSection,
      tdsRatePercent: tdsResult.tdsRatePercent,
      shortageDeductions: shortageNum,
      panNumber: panNumber.toUpperCase(),
      paymentRef,
      remarks,
    });

    if (res.success && res.voucher) {
      openVendorSettlementPrint(res.voucher);
      onClose();
    } else {
      setFormError(res.error || 'Failed to generate vendor settlement voucher.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-8 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900/60 to-slate-900 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-purple-500/20 text-purple-300 font-mono text-xs px-2.5 py-1 rounded font-bold border border-purple-500/30">
                TDS SECTION 194C VOUCHER
              </span>
              <span className="text-xs text-slate-400">Vendor & Broker Settlement</span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">Vendor Freight Settlement & TDS Audit</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 p-2 rounded-lg"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-slate-300">
          {formError && (
            <div className="p-3 bg-red-950/60 border border-red-800 rounded-xl text-red-200 font-medium">
              ⚠️ {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-800/40 p-4 rounded-xl border border-slate-700">
            <div>
              <label className="block font-medium text-slate-300 mb-1">Vendor / Broker Name</label>
              <input
                type="text"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs focus:border-purple-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">Vendor Category</label>
              <select
                value={vendorType}
                onChange={(e) => setVendorType(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs focus:border-purple-500 focus:outline-none"
              >
                <option value="Truck_Broker">Truck Broker / Transporter</option>
                <option value="Fuel_Station">Fuel Outlet Provider</option>
                <option value="Maintenance_Workshop">Vehicle Workshop</option>
                <option value="Tyre_Vendor">Tyre / Spares Supplier</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">PAN Number (Permanent Account No.)</label>
              <input
                type="text"
                value={panNumber}
                onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                placeholder="ABCDE1234F"
                maxLength={10}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono text-xs focus:border-purple-500 focus:outline-none uppercase"
                required
              />
              <span className={`text-[10px] block mt-1 ${isPanValid ? 'text-emerald-400' : 'text-amber-400'}`}>
                {isPanValid ? '✓ Valid PAN format' : '⚠️ Missing/Invalid PAN triggers 20% Sec 206AA TDS'}
              </span>
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">Associated Trip (Optional)</label>
              <select
                value={tripId}
                onChange={(e) => setTripId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs focus:border-purple-500 focus:outline-none"
              >
                <option value="">No Trip Link (General Voucher)</option>
                {trips.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.tripNumber} ({t.originCity} → {t.destinationCity})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tax Classification & Sec 194C(6) Declaration */}
          <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700 space-y-3">
            <h3 className="font-bold text-white text-xs uppercase tracking-wider">
              TDS Statutory Classification (Section 194C / 206AA)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Entity Type</label>
                <select
                  value={tdsCategory}
                  onChange={(e) => setTdsCategory(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs focus:border-purple-500 focus:outline-none"
                >
                  <option value="company">Company / Partnership Firm / LLP (2% TDS)</option>
                  <option value="individual">Individual / Proprietorship / HUF (1% TDS)</option>
                  <option value="exempt">Non-taxable / Exempt Entity</option>
                </select>
              </div>

              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 cursor-pointer bg-slate-900 p-2 rounded-lg border border-slate-700 w-full">
                  <input
                    type="checkbox"
                    checked={has194C6Declaration}
                    onChange={(e) => setHas194C6Declaration(e.target.checked)}
                    className="h-4 w-4 rounded bg-slate-800 border-slate-600 text-purple-600"
                  />
                  <span className="text-[11px] text-slate-200">
                    Section 194C(6) Declaration (Transporter owns &le; 10 goods carriages)
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Amounts Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-slate-300 mb-1">Gross Freight (₹)</label>
              <input
                type="number"
                min="1"
                value={grossFreight}
                onChange={(e) => setGrossFreight(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono font-bold text-xs focus:border-purple-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">Advance Paid (₹)</label>
              <input
                type="number"
                min="0"
                value={advancePaid}
                onChange={(e) => setAdvancePaid(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono text-xs focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">Damage Deductions (₹)</label>
              <input
                type="number"
                min="0"
                value={shortageDeductions}
                onChange={(e) => setShortageDeductions(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono text-xs focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Live Computation Card */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Gross Freight Billable:</span>
              <span className="text-white font-bold">₹{tdsResult.grossFreight.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Less: Advance Already Paid:</span>
              <span className="text-amber-400">- ₹{tdsResult.advancePaid.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Less: TDS ({tdsResult.tdsRatePercent}% under {tdsResult.tdsSection}):</span>
              <span className="text-purple-400 font-bold">- ₹{tdsResult.tdsAmount.toLocaleString('en-IN')}</span>
            </div>
            {tdsResult.shortageDeductions > 0 && (
              <div className="flex justify-between text-slate-400">
                <span>Less: Shortage Deductions:</span>
                <span className="text-rose-400">- ₹{tdsResult.shortageDeductions.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="border-t border-slate-800 pt-2 flex justify-between text-sm">
              <span className="font-bold text-white">Net Balance Payable to Vendor:</span>
              <span className="font-black text-purple-300 text-base">₹{tdsResult.netPayable.toLocaleString('en-IN')}</span>
            </div>
            <p className="text-[10px] text-slate-400 font-sans italic pt-1">{tdsResult.notes}</p>
          </div>

          {/* Payment Ref */}
          <div>
            <label className="block font-medium text-slate-300 mb-1">Bank Payment Ref / UTR</label>
            <input
              type="text"
              value={paymentRef}
              onChange={(e) => setPaymentRef(e.target.value)}
              placeholder="e.g. NEFT-HDFC-99128"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono text-xs focus:border-purple-500 focus:outline-none"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Automated double-entry journal entry: Debit Freight Expense, Credit TDS Payable & Bank.
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-950/50 flex items-center gap-2"
            >
              <span>📑 Approve & Print Settlement Voucher</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
