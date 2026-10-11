'use client';

import React from 'react';
import {
  Truck,
  X,
  ShieldCheck,
  Wrench,
  AlertTriangle,
  Calendar,
  User,
  Activity,
  FileCheck,
} from 'lucide-react';
import { useDemoTMS } from '../../lib/demo-context';

export const VehicleDetailsModal: React.FC = () => {
  const { selectedVehicleForModal, closeVehicleDetails } = useDemoTMS();

  if (!selectedVehicleForModal) return null;
  const v = selectedVehicleForModal;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-white my-8">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl sm:text-2xl font-black font-mono tracking-tight text-white">
                  {v.vehicleNumber}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {v.status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {v.vehicleType} • {v.ownershipType.toUpperCase()} Fleet • {v.carryingCapacityTon} MT Rated
              </p>
            </div>
          </div>
          <button
            onClick={closeVehicleDetails}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-6 space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-850/50 border border-slate-800 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">Odometer Reading:</span>
              <span className="font-mono font-bold text-white text-sm">{v.odometerKm.toLocaleString('en-IN')} KM</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Assigned Driver:</span>
              <span className="font-bold text-slate-200">{v.assignedDriverName || 'Unassigned'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Chassis Number:</span>
              <span className="font-mono text-slate-300">{v.chassisNumber || 'MAT4829141029'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Registration Year:</span>
              <span className="font-mono text-slate-300">{v.createdAt ? new Date(v.createdAt).getFullYear() : '2026'}</span>
            </div>
          </div>

          {/* Compliance Expiry Radar */}
          <div className="p-5 rounded-2xl bg-slate-850/40 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Statutory Document Validity Radar</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-750">
                <span className="text-[10px] text-slate-400 block">Comprehensive Insurance</span>
                <span className="font-mono font-bold text-white block mt-0.5">{v.insuranceExpiry || '2027-10-10'}</span>
                <span className="text-[10px] text-emerald-400 font-semibold">Valid Policy</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-750">
                <span className="text-[10px] text-slate-400 block">State/National Fitness</span>
                <span className="font-mono font-bold text-white block mt-0.5">{v.fitnessExpiry || '2027-02-15'}</span>
                <span className="text-[10px] text-emerald-400 font-semibold">RTO Verified</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-750">
                <span className="text-[10px] text-slate-400 block">National Permit & PUC</span>
                <span className="font-mono font-bold text-white block mt-0.5">{v.permitExpiry || '2027-06-20'}</span>
                <span className="text-[10px] text-emerald-400 font-semibold">All India Permit</span>
              </div>
            </div>
          </div>

          {/* Maintenance & Service History */}
          <div className="p-5 rounded-2xl bg-slate-850/40 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Wrench className="w-4 h-4 text-amber-400" />
              <span>Service & Workshop History</span>
            </h4>

            {v.maintenanceLogs && v.maintenanceLogs.length > 0 ? (
              <div className="space-y-2">
                {v.maintenanceLogs.map((log) => (
                  <div key={log.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs flex justify-between items-start gap-3">
                    <div>
                      <div className="font-bold text-white">{log.serviceType}</div>
                      <div className="text-slate-400 text-[11px] mt-0.5">
                        Workshop: {log.workshopName} • Date: {log.serviceDate} • At {log.odometerKm.toLocaleString('en-IN')} KM
                      </div>
                      {log.remarks && <p className="text-[10px] text-slate-400 italic mt-1">{log.remarks}</p>}
                    </div>
                    <div className="font-mono font-bold text-amber-400 text-sm shrink-0">
                      ₹{log.cost.toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No historical maintenance logs recorded for this vehicle.</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end pt-4 border-t border-slate-800">
          <button
            onClick={closeVehicleDetails}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 font-medium text-xs text-slate-300 transition-colors"
          >
            Close 360° View
          </button>
        </div>
      </div>
    </div>
  );
};
