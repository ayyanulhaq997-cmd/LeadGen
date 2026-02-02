
export enum LeadStatus {
  DISCOVERED = 'DISCOVERED',
  CONTACTING = 'CONTACTING',
  CONTACTED = 'CONTACTED',
  NEGOTIATING = 'NEGOTIATING',
  BOOKED = 'BOOKED',
  CONVERTED = 'CONVERTED',
  REJECTED = 'REJECTED'
}

export interface MessageLog {
  role: 'agent' | 'client';
  content: string;
  timestamp: number;
}

export interface Meeting {
  id: string;
  businessId: string;
  businessName: string;
  date: string;
  time: string;
  type: 'Discovery Call' | 'Project Kickoff' | 'Design Review';
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
  meetingId?: string;
}
