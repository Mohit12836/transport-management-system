'use client';

import React, { useState } from 'react';
import { useDemoTMS } from '../../lib/demo-context';
import { Trip, Driver } from '../../types/tms';
import { calculateDriverTripSettlement } from '../../lib/financial-engine';

interface DriverSettlementModalProps {
  trip: Trip;
  driver?: Driver;
  onClose: () => void;
}

export const DriverSettlementModal: React.FC<DriverSettlementModalProps> = ({
  trip,
  driver,
  onClose,
}) => {
  const {
    advances,
    expenses,
    approveTripExpense,
    rejectTripExpense,
    createDriverSettlement,
    openDriverSettlementPrint,
  } = useDemoTMS();

  const [shortageDeduction, setShortageDeduction] = useState<number>(
    trip.podRecord?.shortageQuantity ? trip.podRecord.shortageQuantity * 500 : 0
  );
  const [remarks, setRemarks] = useState<string>('');
  const [rejectModalExpId, setRejectModalExpId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const settlementSummary = calculateDriverTripSettlement(
    trip.id,
    trip.driverId,
    advances,
    expenses,
    shortageDeduction
  );

  const tripExpenses = expenses.filter((e) => e.tripId === trip.id);
  const tripAdvances = advances.filter(
    (a) => a.driverId === trip.driverId && (!a.tripId || a.tripId === trip.id)
  );

  const handleApprove = (expId: string) => {
    approveTripExpense(expId);
  };

  const handleRejectSubmit = () => {
    if (!rejectModalExpId || !rejectReason.trim()) return;
    rejectTripExpense(rejectModalExpId, rejectReason);
    setRejectModalExpId(null);
    setRejectReason('');
  };

  const handleFinalizeSettlement = () => {
    setIsSubmitting(true);
    setActionError(null);

    const res = createDriverSettlement({
      driverId: trip.driverId,
      tripId: trip.id,
      shortageDeductions: shortageDeduction,
      remarks: remarks || `Settlement for Trip ${trip.tripNumber}`,
    });

    setIsSubmitting(false);

    if (res.success && res.settlement) {
      openDriverSettlementPrint(res.settlement);
      onClose();
    } else {
      setActionError(res.error || 'Failed to finalize settlement voucher.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden my-8 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900/60 to-slate-900 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-emerald-500/20 text-emerald-300 font-mono text-xs px-2.5 py-1 rounded border border-emerald-500/30 font-semibold">
                FINANCIAL RECONCILIATION
              </span>
              <span className="text-slate-400 text-xs">Trip: {trip.tripNumber}</span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">
              Driver Advance & Trip Expense Settlement
            </h2>
            <p className="text-xs text-slate-300">
              Driver: <strong className="text-white">{trip.driverName}</strong> ({trip.driverPhone || 'N/A'}) • Vehicle: {trip.vehicleNumber}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 p-2 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-slate-200">
          {actionError && (
            <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-red-200 text-xs font-semibold">
              ⚠️ {actionError}
            </div>
          )}

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-800/60 border border-slate-700 p-3 rounded-xl">
              <span className="text-slate-400 text-xs font-medium block">Total Advances</span>
              <span className="text-lg font-bold text-amber-400 font-mono">
                ₹{settlementSummary.totalAdvancesDisbursed.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">{tripAdvances.length} disbursements</span>
            </div>

            <div className="bg-slate-800/60 border border-slate-700 p-3 rounded-xl">
              <span className="text-slate-400 text-xs font-medium block">Approved Expenses</span>
              <span className="text-lg font-bold text-emerald-400 font-mono">
                ₹{settlementSummary.totalApprovedExpenses.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Verified receipts</span>
            </div>

            <div className="bg-slate-800/60 border border-slate-700 p-3 rounded-xl">
              <span className="text-slate-400 text-xs font-medium block">Shortage Deductions</span>
              <span className="text-lg font-bold text-rose-400 font-mono">
                ₹{settlementSummary.shortageDeductions.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Transit recovery</span>
            </div>

            <div
              className={`p-3 rounded-xl border ${
                settlementSummary.isDriverOwingCompany
                  ? 'bg-emerald-950/40 border-emerald-500/40'
                  : 'bg-blue-950/40 border-blue-500/40'
              }`}
            >
              <span className="text-slate-300 text-xs font-medium block">
                {settlementSummary.isDriverOwingCompany ? 'Driver Refund Due' : 'Transporter Payout Due'}
              </span>
              <span
                className={`text-lg font-bold font-mono ${
                  settlementSummary.isDriverOwingCompany ? 'text-emerald-300' : 'text-blue-300'
                }`}
              >
                ₹{Math.abs(settlementSummary.netAmount).toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-slate-300 block mt-0.5">
                {settlementSummary.isDriverOwingCompany ? 'Refund unspent cash' : 'Reimburse driver'}
              </span>
            </div>
          </div>

          {/* Section 1: Trip Advances Ledger */}
          <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
              <span>💳</span> Disbursed Advances ({tripAdvances.length})
            </h3>
            {tripAdvances.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No advances recorded for this trip.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="text-slate-400 border-b border-slate-700">
                    <tr>
                      <th className="pb-2">Date</th>
                      <th className="pb-2">Payment Mode</th>
                      <th className="pb-2">Reference / Voucher</th>
                      <th className="pb-2">Disbursed By</th>
                      <th className="pb-2 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {tripAdvances.map((adv) => (
                      <tr key={adv.id}>
                        <td className="py-2">{adv.disbursedAt.split('T')[0]}</td>
                        <td className="py-2 font-medium text-amber-300">{adv.paymentMode}</td>
                        <td className="py-2 font-mono text-slate-400">{adv.transactionRef || 'N/A'}</td>
                        <td className="py-2 text-slate-400">{adv.disbursedBy || 'Manager'}</td>
                        <td className="py-2 text-right font-mono font-bold text-white">
                          ₹{adv.amount.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 2: En-route Trip Expenses & Receipts Verification */}
          <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <span>⛽</span> Trip Expenses & Receipts ({tripExpenses.length})
              </h3>
              <span className="text-[11px] text-slate-400">
                Verify slips before approving settlement
              </span>
            </div>

            {tripExpenses.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No expense slips submitted by driver yet.</p>
            ) : (
              <div className="space-y-2.5">
                {tripExpenses.map((exp) => (
                  <div
                    key={exp.id}
                    className={`p-3 rounded-lg border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                      exp.approvalStatus === 'approved'
                        ? 'bg-slate-900/80 border-emerald-500/30'
                        : exp.approvalStatus === 'rejected'
                        ? 'bg-rose-950/20 border-rose-800/40'
                        : 'bg-slate-800/80 border-amber-500/40'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="bg-slate-800 p-2 rounded-lg text-lg">
                        {exp.expenseCategory === 'Fuel' ? '⛽' : exp.expenseCategory === 'Toll_FASTag' ? '🛣️' : '📦'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{exp.expenseCategory.replace('_', ' ')}</span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold ${
                              exp.approvalStatus === 'approved'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : exp.approvalStatus === 'rejected'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            }`}
                          >
                            {exp.approvalStatus.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {exp.vendorName || 'Highway Vendor'} • Slip: <span className="font-mono text-slate-300">{exp.slipNumber || 'N/A'}</span>
                        </p>
                        {exp.rejectionReason && (
                          <p className="text-[11px] text-rose-300 mt-1 italic">
                            Reason: {exp.rejectionReason}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 self-end sm:self-center">
                      <div className="text-right">
                        <span className="text-base font-bold text-white font-mono">
                          ₹{exp.amount.toLocaleString('en-IN')}
                        </span>
                        <span className="block text-[10px] text-slate-400">{exp.paidBy}</span>
                      </div>

                      {exp.approvalStatus === 'pending' && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleApprove(exp.id)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors"
                          >
                            ✓ Approve
                          </button>
                          <button
                            onClick={() => {
                              setRejectModalExpId(exp.id);
                              setRejectReason('');
                            }}
                            className="bg-rose-900/60 hover:bg-rose-800 text-rose-200 text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors"
                          >
                            ✕ Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 3: Reconciliation Settings & Shortage Deduction */}
          <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-4 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <span>⚙️</span> Settlement Adjustments
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Cargo Shortage / Damage Penalty (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={shortageDeduction}
                  onChange={(e) => setShortageDeduction(Number(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm font-mono focus:border-emerald-500 focus:outline-none"
                  placeholder="0.00"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Recovered from driver unspent balance or salary.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Accountant Settlement Remarks
                </label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-emerald-500 focus:outline-none"
                  placeholder="e.g. Unspent advance refunded via cash at Jaipur branch"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer & Action Bar */}
        <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            Automated double-entry journal entry will be logged into the general ledger.
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleFinalizeSettlement}
              disabled={isSubmitting}
              className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-950/50 transition-all flex items-center gap-2"
            >
              <span>{isSubmitting ? 'Processing...' : '✓ Finalize & Print Voucher'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Reject Reason Sub-modal */}
      {rejectModalExpId && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 max-w-md w-full space-y-3">
            <h4 className="text-base font-bold text-white">Reject Expense Slip</h4>
            <p className="text-xs text-slate-300">
              Provide an audit explanation for rejecting this expense claim:
            </p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Illegible fuel slip number or duplicate claim"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white text-xs focus:border-rose-500 focus:outline-none"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectModalExpId(null)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs rounded-lg hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectSubmit}
                disabled={!rejectReason.trim()}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
