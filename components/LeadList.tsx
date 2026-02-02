
import React, { useState } from 'react';
import { Business, LeadStatus } from '../types.ts';

interface LeadListProps {
  leads: Business[];
  onGenerateMessage: (id: string) => void;
  isGeneratingId: string | null;
}

export const LeadList: React.FC<LeadListProps> = ({ leads }) => {
  const [selectedLead, setSelectedLead] = useState<Business | null>(null);

  const getStatusBadge = (status: LeadStatus) => {
    switch (status) {
      case LeadStatus.CONVERTED:
        return <span className="px-3 py-1 rounded-full text-[9px] font-black bg-green-500/10 text-green-500 border border-green-500/30 uppercase tracking-widest">Pre-Closed</span>;
      case LeadStatus.NEGOTIATING:
        return <span className="px-3 py-1 rounded-full text-[9px] font-black bg-blue-500/10 text-blue-500 border border-blue-500/30 uppercase tracking-widest">Negotiating</span>;
      case LeadStatus.CONTACTED:
        return <span className="px-3 py-1 rounded-full text-[9px] font-black bg-slate-500/10 text-slate-400 border border-slate-500/30 uppercase tracking-widest">Outreach Sent</span>;
      case LeadStatus.DISCOVERED:
        return <span className="px-3 py-1 rounded-full text-[9px] font-black bg-amber-500/10 text-amber-500 border border-amber-500/30 uppercase tracking-widest">Discovered</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-[9px] font-black bg-slate-800 text-slate-500 uppercase tracking-widest">{status}</span>;
    }
  };

  return (
    <div className="space-y-4 pb-20">
      <div className="bg-slate-900/40 rounded-[2.5rem] border border-white/5 overflow-hidden backdrop-blur-md shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 border-b border-white/10">
              <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Target Intel</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Presence Index</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Deployment Stage</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Ledger</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {leads.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-8 py-24 text-center text-slate-600 font-bold uppercase tracking-widest text-xs opacity-50">
                  <i className="fa-solid fa-radar text-4xl mb-4 block animate-pulse"></i>
                  System ready for sector deployment...
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-white/5 transition-all cursor-pointer group" onClick={() => setSelectedLead(lead)}>
                  <td className="px-8 py-6">
                    <div className="font-black text-white text-base tracking-tight mb-0.5">{lead.name}</div>
                    <div className="text-[10px] opacity-40 uppercase font-black tracking-widest text-slate-400">{lead.city} • {lead.phone}</div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      {lead.website ? (
                        <span className="text-blue-400 text-[10px] font-black uppercase tracking-widest bg-blue-400/10 px-3 py-1 rounded-lg">Active Domain</span>
                      ) : (
                        <span className="text-red-500 text-[10px] font-black uppercase tracking-widest bg-red-500/10 px-3 py-1 rounded-lg">Null Presence</span>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      {getStatusBadge(lead.status)}
                      {lead.status === LeadStatus.CONVERTED && (
                        <i className="fa-solid fa-calendar-check text-green-500 animate-bounce"></i>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <button className="text-[10px] font-black text-slate-500 group-hover:text-blue-400 uppercase tracking-widest flex items-center gap-3 transition-colors">
                       <i className="fa-solid fa-code-branch text-xs opacity-30 group-hover:opacity-100"></i>
                       {lead.history.length} Events
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Slide-over Conversation Viewer */}
      {selectedLead && (
        <div className="fixed inset-0 z-[100] flex justify-end">
           <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setSelectedLead(null)}></div>
           <div className="relative w-full max-w-lg bg-black border-l border-white/5 p-12 flex flex-col shadow-2xl animate-in slide-in-from-right duration-500">
              <div className="flex justify-between items-start mb-10">
                 <div>
                    <h2 className="text-3xl font-black text-white leading-none italic tracking-tighter mb-2">{selectedLead.name}</h2>
                    <div className="flex items-center gap-3">
                       <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{selectedLead.city} Sector</span>
                       {selectedLead.meetingId && (
                         <span className="px-3 py-1 bg-green-500 text-black text-[9px] font-black rounded-full uppercase tracking-widest">Meeting Booked</span>
                       )}
                    </div>
                 </div>
                 <button onClick={() => setSelectedLead(null)} className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-white/10 text-white transition-all">
                    <i className="fa-solid fa-xmark"></i>
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-8 pr-4 scrollbar-hide">
                 {selectedLead.history.length === 0 ? (
                    <div className="text-center py-20 opacity-10">
                       <i className="fa-solid fa-user-secret text-6xl mb-6 text-white"></i>
                       <p className="text-[10px] font-black uppercase tracking-widest text-white">Awaiting Pilot Engagement</p>
                    </div>
                 ) : (
                    selectedLead.history.map((msg, i) => (
                       <div key={i} className={`flex flex-col ${msg.role === 'agent' ? 'items-end' : 'items-start'}`}>
                          <div className={`max-w-[90%] p-6 rounded-3xl text-xs font-medium leading-relaxed ${
                             msg.role === 'agent' 
                             ? 'bg-blue-600 text-white rounded-tr-none shadow-xl shadow-blue-900/20' 
                             : 'bg-slate-900 text-slate-200 rounded-tl-none border border-white/5'
                          }`}>
                             {msg.content}
                          </div>
                          <span className="text-[9px] font-black uppercase text-slate-600 mt-3 tracking-widest">
                             {msg.role === 'agent' ? 'Autonomous Pilot' : 'Prospect'} • {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                       </div>
                    ))
                 )}
              </div>

              {selectedLead.status === LeadStatus.CONVERTED && (
                <div className="mt-10 p-6 bg-green-500/10 rounded-3xl border border-green-500/20">
                   <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-green-500">
                      <i className="fa-solid fa-handshake"></i>
                      Project Secured & Schedule Sync Complete
                   </div>
                   <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2">Value Estimated: $2,500.00 USD</p>
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};
