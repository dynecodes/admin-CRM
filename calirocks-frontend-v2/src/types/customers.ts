// /src/types/customers.ts

/* ========================= Booking-related ========================= */

export type BookingStatus = "completed" | "upcoming" | "cancelled";

export type BookingFrequency =
  | "One Time"
  | "Every 2 Weeks"
  | "Every 3 Weeks"
  | "Every 4 Weeks"
  | "Monthly";

export interface CustomerBooking {
  id: number;
  customerId: number;
  providerId?: number;
  startIso: string;
  endIso: string;
  frequency: BookingFrequency;
  serviceName: string;
  address: string;

  beds?: number;
  baths?: number;
  halfBaths?: number;
  level?: number;
  sqft?: number;

  addons?: string[];
  rating?: number;
  feedback?: string;
  status: BookingStatus;
}

/* ========================= Core Customer ========================= */

export type CustomerStatus = "active" | "archived";

export type Confirmed =
  | "✓"
  | "-"
  | "yes"
  | "no"
  | "true"
  | "false"
  | 1
  | 0
  | boolean;

export type CustomerAddress = {
  id?: number;
  address: string;
  city: string;
  state: string;
  zip: string;
  locationId: number | null;
  isDefault: boolean;
  // createdAt: string;
  // updatedAt: string;
};

  
export interface Customer {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  companyName?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  phone: string;
  status: CustomerStatus;
  confirmed: Confirmed;
  locationId?: number | null;
  locationName?: string | null;

  /* ---------- new backend-managed fields ---------- */
  avatarUrl?: string | null;
  blocked?: boolean;
  blockedReason?: string | null;
  blockedAt?: string | null;
  archivedAt?: string | null;

   addresses?: CustomerAddress[];
  /* ---------- timestamps ---------- */
  created_at: string;
  updated_at: string;

  tags?:string[];

  /* ---------- relations ---------- */
  bookings?: CustomerBooking[];
}

/* ========================= Create / Update DTOs ========================= */

/**
 * Used when creating a new customer (POST /customers).
 * Excludes backend-managed fields like id, timestamps, bookings, etc.
 */
export type CreateCustomerInput = {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  companyName?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  status?: CustomerStatus;
  confirmed?: Confirmed;

  // Optional on create
  avatarUrl?: string | null;
  blocked?: boolean;
};

/**
 * Used when updating an existing customer (PUT /customers/:id)
 */
export type UpdateCustomerInput = Partial<Omit<Customer, "id" | "created_at" | "updated_at" | "bookings">>;

/* ========================= History (for modal) ========================= */

export type CustomerHistoryAction =
  | "create"
  | "update"
  | "archive"
  | "restore"
  | "delete"
  | "block"
  | "unblock";

export interface CustomerHistoryItem {
  id: number;
  at: string; // ISO date
  actorId: number | null;
  actorName?: string | null;
  actorRole?: string | null;
  action: CustomerHistoryAction;
  changes?: Record<string, any> | null;
  reason?: string | null;
  actorDisplay?: string; // "Alysa Emilio — Staff"
}

/* ========================= Details tab ========================= */

export interface CustomerDetails {
  tags?: string[];
  preferred_teams?: number[];
  do_not_serve_teams?: number[];

  // NEW (added in backend migration)
  specialSalesTaxEnabled?: boolean;
  specialSalesTaxPercent?: number | null;
}


export type CustomerHistoryRecord = {
  id: number;
  at: string;
  actorId?: number | null;
  actorName?: string | null;
  actorRole?: string | null;
  actorDisplay?: string | null;
  action: string;
  reason?: string | null;
  changes?: Record<string, any>;
};


export type CustomerEditForm = {
  email: string;
  firstName: string;
  lastName: string;
  companyName?: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  status: CustomerStatus;
  confirmed: Confirmed;
  isDefaultAddress?: boolean;
  billing?: {
    brand?: string;
    last4?: string;
    expMonth?: number;
    expYear?: number;
    tokenId?: string;
    isDefault?: boolean;
  } | null;

  // NEW: multi-address array
  addresses?: CustomerAddress[];

  // NEW UI fields
  avatarUrl?: string | null;
  blocked?: boolean;
  blockedReason?: string | null;
  specialSalesTaxEnabled?: boolean;
  specialSalesTaxPercent?: number | null;
  locationId?: number | null;
};
