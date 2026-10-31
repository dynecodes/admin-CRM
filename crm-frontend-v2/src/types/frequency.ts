export type FrequencyStatus = 'active' | 'archived';

export type FrequencyType = 'One Time' | 'Every Week' | 'Every 2 Weeks' | 'Every 3 Weeks' | 'Every 4 Weeks' | 'Custom';

export interface FrequencyService {
  id: number;
  name: string;
}

export interface Frequency {
  id: number;
  name: string;
  frequency_label: string;
  interval_days: number;
  discount_percent: number;
  discount_type: 'percentage' | 'amount';
  discount_value: number;
  discount_apply_mode: 'all' | 'after';
  discount_after_n: number;
  status: FrequencyStatus;
  is_default: boolean;
  staff_only: boolean;
  services: FrequencyService[];
  custom_every?: number;
  custom_days?: number[];
  created_at: string;
  updated_at?: string;
}

export interface FrequencyFormData {
  name: string;
  frequency_type: FrequencyType;
  custom_every: number;
  custom_days: number[];
  discount_type: 'percentage' | 'amount';
  discount_value: number;
  discount_apply_mode: 'all' | 'after';
  discount_after_n: number;
  status: FrequencyStatus;
  is_default: boolean;
  staff_only: boolean;
  services: number[];
}

export interface FrequencyOptions {
  services: FrequencyService[];
}