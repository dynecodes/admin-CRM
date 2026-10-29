export type VariableStatus = "active" | "archived";

export type ServiceLite = {
  id: string;
  name: string;
};

export type VariablePricingType = "flat" | "ranges";

export interface PriceRange {
  id: string;
  label: string;
  price: number;
  min: number;
  max: number;
  hours: number;
  minutes: number;
}

export type Variable = {
  id: number; // Changed from string to number
  name: string;
  serviceIds: string[];
  status: VariableStatus;

  pricing_type: VariablePricingType;
  price_amount: number;
  duration_hours?: number;
  duration_minutes?: number;
  values_from?: number;
  values_to?: number;
  price_ranges?: PriceRange[];

  created_at: string;
  updated_at: string;
};

export type VariableRow = Variable & {
  services: ServiceLite[];
};