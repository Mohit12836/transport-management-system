'use client';

import React from 'react';
import {
  Truck,
  Users,
  Route,
  FileCheck2,
  ShieldAlert,
  PlusCircle,
  LayoutDashboard,
  ReceiptText,
  Smartphone,
  LogOut,
  Radio,
} from 'lucide-react';
import { useDemoTMS } from '../../lib/demo-context';
import { UserRole } from '../../types/tms';

export type NavTab = 'dashboard' | 'dispatch' | 'finance' | 'driver_app' | 'vehicles' | 'drivers' | 'pod_queue' | 'compliance';

interface NavbarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenBookingModal: () => void;
  onOpenRoleSwitcher: () => void;
  onLogout: () => void;
}

const ROLE_CONFIG: Record<
  UserRole,
  {
    portalTitle: string;
    badgeLabel: string;
    badgeStyle: string;
    userName: string;
    allowedTabs: { id: NavTab; label: string; icon: React.ReactNode }[];
  }
> = {
  driver: {
    portalTitle: 'Driver Mobile Field Console',
    badgeLabel: 'Driver App',
    badgeStyle: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.25)]',
    userName: 'Mukesh Yadav (RJ14-GB-4592)',
    allowedTabs: [
      { id: 'driver_app', label: 'My Trips & Tasks', icon: <Smartphone className="w-3.5 h-3.5" /> },
    ],
  },
  accountant: {
    portalTitle: 'Accounts & Billing Portal',
    badgeLabel: 'Accountant',
    badgeStyle: 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.25)]',
    userName: 'Rajesh Sharma (CFO / CA)',
    allowedTabs: [
      { id: 'finance', label: 'Financial Hub (GST & Ledgers)', icon: <ReceiptText className="w-3.5 h-3.5" /> },
      { id: 'pod_queue', label: 'POD Verification Queue', icon: <FileCheck2 className="w-3.5 h-3.5" /> },
    ],
  },
  manager: {
    portalTitle: 'Dispatch & Fleet Command',
    badgeLabel: 'Operations Manager',
    badgeStyle: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 shadow-[0_0_12px_rgba(99,102,241,0.25)]',
    userName: 'Vikram Singh (Head of Dispatch)',
    allowedTabs: [
      { id: 'dispatch', label: 'Dispatch Board', icon: <Route className="w-3.5 h-3.5" /> },
      { id: 'vehicles', label: 'Fleet Vehicles', icon: <Truck className="w-3.5 h-3.5" /> },
      { id: 'drivers', label: 'Driver Roster', icon: <Users className="w-3.5 h-3.5" /> },
      { id: 'pod_queue', label: 'POD Review', icon: <FileCheck2 className="w-3.5 h-3.5" /> },
      { id: 'compliance', label: 'Compliance Radar', icon: <ShieldAlert className="w-3.5 h-3.5" /> },
    ],
  },
  owner: {
    portalTitle: 'Executive Fleet Owner Suite',
    badgeLabel: 'Fleet Owner / MD',
    badgeStyle: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.25)]',
    userName: 'Dinesh Nahata (Managing Director)',
    allowedTabs: [
      { id: 'dashboard', label: 'Executive Command', icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
      { id: 'dispatch', label: 'Dispatch Operations', icon: <Route className="w-3.5 h-3.5" /> },
      { id: 'finance', label: 'Financial Hub', icon: <ReceiptText className="w-3.5 h-3.5" /> },
      { id: 'vehicles', label: 'Fleet Assets', icon: <Truck className="w-3.5 h-3.5" /> },
      { id: 'compliance', label: 'Compliance Radar', icon: <ShieldAlert className="w-3.5 h-3.5" /> },
    ],
  },
  vendor: {
    portalTitle: 'Transport Broker & Vendor Memo',
    badgeLabel: 'Attached Vendor',
    badgeStyle: 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.25)]',
    userName: 'Kalyan Logistics & Brokers',
    allowedTabs: [
      { id: 'dashboard', label: 'My Attached Fleet', icon: <Truck className="w-3.5 h-3.5" /> },
    ],
  },
  superadmin: {
    portalTitle: 'Multi-Tenant Platform SaaS Hub',
    badgeLabel: 'Super Admin',
    badgeStyle: 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-[0_0_12px_rgba(168,85,247,0.25)]',
    userName: 'Platform Root Administrator',
    allowedTabs: [
      { id: 'dashboard', label: 'SaaS Platform Admin', icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
      { id: 'compliance', label: 'Security & Health', icon: <ShieldAlert className="w-3.5 h-3.5" /> },
    ],
  },
};

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  onOpenBookingModal,
  onOpenRoleSwitcher,
  onLogout,
}) => {
  const { organization, activeRole } = useDemoTMS();
  const config = ROLE_CONFIG[activeRole] || ROLE_CONFIG.owner;
  const isDriver = activeRole === 'driver';

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/85 backdrop-blur-2xl border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.6)] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand & Portal Name */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-cyan-500 to-emerald-400 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)] text-slate-950 font-black shrink-0">
            {isDriver ? <Smartphone className="w-5 h-5 text-slate-950" /> : <Truck className="w-5 h-5 text-slate-950" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-indigo-200 to-cyan-300 bg-clip-text text-transparent">
                {isDriver ? 'TMS DRIVER' : 'TMS PRO'}
              </span>
              <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full border ${config.badgeStyle}`}>
                {config.badgeLabel}
              </span>
            </div>
            <div className="text-xs text-slate-400 truncate max-w-[140px] sm:max-w-[240px]">
              {isDriver ? config.userName : organization.name}
            </div>
          </div>
        </div>

        {/* Role-Enforced Navigation Tabs (No Cross-Role Leakage) */}
        {!isDriver && (
          <nav className="hidden lg:flex items-center gap-1 bg-slate-900/80 backdrop-blur-md p-1 rounded-2xl border border-white/10 text-xs shadow-inner">
            {config.allowedTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)] border border-indigo-400/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        )}

        {isDriver && (
          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
            <span>GPS Tracking Active (Jaipur Hub)</span>
          </div>
        )}

        {/* Center / Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {(activeRole === 'manager' || activeRole === 'owner') && (
            <button
              onClick={onOpenBookingModal}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-cyan-200" />
              <span className="hidden sm:inline">New LR / Bilty</span>
              <span className="sm:hidden">+ LR</span>
            </button>
          )}

          {/* User Profile Pill */}
          <div
            onClick={onOpenRoleSwitcher}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 hover:border-cyan-500/40 cursor-pointer transition-all"
            title="Click to switch role or view profile"
          >
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-indigo-500 to-cyan-500 flex items-center justify-center text-[10px] font-black text-slate-950">
              {config.userName.charAt(0)}
            </div>
            <div className="text-left text-[11px] leading-tight">
              <div className="font-bold text-white truncate max-w-[110px]">{config.userName.split(' ')[0]}</div>
              <div className="text-[10px] text-slate-400">{config.badgeLabel}</div>
            </div>
          </div>

          {/* Switch Portal / Logout Button */}
          <button
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 border border-white/10 hover:border-rose-500/40 text-xs font-semibold transition-all hover:scale-105 active:scale-95 cursor-pointer"
            title="Switch Workspace Portal / Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Switch Portal</span>
          </button>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar for non-drivers */}
      {!isDriver && config.allowedTabs.length > 1 && (
        <div className="lg:hidden flex items-center gap-2 overflow-x-auto px-4 py-2 border-t border-white/5 bg-slate-950/90 text-xs scrollbar-none">
          {config.allowedTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`whitespace-nowrap inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md'
                  : 'text-slate-400 bg-slate-900/60 border border-white/5 hover:text-white'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      )}
    </header>
  );
};
