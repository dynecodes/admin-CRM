// src/types/bookings.ts

export type FrequencySnapshot = {
  id: number;
  name: string;
  frequencyLabel: string | null;
  intervalDays: number | null;
  discountPercent: number | null;
  discountType: string | null;
  discountValue: number | null;
  discountApplyMode: string | null;
  discountAfterN: number | null;
  status: string;
  isDefault: boolean;
  staffOnly: boolean;
  customDays: string | null;
  customEvery: number | null;
};

/* ---------- Forms ---------- */
export type BookingFormState = {
    id?: number;
  customer: {
    id?: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    companyName?: string | null;
     blocked?: boolean;
    blockedReason?: string | null;
  };

  address: {
    address: string;
    city: string;
    state: string;
    zip: string;
    locationId?: number | "";
  };

  service: {
    categoryId: number | "";   // drives service list
    serviceId: number | "";    // chosen service
    frequencyId: number | "";  // chosen frequency for that service
    squareFeet?: number | null;

    variables: Array<{ id: number; name?: string; qty: number }>;
    addons:    Array<{ id: number; name?: string; qty: number }>;
      frequency?: FrequencySnapshot | null;
  };

  schedule: {
    date?: string;             // "YYYY-MM-DD"
    time?: string;             // "HH:mm"
    providerId?: number | "";
  };

  notes: {
    staffNotes?: string | null;
    customerNotes?: string | null;
  };

  payments: {
    method: "" | "card" | "cash" | "check";
  };

  pricing: {
    baseServicePrice: number;
    extrasTotal: number;       // addons + variables
    subtotal: number;
    adjustmentAmount: number;
    finalPrice: number | null;
    tip: number;
    coupon: string | null;
    adjustmentComment: string | null;
    adjustmentAppliesOnlyHere: boolean;
    total: number;
  };

  status?: "scheduled" | "completed" | "cancelled" | "draft" | "archived";
  quoteId?: number;
};

/* ---------- Persisted entity ---------- */
export type Booking = BookingFormState & {
  id: number;
  createdAt: string; // ISO
  updatedAt: string; // ISO
};




export type CustErrors = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
};
export type OtherErrors = {
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  date?: string;
  time?: string;
  frequencyId?: string;
  categoryId?: string;
  serviceId?: string;
};

  export type AddonOption = {
    id: number;
    name: string;
    price: number;
    quantityBased: boolean;
    keyForPayload: string;
    __raw: any;
  };

export type CustField = "first" | "last" | "email" | null;
export type TeamOption = { id: number; name: string; __raw: any };
export type LocationOption = { id: number; name: string; __raw: any };
// src/types/bookings.ts

export const isBookingRecurring = (
  b: BookingFormState | Booking
): boolean => {
  const f = b.service.frequency;
  return !!f && !!f.intervalDays && f.intervalDays > 0;
};
