import React from 'react';
import { ShieldCheck, Database } from 'lucide-react';
import { ClientBrandConfig } from '../types/cleanCommand';

interface FooterProps {
  brandConfig: ClientBrandConfig;
  onNavigate?: (view: any) => void;
}

export const Footer: React.FC<FooterProps> = ({ brandConfig }) => {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 text-xs py-4 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
        {/* Left: System Version & Brand Identity */}
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
          <span className="font-bold text-slate-200 tracking-tight">CleanCommand™ OS v2.4 Enterprise</span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-300 font-semibold">{brandConfig.companyName}</span>
          <span className="text-slate-500 hidden md:inline">Operations Portal</span>
        </div>

        {/* Right: Security & Industry Standards */}
        <div className="flex items-center gap-3 text-slate-400">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>ISSA 540 Certified Standard</span>
          </span>
          <span className="text-slate-700 hidden sm:inline">•</span>
          <span className="hidden sm:flex items-center gap-1">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>Google Sheets Live Persistence</span>
          </span>
          <span className="text-slate-700 hidden sm:inline">•</span>
          <span className="font-mono text-emerald-400 font-bold">100% Operational</span>
        </div>
      </div>
    </footer>
  );
};
