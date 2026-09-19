import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  ShieldAlert,
  FileText,
  UserCheck,
  Share2,
  Database,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { RiskMeter } from '../common/RiskMeter';
import { api } from '../../services/api';
import { ApplicationDetail } from '../../types';

interface ApplicationDrawerProps {
  application: ApplicationDetail | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdated?: (newStatus: string) => void;
}

export const ApplicationDrawer: React.FC<ApplicationDrawerProps> = ({
  application,
  isOpen,
  onClose,
  onStatusUpdated,
}) => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  if (!isOpen || !application) return null;

  const handleManualReview = async () => {
    try {
      setSubmitting(true);
      const res = await api.markForManualReview(application.application_number);
      setActionMessage(res.message);
      if (onStatusUpdated) onStatusUpdated('MANUAL_REVIEW_MARKED');
    } catch (err: any) {
      alert(err.message || 'Failed to mark for manual review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClearApplication = async () => {
    try {
      setSubmitting(true);
      const res = await api.updateApplicationStatus(
        application.application_number,
        'CLEARED',
        'Underwriter cleared application following risk interview'
      );
      setActionMessage('Application cleared and marked verified.');
      if (onStatusUpdated) onStatusUpdated('CLEARED');
    } catch (err: any) {
      alert(err.message || 'Failed to clear application');
    } finally {
      setSubmitting(false);
    }
  };

  const summary = application.evidence_summary;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-2xl bg-charcoal-900 border-l border-plum-border h-full flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-6 border-b border-plum-border bg-plum-950 flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-xl font-bold text-white tracking-tight">
                {application.applicant.name}
              </h2>
              <span className="px-2.5 py-0.5 rounded font-mono text-xs bg-plum-800 text-violet-electric border border-plum-border">
                {application.application_number}
              </span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                application.status === 'CLEARED' ? 'bg-mint-subtle text-mint-fresh border border-mint-fresh/30' :
                application.status === 'MANUAL_REVIEW_MARKED' ? 'bg-amber-subtle text-amber-warm border border-amber-warm/30' :
                'bg-plum-850 text-slate-300 border border-plum-border'
              }`}>
                {application.status.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Loan Request: <span className="text-slate-200 font-mono font-medium">₹{application.requested_amount.toLocaleString()}</span> • {application.loan_purpose}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-plum-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action banner notification */}
        {actionMessage && (
          <div className="p-3 bg-plum-800 border-b border-violet-electric/40 text-xs text-mint-fresh flex items-center justify-between px-6">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> {actionMessage}
            </span>
            <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-white">✕</button>
          </div>
        )}

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Segmented Risk Score Meter */}
          <div>
            <RiskMeter score={application.risk_score} level={application.risk_level} size="lg" />
          </div>

          {/* Explainability Section */}
          <div className="p-4 rounded-xl bg-plum-950/70 border border-plum-border">
            <div className="flex items-center space-x-2 text-violet-electric text-xs font-bold uppercase tracking-wider mb-2">
              <HelpCircle className="w-4 h-4" />
              <span>Why was this flagged?</span>
            </div>
            <blockquote className="text-xs leading-relaxed text-slate-300 pl-3 border-l-2 border-violet-electric/60 italic">
              "{application.explainability}"
            </blockquote>
            <p className="text-[11px] text-slate-400 mt-2">
              Note: TrustLedger provides explainable risk signals to support human underwriter judgement.
            </p>
          </div>

          {/* Four Evidence Modules */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Evidence Summary (4 Forensic Signals)
            </h3>

            {/* 1. Document Forensics */}
            <div className="p-4 rounded-xl bg-charcoal-850 border border-plum-border/60 hover:border-plum-border transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-amber-warm" />
                  <span className="text-sm font-semibold text-white">Document Forensics</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-coral-subtle text-coral-vibrant border border-coral-vibrant/30">
                  Confidence: {summary.document_forensics?.confidence || 91}%
                </span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {summary.document_forensics?.items?.map((it, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="text-amber-warm font-bold">•</span>
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 pt-2 border-t border-charcoal-border flex justify-end">
                <button
                  onClick={() => { onClose(); navigate('/documents'); }}
                  className="text-xs text-violet-electric hover:text-white flex items-center space-x-1 font-medium"
                >
                  <span>Open Document Inspector</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 2. Photo & KYC */}
            <div className="p-4 rounded-xl bg-charcoal-850 border border-plum-border/60 hover:border-plum-border transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <UserCheck className="w-4 h-4 text-violet-electric" />
                  <span className="text-sm font-semibold text-white">Photo & KYC Biometrics</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-subtle text-amber-warm border border-amber-warm/30">
                  Manipulation Conf: {summary.photo_kyc?.confidence || 87}%
                </span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {summary.photo_kyc?.items?.map((it, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className={it.includes('Detected') ? 'text-coral-vibrant font-bold' : 'text-mint-fresh font-bold'}>
                      {it.includes('Detected') ? '⚠' : '✓'}
                    </span>
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 pt-2 border-t border-charcoal-border flex justify-end">
                <button
                  onClick={() => { onClose(); navigate('/kyc'); }}
                  className="text-xs text-violet-electric hover:text-white flex items-center space-x-1 font-medium"
                >
                  <span>Launch KYC Studio</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 3. Fraud Network */}
            <div className="p-4 rounded-xl bg-charcoal-850 border border-plum-border/60 hover:border-plum-border transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Share2 className="w-4 h-4 text-coral-vibrant" />
                  <span className="text-sm font-semibold text-white">Fraud Network Intelligence</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-coral-subtle text-coral-vibrant border border-coral-vibrant/30">
                  Potential Ring
                </span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {summary.fraud_network?.items?.map((it, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="text-coral-vibrant font-bold">⚠</span>
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 pt-2 border-t border-charcoal-border flex justify-end">
                <button
                  onClick={() => { onClose(); navigate('/network'); }}
                  className="text-xs text-violet-electric hover:text-white flex items-center space-x-1 font-medium"
                >
                  <span>Explore Network Graph</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 4. Verification Ledger */}
            <div className="p-4 rounded-xl bg-charcoal-850 border border-plum-border/60 hover:border-plum-border transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Database className="w-4 h-4 text-mint-fresh" />
                  <span className="text-sm font-semibold text-white">Cryptographic Verification Ledger</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-mint-subtle text-mint-fresh border border-mint-fresh/30">
                  Chain Verified
                </span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {summary.verification_ledger?.items?.map((it, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="text-mint-fresh font-bold">✓</span>
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 pt-2 border-t border-charcoal-border flex justify-end">
                <button
                  onClick={() => { onClose(); navigate('/ledger'); }}
                  className="text-xs text-violet-electric hover:text-white flex items-center space-x-1 font-medium"
                >
                  <span>Inspect Hash Chain</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-5 border-t border-plum-border bg-plum-950 flex items-center justify-between">
          <div className="text-[11px] text-slate-400">
            Final underwriting decision is human-controlled.
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleClearApplication}
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-charcoal-800 hover:bg-charcoal-700 text-mint-fresh border border-mint-fresh/30 text-xs font-semibold transition-colors disabled:opacity-50"
            >
              Clear Application
            </button>
            <button
              onClick={handleManualReview}
              disabled={submitting}
              className="px-5 py-2 rounded-lg bg-gradient-to-r from-plum-700 to-coral-vibrant hover:from-plum-600 hover:to-coral-dark text-white text-xs font-bold transition-all shadow-md disabled:opacity-50 flex items-center gap-1.5"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Mark for Manual Review</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
