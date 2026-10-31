import React from 'react';

export type AddonStatus = "active" | "archived";
export type RecurringPolicy = "every_booking" | "first_booking_only";

export interface AddonService {
  id: number;
  name: string;
}

export interface Addon {
  id: number;
  name: string;
  description?: string;
  icon?: string; 
  icon_type?: 'library' | 'upload'; 
  price: number;
  quantity_based: boolean;
  duration_hours?: number;
  duration_minutes?: number;
  status: AddonStatus;
  services: AddonService[];
  exclude_frequency: boolean;
  exclude_discount_code: boolean;
  recurring_policy: RecurringPolicy;
  created_at: string;
}

export interface AddonOptions {
  services: AddonService[];
}

export interface IconLibraryItem {
  id: string;
  name: string;
  icon: React.ReactElement;
  category: string;
}