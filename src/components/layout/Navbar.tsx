'use client';

import React from 'react';
import {
  Truck,
  Users,
  Route,
  FileCheck2,
  ShieldAlert,
  PlusCircle,
  ChevronDown,
  LayoutDashboard,
  ReceiptText,
  Smartphone,
} from 'lucide-react';
import { useDemoTMS } from '../../lib/demo-context';
import { UserRole } from '../../types/tms';

export type NavTab = 'dashboard' | 'dispatch' | 'finance' | 'driver_app' | 'vehicles' | 'drivers' | 'pod_queue' | 'compliance';

interface NavbarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenBookingModal: () => void;
  onOpenRoleSwitcher: () => void;
}

const ROLE_LABELS: Record<UserRole, { label: string; color: string }> = {
  superadmin: { label: 'Super Admin', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40' },
  owner: { label: 'Fleet Owner', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
  manager: { label: 'Dispatch Manager', color: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
  accountant: { label: 'Accountant', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
  driver: { label: 'Driver (Mobile)', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' },
  vendor: { label: 'Vendor / Broker', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
};

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  onOpenBookingModal,
  onOpenRoleSwitcher,
}) => {
  const { organization, activeRole } = useDemoTMS();
  const currentRoleInfo = ROLE_LABELS[activeRole] || { label: activeRole, color: 'bg-slate-700 text-slate-200' };

  const tabs: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Role View', icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
    { id: 'dispatch', label: 'Dispatch Board', icon: <Route className="w-3.5 h-3.5" /> },
    { id: 'finance', label: 'Financial Hub', icon: <ReceiptText className="w-3.5 h-3.5" /> },
    { id: 'driver_app', label: 'Driver App', icon: <Smartphone className="w-3.5 h-3.5" /> },
    { id: 'vehicles', label: 'Fleet Vehicles', icon: <Truck className="w-3.5 h-3.5" /> },
    { id: 'drivers', label: 'Driver KYC', icon: <Users className="w-3.5 h-3.5" /> },
    { id: 'pod_queue', label: 'POD Queue', icon: <FileCheck2 className="w-3.5 h-3.5" /> },
    { id: 'compliance', label: 'Compliance Radar', icon: <ShieldAlert className="w-3.5 h-3.5" /> },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/90 backdrop-blur-md border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-amber-600 flex items-center justify-center shadow-lg shadow-red-600/20 text-white shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                TMS PRO
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                v2.0
              </span>
            </div>
            <div className="text-xs text-slate-400 truncate max-w-[140px] sm:max-w-[220px]">
              {organization.name}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-900 p-1 rounded-2xl border border-slate-800 text-xs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-red-600 text-white shadow-md shadow-red-900/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-850'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Center Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {(activeRole === 'manager' || activeRole === 'owner' || activeRole === 'superadmin') && (
            <button
              onClick={onOpenBookingModal}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-medium text-xs sm:text-sm px-3.5 py-2 rounded-xl shadow-md shadow-red-900/30 transition-all hover:scale-[1.02]"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">New LR / Bilty</span>
              <span className="sm:hidden">+ LR</span>
            </button>
          )}

          <button
            onClick={onOpenRoleSwitcher}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all hover:bg-slate-800 ${currentRoleInfo.color}`}
            title="Click to switch simulated role persona"
          >
            <Users className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Role:</span>
            <span>{currentRoleInfo.label}</span>
            <ChevronDown className="w-3 h-3 opacity-70" />
          </button>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="lg:hidden flex items-center gap-2 overflow-x-auto px-4 py-2 border-t border-slate-850 bg-slate-950/80 text-xs scrollbar-none">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className={`whitespace-nowrap inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
              activeTab === tab.id ? 'bg-red-600 text-white' : 'text-slate-400 bg-slate-900 border border-slate-800'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
    </header>
  );
};
