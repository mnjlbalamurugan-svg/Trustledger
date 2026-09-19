import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Share2,
  AlertTriangle,
  ShieldCheck,
  Smartphone,
  CreditCard,
  User,
  Wifi,
  Eye,
  Info,
  Layers,
  ArrowRight,
  Plus
} from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { api } from '../services/api';
import { NetworkGraphData, NetworkNode, NetworkEdge } from '../types';

export const FraudNetworkPage: React.FC = () => {
  const navigate = useNavigate();
  const [graphData, setGraphData] = useState<NetworkGraphData | null>(null);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGraph = async () => {
      try {
        setLoading(true);
        const data = await api.getNetworkGraph();
        setGraphData(data);
        if (data && data.nodes && data.nodes.length > 0) {
          const central = data.nodes.find((n: NetworkNode) => n.is_central) || data.nodes[0];
          setSelectedNode(central);
        }
      } catch (err) {
        console.error('Failed to load fraud network:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchGraph();
  }, []);

  const getNodePosition = (index: number, total: number) => {
    if (total <= 1) return { x: 300, y: 210 };
    if (index === 0) return { x: 300, y: 210 };
    const angle = ((index - 1) / (total - 1)) * 2 * Math.PI - Math.PI / 2;
    const radius = 130;
    return {
      x: Math.round(300 + radius * Math.cos(angle)),
      y: Math.round(210 + radius * Math.sin(angle)),
    };
  };

  const getEdgeDetails = (edge: NetworkEdge) => {
    if (edge.relationship.includes('Device') || edge.relationship.includes('Phone')) return { icon: Smartphone, color: '#F05A5A' };
    if (edge.relationship.includes('Bank') || edge.relationship.includes('Disbursement')) return { icon: CreditCard, color: '#F05A5A' };
    if (edge.relationship.includes('Identity') || edge.relationship.includes('PAN')) return { icon: User, color: '#F4A340' };
    return { icon: Wifi, color: '#8B5CF6' };
  };

  const nodes = graphData?.nodes || [];
  const edges = graphData?.edges || [];
  const hasLinks = edges.length > 0;

  return (
    <AppShell
      title="Fraud Network Intelligence"
      subtitle="Identify relationships and synthetic identity rings hidden across lending applications."
    >
      <div className="space-y-6">
        {/* Network Risk Summary Header */}
        <div className="bg-charcoal-900 border border-plum-border/70 rounded-xl p-5 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className={`w-12 h-12 rounded-xl bg-plum-800 border flex items-center justify-center flex-shrink-0 ${
              hasLinks ? 'border-coral-vibrant/40 text-coral-vibrant' : 'border-mint-fresh/40 text-mint-fresh'
            }`}>
              <Share2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white">
                  {hasLinks ? 'Coordinated Entity Linkages Detected' : 'Entity Identity Graph'}
                </h3>
                <span className={`px-2 py-0.5 rounded font-mono text-xs font-bold ${
                  hasLinks
                    ? 'bg-coral-subtle text-coral-vibrant border border-coral-vibrant/30'
                    : 'bg-mint-subtle text-mint-fresh border border-mint-fresh/30'
                }`}>
                  Network Status: {hasLinks ? 'LINKED CLUSTERS' : 'CLEAN'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {hasLinks
                  ? 'Multi-application graph analysis identified shared banking, contact numbers, or PAN identifiers.'
                  : 'Continuous cross-referencing evaluates banking, contact numbers, and government IDs.'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-6 text-xs font-mono">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Mapped Nodes</span>
              <span className="text-base font-bold text-white">{nodes.length} Applications</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Active Fraud Edges</span>
              <span className={`text-base font-bold ${hasLinks ? 'text-coral-vibrant' : 'text-mint-fresh'}`}>
                {edges.length} Shared Vectors
              </span>
            </div>
          </div>
        </div>

        {nodes.length === 0 && !loading ? (
          <div className="bg-charcoal-900 border border-plum-border/70 rounded-xl p-12 text-center shadow-lg">
            <div className="w-16 h-16 rounded-2xl bg-plum-800/80 border border-plum-border flex items-center justify-center mx-auto mb-4 text-violet-electric">
              <Share2 className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">No fraud relationships detected yet</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mb-6 leading-relaxed">
              No cross-application linkages detected in your account. As you create loan applications sharing common bank account numbers, phone contacts, or PAN cards, TrustLedger will dynamically visualize their fraud cluster here.
            </p>
            <button
              type="button"
              onClick={() => navigate('/applications')}
              className="px-5 py-2.5 bg-gradient-to-r from-violet-deep to-plum-700 hover:from-violet-electric hover:to-plum-600 text-white text-xs font-bold rounded-xl shadow-lg transition-all inline-flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Go to Applications</span>
            </button>
          </div>
        ) : (
          /* Main Interactive Graph & Inspector Split */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Graph Visualizer Canvas (8 cols) */}
            <div className="lg:col-span-8 bg-charcoal-900 border border-plum-border/70 rounded-xl p-6 shadow-lg relative flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Interactive Entity Relational Map
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-plum-800 text-slate-300">
                  Click node to inspect dossier
                </span>
              </div>

              {/* SVG Canvas */}
              <div className="w-full flex items-center justify-center py-4">
                <svg viewBox="0 0 600 420" className="w-full h-auto max-w-[600px]">
                  {/* Edges */}
                  {edges.map((edge, idx) => {
                    const srcIndex = nodes.findIndex((n) => n.id === edge.source);
                    const tgtIndex = nodes.findIndex((n) => n.id === edge.target);
                    const p1 = getNodePosition(srcIndex >= 0 ? srcIndex : 0, nodes.length);
                    const p2 = getNodePosition(tgtIndex >= 0 ? tgtIndex : 1, nodes.length);
                    const edgeInfo = getEdgeDetails(edge);

                    return (
                      <g key={idx}>
                        <line
                          x1={p1.x}
                          y1={p1.y}
                          x2={p2.x}
                          y2={p2.y}
                          stroke={edgeInfo.color}
                          strokeWidth="2.5"
                          strokeDasharray="4 3"
                          opacity="0.85"
                        />
                        {/* Edge midpoint badge */}
                        <circle cx={(p1.x + p2.x) / 2} cy={(p1.y + p2.y) / 2} r="8" fill="#17151C" stroke={edgeInfo.color} strokeWidth="1.5" />
                      </g>
                    );
                  })}

                  {/* Nodes */}
                  {nodes.map((node, idx) => {
                    const pos = getNodePosition(idx, nodes.length);
                    const isSelected = selectedNode?.id === node.id;
                    const isCentral = node.is_central;

                    return (
                      <g
                        key={node.id}
                        transform={`translate(${pos.x}, ${pos.y})`}
                        onClick={() => setSelectedNode(node)}
                        className="cursor-pointer group"
                      >
                        {/* Glow ring */}
                        <circle
                          r={isCentral ? 38 : 30}
                          fill={isCentral ? 'rgba(139, 92, 246, 0.15)' : 'rgba(36, 19, 47, 0.4)'}
                          stroke={isSelected ? '#8B5CF6' : isCentral ? '#F05A5A' : '#462758'}
                          strokeWidth={isSelected ? 3 : 2}
                          className="transition-all duration-300 group-hover:scale-105"
                        />
                        {/* Main circle */}
                        <circle
                          r={isCentral ? 28 : 22}
                          fill={node.risk_level === 'CRITICAL' || node.risk_level === 'HIGH' ? '#2A1018' : '#1A1828'}
                          stroke={node.risk_level === 'CRITICAL' || node.risk_level === 'HIGH' ? '#F05A5A' : '#62D6A7'}
                          strokeWidth="2"
                        />
                        {/* Label inside node */}
                        <text
                          textAnchor="middle"
                          dy="-2"
                          fill="#FFFFFF"
                          fontSize={isCentral ? '10' : '9'}
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          {node.label}
                        </text>
                        <text
                          textAnchor="middle"
                          dy="10"
                          fill={node.risk_level === 'CRITICAL' || node.risk_level === 'HIGH' ? '#F05A5A' : '#62D6A7'}
                          fontSize="8"
                          fontFamily="monospace"
                        >
                          {node.risk_score}
                        </text>

                        {/* Name banner below */}
                        <text
                          textAnchor="middle"
                          dy={isCentral ? 48 : 40}
                          fill="#E2E8F0"
                          fontSize="10"
                          fontWeight="500"
                        >
                          {node.applicant_name}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Canvas Footer Legend */}
              <div className="pt-4 border-t border-plum-border/60 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-coral-vibrant"></span>
                    <span>High / Critical Risk</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-mint-fresh"></span>
                    <span>Cleared / Low Risk</span>
                  </div>
                </div>
                <div className="font-mono text-[10px] text-violet-electric">
                  Multi-Signal Graph Correlation
                </div>
              </div>
            </div>

            {/* Node Detail Inspector (4 cols) */}
            <div className="lg:col-span-4 bg-charcoal-900 border border-plum-border/70 rounded-xl p-6 shadow-lg flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center justify-between">
                  <span>Selected Node Dossier</span>
                  {selectedNode && (
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      selectedNode.risk_level === 'CRITICAL' || selectedNode.risk_level === 'HIGH'
                        ? 'bg-coral-subtle text-coral-vibrant'
                        : 'bg-mint-subtle text-mint-fresh'
                    }`}>
                      {selectedNode.risk_level}
                    </span>
                  )}
                </h4>

                {selectedNode ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-charcoal-850 border border-plum-border/60">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-white font-mono">{selectedNode.label}</span>
                        <span className="text-xs font-mono font-bold text-coral-vibrant">Score: {selectedNode.risk_score}</span>
                      </div>
                      <div className="text-xs text-slate-200 mt-1 font-semibold">{selectedNode.applicant_name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{selectedNode.loan_amount || '₹500,000 requested'}</div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[11px] text-slate-400 font-semibold uppercase block">Shared Linkage Vectors</span>
                      {(selectedNode as any).shared_identifiers && (selectedNode as any).shared_identifiers.length > 0 ? (
                        <div className="space-y-1.5">
                          {((selectedNode as any).shared_identifiers as any[]).map((ident: any, i: number) => (
                            <div key={i} className="p-2.5 rounded-lg bg-charcoal-850 border border-coral-vibrant/30 flex items-center justify-between text-xs">
                              <span className="text-slate-300">{ident.type}</span>
                              <span className="font-mono text-coral-vibrant text-[11px]">{ident.value}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-3 rounded-lg bg-charcoal-850 border border-charcoal-border text-center text-xs text-slate-400">
                          No shared identifiers detected
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-xs text-slate-500">
                    Select a node in the graph to inspect shared vectors
                  </div>
                )}
              </div>

              {selectedNode && (
                <div className="mt-6 pt-4 border-t border-plum-border/60">
                  <button
                    type="button"
                    onClick={() => navigate(`/applications?target=${selectedNode.label}`)}
                    className="w-full py-2.5 rounded-xl bg-plum-800 hover:bg-plum-700 text-white text-xs font-bold transition-all flex items-center justify-center space-x-1.5"
                  >
                    <span>Investigate Application Dossier</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
};
