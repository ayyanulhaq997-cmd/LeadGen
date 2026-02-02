
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
  const [agentLogs, setAgentLogs] = useState<string[]>(["[SYSTEM] Agent One Online.", "[SYSTEM] Mode: Fully Autonomous Outreach."]);
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
    addLog("API Connection Re-established.");
  };

  const updateLeadState = (updated: Business) => {
    setLeads(prev => {
      const filtered = prev.filter(l => l.id !== updated.id);
      const newState = [updated, ...filtered];
      storageService.saveLeads(newState);
      return newState;
    });
  };

  const bookMeeting = (business: Business) => {
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
    addLog(`[BOOKED] Meeting confirmed for ${business.name}.`);
    return newMeeting.id;
  };

  // Step 1: Outreach is 100% automatic after scan
  const runAutoOutreach = async (targetLeads: Business[]) => {
    for (const lead of targetLeads) {
      try {
        addLog(`[AUTO-OUTREACH] Dispatched to ${lead.name}...`);
        const message = await geminiService.generateAgentResponse(lead);
        const log: MessageLog = { role: 'agent', content: message, timestamp: Date.now() };
        const updated = { ...lead, status: LeadStatus.CONTACTED, history: [log] };
        updateLeadState(updated);
        addLog(`[WAITING] Awaiting Manager reply for ${lead.name}.`);
      } catch (err) {
        addLog(`[ERROR] Outreach failed for ${lead.name}.`);
      }
    }
  };

  // Step 2: Handle incoming Manager reply (Demo simulation or manual entry)
  const handleManagerReply = async (leadId: string, content: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    addLog(`[INCOMING] Message from ${lead.name}: "${content}"`);
    const replyLog: MessageLog = { role: 'client', content, timestamp: Date.now() };
    const updatedLead = { ...lead, status: LeadStatus.NEGOTIATING, history: [...lead.history, replyLog] };
    updateLeadState(updatedLead);

    // Step 3: AI automatically replies to the manager
    addLog(`[AUTO-REPLY] Agent is analyzing manager's response...`);
    try {
      const agentMsg = await geminiService.generateAgentResponse(updatedLead, content);
      const agentLog: MessageLog = { role: 'agent', content: agentMsg, timestamp: Date.now() };
      
      let finalStatus = LeadStatus.NEGOTIATING;
      let meetingId = undefined;

      // Logic: If AI suggested a time or agreed, and it was positive, we book it
      if (agentMsg.toLowerCase().includes("tomorrow") || agentMsg.toLowerCase().includes("call")) {
         finalStatus = LeadStatus.CONVERTED;
         meetingId = bookMeeting(updatedLead);
      }

      const finalizedLead = { 
        ...updatedLead, 
        status: finalStatus, 
        history: [...updatedLead.history, agentLog],
        meetingId,
        projectValue: 2500
      };
      updateLeadState(finalizedLead);
      addLog(`[SENT] Auto-reply dispatched to ${lead.name}.`);
    } catch (err) {
      addLog(`[ERROR] Auto-reply system failed for ${lead.name}.`);
    }
  };

  const handleLaunch = async (city: string, keyword: string) => {
    if (!(window as any).manualKey && !process.env.API_KEY) {
      setShowKeyModal(true);
      return;
    }
    setIsScanning(true);
    addLog(`[SCAN] Finding targets for ${keyword} in ${city}...`);
    try {
      const results = await geminiService.scanLocalBusinesses(city, keyword);
      if (results.length > 0) {
        setLeads(prev => [...results, ...prev]);
        addLog(`[SUCCESS] ${results.length} leads found. Engaging Auto-Outreach.`);
        runAutoOutreach(results);
      }
    } catch (err) {
      addLog("[CRITICAL] API Error. Check Config.");
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
            <input 
              type="password" 
              value={tempKey} 
              onChange={(e) => setTempKey(e.target.value)}
              className="w-full bg-slate-800 border border-white/5 p-5 rounded-2xl mb-4 focus:ring-2 focus:ring-blue-500 outline-none text-white font-mono text-sm"
              placeholder="Gemini API Key..."
            />
            <button onClick={saveKey} className="w-full py-5 bg-blue-600 hover:bg-blue-500 transition-all text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl shadow-xl shadow-blue-900/40">
              Initialize
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
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Fully Automatic Outreach Active</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-900/50 p-1.5 rounded-2xl border border-white/5">
          <button onClick={() => setView('pipeline')} className={`px-8 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all ${view === 'pipeline' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>PIPELINE</button>
          <button onClick={() => setView('schedule')} className={`px-8 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all ${view === 'schedule' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>GLOBAL_SCHEDULE</button>
        </div>

        <button onClick={() => setShowKeyModal(true)} className="w-12 h-12 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl flex items-center justify-center text-slate-400 transition-all">
          <i className="fa-solid fa-cog"></i>
        </button>
      </nav>

      <main className="max-w-7xl mx-auto p-12">
        {view === 'pipeline' ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-12">
              <div className="lg:col-span-3">
                <div className="bg-slate-900/50 border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl backdrop-blur-md">
                  <div className="bg-slate-800/80 px-8 py-4 flex justify-between items-center border-b border-white/5">
                    <span className="text-[10px] font-mono text-slate-400 font-black uppercase tracking-[0.2em]">Live Agent Logs</span>
                  </div>
                  <div ref={terminalRef} className="p-8 h-64 overflow-y-auto font-mono text-[11px] text-blue-400 space-y-3 leading-relaxed scrollbar-hide">
                    {agentLogs.map((log, i) => <div key={i}>{log}</div>)}
                    {isScanning && <div className="text-white animate-pulse">_ SCANNING_SECTOR...</div>}
                  </div>
                </div>
              </div>
              <div className="bg-slate-900 border border-white/5 rounded-[2.5rem] p-8 shadow-2xl flex flex-col justify-center text-center">
                   <div className="text-4xl font-black text-white mb-2">{meetings.length}</div>
                   <div className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Booked Today</div>
              </div>
            </div>

            <SearchForm onScan={handleLaunch} isLoading={isScanning} />
            
            <LeadList 
              leads={leads} 
              onManagerReply={handleManagerReply} 
            />
          </>
        ) : (
          <MeetingSheet meetings={meetings} />
        )}
      </main>

      <footer className="fixed bottom-0 w-full h-12 bg-black border-t border-white/5 px-12 flex items-center justify-between z-[60] backdrop-blur-md">
         <div className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">
            Autonomous Sales Pipeline v2.1 • Awaiting Manager Responses
         </div>
      </footer>
    </div>
  );
};

export default App;
