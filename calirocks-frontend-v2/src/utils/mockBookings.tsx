// src/utils/mockBookings.ts
import type { Booking } from "../types/bookings";

/**
 * Simple lookup you can also keep in your hooks:
 *  1 = One Time
 *  2 = Monthly
 *  3 = Every 3 Weeks
 *  4 = Every 4 Weeks
 */
const FREQ = {
  ONE_TIME: 1,
  MONTHLY: 2,
  EVERY_3_WEEKS: 3,
  EVERY_4_WEEKS: 4,
} as const;

/**
 * Example service ids (adjust to your real catalog):
 *  10 = Standard / General Cleaning
 *  11 = Deep Cleaning
 *  12 = Move In/Out
 * Categories are illustrative only.
 */
const CAT = {
  STANDARD: 100,
  DEEP: 101,
  MOVE_IN_OUT: 102,
} as const;

const SVC = {
  STANDARD: 10,
  DEEP: 11,
  MOVE_IN_OUT: 12,
} as const;

export const mockBookings: Booking[] = [
  {
    id: 101,
    status: "scheduled",
    customer: {
      firstName: "Patricia",
      lastName: "Smith",
      email: "patricia.smith@example.com",
      phone: "+1 212-555-0107",
      companyName: "Patricia Design LLC",
    },
    address: {
      address: "350 5th Ave",
      city: "New York",
      state: "NY",
      zip: "10118",
      locationId: 21,
    },
    service: {
      categoryId: CAT.STANDARD,
      serviceId: SVC.STANDARD,
      frequencyId: FREQ.MONTHLY,
      squareFeet: 1200,
      variables: [], // e.g., [{ id: 11, qty: 1200 }]
      addons: [],    // e.g., [{ id: 501, qty: 1 }]
    },
    schedule: { date: "2025-10-30", time: "10:00", providerId: 1 },
    notes: {
      staffNotes: "Key with front desk.",
      customerNotes: "Please focus on kitchen.",
    },
    payments: { method: "card" },
    pricing: {
      baseServicePrice: 170,
      extrasTotal: 45,
      subtotal: 215,
      adjustmentAmount: 0,
      finalPrice: 215,
      tip: 0,
      coupon: "",
      adjustmentComment: "",
      adjustmentAppliesOnlyHere: true,
      total: 215,
    },
    quoteId: 9001,
    createdAt: "2025-10-15T10:00:00.000Z",
    updatedAt: "2025-10-15T10:00:00.000Z",
  },
  {
    id: 102,
    status: "scheduled",
    customer: {
      firstName: "Andre",
      lastName: "Lopez",
      email: "andre.lopez@example.com",
      phone: "+1 212-555-0142",
      companyName: "",
    },
    address: {
      address: "123 Broadway St",
      city: "New York",
      state: "NY",
      zip: "10001",
      locationId: 20,
    },
    service: {
      categoryId: CAT.DEEP,
      serviceId: SVC.DEEP,
      frequencyId: FREQ.ONE_TIME,
      squareFeet: 900,
      variables: [],
      addons: [
        // sample addon ids; adjust to your catalog
        { id: 601, name: "Inside Oven", qty: 1 },
        { id: 602, name: "Inside Cabinets", qty: 1 },
      ],
    },
    schedule: { date: "2025-11-02", time: "14:30", providerId: 1 },
    notes: {
      staffNotes: "Allergy note acknowledged.",
      customerNotes: "Allergies to strong scents.",
    },
    payments: { method: "cash" },
    pricing: {
      baseServicePrice: 240,
      extrasTotal: 55,
      subtotal: 295,
      adjustmentAmount: 0,
      finalPrice: 295,
      tip: 0,
      coupon: "",
      adjustmentComment: "",
      adjustmentAppliesOnlyHere: true,
      total: 295,
    },
    quoteId: 9002,
    createdAt: "2025-10-18T12:22:00.000Z",
    updatedAt: "2025-10-18T12:22:00.000Z",
  },
  {
    id: 103,
    status: "completed",
    customer: {
      firstName: "Maya",
      lastName: "Chen",
      email: "maya.chen@example.com",
      phone: "+1 212-555-0177",
      companyName: "",
    },
    address: {
      address: "11 Wall St",
      city: "New York",
      state: "NY",
      zip: "10005",
      locationId: 22,
    },
    service: {
      categoryId: CAT.STANDARD,
      serviceId: SVC.STANDARD,
      frequencyId: FREQ.MONTHLY,
      squareFeet: 700,
      variables: [],
      addons: [],
    },
    schedule: { date: "2025-10-12", time: "09:00", providerId: 2 },
    notes: {
      staffNotes: "Customer prefers 2-person team.",
      customerNotes: "Thanks for the extra care!",
    },
    payments: { method: "card" },
    pricing: {
      baseServicePrice: 170,
      extrasTotal: 0,
      subtotal: 170,
      adjustmentAmount: 0,
      finalPrice: 190, // 170 + 0 + 20 tip
      tip: 20,
      coupon: "",
      adjustmentComment: "",
      adjustmentAppliesOnlyHere: true,
      total: 190,
    },
    quoteId: 9003,
    createdAt: "2025-10-01T08:00:00.000Z",
    updatedAt: "2025-10-12T10:30:00.000Z",
  },
  {
    id: 104,
    status: "cancelled",
    customer: {
      firstName: "Jamal",
      lastName: "Reed",
      email: "jamal.reed@example.com",
      phone: "+1 212-555-0190",
      companyName: "Reed Logistics",
    },
    address: {
      address: "99 Park Ave",
      city: "New York",
      state: "NY",
      zip: "10016",
      locationId: 19,
    },
    service: {
      categoryId: CAT.MOVE_IN_OUT,
      serviceId: SVC.MOVE_IN_OUT,
      frequencyId: FREQ.EVERY_4_WEEKS,
      squareFeet: 1500,
      variables: [],
      addons: [{ id: 603, name: "Inside Windows", qty: 1 }],
    },
    schedule: { date: "2025-10-20", time: "16:00", providerId: 3 },
    notes: {
      staffNotes: "Canceled due to reschedule.",
      customerNotes: "Client cancelled; rescheduling next week.",
    },
    payments: { method: "check" },
    pricing: {
      baseServicePrice: 300,
      extrasTotal: 35,
      subtotal: 335,
      adjustmentAmount: -20,
      finalPrice: 315,
      tip: 0,
      coupon: "WELCOME20",
      adjustmentComment: "Intro discount",
      adjustmentAppliesOnlyHere: true,
      total: 315,
    },
    quoteId: 9004,
    createdAt: "2025-10-10T07:30:00.000Z",
    updatedAt: "2025-10-19T09:10:00.000Z",
  },
  {
    id: 105,
    status: "scheduled",
    customer: {
      firstName: "Sofia",
      lastName: "Marin",
      email: "sofia.marin@example.com",
      phone: "+1 212-555-0133",
      companyName: "",
    },
    address: {
      address: "200 Hudson St",
      city: "New York",
      state: "NY",
      zip: "10013",
      locationId: 21,
    },
    service: {
      categoryId: CAT.STANDARD,
      serviceId: SVC.STANDARD,
      frequencyId: FREQ.EVERY_3_WEEKS,
      squareFeet: 1100,
      variables: [],
      addons: [
        { id: 604, name: "Pet Hair", qty: 1 },
        { id: 605, name: "Wash Dishes", qty: 1 },
      ],
    },
    schedule: { date: "2025-11-05", time: "11:15", providerId: 5 },
    notes: {
      staffNotes: "Unit has extra clutter.",
      customerNotes: "Ring doorbell on arrival.",
    },
    payments: { method: "card" },
    pricing: {
      baseServicePrice: 170,
      extrasTotal: 45,
      subtotal: 215,
      adjustmentAmount: 10,
      finalPrice: 225,
      tip: 0,
      coupon: "",
      adjustmentComment: "Extra clutter",
      adjustmentAppliesOnlyHere: true,
      total: 225,
    },
    quoteId: 9005,
    createdAt: "2025-10-19T11:05:00.000Z",
    updatedAt: "2025-10-19T11:05:00.000Z",
  },
  {
    id: 106,
    status: "scheduled",
    customer: {
      firstName: "Elena",
      lastName: "Kuznetsova",
      email: "elena.k@example.com",
      phone: "+1 917-555-0202",
      companyName: "",
    },
    address: {
      address: "77 Water St",
      city: "New York",
      state: "NY",
      zip: "10005",
      locationId: 22,
    },
    service: {
      categoryId: CAT.MOVE_IN_OUT,
      serviceId: SVC.MOVE_IN_OUT,
      frequencyId: FREQ.ONE_TIME,
      squareFeet: 1350,
      variables: [],
      addons: [
        { id: 606, name: "Inside Fridge", qty: 1 },
        { id: 601, name: "Inside Oven", qty: 1 },
        { id: 607, name: "Baseboards", qty: 1 },
      ],
    },
    schedule: { date: "2025-11-08", time: "13:45", providerId: 4 },
    notes: {
      staffNotes: "Parking voucher provided by building.",
      customerNotes: "Call upon arrival; freight elevator required.",
    },
    payments: { method: "card" },
    pricing: {
      baseServicePrice: 320,
      extrasTotal: 85,
      subtotal: 405,
      adjustmentAmount: -5,
      finalPrice: 420, // 405 - 5 + 20 tip
      tip: 20,
      coupon: "MOVE10",
      adjustmentComment: "Manager override -5",
      adjustmentAppliesOnlyHere: false,
      total: 420,
    },
    quoteId: 9006,
    createdAt: "2025-10-21T15:45:00.000Z",
    updatedAt: "2025-10-21T15:45:00.000Z",
  },
];
