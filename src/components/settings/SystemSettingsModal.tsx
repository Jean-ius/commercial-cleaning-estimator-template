import React, { useState } from 'react';
import { 
  X, 
  Settings, 
  Building2, 
  Link, 
  Phone, 
  Mail, 
  MapPin, 
  ShieldCheck, 
  Save, 
  RotateCcw,
  CheckCircle2
} from 'lucide-react';
import { ClientBrandConfig } from '../../types/cleanCommand';
import { defaultClientBrand } from '../../config/clientConfig';

interface SystemSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  brandConfig: ClientBrandConfig;
  onSaveConfig: (updated: ClientBrandConfig) => void;
}

export const SystemSettingsModal: React.FC<SystemSettingsModalProps> = ({
  isOpen,
  onClose,
  brandConfig,
  onSaveConfig
}) => {
  const [formData, setFormData] = useState<ClientBrandConfig>({ ...brandConfig });
  const [activeTab, setActiveTab] = useState<'profile' | 'operations' | 'integration'>('profile');
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleChange = (field: keyof ClientBrandConfig, val: any) => {
    setFormData(prev => ({ ...prev, [field]: val }));
    setSavedSuccess(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset all branding and operations settings to default template values?')) {
      setFormData({ ...defaultClientBrand });
      setSavedSuccess(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl sm:rounded-3xl max-w-2xl w-full p-4 sm:p-7 shadow-2xl border border-slate-200 relative max-h-[94vh] sm:max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 sm:pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-xl font-extrabold text-slate-900 tracking-tight leading-snug">
                System &amp; Operations Settings
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500">
                Configure your commercial janitorial company identity, rates, and integrations.
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="text-slate-400 hover:text-slate-600 p-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation (Horizontally scrollable on mobile) */}
        <div className="flex items-center gap-1 border-b border-slate-200 pt-2.5 pb-2 overflow-x-auto mobile-scroll-container">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer min-h-[36px] ${
              activeTab === 'profile' 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Company Profile
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('operations')}
            className={`px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer min-h-[36px] ${
              activeTab === 'operations' 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Legal &amp; Proposals
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('integration')}
            className={`px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer min-h-[36px] ${
              activeTab === 'integration' 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Google Sheets Sync
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto space-y-4 py-3 sm:py-4 pr-1">
          {activeTab === 'profile' && (
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Company / Organization Name</label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => handleChange('companyName', e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2 text-base sm:text-xs bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
                    placeholder="e.g., Apex Commercial Cleaning"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Dispatch Phone</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-base sm:text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
                      placeholder="(555) 000-0000"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Dispatch / Contracts Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-base sm:text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
                      placeholder="contracts@company.com"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Headquarters Address</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => handleChange('address', e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-base sm:text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
                      placeholder="123 Business Parkway, Suite 100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Primary Metro Area / City</label>
                  <input
                    type="text"
                    value={formData.primaryCity}
                    onChange={(e) => handleChange('primaryCity', e.target.value)}
                    className="w-full px-3 py-2 text-base sm:text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
                    placeholder="e.g., Dallas-Fort Worth Metro"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Company Tagline / Subtitle</label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => handleChange('tagline', e.target.value)}
                  className="w-full px-3 py-2 text-base sm:text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
                  placeholder="Enterprise Facilities & Commercial Janitorial Services"
                />
              </div>
            </div>
          )}

          {activeTab === 'operations' && (
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Commercial General Liability Insurance</label>
                <div className="relative">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={formData.insuranceCoverage}
                    onChange={(e) => handleChange('insuranceCoverage', e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-base sm:text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
                    placeholder="$2,000,000 Commercial General Liability & Full Bond"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">State License / Registration #</label>
                <input
                  type="text"
                  value={formData.licenseNumber}
                  onChange={(e) => handleChange('licenseNumber', e.target.value)}
                  className="w-full px-3 py-2 text-base sm:text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
                  placeholder="TX-JAN-2024-98421"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Quality SLA Commitment (Appears on Proposals)</label>
                <input
                  type="text"
                  value={formData.qualitySla || ''}
                  onChange={(e) => handleChange('qualitySla', e.target.value)}
                  className="w-full px-3 py-2 text-base sm:text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
                  placeholder="4-hour prompt re-clean response at zero added charge if any area is unsatisfactory."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Standard Payment Terms (Appears on Proposals)</label>
                <textarea
                  value={formData.paymentTerms || ''}
                  onChange={(e) => handleChange('paymentTerms', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 text-base sm:text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600 resize-none"
                  placeholder="Invoiced monthly on Net-30 terms. 12-month standard term with 30-day mutual flexibility."
                />
              </div>
            </div>
          )}

          {activeTab === 'integration' && (
            <div className="space-y-3.5">
              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-800">
                  <Link className="w-4 h-4" />
                  <span>Google Apps Script Webhook Endpoint</span>
                </div>
                <p className="text-[11px] text-blue-700 mt-1 leading-relaxed">
                  Connect your Google Spreadsheet to store leads, sync bids, and preserve contract histories with zero database subscription costs.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Google Apps Script Web App URL</label>
                <input
                  type="url"
                  value={formData.googleAppsScriptUrl}
                  onChange={(e) => handleChange('googleAppsScriptUrl', e.target.value)}
                  required
                  className="w-full px-3 py-2 font-mono text-base sm:text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
                  placeholder="https://script.google.com/macros/s/.../exec"
                />
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="inline-flex items-center justify-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 font-semibold cursor-pointer py-2 sm:py-0 min-h-[38px] sm:min-h-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>

            <div className="flex items-center justify-end gap-2">
              {savedSuccess && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 animate-in fade-in mr-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Saved!
                </span>
              )}
              <button
                type="submit"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer min-h-[44px]"
              >
                <Save className="w-4 h-4" />
                <span>Save Configuration</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
