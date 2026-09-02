import React, { useState, useEffect } from 'react';
import { ClientBrandConfig, EstimateResult } from './types/cleanCommand';
import { defaultClientBrand } from './config/clientConfig';
import { calculateCommercialEstimate } from './utils/pricingEngine';
import { Navbar } from './components/Navbar';
import { CorporateLanding } from './components/landing/CorporateLanding';
import { CommercialProposalGenerator } from './components/proposal/CommercialProposalGenerator';
import { Footer } from './components/Footer';

export const App: React.FC = () => {
  // Brand Configuration loaded directly from clientConfig.ts
  const [brandConfig] = useState<ClientBrandConfig>(defaultClientBrand);

  const [currentView, setCurrentView] = useState<'landing' | 'proposal'>('landing');
  const [activeEstimate, setActiveEstimate] = useState<EstimateResult>(() => {
    return calculateCommercialEstimate(12500, 'corporate_office', 'business_5x', ['carpet_extraction']);
  });

  const handleOpenProposalGenerator = (estimate: EstimateResult) => {
    setActiveEstimate(estimate);
    setCurrentView('proposal');
  };

  // Scroll to top on view changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentView]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      
      {/* 1. Top Navigation Bar (Hidden on Proposal View when printing) */}
      {currentView !== 'proposal' && (
        <Navbar
          currentView={currentView}
          onNavigate={(view) => setCurrentView(view)}
          brandConfig={brandConfig}
        />
      )}

      {/* 2. Main View Router */}
      <main className="flex-1">
        {currentView === 'landing' && (
          <CorporateLanding
            brandConfig={brandConfig}
            onOpenProposalGenerator={handleOpenProposalGenerator}
          />
        )}

        {currentView === 'proposal' && (
          <CommercialProposalGenerator
            estimate={activeEstimate}
            brandConfig={brandConfig}
            onBack={() => setCurrentView('landing')}
          />
        )}
      </main>

      {/* 3. Luxury Corporate Footer (Hidden on Proposal View) */}
      {currentView !== 'proposal' && (
        <Footer
          brandConfig={brandConfig}
          onNavigate={(view) => setCurrentView(view)}
        />
      )}
    </div>
  );
};

export default App;
