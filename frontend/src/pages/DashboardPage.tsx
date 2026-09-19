import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  AlertOctagon,
  FileWarning,
  Camera,
  TrendingUp,
  Layers,
  ArrowRight,
  ShieldCheck,
  Plus
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { AppShell } from '../components/layout/AppShell';
import { api } from '../services/api';
import { DashboardSummary, RiskTrendPoint, AlertItem } from '../types';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<DashboardSummary>({
    applications_reviewed: 0,
    high_risk_applications: 0,
    documents_flagged: 0,
    kyc_alerts: 0,
    risk_distribution: { Low: 0, Medium: 0, High: 0, Critical: 0 },
  });
  const [trendData, setTrendData] = useState<RiskTrendPoint[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [sumRes, trendRes, alertsRes] = await Promise.all([
          api.getDashboardSummary(),
          api.getRiskTrend(),
          api.getDashboardAlerts(),
        ]);
        if (sumRes) setSummary(sumRes);
        if (trendRes) setTrendData(trendRes);
        if (alertsRes) setAlerts(alertsRes);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalApps = summary.applications_reviewed;
  const riskDistributionData = [
    { name: 'Low', count: summary.risk_distribution.Low, color: '#62D6A7' },
    { name: 'Medium', count: summary.risk_distribution.Medium, color: '#F4A340' },
    { name: 'High', count: summary.risk_distribution.High, color: '#F05A5A' },
    { name: 'Critical', count: summary.risk_distribution.Critical, color: '#DC2626' },
  ];

  return (
    <AppShell
      title="Fraud Risk Overview"
      subtitle="Real-time security intelligence across digital lending applications."
    >
      <div className="space-y-8">
        {/* KPI Cards Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Applications Reviewed (Violet accent) */}
          <div className="bg-charcoal-900 border border-plum-border/70 rounded-xl p-5 relative overflow-hidden shadow-lg card-hover-plum">
            <div className="absolute top-0 left-0 right-0 h-1 bg-violet-electric" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Applications Reviewed
              </span>
              <div className="p-2 rounded-lg bg-violet-subtle text-violet-electric">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-mono font-bold text-white tracking-tight">
                {summary.applications_reviewed}
              </span>
            </div>
            <div className="mt-2 flex items-center text-xs text-slate-400">
              <span>{totalApps > 0 ? 'Active underwriting portfolio' : 'No applications created yet'}</span>
            </div>
          </div>

          {/* High-Risk Applications (Coral accent) */}
          <div className="bg-charcoal-900 border border-plum-border/70 rounded-xl p-5 relative overflow-hidden shadow-lg card-hover-plum">
            <div className="absolute top-0 left-0 right-0 h-1 bg-coral-vibrant" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                High-Risk Applications
              </span>
              <div className="p-2 rounded-lg bg-coral-subtle text-coral-vibrant">
                <AlertOctagon className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-mono font-bold text-coral-vibrant tracking-tight">
                {summary.high_risk_applications}
              </span>
            </div>
            <div className="mt-2 flex items-center text-xs text-slate-400">
              <span>{summary.high_risk_applications > 0 ? 'Escalated for manual review' : 'Zero high-risk cases detected'}</span>
            </div>
          </div>

          {/* Documents Flagged (Amber accent) */}
          <div className="bg-charcoal-900 border border-plum-border/70 rounded-xl p-5 relative overflow-hidden shadow-lg card-hover-plum">
            <div className="absolute top-0 left-0 right-0 h-1 bg-amber-warm" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Documents Flagged
              </span>
              <div className="p-2 rounded-lg bg-amber-subtle text-amber-warm">
                <FileWarning className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-mono font-bold text-amber-warm tracking-tight">
                {summary.documents_flagged}
              </span>
            </div>
            <div className="mt-2 flex items-center text-xs text-slate-400">
              <span>Forensic & metadata anomalies</span>
            </div>
          </div>

          {/* KYC Alerts (Mint/Coral accent) */}
          <div className="bg-charcoal-900 border border-plum-border/70 rounded-xl p-5 relative overflow-hidden shadow-lg card-hover-plum">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-mint-fresh to-coral-vibrant" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                KYC Alerts
              </span>
              <div className="p-2 rounded-lg bg-plum-800 text-mint-fresh">
                <Camera className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-mono font-bold text-white tracking-tight">
                {summary.kyc_alerts}
              </span>
            </div>
            <div className="mt-2 flex items-center text-xs text-slate-400">
              <span>Biometric & liveness checks</span>
            </div>
          </div>
        </div>

        {/* Charts Grid: Risk Trend & Risk Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Trend Area Chart (8 cols) */}
          <div className="lg:col-span-8 bg-charcoal-900 border border-plum-border/70 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-violet-electric" />
                  Fraud Risk Trajectory (14 Days)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Portfolio underwriting volume vs high-risk detection velocity
                </p>
              </div>
            </div>

            {totalApps === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-plum-border/60 rounded-xl">
                <TrendingUp className="w-8 h-8 text-slate-500 mb-2" />
                <span className="text-xs font-semibold text-slate-300">No application activity yet</span>
                <p className="text-[11px] text-slate-400 mt-1 max-w-sm">
                  As you create loan applications and inspect documents, risk trends will populate dynamically here.
                </p>
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="violetGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="coralGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F05A5A" stopOpacity={0.5} />
                        <stop offset="95%" stopColor="#F05A5A" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#17151C',
                        borderColor: '#382247',
                        borderRadius: '8px',
                        color: '#F1EFF5',
                        fontSize: '12px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="reviewed"
                      stroke="#8B5CF6"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#violetGrad)"
                      name="Reviewed"
                    />
                    <Area
                      type="monotone"
                      dataKey="flagged"
                      stroke="#F05A5A"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#coralGrad)"
                      name="Flagged High-Risk"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Risk Distribution Breakdown (4 cols) */}
          <div className="lg:col-span-4 bg-charcoal-900 border border-plum-border/70 rounded-xl p-6 shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                  <Layers className="w-4 h-4 text-mint-fresh" />
                  Risk Distribution
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-plum-800 text-slate-300">
                  Portfolio
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-5">
                Active application volume segmented by composite threat band.
              </p>

              <div className="space-y-3.5">
                {riskDistributionData.map((tier) => {
                  const percentage = totalApps > 0 ? ((tier.count / totalApps) * 100).toFixed(1) : '0.0';
                  return (
                    <div key={tier.name} className="space-y-1">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-slate-300 font-semibold">{tier.name}</span>
                        <span className="text-slate-400">
                          {tier.count} <span className="text-slate-500">({percentage}%)</span>
                        </span>
                      </div>
                      <div className="h-2 bg-charcoal-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%`, backgroundColor: tier.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-plum-border/60 flex items-center justify-between text-xs text-slate-400">
              <span>Underwriting Risk Engine</span>
              <span className="font-mono text-mint-fresh">Operational</span>
            </div>
          </div>
        </div>

        {/* Recent Security Alerts Feed */}
        <div className="bg-charcoal-900 border border-plum-border/70 rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Recent Security Alerts
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Immediate threat notifications across document forensics, biometrics, and fraud network links.
              </p>
            </div>
            {alerts.length > 0 && (
              <button
                onClick={() => navigate('/alerts')}
                className="text-xs text-violet-electric hover:text-white flex items-center space-x-1 font-semibold"
              >
                <span>View All Alerts</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {alerts.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-xs">
              <ShieldCheck className="w-8 h-8 text-mint-fresh/80 mx-auto mb-2" />
              <span className="font-semibold text-slate-300">No alerts yet.</span>
              <p className="text-[11px] text-slate-400 mt-1">
                Security alerts will trigger automatically upon detecting document tampering, facial deepfakes, or cross-application collisions.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-charcoal-border/80">
              {alerts.slice(0, 5).map((a) => (
                <div
                  key={a.id}
                  onClick={() => navigate(`/applications?target=${a.application_number}`)}
                  className="py-3.5 flex items-center justify-between hover:bg-charcoal-850/60 px-3 rounded-lg cursor-pointer transition-colors"
                >
                  <div className="flex items-start space-x-3.5 min-w-0">
                    <span
                      className={`mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                        a.severity === 'CRITICAL' ? 'bg-coral-dark shadow-sm shadow-coral-dark/50' :
                        a.severity === 'HIGH' ? 'bg-coral-vibrant' :
                        a.severity === 'MEDIUM' ? 'bg-amber-warm' :
                        'bg-mint-fresh'
                      }`}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-xs text-white">
                          {a.application_number}
                        </span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs font-semibold text-slate-200 truncate">
                          {a.title}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 truncate mt-0.5">{a.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 flex-shrink-0 ml-4">
                    <span className="hidden sm:inline-block text-[11px] font-mono px-2 py-0.5 rounded bg-plum-850 text-violet-electric border border-plum-border">
                      {a.detection_layer}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        a.severity === 'CRITICAL' ? 'bg-coral-subtle text-coral-dark border border-coral-dark/30' :
                        a.severity === 'HIGH' ? 'bg-coral-subtle text-coral-vibrant border border-coral-vibrant/30' :
                        a.severity === 'MEDIUM' ? 'bg-amber-subtle text-amber-warm border border-amber-warm/30' :
                        'bg-mint-subtle text-mint-fresh border border-mint-fresh/30'
                      }`}
                    >
                      {a.severity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
};
