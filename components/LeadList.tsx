
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
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-green-500/20 text-green-400 border border-green-500/30">CLOSED</span>;
      case LeadStatus.NEGOTIATING:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-500/20 text-blue-400 border border-blue-500/30">NEGOTIATING</span>;
      case LeadStatus.CONTACTED:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-slate-500/20 text-slate-400 border border-slate-500/30">SENT</span>;
      case LeadStatus.DISCOVERED:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/30">DISCOVERED</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-400 uppercase">{status}</span>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden backdrop-blur-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 border-b border-white/10">
              <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Prospect</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Presence</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Stage</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Intelligence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {leads.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-20 text-center text-slate-500 font-medium">
                  Waiting for campaign launch...
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-white/5 transition-colors cursor-pointer" onClick={() => setSelectedLead(lead)}>
                  <td className="px-6 py-4">
                    <div className="font-bold text-sm text-slate-100">{lead.name}</div>
                    <div className="text-[10px] opacity-50 uppercase font-bold tracking-widest text-slate-300">{lead.city} • {lead.phone}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {lead.website ? (
                        <span className="text-blue-400 text-xs font-bold underline decoration-blue-400/30 underline-offset-4">Active Site</span>
                      ) : (
                        <span className="text-red-400 text-xs font-bold">No Presence</span>
                      )}
                      {lead.mapsUrl && (
                        <a 
                          href={lead.mapsUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-slate-400 hover:text-white transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <i className="fa-solid fa-map-location-dot"></i>
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(lead.status)}
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-[10px] font-black text-white/40 hover:text-white uppercase tracking-widest flex items-center gap-2">
                       <i className="fa-solid fa-message"></i>
                       {lead.history.length} Logs
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
           <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedLead(null)}></div>
           <div className="relative w-full max-w-md bg-slate-900 border-l border-white/10 p-8 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
              <div className="flex justify-between items-start mb-8">
                 <div>
                    <h2 className="text-2xl font-black text-white leading-tight mb-1">{selectedLead.name}</h2>
                    <p className="text-xs text-slate-500 uppercase font-black tracking-widest">{selectedLead.city} Pipeline</p>
                    {selectedLead.mapsUrl && (
                      <a 
                        href={selectedLead.mapsUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="inline-flex items-center gap-2 mt-3 px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full text-[10px] font-bold uppercase tracking-widest border border-blue-500/20 hover:bg-blue-500/20 transition-all"
                      >
                        <i className="fa-solid fa-arrow-up-right-from-square"></i>
                        Grounding Source
                      </a>
                    )}
                 </div>
                 <button onClick={() => setSelectedLead(null)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 text-white">
                    <i className="fa-solid fa-xmark"></i>
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-6 pr-2">
                 {selectedLead.history.length === 0 ? (
                    <div className="text-center py-20 opacity-20">
                       <i className="fa-solid fa-robot text-4xl mb-4 text-white"></i>
                       <p className="text-xs font-bold uppercase tracking-widest text-white">No communication yet</p>
                    </div>
                 ) : (
                    selectedLead.history.map((msg, i) => (
                       <div key={i} className={`flex flex-col ${msg.role === 'agent' ? 'items-end' : 'items-start'}`}>
                          <div className={`max-w-[85%] p-4 rounded-2xl text-sm ${
                             msg.role === 'agent' 
                             ? 'bg-blue-600 text-white rounded-tr-none' 
                             : 'bg-slate-800 text-slate-100 rounded-tl-none border border-white/5'
                          }`}>
                             {msg.content}
                          </div>
                          <span className="text-[9px] font-black uppercase text-slate-600 mt-2 tracking-widest">
                             {msg.role === 'agent' ? 'AI Agent' : 'Business Owner'} • {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                       </div>
                    ))
                 )}
              </div>

              <div className="mt-8 p-4 bg-slate-800/50 rounded-2xl border border-white/5">
                 <div className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-slate-400">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    Agent thinking...
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
