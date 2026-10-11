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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Route className="w-6 h-6 text-blue-400" />
            <span>Trip Dispatch Board & Pipeline</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Operational pipeline tracking assignments, en-route checkpoints, digital PODs, and final trip closure.
          </p>
        </div>

        {(activeRole === 'owner' || activeRole === 'manager' || activeRole === 'superadmin') && (
          <button
            onClick={onOpenTripAssignment}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-900/30 transition-all hover:scale-[1.02]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Schedule & Assign Trip</span>
          </button>
        )}
      </div>

      {/* Kanban Multi-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
        {columns.map((col) => {
          const colTrips = trips.filter((t) => t.status === col.status);
          return (
            <div
              key={col.status}
              className="rounded-3xl bg-slate-900/90 border border-slate-800 p-4 space-y-3 min-h-[420px] shadow-lg flex flex-col justify-between"
            >
              <div>
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${col.badgeColor}`}>
                    {col.label}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-400">
                    {colTrips.length}
                  </span>
                </div>

                {/* Cards List */}
                <div className="mt-3 space-y-3">
                  {colTrips.length === 0 ? (
                    <div className="p-6 text-center text-slate-600 text-xs italic">
                      No trips in {col.status}
                    </div>
                  ) : (
                    colTrips.map((trip) => (
                      <div
                        key={trip.id}
                        onClick={() => openTripDetails(trip)}
                        className="group cursor-pointer p-4 rounded-2xl bg-slate-850/80 border border-slate-750 hover:border-blue-500/50 hover:bg-slate-800 transition-all space-y-2.5 shadow-md"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-xs text-blue-400 group-hover:text-blue-300">
                            {trip.tripNumber}
                          </span>
                          <span className="font-mono font-bold text-emerald-400 text-xs">
                            ₹{trip.totalFreightRevenue.toLocaleString('en-IN')}
                          </span>
                        </div>

                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                          <span className="truncate">{trip.originCity} → {trip.destinationCity}</span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] space-y-1">
                          <div className="flex items-center justify-between text-slate-300">
                            <span className="text-slate-400">Truck:</span>
                            <span className="font-mono font-semibold text-white">{trip.vehicleNumber}</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-300">
                            <span className="text-slate-400">Driver:</span>
                            <span className="font-semibold text-white truncate max-w-[120px]">{trip.driverName}</span>
                          </div>
                          {trip.podRecord && (
                            <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                              <span className="text-slate-400">POD:</span>
                              <span
                                className={`font-bold ${
                                  trip.podRecord.status === 'verified' ? 'text-emerald-400' : 'text-cyan-400'
                                }`}
                              >
                                {trip.podRecord.status.toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="pt-2 flex items-center justify-between text-[10px] text-slate-400">
                          <span>{trip.assignedLRs.length} Consignments</span>
                          <span className="text-blue-400 group-hover:underline flex items-center gap-0.5 font-semibold">
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
                  className="w-full py-2 rounded-xl border border-dashed border-slate-700 hover:border-blue-500 text-xs text-slate-400 hover:text-blue-300 transition-colors"
                >
                  + Add Trip
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
