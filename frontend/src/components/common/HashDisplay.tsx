import React, { useState } from 'react';
import { Copy, Check, Hash } from 'lucide-react';

interface HashDisplayProps {
  hash: string;
  truncate?: boolean;
  label?: string;
  size?: 'sm' | 'md';
}

export const HashDisplay: React.FC<HashDisplayProps> = ({
  hash,
  truncate = true,
  label,
  size = 'md',
}) => {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(!truncate);

  const displayHash = expanded
    ? hash
    : `${hash.slice(0, 8)}...${hash.slice(-6)}`;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="inline-flex items-center space-x-2 bg-charcoal-950/80 border border-plum-border/60 px-2.5 py-1 rounded-md font-mono text-xs text-violet-electric">
      {label && <span className="text-slate-400 font-sans text-[11px] font-medium">{label}:</span>}
      <Hash className="w-3.5 h-3.5 text-violet-electric/70 flex-shrink-0" />
      <span
        onClick={() => setExpanded(!expanded)}
        className="cursor-pointer hover:text-white transition-colors select-all"
        title="Click to toggle full SHA-256 string"
      >
        {displayHash}
      </span>
      <button
        onClick={handleCopy}
        className="text-slate-400 hover:text-mint-fresh transition-colors p-0.5 rounded"
        title="Copy full SHA-256"
      >
        {copied ? (
          <Check className="w-3.5 h-3.5 text-mint-fresh" />
        ) : (
          <Copy className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
  );
};
