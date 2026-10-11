'use client';

import React, { useState } from 'react';
import {
  Crown,
  Smartphone,
  Route,
  ReceiptText,
  Handshake,
  ShieldCheck,
  Truck,
  ArrowRight,
  Lock,
  Mail,
  Sparkles,
  CheckCircle2,
  Building2,
} from 'lucide-react';
import { UserRole } from '../../types/tms';

interface SaaSLoginGatewayProps {
  onLoginAsRole: (role: UserRole) => void;
}

interface RolePortalOption {
  role: UserRole;
  email: string;
  title: string;
  portalName: string;
  badge: string;
  badgeClass: string;
  borderHoverClass: string;
  glowClass: string;
  icon: React.ReactNode;
  description: string;
  features: string[];
}

const PORTALS: RolePortalOption[] = [
  {
    role: 'owner',
    email: 'owner@tms.com',
    title: 'Fleet Owner & Executive',
    portalName: 'Executive Command Center',
    badge: 'Executive Suite',
    badgeClass: 'badge-glow-emerald',
    borderHoverClass: 'hover:border-emerald-500/60',
    glowClass: 'hover:shadow-[0_12px_40px_rgba(16,185,129,0.25)]',
    icon: <Crown className="w-6 h-6 text-emerald-400" />,
    description: 'Complete top-down fleet oversight, trip-wise gross margin P&L, and compliance countdown radars.',
    features: ['Real-time revenue & net margin %', 'Asset roster & statutory validities', '3-Copy printable consignment notes'],
  },
  {
    role: 'driver',
    email: 'driver@tms.com',
    title: 'Commercial Fleet Driver',
    portalName: 'Mobile Driver Field Console',
    badge: 'Mobile Field App',
    badgeClass: 'badge-glow-cyan',
    borderHoverClass: 'hover:border-cyan-500/60',
    glowClass: 'hover:shadow-[0_12px_40px_rgba(6,182,212,0.25)]',
    icon: <Smartphone className="w-6 h-6 text-cyan-400" />,
    description: 'Dedicated handheld driver assistant for active trips, diesel receipts, advance passbook, and camera PODs.',
    features: ['Active assigned trip & route', 'Camera signed POD photo upload', 'Fuel slips & cash advance passbook'],
  },
  {
    role: 'manager',
    email: 'manager@tms.com',
    title: 'Dispatch & Operations Manager',
    portalName: 'Live Dispatch Operations',
    badge: 'Operations Hub',
    badgeClass: 'badge-glow-indigo',
    borderHoverClass: 'hover:border-indigo-500/60',
    glowClass: 'hover:shadow-[0_12px_40px_rgba(99,102,241,0.25)]',
    icon: <Route className="w-6 h-6 text-indigo-400" />,
    description: 'Kanban dispatch pipeline, truck & driver scheduling, LR booking, and incoming POD review queues.',
    features: ['4-Column visual dispatch pipeline', 'Truck & driver allocation gates', 'POD verification approval queue'],
  },
  {
    role: 'accountant',
    email: 'accountant@tms.com',
    title: 'Senior Transport Accountant',
    portalName: 'Finance, Tax & Settlements',
    badge: 'Financial Hub',
    badgeClass: 'badge-glow-amber',
    borderHoverClass: 'hover:border-amber-500/60',
    glowClass: 'hover:shadow-[0_12px_40px_rgba(245,158,11,0.25)]',
    icon: <ReceiptText className="w-6 h-6 text-amber-400" />,
    description: 'GST SAC 996511 customer invoicing, driver trip advance reconciliations, vendor TDS bills, and double-entry ledgers.',
    features: ['Strict POD gate for customer invoices', 'Driver advance vs expense reconciliation', 'Vendor Section 194C TDS & Balanced Journals'],
  },
  {
    role: 'vendor',
    email: 'vendor@tms.com',
    title: 'Transport Broker & Vendor',
    portalName: 'Vendor Partner Memo Portal',
    badge: 'Vendor Partner',
    badgeClass: 'badge-glow-rose',
    borderHoverClass: 'hover:border-rose-500/60',
    glowClass: 'hover:shadow-[0_12px_40px_rgba(244,63,94,0.25)]',
    icon: <Handshake className="w-6 h-6 text-rose-400" />,
    description: 'External broker portal for attached market trucks, lorry hire slips, and TDS credit deduction certificates.',
    features: ['Attached market vehicle placement', 'Lorry hire slips & balance payouts', 'TDS credit certificates download'],
  },
  {
    role: 'superadmin',
    email: 'superadmin@tms.com',
    title: 'Platform SaaS Super Admin',
    portalName: 'Multi-Tenant Platform Hub',
    badge: 'Platform Operator',
    badgeClass: 'badge-glow-indigo',
    borderHoverClass: 'hover:border-purple-500/60',
    glowClass: 'hover:shadow-[0_12px_40px_rgba(168,85,247,0.25)]',
    icon: <ShieldCheck className="w-6 h-6 text-purple-400" />,
    description: 'Global SaaS multi-tenant tenant management, tier subscriptions, and system-wide API security audit logging.',
    features: ['Tenant organization provisioning', 'Subscription limits & plan upgrades', 'API guard security audit logs'],
  },
];

export const SaaSLoginGateway: React.FC<SaaSLoginGatewayProps> = ({ onLoginAsRole }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('owner');
  const [emailInput, setEmailInput] = useState<string>('owner@tms.com');
  const [passwordInput, setPasswordInput] = useState<string>('password');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handlePortalSelect = (portal: RolePortalOption) => {
    setSelectedRole(portal.role);
    setEmailInput(portal.email);
    setPasswordInput('password');
    setIsSubmitting(true);
    setTimeout(() => {
      onLoginAsRole(portal.role);
    }, 350);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Find matching role or default to selected
    const matched = PORTALS.find((p) => p.email.toLowerCase() === emailInput.trim().toLowerCase());
    const roleToUse = matched ? matched.role : selectedRole;
    setTimeout(() => {
      onLoginAsRole(roleToUse);
    }, 350);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between atmosphere-canvas text-white px-4 py-8 sm:py-12">
      {/* Header Branding */}
      <div className="max-w-7xl mx-auto w-full text-center space-y-4">
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full text-xs font-bold badge-glow-indigo">
          <Truck className="w-4 h-4 text-cyan-400" />
          <span>NextGen TMS Pro • Enterprise Indian Logistics Cloud</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black tracking-tight bg-gradient-to-r from-white via-indigo-100 to-cyan-300 bg-clip-text text-transparent">
          Select Your Workspace Portal
        </h1>

        <p className="text-slate-300 text-xs sm:text-base max-w-2xl mx-auto font-medium">
          Every stakeholder operates in their own isolated, role-enforced workspace with zero cross-role data leakage.
        </p>
      </div>

      {/* 6 Dedicated SaaS Role Portals Grid */}
      <div className="max-w-7xl mx-auto w-full my-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {PORTALS.map((portal) => (
            <div
              key={portal.role}
              onClick={() => handlePortalSelect(portal)}
              className={`glass-panel p-6 space-y-4 cursor-pointer transition-all duration-300 hover:-translate-y-1.5 border border-white/10 ${portal.borderHoverClass} ${portal.glowClass} flex flex-col justify-between group`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-2xl bg-slate-900/90 border border-white/10 group-hover:scale-110 group-hover:border-white/20 transition-all shadow-md">
                    {portal.icon}
                  </div>
                  <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${portal.badgeClass}`}>
                    {portal.badge}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-black text-white group-hover:text-cyan-300 transition-colors">
                    {portal.portalName}
                  </h3>
                  <div className="text-xs text-slate-400 font-semibold">{portal.title}</div>
                </div>

                <p className="text-xs text-slate-300 font-medium leading-relaxed">
                  {portal.description}
                </p>

                <ul className="space-y-1.5 pt-2 border-t border-white/5 text-[11px] text-slate-300">
                  {portal.features.map((feat, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400">{portal.email}</span>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 group-hover:text-cyan-300 group-hover:translate-x-1 transition-all">
                  <span>Enter Portal</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Manual Login Card (For Custom Credentials) */}
      <div className="max-w-xl mx-auto w-full glass-panel glass-panel-indigo p-6 sm:p-8 bg-slate-900/90 border border-white/10 text-white shadow-2xl my-4">
        <div className="flex items-center gap-2.5 mb-4">
          <Lock className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Sign In with Custom Credentials
          </h3>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">User Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="e.g. driver@tms.com or owner@tms.com"
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="password"
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs sm:text-sm shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all hover:scale-[1.01] active:scale-95 cursor-pointer flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <span>Authenticating Session...</span>
            ) : (
              <>
                <span>Sign In to Selected Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-4 pt-3 border-t border-white/5 text-[11px] text-slate-400 text-center">
          Demo Password for all accounts is: <strong className="text-white font-mono">password</strong>
        </div>
      </div>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto w-full text-center text-xs text-slate-500 pt-6">
        <p>© 2026 NextGen Transport Management System (TMS Pro). Enterprise Indian Logistics Cloud Architecture.</p>
      </footer>
    </div>
  );
};
