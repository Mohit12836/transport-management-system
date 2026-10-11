'use client';

import React from 'react';
import { useDemoTMS } from '../../lib/demo-context';
import { VendorSettlement } from '../../types/tms';

interface VendorSettlementPrintProps {
  voucher: VendorSettlement;
  onClose: () => void;
}

export const VendorSettlementPrint: React.FC<VendorSettlementPrintProps> = ({
  voucher,
  onClose,
}) => {
  const { organization } = useDemoTMS();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-8 print:border-none print:shadow-none print:w-full print:max-w-none print:m-0 print:bg-white text-slate-200 print:text-black">
        {/* Top Control Bar (Hidden on print) */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <span className="bg-purple-500/20 text-purple-300 font-mono text-xs px-2.5 py-1 rounded font-bold">
              TDS SECTION 194C VOUCHER
            </span>
            <span className="text-sm font-bold text-white">Voucher #{voucher.voucherNumber}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-purple-950/50"
            >
              <span>🖨️</span> Print Voucher / Form 16A Extract
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded-xl"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Printable Sheet */}
        <div className="p-8 bg-white text-black font-sans space-y-6">
          <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-black uppercase text-slate-900 tracking-tight">
                {organization.name}
              </h1>
              <p className="text-xs text-slate-600 mt-0.5">{organization.address}</p>
              <p className="text-xs text-slate-600">
                GSTIN: <span className="font-mono font-bold">{organization.gstin || '08AABCZ1234F1ZP'}</span> • PAN: <span className="font-mono font-bold">{organization.pan || 'AABCZ1234F'}</span>
              </p>
            </div>
            <div className="text-right">
              <span className="inline-block bg-purple-900 text-white font-bold px-3 py-1 rounded text-xs uppercase tracking-wider">
                Vendor Freight Payment Voucher
              </span>
              <p className="font-mono text-xs text-slate-500 mt-2">Voucher: <strong className="text-slate-900">{voucher.voucherNumber}</strong></p>
              <p className="text-xs text-slate-500">Date: <strong>{voucher.paymentDate || voucher.createdAt.split('T')[0]}</strong></p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 uppercase font-bold text-[10px] block">Vendor / Payee Details:</span>
              <p className="font-bold text-slate-900 text-sm mt-0.5">{voucher.vendorName}</p>
              <p className="text-slate-600">Category: {voucher.vendorType.replace('_', ' ')}</p>
              <p className="text-slate-800 font-medium mt-1">
                PAN: <span className="font-mono font-bold">{voucher.panNumber || 'NOT FURNISHED'}</span>
              </p>
            </div>
            <div>
              <span className="text-slate-500 uppercase font-bold text-[10px] block">Trip & Transaction Reference:</span>
              <p className="text-slate-700 mt-0.5">Trip Link: <strong className="font-mono">{voucher.tripNumber || 'General Fleet Hire'}</strong></p>
              <p className="text-slate-700">Bank UTR / Ref: <strong className="font-mono">{voucher.paymentRef || 'NEFT Pending'}</strong></p>
              <p className="text-slate-700">Status: <strong className="text-emerald-700 uppercase font-bold">{voucher.settlementStatus}</strong></p>
            </div>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px]">
                <tr>
                  <th className="p-3">Accounting Item</th>
                  <th className="p-3 text-right">Statutory Section</th>
                  <th className="p-3 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                <tr>
                  <td className="p-3 font-medium">1. Gross Freight / Market Truck Hire Charges</td>
                  <td className="p-3 text-right text-slate-500 font-mono">-</td>
                  <td className="p-3 text-right font-mono font-bold text-slate-900">
                    ₹{voucher.grossFreight.toLocaleString('en-IN')}
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-amber-700">2. Less: Advance Disbursed Prior to Trip</td>
                  <td className="p-3 text-right text-slate-500 font-mono">Clearing A/c</td>
                  <td className="p-3 text-right font-mono font-bold text-amber-700">
                    - ₹{voucher.advancePaid.toLocaleString('en-IN')}
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-purple-700">
                    3. Less: TDS Deducted @ {voucher.tdsRatePercent}%
                  </td>
                  <td className="p-3 text-right text-slate-500 font-mono">{voucher.tdsSection}</td>
                  <td className="p-3 text-right font-mono font-bold text-purple-700">
                    - ₹{voucher.tdsAmount.toLocaleString('en-IN')}
                  </td>
                </tr>
                {voucher.shortageDeductions > 0 && (
                  <tr>
                    <td className="p-3 font-medium text-rose-700">4. Less: Transit Shortage Deductions</td>
                    <td className="p-3 text-right text-slate-500 font-mono">Damage Claim</td>
                    <td className="p-3 text-right font-mono font-bold text-rose-700">
                      - ₹{voucher.shortageDeductions.toLocaleString('en-IN')}
                    </td>
                  </tr>
                )}
                <tr className="bg-slate-50 font-bold text-slate-900 border-t-2 border-slate-300">
                  <td className="p-3 text-sm">Net Balance Payable / Disbursed to Vendor:</td>
                  <td className="p-3 text-right text-slate-500 font-normal">NEFT / Bank Transfer</td>
                  <td className="p-3 text-right font-mono text-base font-black text-slate-900">
                    ₹{voucher.netPayable.toLocaleString('en-IN')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="text-xs bg-slate-50 border border-slate-200 p-3 rounded-lg text-slate-700 space-y-1">
            <p><strong>Statutory TDS Note:</strong> {voucher.remarks}</p>
            <p className="text-[10px] text-slate-500">
              * TDS will be deposited into the Central Government Account under Section 194C / 206AA. Form 16A TDS certificate will be issued quarterly.
            </p>
          </div>

          <div className="pt-8 grid grid-cols-2 gap-6 text-xs text-slate-700">
            <div>
              <p className="font-bold">Vendor Acknowledgment</p>
              <div className="h-8"></div>
              <p className="text-[10px] text-slate-500">Receiver Signature & Stamp</p>
            </div>
            <div className="text-right">
              <p className="font-bold">For {organization.name}</p>
              <div className="h-8"></div>
              <p className="text-[10px] text-slate-500">Authorized Financial Signatory</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
