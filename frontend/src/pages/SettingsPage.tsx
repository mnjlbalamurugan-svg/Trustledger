import React, { useState, useEffect } from 'react';
import {
  Settings,
  Shield,
  Sliders,
  Server,
  Camera,
  CheckCircle2,
  Info,
  Save
} from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';

export const SettingsPage: React.FC = () => {
  const [docThreshold, setDocThreshold] = useState(80);
  const [kycThreshold, setKycThreshold] = useState(90);
  const [networkThreshold, setNetworkThreshold] = useState(60);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <AppShell
      title="System Settings & Risk Calibration"
      subtitle="Configure enterprise parameters, fraud detection thresholds, and prototype environment controls."
    >
      <div className="space-y-8 max-w-4xl">
        {saved && (
          <div className="p-3.5 bg-mint-subtle border border-mint-fresh/40 rounded-xl text-xs text-mint-fresh flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4" />
            <span>Detection threshold preferences saved successfully for prototype session.</span>
          </div>
        )}

        {/* 1. Organization Information */}
        <div className="bg-charcoal-900 border border-plum-border/70 rounded-xl p-6 shadow-lg space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-violet-electric" />
            Organization & Environment
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 rounded-lg bg-charcoal-850 border border-plum-border/60">
              <span className="text-slate-400 block mb-1">Organization Name</span>
              <span className="font-semibold text-slate-100">TrustLedger Capital Partners Inc.</span>
            </div>
            <div className="p-3 rounded-lg bg-charcoal-850 border border-plum-border/60">
              <span className="text-slate-400 block mb-1">Environment</span>
              <span className="font-mono font-bold text-mint-fresh">Prototype Environment (Sandboxed)</span>
            </div>
          </div>
        </div>

        {/* 2. Detection Configuration Thresholds */}
        <form onSubmit={handleSave} className="bg-charcoal-900 border border-plum-border/70 rounded-xl p-6 shadow-lg space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-warm" />
              Detection Sensitivity Thresholds
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-plum-800 text-slate-300">
              DEMO PRESETS
            </span>
          </div>

          <div className="p-3 rounded-lg bg-plum-950/80 border border-plum-border/80 text-xs text-slate-300 flex items-start gap-2">
            <Info className="w-4 h-4 text-violet-electric flex-shrink-0 mt-0.5" />
            <span>
              These calibration values represent demo configuration thresholds for prototype evaluation, not scientifically certified regulatory boundaries.
            </span>
          </div>

          <div className="space-y-4 pt-2">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-slate-200">Document Forensics Confidence Threshold</span>
                <span className="font-mono text-violet-electric">{docThreshold}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="99"
                value={docThreshold}
                onChange={(e) => setDocThreshold(Number(e.target.value))}
                className="w-full accent-violet-electric cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-slate-200">KYC Facial Similarity Threshold</span>
                <span className="font-mono text-mint-fresh">{kycThreshold}%</span>
              </div>
              <input
                type="range"
                min="60"
                max="99"
                value={kycThreshold}
                onChange={(e) => setKycThreshold(Number(e.target.value))}
                className="w-full accent-mint-fresh cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-slate-200">Fraud Network Linkage Risk Threshold</span>
                <span className="font-mono text-coral-vibrant">{networkThreshold} / 100</span>
              </div>
              <input
                type="range"
                min="30"
                max="90"
                value={networkThreshold}
                onChange={(e) => setNetworkThreshold(Number(e.target.value))}
                className="w-full accent-coral-vibrant cursor-pointer"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-plum-border/60 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-plum-800 hover:bg-plum-700 text-white text-xs font-bold transition-all shadow flex items-center space-x-1.5 border border-violet-electric/40"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Configuration</span>
            </button>
          </div>
        </form>

        {/* 3. System Infrastructure Health */}
        <div className="bg-charcoal-900 border border-plum-border/70 rounded-xl p-6 shadow-lg space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Server className="w-4 h-4 text-mint-fresh" />
            Infrastructure Diagnostics
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-charcoal-850 border border-plum-border/60">
              <span className="text-slate-400 block mb-1">FastAPI Engine</span>
              <span className="font-mono font-bold text-mint-fresh flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-mint-fresh animate-pulse" /> OPERATIONAL
              </span>
            </div>
            <div className="p-3 rounded-lg bg-charcoal-850 border border-plum-border/60">
              <span className="text-slate-400 block mb-1">Database Layer</span>
              <span className="font-mono font-bold text-mint-fresh flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-mint-fresh" /> SQLITE CONNECTED
              </span>
            </div>
            <div className="p-3 rounded-lg bg-charcoal-850 border border-plum-border/60">
              <span className="text-slate-400 block mb-1">Verification Ledger</span>
              <span className="font-mono font-bold text-violet-electric flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-violet-electric" /> HASH-CHAIN VALID
              </span>
            </div>
            <div className="p-3 rounded-lg bg-charcoal-850 border border-plum-border/60">
              <span className="text-slate-400 block mb-1">Camera Stream API</span>
              <span className="font-mono font-bold text-mint-fresh flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-mint-fresh" /> MEDIA SUPPORTED
              </span>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
};
