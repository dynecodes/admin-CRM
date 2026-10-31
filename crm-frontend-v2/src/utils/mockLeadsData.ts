// src/utils/mockLeadsData.ts
import type { Lead } from "../types/leads";

function isoNowMinusDays(days: number, hour = 10) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}
function isoNowPlusDays(days: number, hour = 10) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

export const mockLeadsData: Lead[] = [
  {
    id: 101,
    created_at: isoNowMinusDays(1, 9),
    next_follow_up: isoNowPlusDays(1, 14),
    firstName: "Ava",
    lastName: "Santos",
    email: "ava.santos@example.com",
    phone: "(415) 555-0111",
    address: { address: "12 Ocean Ave", city: "San Francisco", state: "CA", zip: "94103" },
    serviceKey: "standard",
    serviceName: "Standard Cleaning",
    stage: "new",
    source: "Website",
    providerId: 1,
    score: 78,
    notes: "Reached via landing page form.",
  },
  {
    id: 102,
    created_at: isoNowMinusDays(2, 11),
    next_follow_up: isoNowPlusDays(2, 10),
    firstName: "Brian",
    lastName: "Lim",
    email: "brian.lim@example.com",
    phone: "(650) 555-0123",
    address: { address: "88 Willow St", city: "San Mateo", state: "CA", zip: "94401" },
    serviceKey: "deep",
    serviceName: "Deep Cleaning",
    stage: "contacted",
    source: "Facebook",
    providerId: 2,
    score: 64,
    notes: "Asked about weekend availability.",
  },
  {
    id: 103,
    created_at: isoNowMinusDays(3, 15),
    next_follow_up: isoNowPlusDays(3, 9),
    firstName: "Clara",
    lastName: "Ng",
    email: "clara.ng@example.com",
    phone: "(408) 555-0177",
    address: { address: "210 Maple Ave", city: "San Jose", state: "CA", zip: "95112" },
    serviceKey: "moveInOut",
    serviceName: "Move In/Out",
    stage: "qualified",
    source: "Referral",
    providerId: null,
    score: 82,
  },
  {
    id: 104,
    created_at: isoNowMinusDays(4, 16),
    next_follow_up: isoNowPlusDays(1, 11),
    firstName: "Diego",
    lastName: "Ramos",
    email: "diego.ramos@example.com",
    phone: "(510) 555-0199",
    address: { address: "33 Linden Rd", city: "Oakland", state: "CA", zip: "94607" },
    serviceKey: "standard",
    serviceName: "Standard Cleaning",
    stage: "quoted",
    source: "Cold Call",
    providerId: 1,
    score: 55,
  },
  {
    id: 105,
    created_at: isoNowMinusDays(5, 10),
    next_follow_up: null,
    firstName: "Ella",
    lastName: "Chua",
    email: "ella.chua@example.com",
    phone: "(925) 555-0148",
    address: { address: "5 Cedar Ct", city: "Walnut Creek", state: "CA", zip: "94596" },
    serviceKey: "deep",
    serviceName: "Deep Cleaning",
    stage: "converted",
    source: "Website",
    providerId: 3,
    score: 90,
    notes: "Converted to booking via quote #4508.",
  },
  {
    id: 106,
    created_at: isoNowMinusDays(1, 13),
    next_follow_up: null,
    firstName: "Faye",
    lastName: "Garcia",
    email: "faye.garcia@example.com",
    phone: "(669) 555-0102",
    address: { address: "901 Mission St", city: "San Jose", state: "CA", zip: "95110" },
    serviceKey: "standard",
    serviceName: "Standard Cleaning",
    stage: "lost",
    source: "Abandoned",
    providerId: null,
    score: 20,
    notes: "Abandoned funnel at pricing step.",
  },
];
