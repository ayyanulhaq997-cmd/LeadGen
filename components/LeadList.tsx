
import React from 'react';
import { Business, LeadStatus } from '../types.ts';

interface LeadListProps {
  leads: Business[];
  onGenerateMessage: (id: string) => void;
  isGeneratingId: string | null;
}

export const LeadList: React.FC<LeadListProps> = ({ leads, onGenerateMessage, isGeneratingId }) => {
  const getStatusBadge = (status: LeadStatus) => {
    switch (status) {
      case LeadStatus.HOT:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">HOT</span>;
      case LeadStatus.WARM:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">WARM</span>;
      case LeadStatus.COLD:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">COLD</span>;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Business Info</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Online Presence</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {leads.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                  <i className="fa-solid fa-box-open text-4xl mb-3 block"></i>
                  No leads found yet. Start scanning above!
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900">{lead.name}</div>
                    <div className="text-xs text-slate-500">{lead.city}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <i className="fa-solid fa-phone text-xs opacity-50"></i>
                      {lead.phone}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {lead.website ? (
                      <a href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1 font-medium mb-1">
                        <i className="fa-solid fa-link text-[10px]"></i>
                        {lead.website.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                      </a>
                    ) : (
                      <span className="text-slate-400 italic block mb-1">No Website</span>
                    )}
                    {lead.mapsUrl && (
                      <a href={lead.mapsUrl} target="_blank" rel="noreferrer" className="text-[10px] text-slate-500 hover:text-blue-600 flex items-center gap-1 mt-1 transition-colors">
                        <i className="fa-solid fa-globe"></i>
                        View Search Source
                      </a>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(lead.status)}
                  </td>
                  <td className="px-6 py-4">
                    {lead.message ? (
                      <button 
                        onClick={() => alert(`Outreach Message:\n\n${lead.message}`)}
                        className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded hover:bg-green-100 transition-all border border-green-200 flex items-center gap-2"
                      >
                        <i className="fa-solid fa-eye"></i> View Message
                      </button>
                    ) : (
                      <button
                        onClick={() => onGenerateMessage(lead.id)}
                        disabled={isGeneratingId === lead.id}
                        className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded hover:bg-blue-100 transition-all border border-blue-200 flex items-center gap-2"
                      >
                        {isGeneratingId === lead.id ? (
                          <i className="fa-solid fa-circle-notch animate-spin"></i>
                        ) : (
                          <i className="fa-solid fa-wand-magic-sparkles"></i>
                        )}
                        Gen AI Message
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
