import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Shield, Plus, Database } from 'lucide-react';
import { NewApplicationModal } from '../applications/NewApplicationModal';

interface TopBarProps {
  title: string;
  subtitle?: string;
  onApplicationCreated?: (app: any) => void;
}

export const TopBar: React.FC<TopBarProps> = ({ title, subtitle, onApplicationCreated }) => {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);

  const handleCreated = (app: any) => {
    if (onApplicationCreated) {
      onApplicationCreated(app);
    } else {
      navigate('/applications');
    }
  };

  return (
    <>
      <header className="h-16 bg-charcoal-900/90 border-b border-charcoal-border px-8 flex items-center justify-between sticky top-0 z-20 backdrop-blur-md">
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {/* + New Application Button */}
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center space-x-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-plum-700 to-violet-deep hover:from-plum-600 hover:to-violet-electric text-xs text-white font-bold transition-all shadow-md"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Application</span>
          </button>

          {/* Security status badges */}
          <div className="hidden lg:flex items-center space-x-2 font-mono text-[11px] text-slate-300">
            <div className="flex items-center space-x-1.5 px-2 py-1 rounded bg-charcoal-850 border border-charcoal-border">
              <Database className="w-3 h-3 text-mint-fresh" />
              <span>Ledger: SHA-256</span>
            </div>
            <div className="flex items-center space-x-1.5 px-2 py-1 rounded bg-charcoal-850 border border-charcoal-border">
              <Shield className="w-3 h-3 text-violet-electric" />
              <span>Tenant Isolated</span>
            </div>
          </div>

          {/* Alerts Bell */}
          <button
            onClick={() => navigate('/alerts')}
            className="p-2 rounded-lg bg-charcoal-850 hover:bg-charcoal-800 text-slate-300 hover:text-white border border-charcoal-border transition-colors"
            title="Threat Alerts"
          >
            <Bell className="w-4 h-4" />
          </button>
        </div>
      </header>

      <NewApplicationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onApplicationCreated={handleCreated}
      />
    </>
  );
};
