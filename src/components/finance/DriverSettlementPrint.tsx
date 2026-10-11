'use client';

import React from 'react';
import { useDemoTMS } from '../../lib/demo-context';
import { DriverSettlement } from '../../types/tms';

interface DriverSettlementPrintProps {
  settlement: DriverSettlement;
  onClose: () => void;
}

export const DriverSettlementPrint: React.FC<DriverSettlementPrintProps> = ({
  settlement,
  onClose,
}) => {
  const { organization } = useDemoTMS();

  const handlePrint = () => {
    window.print();
  };

  const isDriverOwing = settlement.netPayableOrRecoverable > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-8 print:border-none print:shadow-none print:w-full print:max-w-none print:m-0 print:bg-white text-slate-200 print:text-black">
        {/* Modal Top Control Bar (Hidden on print) */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500/20 text-emerald-300 font-mono text-xs px-2.5 py-1 rounded font-bold">
              PRINTABLE VOUCHER
            </span>
            <span className="text-sm font-bold text-white">Voucher #{settlement.settlementNumber}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-emerald-950/50"
            >
              <span>🖨️</span> Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded-xl"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Printable Voucher Paper */}
        <div className="p-8 bg-white text-black font-sans space-y-6">
          {/* Header */}
          <div className="border-b-2 border-slate-800 pb-4 flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
                {organization.name}
              </h1>
              <p className="text-xs text-slate-600 max-w-md mt-0.5">{organization.address}</p>
              <p className="text-xs text-slate-600">
                GSTIN: <span className="font-mono font-bold">{organization.gstin || 'N/A'}</span> • PAN: <span className="font-mono font-bold">{organization.pan || 'N/A'}</span>
              </p>
            </div>
            <div className="text-right">
              <div className="inline-block bg-slate-900 text-white px-3 py-1 rounded text-xs font-bold uppercase tracking-wider">
                Driver Trip Settlement Voucher
              </div>
              <p className="text-xs text-slate-500 font-mono mt-2">Voucher: <strong className="text-slate-900">{settlement.settlementNumber}</strong></p>
              <p className="text-xs text-slate-500">Date: <strong>{settlement.settlementDate}</strong></p>
            </div>
          </div>

          {/* Trip & Driver Meta Grid */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 border border-slate-200 p-4 rounded-lg text-xs">
            <div>
              <span className="text-slate-500 block">Driver Details:</span>
              <p className="font-bold text-slate-900 text-sm">{settlement.driverName}</p>
              <p className="text-slate-600">Driver ID: {settlement.driverId}</p>
            </div>
            <div>
              <span className="text-slate-500 block">Trip Information:</span>
              <p className="font-bold text-slate-900 text-sm">Trip #{settlement.tripNumber}</p>
              <p className="text-slate-600">Audited By: {settlement.settledBy}</p>
            </div>
          </div>

          {/* Financial Breakdown Table */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px]">
                <tr>
                  <th className="p-3">Accounting Line Description</th>
                  <th className="p-3 text-right">Debit / Credit Basis</th>
                  <th className="p-3 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                <tr>
                  <td className="p-3 font-medium">1. Gross Advances Disbursed for Trip</td>
                  <td className="p-3 text-right text-slate-500">Advance Asset Debit</td>
                  <td className="p-3 text-right font-mono font-bold text-amber-700">
                    ₹{settlement.totalAdvanceDisbursed.toLocaleString('en-IN')}
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">2. Total Approved En-route Trip Expenses (Fuel, Toll, Loading)</td>
                  <td className="p-3 text-right text-slate-500">Operating Expense Credit</td>
                  <td className="p-3 text-right font-mono font-bold text-emerald-700">
                    - ₹{settlement.totalApprovedExpenses.toLocaleString('en-IN')}
                  </td>
                </tr>
                {settlement.shortageDeductions > 0 && (
                  <tr>
                    <td className="p-3 font-medium text-rose-700">3. Cargo Shortage & Transit Damage Recovery</td>
                    <td className="p-3 text-right text-slate-500">Damage Contra Deduction</td>
                    <td className="p-3 text-right font-mono font-bold text-rose-700">
                      + ₹{settlement.shortageDeductions.toLocaleString('en-IN')}
                    </td>
                  </tr>
                )}
                <tr className="bg-slate-50 font-bold text-slate-900 border-t-2 border-slate-300">
                  <td className="p-3 text-sm">
                    {isDriverOwing ? 'Net Unspent Advance Refunded by Driver:' : 'Net Transporter Reimbursement Paid to Driver:'}
                  </td>
                  <td className="p-3 text-right text-slate-500 font-normal">
                    {isDriverOwing ? 'Cash Received at Branch' : 'Cash / UPI Disbursed'}
                  </td>
                  <td className="p-3 text-right font-mono text-base font-black text-slate-900">
                    ₹{Math.abs(settlement.netPayableOrRecoverable).toLocaleString('en-IN')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Remarks */}
          {settlement.remarks && (
            <div className="text-xs bg-slate-50 border border-slate-200 p-3 rounded-lg text-slate-700">
              <strong>Accountant Notes:</strong> {settlement.remarks}
            </div>
          )}

          {/* Signatures */}
          <div className="pt-10 grid grid-cols-3 gap-6 text-center text-xs text-slate-600">
            <div className="border-t border-slate-400 pt-2">
              <p className="font-bold text-slate-800">{settlement.driverName}</p>
              <p className="text-[10px]">Driver Signature / Thumbprint</p>
            </div>
            <div className="border-t border-slate-400 pt-2">
              <p className="font-bold text-slate-800">{settlement.settledBy}</p>
              <p className="text-[10px]">Accountant Verification</p>
            </div>
            <div className="border-t border-slate-400 pt-2">
              <p className="font-bold text-slate-800">Authorized Signatory</p>
              <p className="text-[10px]">Branch Manager Approval</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
