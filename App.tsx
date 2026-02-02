
import React, { useState, useEffect, useRef } from 'react';
import { Stats } from './components/Stats.tsx';
import { SearchForm } from './components/SearchForm.tsx';
import { LeadList } from './components/LeadList.tsx';
import { storageService } from './services/storageService.ts';
import { geminiService } from './services/geminiService.ts';
import { Business, LeadStatus, MessageLog } from './types.ts';

const App: React.FC = () => {
  const [leads, setLeads] = useState<Business[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isPilotMode, setIsPilotMode] = useState(false);
  const [agentLogs, setAgentLogs] = useState<string[]>(["System initialized. Ready for campaign..."]);
  const [error, setError] = useState<string | null>(null);
  
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedLeads = storageService.getLeads();
    setLeads(savedLeads);
  }, []);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [agentLogs]);

  const addLog = (msg: string) => {
    setAgentLogs(prev => [...prev.slice(-15), `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  // The Autonomous Engine
  const runAutonomousCycle = async (targetLeads: Business[]) => {
    addLog(`Initiating outreach for ${targetLeads.length} new leads...`);
    
    for (const lead of targetLeads) {
      if (!isPilotMode) break;
      
      // Step 1: Initial Outreach
      addLog(`Generating strategy for ${lead.name}...`);
      try {
        const message = await geminiService.generateAgentResponse(lead);
        const log: MessageLog = { role: 'agent', content: message, timestamp: Date.now() };
        
        const updatedLead = { 
          ...lead, 
          status: LeadStatus.CONTACTED, 
          history: [log] 
        };
        updateLeadState(updatedLead);
        addLog(`SUCCESS: Outreach sent to ${lead.name}.`);

        // Step 2: Simulate waiting for reply (Demo purpose: 5-10 seconds)
        setTimeout(async () => {
          if (!isPilotMode) return;
          addLog(`Scanning incoming signals for ${lead.name}...`);
          
          const reply = await geminiService.simulateClientReply(updatedLead);
          addLog(`REPLY RECEIVED from ${lead.name}: "${reply}"`);
          
          const replyLog: MessageLog = { role: 'client', content: reply, timestamp: Date.now() };
          const withReply = { ...updatedLead, status: LeadStatus.NEGOTIATING, history: [...updatedLead.history, replyLog] };
          updateLeadState(withReply);

          // Step 3: Auto-Negotiate
          addLog(`AI is formulating a negotiation response for ${lead.name}...`);
          const followUp = await geminiService.generateAgentResponse(withReply, reply);
          const followUpLog: MessageLog = { role: 'agent', content: followUp, timestamp: Date.now() };
          const finalState = { ...withReply, status: LeadStatus.CONVERTED, history: [...withReply.history, followUpLog] };
          updateLeadState(finalState);
          addLog(`PROJECT SECURED: ${lead.name} has been pre-converted. Ready for handover.`);
        }, 8000);

      } catch (err) {
        addLog(`ERROR: Outreach failed for ${lead.name}. Skipping.`);
      }
    }
  };

  const updateLeadState = (updated: Business) => {
    setLeads(prev => {
      const filtered = prev.filter(l => l.id !== updated.id);
      const newState = [updated, ...filtered];
      storageService.saveLeads(newState);
      return newState;
    });
  };

  const handleLaunchCampaign = async (city: string, keyword: string) => {
    setIsScanning(true);
    addLog(`Agent launched. Target: ${keyword} in ${city}.`);
    
    try {
      const results = await geminiService.scanLocalBusinesses(city, keyword);
      if (results.length > 0) {
        setLeads(prev => [...results, ...prev]);
        addLog(`Scanning complete. Found ${results.length} qualified prospects.`);
        
        if (isPilotMode) {
          runAutonomousCycle(results);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className={`min-h-screen pb-20 transition-colors duration-500 ${isPilotMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Header */}
      <nav className={`border-b sticky top-0 z-50 transition-colors ${isPilotMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white text-xl ${isPilotMode ? 'bg-red-600 shadow-lg shadow-red-900/40' : 'bg-blue-600'}`}>
              <i className={`fa-solid ${isPilotMode ? 'fa-robot' : 'fa-rocket'}`}></i>
            </div>
            <div>
              <h1 className="text-xl font-bold">LeadGen AI</h1>
              <span className={`text-[10px] font-black uppercase tracking-widest ${isPilotMode ? 'text-red-500' : 'text-slate-400'}`}>
                {isPilotMode ? 'Pilot Mode Active' : 'SaaS Prototype'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 bg-slate-800/50 p-1 rounded-full border border-slate-700">
               <button 
                onClick={() => setIsPilotMode(false)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${!isPilotMode ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
               >Manual</button>
               <button 
                onClick={() => setIsPilotMode(true)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${isPilotMode ? 'bg-red-600 text-white' : 'text-slate-400'}`}
               >Pilot (Auto)</button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {error && <div className="p-4 mb-6 bg-red-500/10 border border-red-500/50 text-red-500 rounded-xl font-bold text-sm">{error}</div>}
        
        {isPilotMode && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
             <div className="lg:col-span-2">
                <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl">
                   <div className="bg-slate-700 px-4 py-2 flex justify-between items-center">
                      <span className="text-[10px] font-mono text-slate-300">AGENT_TERMINAL_V1.0</span>
                      <div className="flex gap-1.5">
                         <div className="w-2 h-2 rounded-full bg-red-500"></div>
                         <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                         <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      </div>
                   </div>
                   <div ref={terminalRef} className="p-4 h-48 overflow-y-auto font-mono text-xs text-green-400 space-y-1">
                      {agentLogs.map((log, i) => <div key={i}>{log}</div>)}
                      {isScanning && <div className="animate-pulse">_ EXECUTING_SCAN...</div>}
                   </div>
                </div>
             </div>
             <div className="bg-red-950/20 border border-red-900/30 rounded-2xl p-6 flex flex-col justify-center">
                <h4 className="text-red-500 font-bold mb-1">Autonomous Status</h4>
                <p className="text-sm text-slate-400 mb-4">AI is currently finding and closing leads without human input.</p>
                <div className="flex items-center gap-4">
                  <div className="flex-1 bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-red-500 h-full w-2/3 animate-pulse"></div>
                  </div>
                  <span className="text-xs font-mono">ON_TRACK</span>
                </div>
             </div>
          </div>
        )}

        <Stats leads={leads} />
        
        <SearchForm 
          onScan={handleLaunchCampaign} 
          isLoading={isScanning} 
        />

        <div className="flex items-center justify-between mb-4 mt-8">
          <h3 className={`text-lg font-bold flex items-center gap-2 ${isPilotMode ? 'text-slate-100' : 'text-slate-800'}`}>
            <i className={`fa-solid ${isPilotMode ? 'fa-robot text-red-500' : 'fa-list-ul text-blue-500'}`}></i>
            Active Campaign Pipeline
          </h3>
        </div>

        <LeadList 
          leads={leads} 
          onGenerateMessage={() => {}} 
          isGeneratingId={null} 
        />
      </main>
    </div>
  );
};

export default App;
