import React from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

interface AppShellProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ title, subtitle, children }) => {
  return (
    <div className="flex h-screen bg-charcoal-900 text-slate-100 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar title={title} subtitle={subtitle} />
        <main className="flex-1 overflow-y-auto p-8 bg-charcoal-850">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
};
