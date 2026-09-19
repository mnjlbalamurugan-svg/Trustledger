import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  ArrowUpDown,
  ShieldAlert,
  ChevronRight,
  Eye,
  CheckCircle,
  AlertTriangle,
  FileText,
  Plus
} from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { ApplicationDrawer } from '../components/drawer/ApplicationDrawer';
import { NewApplicationModal } from '../components/applications/NewApplicationModal';
import { api } from '../services/api';
import { ApplicationItem, ApplicationDetail } from '../types';

export const ApplicationsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const targetFromUrl = searchParams.get('target');

  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [isNewAppModalOpen, setIsNewAppModalOpen] = useState(false);

  // Drawer state
  const [selectedAppDetail, setSelectedAppDetail] = useState<ApplicationDetail | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const data = await api.getApplications({
        search: search || undefined,
        risk_level: riskFilter !== 'ALL' ? riskFilter : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
      });
      setApplications(data);

      // Auto-open target if specified in URL
      if (targetFromUrl && !selectedAppDetail) {
        openApplicationDrawer(targetFromUrl);
      }
    } catch (err) {
      console.error('Failed to fetch applications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [riskFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchApplications();
  };

  const openApplicationDrawer = async (appIdOrNumber: string) => {
    try {
      const detail = await api.getApplicationDetail(appIdOrNumber);
      setSelectedAppDetail(detail);
      setIsDrawerOpen(true);
    } catch (err) {
      console.error('Failed to open application drawer:', err);
    }
  };

  const handleStatusUpdated = (newStatus: string) => {
    if (selectedAppDetail) {
      setSelectedAppDetail({ ...selectedAppDetail, status: newStatus });
    }
    fetchApplications();
  };

  return (
    <AppShell
      title="Lending Applications Intelligence"
      subtitle="Multi-signal evidence audit and underwriter risk evaluation queue."
    >
      <div className="space-y-6">
        {/* Filter and search toolbar */}
        <div className="bg-charcoal-900 border border-plum-border/70 rounded-xl p-4 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full md:max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID (TL-10482), applicant name, or PAN..."
              className="w-full pl-10 pr-4 py-2 bg-charcoal-850 border border-charcoal-border rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-electric transition-colors"
            />
          </form>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Risk Level Filter */}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400 font-medium">Risk:</span>
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="bg-charcoal-850 border border-charcoal-border text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-violet-electric"
              >
                <option value="ALL">All Bands</option>
                <option value="LOW">Low (0-29)</option>
                <option value="MEDIUM">Medium (30-59)</option>
                <option value="HIGH">High (60-79)</option>
                <option value="CRITICAL">Critical (80+)</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400 font-medium">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-charcoal-850 border border-charcoal-border text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-violet-electric"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="CLEARED">Cleared</option>
                <option value="QUARANTINED">Quarantined</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => setIsNewAppModalOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-violet-deep to-plum-700 hover:from-violet-electric hover:to-plum-600 text-white text-xs font-bold rounded-lg shadow-md transition-all flex items-center space-x-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Application</span>
            </button>
          </div>
        </div>

        {/* Enterprise Data Table or Empty State */}
        {applications.length === 0 && !loading ? (
          <div className="bg-charcoal-900 border border-plum-border/70 rounded-xl p-12 text-center shadow-lg">
            <div className="w-16 h-16 rounded-2xl bg-plum-800/80 border border-plum-border flex items-center justify-center mx-auto mb-4 text-violet-electric">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">No applications yet</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mb-6 leading-relaxed">
              No loan applications registered under your account yet. Create your first applicant profile to initiate automated document forensics, photo KYC, and fraud network screening.
            </p>
            <button
              type="button"
              onClick={() => setIsNewAppModalOpen(true)}
              className="px-5 py-2.5 bg-gradient-to-r from-violet-deep to-plum-700 hover:from-violet-electric hover:to-plum-600 text-white text-xs font-bold rounded-xl shadow-lg transition-all inline-flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Application</span>
            </button>
          </div>
        ) : (
          <div className="bg-charcoal-900 border border-plum-border/70 rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-plum-border/80 bg-plum-950/60 text-[11px] font-mono uppercase text-slate-400">
                  <th className="py-3.5 px-4 font-semibold">Application ID</th>
                  <th className="py-3.5 px-4 font-semibold">Applicant</th>
                  <th className="py-3.5 px-4 font-semibold">Document Forensics</th>
                  <th className="py-3.5 px-4 font-semibold">Photo & KYC</th>
                  <th className="py-3.5 px-4 font-semibold">Fraud Network</th>
                  <th className="py-3.5 px-4 font-semibold">Risk Score</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-border text-xs">
                {applications.map((app) => (
                  <tr
                    key={app.id}
                    onClick={() => openApplicationDrawer(app.application_number)}
                    className="hover:bg-plum-900/40 cursor-pointer transition-colors group"
                  >
                    {/* App ID */}
                    <td className="py-3.5 px-4 font-mono font-bold text-white group-hover:text-violet-electric transition-colors">
                      {app.application_number}
                    </td>

                    {/* Applicant */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-200">{app.applicant_name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">₹{app.requested_amount.toLocaleString()}</div>
                    </td>

                    {/* Document */}
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium ${
                        app.document_status === 'SUSPICIOUS' || app.document_status === 'TAMPERED'
                          ? 'bg-amber-subtle text-amber-warm border border-amber-warm/30'
                          : 'bg-mint-subtle text-mint-fresh border border-mint-fresh/30'
                      }`}>
                        <span>{app.document_status}</span>
                      </span>
                    </td>

                    {/* Photo/KYC */}
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium ${
                        app.kyc_status === 'REVIEW_REQUIRED' || app.kyc_status === 'FAILED'
                          ? 'bg-coral-subtle text-coral-vibrant border border-coral-vibrant/30'
                          : 'bg-mint-subtle text-mint-fresh border border-mint-fresh/30'
                      }`}>
                        <span>{app.kyc_status.replace('_', ' ')}</span>
                      </span>
                    </td>

                    {/* Network */}
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-mono ${
                        app.network_flag === 'FRAUD_RING'
                          ? 'bg-coral-subtle text-coral-dark font-bold border border-coral-dark/40'
                          : app.network_flag === 'LINKED'
                          ? 'bg-plum-800 text-violet-electric border border-plum-border'
                          : 'text-slate-400'
                      }`}>
                        <span>{app.network_flag === 'FRAUD_RING' ? '3 Linked (Ring)' : app.network_flag === 'LINKED' ? '1 Linked' : 'Clean'}</span>
                      </span>
                    </td>

                    {/* Risk Score */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-baseline space-x-2">
                        <span className={`font-mono font-bold text-sm ${
                          app.risk_level === 'CRITICAL' ? 'text-coral-dark' :
                          app.risk_level === 'HIGH' ? 'text-coral-vibrant' :
                          app.risk_level === 'MEDIUM' ? 'text-amber-warm' :
                          'text-mint-fresh'
                        }`}>
                          {app.risk_score}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">/ 100</span>
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                          app.risk_level === 'CRITICAL' ? 'bg-coral-subtle text-coral-dark' :
                          app.risk_level === 'HIGH' ? 'bg-coral-subtle text-coral-vibrant' :
                          app.risk_level === 'MEDIUM' ? 'bg-amber-subtle text-amber-warm' :
                          'bg-mint-subtle text-mint-fresh'
                        }`}>
                          {app.risk_level}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-medium uppercase tracking-wider ${
                        app.status === 'CLEARED' ? 'bg-mint-subtle text-mint-fresh' :
                        app.status === 'MANUAL_REVIEW_MARKED' ? 'bg-amber-subtle text-amber-warm border border-amber-warm/30' :
                        app.status === 'QUARANTINED' ? 'bg-coral-subtle text-coral-dark' :
                        'bg-charcoal-800 text-slate-300'
                      }`}>
                        {app.status.replace(/_/g, ' ')}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openApplicationDrawer(app.application_number);
                        }}
                        className="p-1.5 text-slate-400 hover:text-violet-electric hover:bg-plum-800 rounded-md transition-colors inline-flex items-center space-x-1"
                        title="Inspect Evidence Dossier"
                      >
                        <Eye className="w-4 h-4" />
                        <span className="text-[11px] font-medium hidden sm:inline">Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        )}
      </div>

      {/* Application Investigation Drawer */}
      <ApplicationDrawer
        application={selectedAppDetail}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onStatusUpdated={handleStatusUpdated}
      />

      {/* New Loan Application Modal */}
      <NewApplicationModal
        isOpen={isNewAppModalOpen}
        onClose={() => setIsNewAppModalOpen(false)}
        onApplicationCreated={() => fetchApplications()}
      />
    </AppShell>
  );
};
