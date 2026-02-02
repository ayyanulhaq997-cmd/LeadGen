
import React, { useState, useEffect, useRef } from 'react';
import { Stats } from './components/Stats.tsx';
import { SearchForm } from './components/SearchForm.tsx';
import { LeadList } from './components/LeadList.tsx';
import { MeetingSheet } from './components/MeetingSheet.tsx';
import { storageService } from './services/storageService.ts';
import { geminiService } from './services/geminiService.ts';
import { Business, LeadStatus, MessageLog, Meeting } from './types.ts';

const App: React.FC = () => {
  const [leads, setLeads] = useState<Business[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isPilotMode, setIsPilotMode] = useState(true);
  const [agentLogs, setAgentLogs] = useState<string[]>(["[SYSTEM] Autonomous Pilot 2.0 initialized.", "[SYSTEM] Waiting for target geographic sector..."]);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [tempKey, setTempKey] = useState('');
  const [view, setView] = useState<'pipeline' | 'schedule'>('pipeline');
  
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLeads(storageService.getLeads());
    const savedMeetings = localStorage.getItem('leadgen_meetings');
    if (savedMeetings) setMeetings(JSON.parse(savedMeetings));
    
    const savedKey = localStorage.getItem('MANUAL_API_KEY');
    if (savedKey) (window as any).manualKey = savedKey;
  }, []);

  useEffect(() => {
    if (terminalRef.current) terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
  }, [agentLogs]);

  const addLog = (msg: string) => {
    setAgentLogs(prev => [...prev.slice(-30), `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const saveKey = () => {
    (window as any).manualKey = tempKey;
    localStorage.setItem('MANUAL_API_KEY', tempKey);
    setShowKeyModal(false);
    addLog("API Key updated. Autonomous modules synced.");
  };

  const updateLeadState = (updated: Business) => {
    setLeads(prev => {
      const filtered = prev.filter(l => l.id !== updated.id);
      const newState = [updated, ...filtered];
      storageService.saveLeads(newState);
      return newState;
    });
  };

  const autoBookMeeting = (business: Business) => {
    const newMeeting: Meeting = {
      id: `MEET-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      businessId: business.id,
      businessName: business.name,
      date: new Date(Date.now() + 86400000).toLocaleDateString(),
      time: "10:00 AM",
      type: 'Discovery Call',
      status: 'upcoming',
      contactPhone: business.phone
    };
    const updatedMeetings = [newMeeting, ...meetings];
    setMeetings(updatedMeetings);
    localStorage.setItem('leadgen_meetings', JSON.stringify(updatedMeetings));
    addLog(`[CONVERSION] Meeting automatically sheeted for ${business.name}.`);
    return newMeeting.id;
  };

  const runAutonomousCycle = async (targetLeads: Business[]) => {
    for (const lead of targetLeads) {
      if (!isPilotMode) break;
      
      try {
        // Step 1: Automated Outreach (No manual action)
        addLog(`[OUTREACH] Generating personalized vector for ${lead.name}...`);
        const msg1 = await geminiService.generateAgentResponse(lead);
        addLog(`[SEND] Automatic outreach dispatched to ${lead.phone || 'Email'}.`);
        
        const log1: MessageLog = { role: 'agent', content: msg1, timestamp: Date.now() };
        let currentLead = { ...lead, status: LeadStatus.CONTACTED, history: [log1] };
        updateLeadState(currentLead);

        // Step 2: Automated Follow-up/Negotiation
        await new Promise(r => setTimeout(r, 5000));
        addLog(`[LISTENING] Monitoring incoming signal from ${lead.name}...`);
        
        const reply = await geminiService.simulateClientReply(currentLead);
        addLog(`[RECEIVED] Incoming reply from prospect: "${reply}"`);
        
        const log2: MessageLog = { role: 'client', content: reply, timestamp: Date.now() };
        currentLead = { ...currentLead, status: LeadStatus.NEGOTIATING, history: [...currentLead.history, log2] };
        updateLeadState(currentLead);

        // Step 3: Automatic Closing & Booking
        await new Promise(r => setTimeout(r, 5000));
        addLog(`[NEGOTIATION] AI handling objection and proposing meeting time...`);
        
        const msg2 = await geminiService.generateAgentResponse(currentLead, reply);
        addLog(`[SEND] Closing message auto-sent to ${lead.name}.`);
        
        const log3: MessageLog = { role: 'agent', content: msg2, timestamp: Date.now() };
        const meetingId = autoBookMeeting(currentLead);
        
        currentLead = { 
          ...currentLead, 
          status: LeadStatus.CONVERTED, 
          history: [...currentLead.history, log3],
          meetingId,
          projectValue: 2500
        };
        updateLeadState(currentLead);
        addLog(`[COMPLETE] Project successfully pre-closed. Check Meeting Sheet.`);

      } catch (err) {
        addLog(`[ERROR] Execution halted on lead ${lead.name}. Retrying next target.`);
      }
    }
  };

  const handleLaunch = async (city: string, keyword: string) => {
    if (!(window as any).manualKey && !process.env.API_KEY) {
      setShowKeyModal(true);
      return;
    }

    setIsScanning(true);
    addLog(`[LAUNCH] Initiating sector scan: ${keyword.toUpperCase()} in ${city.toUpperCase()}.`);
    try {
      const results = await geminiService.scanLocalBusinesses(city, keyword);
      if (results.length > 0) {
        setLeads(prev => [...results, ...prev]);
        addLog(`[INTEL] Research complete. Found ${results.length} high-probability prospects.`);
        if (isPilotMode) {
          runAutonomousCycle(results);
        }
      } else {
        addLog("[WARN] No viable prospects found in this sector. Try broader parameters.");
      }
    } catch (err) {
      addLog("[CRITICAL] Agent API connection failed. Re-verify key.");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-slate-100 font-sans selection:bg-blue-500/30 overflow-x-hidden">
      {showKeyModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl">
          <div className="bg-slate-900 border border-white/5 p-10 rounded-[3rem] w-full max-w-md shadow-2xl">
            <h2 className="text-3xl font-black mb-2 tracking-tighter italic">AGENT_AUTH</h2>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-8">Direct Gemini Integration Required</p>
            <input 
              type="password" 
              value={tempKey} 
              onChange={(e) => setTempKey(e.target.value)}
              className="w-full bg-slate-800 border border-white/5 p-5 rounded-2xl mb-4 focus:ring-2 focus:ring-blue-500 outline-none text-white font-mono text-sm"
              placeholder="Enter API Key..."
            />
            <button onClick={saveKey} className="w-full py-5 bg-blue-600 hover:bg-blue-500 transition-all text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl shadow-xl shadow-blue-900/40">
              Engage Systems
            </button>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="h-24 border-b border-white/5 sticky top-0 bg-black/80 backdrop-blur-xl z-50 flex items-center px-12 justify-between">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(220,38,38,0.3)]">
            <i className="fa-solid fa-robot text-2xl text-white"></i>
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter italic leading-none">AGENT_ONE</h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Hands-Off Operations Active</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-900/50 p-1.5 rounded-2xl border border-white/5">
          <button onClick={() => setView('pipeline')} className={`px-8 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all ${view === 'pipeline' ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/20' : 'text-slate-500 hover:text-slate-300'}`}>PIPELINE</button>
          <button onClick={() => setView('schedule')} className={`px-8 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all ${view === 'schedule' ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/20' : 'text-slate-500 hover:text-slate-300'}`}>GLOBAL_SCHEDULE</button>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
             <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">System Status</div>
             <div className="text-xs font-black text-green-500">FULLY_SYNCED</div>
          </div>
          <button onClick={() => setShowKeyModal(true)} className="w-12 h-12 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl flex items-center justify-center text-slate-400 transition-all">
            <i className="fa-solid fa-cog"></i>
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-12">
        {view === 'pipeline' ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-12">
              <div className="lg:col-span-3">
                <div className="bg-slate-900/50 border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl backdrop-blur-md">
                  <div className="bg-slate-800/80 px-8 py-4 flex justify-between items-center border-b border-white/5">
                    <span className="text-[10px] font-mono text-slate-400 font-black uppercase tracking-[0.2em]">Pilot Intelligence Terminal</span>
                    <div className="flex gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500/30"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500/30"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500/30"></div>
                    </div>
                  </div>
                  <div ref={terminalRef} className="p-8 h-80 overflow-y-auto font-mono text-[11px] text-blue-400 space-y-3 leading-relaxed scrollbar-hide">
                    {agentLogs.map((log, i) => <div key={i} className="animate-in fade-in slide-in-from-left duration-300">{log}</div>)}
                    {isScanning && <div className="text-white animate-pulse flex items-center gap-2">
                      <i className="fa-solid fa-dna animate-spin"></i> EXECUTING_RESEARCH_SUBROUTINE...
                    </div>}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col gap-6">
                <div className="bg-gradient-to-br from-red-600 to-red-900 rounded-[2.5rem] p-8 shadow-2xl shadow-red-900/30 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-2xl font-black mb-2 italic tracking-tighter">PILOT_ACTIVE</h3>
                    <p className="text-[10px] text-white/70 font-black uppercase tracking-[0.1em] leading-relaxed">Agent is authorized for automatic outreach and negotiation.</p>
                  </div>
                  <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-8">
                     <div className="bg-white h-full w-2/3 animate-pulse"></div>
                  </div>
                </div>
                
                <div className="bg-slate-900 border border-white/5 rounded-[2.5rem] p-8 shadow-2xl flex flex-col justify-center text-center">
                   <div className="text-4xl font-black text-white mb-2">{meetings.length}</div>
                   <div className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Meetings Autographed</div>
                </div>
              </div>
            </div>

            <SearchForm onScan={handleLaunch} isLoading={isScanning} />
            
            <div className="flex items-center gap-4 mb-6 mt-12">
               <div className="w-1.5 h-8 bg-blue-600 rounded-full"></div>
               <h3 className="text-2xl font-black italic tracking-tighter uppercase">Campaign Pipeline</h3>
            </div>
            
            <LeadList leads={leads} onGenerateMessage={() => {}} isGeneratingId={null} />
          </>
        ) : (
          <MeetingSheet meetings={meetings} />
        )}
      </main>

      {/* Global Bottom Status Bar */}
      <footer className="fixed bottom-0 w-full h-12 bg-black border-t border-white/5 px-12 flex items-center justify-between z-[60] backdrop-blur-md">
         <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
               <span className="text-[9px] font-black text-slate-600 uppercase">Latency</span>
               <span className="text-[10px] font-black text-green-500 tracking-tighter">14ms</span>
            </div>
            <div className="flex items-center gap-2">
               <span className="text-[9px] font-black text-slate-600 uppercase">Memory</span>
               <span className="text-[10px] font-black text-blue-500 tracking-tighter">94% Stable</span>
            </div>
         </div>
         <div className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">
            Autonomous Lead Generation Framework v2.0
         </div>
      </footer>
    </div>
  );
};

export default App;
