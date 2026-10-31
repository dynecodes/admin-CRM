// src/types/referrals.ts

export type ReferralStatus = "active" | "archived";

export type ReferralProgram = {
  id: number;
  startDate: string; // ISO yyyy-mm-dd
  endDate: string; // ISO yyyy-mm-dd
  discount: number; // Dollar amount for new customer
  reward: number; // Dollar amount for referring customer
  status: ReferralStatus;
  created_at: string;
  updated_at: string;
  created_by?: string;
  metrics?: {
    newCustomers: number;
  };
};
export type ReferralSettings = {
  isEnabled: boolean;
  updated_at: string;
  updated_by?: string;
};

export type ReferralChangeLog = {
  id: number;
  who: string;
  what: string;
  when: string;
  referralId?: number;
};
