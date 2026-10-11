'use client';

import React, { useState } from 'react';
import {
  FileCheck2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  ExternalLink,
  ShieldCheck,
  Lock,
  Unlock,
  Eye,
  X,
} from 'lucide-react';
import { useDemoTMS } from '../../lib/demo-context';
import { ProofOfDelivery } from '../../types/tms';
import { isInvoiceEligibleForLR } from '../../lib/dispatch-engine';

export const PODReviewQueue: React.FC = () => {
  const { pods, reviewPODDecision, lrs, activeRole } = useDemoTMS();
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [rejectionModalPodId, setRejectionModalPodId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleApprove = (podId: string) => {
    setErrorMessage('');
    const res = reviewPODDecision(podId, 'verify');
    if (!res.success) {
      setErrorMessage(res.error || 'Failed to approve POD.');
    }
  };

  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionModalPodId) return;
    setErrorMessage('');

    const res = reviewPODDecision(rejectionModalPodId, 'reject', rejectionReason);
    if (!res.success) {
      setErrorMessage(res.error || 'Failed to reject POD.');
      return;
    }

    setRejectionModalPodId(null);
    setRejectionReason('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <FileCheck2 className="w-6 h-6 text-cyan-400" />
            <span>Proof of Delivery (POD) Audit & Verification Queue</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Audit digital driver POD uploads, verify physical receiving stamps, and gate customer GST invoice generation.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* POD Queue Table */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-300">
            <thead className="bg-slate-850 text-slate-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3">LR Reference</th>
                <th className="p-3">Delivered At</th>
                <th className="p-3">Receiver Details</th>
                <th className="p-3">Shortage / Discrepancy</th>
                <th className="p-3">POD Document</th>
                <th className="p-3">Verification Status</th>
                <th className="p-3">Invoice Eligibility</th>
                <th className="p-3 text-center">Decision Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {pods.map((pod) => {
                const lr = lrs.find((l) => l.id === pod.lrId);
                const eligibility = isInvoiceEligibleForLR(pod.lrId, pod);

                return (
                  <tr key={pod.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="p-3">
                      <span className="font-mono font-bold text-white block">{lr?.lrNumber || pod.lrId}</span>
                      <span className="text-[10px] text-slate-400">{lr?.consignorName}</span>
                    </td>
                    <td className="p-3 font-mono text-slate-300">
                      {new Date(pod.deliveredAt).toLocaleDateString('en-IN')}{' '}
                      <span className="text-[10px] text-slate-400">
                        {new Date(pod.deliveredAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-white">{pod.receivedByName}</div>
                      {pod.receivedByPhone && <div className="text-[10px] text-slate-400">{pod.receivedByPhone}</div>}
                    </td>
                    <td className="p-3">
                      {pod.shortageQuantity > 0 ? (
                        <span className="inline-flex items-center gap-1 font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 text-[10px]">
                          <AlertTriangle className="w-3 h-3" />
                          {pod.shortageQuantity} Shortage / Damage
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-semibold text-[11px]">0 Shortage (Full Handover)</span>
                      )}
                      {pod.damageRemarks && (
                        <p className="text-[10px] text-slate-400 italic mt-0.5 truncate max-w-xs">
                          {pod.damageRemarks}
                        </p>
                      )}
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => setSelectedPhoto(pod.podImageUrl)}
                        className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-semibold text-xs underline decoration-dotted"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect POD Photo</span>
                      </button>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          pod.status === 'verified'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : pod.status === 'rejected'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {pod.status.replace('_', ' ')}
                      </span>
                      {pod.verifiedBy && (
                        <div className="text-[9px] text-slate-500 mt-1 font-mono">{pod.verifiedBy}</div>
                      )}
                    </td>
                    <td className="p-3">
                      {eligibility.isEligible ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 text-[11px] font-bold">
                          <Unlock className="w-3 h-3" />
                          <span>Unlocked (Invoice Ready)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-500 text-[10px]">
                          <Lock className="w-3 h-3 text-rose-400" />
                          <span>Locked</span>
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {pod.status === 'pending_verification' && (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleApprove(pod.id)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow transition-all"
                          >
                            Approve POD
                          </button>
                          <button
                            onClick={() => setRejectionModalPodId(pod.id)}
                            className="px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 font-semibold text-[11px] transition-all"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {pod.status === 'verified' && (
                        <span className="text-emerald-400 font-bold text-[11px] flex items-center justify-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Approved</span>
                        </span>
                      )}
                      {pod.status === 'rejected' && (
                        <span className="text-rose-400 font-bold text-[10px] flex items-center justify-center gap-1">
                          <XCircle className="w-3 h-3" />
                          <span>Rejected ({pod.rejectionReason})</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Photo Viewer Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="relative max-w-xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-5 text-white shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h4 className="font-bold text-sm">Signed POD Document Inspection</h4>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-4 rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
              <img src={selectedPhoto} alt="POD Document" className="w-full h-80 object-cover" />
            </div>
            <p className="text-[11px] text-slate-400 text-center mt-3">
              Official Consignee Stamped & Signed Delivery Acknowledgment.
            </p>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {rejectionModalPodId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <form
            onSubmit={handleRejectSubmit}
            className="relative max-w-md w-full bg-slate-900 border border-rose-500/40 rounded-3xl p-6 text-white shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h4 className="font-bold text-sm text-rose-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>Reject Proof of Delivery</span>
              </h4>
              <button
                type="button"
                onClick={() => setRejectionModalPodId(null)}
                className="p-1 rounded-lg bg-slate-800 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Mandatory Rejection Reason *</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Signature stamp blurred; unapproved 2-package shortage recorded..."
                className="w-full bg-slate-850 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none"
                rows={3}
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setRejectionModalPodId(null)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 text-xs text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 font-bold text-xs text-white"
              >
                Confirm Rejection
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
