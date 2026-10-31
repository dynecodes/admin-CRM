// src/types/promotions.ts
export type DiscountType = "Booking" | "Giftcard";

export type DaysOfWeek = {
  sun: boolean;
  mon: boolean;
  tue: boolean;
  wed: boolean;
  thu: boolean;
  fri: boolean;
  sat: boolean;
};

export type DiscountLimit = {
  perCustomer?: number | null;
  perCode?: number | null;
  minBookingAmount?: number | null;
  newCustomerAfter?: string | null; // ISO yyyy-mm-dd
};

export type PromotionStatus = "active" | "archived";

/** Rows shown inside the usage popup */
export type PromotionUse = {
  customer: string;
  serviceDate: string; // ISO yyyy-mm-dd
};

export type Promotion = {
  id: number;
  code: string;
  // Examples: "10% off", "$25 off", etc. Keep as string for now to allow either style.
  discount: string;
  type: DiscountType; // "Booking" | "Giftcard"
  usageCount?: number; // active bookings
  // cancelledCount?: number; // cancelled bookings
  activeBookings?: PromotionUse[];
  cancelledBookings?: PromotionUse[];
  limit?: DiscountLimit;
  daysOfWeek: DaysOfWeek;
  serviceDateStart?: string | null; // ISO yyyy-mm-dd
  serviceDateEnd?: string | null; // ISO yyyy-mm-dd
  expirationDate?: string | null; // ISO yyyy-mm-dd
  status?: PromotionStatus;
  created_at?: string;
  updated_at?: string;
};
