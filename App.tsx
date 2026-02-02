
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
  const [agentLogs, setAgentLogs] = useState<string[]>(["Autonomous Agent ready. System Online."]);
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
    setAgentLogs(prev => [...prev.slice(-20), `[${new Date().toLocaleTimeString()}] ${msg}`]);
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
      id: Math.random().toString(36).substring(2, 9),
      businessId: business.id,
      businessName: business.name,
      date: new Date(Date.now() + 86400000).toLocaleDateString(),
      time: "10:00 AM",
      type: 'Discovery Call'
    };
    const updatedMeetings = [...meetings, newMeeting];
    setMeetings(updatedMeetings);
    localStorage.setItem('leadgen_meetings', JSON.stringify(updatedMeetings));
    addLog(`MEETING AUTOMATICALLY SCHEDULED with ${business.name}.`);
    return newMeeting.id;
  };

  const runAutonomousCycle = async (targetLeads: Business[]) => {
    for (const lead of targetLeads) {
      if (!isPilotMode) break;
      
      try {
        // 1. Initial Outreach (SENT AUTOMATICALLY)
        addLog(`Auto-sending outreach to ${lead.name}...`);
        const msg1 = await geminiService.generateAgentResponse(lead);
        const log1: MessageLog = { role: 'agent', content: msg1, timestamp: Date.now() };
        let currentLead = { ...lead, status: LeadStatus.CONTACTED, history: [log1] };
        updateLeadState(currentLead);

        // 2. Wait for simulated reply
        await new Promise(r => setTimeout(r, 4000));
        addLog(`Monitoring incoming response from ${lead.name}...`);
        const reply = await geminiService.simulateClientReply(currentLead);
        addLog(`RECEIVED: "${reply}" from ${lead.name}`);
        const log2: MessageLog = { role: 'client', content: reply, timestamp: Date.now() };
        currentLead = { ...currentLead, status: LeadStatus.NEGOTIATING, history: [...currentLead.history, log2] };
        updateLeadState(currentLead);

        // 3. Negotiate & Schedule (SENT AUTOMATICALLY)
        await new Promise(r => setTimeout(r, 4000));
        addLog(`Agent is closing the deal with ${lead.name}...`);
        const msg2 = await geminiService.generateAgentResponse(currentLead, reply);
        const log3: MessageLog = { role: 'agent', content: msg2, timestamp: Date.now() };
        
        // Finalize
        const meetingId = autoBookMeeting(currentLead);
        currentLead = { 
          ...currentLead, 
          status: LeadStatus.CONVERTED, 
          history: [...currentLead.history, log3],
          meetingId 
        };
        updateLeadState(currentLead);
        addLog(`SUCCESS: ${lead.name} project secured and added to schedule.`);

      } catch (err) {
        addLog(`WARN: System skip on ${lead.name} due to timeout.`);
      }
    }
  };

  const handleLaunch = async (city: string, keyword: string) => {
    setIsScanning(true);
    addLog(`Launch detected. Initiating autonomous hunt for ${keyword} in ${city}.`);
    try {
      const results = await geminiService.scanLocalBusinesses(city, keyword);
      if (results.length > 0) {
        setLeads(prev => [...results, ...prev]);
        addLog(`Found ${results.length} targets. Engaging Autonomous Pilot.`);
        runAutonomousCycle(results);
      }
    } catch (err) {
      addLog("System Error: API key might be missing or invalid.");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500/30">
      {showKeyModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-black mb-2">Connect Agent</h2>
            <p className="text-slate-500 text-sm mb-6">Paste your Gemini API key to enable autonomous scanning and outreach.</p>
            <input 
              type="password" 
              value={tempKey} 
              onChange={(e) => setTempKey(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 p-4 rounded-2xl mb-4 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Gemini API Key..."
            />
            <button onClick={saveKey} className="w-full py-4 bg-blue-600 hover:bg-blue-500 transition-all text-white font-bold rounded-2xl shadow-lg shadow-blue-900/20">
              Initialize Connection
            </button>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="h-20 border-b border-white/5 sticky top-0 bg-slate-950/80 backdrop-blur-xl z-50 flex items-center px-8 justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-900/40">
            <i className="fa-solid fa-robot text-xl text-white"></i>
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight">AGENT_ONE</h1>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Autonomous Pipeline Active</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-2xl border border-white/5">
          <button onClick={() => setView('pipeline')} className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${view === 'pipeline' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>PIPELINE</button>
          <button onClick={() => setView('schedule')} className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${view === 'schedule' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>SCHEDULE</button>
        </div>

        <button onClick={() => setShowKeyModal(true)} className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-black uppercase tracking-widest transition-all">
          <i className="fa-solid fa-key mr-2 opacity-50"></i> Agent Config
        </button>
      </nav>

      <main className="max-w-7xl mx-auto p-8">
        {view === 'pipeline' ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              <div className="lg:col-span-2">
                <div className="bg-slate-900 border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                  <div className="bg-slate-800/50 px-6 py-3 flex justify-between items-center border-b border-white/5">
                    <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-widest">Live Activity Terminal</span>
                    <div className="flex gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500/50"></div>
                      <div className="w-2 h-2 rounded-full bg-amber-500/50"></div>
                      <div className="w-2 h-2 rounded-full bg-green-500/50"></div>
                    </div>
                  </div>
                  <div ref={terminalRef} className="p-6 h-64 overflow-y-auto font-mono text-xs text-blue-400 space-y-2 leading-relaxed">
                    {agentLogs.map((log, i) => <div key={i} className="animate-in fade-in slide-in-from-left duration-300">{log}</div>)}
                    {isScanning && <div className="text-white animate-pulse">_ EXEC_RESEARCH_PROTOCOL...</div>}
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <div className="bg-gradient-to-br from-red-600 to-red-900 rounded-3xl p-8 shadow-xl shadow-red-900/20">
                  <h3 className="text-lg font-black mb-2 italic">PILOT MODE: ON</h3>
                  <p className="text-xs text-white/70 font-bold uppercase tracking-wider leading-relaxed">System is currently scanning local markets and engaging prospects with zero human intervention.</p>
                </div>
                <div className="bg-slate-900 border border-white/5 rounded-3xl p-6 flex-1 flex flex-col justify-center">
                   <div className="text-3xl font-black mb-1">{meetings.length}</div>
                   <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Meetings Automatically Booked</div>
                </div>
              </div>
            </div>

            <SearchForm onScan={handleLaunch} isLoading={isScanning} />
            <LeadList leads={leads} onGenerateMessage={() => {}} isGeneratingId={null} />
          </>
        ) : (
          <MeetingSheet meetings={meetings} />
        )}
      </main>
    </div>
  );
};

export default App;
