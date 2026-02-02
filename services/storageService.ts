
import { Business } from '../types';

const STORAGE_KEY = 'leadgen_ai_leads';

export const storageService = {
  getLeads: (): Business[] => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveLeads: (newLeads: Business[]): void => {
    const existing = storageService.getLeads();
    const combined = [...newLeads, ...existing];
    // Simple deduplication by ID or name+city
    const unique = Array.from(new Map(combined.map(item => [`${item.name}-${item.city}`, item])).values());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(unique));
  },

  updateLead: (id: string, updates: Partial<Business>): void => {
    const leads = storageService.getLeads();
    const index = leads.findIndex(l => l.id === id);
    if (index !== -1) {
      leads[index] = { ...leads[index], ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
    }
  },

  clearLeads: (): void => {
    localStorage.removeItem(STORAGE_KEY);
  }
};
