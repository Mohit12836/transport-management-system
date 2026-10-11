'use client';

import React, { useState } from 'react';
import {
  Route,
  X,
  MapPin,
  Clock,
  Truck,
  Phone,
  FileText,
  AlertTriangle,
  CheckCircle,
  FileCheck2,
  XCircle,
  Printer,
  ChevronRight,
} from 'lucide-react';
import { useDemoTMS } from '../../lib/demo-context';
import { TripStatus } from '../../types/tms';

export const TripDetailsModal: React.FC = () => {
  const { selectedTripForModal, closeTripDetails, advanceTripStatus, cancelTrip, openLRPrint, activeRole } = useDemoTMS();
  const [cancellationReason, setCancellationReason] = useState('');
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!selectedTripForModal) return null;
  const trip = selectedTripForModal;

  const handleAdvance = (next: TripStatus) => {
    setErrorMessage('');
    const res = advanceTripStatus(trip.id, next, { location: trip.destinationCity });
    if (!res.success) {
      setErrorMessage(res.error || 'Failed to update status.');
    }
  };

  const handleCancel = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const res = cancelTrip(trip.id, cancellationReason);
    if (!res.success) {
      setErrorMessage(res.error || 'Failed to cancel trip.');
      return;
    }
    setShowCancelPrompt(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-white my-8">
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-base px-2.5 py-0.5 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {trip.tripNumber}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                  trip.status === 'in_transit'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : trip.status === 'delivered'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : trip.status === 'closed'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : trip.status === 'cancelled'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                {trip.status.replace('_', ' ')}
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white mt-1 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-red-500" />
              <span>{trip.originCity} → {trip.destinationCity}</span>
            </h3>
          </div>
          <button
            onClick={closeTripDetails}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="my-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="mt-6 space-y-5 text-xs">
          {/* Trip Meta Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-850/60 border border-slate-800">
            <div>
              <span className="text-slate-400 block text-[10px]">Allocated Truck:</span>
              <span className="font-mono font-bold text-white flex items-center gap-1 mt-0.5">
                <Truck className="w-3.5 h-3.5 text-emerald-400" />
                {trip.vehicleNumber}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Driver & Contact:</span>
              <span className="font-bold text-slate-200 mt-0.5 block">{trip.driverName}</span>
              <span className="text-slate-400 text-[10px]">{trip.driverPhone}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Departure Date:</span>
              <span className="font-mono text-slate-300 mt-0.5 block">{trip.plannedDepartureDate}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Gross Freight:</span>
              <span className="font-mono font-bold text-emerald-400 text-sm mt-0.5 block">
                ₹{trip.totalFreightRevenue.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Linked Consignments (LRs) */}
          <div className="p-4 rounded-2xl bg-slate-850/40 border border-slate-800 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-red-400" />
              <span>Manifested Consignments (LRs)</span>
            </h4>
            <div className="space-y-2">
              {trip.assignedLRs.map((lr) => (
                <div key={lr.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-white text-xs block">{lr.lrNumber}</span>
                    <span className="text-[11px] text-slate-400">
                      {lr.consignorName} → {lr.consigneeName} ({lr.chargedWeightTon} MT)
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-emerald-400">₹{lr.netTotalAmount.toLocaleString('en-IN')}</span>
                    <button
                      onClick={() => openLRPrint(lr)}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold transition-colors"
                    >
                      3-Copy Print
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Route Milestones & Event Stream */}
          <div className="p-5 rounded-2xl bg-slate-850/40 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Route Timeline & Milestone Audit Logs</span>
            </h4>

            <div className="space-y-3 border-l-2 border-slate-700 ml-2 pl-4">
              {trip.timelineEvents && trip.timelineEvents.length > 0 ? (
                trip.timelineEvents.map((evt) => (
                  <div key={evt.id} className="relative">
                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-slate-900" />
                    <div className="font-bold text-white text-xs">{evt.eventTitle}</div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{evt.description}</p>
                    <div className="text-[10px] text-slate-500 font-mono mt-1">
                      {new Date(evt.timestamp).toLocaleString('en-IN')} • By {evt.recordedBy}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 text-xs italic">No milestone events logged yet.</p>
              )}
            </div>
          </div>

          {/* Action Control Strip */}
          {trip.status !== 'closed' && trip.status !== 'cancelled' && (
            <div className="p-4 rounded-2xl bg-slate-850 border border-slate-700/60 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-slate-300">
                <strong>Current Status:</strong> <span className="uppercase text-amber-400 font-bold">{trip.status}</span>
              </div>

              <div className="flex items-center gap-2">
                {trip.status === 'scheduled' && (
                  <button
                    onClick={() => handleAdvance('in_transit')}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white transition-all shadow"
                  >
                    Start Trip → In-Transit
                  </button>
                )}

                {trip.status === 'in_transit' && (
                  <button
                    onClick={() => handleAdvance('delivered')}
                    className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 font-bold text-xs text-white transition-all shadow"
                  >
                    Mark Delivered (At Destination)
                  </button>
                )}

                {trip.status === 'delivered' && (
                  <button
                    onClick={() => handleAdvance('closed')}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white transition-all shadow"
                  >
                    Close & Settle Trip
                  </button>
                )}

                <button
                  onClick={() => setShowCancelPrompt(!showCancelPrompt)}
                  className="px-3 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-semibold transition-all"
                >
                  Cancel Trip
                </button>
              </div>
            </div>
          )}

          {/* Cancel Prompt Form */}
          {showCancelPrompt && (
            <form onSubmit={handleCancel} className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/40 space-y-3">
              <h5 className="font-bold text-rose-300 text-xs flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Trip Cancellation Audit Record</span>
              </h5>
              <textarea
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="Enter mandatory audit reason for cancellation (e.g. Consignor cancelled booking, truck mechanical breakdown)..."
                className="w-full bg-slate-900 border border-rose-500/30 rounded-xl p-2.5 text-xs text-white focus:outline-none"
                rows={2}
                required
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCancelPrompt(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
                >
                  Confirm Cancellation
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
