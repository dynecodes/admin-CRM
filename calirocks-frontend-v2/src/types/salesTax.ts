// src/types/salesTax.ts
export interface SalesTax {
  id: number;
  effective_date: string; // YYYY-MM-DD
  tax_percent: number;
  location_ids: number[]; // Location foreign keys
  created_at: string;
  updated_at?: string;
}

export type SalesTaxSettings = {
  enabled: boolean;
};

export type SalesTaxHistoryEntry = {
  id: number;
  user_name: string;
  action: string;
  ip_address?: string;
  created_at: string; // ISO datetime
};
