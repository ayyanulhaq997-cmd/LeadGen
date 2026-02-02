
import React, { useState } from 'react';
import { Business, LeadStatus } from '../types.ts';

interface LeadListProps {
  leads: Business[];
  onManagerReply: (id: string, content: string) => void;
}

export const LeadList: React.FC<LeadListProps> = ({ leads, onManagerReply }) => {
  const [selectedLead, setSelectedLead] = useState<Business | null>(null);
  const [managerInput, setManagerInput] = useState('');

  const handleSendReply = () => {
    if (selectedLead && managerInput.trim()) {
      onManagerReply(selectedLead.id, managerInput.trim());
      setManagerInput('');
    }
  };

  const getStatusBadge = (status: LeadStatus) => {
    switch (status) {
      case LeadStatus.CONVERTED:
        return <span className="px-3 py-1 rounded-full text-[9px] font-black bg-green-500/10 text-green-500 border border-green-500/30 uppercase tracking-widest">Closed</span>;
      case LeadStatus.NEGOTIATING:
        return <span className="px-3 py-1 rounded-full text-[9px] font-black bg-blue-500/10 text-blue-500 border border-blue-500/30 uppercase tracking-widest">In Chat</span>;
      case LeadStatus.CONTACTED:
        return <span className="px-3 py-1 rounded-full text-[9px] font-black bg-slate-500/10 text-slate-400 border border-slate-500/30 uppercase tracking-widest">Sent</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-[9px] font-black bg-slate-800 text-slate-500 uppercase tracking-widest">New</span>;
    }
  };

  return (
    <div className="space-y-4 pb-20 mt-12">
      <div className="bg-slate-900/40 rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-white/5 border-b border-white/10">
              <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Business</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Stage</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {leads.map((lead) => (
              <tr key={lead.id} className="hover:bg-white/5 transition-all cursor-pointer group" onClick={() => setSelectedLead(lead)}>
                <td className="px-8 py-6">
                  <div className="font-black text-white text-base tracking-tight">{lead.name}</div>
                  <div className="text-[10px] opacity-40 uppercase font-black tracking-widest text-slate-400">{lead.city} • {lead.phone}</div>
                </td>
                <td className="px-8 py-6">{getStatusBadge(lead.status)}</td>
                <td className="px-8 py-6">
                  <button className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
                     Open Pipeline <i className="fa-solid fa-arrow-right"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedLead && (
        <div className="fixed inset-0 z-[100] flex justify-end">
           <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setSelectedLead(null)}></div>
           <div className="relative w-full max-w-lg bg-black border-l border-white/5 p-12 flex flex-col shadow-2xl animate-in slide-in-from-right duration-500">
              <div className="flex justify-between items-start mb-10">
                 <div>
                    <h2 className="text-3xl font-black text-white italic tracking-tighter mb-2">{selectedLead.name}</h2>
                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Direct Conversation History</p>
                 </div>
                 <button onClick={() => setSelectedLead(null)} className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white"><i className="fa-solid fa-xmark"></i></button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-6 pr-4 scrollbar-hide">
                 {selectedLead.history.map((msg, i) => (
                    <div key={i} className={`flex flex-col ${msg.role === 'agent' ? 'items-end' : 'items-start'}`}>
                       <div className={`max-w-[90%] p-5 rounded-3xl text-xs ${
                          msg.role === 'agent' 
                          ? 'bg-blue-600 text-white rounded-tr-none' 
                          : 'bg-slate-900 text-slate-200 rounded-tl-none border border-white/5'
                       }`}>
                          {msg.content}
                       </div>
                       <span className="text-[9px] font-black uppercase text-slate-600 mt-2 tracking-widest">
                          {msg.role === 'agent' ? 'Your AI Sales Agent' : 'Manager @ Hotel/Restaurant'}
                       </span>
                    </div>
                 ))}
              </div>

              {/* Manager Response Simulation/Entry */}
              <div className="mt-10 pt-8 border-t border-white/5">
                 <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Input Manager Response</label>
                 <div className="flex gap-4">
                    <input 
                       type="text" 
                       value={managerInput} 
                       onChange={(e) => setManagerInput(e.target.value)}
                       placeholder="What did the manager say? (e.g. 'How much?')"
                       className="flex-1 bg-slate-900 border border-white/10 p-4 rounded-2xl text-xs outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <button 
                       onClick={handleSendReply}
                       className="px-6 bg-white text-black font-black uppercase text-[10px] rounded-2xl hover:bg-slate-200"
                    >
                       Receive
                    </button>
                 </div>
                 <p className="text-[9px] text-slate-600 font-bold mt-4 uppercase tracking-widest italic">
                    Note: Once you input the manager's response, Agent One will automatically reply.
                 </p>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
