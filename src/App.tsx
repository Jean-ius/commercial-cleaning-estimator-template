import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ClientBrandConfig, 
  EstimateResult, 
  LeadRecord, 
  LeadStatus,
  FacilitySectorId,
  FrequencyId,
  AddOnServiceId
} from './types/cleanCommand';
import { defaultClientBrand, facilitySectors } from './config/clientConfig';
import { calculateCommercialEstimate } from './utils/pricingEngine';
import { Navbar } from './components/Navbar';
import { CommercialProposalGenerator } from './components/proposal/CommercialProposalGenerator';
import { Toast } from './components/Toast';
import { Footer } from './components/Footer';
import { SalesDashboard } from './components/leads/SalesDashboard';
import { NewLeadModal } from './components/leads/NewLeadModal';
import { LeadDetailEditModal } from './components/leads/LeadDetailEditModal';
import { CommercialQuoteCalculator } from './components/calculator/CommercialQuoteCalculator';
import { SystemSettingsModal } from './components/settings/SystemSettingsModal';
import { Calculator } from 'lucide-react';
import { 
  loadLeadsFromGoogleSheets, 
  createLeadInGoogleSheets, 
  updateLeadInGoogleSheets,
  saveEstimateToGoogleSheets, 
  updateProposalInGoogleSheets, 
  updateStatusInGoogleSheets 
} from './services/googleSheetsService';

export type SystemView = 'sales' | 'estimator' | 'proposal';

function parseUrlState(): { view: SystemView; leadId: string | null } {
  if (typeof window === 'undefined') {
    return { view: 'sales', leadId: null };
  }
  try {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view')?.toLowerCase();
    const hash = window.location.hash.replace(/^#/, '').toLowerCase();
    const leadParam = params.get('lead') || params.get('leadId') || null;

    let view: SystemView = 'sales';
    if (viewParam === 'estimator' || hash === 'estimator') {
      view = 'estimator';
    } else if (viewParam === 'proposal' || hash === 'proposal') {
      view = 'proposal';
    } else if (viewParam === 'sales' || hash === 'sales') {
      view = 'sales';
    }

    return { view, leadId: leadParam };
  } catch {
    return { view: 'sales', leadId: null };
  }
}

export const App: React.FC = () => {
  // Brand Configuration with localStorage sync
  const [brandConfig, setBrandConfig] = useState<ClientBrandConfig>(() => {
    try {
      const saved = localStorage.getItem('cleancommand_brand_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.googleAppsScriptUrl || typeof parsed.googleAppsScriptUrl !== 'string' || parsed.googleAppsScriptUrl.trim() === '') {
          parsed.googleAppsScriptUrl = defaultClientBrand.googleAppsScriptUrl;
        }
        return { ...defaultClientBrand, ...parsed };
      }
    } catch (e) {
      console.warn('LocalStorage unavailable for brand config:', e);
    }
    return defaultClientBrand;
  });

  const handleUpdateBrand = (updated: ClientBrandConfig) => {
    setBrandConfig(updated);
    try {
      localStorage.setItem('cleancommand_brand_config', JSON.stringify(updated));
    } catch (e) {}
    triggerToast('System & company configuration saved!');
  };

  // Enterprise Software View Router: 'sales' (Pipeline CRM) | 'estimator' (Bidding Engine) | 'proposal' (Proposal Studio)
  const initialUrlState = parseUrlState();
  const [currentView, setCurrentView] = useState<SystemView>(initialUrlState.view);
  const initialLeadIdRef = useRef<string | null>(initialUrlState.leadId);

  // Leads CRM State: starts empty for clean product template, reloaded from Google Sheets or localStorage
  const [leads, setLeads] = useState<LeadRecord[]>(() => {
    try {
      const cached = localStorage.getItem('cleancommand_leads_cache');
      if (cached !== null) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });

  const [activeLead, setActiveLead] = useState<LeadRecord | null>(null);

  // Active Estimate for Standalone or Linked Estimating
  const [activeEstimate, setActiveEstimate] = useState<EstimateResult>(() => {
    return calculateCommercialEstimate(12500, 'corporate_office', 'business_5x', ['carpet_extraction']);
  });

  // Modal controls
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);
  const [isEditLeadModalOpen, setIsEditLeadModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [selectedLeadForEdit, setSelectedLeadForEdit] = useState<LeadRecord | null>(null);
  const [initialSpecsForNewLead, setInitialSpecsForNewLead] = useState<{
    squareFootage?: number;
    facilityType?: FacilitySectorId;
    cleaningFrequency?: FrequencyId;
    estimatedValue?: number;
    monthlyEstimate?: number;
    ratePerVisit?: number;
    selectedAddOns?: AddOnServiceId[];
    propertyType?: string;
    specialRequirements?: string;
    notes?: string;
    estimateSnapshot?: EstimateResult;
  } | undefined>(undefined);

  // Compute next guaranteed unique Lead ID across all existing leads (e.g., LD-2026-004)
  const generateNextLeadId = (): string => {
    const curYear = new Date().getFullYear();
    let maxSeq = 0;
    leads.forEach(l => {
      const match = String(l.leadId || '').match(/^LD-(\d{4})-(\d+)$/i);
      if (match) {
        const seq = parseInt(match[2], 10);
        if (seq > maxSeq) maxSeq = seq;
      }
    });
    return `LD-${curYear}-${String(maxSeq + 1).padStart(3, '0')}`;
  };

  // Toast feedback
  const [toastMsg, setToastMsg] = useState<string>('');
  const [toastVisible, setToastVisible] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3500);
  };

  // Load leads from Google Sheets on start / refresh
  useEffect(() => {
    let isMounted = true;
    async function initLeads() {
      setIsSyncing(true);
      try {
        const res = await loadLeadsFromGoogleSheets(brandConfig.googleAppsScriptUrl);
        if (isMounted) {
          if (res.mode === 'live') {
            // Google Sheets is authoritative source of truth
            setLeads(res.leads);
            if (res.leads.length === 0) {
              setActiveLead(null);
            } else if (!activeLead || !res.leads.some(l => l.leadId === activeLead.leadId)) {
              setActiveLead(res.leads[0]);
            }
          } else if (res.leads && res.leads.length > 0) {
            setLeads(res.leads);
            if (!activeLead) setActiveLead(res.leads[0]);
          }
        }
      } catch (err) {
        console.warn('Could not load remote leads:', err);
      } finally {
        if (isMounted) setIsSyncing(false);
      }
    }
    initLeads();
    return () => { isMounted = false; };
  }, [brandConfig.googleAppsScriptUrl]);

  // Manual trigger to pull latest sheet changes or deletions
  const handleSyncFromGoogleSheets = async () => {
    setIsSyncing(true);
    try {
      const res = await loadLeadsFromGoogleSheets(brandConfig.googleAppsScriptUrl);
      if (res.mode === 'live') {
        setLeads(res.leads);
        if (res.leads.length === 0) {
          setActiveLead(null);
        } else if (!activeLead || !res.leads.some(l => l.leadId === activeLead.leadId)) {
          setActiveLead(res.leads[0]);
        }
        triggerToast(`Google Sheets Synced: ${res.leads.length} active leads in pipeline`);
      } else {
        triggerToast('Could not reach Google Sheets. Offline cache active.');
      }
    } catch (err: any) {
      triggerToast('Sync error: ' + (err?.message || 'Check network connection'));
    } finally {
      setIsSyncing(false);
    }
  };

  // Lead Lifecycle Actions: BUG 2 ATOMIC SEQUENCE FOR SAVE TO NEW LEAD
  const handleCreateLead = async (newLead: LeadRecord) => {
    // 1. Validate Lead data
    if (!newLead.companyName?.trim() && !newLead.contactPerson?.trim()) {
      throw new Error('Please provide a Company Name or Contact Person.');
    }

    // 2. Write new Lead to Google Sheets first (Persistent Company Data Store)
    const createRes = await createLeadInGoogleSheets(newLead, brandConfig.googleAppsScriptUrl);
    if (!createRes.success) {
      throw new Error(createRes.error || 'Failed to create lead in Google Sheets.');
    }

    // 3. Confirm creation and obtain confirmed Lead ID
    const confirmedLeadId = createRes.leadId || newLead.leadId;

    // 3.5. If an estimate was attached, save estimate specifically with the confirmed Lead ID
    if (newLead.estimateSnapshot) {
      const finalAnnualVal = newLead.estimatedValue || newLead.annualContractValue || newLead.estimateSnapshot.annualContractValue;
      try {
        await saveEstimateToGoogleSheets(confirmedLeadId, {
          estimatedValue: finalAnnualVal,
          monthlyEstimate: newLead.monthlyEstimate || newLead.estimateSnapshot.totalEstimatedMonthlyInvestment,
          ratePerVisit: newLead.ratePerVisit || newLead.estimateSnapshot.pricePerVisit,
          annualContractValue: finalAnnualVal,
          estimatedLaborHours: newLead.estimateSnapshot.hoursPerCleaningVisit,
          recommendedCrewSize: newLead.estimateSnapshot.recommendedCrewSize,
          squareFootage: newLead.squareFootage,
          facilityType: newLead.facilityType,
          cleaningFrequency: newLead.cleaningFrequency,
          selectedAddOns: newLead.selectedAddOns,
          status: 'Estimating'
        }, brandConfig.googleAppsScriptUrl);
      } catch (estErr: any) {
        console.warn('Lead created but estimate save encountered warning:', estErr);
      }
    }

    // 4. Refresh full leads dataset from Google Sheets to confirm complete persistence
    let finalLead: LeadRecord = { ...newLead, leadId: confirmedLeadId };
    try {
      const fresh = await loadLeadsFromGoogleSheets(brandConfig.googleAppsScriptUrl);
      if (fresh.mode === 'live') {
        setLeads(fresh.leads);
        const reloaded = fresh.leads.find(l => l.leadId === confirmedLeadId);
        if (reloaded) {
          finalLead = { 
            ...reloaded, 
            estimatedValue: newLead.estimatedValue || reloaded.estimatedValue,
            annualContractValue: newLead.annualContractValue || reloaded.annualContractValue,
            estimateSnapshot: newLead.estimateSnapshot 
          };
        }
      } else {
        setLeads(prev => [finalLead, ...prev]);
      }
    } catch {
      setLeads(prev => [finalLead, ...prev]);
    }

    setActiveLead(finalLead);
    if (finalLead.estimateSnapshot) {
      setActiveEstimate(finalLead.estimateSnapshot);
    }
    triggerToast(`Created new lead ${confirmedLeadId} for ${finalLead.companyName} in Google Sheets!`);
  };

  const handleUpdateLead = async (updatedLead: LeadRecord) => {
    // 1. Send update to Google Sheets first
    await updateLeadInGoogleSheets(updatedLead, brandConfig.googleAppsScriptUrl);

    // 2. Only after Google Sheets write succeeds: refresh from Google Sheets
    try {
      const fresh = await loadLeadsFromGoogleSheets(brandConfig.googleAppsScriptUrl);
      if (fresh.mode === 'live') {
        setLeads(fresh.leads);
        const reloaded = fresh.leads.find(l => l.leadId === updatedLead.leadId);
        if (reloaded) {
          setActiveLead({ ...reloaded, estimateSnapshot: updatedLead.estimateSnapshot || activeEstimate });
        }
      } else {
        setLeads(prev => prev.map(l => l.leadId === updatedLead.leadId ? updatedLead : l));
        if (activeLead && activeLead.leadId === updatedLead.leadId) {
          setActiveLead(updatedLead);
        }
      }
    } catch {
      setLeads(prev => prev.map(l => l.leadId === updatedLead.leadId ? updatedLead : l));
      if (activeLead && activeLead.leadId === updatedLead.leadId) {
        setActiveLead(updatedLead);
      }
    }
    triggerToast(`Updated lead ${updatedLead.leadId} (${updatedLead.companyName}) in Google Sheets!`);
  };

  // BUG 1 ATOMIC SEQUENCE: Save estimate specifically to an existing lead by Lead ID
  const handleSaveEstimateToLead = async (
    targetLeadId: string,
    estimate: EstimateResult,
    facilitySpecs: {
      squareFootage: number;
      facilityType: FacilitySectorId;
      cleaningFrequency: FrequencyId;
      selectedAddOns: AddOnServiceId[];
    }
  ) => {
    const targetLead = leads.find(l => l.leadId === targetLeadId) || activeLead;
    if (!targetLead) {
      throw new Error(`Lead ${targetLeadId} could not be located in records.`);
    }

    try {
      // 1. Write estimate updates directly to Google Sheets matching targetLead.leadId
      await saveEstimateToGoogleSheets(targetLead.leadId, {
        estimatedValue: estimate.annualContractValue,
        monthlyEstimate: estimate.totalEstimatedMonthlyInvestment,
        ratePerVisit: estimate.pricePerVisit,
        annualContractValue: estimate.annualContractValue,
        estimatedLaborHours: estimate.hoursPerCleaningVisit,
        recommendedCrewSize: estimate.recommendedCrewSize,
        squareFootage: facilitySpecs.squareFootage,
        facilityType: facilitySpecs.facilityType,
        cleaningFrequency: facilitySpecs.cleaningFrequency,
        selectedAddOns: facilitySpecs.selectedAddOns,
        status: targetLead.status === 'New' ? 'Estimating' : targetLead.status
      }, brandConfig.googleAppsScriptUrl);

      // 2. Reconcile / Refresh directly from Google Sheets
      let refreshedLead: LeadRecord | undefined;
      try {
        const fresh = await loadLeadsFromGoogleSheets(brandConfig.googleAppsScriptUrl);
        if (fresh.mode === 'live') {
          setLeads(fresh.leads);
          refreshedLead = fresh.leads.find(l => l.leadId === targetLead.leadId);
        }
      } catch (refreshErr) {
        console.warn('Post-save Google Sheets refresh note:', refreshErr);
      }

      const updatedLead: LeadRecord = refreshedLead ? {
        ...refreshedLead,
        estimateSnapshot: estimate
      } : {
        ...targetLead,
        squareFootage: facilitySpecs.squareFootage,
        cleaningFrequency: facilitySpecs.cleaningFrequency,
        facilityType: facilitySpecs.facilityType,
        selectedAddOns: facilitySpecs.selectedAddOns,
        monthlyEstimate: estimate.totalEstimatedMonthlyInvestment,
        estimatedValue: estimate.annualContractValue,
        annualContractValue: estimate.annualContractValue,
        ratePerVisit: estimate.pricePerVisit,
        status: (targetLead.status === 'New' ? 'Estimating' : (targetLead.status || 'Estimating')) as LeadStatus,
        lastUpdated: new Date().toISOString().split('T')[0],
        estimateSnapshot: estimate
      };

      setLeads(prev => prev.map(l => l.leadId === targetLead.leadId ? updatedLead : l));
      setActiveLead(updatedLead);
      setActiveEstimate(estimate);
      triggerToast(`Successfully saved estimate to ${targetLead.companyName} in Google Sheets!`);
    } catch (err: any) {
      console.error('Failed to save estimate to lead in Google Sheets:', err);
      throw new Error(err?.message || 'Failed to save estimate to Google Sheets.');
    }
  };

  const handleUpdateStatus = async (leadId: string, newStatus: LeadStatus) => {
    try {
      await updateStatusInGoogleSheets(leadId, newStatus, undefined, brandConfig.googleAppsScriptUrl);
      setLeads(prev => prev.map(l => l.leadId === leadId ? { ...l, status: newStatus } : l));
      if (activeLead && activeLead.leadId === leadId) {
        setActiveLead(prev => prev ? { ...prev, status: newStatus } : null);
      }
      try {
        const fresh = await loadLeadsFromGoogleSheets(brandConfig.googleAppsScriptUrl);
        if (fresh.mode === 'live') {
          setLeads(fresh.leads);
        }
      } catch {}
      triggerToast(`Updated ${leadId} status to ${newStatus}`);
    } catch (err) {
      setLeads(prev => prev.map(l => l.leadId === leadId ? { ...l, status: newStatus } : l));
      triggerToast(`Status updated locally (Google Sheets sync pending)`);
    }
  };

  // Estimator Action Handlers
  const handleSaveEstimate = (estimate: EstimateResult) => {
    setActiveEstimate(estimate);
    triggerToast('Estimate calculation saved to active session!');
  };

  const handleSaveAsNewLead = (
    estimate: EstimateResult,
    facilitySpecs: {
      squareFootage: number;
      facilityType: FacilitySectorId;
      cleaningFrequency: FrequencyId;
      selectedAddOns: AddOnServiceId[];
    }
  ) => {
    setInitialSpecsForNewLead({
      squareFootage: facilitySpecs.squareFootage,
      facilityType: facilitySpecs.facilityType,
      cleaningFrequency: facilitySpecs.cleaningFrequency,
      selectedAddOns: facilitySpecs.selectedAddOns,
      estimatedValue: estimate.annualContractValue,
      monthlyEstimate: estimate.totalEstimatedMonthlyInvestment,
      ratePerVisit: estimate.pricePerVisit,
      propertyType: facilitySectors.find(s => s.id === facilitySpecs.facilityType)?.name || 'Commercial Facility',
      estimateSnapshot: estimate
    });
    setIsNewLeadModalOpen(true);
  };

  const handleSaveStandalone = (estimate: EstimateResult) => {
    setActiveEstimate(estimate);
    triggerToast('Saved as Standalone Commercial Estimate!');
  };

  const handleClearActiveLead = () => {
    setActiveLead(null);
    triggerToast('Cleared active lead context. Estimator operating in standalone mode.');
  };

  // Synchronize view transitions with browser URL history (pushState/replaceState)
  const navigateToView = useCallback((view: SystemView, targetLeadId?: string, replace: boolean = false) => {
    setCurrentView(view);
    if (typeof window !== 'undefined') {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('view', view);
        const resolvedLeadId = targetLeadId !== undefined ? targetLeadId : (view !== 'sales' && activeLead ? activeLead.leadId : undefined);
        if (resolvedLeadId) {
          url.searchParams.set('lead', resolvedLeadId);
        } else {
          url.searchParams.delete('lead');
          url.searchParams.delete('leadId');
        }
        url.hash = '';

        if (replace) {
          window.history.replaceState({ view, leadId: resolvedLeadId }, '', url.pathname + url.search);
        } else {
          const curParams = new URLSearchParams(window.location.search);
          if (curParams.get('view') === view && curParams.get('lead') === (resolvedLeadId || null)) {
            window.history.replaceState({ view, leadId: resolvedLeadId }, '', url.pathname + url.search);
          } else {
            window.history.pushState({ view, leadId: resolvedLeadId }, '', url.pathname + url.search);
          }
        }
      } catch (e) {
        console.warn('URL state push failed:', e);
      }
    }
  }, [activeLead]);

  // Handle native browser Back / Forward buttons (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const state = parseUrlState();
      setCurrentView(state.view);
      if (state.leadId && leads.length > 0) {
        const match = leads.find(l => l.leadId === state.leadId);
        if (match) {
          setActiveLead(match);
          if (match.estimateSnapshot) {
            setActiveEstimate(match.estimateSnapshot);
          }
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [leads]);

  // If page loads without explicit ?view= parameter, set it cleanly via replaceState
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.location.search.includes('view=')) {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('view', currentView);
        window.history.replaceState({ view: currentView }, '', url.pathname + url.search);
      } catch (e) {}
    }
  }, []);

  // When leads load from Google Sheets or localStorage, resolve any deep-linked lead ID from URL
  useEffect(() => {
    if (initialLeadIdRef.current && leads.length > 0) {
      const match = leads.find(l => l.leadId === initialLeadIdRef.current);
      if (match) {
        setActiveLead(match);
        if (match.estimateSnapshot) {
          setActiveEstimate(match.estimateSnapshot);
        }
        initialLeadIdRef.current = null;
      }
    }
  }, [leads]);

  const handleOpenProposalGenerator = (estimate: EstimateResult) => {
    setActiveEstimate(estimate);
    navigateToView('proposal', activeLead?.leadId);
  };

  const handleSaveProposal = async (proposalData: any) => {
    if (activeLead) {
      try {
        await updateProposalInGoogleSheets(activeLead.leadId, proposalData.id, brandConfig.googleAppsScriptUrl);
        const updatedLead: LeadRecord = {
          ...activeLead,
          proposalId: proposalData.id,
          status: 'Quoted',
          lastUpdated: new Date().toISOString().split('T')[0]
        };
        setLeads(prev => prev.map(l => l.leadId === activeLead.leadId ? updatedLead : l));
        setActiveLead(updatedLead);
        triggerToast(`Proposal ${proposalData.id} attached to ${activeLead.companyName}!`);
      } catch (err) {
        console.warn('Proposal sync failed:', err);
      }
    }
    triggerToast('Proposal ready for client printing or PDF delivery!');
  };

  const handleOpenEstimatorForLead = (lead: LeadRecord) => {
    setActiveLead(lead);
    const est = lead.estimateSnapshot || calculateCommercialEstimate(
      lead.squareFootage || 12000,
      lead.facilityType || 'corporate_office',
      lead.cleaningFrequency || 'business_5x',
      lead.selectedAddOns || []
    );
    setActiveEstimate(est);
    navigateToView('estimator', lead.leadId);
  };

  const handleOpenProposalForLead = (lead: LeadRecord) => {
    setActiveLead(lead);
    const est = lead.estimateSnapshot || calculateCommercialEstimate(
      lead.squareFootage || 12000,
      lead.facilityType || 'corporate_office',
      lead.cleaningFrequency || 'business_5x',
      lead.selectedAddOns || []
    );
    setActiveEstimate(est);
    navigateToView('proposal', lead.leadId);
  };

  // Scroll to top on view changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentView]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      
      {/* 1. Enterprise App Navigation Bar */}
      {currentView !== 'proposal' && (
        <Navbar
          currentView={currentView}
          onNavigate={(view) => navigateToView(view)}
          brandConfig={brandConfig}
          onOpenNewLeadModal={() => {
            setInitialSpecsForNewLead(undefined);
            setIsNewLeadModalOpen(true);
          }}
          onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
          onSyncFromGoogleSheets={handleSyncFromGoogleSheets}
          isSyncing={isSyncing}
          leadCount={leads.length}
        />
      )}

      {/* 2. Main System Modules */}
      <main className="flex-1">
        
        {/* MODULE 1: Pipeline CRM Dashboard */}
        {currentView === 'sales' && (
          <div className="space-y-8 pb-16">
            <SalesDashboard
              leads={leads}
              activeLead={activeLead}
              brandConfig={brandConfig}
              isSyncing={isSyncing}
              onSyncFromGoogleSheets={handleSyncFromGoogleSheets}
              onSelectLead={(lead) => {
                setActiveLead(lead);
                if (lead.estimateSnapshot) setActiveEstimate(lead.estimateSnapshot);
              }}
              onOpenNewLeadModal={() => {
                setInitialSpecsForNewLead(undefined);
                setIsNewLeadModalOpen(true);
              }}
              onOpenEditLeadModal={(lead) => {
                setSelectedLeadForEdit(lead);
                setIsEditLeadModalOpen(true);
              }}
              onOpenEstimatorForLead={handleOpenEstimatorForLead}
              onOpenProposalForLead={handleOpenProposalForLead}
              onUpdateStatus={handleUpdateStatus}
            />
          </div>
        )}

        {/* MODULE 2: Dedicated Bidding & Rate Estimator Workspace */}
        {currentView === 'estimator' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-16">
            {/* Header banner */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-xs font-bold text-blue-700 mb-1.5">
                  <Calculator className="w-3.5 h-3.5" />
                  <span>ISSA 540 Workloading Engine</span>
                </div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Commercial Janitorial Rate Estimator
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Calculate square footage production rates, labor hours, crew sizing, and gross margins for {brandConfig.companyName}.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigateToView('sales')}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  ← Back to Pipeline CRM
                </button>
              </div>
            </div>

            {/* Estimator Engine Card */}
            <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
              <CommercialQuoteCalculator
                brandConfig={brandConfig}
                activeLead={activeLead}
                leads={leads}
                onSaveEstimateToLead={handleSaveEstimateToLead}
                onSaveEstimate={handleSaveEstimate}
                onSaveAsNewLead={handleSaveAsNewLead}
                onSaveStandalone={handleSaveStandalone}
                onClearActiveLead={handleClearActiveLead}
                onOpenProposalGenerator={handleOpenProposalGenerator}
              />
            </div>
          </div>
        )}

        {/* MODULE 3: Professional A4 Proposal Studio & Print Document */}
        {currentView === 'proposal' && (
          <CommercialProposalGenerator
            estimate={activeEstimate}
            brandConfig={brandConfig}
            activeLead={activeLead}
            onSaveProposal={handleSaveProposal}
            onBack={() => navigateToView('sales')}
          />
        )}
      </main>

      {/* 3. Enterprise Software Status Bar (Hidden on Proposal View) */}
      {currentView !== 'proposal' && (
        <Footer
          brandConfig={brandConfig}
        />
      )}

      {/* 4. Modals */}
      <NewLeadModal
        isOpen={isNewLeadModalOpen}
        onClose={() => setIsNewLeadModalOpen(false)}
        onCreateLead={handleCreateLead}
        suggestedLeadId={generateNextLeadId()}
        initialEstimateSpecs={initialSpecsForNewLead}
      />

      <LeadDetailEditModal
        isOpen={isEditLeadModalOpen}
        lead={selectedLeadForEdit}
        onClose={() => {
          setIsEditLeadModalOpen(false);
          setSelectedLeadForEdit(null);
        }}
        onSaveLead={handleUpdateLead}
        onOpenEstimatorForLead={handleOpenEstimatorForLead}
        onOpenProposalForLead={handleOpenProposalForLead}
      />

      <SystemSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        brandConfig={brandConfig}
        onSaveConfig={handleUpdateBrand}
      />

      {/* 5. Toast Feedback */}
      <Toast message={toastMsg} isVisible={toastVisible} />
    </div>
  );
};

export default App;
