export type QuoteStatus = "draft" | "sent" | "accepted" | "expired" | "declined";

export type QuoteLineVar = { id: number; qty: number };
export type QuoteLineAddon = { id: number; qty: number };

export type QuotePricing = {
  baseServicePrice: number;
  extrasTotal: number;
  subtotal: number;
  adjustmentAmount: number;
  finalPrice: number | null;
  tip: number;
  coupon: string | null;
  adjustmentComment: string | null;
  adjustmentAppliesOnlyHere: boolean;
  total: number;
};

export type QuoteCustomer = {
  id?: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  companyName?: string;
};

export type QuoteAddress = {
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  locationId?: number | string;
};

export type QuoteService = {
  categoryId: number;
  serviceId: number;
  frequencyId: number;
  squareFeet?: number | null;
  variables: QuoteLineVar[];  // from variablesArr
  addons: QuoteLineAddon[];   // from addonsArr
};

export type Quote = {
  id: number;
  status: QuoteStatus;
  shareToken?: string | null;
  expiresOn?: string | null;  // "YYYY-MM-DD"
  customer: QuoteCustomer;
  address: QuoteAddress;
  service: QuoteService;
  notes?: { staffNotes?: string; customerNotes?: string };
  pricing: QuotePricing;
  created_at: string;
  updated_at: string;
};
