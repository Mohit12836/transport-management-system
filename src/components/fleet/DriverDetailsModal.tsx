'use client';

import React from 'react';
import {
  Users,
  X,
  Phone,
  CreditCard,
  AlertTriangle,
  Calendar,
  ShieldCheck,
  Award,
  Wallet,
} from 'lucide-react';
import { useDemoTMS } from '../../lib/demo-context';

export const DriverDetailsModal: React.FC = () => {
  const { selectedDriverForModal, closeDriverDetails } = useDemoTMS();

  if (!selectedDriverForModal) return null;
  const d = selectedDriverForModal;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-white my-8">
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center font-bold text-base">
              {d.fullName.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-white">{d.fullName}</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Driver ID: <span className="font-mono text-slate-300">{d.id}</span> • {d.licenseCategory}
              </p>
            </div>
          </div>
          <button
            onClick={closeDriverDetails}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-6 space-y-5 text-xs">
          {/* KYC Details Card */}
          <div className="p-4 rounded-2xl bg-slate-850/60 border border-slate-800 grid grid-cols-2 gap-3">
            <div>
              <span className="text-slate-400 block text-[10px]">Mobile Contact:</span>
              <span className="font-bold text-white flex items-center gap-1 mt-0.5">
                <Phone className="w-3 h-3 text-emerald-400" />
                {d.phone}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Alternate / Family Phone:</span>
              <span className="text-slate-300">{d.alternatePhone || '+91 98280 11990'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Commercial Licence No:</span>
              <span className="font-mono font-bold text-white">{d.licenseNumber}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Licence Validity:</span>
              <span className="font-mono font-bold text-emerald-400">{d.licenseExpiryDate}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Masked Identity (Aadhaar):</span>
              <span className="font-mono text-slate-400">{d.aadhaarMasked || 'XXXX-XXXX-8921'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Assigned Vehicle:</span>
              <span className="font-mono font-bold text-white">{d.assignedVehicleNumber || 'RJ14-GB-4592'}</span>
            </div>
          </div>

          {/* Advance & Financial Ledger */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-850 to-slate-900 border border-amber-500/30 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Wallet className="w-4 h-4" />
              <span>Driver Advance & Salary Ledger Summary</span>
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Active Unsettled Advance:</span>
                <span className="text-xl font-mono font-black text-amber-400">
                  ₹{d.currentAdvanceBalance.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Deducted on trip closing</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Base Monthly Compensation:</span>
                <span className="text-xl font-mono font-black text-white">
                  ₹{d.monthlySalary.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-emerald-400 block mt-0.5">Direct Bank Transfer</span>
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="p-4 rounded-2xl bg-slate-850/40 border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Emergency Family Contact:</span>
            <span className="font-medium text-slate-200 mt-0.5 block">
              {d.emergencyContact || 'Suman Yadav (Wife) - +91 94140 33441'}
            </span>
          </div>
        </div>

        <div className="mt-6 flex justify-end pt-4 border-t border-slate-800">
          <button
            onClick={closeDriverDetails}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition-colors"
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
};
