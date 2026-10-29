// src/types/trackingHealth.ts
export type Platform = "GA4" | "Meta" | "Other";

export interface AnalyticsEvent {
  id: number;
  name: string;
  platform: Platform;

  uiFired: boolean;
  gtmReceived: boolean;
  successRate: number;

  lastFiredIso: string;
  lastError?: string;
  payload?: Record<string, any>;
}


export const trackingHealthMock: AnalyticsEvent[] = [
  {
    id: 1,
    name: "lead_add",
    platform: "GA4",
    uiFired: true,
    gtmReceived: true,
    successRate: 100,
    lastFiredIso: new Date().toISOString(),
    payload: {
      leadId: 123,
      source: "website",
    },
  },
  {
    id: 2,
    name: "lead_row_selection",
    platform: "Meta",
    uiFired: true,
    gtmReceived: false,
    successRate: 0,
    lastFiredIso: new Date().toISOString(),
    lastError: "GTM trigger not matched",
    payload: {
      leadId: 456,
    },
  },
  {
    id: 3,
    name: "lead_stage_changed",
    platform: "GA4",
    uiFired: true,
    gtmReceived: true,
    successRate: 92,
    lastFiredIso: new Date().toISOString(),
    payload: {
      leadId: 789,
      from: "new",
      to: "qualified",
    },
  },
];
