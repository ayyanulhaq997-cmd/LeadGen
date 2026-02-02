
import React, { useState, useEffect } from 'react';
import { Stats } from './components/Stats.tsx';
import { SearchForm } from './components/SearchForm.tsx';
import { LeadList } from './components/LeadList.tsx';
import { storageService } from './services/storageService.ts';
import { geminiService } from './services/geminiService.ts';
import { Business } from './types.ts';

// Using the expected AIStudio type to align with global environment definitions.
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    // Fixed: Added optional modifier to match potential environment definitions and avoid "identical modifiers" error.
    aistudio?: AIStudio;
  }
}

const App: React.FC = () => {
  const [leads, setLeads] = useState<Business[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load initial data and check for API key
  useEffect(() => {
    const savedLeads = storageService.getLeads();
    setLeads(savedLeads);
    
    const checkApiKey = async () => {
      if (window.aistudio) {
        try {
          const hasKey = await window.aistudio.hasSelectedApiKey();
          if (!hasKey) {
            setError("Please select a paid API key to access high-performance features like Google Maps grounding.");
          }
        } catch (e) {
          console.error("Failed to check API key status", e);
        }
      }
    };
    checkApiKey();
  }, []);

  const handleEntityNotFoundError = async () => {
    if (window.aistudio) {
      setError("The requested model or feature requires a specific API key. Please select a valid key from a paid project.");
      await window.aistudio.openSelectKey();
      setError(null);
    }
  };

  const handleScan = async (city: string, keyword: string) => {
    setIsScanning(true);
    setError(null);
    try {
      const results = await geminiService.scanLocalBusinesses(city, keyword);
      if (results.length > 0) {
        storageService.saveLeads(results);
        setLeads(storageService.getLeads());
      } else {
        setError("No leads found for this search criteria. Try a different city or keyword.");
      }
    } catch (err: any) {
      console.error(err);
      const errorMessage = err?.message || JSON.stringify(err);
      if (errorMessage.includes("Requested entity was not found") || errorMessage.includes("404")) {
        await handleEntityNotFoundError();
      } else {
        setError(`Failed to scan: ${errorMessage}`);
      }
    } finally {
      setIsScanning(false);
    }
  };

  const handleGenerateMessage = async (id: string) => {
    const lead = leads.find(l => l.id === id);
    if (!lead) return;

    setGeneratingId(id);
    try {
      const message = await geminiService.generateMessage(lead);
      storageService.updateLead(id, { message });
      setLeads(storageService.getLeads());
    } catch (err: any) {
      console.error(err);
      const errorMessage = err?.message || JSON.stringify(err);
      if (errorMessage.includes("Requested entity was not found") || errorMessage.includes("404")) {
        await handleEntityNotFoundError();
      } else {
        alert("Failed to generate AI message.");
      }
    } finally {
      setGeneratingId(null);
    }
  };

  const clearHistory = () => {
    if (window.confirm("Are you sure you want to clear all leads?")) {
      storageService.clearLeads();
      setLeads([]);
    }
  };

  const triggerKeySelection = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setError(null);
    }
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xl">
                <i className="fa-solid fa-rocket"></i>
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900">LeadGen AI</h1>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">SaaS Prototype</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={triggerKeySelection}
                className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition-all flex items-center gap-2"
              >
                <i className="fa-solid fa-key"></i> Key Settings
              </button>
              <button 
                onClick={clearHistory}
                className="text-slate-400 hover:text-red-600 transition-colors ml-2"
                title="Clear Data"
              >
                <i className="fa-solid fa-trash-can"></i>
              </button>
              <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden">
                <img src={`https://ui-avatars.com/api/?name=User&background=random`} alt="User" />
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Lead Dashboard</h2>
          <p className="text-slate-500 max-w-2xl">
            Automatically find and categorize potential clients. Focus on <span className="text-red-600 font-bold italic">HOT</span> leads that have no online presence. 
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-blue-500 hover:underline ml-1">Learn about billing</a>.
          </p>
        </header>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-8 flex items-start gap-3 rounded-r-lg">
            <i className="fa-solid fa-circle-exclamation text-red-400 mt-1"></i>
            <div className="flex-1">
              <p className="text-red-700 text-sm font-medium">{error}</p>
              {error.includes("key") && (
                 <button onClick={triggerKeySelection} className="mt-2 text-xs font-bold text-red-700 underline">Select API Key Now</button>
              )}
            </div>
          </div>
        )}

        <Stats leads={leads} />
        
        <SearchForm onScan={handleScan} isLoading={isScanning} />

        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <i className="fa-solid fa-list-ul text-blue-500"></i>
            Prospective Leads
          </h3>
          <span className="text-xs text-slate-400 font-medium">{leads.length} Records Found</span>
        </div>

        <LeadList 
          leads={leads} 
          onGenerateMessage={handleGenerateMessage} 
          isGeneratingId={generatingId} 
        />
      </main>

      {/* Footer / Status bar */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 py-3 px-8 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center text-[11px] font-bold uppercase tracking-widest text-slate-400">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isScanning ? 'bg-amber-400 animate-pulse' : 'bg-green-400'}`}></div>
            System Status: {isScanning ? 'Scanning...' : 'Idle'}
          </div>
          <div className="hidden sm:block">
            Grounding: Google Maps & Search Enabled
          </div>
          <div>
            API: {process.env.API_KEY ? 'Authenticated' : 'Key Required'}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
