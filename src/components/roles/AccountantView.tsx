'use client';

import React, { useState } from 'react';
import {
  ReceiptText,
  FileCheck,
  CreditCard,
  Building,
  CheckCircle,
  PlusCircle,
  Layers,
  BookOpen,
} from 'lucide-react';
import { useDemoTMS } from '../../lib/demo-context';
import { DriverLedgerView } from '../finance/DriverLedgerView';
import { FinancialJournalView } from '../finance/FinancialJournalView';
import { InvoiceGeneratorModal } from '../finance/InvoiceGeneratorModal';
import { VendorSettlementModal } from '../finance/VendorSettlementModal';
import { CustomerInvoicePrint } from '../finance/CustomerInvoicePrint';
import { DriverSettlementPrint } from '../finance/DriverSettlementPrint';
import { VendorSettlementPrint } from '../finance/VendorSettlementPrint';

export const AccountantView: React.FC = () => {
  const {
    invoices,
    vendorSettlements,
    openInvoicePrint,
    activeInvoiceForPrint,
    closeInvoicePrint,
    activeDriverSettlementForPrint,
    closeDriverSettlementPrint,
    activeVendorSettlementForPrint,
    closeVendorSettlementPrint,
    openVendorSettlementPrint,
  } = useDemoTMS();

  const [activeTab, setActiveTab] = useState<'INVOICES' | 'DRIVER_SETTLEMENTS' | 'VENDOR_TDS' | 'JOURNAL'>('INVOICES');
  const [showInvoiceModal, setShowInvoiceModal] = useState<boolean>(false);
  const [showVendorModal, setShowVendorModal] = useState<boolean>(false);

  const totalOutstanding = invoices.reduce((sum, inv) => sum + (inv.balanceAmount || 0), 0);
  const totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <ReceiptText className="w-3.5 h-3.5" />
              Accounting & Financial Settlements Hub
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              GST Invoicing, Driver Advances & Statutory TDS 194C
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              Audit driver advance balances against fuel slips, reconcile customer billings with POD gates, and enforce balanced double-entry journals.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowInvoiceModal(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-950/40 flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Generate Tax Invoice</span>
            </button>
            <button
              onClick={() => setShowVendorModal(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-950/40 flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Vendor TDS Voucher</span>
            </button>
          </div>
        </div>

        {/* Financial KPI Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800">
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Gross Invoiced Revenue</span>
            <span className="text-lg font-bold text-white font-mono">
              ₹{totalInvoiced.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">{invoices.length} Tax Invoices</span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Accounts Receivable</span>
            <span className="text-lg font-bold text-amber-400 font-mono">
              ₹{totalOutstanding.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Pending collections</span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Vendor TDS Deductions</span>
            <span className="text-lg font-bold text-purple-400 font-mono">
              ₹{vendorSettlements.reduce((s, v) => s + v.tdsAmount, 0).toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Sec 194C / 206AA</span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">POD Gate Enforcement</span>
            <span className="text-lg font-bold text-emerald-400 font-mono">100% Gated</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Zero unverified billings</span>
          </div>
        </div>
      </div>

      {/* Financial Hub Tabs */}
      <div className="flex border-b border-slate-800 gap-2 overflow-x-auto pb-1">
        {[
          { id: 'INVOICES', label: `Customer Invoices (${invoices.length})`, icon: FileCheck },
          { id: 'DRIVER_SETTLEMENTS', label: 'Driver Advances & Settlements', icon: CreditCard },
          { id: 'VENDOR_TDS', label: `Vendor & Broker TDS (${vendorSettlements.length})`, icon: Building },
          { id: 'JOURNAL', label: 'General Ledger Audit', icon: BookOpen },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-amber-500 text-amber-400 bg-slate-900'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: CUSTOMER GST INVOICES */}
      {activeTab === 'INVOICES' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-400" />
                <span>Customer Freight Tax Invoices</span>
              </h3>
              <p className="text-xs text-slate-400">
                GST Tax Invoices with verified POD attachment (SAC Code: 996511).
              </p>
            </div>

            <button
              onClick={() => setShowInvoiceModal(true)}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold"
            >
              + Create Invoice
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Invoice Number</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Customer / Consignor</th>
                  <th className="p-3.5">Taxable (₹)</th>
                  <th className="p-3.5">GST (CGST+SGST/IGST)</th>
                  <th className="p-3.5">Grand Total (₹)</th>
                  <th className="p-3.5">Balance Due (₹)</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-blue-400">{inv.invoiceNumber}</td>
                    <td className="p-3.5 font-mono text-slate-400">{inv.invoiceDate}</td>
                    <td className="p-3.5 font-medium text-white">{inv.customerName}</td>
                    <td className="p-3.5 font-mono">₹{inv.subtotalAmount.toLocaleString('en-IN')}</td>
                    <td className="p-3.5 font-mono text-slate-400">
                      {inv.isRcmApplicable ? (
                        <span className="text-amber-300 font-bold">RCM (₹0 Transporter)</span>
                      ) : (
                        `₹${inv.totalGstAmount.toLocaleString('en-IN')}`
                      )}
                    </td>
                    <td className="p-3.5 font-mono font-bold text-white">
                      ₹{inv.grandTotal.toLocaleString('en-IN')}
                    </td>
                    <td className="p-3.5 font-mono font-bold text-amber-400">
                      ₹{inv.balanceAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                          inv.paymentStatus === 'paid'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : inv.paymentStatus === 'partially_paid'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {inv.paymentStatus.toUpperCase().replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => openInvoicePrint(inv)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold"
                      >
                        🖨️ Print PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: DRIVER ADVANCES & SETTLEMENTS */}
      {activeTab === 'DRIVER_SETTLEMENTS' && <DriverLedgerView />}

      {/* TAB 3: VENDOR & BROKER TDS 194C */}
      {activeTab === 'VENDOR_TDS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Building className="w-5 h-5 text-purple-400" />
                <span>Vendor Freight & TDS Section 194C Ledgers</span>
              </h3>
              <p className="text-xs text-slate-400">
                Statutory withholding for attached market vehicles and broker hire contracts.
              </p>
            </div>

            <button
              onClick={() => setShowVendorModal(true)}
              className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold"
            >
              + New Settlement Voucher
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Voucher #</th>
                  <th className="p-3.5">Vendor Name</th>
                  <th className="p-3.5">Type</th>
                  <th className="p-3.5">PAN</th>
                  <th className="p-3.5 text-right">Gross Freight</th>
                  <th className="p-3.5 text-right">Advance Paid</th>
                  <th className="p-3.5 text-right">TDS (194C)</th>
                  <th className="p-3.5 text-right">Net Payable</th>
                  <th className="p-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {vendorSettlements.map((vs) => (
                  <tr key={vs.id} className="hover:bg-slate-850/50">
                    <td className="p-3.5 font-mono font-bold text-purple-400">{vs.voucherNumber}</td>
                    <td className="p-3.5 font-medium text-white">{vs.vendorName}</td>
                    <td className="p-3.5 text-slate-400">{vs.vendorType.replace('_', ' ')}</td>
                    <td className="p-3.5 font-mono text-slate-300">{vs.panNumber || 'N/A'}</td>
                    <td className="p-3.5 text-right font-mono">₹{vs.grossFreight.toLocaleString('en-IN')}</td>
                    <td className="p-3.5 text-right font-mono text-amber-400">
                      ₹{vs.advancePaid.toLocaleString('en-IN')}
                    </td>
                    <td className="p-3.5 text-right font-mono text-purple-400 font-bold">
                      ₹{vs.tdsAmount.toLocaleString('en-IN')} ({vs.tdsRatePercent}%)
                    </td>
                    <td className="p-3.5 text-right font-mono font-black text-white">
                      ₹{vs.netPayable.toLocaleString('en-IN')}
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => openVendorSettlementPrint(vs)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold"
                      >
                        🖨️ View Voucher
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: GENERAL LEDGER AUDIT */}
      {activeTab === 'JOURNAL' && <FinancialJournalView />}

      {/* Modals & Print Overlays */}
      {showInvoiceModal && <InvoiceGeneratorModal onClose={() => setShowInvoiceModal(false)} />}
      {showVendorModal && <VendorSettlementModal onClose={() => setShowVendorModal(false)} />}
      {activeInvoiceForPrint && (
        <CustomerInvoicePrint invoice={activeInvoiceForPrint} onClose={closeInvoicePrint} />
      )}
      {activeDriverSettlementForPrint && (
        <DriverSettlementPrint
          settlement={activeDriverSettlementForPrint}
          onClose={closeDriverSettlementPrint}
        />
      )}
      {activeVendorSettlementForPrint && (
        <VendorSettlementPrint
          voucher={activeVendorSettlementForPrint}
          onClose={closeVendorSettlementPrint}
        />
      )}
    </div>
  );
};
