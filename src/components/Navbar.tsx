import React from 'react';
import { 
  BarChart3, 
  Calculator, 
  FileText, 
  Settings, 
  Plus, 
  RefreshCw, 
  UserCheck
} from 'lucide-react';
import { ClientBrandConfig } from '../types/cleanCommand';

export type SystemViewMode = 'sales' | 'estimator' | 'proposal' | 'settings';

interface NavbarProps {
  currentView: 'sales' | 'estimator' | 'proposal';
  onNavigate: (view: 'sales' | 'estimator' | 'proposal') => void;
  brandConfig: ClientBrandConfig;
  onOpenNewLeadModal?: () => void;
  onOpenSettingsModal?: () => void;
  onSyncFromGoogleSheets?: () => void;
  isSyncing?: boolean;
  leadCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  brandConfig,
  onOpenNewLeadModal,
  onOpenSettingsModal,
  onSyncFromGoogleSheets,
  isSyncing = false,
  leadCount = 0
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Left: Brand Identity & Software Suite Title */}
        <div 
          onClick={() => onNavigate('sales')}
          className="flex items-center gap-3 cursor-pointer select-none group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-slate-900 text-white flex items-center justify-center font-extrabold text-base shadow-sm group-hover:scale-105 transition-transform">
            {brandConfig.companyName ? brandConfig.companyName.charAt(0) : 'A'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900 text-base tracking-tight block leading-tight">
                {brandConfig.companyName}
              </span>
              <span className="hidden sm:inline-block font-mono text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wider">
                Enterprise OS
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
              <span>Commercial Bidding &amp; Operations</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-600 font-semibold">{brandConfig.primaryCity}</span>
            </span>
          </div>
        </div>

        {/* Center: System Modules Switcher */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100/90 border border-slate-200/90 rounded-2xl p-1 text-xs">
          <button
            type="button"
            onClick={() => onNavigate('sales')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all duration-150 cursor-pointer flex items-center gap-1.5 ${
              currentView === 'sales'
                ? 'bg-white text-blue-700 shadow-xs font-bold border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
            <span>Pipeline CRM</span>
            {leadCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-blue-100 text-blue-700">
                {leadCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => onNavigate('estimator')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all duration-150 cursor-pointer flex items-center gap-1.5 ${
              currentView === 'estimator'
                ? 'bg-white text-blue-700 shadow-xs font-bold border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Calculator className="w-3.5 h-3.5 text-blue-600" />
            <span>Bidding Estimator</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('proposal')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all duration-150 cursor-pointer flex items-center gap-1.5 ${
              currentView === 'proposal'
                ? 'bg-white text-blue-700 shadow-xs font-bold border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            <span>Proposal Studio</span>
          </button>

          {onOpenSettingsModal && (
            <button
              type="button"
              onClick={onOpenSettingsModal}
              title="System Configuration"
              className="px-2.5 py-1.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-white/60 transition-colors cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          )}
        </nav>

        {/* Right: Live Google Sheet Sync & Quick Actions */}
        <div className="flex items-center gap-2.5">
          {/* Live Google Sheet Status */}
          {onSyncFromGoogleSheets && (
            <button
              type="button"
              onClick={onSyncFromGoogleSheets}
              disabled={isSyncing}
              title="Sync latest rows from Google Sheets"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200/90 text-slate-700 text-xs font-semibold transition-all cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-3 h-3 text-blue-600 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="text-[11px] font-bold">
                {isSyncing ? 'Syncing...' : 'Sheet Active'}
              </span>
            </button>
          )}

          {/* New Lead CTA */}
          {onOpenNewLeadModal && (
            <button
              type="button"
              onClick={onOpenNewLeadModal}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>+ New Lead</span>
            </button>
          )}

          {/* Operator Profile Pill */}
          <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
              <UserCheck className="w-4 h-4 text-slate-500" />
            </div>
            <div className="text-left">
              <span className="block text-[11px] font-bold text-slate-800 leading-tight">
                Estimator
              </span>
              <span className="block text-[9px] text-emerald-600 font-semibold leading-tight flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                Online
              </span>
            </div>
          </div>
        </div>

      </div>
    </header>
  );
};
