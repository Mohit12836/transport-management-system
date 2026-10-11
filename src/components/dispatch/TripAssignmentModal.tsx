'use client';

import React, { useState } from 'react';
import { Route, X, PlusCircle, AlertCircle, Check, Truck, Users, FileText } from 'lucide-react';
import { useDemoTMS } from '../../lib/demo-context';

interface TripAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TripAssignmentModal: React.FC<TripAssignmentModalProps> = ({ isOpen, onClose }) => {
  const { createAndScheduleTrip, vehicles, drivers, lrs } = useDemoTMS();

  const [selectedVehicleId, setSelectedVehicleId] = useState(vehicles[1]?.id || vehicles[0]?.id || '');
  const [selectedDriverId, setSelectedDriverId] = useState(drivers[1]?.id || drivers[0]?.id || '');
  const [originCity, setOriginCity] = useState('Jaipur');
  const [destinationCity, setDestinationCity] = useState('Delhi / NCR');
  const [plannedDepartureDate, setPlannedDepartureDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedArrivalDate, setExpectedArrivalDate] = useState('2026-10-14');
  const [startOdometerKm, setStartOdometerKm] = useState<number>(89420);
  const [selectedLRIds, setSelectedLRIds] = useState<string[]>([lrs[0]?.id || '']);

  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleToggleLR = (lrId: string) => {
    if (selectedLRIds.includes(lrId)) {
      if (selectedLRIds.length > 1) {
        setSelectedLRIds(selectedLRIds.filter((id) => id !== lrId));
      }
    } else {
      setSelectedLRIds([...selectedLRIds, lrId]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const res = createAndScheduleTrip({
      vehicleId: selectedVehicleId,
      driverId: selectedDriverId,
      originCity,
      destinationCity,
      assignedLRIds: selectedLRIds,
      plannedDepartureDate,
      expectedArrivalDate,
      startOdometerKm: Number(startOdometerKm),
    });

    if (!res.success) {
      setErrorMessage(res.error || 'Failed to schedule trip.');
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
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-white my-8">
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              <Route className="w-5 h-5 text-blue-400" />
              <span>Dispatch & Schedule Trip</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Allocate available truck, driver, and link consignment notes (LR/Bilty) to dispatch.
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

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-blue-400" />
                <span>Select Available Truck *</span>
              </label>
              <select
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
              >
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.vehicleNumber} ({v.vehicleType} - {v.status.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-cyan-400" />
                <span>Select Available Driver *</span>
              </label>
              <select
                value={selectedDriverId}
                onChange={(e) => setSelectedDriverId(e.target.value)}
                className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
              >
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.fullName} (Licence: {d.licenseNumber})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Origin Station *</label>
              <input
                type="text"
                value={originCity}
                onChange={(e) => setOriginCity(e.target.value)}
                className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-white"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Destination Station *</label>
              <input
                type="text"
                value={destinationCity}
                onChange={(e) => setDestinationCity(e.target.value)}
                className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-white"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Departure Date</label>
              <input
                type="date"
                value={plannedDepartureDate}
                onChange={(e) => setPlannedDepartureDate(e.target.value)}
                className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Expected Arrival</label>
              <input
                type="date"
                value={expectedArrivalDate}
                onChange={(e) => setExpectedArrivalDate(e.target.value)}
                className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Start Odometer (KM)</label>
              <input
                type="number"
                value={startOdometerKm}
                onChange={(e) => setStartOdometerKm(Number(e.target.value))}
                className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>
          </div>

          {/* LR Linker */}
          <div className="p-4 rounded-2xl bg-slate-850/60 border border-slate-800 space-y-2">
            <label className="block font-bold text-slate-200 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-red-400" />
              <span>Link Consignment Notes (LRs) to this Trip *</span>
            </label>
            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
              {lrs.map((lr) => {
                const isSelected = selectedLRIds.includes(lr.id);
                return (
                  <div
                    key={lr.id}
                    onClick={() => handleToggleLR(lr.id)}
                    className={`p-2.5 rounded-xl border cursor-pointer flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-500/50 text-white'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <span className="font-mono font-bold text-white text-[11px] block">{lr.lrNumber}</span>
                      <span className="text-[10px] text-slate-400">
                        {lr.consignorName} → {lr.consigneeName} ({lr.chargedWeightTon} MT)
                      </span>
                    </div>
                    <div className="font-mono font-bold text-emerald-400 text-xs">
                      ₹{lr.netTotalAmount.toLocaleString('en-IN')}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 font-medium text-slate-300 hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 font-bold text-white shadow-lg transition-all"
            >
              {isSuccess ? <Check className="w-4 h-4 animate-bounce" /> : 'Schedule & Assign Trip'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
