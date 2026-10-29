/* ---------- Time Slot Types ---------- */
export type TimeSlotType = "specific-time" | "arrival-window";

export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  jobsMax: number;
  type: TimeSlotType;
  isFullMax?: boolean;
}

export interface DaySettings {
  id: string;
  day: string;
  isOpen: boolean;
  timeSlots: TimeSlot[];
  serviceGroupSlots?: Record<string, TimeSlot[]>;
}

/* ---------- Daily Settings Types ---------- */
export type LockedSlotsMap = Record<
  string,
  Record<string, Record<string, boolean>>
>;

export type LockedSlotTimestampsMap = Record<
  string,
  Record<string, Record<string, string>>
>;

export type JobsAvailabilityMap = Record<string, Record<string, number>>;

/* ---------- Holiday Types ---------- */
export interface Holiday {
  id: string;
  holiday: string;
  description: string;
  locations: string[];
}

/* ---------- Service Group Types ---------- */
export interface ServiceGroup {
  id: string;
  label: string;
  services: Array<{ id: string; label: string }>;
}

export type ServiceGroupRowConfig = {
  id: string;
  label: string;
  color: string;
  timeSlotIds?: string[];
};

export type LocationServiceGroups = Record<string, ServiceGroup[]>;

export type LocationServiceSelections = Record<
  string,
  Record<string, string[]>
>;

/* ---------- History Types ---------- */
export interface HistoryEntry {
  id: string;
  who: string;
  what: string;
  when: string;
}

export interface MaximumSettingsHistoryEntry {
  id: string;
  timestamp: string;
  location: string;
  changes: string[];
}

/* ---------- Maximum Settings Types ---------- */
export type MaximumSettingsByLocation = Record<string, DaySettings[]>;

export type PendingMaximumJobsSlotMap = Record<string, number>;
export type PendingMaximumJobsGroupMap = Record<
  string,
  PendingMaximumJobsSlotMap
>;
export type PendingMaximumJobsDayMap = Record<
  string,
  PendingMaximumJobsGroupMap
>;
export type PendingMaximumJobsByLocation = Record<
  string,
  PendingMaximumJobsDayMap
>;
