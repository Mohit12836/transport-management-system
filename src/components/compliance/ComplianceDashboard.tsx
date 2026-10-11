'use client';

import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Truck,
  Users,
  Send,
  Sparkles,
  Phone,
} from 'lucide-react';
import { useDemoTMS } from '../../lib/demo-context';
import { calculateComplianceStatus } from '../../lib/dispatch-engine';

export const ComplianceDashboard: React.FC = () => {
  const { vehicles, drivers } = useDemoTMS();
  const [alertSentMessage, setAlertSentMessage] = useState<string | null>(null);

  // Collate compliance list
  const complianceItems: {
    entityType: 'VEHICLE' | 'DRIVER';
    identifier: string;
    label: string;
    docType: string;
    expiryDate: string;
    daysRemaining: number;
    status: 'VALID' | 'EXPIRING_SOON' | 'EXPIRED';
  }[] = [];

  vehicles.forEach((v) => {
    if (v.insuranceExpiry) {
      const { daysRemaining, status } = calculateComplianceStatus(v.insuranceExpiry);
      complianceItems.push({
        entityType: 'VEHICLE',
        identifier: v.vehicleNumber,
        label: v.vehicleType,
        docType: 'Insurance Policy',
        expiryDate: v.insuranceExpiry,
        daysRemaining,
        status,
      });
    }
    if (v.fitnessExpiry) {
      const { daysRemaining, status } = calculateComplianceStatus(v.fitnessExpiry);
      complianceItems.push({
        entityType: 'VEHICLE',
        identifier: v.vehicleNumber,
        label: v.vehicleType,
        docType: 'Fitness Certificate',
        expiryDate: v.fitnessExpiry,
        daysRemaining,
        status,
      });
    }
  });

  drivers.forEach((d) => {
    complianceItems.push({
      entityType: 'DRIVER',
      identifier: d.fullName,
      label: d.phone,
      docType: `Licence (${d.licenseNumber})`,
      expiryDate: d.licenseExpiryDate,
      daysRemaining: d.licenseDaysRemaining,
      status: d.licenseStatus,
    });
  });

  // Sort: Expired & Expiring Soon first
  complianceItems.sort((a, b) => a.daysRemaining - b.daysRemaining);

  const urgentCount = complianceItems.filter((c) => c.status !== 'VALID').length;

  const handleSendRenewalAlert = (identifier: string, docType: string) => {
    setAlertSentMessage(`✓ WhatsApp & SMS renewal reminder sent to operations team for ${identifier} (${docType})!`);
    setTimeout(() => setAlertSentMessage(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-rose-950/40 via-slate-900 to-slate-900 border border-rose-500/30 text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
              <ShieldAlert className="w-3.5 h-3.5" />
              Statutory Compliance & Renewal Radar
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Vehicle & Driver Expiry Radar
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              Automatic 30-day, 15-day, and 7-day alert thresholds for RC, Insurance, Fitness, Permit, PUC, and Commercial Licences.
            </p>
          </div>

          <div className="px-4 py-2.5 rounded-2xl bg-rose-900/40 border border-rose-700/50 text-right">
            <span className="text-[10px] text-rose-300 uppercase tracking-widest block font-bold">Action Required</span>
            <span className="text-xl font-mono font-black text-rose-400">{urgentCount} Documents</span>
          </div>
        </div>
      </div>

      {alertSentMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4" />
          <span>{alertSentMessage}</span>
        </div>
      )}

      {/* Compliance Matrix Table */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-300">
            <thead className="bg-slate-850 text-slate-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3">Asset / Personnel</th>
                <th className="p-3">Document Type</th>
                <th className="p-3">Expiry Date</th>
                <th className="p-3">Days Remaining</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-center">Alert Dispatch</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {complianceItems.map((item, idx) => {
                return (
                  <tr key={idx} className="hover:bg-slate-850/50 transition-colors">
                    <td className="p-3 font-semibold text-white flex items-center gap-2">
                      {item.entityType === 'VEHICLE' ? (
                        <Truck className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Users className="w-4 h-4 text-cyan-400" />
                      )}
                      <div>
                        <span className="font-mono">{item.identifier}</span>
                        <span className="text-[10px] text-slate-400 block font-normal">{item.label}</span>
                      </div>
                    </td>
                    <td className="p-3 font-medium text-slate-200">{item.docType}</td>
                    <td className="p-3 font-mono text-slate-300">{item.expiryDate}</td>
                    <td className="p-3 font-mono font-bold">
                      {item.daysRemaining <= 0 ? (
                        <span className="text-rose-400">Expired ({Math.abs(item.daysRemaining)}d ago)</span>
                      ) : (
                        <span className={item.daysRemaining <= 30 ? 'text-amber-400' : 'text-emerald-400'}>
                          {item.daysRemaining} Days
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          item.status === 'EXPIRED'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : item.status === 'EXPIRING_SOON'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {item.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleSendRenewalAlert(item.identifier, item.docType)}
                        className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-medium transition-all inline-flex items-center gap-1.5"
                      >
                        <Send className="w-3 h-3 text-emerald-400" />
                        <span>Send WhatsApp Reminder</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
