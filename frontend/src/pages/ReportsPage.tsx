import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  PieChart,
  ShieldCheck,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell
} from 'recharts';
import { AppShell } from '../components/layout/AppShell';
import { api } from '../services/api';

export const ReportsPage: React.FC = () => {
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getReportsSummary()
      .then((data) => setReportData(data))
      .catch((err) => console.error('Failed to load reports summary:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleExportCSV = () => {
    window.open(api.getExportUrl(), '_blank');
  };

  const metrics = reportData?.metrics || {
    total_applications: 0,
    fraud_alerts: 0,
    document_alerts: 0,
    kyc_alerts: 0,
    network_alerts: 0,
    verification_success_rate: '100%',
  };

  const alertsByLayer = reportData?.alerts_by_layer || [];
  const applicationOutcomes = reportData?.application_outcomes || [
    { name: 'Cleared & Funded', value: 0, color: '#62D6A7' },
    { name: 'Under Review', value: 0, color: '#F4A340' },
    { name: 'Quarantined / Manual Review', value: 0, color: '#F05A5A' },
  ];

  return (
    <AppShell
      title="Lending Security Intelligence Reports"
      subtitle="Executive portfolio risk analysis, forensic detection distribution, and audit summaries."
    >
      <div className="space-y-8">
        {/* Executive Action Header */}
        <div className="bg-charcoal-900 border border-plum-border/70 rounded-xl p-6 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-violet-electric" />
              Institutional Security Summary (Current Cycle)
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              Audit data across {metrics.total_applications} loan applications evaluated by the TrustLedger intelligence pipeline.
            </p>
          </div>
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-plum-700 to-violet-deep hover:from-plum-600 hover:to-violet-electric text-white text-xs font-bold transition-all shadow-md flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export Report (CSV)</span>
          </button>
        </div>

        {/* 6 Summary Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="p-4 rounded-xl bg-charcoal-900 border border-plum-border/60">
            <span className="text-[11px] font-medium text-slate-400 block uppercase">Total Applications</span>
            <span className="text-2xl font-mono font-bold text-white mt-1 block">
              {metrics.total_applications}
            </span>
          </div>
          <div className="p-4 rounded-xl bg-charcoal-900 border border-plum-border/60">
            <span className="text-[11px] font-medium text-slate-400 block uppercase">Fraud Alerts</span>
            <span className="text-2xl font-mono font-bold text-coral-vibrant mt-1 block">
              {metrics.fraud_alerts}
            </span>
          </div>
          <div className="p-4 rounded-xl bg-charcoal-900 border border-plum-border/60">
            <span className="text-[11px] font-medium text-slate-400 block uppercase">Document Alerts</span>
            <span className="text-2xl font-mono font-bold text-amber-warm mt-1 block">
              {metrics.document_alerts}
            </span>
          </div>
          <div className="p-4 rounded-xl bg-charcoal-900 border border-plum-border/60">
            <span className="text-[11px] font-medium text-slate-400 block uppercase">KYC Alerts</span>
            <span className="text-2xl font-mono font-bold text-coral-dark mt-1 block">
              {metrics.kyc_alerts}
            </span>
          </div>
          <div className="p-4 rounded-xl bg-charcoal-900 border border-plum-border/60">
            <span className="text-[11px] font-medium text-slate-400 block uppercase">Network Alerts</span>
            <span className="text-2xl font-mono font-bold text-violet-electric mt-1 block">
              {metrics.network_alerts}
            </span>
          </div>
          <div className="p-4 rounded-xl bg-charcoal-900 border border-plum-border/60">
            <span className="text-[11px] font-medium text-slate-400 block uppercase">Ledger Pass Rate</span>
            <span className="text-2xl font-mono font-bold text-mint-fresh mt-1 block">
              {metrics.verification_success_rate}
            </span>
          </div>
        </div>

        {/* Visual Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Bar Chart: Forensic Layer Breakdown (7 cols) */}
          <div className="lg:col-span-7 bg-charcoal-900 border border-plum-border/70 rounded-xl p-6 shadow-lg">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-6">
              Fraud Detection Layer Distribution
            </h4>
            {alertsByLayer.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-xs text-slate-500 font-mono">
                No alert distributions detected yet
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={alertsByLayer}>
                    <XAxis dataKey="layer" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1E1428',
                        borderColor: '#462758',
                        borderRadius: '8px',
                        fontSize: '11px',
                        color: '#FFF',
                      }}
                    />
                    <Bar dataKey="count" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Donut Chart: Application Outcomes (5 cols) */}
          <div className="lg:col-span-5 bg-charcoal-900 border border-plum-border/70 rounded-xl p-6 shadow-lg flex flex-col justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Portfolio Resolution Status
            </h4>
            <div className="h-56 flex items-center justify-center">
              {metrics.total_applications === 0 ? (
                <div className="text-xs text-slate-500 font-mono text-center">
                  Awaiting loan application submissions
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={applicationOutcomes}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {applicationOutcomes.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1E1428',
                        borderColor: '#462758',
                        borderRadius: '8px',
                        fontSize: '11px',
                        color: '#FFF',
                      }}
                    />
                  </RePieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Legend */}
            <div className="grid grid-cols-1 gap-2 pt-4 border-t border-plum-border/60">
              {applicationOutcomes.map((outcome: any) => (
                <div key={outcome.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: outcome.color }}></span>
                    <span className="text-slate-300">{outcome.name}</span>
                  </div>
                  <span className="font-mono text-white font-semibold">{outcome.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
};
