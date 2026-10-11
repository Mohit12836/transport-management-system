'use client';

import React, { useState } from 'react';
import {
  Printer,
  X,
  FileCheck2,
  Building2,
  ShieldCheck,
  QrCode,
  Truck,
  Layers,
  Copy,
  CheckCircle2,
} from 'lucide-react';
import { useDemoTMS } from '../../lib/demo-context';
import { generateThreeCopies, RenderedLRCopy, verifyThreeCopyConsistency } from '../../lib/lr-math';
import { LRConsignmentNote } from '../../types/tms';

interface ThreeCopyLRPrintProps {
  lr: LRConsignmentNote | null;
  onClose: () => void;
}

export const ThreeCopyLRPrint: React.FC<ThreeCopyLRPrintProps> = ({ lr, onClose }) => {
  const { organization } = useDemoTMS();
  const [selectedCopyIndex, setSelectedCopyIndex] = useState<number | 'all'>('all');
  const [isCopied, setIsCopied] = useState(false);

  if (!lr) return null;

  const copies: RenderedLRCopy[] = generateThreeCopies(lr, true);
  const isConsistent = verifyThreeCopyConsistency(copies);

  const handlePrint = () => {
    window.print();
  };

  const handleCopySummary = () => {
    const text = `LR No: ${lr.lrNumber}\nDate: ${lr.lrDate}\nConsignor: ${lr.consignorName}\nConsignee: ${lr.consigneeName}\nRoute: ${lr.originCity} -> ${lr.destinationCity}\nWeight: ${lr.chargedWeightTon} Tons\nNet Freight: ₹${lr.netTotalAmount}\nTerms: ${lr.paymentType.toUpperCase()}`;
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl text-white my-6 print:m-0 print:p-0 print:border-none print:bg-white print:text-black">
        {/* Top Control Bar (Hidden when Printing) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-6 border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg">Consignment Note Print Engine</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {isConsistent ? '3-Copy Sync Verified' : 'Sync Warning'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                LR #{lr.lrNumber} • CRC Checksum: <span className="font-mono text-slate-300">{copies[0].checksum}</span>
              </p>
            </div>
          </div>

          {/* Copy Selector Tabs */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
              <button
                onClick={() => setSelectedCopyIndex('all')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  selectedCopyIndex === 'all' ? 'bg-red-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                All 3 Copies
              </button>
              <button
                onClick={() => setSelectedCopyIndex(0)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  selectedCopyIndex === 0 ? 'bg-red-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                1. Consignor
              </button>
              <button
                onClick={() => setSelectedCopyIndex(1)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  selectedCopyIndex === 1 ? 'bg-red-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                2. Consignee
              </button>
              <button
                onClick={() => setSelectedCopyIndex(2)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  selectedCopyIndex === 2 ? 'bg-red-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                3. Office/POD
              </button>
            </div>

            <button
              onClick={handleCopySummary}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 transition-colors"
            >
              {isCopied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{isCopied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 text-xs font-bold text-white shadow-lg transition-all hover:scale-[1.02]"
            >
              <Printer className="w-4 h-4" />
              <span>Print Document</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Sheets Container */}
        <div className="space-y-8 print:space-y-12 max-h-[75vh] overflow-y-auto pr-1 print:max-h-none print:overflow-visible">
          {copies
            .filter((_, idx) => selectedCopyIndex === 'all' || selectedCopyIndex === idx)
            .map((copyItem, index) => (
              <div
                key={copyItem.copyType}
                className="bg-white text-slate-900 rounded-2xl p-6 sm:p-8 border-2 border-slate-300 shadow-xl relative overflow-hidden print:p-4 print:border-black print:rounded-none print:shadow-none print:page-break-after-always"
              >
                {/* Watermark */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.06] select-none rotate-[-25deg]">
                  <span className="text-4xl sm:text-6xl font-black uppercase text-center tracking-widest text-slate-900 border-8 border-slate-900 p-8 rounded-3xl">
                    {copyItem.watermark}
                  </span>
                </div>

                {/* Document Header */}
                <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4 mb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Truck className="w-6 h-6 text-red-600 print:text-black" />
                      <h2 className="text-xl sm:text-2xl font-black tracking-tight uppercase">
                        {organization.name}
                      </h2>
                    </div>
                    <p className="text-[11px] text-slate-600 max-w-lg leading-tight">
                      {organization.address} | Phone: {organization.contactPhone}
                    </p>
                    <div className="flex items-center gap-4 text-[11px] font-semibold text-slate-700">
                      <span>GSTIN: <strong>{organization.gstin || '08AABCZ1234F1ZP'}</strong></span>
                      <span>PAN: <strong>{organization.pan || 'AABCZ1234F'}</strong></span>
                      <span>Govt. Reg. GTA</span>
                    </div>
                  </div>

                  <div className="text-right space-y-1">
                    <div className="inline-block bg-slate-900 text-white print:bg-black print:text-white px-3 py-1 rounded text-xs font-bold uppercase tracking-wider">
                      {copyItem.copyTitle.split('(')[0]}
                    </div>
                    <div className="text-sm font-black font-mono text-red-600 print:text-black">
                      LR NO: {copyItem.sourceRecord.lrNumber}
                    </div>
                    <div className="text-xs text-slate-600">
                      Date: <strong>{copyItem.sourceRecord.lrDate}</strong>
                    </div>
                  </div>
                </div>

                {/* Subtitle Banner */}
                <div className="bg-slate-100 print:bg-slate-200 border border-slate-300 rounded px-3 py-1 mb-4 text-[11px] flex justify-between items-center text-slate-700">
                  <span>{copyItem.copySubtitle}</span>
                  <span className="font-mono text-[10px] font-semibold">SECURITY HASH: {copyItem.checksum}</span>
                </div>

                {/* Row 1: Consignor & Consignee */}
                <div className="grid grid-cols-2 border border-slate-900 text-xs mb-4">
                  <div className="p-3 border-r border-slate-900 bg-slate-50/50">
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block mb-1">
                      CONSIGNOR (SENDER)
                    </span>
                    <div className="font-extrabold text-sm">{copyItem.sourceRecord.consignorName}</div>
                    <div className="text-slate-600 mt-1">{copyItem.sourceRecord.consignorAddress}</div>
                    <div className="mt-2 font-semibold">
                      GSTIN: <span className="font-mono">{copyItem.sourceRecord.consignorGstin || 'URP (Unregistered)'}</span>
                    </div>
                    <div className="font-bold text-slate-800 mt-1">
                      Dispatch Station: <span className="uppercase text-red-700">{copyItem.sourceRecord.originCity}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50/50">
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block mb-1">
                      CONSIGNEE (RECEIVER)
                    </span>
                    <div className="font-extrabold text-sm">{copyItem.sourceRecord.consigneeName}</div>
                    <div className="text-slate-600 mt-1">{copyItem.sourceRecord.consigneeAddress}</div>
                    <div className="mt-2 font-semibold">
                      GSTIN: <span className="font-mono">{copyItem.sourceRecord.consigneeGstin || 'URP (Unregistered)'}</span>
                    </div>
                    <div className="font-bold text-slate-800 mt-1">
                      Destination Station: <span className="uppercase text-red-700">{copyItem.sourceRecord.destinationCity}</span>
                    </div>
                  </div>
                </div>

                {/* Row 2: Transport & Vehicle Meta */}
                <div className="grid grid-cols-4 border border-slate-900 text-xs text-center mb-4 bg-slate-100 print:bg-slate-200">
                  <div className="p-2 border-r border-slate-900">
                    <span className="text-[10px] text-slate-500 block">TRUCK NO.</span>
                    <span className="font-black font-mono text-sm">{copyItem.sourceRecord.vehicleNumber || 'RJ14-GB-4592'}</span>
                  </div>
                  <div className="p-2 border-r border-slate-900">
                    <span className="text-[10px] text-slate-500 block">DRIVER NAME / PHONE</span>
                    <span className="font-bold text-xs">{copyItem.sourceRecord.driverName || 'Mukesh Yadav'}</span>
                  </div>
                  <div className="p-2 border-r border-slate-900">
                    <span className="text-[10px] text-slate-500 block">E-WAY BILL NO.</span>
                    <span className="font-mono font-bold text-xs">{copyItem.sourceRecord.ewayBillNumber || 'NOT SPECIFIED'}</span>
                  </div>
                  <div className="p-2">
                    <span className="text-[10px] text-slate-500 block">FREIGHT TERMS</span>
                    <span className="font-black text-xs uppercase px-2 py-0.5 rounded bg-red-100 text-red-800 border border-red-300 print:border-black">
                      {copyItem.sourceRecord.paymentType.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Row 3: Goods Details & Financials Table */}
                <table className="w-full border-collapse border border-slate-900 text-xs mb-4">
                  <thead>
                    <tr className="bg-slate-200 print:bg-slate-300 text-slate-900 font-bold text-center">
                      <th className="border border-slate-900 p-2 text-left w-1/2">DESCRIPTION OF GOODS & PACKING</th>
                      <th className="border border-slate-900 p-2">PKGS</th>
                      <th className="border border-slate-900 p-2">ACTUAL WT</th>
                      <th className="border border-slate-900 p-2">CHARGED WT</th>
                      <th className="border border-slate-900 p-2">RATE / TON</th>
                      <th className="border border-slate-900 p-2 text-right">FREIGHT (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="align-top">
                      <td className="border border-slate-900 p-3">
                        <div className="font-bold text-sm text-slate-900">{copyItem.sourceRecord.goodsDescription}</div>
                        <div className="text-[11px] text-slate-600 mt-1">Packing Method: {copyItem.sourceRecord.packageType}</div>
                        <div className="text-[10px] text-slate-500 mt-2">
                          * Goods carried entirely at Owner's risk unless transit insurance is booked.
                        </div>
                      </td>
                      <td className="border border-slate-900 p-3 text-center font-bold">{copyItem.sourceRecord.packagesCount}</td>
                      <td className="border border-slate-900 p-3 text-center font-bold">{copyItem.sourceRecord.actualWeightTon} MT</td>
                      <td className="border border-slate-900 p-3 text-center font-black text-slate-900">{copyItem.sourceRecord.chargedWeightTon} MT</td>
                      <td className="border border-slate-900 p-3 text-center font-mono font-bold">₹{copyItem.sourceRecord.freightRatePerTon}</td>
                      <td className="border border-slate-900 p-3 text-right font-mono font-bold">₹{copyItem.sourceRecord.totalFreightAmount.toLocaleString('en-IN')}</td>
                    </tr>
                    {/* Surcharges Breakdown */}
                    <tr>
                      <td colSpan={5} className="border border-slate-900 p-1.5 text-right font-semibold text-[11px]">
                        Loading Charges:
                      </td>
                      <td className="border border-slate-900 p-1.5 text-right font-mono">
                        ₹{copyItem.sourceRecord.loadingCharges.toLocaleString('en-IN')}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={5} className="border border-slate-900 p-1.5 text-right font-semibold text-[11px]">
                        Unloading & Detention Charges:
                      </td>
                      <td className="border border-slate-900 p-1.5 text-right font-mono">
                        ₹{copyItem.sourceRecord.unloadingCharges.toLocaleString('en-IN')}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={5} className="border border-slate-900 p-1.5 text-right font-semibold text-[11px]">
                        Transit Insurance / Risk Charge:
                      </td>
                      <td className="border border-slate-900 p-1.5 text-right font-mono">
                        ₹{copyItem.sourceRecord.insuranceCharges.toLocaleString('en-IN')}
                      </td>
                    </tr>
                    <tr className="bg-slate-100 font-bold">
                      <td colSpan={5} className="border border-slate-900 p-2 text-right text-sm">
                        GRAND TOTAL FREIGHT:
                      </td>
                      <td className="border border-slate-900 p-2 text-right font-black font-mono text-base text-red-700 print:text-black">
                        ₹{copyItem.sourceRecord.netTotalAmount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Terms & Signatures */}
                <div className="grid grid-cols-3 border border-slate-900 text-[10px] text-slate-600 p-3 gap-4">
                  <div>
                    <span className="font-bold text-slate-800 block mb-1">CONSIGNOR SIGNATURE:</span>
                    <div className="h-12 border-b border-dashed border-slate-400 mt-4"></div>
                    <span className="text-[9px]">I/We agree to the standard terms of carriage.</span>
                  </div>

                  <div className="text-center">
                    <span className="font-bold text-slate-800 block mb-1">DRIVER / VEHICLE IN-CHARGE:</span>
                    <div className="h-12 border-b border-dashed border-slate-400 mt-4"></div>
                    <span className="text-[9px]">Received goods in sound packaging condition.</span>
                  </div>

                  <div className="text-right">
                    <span className="font-bold text-slate-800 block mb-1">FOR {organization.name.toUpperCase()}:</span>
                    <div className="h-12 border-b border-dashed border-slate-400 mt-4"></div>
                    <span className="font-bold text-[10px] text-slate-900">Authorised Signatory / Booking Branch</span>
                  </div>
                </div>

                {/* Footer Barcode Stamp */}
                <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>DOCUMENT NO: {copyItem.sourceRecord.lrNumber}-C{index + 1}</span>
                  <span className="font-bold uppercase tracking-widest text-red-600 print:text-black">
                    {copyItem.watermark}
                  </span>
                  <span>PRINT TIME: {new Date().toLocaleString('en-IN')}</span>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};
