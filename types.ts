
export enum LeadStatus {
  HOT = 'HOT',     // No website
  WARM = 'WARM',   // Bad/Old website
  COLD = 'COLD'    // Good website
}

export interface Business {
  id: string;
  name: string;
  city: string;
  phone: string;
  website: string | null;
  mapsUrl?: string; // Grounding requirement: store Google Maps URL
  status: LeadStatus;
  message?: string;
  timestamp: number;
}

export interface ScanResult {
  businesses: Business[];
}