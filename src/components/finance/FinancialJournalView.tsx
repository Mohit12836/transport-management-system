'use client';

import React, { useState } from 'react';
import { useDemoTMS } from '../../lib/demo-context';
import { validateJournalIntegrity } from '../../lib/financial-engine';

export const FinancialJournalView: React.FC = () => {
  const { journalEntries } = useDemoTMS();
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredEntries = journalEntries.filter((entry) => {
    const matchesFilter = filterType === 'all' || entry.referenceType === filterType;
    const matchesSearch =
      searchQuery === '' ||
      entry.entryNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const ledgerIntegrity = validateJournalIntegrity(journalEntries);

  return (
    <div className="space-y-6">
      {/* Top Banner with Real-time Integrity Checker */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500/20 text-emerald-300 font-mono text-xs px-2.5 py-1 rounded font-bold border border-emerald-500/30">
              GENERAL LEDGER INTEGRITY AUDIT
            </span>
            <span
              className={`text-xs px-2.5 py-0.5 rounded font-mono font-bold ${
                ledgerIntegrity.isBalanced
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-red-500/20 text-red-300 border border-red-500/40'
              }`}
            >
              {ledgerIntegrity.isBalanced ? '✓ BOOKS 100% BALANCED' : '⚠️ DISCREPANCY DETECTED'}
            </span>
          </div>
          <h2 className="text-xl font-bold text-white mt-1">Double-Entry Journal Ledger</h2>
          <p className="text-xs text-slate-400">
            Immutable audit record of all financial events. Every transaction enforces balanced debits and credits.
          </p>
        </div>

        {/* Ledger Balance KPI */}
        <div className="flex items-center gap-3 w-full md:w-auto bg-slate-950 p-3 rounded-xl border border-slate-800">
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Total Ledger Debits</span>
            <span className="text-sm font-bold text-white font-mono">
              ₹{ledgerIntegrity.totalDebits.toLocaleString('en-IN')}
            </span>
          </div>
          <span className="text-slate-600 font-mono text-lg">=</span>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Total Ledger Credits</span>
            <span className="text-sm font-bold text-white font-mono">
              ₹{ledgerIntegrity.totalCredits.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="pl-3 border-l border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Discrepancy</span>
            <span className="text-xs font-bold text-emerald-400 font-mono">
              ₹{ledgerIntegrity.discrepancy.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search journal entries by number or description..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            { id: 'all', label: 'All Entries' },
            { id: 'INVOICE', label: 'Freight Invoices' },
            { id: 'DRIVER_ADVANCE', label: 'Driver Advances' },
            { id: 'DRIVER_SETTLEMENT', label: 'Driver Settlements' },
            { id: 'VENDOR_SETTLEMENT', label: 'Vendor TDS' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                filterType === tab.id
                  ? 'bg-slate-800 text-white border border-slate-700 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Journal Entries List */}
      <div className="space-y-4">
        {filteredEntries.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center text-slate-500 text-xs">
            No journal entries match your search criteria.
          </div>
        ) : (
          filteredEntries.map((entry) => (
            <div
              key={entry.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl overflow-hidden transition-all shadow-sm"
            >
              {/* Journal Entry Header */}
              <div className="bg-slate-950/70 p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-amber-300 text-xs bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20">
                    {entry.entryNumber}
                  </span>
                  <div>
                    <h3 className="font-semibold text-white text-xs">{entry.description}</h3>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                      Ref: {entry.referenceType} ({entry.referenceId}) • Date: {entry.entryDate.split('T')[0]}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <span className="bg-emerald-500/10 text-emerald-400 font-mono text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/20">
                    ✓ BALANCED (₹{entry.totalDebit.toLocaleString('en-IN')})
                  </span>
                </div>
              </div>

              {/* Debit & Credit Lines Table */}
              <div className="overflow-x-auto p-4">
                <table className="w-full text-xs text-left">
                  <thead className="text-slate-500 uppercase text-[10px] font-bold border-b border-slate-800/80">
                    <tr>
                      <th className="pb-2">Account Name</th>
                      <th className="pb-2">Account Type</th>
                      <th className="pb-2 text-right">Debit (Dr) ₹</th>
                      <th className="pb-2 text-right">Credit (Cr) ₹</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 text-slate-300">
                    {entry.lines.map((line, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30">
                        <td className="py-2 font-medium">
                          <span className={line.debitAmount > 0 ? 'text-white' : 'text-slate-400 pl-4'}>
                            {line.debitAmount > 0 ? '' : 'To '} {line.accountName}
                          </span>
                        </td>
                        <td className="py-2 text-[11px] font-mono text-slate-400">{line.accountType}</td>
                        <td className="py-2 text-right font-mono font-bold text-emerald-400">
                          {line.debitAmount > 0 ? `₹${line.debitAmount.toLocaleString('en-IN')}` : '-'}
                        </td>
                        <td className="py-2 text-right font-mono font-bold text-blue-400">
                          {line.creditAmount > 0 ? `₹${line.creditAmount.toLocaleString('en-IN')}` : '-'}
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-slate-800 font-bold bg-slate-950/40 text-slate-200">
                      <td colSpan={2} className="py-2.5 text-right uppercase text-[10px] text-slate-500">
                        Total Transaction Balance:
                      </td>
                      <td className="py-2.5 text-right font-mono text-emerald-300">
                        ₹{entry.totalDebit.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 text-right font-mono text-blue-300">
                        ₹{entry.totalCredit.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
