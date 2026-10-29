export type LocationStatus = 'active' | 'archived';

export interface Location {
  id: number;
  name: string;
  postal_codes: string[];
  status: LocationStatus;
  is_default: boolean;
  created_at: string;
  updated_at?: string;
}