'use client';

import React from 'react';
import {
  Crown,
  TrendingUp,
  Truck,
  AlertTriangle,
  FileText,
  DollarSign,
  Calendar,
  CheckCircle2,
  ArrowUpRight,
} from 'lucide-react';
import { useDemoTMS } from '../../lib/demo-context';

export const OwnerView: React.FC<{ onOpenLR: () => void }> = ({ onOpenLR }) => {
  const { vehicles, trips, lrs, openLRPrint } = useDemoTMS();

  const totalRevenue = lrs.reduce((acc, curr) => acc + curr.netTotalAmount, 0);
  const totalTrips = trips.length + 12; // with historical
  const netProfit = Math.round(totalRevenue * 0.42); // 42% net operational margin

  return (
    <div className="space-y-6">
      {/* Executive Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <Crown className="w-3.5 h-3.5" />
              Fleet Owner & Executive Portal
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Executive Profitability & Fleet Command
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              High-level overview of active trip margins, cash collection, and vehicle compliance health.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenLR}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-900/30 transition-all hover:scale-[1.02]"
            >
              <FileText className="w-4 h-4" />
              <span>Create Consignment Note</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Freight Revenue (MTD)</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            ₹{totalRevenue.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +24% vs previous month
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Estimated Net Margin</span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-400 font-mono">
            ₹{netProfit.toLocaleString('en-IN')} <span className="text-xs text-slate-400 font-normal">(42%)</span>
          </div>
          <span className="text-[11px] text-slate-400">Post fuel & driver settlements</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Active Fleet Status</span>
            <Truck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {vehicles.filter((v) => v.status === 'in_transit').length} / {vehicles.length} In-Transit
          </div>
          <span className="text-[11px] text-emerald-400 font-semibold">100% On-Time ETA Index</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Compliance Expiry Alerts</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400">1 Urgent Alert</div>
          <span className="text-[11px] text-rose-300">RJ14-GA-8821 Insurance in 18 days</span>
        </div>
      </div>

      {/* Fleet Vehicles Table */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">Vehicle Asset Roster & Compliance</h3>
            <p className="text-xs text-slate-400">Real-time status and statutory document validities.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-300">
            <thead className="bg-slate-850 text-slate-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3">Vehicle Number</th>
                <th className="p-3">Type & Capacity</th>
                <th className="p-3">Assigned Driver</th>
                <th className="p-3">Status</th>
                <th className="p-3">Insurance Expiry</th>
                <th className="p-3">Fitness Expiry</th>
                <th className="p-3 text-right">Odometer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {vehicles.map((v) => (
                <tr key={v.id} className="hover:bg-slate-850/50 transition-colors">
                  <td className="p-3 font-mono font-bold text-white flex items-center gap-2">
                    <Truck className="w-4 h-4 text-emerald-400" />
                    {v.vehicleNumber}
                  </td>
                  <td className="p-3">{v.vehicleType}</td>
                  <td className="p-3 font-medium text-slate-200">{v.assignedDriverName || 'Unassigned'}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        v.status === 'in_transit'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {v.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="font-mono text-slate-300">{v.insuranceExpiry}</span>
                  </td>
                  <td className="p-3 font-mono text-slate-400">{v.fitnessExpiry}</td>
                  <td className="p-3 text-right font-mono font-semibold text-white">
                    {v.odometerKm.toLocaleString('en-IN')} KM
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Consignment Notes */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">Active Consignment Notes (LR / Bilty)</h3>
            <p className="text-xs text-slate-400">Click any consignment note to launch the 3-copy print layout.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-300">
            <thead className="bg-slate-850 text-slate-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3">LR Number</th>
                <th className="p-3">Consignor → Consignee</th>
                <th className="p-3">Route</th>
                <th className="p-3">Weight</th>
                <th className="p-3">Freight Terms</th>
                <th className="p-3 text-right">Net Freight</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {lrs.map((item) => (
                <tr key={item.id} className="hover:bg-slate-850/50 transition-colors">
                  <td className="p-3 font-mono font-bold text-white">{item.lrNumber}</td>
                  <td className="p-3">
                    <div className="font-semibold text-white">{item.consignorName}</div>
                    <div className="text-[11px] text-slate-400">To: {item.consigneeName}</div>
                  </td>
                  <td className="p-3 font-medium text-slate-300">
                    {item.originCity} → {item.destinationCity}
                  </td>
                  <td className="p-3 font-mono">{item.chargedWeightTon} MT</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                      {item.paymentType.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-emerald-400">
                    ₹{item.netTotalAmount.toLocaleString('en-IN')}
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => openLRPrint(item)}
                      className="px-3 py-1 rounded-lg bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/30 text-[11px] font-semibold transition-all"
                    >
                      3-Copy Print
                    </button>
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
