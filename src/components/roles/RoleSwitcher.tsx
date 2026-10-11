'use client';

import React from 'react';
import {
  ShieldCheck,
  Crown,
  Route,
  ReceiptText,
  Smartphone,
  Handshake,
  CheckCircle2,
  X,
  Info,
} from 'lucide-react';
import { useDemoTMS } from '../../lib/demo-context';
import { UserRole } from '../../types/tms';

interface RoleSwitcherProps {
  isOpen: boolean;
  onClose: () => void;
}

interface RoleCardData {
  role: UserRole;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  badgeColor: string;
  keyResponsibilities: string[];
  permissionsPreview: string;
}

const ROLES: RoleCardData[] = [
  {
    role: 'superadmin',
    title: 'Super Admin',
    subtitle: 'SaaS Platform & Multi-Tenant Operator',
    icon: <ShieldCheck className="w-6 h-6 text-purple-400" />,
    badgeColor: 'from-purple-600/20 to-indigo-600/20 border-purple-500/30 text-purple-300',
    keyResponsibilities: [
      'Multi-tenant organization provisioning',
      'Global subscription plan limits & renewals',
      'System-wide audit log stream & API monitoring',
    ],
    permissionsPreview: 'Unrestricted SaaS Scope',
  },
  {
    role: 'owner',
    title: 'Fleet Owner / MD',
    subtitle: 'Executive Leadership & Profitability',
    icon: <Crown className="w-6 h-6 text-emerald-400" />,
    badgeColor: 'from-emerald-600/20 to-teal-600/20 border-emerald-500/30 text-emerald-300',
    keyResponsibilities: [
      'Executive P&L & gross trip margin analytics',
      'Fleet health, tyre lifecycle & vehicle asset roster',
      'Compliance renewal radars & statutory tax tracking',
    ],
    permissionsPreview: 'Full Organization Scope',
  },
  {
    role: 'manager',
    title: 'Dispatch & Operations Manager',
    subtitle: 'Daily Booking, Trip Dispatch & PODs',
    icon: <Route className="w-6 h-6 text-blue-400" />,
    badgeColor: 'from-blue-600/20 to-cyan-600/20 border-blue-500/30 text-blue-300',
    keyResponsibilities: [
      'Consignment booking & 3-copy LR/Bilty creation',
      'Truck & driver dispatch scheduling',
      'En-route checkpoint logs & digital POD verification',
    ],
    permissionsPreview: 'Branch & Dispatch Operations',
  },
  {
    role: 'accountant',
    title: 'Senior Accountant',
    subtitle: 'Billing, Tax & Driver Settlements',
    icon: <ReceiptText className="w-6 h-6 text-amber-400" />,
    badgeColor: 'from-amber-600/20 to-orange-600/20 border-amber-500/30 text-amber-300',
    keyResponsibilities: [
      'GST invoice generation from delivered LRs',
      'Driver advance vs diesel slip settlement reconciliation',
      'Vendor market truck bills with TDS 194C deduction',
    ],
    permissionsPreview: 'Financial & Ledger Isolation',
  },
  {
    role: 'driver',
    title: 'Fleet Driver (Mobile)',
    subtitle: 'Field Operations & Trip Task Sheet',
    icon: <Smartphone className="w-6 h-6 text-cyan-400" />,
    badgeColor: 'from-cyan-600/20 to-sky-600/20 border-cyan-500/30 text-cyan-300',
    keyResponsibilities: [
      'Mobile task card with assigned trip details & route',
      'En-route diesel & toll slip submission',
      'Instant camera Proof of Delivery (POD) photo capture',
    ],
    permissionsPreview: 'Personal Assigned Trip Sandbox',
  },
  {
    role: 'vendor',
    title: 'Vendor / Truck Broker',
    subtitle: 'Attached Fleets & Freight Vouchers',
    icon: <Handshake className="w-6 h-6 text-rose-400" />,
    badgeColor: 'from-rose-600/20 to-pink-600/20 border-rose-500/30 text-rose-300',
    keyResponsibilities: [
      'Attached vehicle placement & trip status visibility',
      'Freight bill submission & payment status tracking',
      'TDS tax deduction certificates & credit history',
    ],
    permissionsPreview: 'Vendor-Scoped External Portal',
  },
];

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({ isOpen, onClose }) => {
  const { activeRole, setActiveRole } = useDemoTMS();

  if (!isOpen) return null;

  const handleSelectRole = (role: UserRole) => {
    setActiveRole(role);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-2xl overflow-y-auto">
      <div className="relative w-full max-w-4xl glass-panel glass-panel-indigo bg-gradient-to-br from-slate-900/95 via-slate-950/98 to-slate-950 rounded-3xl p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.8)] border border-white/10 text-white">
        {/* Header */}
        <div className="flex items-start justify-between pb-6 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold badge-glow-indigo mb-2">
              <Info className="w-3.5 h-3.5 text-indigo-400" />
              Demo Role Persona Switcher
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
              Select User Role Experience
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 font-medium">
              Switch instant perspectives to test role-specific workflows, permissions, and dashboards.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700/80 border border-white/10 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice */}
        <div className="my-4 p-4 rounded-2xl bg-slate-900/80 border border-white/10 text-xs text-slate-300 flex items-center gap-3 shadow-inner">
          <Info className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>
            <strong className="text-cyan-300">Architecture Note:</strong> This client-side selector is for interactive demonstration. Real production deployments enforce JWT/RBAC server-side session tokens with Row-Level Security.
          </span>
        </div>

        {/* Roles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {ROLES.map((r) => {
            const isSelected = activeRole === r.role;
            return (
              <div
                key={r.role}
                onClick={() => handleSelectRole(r.role)}
                className={`group cursor-pointer rounded-2xl p-5 border transition-all duration-300 relative flex flex-col justify-between ${
                  isSelected
                    ? 'bg-gradient-to-br from-indigo-950/60 via-slate-900/90 to-slate-900 border-indigo-400/80 ring-2 ring-indigo-500/50 shadow-[0_0_25px_rgba(99,102,241,0.35)] scale-[1.02]'
                    : 'bg-slate-900/60 border-white/5 hover:border-indigo-400/40 hover:bg-slate-850/80 hover:-translate-y-1 hover:shadow-lg'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-3 right-3 text-cyan-300 flex items-center gap-1 text-[11px] font-bold bg-cyan-500/15 border border-cyan-400/30 px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.3)]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Active</span>
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2.5 rounded-xl bg-slate-800/80 border border-white/10 group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all">
                      {r.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-white group-hover:text-cyan-300 transition-colors">
                        {r.title}
                      </h3>
                      <p className="text-[11px] text-slate-400 font-medium">{r.subtitle}</p>
                    </div>
                  </div>

                  <ul className="space-y-1.5 mb-4 text-[11px] text-slate-300">
                    {r.keyResponsibilities.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-cyan-400 font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[10px]">
                  <span className="text-slate-400 font-medium">Scope:</span>
                  <span className="font-bold text-indigo-300">{r.permissionsPreview}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 font-bold text-xs sm:text-sm text-white shadow-[0_0_15px_rgba(99,102,241,0.4)] transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            Continue Demo
          </button>
        </div>
      </div>
    </div>
  );
};
