'use client';

import React from 'react';
import { AlertCircle, RefreshCw, Sparkles, Database, Cloud, CheckCircle2 } from 'lucide-react';
import { useDemoTMS } from '../../lib/demo-context';

export const DemoModeBanner: React.FC = () => {
  const {
    isDemoMode,
    setIsDemoMode,
    activeRole,
    resetToDefaultDemo,
    isServerSyncing,
    syncStatus,
    syncWithBackend,
  } = useDemoTMS();

  return (
    <aside
      aria-label="Application mode notice"
      className={`w-full border-b px-4 py-2 text-xs transition-colors ${
        isDemoMode
          ? 'bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-rose-500/15 border-amber-500/30 text-amber-200'
          : 'bg-gradient-to-r from-emerald-500/15 via-teal-500/15 to-cyan-500/15 border-emerald-500/30 text-emerald-200'
      }`}
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span
            className={`flex items-center gap-1.5 font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full text-[10px] border ${
              isDemoMode
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
            }`}
          >
            {isDemoMode ? (
              <>
                <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
                Interactive Simulation Mode
              </>
            ) : (
              <>
                <Database className="w-3 h-3 text-emerald-400" />
                Live / Staging API Mode (/api/v1)
              </>
            )}
          </span>

          <span className="text-slate-300 hidden sm:inline">
            Active Persona: <strong className="text-white uppercase font-semibold">{activeRole}</strong>
          </span>

          <span className={isDemoMode ? 'text-amber-300/80 text-[11px]' : 'text-emerald-300/80 text-[11px]'}>
            {isDemoMode
              ? '• Pure client prototype with sample records'
              : `• Connected to /api/v1 endpoints ${syncStatus.lastSync ? `(Synced: ${syncStatus.lastSync})` : ''}`}
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {!isDemoMode && (
            <button
              onClick={() => syncWithBackend()}
              disabled={isServerSyncing}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30 border border-emerald-500/40 text-[11px] font-medium transition-colors"
            >
              <RefreshCw className={`w-3 h-3 ${isServerSyncing ? 'animate-spin' : ''}`} />
              {isServerSyncing ? 'Syncing...' : 'Sync with Server'}
            </button>
          )}

          <button
            onClick={() => setIsDemoMode(!isDemoMode)}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 text-[11px] transition-colors"
            title="Toggle between in-memory simulation and live API backend"
          >
            {isDemoMode ? (
              <>
                <Cloud className="w-3 h-3 text-cyan-400" />
                Switch to API Mode
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3 text-amber-400" />
                Switch to Demo Mode
              </>
            )}
          </button>

          {isDemoMode && (
            <button
              onClick={resetToDefaultDemo}
              className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors underline decoration-dotted text-[11px]"
              title="Reset to default mock state"
            >
              <RefreshCw className="w-3 h-3" />
              Reset Data
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
