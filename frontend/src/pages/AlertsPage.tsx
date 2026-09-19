import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  AlertOctagon,
  AlertTriangle,
  Info,
  CheckCircle2,
  Filter,
  Eye,
  Check
} from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { api } from '../services/api';
import { AlertItem } from '../types';

export const AlertsPage: React.FC = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const data = await api.getAlerts({
        severity: severityFilter !== 'ALL' ? severityFilter : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
      });
      setAlerts(data);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [severityFilter, statusFilter]);

  const handleUpdateStatus = async (alertId: string, status: 'REVIEWED' | 'RESOLVED') => {
    try {
      await api.updateAlertStatus(alertId, status);
      fetchAlerts();
    } catch (err: any) {
      alert(err.message || 'Failed to update alert');
    }
  };

  return (
    <AppShell
      title="Live Threat Alert Triage"
      subtitle="Security alerts categorized by forensic detection layer and risk severity."
    >
      <div className="space-y-6">
        {/* Severity Filter Tabs */}
        <div className="bg-charcoal-900 border border-plum-border/70 rounded-xl p-4 shadow-lg flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'ALL', label: 'All Alerts' },
              { id: 'CRITICAL', label: 'Critical' },
              { id: 'HIGH', label: 'High' },
              { id: 'MEDIUM', label: 'Medium' },
              { id: 'LOW', label: 'Low / Cleared' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSeverityFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  severityFilter === tab.id
                    ? 'bg-plum-800 text-white border border-violet-electric/40 shadow-sm'
                    : 'bg-charcoal-850 text-slate-400 hover:text-slate-200 border border-charcoal-border'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-charcoal-850 border border-charcoal-border text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-violet-electric"
            >
              <option value="ALL">All States</option>
              <option value="ACTIVE">Active</option>
              <option value="REVIEWED">Reviewed</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>
        </div>

        {/* Alerts Table or Empty State */}
        {alerts.length === 0 && !loading ? (
          <div className="bg-charcoal-900 border border-plum-border/70 rounded-xl p-12 text-center shadow-lg">
            <div className="w-16 h-16 rounded-2xl bg-plum-800/80 border border-plum-border flex items-center justify-center mx-auto mb-4 text-mint-fresh">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">No active alerts</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              All loan applications in your portfolio are currently operating within normal security parameters. New alerts will be flagged automatically as anomalies or multi-vector fraud patterns are detected.
            </p>
          </div>
        ) : (
          <div className="bg-charcoal-900 border border-plum-border/70 rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-plum-border/80 bg-plum-950/60 text-[11px] font-mono uppercase text-slate-400">
                    <th className="py-3.5 px-4 font-semibold">Severity</th>
                    <th className="py-3.5 px-4 font-semibold">Layer</th>
                    <th className="py-3.5 px-4 font-semibold">Application</th>
                    <th className="py-3.5 px-4 font-semibold">Finding Description</th>
                    <th className="py-3.5 px-4 font-semibold">Timestamp</th>
                    <th className="py-3.5 px-4 font-semibold">Status</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-charcoal-border text-xs">
                  {alerts.map((alt) => (
                    <tr key={alt.id} className="hover:bg-plum-900/30 transition-colors">
                      {/* Severity */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          alt.severity === 'CRITICAL' ? 'bg-coral-subtle text-coral-dark' :
                          alt.severity === 'HIGH' ? 'bg-coral-subtle text-coral-vibrant' :
                          alt.severity === 'MEDIUM' ? 'bg-amber-subtle text-amber-warm' :
                          'bg-mint-subtle text-mint-fresh'
                        }`}>
                          <span>{alt.severity}</span>
                        </span>
                      </td>

                      {/* Layer */}
                      <td className="py-3.5 px-4 font-medium text-slate-300">
                        {alt.detection_layer}
                      </td>

                      {/* Application */}
                      <td className="py-3.5 px-4 font-mono font-bold text-white">
                        {alt.application_number}
                      </td>

                      {/* Description */}
                      <td className="py-3.5 px-4 text-slate-200">
                        <div className="font-semibold">{alt.title}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{alt.description}</div>
                      </td>

                      {/* Timestamp */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                        {new Date(alt.created_at).toLocaleString()}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          alt.status === 'ACTIVE' ? 'bg-coral-subtle text-coral-vibrant border border-coral-vibrant/30' :
                          alt.status === 'REVIEWED' ? 'bg-amber-subtle text-amber-warm' :
                          'bg-mint-subtle text-mint-fresh'
                        }`}>
                          {alt.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => navigate(`/applications?target=${alt.application_number}`)}
                            className="px-2.5 py-1 rounded bg-plum-800 hover:bg-plum-750 text-violet-electric text-[11px] font-semibold flex items-center space-x-1"
                            title="Open Case Dossier"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Investigate</span>
                          </button>

                          {alt.status !== 'REVIEWED' && alt.status !== 'RESOLVED' && (
                            <button
                              onClick={() => handleUpdateStatus(alt.id, 'REVIEWED')}
                              className="p-1 rounded text-slate-400 hover:text-amber-warm hover:bg-charcoal-800"
                              title="Mark Reviewed"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {alt.status !== 'RESOLVED' && (
                            <button
                              onClick={() => handleUpdateStatus(alt.id, 'RESOLVED')}
                              className="p-1 rounded text-slate-400 hover:text-mint-fresh hover:bg-charcoal-800"
                              title="Resolve Alert"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
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
