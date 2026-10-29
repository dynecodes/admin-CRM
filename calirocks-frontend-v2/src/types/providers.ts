// src/types/providers.ts

export type ProviderStatus = "active" | "archived";

/* ========== People / Members ========== */

export type ProviderPerson = {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  status: ProviderStatus;
  created_at: string;
  updated_at?:string;
};

// Full editor type used by your UI when expanding a member row
export type TeamMember = ProviderPerson & {
  isExpanded?: boolean;
};

// Lightweight snapshot stored on the ServiceProvider (matches your mocks)
export type TeamMemberSnapshot = Pick<
  ProviderPerson,
  "id" | "firstName" | "lastName"
>;

/* ========== Wages / Compensation ========== */

export type WageMethod = "hourly" | "percentage" | "flat";

export type WageEntry =
  | { method: "hourly"; pay: number; effectiveDate: string; notes?: string }
  | { method: "percentage"; pay: number; effectiveDate: string; notes?: string }
  | { method: "flat"; pay: number; effectiveDate: string; notes?: string };

// Used by UI when splitting payments across members
export interface TeamPayment {
  memberId: number;
  percentage: number;
  method: Extract<WageMethod, "percentage" | "hourly">;
}

/* ========== Server / Persisted entity ========== */

export type ServiceProvider = {
  id: number;
  teamTitle: string;
  teamColor?: string;
  memberIds: number[];
  /** Keep snapshots here; fetch full people via ids when needed */
  teamMembers: TeamMemberSnapshot[];

  email: string;
  phone: string;
  status: ProviderStatus;

  locationIds?: number[];
  locations?: string[];

  wages?: WageEntry[];

  /** Optional fields some parts of the UI expect/read */
  rating?: number;
  categoryIds?: number[];
  likedCustomerIds?: number[];
  dislikedCustomerIds?: number[];
  preferredCustomerIds?: number[];
  avoidCustomerIds?: number[];

  /** Optional compensation settings that some UIs edit */
  paymentDistribution?: "team_leader" | "individual_members";
  teamPayments?: TeamPayment[];

  created_at: string;
  updated_at?: string;
};

/* ========== Create/Edit form shape (UI local state) ========== */

export type ProviderFormValue = {
  providerType: "individual" | "team";
  // leader (for individual) or team fields
  firstName: string;
  lastName: string;
  teamTitle: string;
  teamColor: string;

  memberIds: number[]; // always an array
  email: string;
  phone: string;
  status: ProviderStatus;

  locationIds: number[];
  address: string;
  city: string;
  state: string;
  zip: string;

  /** Optional extended fields your UI may already use */
  tags?: string[];
  categoryIds?: number[];
  categories?: string[];
  notes?: string;
  likedCustomerIds?: number[];
  dislikedCustomerIds?: number[];
  preferredCustomerIds?: number[];
  avoidCustomerIds?: number[];

  wages?: WageEntry[];
};

/* ========== Edit form mapper (server -> UI) ========== */

export interface ProviderEditForm {
  // Team / identity
  teamTitle: string;
  teamColor: string;
  memberIds: number[];
  rating?: number;

  // Contact
  email: string;
  phone: string;
  status: ProviderStatus;

  // Optional leader snapshot (for quick editing)
  firstName: string;
  lastName: string;

  // Address
  address: string;
  city: string;
  state: string;
  zip: string;

  // Preferences
  tags: string[];
  categoryIds: number[];
  locationIds: number[];
  notes: string;
  likedCustomerIds: number[];
  dislikedCustomerIds: number[];

  // Compensation
  paymentDistribution: "team_leader" | "individual_members";
  teamPayments: TeamPayment[];

  // NEW (UI-editable)
  preferredCustomerIds?: number[];
  avoidCustomerIds?: number[];
}

export function toProviderEditForm(sp: ServiceProvider): ProviderEditForm {
  const leader = sp.teamMembers?.[0];

  return {
    // Team / identity
    teamTitle: sp.teamTitle ?? "",
    teamColor: sp.teamColor ?? "#2563eb",
    memberIds: sp.memberIds ?? [],
    rating: sp.rating ?? 4,

    // Contact
    email: sp.email ?? "",
    phone: sp.phone ?? "",
    status: sp.status ?? "active",

    // Leader snapshot (best-effort)
    firstName: leader?.firstName ?? "",
    lastName: leader?.lastName ?? "",

    // Address (best-effort — not in persisted type by default)
    address: (sp as any).address ?? "",
    city: (sp as any).city ?? "",
    state: (sp as any).state ?? "",
    zip: (sp as any).zip ?? "",

    // Preferences
    tags: (sp as any).tags ?? [],
    categoryIds: sp.categoryIds ?? (sp as any).categoryIds ?? [],
    locationIds: sp.locationIds ?? [],
    notes: (sp as any).notes ?? "",
    likedCustomerIds: sp.likedCustomerIds ?? (sp as any).likedCustomerIds ?? [],
    dislikedCustomerIds:
      sp.dislikedCustomerIds ?? (sp as any).dislikedCustomerIds ?? [],

    // Compensation
    paymentDistribution: sp.paymentDistribution ?? "team_leader",
    teamPayments: sp.teamPayments ?? [],

    // NEW
    preferredCustomerIds:
      sp.preferredCustomerIds ?? (sp as any).preferredCustomerIds ?? [],
    avoidCustomerIds: sp.avoidCustomerIds ?? (sp as any).avoidCustomerIds ?? [],
  };
}
