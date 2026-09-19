import React from 'react';

interface RiskMeterProps {
  score: number;
  level?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  size?: 'sm' | 'md' | 'lg';
  showBands?: boolean;
}

export const RiskMeter: React.FC<RiskMeterProps> = ({
  score,
  level,
  size = 'md',
  showBands = true,
}) => {
  // Determine level if not provided
  let computedLevel = level;
  if (!computedLevel) {
    if (score < 30) computedLevel = 'LOW';
    else if (score < 60) computedLevel = 'MEDIUM';
    else if (score < 80) computedLevel = 'HIGH';
    else computedLevel = 'CRITICAL';
  }

  // Semantic color selection
  const getColor = () => {
    switch (computedLevel) {
      case 'LOW':
        return {
          text: 'text-mint-fresh',
          bg: 'bg-mint-fresh',
          border: 'border-mint-fresh/30',
          badgeBg: 'bg-mint-subtle',
          label: 'LOW',
        };
      case 'MEDIUM':
        return {
          text: 'text-amber-warm',
          bg: 'bg-amber-warm',
          border: 'border-amber-warm/30',
          badgeBg: 'bg-amber-subtle',
          label: 'MEDIUM',
        };
      case 'HIGH':
        return {
          text: 'text-coral-vibrant',
          bg: 'bg-coral-vibrant',
          border: 'border-coral-vibrant/30',
          badgeBg: 'bg-coral-subtle',
          label: 'HIGH',
        };
      case 'CRITICAL':
      default:
        return {
          text: 'text-coral-dark',
          bg: 'bg-coral-dark',
          border: 'border-coral-dark/40',
          badgeBg: 'bg-coral-subtle',
          label: 'CRITICAL',
        };
    }
  };

  const style = getColor();

  // Segmented 4-segment calculation
  // Segments: 0-29 (Low), 30-59 (Medium), 60-79 (High), 80-100 (Critical)
  const segments = [
    { name: 'LOW', range: '0-29', active: score > 0, activeColor: 'bg-mint-fresh' },
    { name: 'MEDIUM', range: '30-59', active: score >= 30, activeColor: 'bg-amber-warm' },
    { name: 'HIGH', range: '60-79', active: score >= 60, activeColor: 'bg-coral-vibrant' },
    { name: 'CRITICAL', range: '80-100', active: score >= 80, activeColor: 'bg-coral-dark' },
  ];

  if (size === 'sm') {
    return (
      <div className="flex items-center space-x-2">
        <span className={`font-mono font-bold text-sm ${style.text}`}>{score}/100</span>
        <span className={`text-xs px-2 py-0.5 rounded font-semibold tracking-wider ${style.badgeBg} ${style.text} border ${style.border}`}>
          {style.label}
        </span>
      </div>
    );
  }

  return (
    <div className="bg-charcoal-900 border border-plum-border/50 rounded-xl p-5 shadow-lg">
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Risk Assessment
          </span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className={`text-3xl font-mono font-bold tracking-tight ${style.text}`}>
              {score}
            </span>
            <span className="text-slate-500 font-mono text-lg">/ 100</span>
          </div>
        </div>
        <div className="text-right">
          <span className={`inline-block px-3 py-1 rounded-md text-xs font-bold tracking-wider uppercase border ${style.badgeBg} ${style.text} ${style.border}`}>
            {style.label}
          </span>
          <div className="text-[10px] text-slate-400 font-mono mt-1">Prototype Risk Score</div>
        </div>
      </div>

      {showBands && (
        <div className="space-y-1.5 mt-4">
          <div className="grid grid-cols-4 gap-1.5 h-3">
            {segments.map((seg, idx) => (
              <div
                key={idx}
                className={`rounded-sm transition-all duration-300 ${
                  seg.active ? seg.activeColor : 'bg-charcoal-750 opacity-40'
                }`}
                title={`${seg.name} (${seg.range})`}
              />
            ))}
          </div>
          <div className="flex justify-between text-[10px] font-mono text-slate-400 pt-1">
            <span>0 LOW</span>
            <span>30 MED</span>
            <span>60 HIGH</span>
            <span>80+ CRIT</span>
          </div>
        </div>
      )}
    </div>
  );
};
