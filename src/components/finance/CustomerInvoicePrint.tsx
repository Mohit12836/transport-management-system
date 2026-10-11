'use client';

import React from 'react';
import { useDemoTMS } from '../../lib/demo-context';
import { CustomerInvoice } from '../../types/tms';

interface CustomerInvoicePrintProps {
  invoice: CustomerInvoice;
  onClose: () => void;
}

export const CustomerInvoicePrint: React.FC<CustomerInvoicePrintProps> = ({
  invoice,
  onClose,
}) => {
  const { organization } = useDemoTMS();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden my-8 print:border-none print:shadow-none print:w-full print:max-w-none print:m-0 print:bg-white text-slate-200 print:text-black">
        {/* Top Control Bar (Hidden on print) */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <span className="bg-blue-500/20 text-blue-300 font-mono text-xs px-2.5 py-1 rounded font-bold">
              TAX INVOICE
            </span>
            <span className="text-sm font-bold text-white">Invoice #{invoice.invoiceNumber}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-950/50"
            >
              <span>🖨️</span> Print Tax Invoice
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded-xl"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Printable Tax Invoice Sheet */}
        <div className="p-8 bg-white text-black font-sans space-y-5">
          {/* Top Triplicate Badge */}
          <div className="flex justify-between items-center text-[10px] text-slate-500 border-b border-slate-200 pb-2">
            <span className="font-bold tracking-wider uppercase">ORIGINAL FOR RECIPIENT / DUPLICATE FOR TRANSPORTER</span>
            <span>SAC: <strong>996511</strong> (Goods Transport Agency Services)</span>
          </div>

          {/* Company & Invoice Meta Header */}
          <div className="grid grid-cols-2 gap-6 items-start border-b-2 border-slate-900 pb-4">
            <div>
              <h1 className="text-2xl font-black uppercase text-slate-900 tracking-tight">
                {organization.name}
              </h1>
              <p className="text-xs text-slate-600 mt-0.5">{organization.address}</p>
              <p className="text-xs text-slate-700 font-medium mt-1">
                GSTIN: <span className="font-mono font-bold text-slate-900">{organization.gstin || '08AABCZ1234F1ZP'}</span> • PAN: <span className="font-mono font-bold text-slate-900">{organization.pan || 'AABCZ1234F'}</span>
              </p>
              <p className="text-xs text-slate-600">Email: {organization.contactEmail} • Ph: {organization.contactPhone}</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs text-right space-y-1">
              <span className="inline-block bg-blue-900 text-white font-bold px-2.5 py-0.5 rounded text-[11px] uppercase tracking-wider">
                GST TAX INVOICE
              </span>
              <p className="font-mono text-sm font-bold text-slate-900 mt-2">
                Invoice No: {invoice.invoiceNumber}
              </p>
              <p className="text-slate-600">Invoice Date: <strong className="text-slate-900">{invoice.invoiceDate}</strong></p>
              <p className="text-slate-600">Due Date: <strong className="text-slate-900">{invoice.dueDate}</strong></p>
              <p className="text-slate-600">
                Reverse Charge (RCM): <strong className="text-slate-900 font-mono">{invoice.isRcmApplicable ? 'YES (Sec 9(3))' : 'NO'}</strong>
              </p>
            </div>
          </div>

          {/* Bill To Customer Information */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 uppercase font-bold text-[10px] block">Bill To (Customer / Consignor):</span>
              <p className="font-bold text-slate-900 text-sm mt-0.5">{invoice.customerName}</p>
              <p className="text-slate-600 mt-0.5">{invoice.billingAddress}</p>
              <p className="text-slate-800 font-medium mt-1">
                GSTIN: <span className="font-mono font-bold">{invoice.customerGstin || 'URP (Unregistered)'}</span>
              </p>
            </div>
            <div>
              <span className="text-slate-500 uppercase font-bold text-[10px] block">Supply Route & Logistics:</span>
              <p className="text-slate-700 mt-1">Place of Supply: <strong>{invoice.destinationState}</strong></p>
              <p className="text-slate-700">Origin State: <strong>{invoice.originState}</strong></p>
              <p className="text-slate-700">Included LR Consignments: <strong className="font-mono">{invoice.includedLRs.join(', ')}</strong></p>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px]">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">LR / Consignment No.</th>
                  <th className="p-3">Route & Goods Description</th>
                  <th className="p-3 text-right">Weight (MT)</th>
                  <th className="p-3 text-right">Freight Rate (₹)</th>
                  <th className="p-3 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {invoice.items && invoice.items.length > 0 ? (
                  invoice.items.map((item, idx) => (
                    <tr key={item.lrId}>
                      <td className="p-3 font-mono">{idx + 1}</td>
                      <td className="p-3 font-mono font-bold text-blue-900">{item.lrNumber}</td>
                      <td className="p-3">
                        {item.originCity} → {item.destinationCity} ({item.goodsDescription}, {item.packagesCount} pkgs)
                      </td>
                      <td className="p-3 text-right font-mono">{item.chargedWeightTon.toFixed(2)}</td>
                      <td className="p-3 text-right font-mono">₹{item.ratePerTon.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-right font-mono font-bold">₹{item.netItemAmount.toLocaleString('en-IN')}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="p-3 font-mono">1</td>
                    <td className="p-3 font-mono font-bold text-blue-900">{invoice.includedLRs.join(', ')}</td>
                    <td className="p-3">Goods Transport Agency Freight Services</td>
                    <td className="p-3 text-right font-mono">-</td>
                    <td className="p-3 text-right font-mono">-</td>
                    <td className="p-3 text-right font-mono font-bold">₹{invoice.subtotalAmount.toLocaleString('en-IN')}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Tax Summary & Net Computation */}
          <div className="grid grid-cols-2 gap-6 items-start">
            <div className="text-xs text-slate-600 bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2">
              <h4 className="font-bold text-slate-900 text-[11px] uppercase">Bank Details for NEFT / RTGS Transfer:</h4>
              <p>Bank Name: <strong>HDFC Bank Ltd</strong></p>
              <p>Account Name: <strong>{organization.name}</strong></p>
              <p>Account Number: <strong className="font-mono">50200089214478</strong></p>
              <p>IFSC Code: <strong className="font-mono">HDFC0001234</strong> (Jaipur Branch)</p>
            </div>

            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-700">
                <span>Taxable Freight Subtotal:</span>
                <span className="font-bold text-slate-900">₹{invoice.subtotalAmount.toLocaleString('en-IN')}</span>
              </div>

              {invoice.cgstAmount > 0 && (
                <div className="flex justify-between text-slate-700">
                  <span>CGST ({invoice.cgstRate}%):</span>
                  <span>₹{invoice.cgstAmount.toLocaleString('en-IN')}</span>
                </div>
              )}
              {invoice.sgstAmount > 0 && (
                <div className="flex justify-between text-slate-700">
                  <span>SGST ({invoice.sgstRate}%):</span>
                  <span>₹{invoice.sgstAmount.toLocaleString('en-IN')}</span>
                </div>
              )}
              {invoice.igstAmount > 0 && (
                <div className="flex justify-between text-slate-700">
                  <span>IGST ({invoice.igstRate}%):</span>
                  <span>₹{invoice.igstAmount.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="border-t border-slate-200 pt-2 flex justify-between text-slate-900 font-bold">
                <span>Gross Invoice Total:</span>
                <span>₹{invoice.grandTotal.toLocaleString('en-IN')}</span>
              </div>

              <div className="border-t-2 border-slate-900 pt-2 flex justify-between text-sm font-black text-slate-900">
                <span>{invoice.isRcmApplicable ? 'Payable Under RCM (Base Freight):' : 'Total Amount Payable:'}</span>
                <span className="text-base font-mono">₹{invoice.balanceAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Terms & Signatures */}
          <div className="border-t border-slate-200 pt-4 text-[10px] text-slate-500 space-y-2">
            <p>1. Payment terms: Due within 30 days of invoice date. Interest @ 18% p.a. applicable on overdue accounts.</p>
            <p>2. Subject to Jaipur jurisdiction only. Goods carried at owner's risk unless covered under transit insurance.</p>
          </div>

          <div className="pt-6 flex justify-between items-end text-xs text-slate-700">
            <div>
              <p className="font-bold">Customer Acknowledgment</p>
              <p className="text-[10px] text-slate-500">Authorized Receiver Signature & Stamp</p>
            </div>
            <div className="text-right">
              <p className="font-bold">For {organization.name}</p>
              <div className="h-10"></div>
              <p className="text-[10px] text-slate-500">Authorized Signatory / Accountant</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
