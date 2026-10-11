'use client';

import React, { useState } from 'react';
import {
  Truck,
  PlusCircle,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Wrench,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { useDemoTMS } from '../../lib/demo-context';
import { Vehicle, VehicleOwnership, VehicleStatus } from '../../types/tms';

interface VehicleRosterProps {
  onOpenAddVehicle: () => void;
}

export const VehicleRoster: React.FC<VehicleRosterProps> = ({ onOpenAddVehicle }) => {
  const { vehicles, openVehicleDetails, activeRole } = useDemoTMS();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOwnership, setFilterOwnership] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredVehicles = vehicles.filter((v) => {
    const matchSearch =
      v.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.vehicleType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.assignedDriverName && v.assignedDriverName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchOwnership = filterOwnership === 'all' || v.ownershipType === filterOwnership;
    const matchStatus = filterStatus === 'all' || v.status === filterStatus;

    return matchSearch && matchOwnership && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Truck className="w-6 h-6 text-emerald-400" />
            <span>Fleet Vehicle Registry</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Manage owned trucks, attached vehicles, and market fleets with live compliance radars.
          </p>
        </div>

        {(activeRole === 'owner' || activeRole === 'manager' || activeRole === 'superadmin') && (
          <button
            onClick={onOpenAddVehicle}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-900/30 transition-all hover:scale-[1.02]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Register New Vehicle</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 bg-slate-850 border border-slate-700/80 rounded-xl px-3 py-1.5 w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by truck# (RJ14...), driver..."
            className="bg-transparent border-none text-xs text-white placeholder-slate-500 focus:outline-none w-full"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs">
          <div className="flex items-center gap-1 text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Type:</span>
          </div>
          <select
            value={filterOwnership}
            onChange={(e) => setFilterOwnership(e.target.value)}
            className="bg-slate-850 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 text-xs focus:outline-none"
          >
            <option value="all">All Fleets</option>
            <option value="owned">Owned</option>
            <option value="attached">Attached</option>
            <option value="market">Market Hired</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-850 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 text-xs focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="available">Available</option>
            <option value="in_transit">In Transit</option>
            <option value="maintenance">Maintenance</option>
            <option value="out_of_service">Out of Service</option>
          </select>
        </div>
      </div>

      {/* Vehicle Cards / Table */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-300">
            <thead className="bg-slate-850 text-slate-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3">Vehicle Number</th>
                <th className="p-3">Fleet Category</th>
                <th className="p-3">Type & Capacity</th>
                <th className="p-3">Assigned Driver</th>
                <th className="p-3">Status</th>
                <th className="p-3">Insurance Radar</th>
                <th className="p-3 text-right">Odometer</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-500 text-xs">
                    No vehicles matching filter criteria.
                  </td>
                </tr>
              ) : (
                filteredVehicles.map((v) => {
                  const isInsuranceExpiringSoon = v.insuranceExpiry?.includes('2026-10');
                  return (
                    <tr key={v.id} className="hover:bg-slate-850/60 transition-colors">
                      <td className="p-3 font-mono font-bold text-white flex items-center gap-2">
                        <Truck className="w-4 h-4 text-emerald-400" />
                        <span>{v.vehicleNumber}</span>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                          {v.ownershipType}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-white">{v.vehicleType}</div>
                        <div className="text-[10px] text-slate-400">{v.carryingCapacityTon} MT Capacity</div>
                      </td>
                      <td className="p-3 font-medium text-slate-200">
                        {v.assignedDriverName || <span className="text-slate-500 italic">Unassigned</span>}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            v.status === 'in_transit'
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : v.status === 'maintenance'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {v.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3">
                        {isInsuranceExpiringSoon ? (
                          <span className="inline-flex items-center gap-1 font-mono font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 text-[11px]">
                            <AlertTriangle className="w-3 h-3 text-rose-400" />
                            {v.insuranceExpiry} (Expiring)
                          </span>
                        ) : (
                          <span className="font-mono text-slate-300 text-[11px]">{v.insuranceExpiry || 'Valid'}</span>
                        )}
                      </td>
                      <td className="p-3 text-right font-mono font-semibold text-white">
                        {v.odometerKm.toLocaleString('en-IN')} KM
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => openVehicleDetails(v)}
                          className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-[11px] font-semibold transition-all inline-flex items-center gap-1"
                        >
                          <span>360° View</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
