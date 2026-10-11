'use client';

import React, { useState } from 'react';
import { Users, X, PlusCircle, AlertCircle, Check } from 'lucide-react';
import { useDemoTMS } from '../../lib/demo-context';

interface DriverFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DriverFormModal: React.FC<DriverFormModalProps> = ({ isOpen, onClose }) => {
  const { registerDriver, vehicles } = useDemoTMS();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseCategory, setLicenseCategory] = useState('HGMV (Heavy Goods Motor Vehicle)');
  const [licenseExpiryDate, setLicenseExpiryDate] = useState('2029-12-31');
  const [monthlySalary, setMonthlySalary] = useState<number>(24000);
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [assignedVehicleId, setAssignedVehicleId] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const assignedVeh = vehicles.find((v) => v.id === assignedVehicleId);
    const maskedAadhaar = aadhaarNumber ? `XXXX-XXXX-${aadhaarNumber.slice(-4)}` : 'XXXX-XXXX-1234';

    const res = registerDriver({
      organizationId: 'org-demo-001',
      fullName,
      phone,
      licenseNumber: licenseNumber.trim().toUpperCase(),
      licenseCategory,
      licenseExpiryDate,
      monthlySalary: Number(monthlySalary) || 0,
      currentAdvanceBalance: 0,
      aadhaarMasked: maskedAadhaar,
      emergencyContact,
      assignedVehicleId: assignedVehicleId || undefined,
      assignedVehicleNumber: assignedVeh?.vehicleNumber || undefined,
      isActive: true,
    });

    if (!res.success) {
      setErrorMessage(res.error || 'Failed to register driver.');
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
              <Users className="w-5 h-5 text-cyan-400" />
              <span>Register New Fleet Driver</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Add driver commercial licence, contact number and masked KYC record.
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
              <label className="block text-xs font-semibold text-slate-300 mb-1">Full Driver Name *</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Ramesh Gurjar"
                className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Mobile Contact Phone *</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +91 94140 12345"
                className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Commercial Licence Number *</label>
              <input
                type="text"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                placeholder="e.g. RJ14 20200088991"
                className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Licence Expiry Date *</label>
              <input
                type="date"
                value={licenseExpiryDate}
                onChange={(e) => setLicenseExpiryDate(e.target.value)}
                className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Licence Category</label>
              <select
                value={licenseCategory}
                onChange={(e) => setLicenseCategory(e.target.value)}
                className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="HGMV (Heavy Goods Motor Vehicle)">HGMV (Heavy Goods)</option>
                <option value="TRANS (Transport Multi-Axle)">TRANS (Multi-Axle)</option>
                <option value="LMV (Light Motor Vehicle)">LMV Commercial</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Monthly Salary (₹)</label>
              <input
                type="number"
                value={monthlySalary}
                onChange={(e) => setMonthlySalary(Number(e.target.value))}
                className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Aadhaar Last 4 Digits</label>
              <input
                type="text"
                maxLength={4}
                value={aadhaarNumber}
                onChange={(e) => setAadhaarNumber(e.target.value)}
                placeholder="e.g. 8921"
                className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Assign Truck</label>
              <select
                value={assignedVehicleId}
                onChange={(e) => setAssignedVehicleId(e.target.value)}
                className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="">Leave Free</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.vehicleNumber} ({v.vehicleType})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Emergency Contact Person & Phone</label>
            <input
              type="text"
              value={emergencyContact}
              onChange={(e) => setEmergencyContact(e.target.value)}
              placeholder="e.g. Brother: Suresh - +91 98290 12345"
              className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
            />
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
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 text-xs font-bold text-white shadow-lg transition-all"
            >
              {isSuccess ? <Check className="w-4 h-4 animate-bounce" /> : 'Save & Register Driver'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
