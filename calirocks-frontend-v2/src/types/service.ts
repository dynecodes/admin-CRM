export type PricingType = "flat" | "hourly";
export type ServiceStatus = "active" | "archived";

export interface Category {
  id: number;
  name: string;
}
export interface Providers {
  id: number;
  name: string;
}

export interface Location {
  id: number;
  name: string;
}

export interface Addon {
  id: number;
  name: string;
  price: number;
}

export interface Variable {
  id: number;
  name: string;
  price: number;
}

export interface Frequency {
  id: number;
  name: string;
}

export interface DayShiftPricing {
  startTime: string;
  endTime: string;
  rate: number;
}

export interface DayPricing {
  enabled: boolean;
  hasBeforeShift: boolean;
  hasOffShift: boolean;
  beforeShift?: DayShiftPricing;
  onShift: DayShiftPricing;
  offShift?: DayShiftPricing;
}

export interface AdvancedPricing {
  [day: string]: DayPricing;
}

//=== Service Interface ===
export interface Service {
  id: number;
  name: string;
  price_amount: number;
  pricing_type: PricingType;
  duration_minutes?: number;
  status: ServiceStatus;
  staff_only: boolean;
  categories: Category[];
  locations: Location[];
  addons: Addon[];
  variables: Variable[];
  frequencies: Frequency[];
  exclude_frequency: boolean;
  exclude_discount_code: boolean;
  is_advanced_pricing?: boolean;
  advanced_pricing?: AdvancedPricing;
  created_at: string;
  providers?: Providers[];
  // NEW FIELDS FOR FLAT RATE
  duration_hours?: number;
  duration_minutes_field?: number;
  // NEW FIELDS FOR HOURLY RATE
  min_service_providers?: number;
  max_service_providers?: number;
  allow_30min_increments?: boolean;
  allow_15min_increments?: boolean;
  hourly_min_duration?: string;
  hourly_max_duration?: string;
  // SAME DAY FEE
  // has_same_day_fee?: boolean;
  // same_day_fee_amount?: number;
  // === Same-day fee (all optional so old data still type-checks) ===
  has_same_day_fee?: boolean | null;
  same_day_fee_amount?: number | null;
  same_day_cutoff_day?: CutoffDay | null;
  same_day_cutoff_time?: string | null; // "HH:mm" 24h
}

export type CutoffDay = "dayBefore" | "dayOf";

export interface ServiceOptions {
  categories: Category[];
  locations: Location[];
  addons: Addon[];
  variables: Variable[];
  frequencies: Frequency[];
  providers: Providers[];
}
