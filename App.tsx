
import React, { useState, useEffect } from 'react';
import { Stats } from './components/Stats.tsx';
import { SearchForm } from './components/SearchForm.tsx';
import { LeadList } from './components/LeadList.tsx';
import { storageService } from './services/storageService.ts';
import { geminiService } from './services/geminiService.ts';
import { Business } from './types.ts';

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio?: AIStudio;
    process?: {
      env: {
        [key: string]: string | undefined;
      }
    }
  }
}

const App: React.FC = () => {
  const [leads, setLeads] = useState<Business[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [manualKey, setManualKey] = useState('');

  // Load initial data and sync API key from localStorage
  useEffect(() => {
    const savedLeads = storageService.getLeads();
    setLeads(savedLeads);
    
    // Check localStorage for a manually entered key
    const storedKey = localStorage.getItem('GEMINI_API_KEY');
    if (storedKey && window.process) {
      window.process.env.API_KEY = storedKey;
      setManualKey(storedKey);
    }

    const checkApiKey = async () => {
      if (window.aistudio) {
        try {
          const hasKey = await window.aistudio.hasSelectedApiKey();
          if (!hasKey && (!window.process?.env?.API_KEY)) {
            setError("API Key required. Please click 'Key Settings' to enter your API key.");
          }
        } catch (e) {
          console.error("Failed to check API key status", e);
        }
      } else if (!window.process?.env?.API_KEY) {
        setError("API Key required. Please click 'Key Settings' to enter your API key.");
      }
    };
    checkApiKey();
  }, []);

  const saveManualKey = () => {
    if (manualKey.trim()) {
      if (window.process) {
        window.process.env.API_KEY = manualKey.trim();
      }
      localStorage.setItem('GEMINI_API_KEY', manualKey.trim());
      setIsKeyModalOpen(false);
      setError(null);
      alert("API Key saved successfully!");
    }
  };

  const handleScan = async (city: string, keyword: string) => {
    if (!window.process?.env?.API_KEY) {
      setError("Please set your API Key first using 'Key Settings'.");
      setIsKeyModalOpen(true);
      return;
    }

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
      if (errorMessage.includes("API Key") || errorMessage.includes("401") || errorMessage.includes("403")) {
        setError("Invalid or missing API Key. Please update it in 'Key Settings'.");
        setIsKeyModalOpen(true);
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
      alert("Failed to generate AI message. Check your API Key.");
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

  return (
    <div className="min-h-screen pb-20">
      {/* API Key Modal */}
      {isKeyModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-slate-900">API Key Settings</h3>
                <button onClick={() => setIsKeyModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <i className="fa-solid fa-xmark text-lg"></i>
                </button>
              </div>
              <p className="text-sm text-slate-500 mb-6">
                Paste your Gemini API key below. This is required to search for leads and generate messages. 
                Your key is stored locally in your browser.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Gemini API Key</label>
                  <div className="relative">
                    <i className="fa-solid fa-key absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
                    <input 
                      type="password" 
                      value={manualKey}
                      onChange={(e) => setManualKey(e.target.value)}
                      placeholder="Paste your key here..."
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>
                <button 
                  onClick={saveManualKey}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
                >
                  <i className="fa-solid fa-save"></i> Save & Connect
                </button>
                <p className="text-[10px] text-center text-slate-400">
                  Get a key at <a href="https://aistudio.google.com/app/apikey" target="_blank" className="text-blue-500 hover:underline font-bold">Google AI Studio</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

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
                onClick={() => setIsKeyModalOpen(true)}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-2 ${manualKey ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                <i className={`fa-solid ${manualKey ? 'fa-check-circle' : 'fa-key'}`}></i> 
                {manualKey ? 'Key Active' : 'Key Settings'}
              </button>
              <button 
                onClick={clearHistory}
                className="text-slate-400 hover:text-red-600 transition-colors ml-2"
                title="Clear Data"
              >
                <i className="fa-solid fa-trash-can"></i>
              </button>
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
          </p>
        </header>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-8 flex items-start gap-3 rounded-r-lg">
            <i className="fa-solid fa-circle-exclamation text-red-400 mt-1"></i>
            <div className="flex-1">
              <p className="text-red-700 text-sm font-medium">{error}</p>
              <button onClick={() => setIsKeyModalOpen(true)} className="mt-2 text-xs font-bold text-red-700 underline uppercase tracking-wider">Set API Key Now</button>
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

      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 py-3 px-8 z-40">
        <div className="max-w-7xl mx-auto flex justify-between items-center text-[11px] font-bold uppercase tracking-widest text-slate-400">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isScanning ? 'bg-amber-400 animate-pulse' : 'bg-green-400'}`}></div>
            System Status: {isScanning ? 'Scanning...' : 'Idle'}
          </div>
          <div>
            API: {window.process?.env?.API_KEY ? 'Connected' : 'Disconnected'}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
