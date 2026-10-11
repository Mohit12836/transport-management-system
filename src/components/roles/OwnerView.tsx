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
      <div className="glass-panel glass-panel-emerald p-6 sm:p-8 bg-gradient-to-br from-emerald-950/60 via-slate-900/90 to-slate-950/95 border border-emerald-500/30 text-white shadow-[0_12px_40px_rgba(16,185,129,0.15)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold badge-glow-emerald">
              <Crown className="w-3.5 h-3.5 text-emerald-400" />
              Fleet Owner & Executive Portal
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
              Executive Profitability & Fleet Command
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-medium">
              High-level overview of active trip margins, cash collection, and vehicle compliance health.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenLR}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs sm:text-sm font-bold shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(20,184,166,0.6)] transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
            >
              <FileText className="w-4 h-4 text-emerald-100" />
              <span>Create Consignment Note</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="glass-panel glass-panel-emerald p-5 space-y-2 hover:-translate-y-1 hover:border-emerald-500/60 hover:shadow-[0_12px_35px_rgba(16,185,129,0.25)] transition-all duration-300">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Total Freight Revenue (MTD)</span>
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
            ₹{totalRevenue.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +24% vs previous month
          </span>
        </div>

        {/* Estimated Net Margin */}
        <div className="glass-panel glass-panel-cyan p-5 space-y-2 hover:-translate-y-1 hover:border-cyan-500/60 hover:shadow-[0_12px_35px_rgba(6,182,212,0.25)] transition-all duration-300">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Estimated Net Margin</span>
            <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-cyan-400 font-mono tracking-tight">
            ₹{netProfit.toLocaleString('en-IN')} <span className="text-xs text-slate-400 font-medium">(42%)</span>
          </div>
          <span className="text-[11px] text-slate-300 font-medium">Post fuel & driver settlements</span>
        </div>

        {/* Active Fleet Status */}
        <div className="glass-panel glass-panel-amber p-5 space-y-2 hover:-translate-y-1 hover:border-amber-500/60 hover:shadow-[0_12px_35px_rgba(245,158,11,0.25)] transition-all duration-300">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Active Fleet Status</span>
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {vehicles.filter((v) => v.status === 'in_transit').length} / {vehicles.length} In-Transit
          </div>
          <span className="text-[11px] text-amber-400 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> 100% On-Time ETA Index
          </span>
        </div>

        {/* Compliance Expiry Alerts */}
        <div className="glass-panel glass-panel-rose p-5 space-y-2 hover:-translate-y-1 hover:border-rose-500/60 hover:shadow-[0_12px_35px_rgba(244,63,94,0.25)] transition-all duration-300">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Compliance Expiry Alerts</span>
            <div className="p-2 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-400 tracking-tight">1 Urgent Alert</div>
          <span className="text-[11px] text-rose-300 font-semibold">RJ14-GA-8821 Insurance in 18 days</span>
        </div>
      </div>

      {/* Fleet Vehicles Table */}
      <div className="glass-panel glass-panel-cyan p-6 space-y-4 shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Vehicle Asset Roster & Compliance</h3>
            <p className="text-xs text-slate-400">Real-time status and statutory document validities.</p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-white/5 bg-slate-950/40">
          <table className="w-full text-xs text-left text-slate-300">
            <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider text-[10px] border-b border-white/5">
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
            <tbody className="divide-y divide-slate-800/80">
              {vehicles.map((v) => (
                <tr key={v.id} className="hover:bg-cyan-950/20 transition-colors">
                  <td className="p-3 font-mono font-bold text-white flex items-center gap-2">
                    <Truck className="w-4 h-4 text-cyan-400" />
                    {v.vehicleNumber}
                  </td>
                  <td className="p-3 font-medium">{v.vehicleType}</td>
                  <td className="p-3 font-medium text-slate-200">{v.assignedDriverName || 'Unassigned'}</td>
                  <td className="p-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        v.status === 'in_transit'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {v.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="font-mono text-slate-300 font-semibold">{v.insuranceExpiry}</span>
                  </td>
                  <td className="p-3 font-mono text-slate-400">{v.fitnessExpiry}</td>
                  <td className="p-3 text-right font-mono font-bold text-white">
                    {v.odometerKm.toLocaleString('en-IN')} KM
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Consignment Notes */}
      <div className="glass-panel glass-panel-indigo p-6 space-y-4 shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Active Consignment Notes (LR / Bilty)</h3>
            <p className="text-xs text-slate-400">Click any consignment note to launch the 3-copy print layout.</p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-white/5 bg-slate-950/40">
          <table className="w-full text-xs text-left text-slate-300">
            <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider text-[10px] border-b border-white/5">
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
            <tbody className="divide-y divide-slate-800/80">
              {lrs.map((item) => (
                <tr key={item.id} className="hover:bg-indigo-950/25 transition-colors">
                  <td className="p-3 font-mono font-bold text-indigo-300">{item.lrNumber}</td>
                  <td className="p-3">
                    <div className="font-semibold text-white">{item.consignorName}</div>
                    <div className="text-[11px] text-slate-400">To: {item.consigneeName}</div>
                  </td>
                  <td className="p-3 font-medium text-slate-300">
                    {item.originCity} → {item.destinationCity}
                  </td>
                  <td className="p-3 font-mono font-semibold">{item.chargedWeightTon} MT</td>
                  <td className="p-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-800/80 text-slate-300 border border-slate-700/80">
                      {item.paymentType.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-emerald-400">
                    ₹{item.netTotalAmount.toLocaleString('en-IN')}
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => openLRPrint(item)}
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600/30 to-cyan-600/30 hover:from-indigo-600 hover:to-cyan-600 text-indigo-200 hover:text-white border border-indigo-400/40 text-[11px] font-bold transition-all hover:scale-105 active:scale-95 shadow-[0_0_12px_rgba(99,102,241,0.25)] hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] cursor-pointer"
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
