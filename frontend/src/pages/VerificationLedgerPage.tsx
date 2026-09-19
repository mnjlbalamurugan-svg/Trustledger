import React, { useState, useEffect } from 'react';
import {
  Database,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Hash,
  ArrowDown,
  Layers,
  Sparkles,
  Plus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { HashDisplay } from '../components/common/HashDisplay';
import { api } from '../services/api';
import { LedgerRecord } from '../types';

export const VerificationLedgerPage: React.FC = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState<LedgerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);

  const fetchLedger = async () => {
    try {
      setLoading(true);
      const data = await api.getLedgerRecords();
      setRecords(data);
    } catch (err) {
      console.error('Failed to load ledger records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, []);

  const handleVerifyLedger = async () => {
    try {
      setVerifying(true);
      const res = await api.verifyLedger();
      setVerificationResult(res);
      fetchLedger();
    } catch (err: any) {
      alert(err.message || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <AppShell
      title="Cryptographic Verification Ledger"
      subtitle="Tamper-evident verification records chained with sequential SHA-256 state hashes."
    >
      <div className="space-y-8">
        {/* Verification Trigger Banner */}
        <div className="bg-charcoal-900 border border-plum-border/70 rounded-xl p-6 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-plum-800 border border-mint-fresh/40 flex items-center justify-center text-mint-fresh flex-shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white">Tamper-Evident Verification Ledger</h3>
                <span className="px-2 py-0.5 rounded font-mono text-xs font-bold bg-mint-subtle text-mint-fresh border border-mint-fresh/30">
                  Append-Only Hash Chain
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Every captured identity document, live selfie, forensic result, and underwriter action is cryptographically anchored.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              disabled={verifying}
              onClick={handleVerifyLedger}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-plum-700 to-mint-dark hover:from-plum-600 hover:to-mint-fresh text-white text-xs font-bold transition-all shadow-md flex items-center space-x-2 disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${verifying ? 'animate-spin' : ''}`} />
              <span>{verifying ? 'Recomputing Chain...' : 'Verify Ledger Integrity'}</span>
            </button>
          </div>
        </div>

        {/* Verification Result Status Banner */}
        {verificationResult && (
          <div
            className={`p-4 rounded-xl border flex items-center justify-between ${
              verificationResult.is_valid
                ? 'bg-mint-subtle/40 border-mint-fresh/40 text-mint-fresh'
                : 'bg-coral-subtle/40 border-coral-vibrant/40 text-coral-vibrant'
            }`}
          >
            <div className="flex items-center space-x-3">
              {verificationResult.is_valid ? (
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              )}
              <div>
                <div className="text-xs font-bold uppercase tracking-wider">
                  {verificationResult.is_valid ? 'Ledger Integrity Verified' : 'Integrity Violation Detected'}
                </div>
                <div className="text-xs text-slate-300 mt-0.5">
                  {verificationResult.message} ({verificationResult.verified_records} verified records)
                </div>
              </div>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              Verified at {new Date(verificationResult.verification_timestamp).toLocaleTimeString()}
            </span>
          </div>
        )}

        {/* Visual Lifecycle Verification Pipeline */}
        <div className="bg-charcoal-900 border border-plum-border/70 rounded-xl p-6 shadow-lg">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
            Cryptographic Verification Chain Architecture
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-center">
            <div className="p-3.5 rounded-lg bg-charcoal-850 border border-plum-border/60">
              <span className="text-xs font-bold text-white block">1. Document Captured</span>
              <span className="text-[11px] text-slate-400">Client optical bytes</span>
            </div>
            <div className="p-3.5 rounded-lg bg-charcoal-850 border border-violet-electric/40">
              <span className="text-xs font-bold text-violet-electric block">2. Hash Generated</span>
              <span className="text-[11px] text-slate-400">SHA-256 Digest</span>
            </div>
            <div className="p-3.5 rounded-lg bg-charcoal-850 border border-plum-border/60">
              <span className="text-xs font-bold text-white block">3. Forensics Completed</span>
              <span className="text-[11px] text-slate-400">Biometrics & tamper score</span>
            </div>
            <div className="p-3.5 rounded-lg bg-charcoal-850 border border-violet-electric/40">
              <span className="text-xs font-bold text-violet-electric block">4. Hash Chained</span>
              <span className="text-[11px] text-slate-400">Previous + current block</span>
            </div>
            <div className="p-3.5 rounded-lg bg-charcoal-850 border border-mint-fresh/40">
              <span className="text-xs font-bold text-mint-fresh block">5. Integrity Confirmed</span>
              <span className="text-[11px] text-slate-400">Tamper-evident audit</span>
            </div>
          </div>
        </div>

        {/* Empty state or Records table */}
        {records.length === 0 && !loading ? (
          <div className="bg-charcoal-900 border border-plum-border/70 rounded-xl p-12 text-center shadow-lg">
            <div className="w-16 h-16 rounded-2xl bg-plum-800/80 border border-plum-border flex items-center justify-center mx-auto mb-4 text-violet-electric">
              <Database className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">No verification records yet</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mb-6 leading-relaxed">
              The cryptographic ledger is currently waiting for initial activity. As loan applications are registered, documents analyzed, and KYC liveness validations completed, immutable SHA-256 blocks will chain sequentially here.
            </p>
            <button
              type="button"
              onClick={() => navigate('/applications')}
              className="px-5 py-2.5 bg-gradient-to-r from-violet-deep to-plum-700 hover:from-violet-electric hover:to-plum-600 text-white text-xs font-bold rounded-xl shadow-lg transition-all inline-flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Application</span>
            </button>
          </div>
        ) : (
          <div className="bg-charcoal-900 border border-plum-border/70 rounded-xl shadow-lg overflow-hidden">
            <div className="p-4 border-b border-plum-border/70 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Immutable Verification Records ({records.length})
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Formula: current_hash = SHA256(previous_hash + artifact_hash + timestamp + record_data)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-plum-border/80 bg-plum-950/60 text-[11px] font-mono uppercase text-slate-400">
                    <th className="py-3 px-4 font-semibold">Record ID</th>
                    <th className="py-3 px-4 font-semibold">Application</th>
                    <th className="py-3 px-4 font-semibold">Artifact Type</th>
                    <th className="py-3 px-4 font-semibold">Artifact Hash</th>
                    <th className="py-3 px-4 font-semibold">Previous Hash</th>
                    <th className="py-3 px-4 font-semibold">Block Hash</th>
                    <th className="py-3 px-4 font-semibold">Timestamp</th>
                    <th className="py-3 px-4 font-semibold text-right">Integrity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-charcoal-border text-xs">
                  {records.map((rec) => (
                    <tr key={rec.id} className="hover:bg-plum-900/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-slate-400">
                        {rec.id.slice(0, 8)}...
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-white">
                        {rec.application_number || 'SYSTEM'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-200 font-medium">
                        {rec.artifact_type}
                      </td>
                      <td className="py-3.5 px-4">
                        <HashDisplay hash={rec.artifact_hash} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">
                        {rec.previous_hash.slice(0, 8)}...
                      </td>
                      <td className="py-3.5 px-4">
                        <HashDisplay hash={rec.record_hash} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                        {new Date(rec.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span
                          className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                            rec.integrity_status === 'VERIFIED'
                              ? 'bg-mint-subtle text-mint-fresh border border-mint-fresh/30'
                              : 'bg-coral-subtle text-coral-vibrant border border-coral-vibrant/30'
                          }`}
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{rec.integrity_status}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
};
