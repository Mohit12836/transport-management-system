'use client';

import React from 'react';
import {
  Handshake,
  Truck,
  FileCheck,
  Percent,
  CheckCircle,
  Building2,
  Phone,
} from 'lucide-react';

export const VendorView: React.FC = () => {
  const mockBills = [
    {
      billNo: 'VEND-BILL-891',
      truckNo: 'HR55-AJ-9014',
      route: 'Jaipur → Mumbai',
      grossFreight: 64000,
      tdsRate: '2% (Sec 194C)',
      tdsAmount: 1280,
      netPayable: 62720,
      paidAmount: 62720,
      status: 'Settled',
    },
    {
      billNo: 'VEND-BILL-904',
      truckNo: 'HR55-AJ-9014',
      route: 'Jaipur → Gurugram',
      grossFreight: 28000,
      tdsRate: '2% (Sec 194C)',
      tdsAmount: 560,
      netPayable: 27440,
      paidAmount: 15000,
      status: 'Balance ₹12,440 Due',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-rose-950/40 via-slate-900 to-slate-900 border border-rose-500/30 text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
              <Handshake className="w-3.5 h-3.5" />
              Vendor & Truck Brokerage Portal
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Vendor: Rajasthan Freight Carriers & Brokers
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              Track attached vehicle trips, review statutory TDS tax deductions, and download payment advice vouchers.
            </p>
          </div>
        </div>
      </div>

      {/* Attached Fleet Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="text-slate-400 text-xs">Attached Vehicles Placed</div>
          <div className="text-2xl font-black text-white">1 Truck</div>
          <span className="text-[11px] text-slate-400 font-mono">HR55-AJ-9014 (35 Ton Trailer)</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="text-slate-400 text-xs">Total Freight Billed (MTD)</div>
          <div className="text-2xl font-black text-white font-mono">₹92,000</div>
          <span className="text-[11px] text-emerald-400 font-semibold">2 Completed Trips</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="text-slate-400 text-xs">TDS Deducted (Sec 194C)</div>
          <div className="text-2xl font-black text-rose-400 font-mono">₹1,840</div>
          <span className="text-[11px] text-slate-400">Form 16A Certificate Ready</span>
        </div>
      </div>

      {/* Vendor Freight Bills Table */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">Submitted Freight Bills & Settlements</h3>
            <p className="text-xs text-slate-400">Detailed breakdown of gross freight, TDS tax, and disbursed payments.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-300">
            <thead className="bg-slate-850 text-slate-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3">Bill Number</th>
                <th className="p-3">Vehicle</th>
                <th className="p-3">Route</th>
                <th className="p-3">Gross Freight</th>
                <th className="p-3">TDS (194C)</th>
                <th className="p-3">Net Payable</th>
                <th className="p-3">Paid Amount</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {mockBills.map((b, idx) => (
                <tr key={idx} className="hover:bg-slate-850/50 transition-colors">
                  <td className="p-3 font-mono font-bold text-white">{b.billNo}</td>
                  <td className="p-3 font-mono text-slate-300">{b.truckNo}</td>
                  <td className="p-3 font-medium text-slate-300">{b.route}</td>
                  <td className="p-3 font-mono font-semibold text-white">₹{b.grossFreight.toLocaleString('en-IN')}</td>
                  <td className="p-3 font-mono text-rose-400">-₹{b.tdsAmount.toLocaleString('en-IN')} ({b.tdsRate})</td>
                  <td className="p-3 font-mono font-bold text-emerald-400">₹{b.netPayable.toLocaleString('en-IN')}</td>
                  <td className="p-3 font-mono text-slate-200">₹{b.paidAmount.toLocaleString('en-IN')}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-200 border border-slate-700">
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
