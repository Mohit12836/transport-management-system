'use client';

import React, { useState } from 'react';
import {
  Users,
  PlusCircle,
  Search,
  Phone,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { useDemoTMS } from '../../lib/demo-context';
import { Driver } from '../../types/tms';

interface DriverRosterProps {
  onOpenAddDriver: () => void;
}

export const DriverRoster: React.FC<DriverRosterProps> = ({ onOpenAddDriver }) => {
  const { drivers, openDriverDetails, activeRole } = useDemoTMS();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredDrivers = drivers.filter(
    (d) =>
      d.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.phone.includes(searchTerm) ||
      d.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-cyan-400" />
            <span>Driver Roster & KYC Management</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Commercial licences, KYC documents, running trip advance balances, and emergency contacts.
          </p>
        </div>

        {(activeRole === 'owner' || activeRole === 'manager' || activeRole === 'superadmin') && (
          <button
            onClick={onOpenAddDriver}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-cyan-900/30 transition-all hover:scale-[1.02]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Add New Driver</span>
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 bg-slate-850 border border-slate-700/80 rounded-xl px-3 py-1.5 w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search driver by name, phone, licence..."
            className="bg-transparent border-none text-xs text-white placeholder-slate-500 focus:outline-none w-full"
          />
        </div>

        <div className="text-xs text-slate-400">
          Total: <strong className="text-white">{drivers.length} Drivers</strong>
        </div>
      </div>

      {/* Driver Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filteredDrivers.map((d) => {
          const isLicenceExpiring = d.licenseDaysRemaining <= 30;
          return (
            <div
              key={d.id}
              className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 hover:border-slate-700 transition-colors shadow-lg flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center font-bold text-sm">
                      {d.fullName.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">{d.fullName}</h4>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-emerald-400" />
                        <span>{d.phone}</span>
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      d.isActive
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {d.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>

                <div className="mt-4 p-3 rounded-2xl bg-slate-850/60 border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-[11px]">Licence No:</span>
                    <span className="font-mono font-semibold text-slate-200">{d.licenseNumber}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-[11px]">Licence Expiry:</span>
                    {isLicenceExpiring ? (
                      <span className="text-rose-400 font-bold font-mono text-[11px] flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {d.licenseExpiryDate} ({d.licenseDaysRemaining}d)
                      </span>
                    ) : (
                      <span className="font-mono text-emerald-400 text-[11px]">{d.licenseExpiryDate}</span>
                    )}
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-[11px]">Masked Aadhaar:</span>
                    <span className="font-mono text-slate-400 text-[11px]">{d.aadhaarMasked || 'XXXX-XXXX-8921'}</span>
                  </div>

                  <div className="flex justify-between items-center pt-1 border-t border-slate-800">
                    <span className="text-slate-400 text-[11px]">Advance Balance:</span>
                    <span className="font-mono font-bold text-amber-400">
                      ₹{d.currentAdvanceBalance.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Assigned: <strong className="text-white">{d.assignedVehicleNumber || 'Free'}</strong>
                </span>
                <button
                  onClick={() => openDriverDetails(d)}
                  className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 text-xs font-semibold"
                >
                  <span>Profile & Ledger</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
