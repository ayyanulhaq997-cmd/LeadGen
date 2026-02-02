
export enum LeadStatus {
  DISCOVERED = 'DISCOVERED',
  CONTACTING = 'CONTACTING',
  CONTACTED = 'CONTACTED',
  NEGOTIATING = 'NEGOTIATING',
  CONVERTED = 'CONVERTED',
  REJECTED = 'REJECTED'
}

export interface MessageLog {
  role: 'agent' | 'client';
  content: string;
  timestamp: number;
}

export interface Business {
  id: string;
  name: string;
  city: string;
  phone: string;
  website: string | null;
  mapsUrl?: string;
  status: LeadStatus;
  history: MessageLog[];
  timestamp: number;
}

export interface ScanResult {
  businesses: Business[];
}
