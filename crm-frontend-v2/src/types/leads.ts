// src/types/leads.ts

export type LeadStage =
  | "new"
  | "contacted"
  | "qualified"
  | "quoted"
  | "converted"
  | "lost";

export type LeadSource =
  | "Website"
  | "Facebook"
  | "Cold Call"
  | "Abandoned"
  | "Referral"
  | "Other";

export interface LeadAddress {
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
}

export interface Lead {
  id: number;
  created_at: string;           // ISO
  next_follow_up?: string | null;

  // identity / contact
  firstName?: string;
  lastName?: string;
  company?: string;
  email?: string;
  phone?: string;

  // address
  address?: LeadAddress;

  // interest
  serviceKey?: "standard" | "deep" | "moveInOut" | string;
  serviceName?: string;

  // pipeline
  stage: LeadStage;
  source?: LeadSource | string;

  // ownership / routing
  providerId?: number | null;   // assigned team / owner
  score?: number | null;        // lead score 0–100


    funnelId?: number | null;
  funnelSlug?: string | null;
  sourceId?: string | null;

  
  // misc
  notes?: string;
}
