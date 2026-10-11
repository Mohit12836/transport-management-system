'use client';

import React, { useState } from 'react';
import { useDemoTMS } from '../../lib/demo-context';
import { PaymentMode } from '../../types/tms';
import { DriverSettlementModal } from './DriverSettlementModal';

export const DriverLedgerView: React.FC = () => {
  const {
    drivers,
    trips,
    advances,
    expenses,
    driverSettlements,
    addDriverAdvance,
    openDriverSettlementPrint,
  } = useDemoTMS();

  const [selectedDriverId, setSelectedDriverId] = useState<string>('all');
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [settlementTripModal, setSettlementTripModal] = useState<any>(null);

  // New Advance form state
  const [advDriverId, setAdvDriverId] = useState<string>(drivers[0]?.id || '');
  const [advTripId, setAdvTripId] = useState<string>('');
  const [advAmount, setAdvAmount] = useState<string>('5000');
  const [advMode, setAdvMode] = useState<PaymentMode>('Cash');
  const [advRef, setAdvRef] = useState<string>('');
  const [advError, setAdvError] = useState<string | null>(null);

  const filteredAdvances = advances.filter(
    (a) => selectedDriverId === 'all' || a.driverId === selectedDriverId
  );
  const filteredSettlements = driverSettlements.filter(
    (s) => selectedDriverId === 'all' || s.driverId === selectedDriverId
  );

  const totalOutstandingAdvances = drivers.reduce((sum, d) => sum + (d.currentAdvanceBalance || 0), 0);

  const handleDisburseAdvance = (e: React.FormEvent) => {
    e.preventDefault();
    setAdvError(null);
    const amountNum = parseFloat(advAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setAdvError('Please enter a valid amount greater than 0');
      return;
    }

    const res = addDriverAdvance({
      driverId: advDriverId,
      tripId: advTripId || undefined,
      amount: amountNum,
      paymentMode: advMode,
      transactionRef: advRef || undefined,
    });

    if (res.success) {
      setShowAdvanceModal(false);
      setAdvAmount('5000');
      setAdvRef('');
    } else {
      setAdvError(res.error || 'Failed to disburse advance');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-amber-500/20 text-amber-300 font-mono text-xs px-2.5 py-1 rounded font-bold border border-amber-500/30">
              DRIVER ADVANCE & EXPENSE LEDGERS
            </span>
          </div>
          <h2 className="text-xl font-bold text-white mt-1">Driver Financial Accounts</h2>
          <p className="text-xs text-slate-400">
            Real-time tracking of en-route advances, trip settlements, and recoverable balances.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={selectedDriverId}
            onChange={(e) => setSelectedDriverId(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white text-xs rounded-xl px-3 py-2 focus:border-amber-500 focus:outline-none"
          >
            <option value="all">All Drivers ({drivers.length})</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.fullName} (Bal: ₹{d.currentAdvanceBalance.toLocaleString('en-IN')})
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowAdvanceModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-amber-950/50 flex items-center gap-1.5 shrink-0"
          >
            <span>➕</span> Disburse Advance
          </button>
        </div>
      </div>

      {/* Driver Cards Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {drivers.map((driver) => {
          const drvAdvances = advances.filter((a) => a.driverId === driver.id && !a.isSettled);
          const pendingTotal = drvAdvances.reduce((s, a) => s + a.amount, 0);

          // Find active trips for this driver
          const activeTrip = trips.find(
            (t) => t.driverId === driver.id && (t.status === 'in_transit' || t.status === 'delivered')
          );

          return (
            <div
              key={driver.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-5 rounded-2xl transition-all space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-white text-base">{driver.fullName}</h3>
                  <p className="text-xs text-slate-400">
                    {driver.phone} • Lic: <span className="font-mono text-slate-300">{driver.licenseNumber}</span>
                  </p>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-bold font-mono ${
                    driver.currentAdvanceBalance > 0
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}
                >
                  BAL: ₹{driver.currentAdvanceBalance.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 text-xs space-y-1.5">
                <div className="flex justify-between text-slate-400">
                  <span>Assigned Truck:</span>
                  <span className="font-mono font-semibold text-white">
                    {driver.assignedVehicleNumber || 'Standby'}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Unsettled Advances:</span>
                  <span className="font-mono font-semibold text-amber-400">
                    ₹{pendingTotal.toLocaleString('en-IN')}
                  </span>
                </div>
                {activeTrip && (
                  <div className="flex justify-between text-slate-400">
                    <span>Active Trip:</span>
                    <span className="font-mono font-semibold text-blue-400">
                      {activeTrip.tripNumber} ({activeTrip.status})
                    </span>
                  </div>
                )}
              </div>

              {activeTrip && (
                <button
                  onClick={() => setSettlementTripModal(activeTrip)}
                  className="w-full py-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <span>⚖️</span> Reconcile Trip {activeTrip.tripNumber}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Disbursed Advances Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <span>📜</span> Advance Disbursement Ledger ({filteredAdvances.length})
          </h3>
          <span className="text-xs text-slate-400">
            Total Ledger: ₹{filteredAdvances.reduce((s, a) => s + a.amount, 0).toLocaleString('en-IN')}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
              <tr>
                <th className="p-3.5">Disbursed Date</th>
                <th className="p-3.5">Driver</th>
                <th className="p-3.5">Trip Link</th>
                <th className="p-3.5">Mode</th>
                <th className="p-3.5">Transaction Ref</th>
                <th className="p-3.5">Disbursed By</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filteredAdvances.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-500 italic">
                    No advances found for selected filter.
                  </td>
                </tr>
              ) : (
                filteredAdvances.map((adv) => (
                  <tr key={adv.id} className="hover:bg-slate-800/40">
                    <td className="p-3.5 font-mono">{adv.disbursedAt.split('T')[0]}</td>
                    <td className="p-3.5 font-bold text-white">{adv.driverName || 'Driver'}</td>
                    <td className="p-3.5 font-mono text-blue-400">{adv.tripNumber || 'General Advance'}</td>
                    <td className="p-3.5 font-medium text-amber-300">{adv.paymentMode}</td>
                    <td className="p-3.5 font-mono text-slate-400">{adv.transactionRef || 'N/A'}</td>
                    <td className="p-3.5 text-slate-400">{adv.disbursedBy || 'Manager'}</td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                          adv.isSettled
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {adv.isSettled ? 'SETTLED' : 'UNSETTLED'}
                      </span>
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-white">
                      ₹{adv.amount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Completed Settlements History */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <span>📑</span> Settled Trip Vouchers ({filteredSettlements.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
              <tr>
                <th className="p-3.5">Voucher #</th>
                <th className="p-3.5">Settlement Date</th>
                <th className="p-3.5">Driver</th>
                <th className="p-3.5">Trip</th>
                <th className="p-3.5 text-right">Advances</th>
                <th className="p-3.5 text-right">Approved Exp.</th>
                <th className="p-3.5 text-right">Net Status</th>
                <th className="p-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filteredSettlements.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-500 italic">
                    No settlement records found.
                  </td>
                </tr>
              ) : (
                filteredSettlements.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/40">
                    <td className="p-3.5 font-mono font-bold text-amber-300">{s.settlementNumber}</td>
                    <td className="p-3.5 font-mono">{s.settlementDate}</td>
                    <td className="p-3.5 font-bold text-white">{s.driverName}</td>
                    <td className="p-3.5 font-mono text-blue-400">{s.tripNumber}</td>
                    <td className="p-3.5 text-right font-mono">₹{s.totalAdvanceDisbursed.toLocaleString('en-IN')}</td>
                    <td className="p-3.5 text-right font-mono text-emerald-400">
                      ₹{s.totalApprovedExpenses.toLocaleString('en-IN')}
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold">
                      {s.netPayableOrRecoverable > 0 ? (
                        <span className="text-emerald-400">
                          +₹{s.netPayableOrRecoverable.toLocaleString('en-IN')} (Refunded)
                        </span>
                      ) : (
                        <span className="text-blue-400">
                          -₹{Math.abs(s.netPayableOrRecoverable).toLocaleString('en-IN')} (Paid)
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => openDriverSettlementPrint(s)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold"
                      >
                        🖨️ View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Disburse Advance Modal */}
      {showAdvanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">Disburse Driver Advance</h3>
              <button
                onClick={() => setShowAdvanceModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {advError && (
              <div className="p-2.5 bg-red-950/60 border border-red-800 rounded-lg text-red-200 text-xs">
                ⚠️ {advError}
              </div>
            )}

            <form onSubmit={handleDisburseAdvance} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Select Driver</label>
                <select
                  value={advDriverId}
                  onChange={(e) => setAdvDriverId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
                >
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.fullName} ({d.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Trip Reference (Optional)</label>
                <select
                  value={advTripId}
                  onChange={(e) => setAdvTripId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
                >
                  <option value="">General Standby Advance</option>
                  {trips.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.tripNumber} ({t.originCity} → {t.destinationCity})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    min="100"
                    step="100"
                    value={advAmount}
                    onChange={(e) => setAdvAmount(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold focus:border-amber-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Payment Mode</label>
                  <select
                    value={advMode}
                    onChange={(e) => setAdvMode(e.target.value as PaymentMode)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
                  >
                    <option value="Cash">Cash (Branch)</option>
                    <option value="UPI">UPI Transfer</option>
                    <option value="Bank_Transfer">NEFT/RTGS Bank</option>
                    <option value="Fuel_Card">PetroCard / FASTag</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Voucher / Transaction Reference</label>
                <input
                  type="text"
                  value={advRef}
                  onChange={(e) => setAdvRef(e.target.value)}
                  placeholder="e.g. UPI-98214478102 or CSH-089"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-amber-500 focus:outline-none font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAdvanceModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs hover:bg-slate-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-amber-950/50"
                >
                  Confirm & Disburse
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Active Trip Reconcile Modal */}
      {settlementTripModal && (
        <DriverSettlementModal
          trip={settlementTripModal}
          onClose={() => setSettlementTripModal(null)}
        />
      )}
    </div>
  );
};
