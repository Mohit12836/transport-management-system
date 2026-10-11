'use client';

import React, { useState } from 'react';
import {
  Route,
  PlusCircle,
  Truck,
  MapPin,
  Clock,
  CheckCircle2,
  ChevronRight,
  Printer,
  AlertCircle,
  ShieldCheck,
  FileCheck2,
} from 'lucide-react';
import { useDemoTMS } from '../../lib/demo-context';
import { Trip, TripStatus } from '../../types/tms';

interface DispatchBoardProps {
  onOpenTripAssignment: () => void;
}

export const DispatchBoard: React.FC<DispatchBoardProps> = ({ onOpenTripAssignment }) => {
  const { trips, openTripDetails, openLRPrint, activeRole } = useDemoTMS();

  const columns: { status: TripStatus; label: string; badgeColor: string }[] = [
    { status: 'scheduled', label: '1. Scheduled & Assigned', badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
    { status: 'in_transit', label: '2. En-Route In Transit', badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
    { status: 'delivered', label: '3. Delivered (POD Pending)', badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
    { status: 'closed', label: '4. Closed & Settled', badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 glass-panel glass-panel-cyan bg-gradient-to-br from-cyan-950/40 via-slate-900/90 to-slate-950 border border-cyan-500/30">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold badge-glow-indigo mb-2">
            <Route className="w-3.5 h-3.5 text-cyan-400" />
            Live Logistics Operations
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2 tracking-tight">
            <span>Trip Dispatch Board & Pipeline</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl font-medium">
            Operational pipeline tracking assignments, en-route checkpoints, digital PODs, and final trip closure.
          </p>
        </div>

        {(activeRole === 'owner' || activeRole === 'manager' || activeRole === 'superadmin') && (
          <button
            onClick={onOpenTripAssignment}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs sm:text-sm shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] transition-all hover:scale-[1.02] active:scale-95 cursor-pointer shrink-0"
          >
            <PlusCircle className="w-4 h-4 text-cyan-200" />
            <span>+ Schedule & Assign Trip</span>
          </button>
        )}
      </div>

      {/* Kanban Multi-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
        {columns.map((col, idx) => {
          const colTrips = trips.filter((t) => t.status === col.status);
          const panelColors = ['glass-panel-indigo', 'glass-panel-amber', 'glass-panel-cyan', 'glass-panel-emerald'];
          return (
            <div
              key={col.status}
              className={`glass-panel ${panelColors[idx]} p-4 space-y-3 min-h-[460px] shadow-[0_8px_30px_rgba(0,0,0,0.5)] flex flex-col justify-between`}
            >
              <div>
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full border shadow-sm ${col.badgeColor}`}>
                    {col.label}
                  </span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-slate-800/80 text-white border border-white/5">
                    {colTrips.length}
                  </span>
                </div>

                {/* Cards List */}
                <div className="mt-3 space-y-3">
                  {colTrips.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs italic bg-slate-950/40 rounded-2xl border border-dashed border-white/5">
                      No trips currently in {col.status.replace('_', ' ')}
                    </div>
                  ) : (
                    colTrips.map((trip) => (
                      <div
                        key={trip.id}
                        onClick={() => openTripDetails(trip)}
                        className="group cursor-pointer p-4 rounded-2xl bg-slate-900/90 border border-white/10 hover:border-indigo-400/60 hover:shadow-[0_8px_25px_rgba(99,102,241,0.25)] transition-all duration-300 space-y-2.5 hover:-translate-y-1 shadow-md"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-xs text-indigo-300 group-hover:text-cyan-300 transition-colors">
                            {trip.tripNumber}
                          </span>
                          <span className="font-mono font-bold text-emerald-400 text-xs">
                            ₹{trip.totalFreightRevenue.toLocaleString('en-IN')}
                          </span>
                        </div>

                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span className="truncate">{trip.originCity} → {trip.destinationCity}</span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-950/80 border border-white/5 text-[11px] space-y-1.5">
                          <div className="flex items-center justify-between text-slate-300">
                            <span className="text-slate-400">Truck:</span>
                            <span className="font-mono font-bold text-white">{trip.vehicleNumber}</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-300">
                            <span className="text-slate-400">Driver:</span>
                            <span className="font-semibold text-white truncate max-w-[120px]">{trip.driverName}</span>
                          </div>
                          {trip.podRecord && (
                            <div className="flex items-center justify-between pt-1 border-t border-white/5">
                              <span className="text-slate-400">POD:</span>
                              <span
                                className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
                                  trip.podRecord.status === 'verified' ? 'text-emerald-400 bg-emerald-500/15' : 'text-cyan-400 bg-cyan-500/15'
                                }`}
                              >
                                {trip.podRecord.status.toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="pt-2 flex items-center justify-between text-[10px] text-slate-400">
                          <span className="font-medium text-slate-400">{trip.assignedLRs.length} Consignments</span>
                          <span className="text-indigo-400 group-hover:text-cyan-300 flex items-center gap-0.5 font-bold transition-colors">
                            View Timeline <ChevronRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Bottom Quick Action */}
              {col.status === 'scheduled' && (
                <button
                  onClick={onOpenTripAssignment}
                  className="w-full py-2.5 rounded-xl border border-dashed border-indigo-500/40 hover:border-indigo-400 bg-indigo-500/5 hover:bg-indigo-500/15 text-xs font-semibold text-indigo-300 hover:text-white transition-all cursor-pointer"
                >
                  + Add New Trip
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
