'use client';

import React from 'react';
import {
  Route,
  PlusCircle,
  Truck,
  FileText,
  MapPin,
  Phone,
  CheckCircle,
  Clock,
  Printer,
  Layers,
} from 'lucide-react';
import { useDemoTMS } from '../../lib/demo-context';

export const ManagerView: React.FC<{ onOpenLR: () => void }> = ({ onOpenLR }) => {
  const { lrs, trips, openLRPrint } = useDemoTMS();

  return (
    <div className="space-y-6">
      {/* Manager Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-blue-950/40 via-slate-900 to-slate-900 border border-blue-500/30 text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
              <Route className="w-3.5 h-3.5" />
              Dispatch & Operations Command
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Daily Booking & Fleet Dispatch Pipeline
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              Create consignment notes (LR/Bilty), assign trucks & drivers, and track en-route deliveries.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenLR}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-red-900/30 transition-all hover:scale-[1.02]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Generate LR / Bilty</span>
            </button>
          </div>
        </div>
      </div>

      {/* Active Trip Dispatch Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {trips.map((trip) => (
          <div
            key={trip.id}
            className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-lg hover:border-slate-700 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {trip.tripNumber}
                </span>
                <h4 className="font-extrabold text-base text-white mt-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-red-500" />
                  {trip.originCity} → {trip.destinationCity}
                </h4>
              </div>

              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 animate-spin" />
                {trip.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-850/50 border border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Assigned Vehicle:</span>
                <span className="font-mono font-bold text-white flex items-center gap-1 mt-0.5">
                  <Truck className="w-3.5 h-3.5 text-blue-400" />
                  {trip.vehicleNumber}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Driver & Contact:</span>
                <span className="font-bold text-white flex items-center gap-1 mt-0.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  {trip.driverName}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
              <div className="text-slate-400">
                Revenue: <strong className="text-emerald-400">₹{trip.totalFreightRevenue.toLocaleString('en-IN')}</strong>
              </div>
              {trip.assignedLRs[0] && (
                <button
                  onClick={() => openLRPrint(trip.assignedLRs[0])}
                  className="inline-flex items-center gap-1 text-red-400 hover:text-red-300 font-semibold underline decoration-dotted"
                >
                  <Printer className="w-3.5 h-3.5" />
                  View 3-Copy LR
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Consignment Notes Table */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">Consignment Registry (LR / Bilty)</h3>
            <p className="text-xs text-slate-400">Manage all consignments, update status and print documents.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-300">
            <thead className="bg-slate-850 text-slate-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3">LR Number</th>
                <th className="p-3">Date</th>
                <th className="p-3">Consignor</th>
                <th className="p-3">Consignee</th>
                <th className="p-3">Weight</th>
                <th className="p-3">Freight (₹)</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-center">3-Copy Print</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {lrs.map((item) => (
                <tr key={item.id} className="hover:bg-slate-850/50 transition-colors">
                  <td className="p-3 font-mono font-bold text-white">{item.lrNumber}</td>
                  <td className="p-3 text-slate-400">{item.lrDate}</td>
                  <td className="p-3 font-medium text-white">{item.consignorName}</td>
                  <td className="p-3 font-medium text-slate-300">{item.consigneeName}</td>
                  <td className="p-3 font-mono">{item.chargedWeightTon} MT</td>
                  <td className="p-3 font-mono font-bold text-emerald-400">
                    ₹{item.netTotalAmount.toLocaleString('en-IN')}
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase">
                      {item.status}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => openLRPrint(item)}
                      className="px-3 py-1 rounded-lg bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/30 text-[11px] font-semibold transition-all"
                    >
                      Open Print
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
