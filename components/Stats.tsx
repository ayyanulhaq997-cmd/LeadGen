
import React from 'react';
import { Business, LeadStatus } from '../types.ts';

interface StatsProps {
  leads: Business[];
}

const colorMap: Record<string, { bg: string, text: string }> = {
  blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-600' },
  yellow: { bg: 'bg-yellow-100', text: 'text-yellow-600' },
  green: { bg: 'bg-green-100', text: 'text-green-600' },
};

export const Stats: React.FC<StatsProps> = ({ leads }) => {
  const today = new Date().setHours(0, 0, 0, 0);
  const foundToday = leads.filter(l => l.timestamp >= today).length;
  const hotLeads = leads.filter(l => l.status === LeadStatus.HOT).length;
  const warmLeads = leads.filter(l => l.status === LeadStatus.WARM).length;
  const messagesGenerated = leads.filter(l => l.message).length;

  const cards = [
    { label: 'Total Found Today', value: foundToday, icon: 'fa-search', color: 'blue' },
    { label: 'Hot Leads', value: hotLeads, icon: 'fa-fire', color: 'orange' },
    { label: 'Warm Leads', value: warmLeads, icon: 'fa-bolt', color: 'yellow' },
    { label: 'Messages Sent', value: messagesGenerated, icon: 'fa-paper-plane', color: 'green' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {cards.map((card, i) => (
        <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center space-x-4">
          <div className={`w-12 h-12 rounded-lg ${colorMap[card.color].bg} flex items-center justify-center ${colorMap[card.color].text} text-xl`}>
            <i className={`fa-solid ${card.icon}`}></i>
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium uppercase tracking-wider">{card.label}</p>
            <p className="text-2xl font-bold text-slate-800">{card.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
