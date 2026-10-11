'use client';

import React from 'react';
import {
  ShieldAlert,
  Building,
  Server,
  Activity,
  Users,
  Database,
  CheckCircle,
  Clock,
  Sparkles,
  Lock,
} from 'lucide-react';
import { useDemoTMS } from '../../lib/demo-context';

export const SuperAdminView: React.FC = () => {
  const { organization } = useDemoTMS();

  const mockTenants = [
    { name: organization.name, plan: 'Enterprise (Annual)', status: 'Active', vehicles: 45, storage: '12.4 GB', mrr: '₹48,000/mo' },
    { name: 'Northern Express Cargo Ltd.', plan: 'Pro (Monthly)', status: 'Active', vehicles: 18, storage: '4.8 GB', mrr: '₹18,000/mo' },
    { name: 'Gujarat Bulk Carriers LLP', plan: 'Trial (14 Days)', status: 'Trialing', vehicles: 8, storage: '1.2 GB', mrr: '₹0' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-purple-950/40 via-slate-900 to-slate-900 border border-purple-500/30 text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
              <ShieldAlert className="w-3.5 h-3.5" />
              SaaS Super Administrator Portal
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Global Platform & Tenant Orchestration
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              Monitor multi-tenant database clusters, subscription provisioning, and system-wide API latency.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2.5 rounded-2xl bg-purple-900/40 border border-purple-700/50 text-right">
              <span className="text-[10px] text-purple-300 uppercase tracking-widest block font-bold">API Latency</span>
              <span className="text-xl font-mono font-black text-white">24 ms</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Tenant Organizations</span>
            <Building className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-white">48 Active</div>
          <span className="text-[11px] text-emerald-400 font-semibold">+4 new this month</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Connected Fleets</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white">1,240 Trucks</div>
          <span className="text-[11px] text-slate-400">99.98% Telemetry uptime</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Monthly Recurring Revenue</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">₹6.84 Lakh</div>
          <span className="text-[11px] text-emerald-400 font-semibold">+18% vs last month</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Database Storage (RLS)</span>
            <Database className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-white">34.2 GB / 250 GB</div>
          <span className="text-[11px] text-slate-400">Encrypted AES-256</span>
        </div>
      </div>

      {/* Tenant Table */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">Active Tenant Organizations</h3>
            <p className="text-xs text-slate-400">Row-Level Security isolates each organization’s private records.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-300">
            <thead className="bg-slate-850 text-slate-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3">Organization Name</th>
                <th className="p-3">Tier Plan</th>
                <th className="p-3">Fleet Size</th>
                <th className="p-3">Storage</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">MRR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {mockTenants.map((t, idx) => (
                <tr key={idx} className="hover:bg-slate-850/50 transition-colors">
                  <td className="p-3 font-semibold text-white flex items-center gap-2">
                    <Building className="w-4 h-4 text-purple-400" />
                    {t.name}
                  </td>
                  <td className="p-3">{t.plan}</td>
                  <td className="p-3 font-mono">{t.vehicles} Trucks</td>
                  <td className="p-3 text-slate-400">{t.storage}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {t.status}
                    </span>
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-white">{t.mrr}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
