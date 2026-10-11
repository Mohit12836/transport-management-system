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
      className={`w-full border-b px-4 py-2 text-xs backdrop-blur-xl transition-all ${
        isDemoMode
          ? 'bg-gradient-to-r from-amber-950/60 via-slate-950/80 to-slate-950/90 border-amber-500/30 text-amber-200 shadow-[0_2px_15px_rgba(245,158,11,0.15)]'
          : 'bg-gradient-to-r from-emerald-950/60 via-slate-950/80 to-slate-950/90 border-emerald-500/30 text-emerald-200 shadow-[0_2px_15px_rgba(16,185,129,0.15)]'
      }`}
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span
            className={`flex items-center gap-1.5 font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full text-[10px] border ${
              isDemoMode
                ? 'badge-glow-amber'
                : 'badge-glow-emerald'
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
            Active Persona: <strong className="text-white uppercase font-bold tracking-wide">{activeRole}</strong>
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
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30 border border-emerald-500/40 text-[11px] font-semibold transition-all hover:scale-105 active:scale-95 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
            >
              <RefreshCw className={`w-3 h-3 ${isServerSyncing ? 'animate-spin' : ''}`} />
              {isServerSyncing ? 'Syncing...' : 'Sync with Server'}
            </button>
          )}

          <button
            onClick={() => setIsDemoMode(!isDemoMode)}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-gradient-to-r from-slate-800 to-slate-900 text-slate-200 hover:text-white border border-white/10 hover:border-cyan-500/40 text-[11px] font-medium transition-all hover:scale-105 active:scale-95 shadow-sm"
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
              className="inline-flex items-center gap-1.5 text-slate-400 hover:text-rose-400 transition-colors text-[11px] font-medium cursor-pointer"
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
