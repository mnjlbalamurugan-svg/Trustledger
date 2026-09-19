import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileSpreadsheet,
  FileSearch,
  Camera,
  Share2,
  Database,
  Bell,
  BarChart3,
  Settings,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { removeAuthToken, api } from '../../services/api';

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ name: string; organization_name?: string; email?: string } | null>(null);

  useEffect(() => {
    api.getMe()
      .then((data) => setUser(data))
      .catch(() => {});
  }, []);

  const handleLogout = () => {
    api.logout().catch(() => {});
    removeAuthToken();
    navigate('/login');
  };

  const navItems = [
    { label: 'Overview', to: '/dashboard', icon: LayoutDashboard },
    { label: 'Applications', to: '/applications', icon: FileSpreadsheet },
    { label: 'Document Analysis', to: '/documents', icon: FileSearch },
    { label: 'Photo & KYC', to: '/kyc', icon: Camera },
    { label: 'Fraud Network', to: '/network', icon: Share2 },
    { label: 'Verification Ledger', to: '/ledger', icon: Database },
    { label: 'Alerts', to: '/alerts', icon: Bell },
    { label: 'Reports', to: '/reports', icon: BarChart3 },
    { label: 'Settings', to: '/settings', icon: Settings },
  ];

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'TL';

  return (
    <aside className="w-64 bg-plum-900 border-r border-plum-border flex flex-col flex-shrink-0 min-h-screen select-none">
      {/* Brand header */}
      <div className="p-6 border-b border-plum-border/60">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-plum-800 border border-violet-electric/40 flex items-center justify-center shadow-inner">
            <ShieldCheck className="w-6 h-6 text-violet-electric" />
          </div>
          <div>
            <div className="font-bold text-lg tracking-wide text-white flex items-center gap-1.5">
              Trust<span className="text-violet-electric">Ledger</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono tracking-tight uppercase">
              Lending Security Intel
            </div>
          </div>
        </div>

        {/* Organization / Environment */}
        <div className="mt-4 px-2.5 py-1.5 rounded-lg bg-plum-950/80 border border-plum-border/80">
          <div className="text-[10px] uppercase font-mono text-slate-400">Workspace</div>
          <div className="text-xs font-semibold text-slate-200 truncate mt-0.5">
            {user?.organization_name || 'Enterprise Lending'}
          </div>
        </div>
      </div>

      {/* Navigation items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-mono text-slate-400 uppercase tracking-wider">
          Security Modules
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-plum-800 text-white border-l-4 border-l-violet-electric shadow-sm'
                    : 'text-slate-300 hover:bg-plum-850 hover:text-white'
                }`
              }
            >
              <div className="flex items-center space-x-3">
                <Icon className="w-4 h-4 text-slate-400" />
                <span>{item.label}</span>
              </div>
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom User Profile */}
      <div className="p-4 border-t border-plum-border/60 bg-plum-950/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-violet-deep text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
              {initials}
            </div>
            <div className="truncate">
              <div className="text-xs font-semibold text-slate-200 truncate">
                {user?.name || 'Authenticated User'}
              </div>
              <div className="text-[10px] text-slate-400 font-mono truncate">
                {user?.email || 'Logged In'}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 text-slate-400 hover:text-coral-vibrant hover:bg-plum-800 rounded-md transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
