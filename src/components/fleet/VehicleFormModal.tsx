'use client';

import React, { useState } from 'react';
import { Truck, X, PlusCircle, AlertCircle, Check } from 'lucide-react';
import { useDemoTMS } from '../../lib/demo-context';
import { VehicleOwnership, VehicleStatus } from '../../types/tms';

interface VehicleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VehicleFormModal: React.FC<VehicleFormModalProps> = ({ isOpen, onClose }) => {
  const { registerVehicle, drivers } = useDemoTMS();

  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('12-Wheeler Heavy Truck (25 Ton)');
  const [ownershipType, setOwnershipType] = useState<VehicleOwnership>('owned');
  const [carryingCapacityTon, setCarryingCapacityTon] = useState<number>(25);
  const [odometerKm, setOdometerKm] = useState<number>(45000);
  const [insuranceExpiry, setInsuranceExpiry] = useState('2027-10-15');
  const [fitnessExpiry, setFitnessExpiry] = useState('2027-04-10');
  const [assignedDriverId, setAssignedDriverId] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const assignedDrv = drivers.find((d) => d.id === assignedDriverId);

    const res = registerVehicle({
      organizationId: 'org-demo-001',
      vehicleNumber: vehicleNumber.trim().toUpperCase(),
      vehicleType,
      ownershipType,
      carryingCapacityTon: Number(carryingCapacityTon),
      status: 'available' as VehicleStatus,
      odometerKm: Number(odometerKm) || 0,
      assignedDriverId: assignedDriverId || undefined,
      assignedDriverName: assignedDrv?.fullName || undefined,
      insuranceExpiry,
      fitnessExpiry,
      rcExpiry: '2031-01-01',
      permitExpiry: '2028-01-01',
      pucExpiry: '2027-01-01',
    });

    if (!res.success) {
      setErrorMessage(res.error || 'Failed to register vehicle.');
      return;
    }

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-white my-8">
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              <Truck className="w-5 h-5 text-emerald-400" />
              <span>Register New Fleet Vehicle</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Add owned, attached or market trucks with capacity and compliance policy dates.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="my-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Vehicle Number *</label>
              <input
                type="text"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                placeholder="e.g. RJ14-GB-9912"
                className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Fleet Ownership *</label>
              <select
                value={ownershipType}
                onChange={(e) => setOwnershipType(e.target.value as VehicleOwnership)}
                className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="owned">Owned Fleet</option>
                <option value="attached">Attached Truck</option>
                <option value="market">Market Hired</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Vehicle Type *</label>
              <input
                type="text"
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                placeholder="e.g. 10-Wheeler Container"
                className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Capacity (Tons) *</label>
              <input
                type="number"
                step="0.5"
                value={carryingCapacityTon}
                onChange={(e) => setCarryingCapacityTon(Number(e.target.value))}
                className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Insurance Expiry *</label>
              <input
                type="date"
                value={insuranceExpiry}
                onChange={(e) => setInsuranceExpiry(e.target.value)}
                className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Fitness Expiry *</label>
              <input
                type="date"
                value={fitnessExpiry}
                onChange={(e) => setFitnessExpiry(e.target.value)}
                className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Current Odometer (KM)</label>
              <input
                type="number"
                value={odometerKm}
                onChange={(e) => setOdometerKm(Number(e.target.value))}
                className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Assign Regular Driver</label>
              <select
                value={assignedDriverId}
                onChange={(e) => setAssignedDriverId(e.target.value)}
                className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="">Leave Unassigned</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.fullName} ({d.phone})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-medium text-slate-300 hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-xs font-bold text-white shadow-lg transition-all"
            >
              {isSuccess ? <Check className="w-4 h-4 animate-bounce" /> : 'Save & Register Vehicle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
