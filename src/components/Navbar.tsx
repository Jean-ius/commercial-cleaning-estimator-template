import React, { useState } from 'react';
import { 
  BarChart3, 
  Calculator, 
  FileText, 
  Settings, 
  Plus, 
  RefreshCw, 
  UserCheck,
  Menu,
  X,
  ChevronRight
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleMobileNav = (view: 'sales' | 'estimator' | 'proposal') => {
    onNavigate(view);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs transition-all duration-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Left: Brand Identity & Software Suite Title */}
        <div 
          onClick={() => {
            onNavigate('sales');
            setIsMobileMenuOpen(false);
          }}
          className="flex items-center gap-2 sm:gap-3 cursor-pointer select-none group min-w-0"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-slate-900 text-white flex items-center justify-center font-extrabold text-sm sm:text-base shadow-sm group-hover:scale-105 transition-transform shrink-0">
            {brandConfig.companyName ? brandConfig.companyName.charAt(0) : 'A'}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-extrabold text-slate-900 text-sm sm:text-base tracking-tight block leading-tight truncate max-w-[130px] xs:max-w-[180px] sm:max-w-none">
                {brandConfig.companyName}
              </span>
              <span className="hidden sm:inline-block font-mono text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wider shrink-0">
                Enterprise OS
              </span>
            </div>
            <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium flex items-center gap-1 mt-0.5 truncate">
              <span className="truncate">Commercial Estimating</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-600 font-semibold shrink-0">{brandConfig.primaryCity}</span>
            </span>
          </div>
        </div>

        {/* Center: System Modules Switcher (Desktop) */}
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

        {/* Right: Actions & Mobile Menu Button */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Live Google Sheet Status (Desktop) */}
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

          {/* New Lead CTA Button */}
          {onOpenNewLeadModal && (
            <button
              type="button"
              onClick={onOpenNewLeadModal}
              className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center gap-1 sm:gap-1.5 min-h-[38px]"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>+ New Lead</span>
            </button>
          )}

          {/* Operator Profile Pill (Large desktop only) */}
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

          {/* Mobile Menu Toggle Button (Visible on screens < md) */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer border border-slate-200/80"
            aria-label="Toggle navigation menu"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? (
              <X className="w-4 h-4 text-slate-900" />
            ) : (
              <Menu className="w-4 h-4 text-slate-700" />
            )}
          </button>
        </div>

      </div>

      {/* Mobile Responsive Navigation Drawer / Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200/90 bg-white shadow-xl animate-fade-in">
          <div className="px-4 py-3 space-y-1.5">
            <button
              type="button"
              onClick={() => handleMobileNav('sales')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                currentView === 'sales'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <span>Pipeline CRM &amp; Leads</span>
              </div>
              {leadCount > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-100 text-blue-700">
                  {leadCount} leads
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleMobileNav('estimator')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                currentView === 'estimator'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Calculator className="w-4 h-4 text-blue-600" />
                <span>Bidding Estimator</span>
              </div>
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                ISSA 540
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleMobileNav('proposal')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                currentView === 'proposal'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-purple-600" />
                <span>Proposal Studio</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {onOpenSettingsModal && (
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenSettingsModal();
                }}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Settings className="w-4 h-4 text-slate-500" />
                  <span>System Settings &amp; Company Profile</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            )}

            {/* Mobile Sheet Sync & Status */}
            {onSyncFromGoogleSheets && (
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    onSyncFromGoogleSheets();
                    setIsMobileMenuOpen(false);
                  }}
                  disabled={isSyncing}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-60"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Syncing Google Sheets...' : 'Sync Google Sheets Now'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

