import React, { useState, useEffect } from 'react';
import { 
  ClientBrandConfig, 
  EstimateResult, 
  LeadRecord, 
  LeadStatus,
  FacilitySectorId,
  FrequencyId,
  AddOnServiceId
} from './types/cleanCommand';
import { defaultClientBrand } from './config/clientConfig';
import { calculateCommercialEstimate } from './utils/pricingEngine';
import { Navbar } from './components/Navbar';
import { CorporateLanding } from './components/landing/CorporateLanding';
import { CommercialProposalGenerator } from './components/proposal/CommercialProposalGenerator';
import { Toast } from './components/Toast';
import { Footer } from './components/Footer';
import { SalesDashboard } from './components/leads/SalesDashboard';
import { NewLeadModal } from './components/leads/NewLeadModal';
import { InternalWalkthroughModal } from './components/leads/InternalWalkthroughModal';
import { CommercialQuoteCalculator } from './components/calculator/CommercialQuoteCalculator';
import { 
  loadLeadsFromGoogleSheets, 
  createLeadInGoogleSheets, 
  saveEstimateToGoogleSheets, 
  updateWalkthroughInGoogleSheets, 
  updateProposalInGoogleSheets, 
  updateStatusInGoogleSheets 
} from './services/googleSheetsService';

export const App: React.FC = () => {
  // Brand Configuration with localStorage sync
  const [brandConfig] = useState<ClientBrandConfig>(() => {
    try {
      const saved = localStorage.getItem('cleancommand_brand_config');
      if (saved) {
        return { ...defaultClientBrand, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('LocalStorage unavailable for brand config:', e);
    }
    return defaultClientBrand;
  });

  // Current view: default to internal 'sales' hub for sales team
  const [currentView, setCurrentView] = useState<'sales' | 'landing' | 'proposal'>('sales');

  // Leads CRM State: starts empty for clean product template, reloaded from Google Sheets or localStorage
  const [leads, setLeads] = useState<LeadRecord[]>(() => {
    try {
      const cached = localStorage.getItem('cleancommand_leads_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
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
  const [isWalkthroughModalOpen, setIsWalkthroughModalOpen] = useState(false);

  // Toast feedback
  const [toastMsg, setToastMsg] = useState<string>('');
  const [toastVisible, setToastVisible] = useState<boolean>(false);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3500);
  };

  // Load leads from Google Sheets on start / refresh
  useEffect(() => {
    let isMounted = true;
    async function initLeads() {
      try {
        const res = await loadLeadsFromGoogleSheets(brandConfig.googleAppsScriptUrl);
        if (isMounted && res.leads && res.leads.length > 0) {
          setLeads(res.leads);
          if (!activeLead) {
            setActiveLead(res.leads[0]);
          }
        }
      } catch (err) {
        console.warn('Could not load remote leads:', err);
      }
    }
    initLeads();
    return () => { isMounted = false; };
  }, [brandConfig.googleAppsScriptUrl]);

  // Lead Lifecycle Actions
  const handleCreateLead = async (newLead: LeadRecord) => {
    setLeads(prev => [newLead, ...prev]);
    setActiveLead(newLead);
    setActiveEstimate(newLead.estimateSnapshot || calculateCommercialEstimate(newLead.squareFootage, newLead.facilityType, newLead.cleaningFrequency, newLead.selectedAddOns));
    triggerToast(`Created lead ${newLead.leadId} for ${newLead.companyName}!`);

    try {
      await createLeadInGoogleSheets(newLead, brandConfig.googleAppsScriptUrl);
    } catch (e) {
      console.warn('Failed to sync new lead to Google Sheets:', e);
    }
  };

  const handleSaveEstimate = async (
    estimate: EstimateResult,
    facilitySpecs: {
      squareFootage: number;
      facilityType: FacilitySectorId;
      cleaningFrequency: FrequencyId;
      selectedAddOns: AddOnServiceId[];
    }
  ) => {
    if (!activeLead) return;

    const updatedLead: LeadRecord = {
      ...activeLead,
      squareFootage: facilitySpecs.squareFootage,
      facilityType: facilitySpecs.facilityType,
      cleaningFrequency: facilitySpecs.cleaningFrequency,
      selectedAddOns: facilitySpecs.selectedAddOns,
      monthlyEstimate: estimate.totalEstimatedMonthlyInvestment,
      ratePerVisit: estimate.pricePerVisit,
      annualContractValue: estimate.annualContractValue,
      estimatedLaborHours: estimate.hoursPerCleaningVisit,
      recommendedCrewSize: estimate.recommendedCrewSize,
      estimateSnapshot: estimate,
      lastUpdated: new Date().toISOString()
    };

    setActiveLead(updatedLead);
    setActiveEstimate(estimate);
    setLeads(prev => prev.map(l => l.leadId === updatedLead.leadId ? updatedLead : l));
    triggerToast(`Saved estimate ($${estimate.totalEstimatedMonthlyInvestment}/mo) to ${updatedLead.companyName}!`);

    try {
      await saveEstimateToGoogleSheets(updatedLead.leadId, {
        monthlyEstimate: estimate.totalEstimatedMonthlyInvestment,
        ratePerVisit: estimate.pricePerVisit,
        annualContractValue: estimate.annualContractValue,
        estimatedLaborHours: estimate.hoursPerCleaningVisit,
        recommendedCrewSize: estimate.recommendedCrewSize,
        squareFootage: facilitySpecs.squareFootage,
        facilityType: facilitySpecs.facilityType,
        cleaningFrequency: facilitySpecs.cleaningFrequency,
        selectedAddOns: facilitySpecs.selectedAddOns
      }, brandConfig.googleAppsScriptUrl);
    } catch (e) {
      console.warn('Failed to save estimate to Google Sheets:', e);
    }
  };

  const handleSaveWalkthrough = async (updatedFields: Partial<LeadRecord>) => {
    if (!activeLead) return;

    const updatedLead: LeadRecord = {
      ...activeLead,
      ...updatedFields,
      lastUpdated: new Date().toISOString()
    };

    setActiveLead(updatedLead);
    setLeads(prev => prev.map(l => l.leadId === updatedLead.leadId ? updatedLead : l));
    triggerToast(`Updated walkthrough for ${updatedLead.companyName}!`);

    try {
      await updateWalkthroughInGoogleSheets(updatedLead.leadId, updatedFields, brandConfig.googleAppsScriptUrl);
    } catch (e) {
      console.warn('Failed to update walkthrough in Google Sheets:', e);
    }
  };

  const handleUpdateStatus = async (leadId: string, newStatus: LeadStatus) => {
    const lead = leads.find(l => l.leadId === leadId);
    const prevStatus = lead?.status;

    setLeads(prev => prev.map(l => l.leadId === leadId ? { ...l, status: newStatus, lastUpdated: new Date().toISOString() } : l));
    if (activeLead && activeLead.leadId === leadId) {
      setActiveLead(prev => prev ? { ...prev, status: newStatus, lastUpdated: new Date().toISOString() } : null);
    }

    triggerToast(`Lead ${leadId} status set to ${newStatus}`);

    try {
      await updateStatusInGoogleSheets(leadId, newStatus, prevStatus, brandConfig.googleAppsScriptUrl);
    } catch (e) {
      console.warn('Failed to update status in Google Sheets:', e);
    }
  };

  const handleSaveProposal = async (proposalInfo: {
    proposalId: string;
    proposalStatus: 'GENERATED';
    proposalIssueDate: string;
    proposalValidThrough: string;
  }) => {
    if (!activeLead) return;

    const updatedLead: LeadRecord = {
      ...activeLead,
      ...proposalInfo,
      lastUpdated: new Date().toISOString()
    };

    setActiveLead(updatedLead);
    setLeads(prev => prev.map(l => l.leadId === updatedLead.leadId ? updatedLead : l));
    triggerToast(`Proposal ${proposalInfo.proposalId} registered to ${updatedLead.companyName}`);

    try {
      await updateProposalInGoogleSheets(updatedLead.leadId, proposalInfo, brandConfig.googleAppsScriptUrl);
    } catch (e) {
      console.warn('Failed to update proposal in Google Sheets:', e);
    }
  };

  const handleOpenProposalGenerator = (estimate: EstimateResult) => {
    setActiveEstimate(estimate);
    setToastVisible(false);
    setCurrentView('proposal');
  };

  const handleOpenEstimatorForLead = (lead: LeadRecord) => {
    setActiveLead(lead);
    const est = lead.estimateSnapshot || calculateCommercialEstimate(
      lead.squareFootage,
      lead.facilityType,
      lead.cleaningFrequency,
      lead.selectedAddOns
    );
    setActiveEstimate(est);
    setCurrentView('sales');
    setTimeout(() => {
      const el = document.getElementById('estimator');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleOpenProposalForLead = (lead: LeadRecord) => {
    setActiveLead(lead);
    const est = lead.estimateSnapshot || calculateCommercialEstimate(
      lead.squareFootage,
      lead.facilityType,
      lead.cleaningFrequency,
      lead.selectedAddOns
    );
    setActiveEstimate(est);
    setCurrentView('proposal');
  };

  // Scroll to top on view changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentView]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      
      {/* 1. Top Navigation Bar */}
      {currentView !== 'proposal' && (
        <Navbar
          currentView={currentView}
          onNavigate={(view) => setCurrentView(view as 'sales' | 'landing' | 'proposal')}
          brandConfig={brandConfig}
          isProductionMode={true}
          onOpenNewLeadModal={() => setIsNewLeadModalOpen(true)}
          leadCount={leads.length}
        />
      )}

      {/* 2. Main View Router */}
      <main className="flex-1">
        
        {/* VIEW 1: Internal Sales Hub & Integrated Estimator */}
        {currentView === 'sales' && (
          <div className="space-y-8 pb-16">
            <SalesDashboard
              leads={leads}
              activeLead={activeLead}
              brandConfig={brandConfig}
              onSelectLead={(lead) => {
                setActiveLead(lead);
                if (lead.estimateSnapshot) setActiveEstimate(lead.estimateSnapshot);
              }}
              onOpenNewLeadModal={() => setIsNewLeadModalOpen(true)}
              onOpenWalkthroughModal={(lead) => {
                setActiveLead(lead);
                setIsWalkthroughModalOpen(true);
              }}
              onOpenEstimatorForLead={handleOpenEstimatorForLead}
              onOpenProposalForLead={handleOpenProposalForLead}
              onUpdateStatus={handleUpdateStatus}
            />

            {/* Integrated Estimator connected directly to activeLead */}
            <div className="border-t border-slate-800/80 pt-4 bg-slate-900/40">
              <CommercialQuoteCalculator
                brandConfig={brandConfig}
                activeLead={activeLead}
                onSaveEstimate={handleSaveEstimate}
                onScheduleWalkthrough={() => setIsWalkthroughModalOpen(true)}
                onOpenProposalGenerator={handleOpenProposalGenerator}
              />
            </div>
          </div>
        )}

        {/* VIEW 2: Corporate Public Authority Landing */}
        {currentView === 'landing' && (
          <CorporateLanding
            brandConfig={brandConfig}
            onOpenProposalGenerator={handleOpenProposalGenerator}
          />
        )}

        {/* VIEW 3: Professional A4 Proposal Generator & Print Document */}
        {currentView === 'proposal' && (
          <CommercialProposalGenerator
            estimate={activeEstimate}
            brandConfig={brandConfig}
            activeLead={activeLead}
            onSaveProposal={handleSaveProposal}
            onBack={() => setCurrentView('sales')}
          />
        )}
      </main>

      {/* 3. Footer (Hidden on Proposal View) */}
      {currentView !== 'proposal' && (
        <Footer
          brandConfig={brandConfig}
          onNavigate={(view) => setCurrentView(view as any)}
        />
      )}

      {/* 4. Modals */}
      <NewLeadModal
        isOpen={isNewLeadModalOpen}
        onClose={() => setIsNewLeadModalOpen(false)}
        onCreateLead={handleCreateLead}
        nextLeadSequence={leads.length + 1}
      />

      <InternalWalkthroughModal
        isOpen={isWalkthroughModalOpen}
        lead={activeLead}
        onClose={() => setIsWalkthroughModalOpen(false)}
        onSaveWalkthrough={handleSaveWalkthrough}
      />

      {/* 5. Toast Feedback */}
      <Toast message={toastMsg} isVisible={toastVisible} />
    </div>
  );
};

export default App;
