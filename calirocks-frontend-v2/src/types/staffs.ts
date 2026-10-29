export type StaffRole = "admin" | "staff" | "technical";

export interface EmailPreferences {
  availabilitySpecificDateChanged: boolean;
  defaultAvailabilityAdded: boolean;
  defaultAvailabilityChanged: boolean;
  requestTimeOffSubmitted: boolean;
}

export interface Staff {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: StaffRole;
  twoFAEnabled: boolean;
  confirmed: boolean;

  phone: string;

  address?: string;
  city?: string;
  state?: string;
  zip?: string;

  profilePicUrl?: string;
  created_at: string;
  updated_at?: string;

  emailPreferences?: EmailPreferences;
}