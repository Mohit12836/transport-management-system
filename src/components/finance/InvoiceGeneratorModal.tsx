'use client';

import React, { useState } from 'react';
import { useDemoTMS } from '../../lib/demo-context';
import { calculateGstBreakdown, roundToCurrency } from '../../lib/tax-rules';
import { validateLRInvoiceEligibility } from '../../lib/financial-engine';

interface InvoiceGeneratorModalProps {
  onClose: () => void;
}

export const InvoiceGeneratorModal: React.FC<InvoiceGeneratorModalProps> = ({ onClose }) => {
  const { lrs, pods, createCustomerInvoice, openInvoicePrint } = useDemoTMS();

  const [customerName, setCustomerName] = useState<string>('Gupta Steel & Structural Pipes Ltd.');
  const [customerGstin, setCustomerGstin] = useState<string>('08AABCG9876P1ZX');
  const [billingAddress, setBillingAddress] = useState<string>('Road No. 9, VKIA Industrial Area, Jaipur, Rajasthan 302013');
  const [originState, setOriginState] = useState<string>('Rajasthan');
  const [destinationState, setDestinationState] = useState<string>('Rajasthan');
  const [isRcm, setIsRcm] = useState<boolean>(false);
  const [dueDate, setDueDate] = useState<string>(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [selectedLRIds, setSelectedLRIds] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter billable LRs
  const availableLRs = lrs.filter((l) => l.status !== 'cancelled' && l.status !== 'billed');

  // Compute live financial breakdown
  const selectedLRs = lrs.filter((l) => selectedLRIds.includes(l.id));
  const subtotal = roundToCurrency(selectedLRs.reduce((sum, l) => sum + (l.netTotalAmount || 0), 0));
  const gstBreakdown = calculateGstBreakdown(subtotal, originState, destinationState, isRcm);

  const toggleLRSelection = (lrId: string) => {
    setSelectedLRIds((prev) =>
      prev.includes(lrId) ? prev.filter((id) => id !== lrId) : [...prev, lrId]
    );
  };

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (selectedLRIds.length === 0) {
      setFormError('Please select at least one LR consignment with verified POD to generate invoice.');
      return;
    }

    setIsSubmitting(true);

    const res = createCustomerInvoice({
      customerId: `cust-${Date.now()}`,
      customerName,
      customerGstin: customerGstin || undefined,
      billingAddress,
      originState,
      destinationState,
      isRcmApplicable: isRcm,
      selectedLRIds,
      dueDate,
    });

    setIsSubmitting(false);

    if (res.success && res.invoice) {
      openInvoicePrint(res.invoice);
      onClose();
    } else {
      setFormError(res.error || 'Failed to generate customer invoice.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden my-8 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900/60 to-slate-900 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-blue-500/20 text-blue-300 font-mono text-xs px-2.5 py-1 rounded font-bold border border-blue-500/30">
                GST FREIGHT INVOICE GENERATOR
              </span>
              <span className="text-xs text-slate-400">SAC Code: 996511 (GTA Services)</span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">Generate Customer Tax Invoice</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 p-2 rounded-lg"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleCreateInvoice} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-300">
          {formError && (
            <div className="p-3 bg-red-950/60 border border-red-800 rounded-xl text-red-200 font-medium">
              ⚠️ {formError}
            </div>
          )}

          {/* Customer & Billing Meta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-800/40 p-4 rounded-xl border border-slate-700">
            <div>
              <label className="block font-medium text-slate-300 mb-1">Customer / Consignor Name</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs focus:border-blue-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">Customer GSTIN (15 Digits)</label>
              <input
                type="text"
                value={customerGstin}
                onChange={(e) => setCustomerGstin(e.target.value.toUpperCase())}
                placeholder="08AABCG9876P1ZX"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono text-xs focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-medium text-slate-300 mb-1">Billing & Registered Address</label>
              <input
                type="text"
                value={billingAddress}
                onChange={(e) => setBillingAddress(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs focus:border-blue-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">Place of Supply - Origin State</label>
              <input
                type="text"
                value={originState}
                onChange={(e) => setOriginState(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs focus:border-blue-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">Place of Supply - Destination State</label>
              <input
                type="text"
                value={destinationState}
                onChange={(e) => setDestinationState(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs focus:border-blue-500 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* LR Consignments with POD Gate Enforcement */}
          <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                <span>📦</span> Select Consignments (LRs) to Bill ({selectedLRIds.length} Selected)
              </h3>
              <span className="text-[11px] text-amber-300">
                🔒 Invoicing requires Verified Proof of Delivery (POD)
              </span>
            </div>

            {availableLRs.length === 0 ? (
              <p className="text-slate-400 italic">No unbilled consignments found.</p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {availableLRs.map((lr) => {
                  const linkedPod = pods.find((p) => p.lrId === lr.id);
                  const gateCheck = validateLRInvoiceEligibility(lr, linkedPod);
                  const isSelected = selectedLRIds.includes(lr.id);

                  return (
                    <div
                      key={lr.id}
                      onClick={() => gateCheck.eligible && toggleLRSelection(lr.id)}
                      className={`p-3 rounded-lg border transition-all flex items-center justify-between gap-3 ${
                        !gateCheck.eligible
                          ? 'opacity-60 bg-slate-950/40 border-slate-800 cursor-not-allowed'
                          : isSelected
                          ? 'bg-blue-950/40 border-blue-500 cursor-pointer'
                          : 'bg-slate-900/60 border-slate-700 hover:border-slate-600 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={!gateCheck.eligible}
                          onChange={() => {}}
                          className="h-4 w-4 rounded bg-slate-800 border-slate-600 text-blue-600 focus:ring-0"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-white text-xs">{lr.lrNumber}</span>
                            <span className="text-slate-400 font-medium">({lr.originCity} → {lr.destinationCity})</span>
                            <span className="text-[10px] text-slate-400">Date: {lr.lrDate}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Cargo: {lr.goodsDescription} • {lr.chargedWeightTon} MT • Consignee: {lr.consigneeName}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {gateCheck.eligible ? (
                          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono text-[10px] font-bold px-2 py-0.5 rounded">
                            ✓ POD VERIFIED
                          </span>
                        ) : (
                          <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-medium px-2 py-0.5 rounded max-w-xs truncate">
                            🔒 {gateCheck.reason}
                          </span>
                        )}

                        <span className="font-mono font-bold text-white text-sm">
                          ₹{lr.netTotalAmount.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Tax Breakdown & RCM Toggle */}
          <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-xs uppercase tracking-wider">
                GST Tax Computation & Liability
              </h3>
              <label className="flex items-center gap-2 cursor-pointer bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700">
                <input
                  type="checkbox"
                  checked={isRcm}
                  onChange={(e) => setIsRcm(e.target.checked)}
                  className="h-3.5 w-3.5 rounded bg-slate-800 border-slate-600 text-blue-600"
                />
                <span className="text-xs font-semibold text-amber-300">
                  Reverse Charge Mechanism (RCM - Sec 9(3))
                </span>
              </label>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Taxable Freight Subtotal:</span>
                <span className="text-white font-bold">₹{gstBreakdown.taxableAmount.toLocaleString('en-IN')}</span>
              </div>

              {!gstBreakdown.isInterState ? (
                <>
                  <div className="flex justify-between text-slate-400">
                    <span>CGST ({gstBreakdown.cgstRatePercent}% - Intra-State):</span>
                    <span className="text-white">₹{gstBreakdown.cgstAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>SGST ({gstBreakdown.sgstRatePercent}% - Intra-State):</span>
                    <span className="text-white">₹{gstBreakdown.sgstAmount.toLocaleString('en-IN')}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between text-slate-400">
                  <span>IGST ({gstBreakdown.igstRatePercent}% - Inter-State):</span>
                  <span className="text-white">₹{gstBreakdown.igstAmount.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="border-t border-slate-800 pt-2 flex justify-between text-slate-300">
                <span>Gross Invoice Total:</span>
                <span className="font-bold">₹{gstBreakdown.grossInvoiceAmount.toLocaleString('en-IN')}</span>
              </div>

              <div className="border-t border-slate-700 pt-2 flex justify-between text-sm">
                <span className="font-bold text-white">
                  {isRcm ? 'Net Amount Payable to Transporter (RCM Applied):' : 'Total Invoice Amount Payable:'}
                </span>
                <span className="font-black text-blue-400 text-base">
                  ₹{gstBreakdown.netPayableAmount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {isRcm && (
              <p className="text-[11px] text-amber-300 italic">
                * Note: Under GST Section 9(3) Reverse Charge Mechanism, the customer is liable to pay GST directly to the government. The invoice payable to GTA equals base taxable freight only.
              </p>
            )}
          </div>

          {/* Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-300 mb-1">Payment Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs focus:border-blue-500 focus:outline-none"
                required
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Balanced double-entry journal entry will be posted to Accounts Receivable & Revenue.
          </span>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateInvoice}
              disabled={isSubmitting || selectedLRIds.length === 0}
              className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-950/50 disabled:opacity-50 flex items-center gap-2"
            >
              <span>{isSubmitting ? 'Generating...' : '📄 Generate & Print Tax Invoice'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
