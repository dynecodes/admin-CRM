import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Dropdown, DropdownItem } from "flowbite-react";
import CustomDateRangePicker from "../../components/ui/CustomDateRangePicker";
import DailySettings from "./DailySettings";
import Holidays from "./Holidays";
import MaximumSettings from "./MaximumSettings";
import {
  sortTimeSlots as sortMaximumTimeSlots,
  formatTimeSlotDisplay,
} from "./MaximumSettings";
import DeleteConfirmationModal from "../../components/ui/DeleteConfirmationModal";
import TeamHistoryModal, {
  type TeamChange,
} from "../../components/providers/EditForm/TeamHistoryModal";
import { useToast } from "../../components/ui/Toast";
import { useLocations } from "../../hooks/Locations/useLocations";
import { useServices } from "../../hooks/useServices";
import { useBookingTimes } from "../../hooks/BookingTimes/useBookingTimes";
import type {
  LockedSlotsMap,
  LockedSlotTimestampsMap,
  JobsAvailabilityMap,
  Holiday,
  DaySettings as MaximumDaySettings,
  TimeSlot,
  ServiceGroup,
  LocationServiceGroups,
  LocationServiceSelections,
  HistoryEntry,
  MaximumSettingsByLocation,
  PendingMaximumJobsDayMap,
  PendingMaximumJobsByLocation,
  MaximumSettingsHistoryEntry,
} from "../../types/bookingSpots";

const formatHistoryTimestamp = (date: Date = new Date()): string => {
  const datePart = date.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
  const timePart = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${datePart} ${timePart}`;
};

const cloneLockedSlots = (source?: LockedSlotsMap): LockedSlotsMap => {
  if (!source) return {};
  const clone: LockedSlotsMap = {};
  Object.entries(source).forEach(([dateValue, timeMap]) => {
    const clonedTimeMap: Record<string, Record<string, boolean>> = {};
    Object.entries(timeMap).forEach(([time, groupMap]) => {
      clonedTimeMap[time] = { ...groupMap };
    });
    clone[dateValue] = clonedTimeMap;
  });
  return clone;
};

const cloneLockedSlotTimestamps = (
  source?: LockedSlotTimestampsMap,
): LockedSlotTimestampsMap => {
  if (!source) return {};
  const clone: LockedSlotTimestampsMap = {};
  Object.entries(source).forEach(([dateValue, timeMap]) => {
    const clonedTimeMap: Record<string, Record<string, string>> = {};
    Object.entries(timeMap).forEach(([time, groupMap]) => {
      clonedTimeMap[time] = { ...groupMap };
    });
    clone[dateValue] = clonedTimeMap;
  });
  return clone;
};

const cloneJobsAvailability = (
  source?: JobsAvailabilityMap,
): JobsAvailabilityMap => {
  if (!source) return {};
  const clone: JobsAvailabilityMap = {};
  Object.entries(source).forEach(([dateValue, timeMap]) => {
    clone[dateValue] = { ...timeMap };
  });
  return clone;
};

const formatDateValueWithWeekday = (dateValue: string): string => {
  const [month, day, year] = dateValue
    .split("/")
    .map((part) => parseInt(part, 10));
  if (
    Number.isNaN(month) ||
    Number.isNaN(day) ||
    Number.isNaN(year) ||
    month < 1 ||
    month > 12
  ) {
    return dateValue;
  }

  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
  return `${weekday} ${dateValue}`;
};

const computeLockedSlotChanges = (
  prev: LockedSlotsMap,
  next: LockedSlotsMap,
  serviceGroupLabelMap: Map<string, string>,
): string[] => {
  const changes: string[] = [];
  const dateKeys = new Set([...Object.keys(prev), ...Object.keys(next)]);

  dateKeys.forEach((dateValue) => {
    const prevTimes = prev[dateValue] ?? {};
    const nextTimes = next[dateValue] ?? {};
    const timeKeys = new Set([
      ...Object.keys(prevTimes),
      ...Object.keys(nextTimes),
    ]);

    timeKeys.forEach((time) => {
      const prevGroups = prevTimes[time] ?? {};
      const nextGroups = nextTimes[time] ?? {};
      const groupKeys = new Set([
        ...Object.keys(prevGroups),
        ...Object.keys(nextGroups),
      ]);

      groupKeys.forEach((groupKey) => {
        const prevLocked = prevGroups[groupKey] ?? false;
        const nextLocked = nextGroups[groupKey] ?? false;

        if (prevLocked === nextLocked) return;

        const parts = [formatDateValueWithWeekday(dateValue), time];
        if (groupKey !== "default") {
          parts.push(serviceGroupLabelMap.get(groupKey) ?? groupKey);
        }
        const descriptor = parts.join(" • ");
        changes.push(
          nextLocked
            ? `Prevented new bookings for ${descriptor}`
            : `Unlocked bookings for ${descriptor}`,
        );
      });
    });
  });

  return changes;
};

const computeJobsAvailabilityChanges = (
  prev: JobsAvailabilityMap,
  next: JobsAvailabilityMap,
): string[] => {
  const changes: string[] = [];
  const dateKeys = new Set([...Object.keys(prev), ...Object.keys(next)]);

  dateKeys.forEach((dateValue) => {
    const prevTimes = prev[dateValue] ?? {};
    const nextTimes = next[dateValue] ?? {};
    const timeKeys = new Set([
      ...Object.keys(prevTimes),
      ...Object.keys(nextTimes),
    ]);

    timeKeys.forEach((time) => {
      const prevValue = prevTimes[time];
      const nextValue = nextTimes[time];

      if (prevValue === nextValue) return;

      const descriptor = `${formatDateValueWithWeekday(dateValue)} • ${time}`;
      if (prevValue === undefined && nextValue !== undefined) {
        changes.push(`Set jobs available for ${descriptor} to ${nextValue}`);
      } else if (prevValue !== undefined && nextValue === undefined) {
        changes.push(`Reset jobs available for ${descriptor} to default`);
      } else if (
        prevValue !== undefined &&
        nextValue !== undefined &&
        prevValue !== nextValue
      ) {
        changes.push(
          `Updated jobs available for ${descriptor} from ${prevValue} to ${nextValue}`,
        );
      }
    });
  });

  return changes;
};

const createInitialDailyLockedSlotsByLocation = (
  locationIds: string[],
): Record<string, LockedSlotsMap> => {
  const initial: Record<string, LockedSlotsMap> = {};
  locationIds.forEach((locationId) => {
    initial[locationId] = {};
  });
  return initial;
};

const createInitialDailyJobsAvailabilityByLocation = (
  locationIds: string[],
): Record<string, JobsAvailabilityMap> => {
  const initial: Record<string, JobsAvailabilityMap> = {};
  locationIds.forEach((locationId) => {
    initial[locationId] = {};
  });
  return initial;
};

const createInitialDailyLockedSlotTimestampsByLocation = (
  locationIds: string[],
): Record<string, LockedSlotTimestampsMap> => {
  const initial: Record<string, LockedSlotTimestampsMap> = {};
  locationIds.forEach((locationId) => {
    initial[locationId] = {};
  });
  return initial;
};

const cloneServiceGroup = (group: ServiceGroup): ServiceGroup => ({
  ...group,
  services: group.services.map((service) => ({ ...service })),
});

const generateServiceItemId = (groupId: string): string => {
  return `${groupId}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
};

const createEmptyServiceEntry = (seed: string = "new-group") => ({
  id: generateServiceItemId(seed),
  label: "",
});

const DEFAULT_SERVICE_GROUP_KEY = "__default__";

const cloneMaximumDaySettings = (
  settings: MaximumDaySettings[],
): MaximumDaySettings[] => {
  return settings.map((day) => ({
    ...day,
    timeSlots: sortMaximumTimeSlots(day.timeSlots.map((slot) => ({ ...slot }))),
    serviceGroupSlots: day.serviceGroupSlots
      ? Object.entries(day.serviceGroupSlots).reduce<
          NonNullable<MaximumDaySettings["serviceGroupSlots"]>
        >((acc, [groupId, slots]) => {
          acc[groupId] = sortMaximumTimeSlots(
            slots.map((slot) => ({ ...slot })),
          );
          return acc;
        }, {})
      : {},
  }));
};

const getBaseMaximumSettingsForLocation = (_locationId: string): MaximumDaySettings[] => {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days.map((day, index) => ({
    id: `${index + 1}`,
    day,
    isOpen: day !== "Sunday",
    timeSlots: [],
    serviceGroupSlots: {},
  }));
};

const updateJobsMaxInDaySettings = (
  settings: MaximumDaySettings[],
  dayName: string,
  slotLabel: string,
  nextJobsMax: number,
  serviceGroupId: string | null,
): MaximumDaySettings[] => {
  let didChange = false;

  const updateSlotCollection = (
    slots: TimeSlot[] | undefined,
  ): { slots: TimeSlot[] | undefined; changed: boolean } => {
    if (!slots || slots.length === 0) {
      return { slots, changed: false };
    }

    let changed = false;
    const nextSlots = slots.map((slot) => {
      if (formatTimeSlotDisplay(slot) !== slotLabel) {
        return slot;
      }
      const jobsMaxMatches = (slot.jobsMax ?? 0) === nextJobsMax;
      if (jobsMaxMatches && !slot.isFullMax) {
        return slot;
      }

      const needsUpdate = !jobsMaxMatches || slot.isFullMax === true;

      if (!needsUpdate) {
        return slot;
      }

      changed = true;
      return {
        ...slot,
        jobsMax: nextJobsMax,
        isFullMax: false,
      };
    });

    if (!changed) {
      return { slots, changed: false };
    }

    return {
      slots: sortMaximumTimeSlots(nextSlots),
      changed: true,
    };
  };

  const nextSettings = settings.map((day) => {
    if (day.day !== dayName) {
      return day;
    }

    let dayChanged = false;
    let nextTimeSlots = day.timeSlots;
    let nextServiceGroupSlots = day.serviceGroupSlots;

    if (serviceGroupId) {
      const currentGroupSlots = day.serviceGroupSlots?.[serviceGroupId];
      const { slots: updatedGroupSlots, changed } =
        updateSlotCollection(currentGroupSlots);

      if (changed) {
        dayChanged = true;
        nextServiceGroupSlots = {
          ...(day.serviceGroupSlots ?? {}),
          [serviceGroupId]: updatedGroupSlots ?? [],
        };
      } else if (!currentGroupSlots || currentGroupSlots.length === 0) {
        const { slots: updatedDefaultSlots, changed: defaultChanged } =
          updateSlotCollection(day.timeSlots);
        if (defaultChanged) {
          dayChanged = true;
          nextTimeSlots = updatedDefaultSlots ?? [];
        }
      }
    } else {
      const { slots: updatedSlots, changed } = updateSlotCollection(
        day.timeSlots,
      );
      if (changed) {
        dayChanged = true;
        nextTimeSlots = updatedSlots ?? [];
      }
    }

    if (!dayChanged) {
      return day;
    }

    didChange = true;

    return {
      ...day,
      timeSlots: nextTimeSlots,
      serviceGroupSlots: nextServiceGroupSlots,
    };
  });

  if (!didChange) {
    return settings;
  }

  return nextSettings;
};

const applyPendingMaximumJobsChanges = (
  settings: MaximumDaySettings[],
  pendingChanges: PendingMaximumJobsDayMap,
): MaximumDaySettings[] => {
  let nextSettings = settings;

  Object.entries(pendingChanges).forEach(([dayName, groupMap]) => {
    Object.entries(groupMap).forEach(([groupKey, slotMap]) => {
      const serviceGroupId =
        groupKey === DEFAULT_SERVICE_GROUP_KEY ? null : groupKey;

      Object.entries(slotMap).forEach(([slotLabel, jobsMax]) => {
        nextSettings = updateJobsMaxInDaySettings(
          nextSettings,
          dayName,
          slotLabel,
          jobsMax,
          serviceGroupId,
        );
      });
    });
  });

  return nextSettings;
};

const getToday = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

const getDefaultEndDate = (start: Date, daysAhead: number = 6): Date => {
  const end = new Date(start);
  end.setDate(end.getDate() + daysAhead);
  return end;
};

const formatDateForAPI = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const BookingSpots = () => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState("daily-settings");
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [selectedHolidayLocations, setSelectedHolidayLocations] = useState<
    Set<string>
  >(new Set());
  const previousActiveTabRef = useRef(activeTab);
  const previousMaximumTabLocationRef = useRef<string | null>(null);
  const previousDailyTabLocationRef = useRef<string | null>(null);

  // Hooks
  const { locations: dbLocations } = useLocations();
  const { services: dbServices } = useServices();
  const {
    serviceGroups: dbServiceGroups,
    maxSettings: dbMaxSettings,
    dailyAdjustments: dbDailyAdjustments,
    holidays: dbHolidays,
    fetchServiceGroups,
    createServiceGroup,
    updateServiceGroup,
    deleteServiceGroup,
    fetchMaxSettings,
    saveMaxSettings,
    fetchDailyAdjustments,
    saveDailyAdjustments,
    createHoliday,
    updateHoliday,
    deleteHoliday,
    fetchAdvancedGroupsSetting,
    saveAdvancedGroupsSetting,
  } = useBookingTimes();

  // Transform locations to the format expected by the component
  const locations = useMemo(
    () =>
      dbLocations
        .filter((loc) => loc.status === "active")
        .map((loc) => ({
          value: String(loc.id),
          label: loc.name,
        })),
    [dbLocations]
  );

  // Set default location when locations are loaded
  useEffect(() => {
    if (locations.length > 0 && !selectedLocation) {
      setSelectedLocation(locations[0].value);
    }
  }, [locations, selectedLocation]);

  const [isAddHolidayFormOpen, setIsAddHolidayFormOpen] = useState(false);
  const [newHolidayStartDate, setNewHolidayStartDate] = useState<Date | null>(
    null,
  );
  const [newHolidayEndDate, setNewHolidayEndDate] = useState<Date | null>(null);
  const [newHolidayLocations, setNewHolidayLocations] = useState<Set<string>>(
    new Set(),
  );
  const [newHolidayDescription, setNewHolidayDescription] = useState("");

  // Service Groups State
  const [serviceGroupsByLocation, setServiceGroupsByLocation] =
    useState<LocationServiceGroups>({});
  const [isAdvanceServiceGroupEnabled, setIsAdvanceServiceGroupEnabled] =
    useState(false);
  const [selectedServiceGroupsByLocation, setSelectedServiceGroupsByLocation] =
    useState<LocationServiceSelections>({});
  const [editingServiceGroupId, setEditingServiceGroupId] = useState<
    string | null
  >(null);
  const [editServiceGroupDraft, setEditServiceGroupDraft] =
    useState<ServiceGroup | null>(null);
  const [editServiceValidationErrors, setEditServiceValidationErrors] =
    useState<Set<string>>(new Set());
  const [isAddServiceGroupFormOpen, setIsAddServiceGroupFormOpen] =
    useState(false);
  const [newServiceGroup, setNewServiceGroup] = useState<ServiceGroup>(() => ({
    id: "",
    label: "",
    services: [createEmptyServiceEntry()],
  }));
  const [newServiceValidationErrors, setNewServiceValidationErrors] = useState<
    Set<string>
  >(new Set());
  const [deleteServiceGroupModal, setDeleteServiceGroupModal] = useState<{
    isOpen: boolean;
    groupId: string;
    groupLabel: string;
  }>({
    isOpen: false,
    groupId: "",
    groupLabel: "",
  });
  const serviceGroupParentRefs = useRef<
    Record<string, HTMLInputElement | null>
  >({});

  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const addHistoryEntry = useCallback(
    ({ who, what, when }: { who?: string; what: string; when?: string }) => {
      if (!what) return;

      setHistoryEntries((prev) => {
        const entry: HistoryEntry = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          who: who && who.trim().length > 0 ? who : "Current User",
          what,
          when: when ?? formatHistoryTimestamp(),
        };

        return [entry, ...prev].slice(0, 200);
      });
    },
    [],
  );

  const openHistoryModal = useCallback(() => {
    setIsHistoryModalOpen(true);
  }, []);

  const closeHistoryModal = useCallback(() => {
    setIsHistoryModalOpen(false);
  }, []);

  const activeLocationForData = useMemo(() => {
    if (selectedLocation === "all" || selectedLocation === "") {
      return locations.length > 0 ? locations[0].value : "";
    }
    return selectedLocation;
  }, [selectedLocation, locations]);

  const [localHolidays, setLocalHolidays] = useState<Holiday[]>([]);

  // Sync local holidays with DB holidays
  useEffect(() => {
    const transformedHolidays = dbHolidays.map((h) => {
      const startDate = new Date(h.start_date);
      const endDate = new Date(h.end_date);
      
      const formatDateForDisplay = (date: Date): string => {
        const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const year = date.getFullYear();
        return `${weekday} ${month}/${day}/${year}`;
      };

      const startDateStr = formatDateForDisplay(startDate);
      const endDateStr = formatDateForDisplay(endDate);
      
      const isSameDay =
        startDate.getFullYear() === endDate.getFullYear() &&
        startDate.getMonth() === endDate.getMonth() &&
        startDate.getDate() === endDate.getDate();

      return {
        id: String(h.id),
        holiday: isSameDay ? startDateStr : `${startDateStr} to ${endDateStr}`,
        description: h.name || h.description || "",
        locations: Array.isArray(h.location_ids) 
          ? h.location_ids.map((id: number) => String(id))
          : [],
      };
    });
    setLocalHolidays(transformedHolidays);
  }, [dbHolidays]);

  // Transform DB service groups to component format
  useEffect(() => {
    if (!activeLocationForData) return;

    const locationId = parseInt(activeLocationForData);
    if (isNaN(locationId)) return;

    fetchServiceGroups(locationId);
  }, [activeLocationForData, fetchServiceGroups]);

  // Transform fetched service groups to component format
  useEffect(() => {
    if (!activeLocationForData) return;

    const transformedGroups = dbServiceGroups.map((group) => {
      // Get service names from service_ids
      const services = group.service_ids.map((serviceId: number) => {
        const service = dbServices.find((s) => s.id === serviceId);
        return {
          id: String(serviceId),
          label: service ? service.name : `Service ${serviceId}`,
        };
      });

      return {
        id: String(group.id),
        label: group.group_name,
        services,
      };
    });

    setServiceGroupsByLocation((prev) => ({
      ...prev,
      [activeLocationForData]: transformedGroups,
    }));

    // Initialize selections for new groups
    setSelectedServiceGroupsByLocation((prev) => {
      const locationSelections = prev[activeLocationForData] || {};
      const newSelections = { ...locationSelections };

      transformedGroups.forEach((group) => {
        if (!(group.id in newSelections)) {
          newSelections[group.id] = [];
        }
      });

      return {
        ...prev,
        [activeLocationForData]: newSelections,
      };
    });
  }, [dbServiceGroups, activeLocationForData, dbServices]);

  const serviceGroups = useMemo(
    () => serviceGroupsByLocation[activeLocationForData] ?? [],
    [serviceGroupsByLocation, activeLocationForData],
  );
  
  const serviceGroupLabelMap = useMemo(
    () => new Map(serviceGroups.map((group) => [group.id, group.label])),
    [serviceGroups],
  );
  
  const selectedServiceGroups = useMemo(
    () => selectedServiceGroupsByLocation[activeLocationForData] ?? {},
    [selectedServiceGroupsByLocation, activeLocationForData],
  );

  const historyItems = useMemo<TeamChange[]>(
    () =>
      historyEntries.map((entry) => ({
        id: entry.id,
        at: entry.when,
        actor: { name: entry.who ?? "Unknown" },
        type: "other",
        summary: entry.what,
      })),
    [historyEntries],
  );

  const locationValues = useMemo(
    () => locations.map((loc) => loc.value),
    [locations]
  );

  const [dailyLockedSlotsByLocation, setDailyLockedSlotsByLocation] = useState<
    Record<string, LockedSlotsMap>
  >(() => createInitialDailyLockedSlotsByLocation(locationValues));
  const [dailyLockedSlotsDraftByLocation, setDailyLockedSlotsDraftByLocation] =
    useState<Record<string, LockedSlotsMap>>(() =>
      createInitialDailyLockedSlotsByLocation(locationValues),
    );
  const [dailyJobsAvailabilityByLocation, setDailyJobsAvailabilityByLocation] =
    useState<Record<string, JobsAvailabilityMap>>(() =>
      createInitialDailyJobsAvailabilityByLocation(locationValues),
    );
  const [
    dailyJobsAvailabilityDraftByLocation,
    setDailyJobsAvailabilityDraftByLocation,
  ] = useState<Record<string, JobsAvailabilityMap>>(() =>
    createInitialDailyJobsAvailabilityByLocation(locationValues),
  );
  const [
    dailyLockedSlotTimestampsByLocation,
    setDailyLockedSlotTimestampsByLocation,
  ] = useState<Record<string, LockedSlotTimestampsMap>>(() =>
    createInitialDailyLockedSlotTimestampsByLocation(locationValues),
  );
  const [
    dailyLockedSlotTimestampsDraftByLocation,
    setDailyLockedSlotTimestampsDraftByLocation,
  ] = useState<Record<string, LockedSlotTimestampsMap>>(() =>
    createInitialDailyLockedSlotTimestampsByLocation(locationValues),
  );

  // Maximum Settings State
  const [maximumDaySettingsByLocation, setMaximumDaySettingsByLocation] =
    useState<MaximumSettingsByLocation>({});
  const [
    maximumDaySettingsDraftByLocation,
    setMaximumDaySettingsDraftByLocation,
  ] = useState<MaximumSettingsByLocation>({});
  const [
    _maximumSettingsHistoryByLocation,
    setMaximumSettingsHistoryByLocation,
  ] = useState<Record<string, MaximumSettingsHistoryEntry[]>>({});
  const pendingMaximumJobsRef = useRef<PendingMaximumJobsByLocation>({});

  // Fetch max settings IMMEDIATELY on location change (not just when tab is clicked)
  useEffect(() => {
    if (!activeLocationForData) return;
    
    const locationId = parseInt(activeLocationForData);
    if (isNaN(locationId)) return;
    
    // Fetch regardless of active tab - daily settings needs this data
    fetchMaxSettings(locationId);
  }, [activeLocationForData, fetchMaxSettings]);

  // Transform fetched max settings to component format
  useEffect(() => {
    if (!activeLocationForData) return;

    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    
    const settingsByDay: MaximumDaySettings[] = dayNames.map((dayName, index) => ({
      id: String(index + 1),
      day: dayName,
      isOpen: true, // Will be updated from dbMaxSettings
      timeSlots: [],
      serviceGroupSlots: {},
    }));

    // Populate with actual data from API
    dbMaxSettings.forEach((setting) => {
      const dayIndex = setting.day_of_week;
      if (dayIndex >= 0 && dayIndex < 7) {
        const daySetting = settingsByDay[dayIndex];
        
        if (setting.service_group_id === null) {
          // Main slots
          daySetting.isOpen = Boolean(setting.is_enabled);
          daySetting.timeSlots = setting.time_slots || [];
        } else {
          // Service group slots
          if (!daySetting.serviceGroupSlots) {
            daySetting.serviceGroupSlots = {};
          }
          daySetting.serviceGroupSlots[String(setting.service_group_id)] =
            setting.time_slots || [];
        }
      }
    });

    setMaximumDaySettingsByLocation((prev) => ({
      ...prev,
      [activeLocationForData]: cloneMaximumDaySettings(settingsByDay),
    }));

    setMaximumDaySettingsDraftByLocation((prev) => ({
      ...prev,
      [activeLocationForData]: cloneMaximumDaySettings(settingsByDay),
    }));
  }, [dbMaxSettings, activeLocationForData]);

  // Date range for daily settings
  const [startDate, setStartDate] = useState<Date | null>(() => getToday());
  const [endDate, setEndDate] = useState<Date | null>(() =>
    getDefaultEndDate(getToday()),
  );

  // Fetch daily adjustments IMMEDIATELY on any date/location change, not just on tab click
  useEffect(() => {
    if (!activeLocationForData || !startDate || !endDate) return;
    
    const locationId = parseInt(activeLocationForData);
    if (isNaN(locationId)) return;

    const startDateStr = formatDateForAPI(startDate);
    const endDateStr = formatDateForAPI(endDate);

    // Remove activeTab check - fetch immediately
    fetchDailyAdjustments(locationId, startDateStr, endDateStr);
  }, [activeLocationForData, startDate, endDate, fetchDailyAdjustments]);

  // Transform fetched daily adjustments to component format
  useEffect(() => {
    if (!activeLocationForData) return;

    const lockedSlots: LockedSlotsMap = {};
    const lockedTimestamps: LockedSlotTimestampsMap = {};
    const jobsAvail: JobsAvailabilityMap = {};

    dbDailyAdjustments.forEach((adj) => {
      // Convert from YYYY-MM-DD to MM/DD/YYYY
      const [year, month, day] = adj.date.split('-');
      const dateValue = `${parseInt(month)}/${parseInt(day)}/${year}`;

      if (adj.locked_slots) {
        lockedSlots[dateValue] = adj.locked_slots;
      }
      if (adj.locked_slot_timestamps) {
        lockedTimestamps[dateValue] = adj.locked_slot_timestamps;
      }
      if (adj.jobs_availability) {
        jobsAvail[dateValue] = adj.jobs_availability;
      }
    });

    setDailyLockedSlotsByLocation((prev) => {
      return {
      ...prev,
      [activeLocationForData]: lockedSlots,
      };
    });

    setDailyLockedSlotsDraftByLocation((prev) => ({
      ...prev,
      [activeLocationForData]: cloneLockedSlots(lockedSlots),
    }));

    setDailyLockedSlotTimestampsByLocation((prev) => ({
      ...prev,
      [activeLocationForData]: lockedTimestamps,
    }));

    setDailyLockedSlotTimestampsDraftByLocation((prev) => ({
      ...prev,
      [activeLocationForData]: cloneLockedSlotTimestamps(lockedTimestamps),
    }));

    setDailyJobsAvailabilityByLocation((prev) => ({
      ...prev,
      [activeLocationForData]: jobsAvail,
    }));

    setDailyJobsAvailabilityDraftByLocation((prev) => ({
      ...prev,
      [activeLocationForData]: cloneJobsAvailability(jobsAvail),
    }));
  }, [dbDailyAdjustments, activeLocationForData]);

  useEffect(() => {
    const previousTab = previousActiveTabRef.current;
    const previousMaximumLocation = previousMaximumTabLocationRef.current;
    const previousDailyLocation = previousDailyTabLocationRef.current;

    if (
      previousTab !== "maximum-settings" &&
      activeTab === "maximum-settings"
    ) {
      const committed =
        maximumDaySettingsByLocation[activeLocationForData] ??
        cloneMaximumDaySettings(
          getBaseMaximumSettingsForLocation(activeLocationForData),
        );

      setMaximumDaySettingsDraftByLocation((prev) => {
        if (prev[activeLocationForData]) {
          return prev;
        }
        return {
          ...prev,
          [activeLocationForData]: cloneMaximumDaySettings(committed),
        };
      });

      previousMaximumTabLocationRef.current = activeLocationForData;
    } else if (
      previousTab === "maximum-settings" &&
      activeTab !== "maximum-settings"
    ) {
      if (previousMaximumLocation) {
        const committed =
          maximumDaySettingsByLocation[previousMaximumLocation] ??
          cloneMaximumDaySettings(
            getBaseMaximumSettingsForLocation(previousMaximumLocation),
          );
        setMaximumDaySettingsDraftByLocation((prev) => ({
          ...prev,
          [previousMaximumLocation]: cloneMaximumDaySettings(committed),
        }));
      }
      previousMaximumTabLocationRef.current = null;
    }

    if (previousTab !== "daily-settings" && activeTab === "daily-settings") {
      const committed = dailyLockedSlotsByLocation[activeLocationForData] ?? {};
      const committedTimestamps =
        dailyLockedSlotTimestampsByLocation[activeLocationForData] ?? {};
      const committedJobsAvailability =
        dailyJobsAvailabilityByLocation[activeLocationForData] ?? {};
      setDailyLockedSlotsDraftByLocation((prev) => {
        const existing = prev[activeLocationForData];
        if (existing) {
          return prev;
        }
        return {
          ...prev,
          [activeLocationForData]: cloneLockedSlots(committed),
        };
      });
      setDailyLockedSlotTimestampsDraftByLocation((prev) => {
        const existing = prev[activeLocationForData];
        if (existing) {
          return prev;
        }
        return {
          ...prev,
          [activeLocationForData]:
            cloneLockedSlotTimestamps(committedTimestamps),
        };
      });
      setDailyJobsAvailabilityDraftByLocation((prev) => {
        const existing = prev[activeLocationForData];
        if (existing) {
          return prev;
        }
        return {
          ...prev,
          [activeLocationForData]: cloneJobsAvailability(
            committedJobsAvailability,
          ),
        };
      });
      previousDailyTabLocationRef.current = activeLocationForData;
    } else if (
      previousTab === "daily-settings" &&
      activeTab !== "daily-settings"
    ) {
      if (previousDailyLocation) {
        const committed =
          dailyLockedSlotsByLocation[previousDailyLocation] ?? {};
        const committedTimestamps =
          dailyLockedSlotTimestampsByLocation[previousDailyLocation] ?? {};
        const committedJobsAvailability =
          dailyJobsAvailabilityByLocation[previousDailyLocation] ?? {};
        setDailyLockedSlotsDraftByLocation((prev) => ({
          ...prev,
          [previousDailyLocation]: cloneLockedSlots(committed),
        }));
        setDailyLockedSlotTimestampsDraftByLocation((prev) => ({
          ...prev,
          [previousDailyLocation]:
            cloneLockedSlotTimestamps(committedTimestamps),
        }));
        setDailyJobsAvailabilityDraftByLocation((prev) => ({
          ...prev,
          [previousDailyLocation]: cloneJobsAvailability(
            committedJobsAvailability,
          ),
        }));
      }
      previousDailyTabLocationRef.current = null;
    }

    previousActiveTabRef.current = activeTab;
  }, [
    activeTab,
    activeLocationForData,
    maximumDaySettingsByLocation,
    dailyLockedSlotsByLocation,
    dailyLockedSlotTimestampsByLocation,
    dailyJobsAvailabilityByLocation,
  ]);

  useEffect(() => {
    if (activeTab === "holidays") {
      if (selectedHolidayLocations.size === 0) {
        setSelectedHolidayLocations(new Set(locations.map((loc) => loc.value)));
      }
    } else {
      if (selectedLocation === "all" || selectedLocation === "") {
        if (locations.length > 0) {
          setSelectedLocation(locations[0].value);
        }
      }
    }
  }, [activeTab, selectedLocation, selectedHolidayLocations.size, locations]);

  useEffect(() => {
    if (activeTab !== "maximum-settings") {
      return;
    }

    previousMaximumTabLocationRef.current = selectedLocation;
  }, [activeTab, selectedLocation]);

  useEffect(() => {
    if (activeTab !== "daily-settings") {
      return;
    }

    setDailyLockedSlotsDraftByLocation((prev) => {
      const existing = prev[activeLocationForData];
      if (existing) {
        return prev;
      }
      const committed = dailyLockedSlotsByLocation[activeLocationForData] ?? {};
      return {
        ...prev,
        [activeLocationForData]: cloneLockedSlots(committed),
      };
    });
    setDailyLockedSlotTimestampsDraftByLocation((prev) => {
      const existing = prev[activeLocationForData];
      if (existing) {
        return prev;
      }
      const committed =
        dailyLockedSlotTimestampsByLocation[activeLocationForData] ?? {};
      return {
        ...prev,
        [activeLocationForData]: cloneLockedSlotTimestamps(committed),
      };
    });
    setDailyJobsAvailabilityDraftByLocation((prev) => {
      const existing = prev[activeLocationForData];
      if (existing) {
        return prev;
      }
      const committed =
        dailyJobsAvailabilityByLocation[activeLocationForData] ?? {};
      return {
        ...prev,
        [activeLocationForData]: cloneJobsAvailability(committed),
      };
    });

    previousDailyTabLocationRef.current = activeLocationForData;
  }, [
    activeTab,
    activeLocationForData,
    dailyLockedSlotsByLocation,
    dailyLockedSlotTimestampsByLocation,
    dailyJobsAvailabilityByLocation,
  ]);

  const maximumDaySettings =
    maximumDaySettingsByLocation[activeLocationForData] ??
    cloneMaximumDaySettings(
      getBaseMaximumSettingsForLocation(activeLocationForData),
    );
  const maximumDaySettingsDraft =
    maximumDaySettingsDraftByLocation[activeLocationForData] ??
    cloneMaximumDaySettings(
      getBaseMaximumSettingsForLocation(activeLocationForData),
    );

  const buildSlotChangeDescriptions = (
    dayName: string,
    prevSlots: TimeSlot[] = [],
    nextSlots: TimeSlot[] = [],
    contextLabel?: string,
  ): string[] => {
    const changes: string[] = [];
    const prevMap = new Map(prevSlots.map((slot) => [slot.id, slot]));
    const nextMap = new Map(nextSlots.map((slot) => [slot.id, slot]));

    const buildPrefix = (slotLabel: string) =>
      `${dayName}${contextLabel ? ` • ${contextLabel}` : ""}: ${slotLabel}`;

    nextMap.forEach((nextSlot, slotId) => {
      const prevSlot = prevMap.get(slotId);
      const prevLabel = prevSlot ? formatTimeSlotDisplay(prevSlot) : "";
      const nextLabel = formatTimeSlotDisplay(nextSlot);
      const prefix = buildPrefix(nextLabel);

      if (!prevSlot) {
        changes.push(`${prefix} added with ${nextSlot.jobsMax ?? 0} Jobs Max`);
        return;
      }

      if (
        prevSlot.startTime !== nextSlot.startTime ||
        prevSlot.endTime !== nextSlot.endTime ||
        prevLabel !== nextLabel
      ) {
        changes.push(
          `${dayName}${contextLabel ? ` • ${contextLabel}` : ""}: slot changed from ${prevLabel} to ${nextLabel}`,
        );
      }

      if ((prevSlot.jobsMax ?? 0) !== (nextSlot.jobsMax ?? 0)) {
        changes.push(
          `${prefix} Jobs Max changed from ${prevSlot.jobsMax ?? 0} to ${
            nextSlot.jobsMax ?? 0
          }`,
        );
      }

      if (!!prevSlot.isFullMax !== !!nextSlot.isFullMax) {
        changes.push(
          `${prefix} Full Max ${nextSlot.isFullMax ? "enabled" : "disabled"}`,
        );
      }
    });

    prevMap.forEach((prevSlot, slotId) => {
      if (!nextMap.has(slotId)) {
        const prevLabel = formatTimeSlotDisplay(prevSlot);
        const prefix = buildPrefix(prevLabel);
        changes.push(`${prefix} removed`);
      }
    });

    return changes;
  };

  const computeMaximumSettingsChanges = useCallback(
    (
      prevConfig: MaximumDaySettings[],
      nextConfig: MaximumDaySettings[],
    ): string[] => {
      const changes: string[] = [];

      nextConfig.forEach((nextDay) => {
        const prevDay = prevConfig.find((day) => day.day === nextDay.day);
        if (!prevDay) {
          if (nextDay.isOpen) {
            changes.push(`${nextDay.day}: opened`);
          }
          return;
        }

        if (prevDay.isOpen !== nextDay.isOpen) {
          changes.push(
            `${nextDay.day}: ${nextDay.isOpen ? "opened" : "closed"}`,
          );
        }

        changes.push(
          ...buildSlotChangeDescriptions(
            nextDay.day,
            prevDay.timeSlots,
            nextDay.timeSlots,
          ),
        );

        const groupIds = new Set([
          ...(prevDay.serviceGroupSlots
            ? Object.keys(prevDay.serviceGroupSlots)
            : []),
          ...(nextDay.serviceGroupSlots
            ? Object.keys(nextDay.serviceGroupSlots)
            : []),
        ]);

        groupIds.forEach((groupId) => {
          const label =
            serviceGroupLabelMap.get(groupId) ?? `Service Group ${groupId}`;
          const prevSlots = prevDay.serviceGroupSlots?.[groupId] ?? [];
          const nextSlots = nextDay.serviceGroupSlots?.[groupId] ?? [];
          changes.push(
            ...buildSlotChangeDescriptions(
              nextDay.day,
              prevSlots,
              nextSlots,
              label,
            ),
          );
        });
      });

      return changes;
    },
    [serviceGroupLabelMap],
  );

  useEffect(() => {
    if (activeTab !== "maximum-settings") {
      return;
    }

    previousMaximumTabLocationRef.current = selectedLocation;
  }, [activeTab, selectedLocation]);

  useEffect(() => {
    if (activeTab !== "daily-settings") {
      return;
    }

    setDailyLockedSlotsDraftByLocation((prev) => {
      const existing = prev[activeLocationForData];
      if (existing) {
        return prev;
      }
      const committed = dailyLockedSlotsByLocation[activeLocationForData] ?? {};
      return {
        ...prev,
        [activeLocationForData]: cloneLockedSlots(committed),
      };
    });

    previousDailyTabLocationRef.current = activeLocationForData;
  }, [activeTab, activeLocationForData, dailyLockedSlotsByLocation]);

  const handleMaximumDaySettingsChange = useCallback(
    (updater: (prev: MaximumDaySettings[]) => MaximumDaySettings[]) => {
      setMaximumDaySettingsDraftByLocation((prev) => {
        const current =
          prev[activeLocationForData] ??
          cloneMaximumDaySettings(
            getBaseMaximumSettingsForLocation(activeLocationForData),
          );
        const updated = cloneMaximumDaySettings(updater(current));
        return {
          ...prev,
          [activeLocationForData]: updated,
        };
      });
    },
    [activeLocationForData],
  );

  const handleSaveMaximumDaySettings = useCallback(async () => {
    const draft =
      maximumDaySettingsDraftByLocation[activeLocationForData] ??
      cloneMaximumDaySettings(
        getBaseMaximumSettingsForLocation(activeLocationForData),
      );
    const normalizedDraft = cloneMaximumDaySettings(draft);

    const committedBeforeSave =
      maximumDaySettingsByLocation[activeLocationForData] ??
      cloneMaximumDaySettings(
        getBaseMaximumSettingsForLocation(activeLocationForData),
      );

    const changes = computeMaximumSettingsChanges(
      committedBeforeSave,
      normalizedDraft,
    );

    if (changes.length > 0) {
      const timestamp = new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date());
      const locationLabel =
        locations.find((loc) => loc.value === selectedLocation)?.label ??
        selectedLocation;
      const entry: MaximumSettingsHistoryEntry = {
        id: `${Date.now()}`,
        timestamp,
        location: activeLocationForData,
        changes,
      };

      setMaximumSettingsHistoryByLocation((prev) => {
        const previousHistory = prev[activeLocationForData] ?? [];
        return {
          ...prev,
          [activeLocationForData]: [entry, ...previousHistory].slice(0, 50),
        };
      });

      addHistoryEntry({
        what:
          changes.length > 0
            ? `Maximum settings updated for ${locationLabel}: ${changes.join(" • ")}`
            : `Maximum settings updated for ${locationLabel}`,
        when: timestamp,
      });
    }

    // Convert to API format
    const apiSettings: any[] = [];

    normalizedDraft.forEach((daySetting, dayIndex) => {
      // Main day setting (no service group)
      apiSettings.push({
        day_of_week: dayIndex,
        is_enabled: daySetting.isOpen,
        time_slots: daySetting.timeSlots,
        service_group_id: null,
      });

      // Service group settings
      if (daySetting.serviceGroupSlots) {
        Object.entries(daySetting.serviceGroupSlots).forEach(([groupId, slots]) => {
          apiSettings.push({
            day_of_week: dayIndex,
            is_enabled: daySetting.isOpen,
            time_slots: slots,
            service_group_id: parseInt(groupId),
          });
        });
      }
    });

    try {
      const locationId = parseInt(activeLocationForData);
      await saveMaxSettings(locationId, apiSettings);

      await saveAdvancedGroupsSetting(locationId, isAdvanceServiceGroupEnabled);

      setMaximumDaySettingsByLocation((prev) => ({
        ...prev,
        [activeLocationForData]: normalizedDraft,
      }));

      setMaximumDaySettingsDraftByLocation((prev) => ({
        ...prev,
        [activeLocationForData]: cloneMaximumDaySettings(normalizedDraft),
      }));

      setDailyJobsAvailabilityDraftByLocation((prev) => {
        const currentDraft = prev[activeLocationForData] ?? {};
        const cleaned = { ...currentDraft };
        let hasChanges = false;

        normalizedDraft.forEach((daySetting) => {
          daySetting.timeSlots.forEach((slot) => {
            if (slot.isFullMax) {
              const slotLabel = formatTimeSlotDisplay(slot);
              Object.keys(cleaned).forEach((dateValue) => {
                const dateEntry = cleaned[dateValue];
                if (dateEntry && slotLabel in dateEntry) {
                  delete dateEntry[slotLabel];
                  hasChanges = true;
                  if (Object.keys(dateEntry).length === 0) {
                    delete cleaned[dateValue];
                  }
                }
              });
            }
          });

          if (daySetting.serviceGroupSlots) {
            Object.values(daySetting.serviceGroupSlots).forEach((slots) => {
              slots.forEach((slot) => {
                if (slot.isFullMax) {
                  const slotLabel = formatTimeSlotDisplay(slot);
                  Object.keys(cleaned).forEach((dateValue) => {
                    const dateEntry = cleaned[dateValue];
                    if (dateEntry && slotLabel in dateEntry) {
                      delete dateEntry[slotLabel];
                      hasChanges = true;
                      if (Object.keys(dateEntry).length === 0) {
                        delete cleaned[dateValue];
                      }
                    }
                  });
                }
              });
            });
          }
        });

        if (!hasChanges) {
          return prev;
        }

        return {
          ...prev,
          [activeLocationForData]: cleaned,
        };
      });

      toast.success({
        title: "Changes saved",
        description: "Maximum settings have been saved successfully.",
      });
    } catch (error: any) {
      toast.error({
        title: "Save failed",
        description: error.message || "Failed to save maximum settings",
      });
    }
  }, [
    maximumDaySettingsByLocation,
    maximumDaySettingsDraftByLocation,
    activeLocationForData,
    locations,
    selectedLocation,
    computeMaximumSettingsChanges,
    toast,
    addHistoryEntry,
    saveMaxSettings,
    saveAdvancedGroupsSetting,
    isAdvanceServiceGroupEnabled,
  ]);

  useEffect(() => {
    const parentCheckboxes = serviceGroupParentRefs.current;
    const activeGroupIds = new Set(serviceGroups.map((group) => group.id));

    Object.keys(parentCheckboxes).forEach((groupId) => {
      if (!activeGroupIds.has(groupId)) {
        delete parentCheckboxes[groupId];
      }
    });

    serviceGroups.forEach((group) => {
      const checkbox = parentCheckboxes[group.id];
      if (!checkbox) return;

      const selectedCount = selectedServiceGroups[group.id]?.length ?? 0;
      checkbox.indeterminate =
        selectedCount > 0 && selectedCount < group.services.length;
    });
  }, [serviceGroups, selectedServiceGroups]); 

  // Track if we're saving to avoid duplicate saves
  const isSavingAdvancedGroupRef = useRef(false);
  const previousAdvancedGroupStateRef = useRef<boolean | null>(null);

  // Fetch advanced groups setting immediately on location change (not just when tab is clicked)
  useEffect(() => {
    if (!activeLocationForData) return;

    const locationId = parseInt(activeLocationForData);
    if (isNaN(locationId)) return;

    const loadSetting = async () => {
      try {
        const enabled = await fetchAdvancedGroupsSetting(locationId);
        setIsAdvanceServiceGroupEnabled(enabled);
        previousAdvancedGroupStateRef.current = enabled;
        isSavingAdvancedGroupRef.current = false;
      } catch (error) {
        console.error("Failed to fetch advanced groups setting:", error);
        setIsAdvanceServiceGroupEnabled(false);
        previousAdvancedGroupStateRef.current = false;
        isSavingAdvancedGroupRef.current = false;
      }
    };

    loadSetting();
  }, [activeLocationForData]);

  // Save advanced groups setting only when it actually changes
  useEffect(() => {
    if (!activeLocationForData || activeTab !== "maximum-settings") return;

    const locationId = parseInt(activeLocationForData);
    if (isNaN(locationId)) return;

    // Don't save if we just loaded the setting
    if (previousAdvancedGroupStateRef.current === null) return;

    // Don't save if the state hasn't actually changed
    if (previousAdvancedGroupStateRef.current === isAdvanceServiceGroupEnabled) return;

    if (isSavingAdvancedGroupRef.current) return;

    isSavingAdvancedGroupRef.current = true;

    const saveToggle = async () => {
      try {
        await saveAdvancedGroupsSetting(locationId, isAdvanceServiceGroupEnabled);
        previousAdvancedGroupStateRef.current = isAdvanceServiceGroupEnabled;
        
        toast.success({
          title: "Saved",
          description: `Advanced service groups ${isAdvanceServiceGroupEnabled ? "enabled" : "disabled"}`,
        });
      } catch (error: any) {
        toast.error({
          title: "Save failed",
          description: error.message || "Failed to save setting",
        });
        // Revert on error
        setIsAdvanceServiceGroupEnabled(!isAdvanceServiceGroupEnabled);
        previousAdvancedGroupStateRef.current = null;
      } finally {
        isSavingAdvancedGroupRef.current = false;
      }
    };

    saveToggle();
  }, [isAdvanceServiceGroupEnabled, activeLocationForData, activeTab, saveAdvancedGroupsSetting, toast]);

  const handleToggleServiceGroup = (groupId: string) => {
    const group = serviceGroups.find((item) => item.id === groupId);
    if (!group) return;

    setSelectedServiceGroupsByLocation((prev) => {
      const locationSelections = prev[selectedLocation] ?? {};
      const currentSelections = locationSelections[groupId] ?? [];
      const isFullySelected =
        currentSelections.length === group.services.length &&
        group.services.length > 0;

      const nextSelections = isFullySelected
        ? []
        : group.services.map((service) => service.id);

      return {
        ...prev,
        [selectedLocation]: {
          ...locationSelections,
          [groupId]: nextSelections,
        },
      };
    });
  };

  const handleToggleService = (groupId: string, serviceId: string) => {
    setSelectedServiceGroupsByLocation((prev) => {
      const locationSelections = prev[selectedLocation] ?? {};
      const currentSelections = locationSelections[groupId] ?? [];
      const isSelected = currentSelections.includes(serviceId);

      const nextSelections = isSelected
        ? currentSelections.filter((id) => id !== serviceId)
        : [...currentSelections, serviceId];

      return {
        ...prev,
        [selectedLocation]: {
          ...locationSelections,
          [groupId]: nextSelections,
        },
      };
    });
  };

  const handleOpenEditServiceGroup = (groupId: string) => {
    const group = serviceGroups.find((item) => item.id === groupId);
    if (!group) return;

    setEditServiceGroupDraft(cloneServiceGroup(group));
    setEditingServiceGroupId(groupId);
  };

  const handleCloseEditServiceGroup = () => {
    setEditingServiceGroupId(null);
    setEditServiceGroupDraft(null);
    setEditServiceValidationErrors(new Set());
  };

  const handleEditGroupNameChange = (value: string) => {
    setEditServiceGroupDraft((prev) =>
      prev
        ? {
            ...prev,
            label: value,
          }
        : prev,
    );
  };

  const handleEditServiceLabelChange = (serviceId: string, value: string) => {
    setEditServiceGroupDraft((prev) =>
      prev
        ? {
            ...prev,
            services: prev.services.map((service) =>
              service.id === serviceId ? { ...service, label: value } : service,
            ),
          }
        : prev,
    );
    if (value.trim()) {
      setEditServiceValidationErrors((prevErrors) => {
        const next = new Set(prevErrors);
        next.delete(serviceId);
        return next;
      });
    }
  };

  const handleRemoveServiceFromDraft = (serviceId: string) => {
    setEditServiceGroupDraft((prev) =>
      prev
        ? {
            ...prev,
            services: prev.services.filter(
              (service) => service.id !== serviceId,
            ),
          }
        : prev,
    );
  };

  const handleAddServiceToDraft = () => {
    setEditServiceGroupDraft((prev) => {
      if (!prev) return prev;

      const lastService = prev.services[prev.services.length - 1];
      if (!lastService || !lastService.label.trim()) {
        if (lastService) {
          setEditServiceValidationErrors((prevErrors) => {
            const next = new Set(prevErrors);
            next.add(lastService.id);
            return next;
          });
        }
        return prev;
      }

      setEditServiceValidationErrors(new Set());

      return {
        ...prev,
        services: [
          ...prev.services,
          {
            id: generateServiceItemId(prev.id),
            label: "",
          },
        ],
      };
    });
  };

  const handleUpdateServiceGroup = async () => {
    if (!editServiceGroupDraft) return;

    const sanitizedServices = editServiceGroupDraft.services
      .map((service) => ({
        ...service,
        label: service.label.trim(),
      }))
      .filter((service) => service.label.length > 0);

    const updatedGroup: ServiceGroup = {
      ...editServiceGroupDraft,
      label: editServiceGroupDraft.label.trim() || "Untitled Group",
      services: sanitizedServices,
    };

    try {
      const groupId = parseInt(editServiceGroupDraft.id);
      const locationId = parseInt(activeLocationForData);
      
      // Get service IDs from service names
      const serviceIds = sanitizedServices
        .map((s) => parseInt(s.id))
        .filter((id) => !isNaN(id));

      await updateServiceGroup(groupId, {
        locationId,
        group_name: updatedGroup.label,
        service_ids: serviceIds,
      });

      setServiceGroupsByLocation((prev) => {
        const currentGroups = prev[selectedLocation] ?? [];
        return {
          ...prev,
          [selectedLocation]: currentGroups.map((group) =>
            group.id === updatedGroup.id ? updatedGroup : group,
          ),
        };
      });

      setSelectedServiceGroupsByLocation((prev) => {
        const locationSelections = prev[selectedLocation] ?? {};
        const currentSelections = locationSelections[updatedGroup.id] ?? [];
        const validIds = new Set(
          updatedGroup.services.map((service) => service.id),
        );
        return {
          ...prev,
          [selectedLocation]: {
            ...locationSelections,
            [updatedGroup.id]: currentSelections.filter((id) => validIds.has(id)),
          },
        };
      });

      handleCloseEditServiceGroup();
      toast.success({
        title: "Service group saved",
        description: "Changes have been saved successfully.",
      });
    } catch (error: any) {
      toast.error({
        title: "Save failed",
        description: error.message || "Failed to update service group",
      });
    }
  };

  const handleOpenDeleteServiceGroup = (groupId: string) => {
    const group = serviceGroups.find((item) => item.id === groupId);
    if (!group) return;

    setDeleteServiceGroupModal({
      isOpen: true,
      groupId: group.id,
      groupLabel: group.label,
    });
  };

  const handleCloseDeleteServiceGroup = () => {
    setDeleteServiceGroupModal({
      isOpen: false,
      groupId: "",
      groupLabel: "",
    });
  };

  const handleConfirmDeleteServiceGroup = async () => {
    const { groupId } = deleteServiceGroupModal;
    if (!groupId) return;

    try {
      await deleteServiceGroup(parseInt(groupId));

      setServiceGroupsByLocation((prev) => {
        const currentGroups = prev[selectedLocation] ?? [];
        return {
          ...prev,
          [selectedLocation]: currentGroups.filter(
            (group) => group.id !== groupId,
          ),
        };
      });
      setSelectedServiceGroupsByLocation((prev) => {
        const locationSelections = prev[selectedLocation] ?? {};
        if (!(groupId in locationSelections)) {
          return prev;
        }
        const rest = { ...locationSelections };
        delete rest[groupId];
        return {
          ...prev,
          [selectedLocation]: rest,
        };
      });

      if (editServiceGroupDraft?.id === groupId) {
        handleCloseEditServiceGroup();
      }

      handleCloseDeleteServiceGroup();
      toast.success({
        title: "Service group deleted",
        description: "The service group has been removed successfully.",
      });
    } catch (error: any) {
      toast.error({
        title: "Delete failed",
        description: error.message || "Failed to delete service group",
      });
    }
  };

  const handleOpenAddServiceGroup = () => {
    setNewServiceGroup({
      id: "",
      label: "",
      services: [createEmptyServiceEntry()],
    });
    setIsAddServiceGroupFormOpen(true);
  };

  const handleCloseAddServiceGroup = () => {
    setIsAddServiceGroupFormOpen(false);
    setNewServiceGroup({
      id: "",
      label: "",
      services: [createEmptyServiceEntry()],
    });
    setNewServiceValidationErrors(new Set());
  };

  const handleAddGroupNameChange = (value: string) => {
    setNewServiceGroup((prev) => ({
      ...prev,
      label: value,
    }));
  };

  const handleAddGroupServiceChange = (index: number, value: string) => {
    setNewServiceGroup((prev) => {
      const updated = {
        ...prev,
        services: prev.services.map((service, idx) =>
          idx === index ? { ...service, label: value } : service,
        ),
      };
      const service = prev.services[index];
      if (service && value.trim()) {
        setNewServiceValidationErrors((prevErrors) => {
          const next = new Set(prevErrors);
          next.delete(service.id);
          return next;
        });
      }
      return updated;
    });
  };

  const handleAddGroupAddService = () => {
    setNewServiceGroup((prev) => {
      if (prev.services.length === 0) {
        return {
          ...prev,
          services: [createEmptyServiceEntry(prev.id || "new-group")],
        };
      }

      const lastService = prev.services[prev.services.length - 1];
      if (!lastService || !lastService.label.trim()) {
        if (lastService) {
          setNewServiceValidationErrors((prevErrors) => {
            const next = new Set(prevErrors);
            next.add(lastService.id);
            return next;
          });
        }
        return prev;
      }

      setNewServiceValidationErrors(new Set());

      return {
        ...prev,
        services: [
          ...prev.services,
          createEmptyServiceEntry(prev.id || "new-group"),
        ],
      };
    });
  };

  const handleAddGroupRemoveService = (index: number) => {
    setNewServiceGroup((prev) => {
      const remaining = prev.services.filter((_, idx) => idx !== index);
      return {
        ...prev,
        services: remaining,
      };
    });
  };

  const handleConfirmAddServiceGroup = async () => {
    const trimmedLabel = newServiceGroup.label.trim();
    const sanitizedServices = newServiceGroup.services
      .map((service) => ({
        ...service,
        label: service.label.trim(),
      }))
      .filter((service) => service.label.length > 0);

    if (!trimmedLabel || sanitizedServices.length === 0) {
      toast.error({
        title: "Invalid input",
        description: "Please enter a group name and select at least one service",
      });
      return;
    }

    try {
      const locationId = parseInt(activeLocationForData);
      if (isNaN(locationId)) {
        toast.error({
          title: "Invalid location",
          description: "Please select a valid location first",
        });
        return;
      }

      // Map service names to actual service IDs from dbServices
      const serviceIds = sanitizedServices
        .map((service) => {
          // Find service by name (case-insensitive)
          const foundService = dbServices.find(
            (s) => s.name.toLowerCase() === service.label.toLowerCase()
          );
          if (!foundService) {
            console.warn(`Service not found: ${service.label}`);
            return null;
          }
          return foundService.id; // Return actual numeric ID
        })
        .filter((id): id is number => id !== null);

      if (serviceIds.length === 0) {
        toast.error({
          title: "No valid services",
          description: "Could not find the selected services. Try selecting from the dropdown.",
        });
        return;
      }

      // Verify all services belong to this location
      const invalidServices = serviceIds.filter((serviceId) => {
        const service = dbServices.find((s) => s.id === serviceId);
        if (!service) return true;
        const belongsToLocation = service.locations?.some(
          (loc) => loc.id === locationId
        );
        return !belongsToLocation;
      });

      if (invalidServices.length > 0) {
        toast.error({
          title: "Services not available",
          description: "Some selected services don't belong to this location",
        });
        return;
      }

      const newGroupData = await createServiceGroup({
        locationId,
        group_name: trimmedLabel,
        service_ids: serviceIds, // Array of integers
      });

      const formattedServices = sanitizedServices.map((service, idx) => ({
        id: String(serviceIds[idx]),
        label: service.label,
      }));

      const newGroup: ServiceGroup = {
        id: String(newGroupData.id),
        label: trimmedLabel,
        services: formattedServices,
      };

      setServiceGroupsByLocation((prev) => {
        const currentGroups = prev[selectedLocation] ?? [];
        return {
          ...prev,
          [selectedLocation]: [...currentGroups, newGroup],
        };
      });

      setSelectedServiceGroupsByLocation((prev) => {
        const locationSelections = prev[selectedLocation] ?? {};
        return {
          ...prev,
          [selectedLocation]: {
            ...locationSelections,
            [newGroup.id]: [],
          },
        };
      });

      handleCloseAddServiceGroup();
      toast.success({
        title: "Service group created",
        description: `"${trimmedLabel}" has been created successfully.`,
      });
    } catch (error: any) {
      console.error("Service group creation error:", error);
      toast.error({
        title: "Create failed",
        description: error.message || "Failed to create service group",
      });
    }
  };

  const handleDailyLockedSlotsChange = useCallback(
    (updater: (prev: LockedSlotsMap) => LockedSlotsMap) => {
      setDailyLockedSlotsDraftByLocation((prev) => {
        const currentDraft = prev[activeLocationForData] ?? {};
        const nextDraft = updater(cloneLockedSlots(currentDraft));

        return {
          ...prev,
          [activeLocationForData]: nextDraft,
        };
      });
    },
    [activeLocationForData],
  );

  const handleDailyJobsAvailabilityChange = useCallback(
    (updater: (prev: JobsAvailabilityMap) => JobsAvailabilityMap) => {
      setDailyJobsAvailabilityDraftByLocation((prev) => {
        const current = prev[activeLocationForData] ?? {};
        const updated = updater(cloneJobsAvailability(current));
        return {
          ...prev,
          [activeLocationForData]: updated,
        };
      });
    },
    [activeLocationForData],
  );

  const handleDailyLockedSlotTimestampsChange = useCallback(
    (updater: (prev: LockedSlotTimestampsMap) => LockedSlotTimestampsMap) => {
      setDailyLockedSlotTimestampsDraftByLocation((prev) => {
        const currentDraft = prev[activeLocationForData] ?? {};
        const nextDraft = updater(cloneLockedSlotTimestamps(currentDraft));
        return {
          ...prev,
          [activeLocationForData]: nextDraft,
        };
      });
    },
    [activeLocationForData],
  );

  useEffect(() => {
    console.log("🟣 isAdvanceServiceGroupEnabled changed to:", isAdvanceServiceGroupEnabled);
  }, [isAdvanceServiceGroupEnabled]);

  const handleSaveDailySettings = useCallback(async () => {
    console.log("🟣 Before save - isAdvanceServiceGroupEnabled:", isAdvanceServiceGroupEnabled);
    const draftLocks =
      dailyLockedSlotsDraftByLocation[activeLocationForData] ?? {};
    const committedLocks =
      dailyLockedSlotsByLocation[activeLocationForData] ?? {};
    const draftJobs =
      dailyJobsAvailabilityDraftByLocation[activeLocationForData] ?? {};
    const committedJobs =
      dailyJobsAvailabilityByLocation[activeLocationForData] ?? {};
    const timestampDraft =
      dailyLockedSlotTimestampsDraftByLocation[activeLocationForData] ?? {};
    const lockChanges = computeLockedSlotChanges(
      committedLocks,
      draftLocks,
      serviceGroupLabelMap,
    );
    const jobChanges = computeJobsAvailabilityChanges(committedJobs, draftJobs);
    const changes = [...lockChanges, ...jobChanges];

    if (changes.length === 0) {
      return;
    }

    const normalizedDraftLocks = cloneLockedSlots(draftLocks);
    const committedLocksClone = cloneLockedSlots(normalizedDraftLocks);
    const normalizedTimestampDraft = cloneLockedSlotTimestamps(timestampDraft);
    const committedTimestampClone = cloneLockedSlotTimestamps(
      normalizedTimestampDraft,
    );
    const normalizedDraftJobs = cloneJobsAvailability(draftJobs);
    const committedJobsClone = cloneJobsAvailability(normalizedDraftJobs);

    // Convert to API format
    const adjustments: any[] = [];
    const allDates = new Set([
      ...Object.keys(normalizedDraftLocks),
      ...Object.keys(normalizedTimestampDraft),
      ...Object.keys(normalizedDraftJobs),
    ]);

    allDates.forEach((dateValue) => {
      // Convert MM/DD/YYYY to YYYY-MM-DD
      const [month, day, year] = dateValue.split('/');
      const apiDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

      adjustments.push({
        date: apiDate,
        is_booking_prevented: false, // Can be enhanced based on your logic
        locked_slots: normalizedDraftLocks[dateValue] || {},
        locked_slot_timestamps: normalizedTimestampDraft[dateValue] || {},
        jobs_availability: normalizedDraftJobs[dateValue] || {},
      });
    });

    try {
      const locationId = parseInt(activeLocationForData);
      await saveDailyAdjustments(locationId, adjustments);

      setDailyLockedSlotsByLocation((prev) => ({
        ...prev,
        [activeLocationForData]: committedLocksClone,
      }));

      setDailyLockedSlotsDraftByLocation((prev) => ({
        ...prev,
        [activeLocationForData]: normalizedDraftLocks,
      }));
      setDailyLockedSlotTimestampsByLocation((prev) => ({
        ...prev,
        [activeLocationForData]: committedTimestampClone,
      }));
      setDailyLockedSlotTimestampsDraftByLocation((prev) => ({
        ...prev,
        [activeLocationForData]: normalizedTimestampDraft,
      }));
      setDailyJobsAvailabilityByLocation((prev) => ({
        ...prev,
        [activeLocationForData]: committedJobsClone,
      }));
      setDailyJobsAvailabilityDraftByLocation((prev) => ({
        ...prev,
        [activeLocationForData]: normalizedDraftJobs,
      }));

      const pendingMaximumChanges =
        pendingMaximumJobsRef.current[activeLocationForData];

      if (pendingMaximumChanges) {
        setMaximumDaySettingsByLocation((prev) => {
          const existing =
            prev[activeLocationForData] ??
            cloneMaximumDaySettings(
              getBaseMaximumSettingsForLocation(activeLocationForData),
            );
          const nextSettings = applyPendingMaximumJobsChanges(
            existing,
            pendingMaximumChanges,
          );

          if (nextSettings === existing) {
            return prev;
          }

          return {
            ...prev,
            [activeLocationForData]: nextSettings,
          };
        });

        setMaximumDaySettingsDraftByLocation((prev) => {
          const existing =
            prev[activeLocationForData] ??
            cloneMaximumDaySettings(
              getBaseMaximumSettingsForLocation(activeLocationForData),
            );
          const nextSettings = applyPendingMaximumJobsChanges(
            existing,
            pendingMaximumChanges,
          );

          if (nextSettings === existing) {
            return prev;
          }

          return {
            ...prev,
            [activeLocationForData]: nextSettings,
          };
        });

        delete pendingMaximumJobsRef.current[activeLocationForData];
      }

      addHistoryEntry({
        what: changes.join(" | "),
      });

      console.log("🟣 After save - isAdvanceServiceGroupEnabled:", isAdvanceServiceGroupEnabled);

      toast.success({
        title: "Changes saved",
        description: "Daily settings have been saved successfully.",
      });
    } catch (error: any) {
      console.log("🟣 Error - isAdvanceServiceGroupEnabled:", isAdvanceServiceGroupEnabled);
      toast.error({
        title: "Save failed",
        description: error.message || "Failed to save daily adjustments",
      });
    }
  }, [
    activeLocationForData,
    dailyLockedSlotsDraftByLocation,
    dailyLockedSlotsByLocation,
    dailyJobsAvailabilityDraftByLocation,
    dailyJobsAvailabilityByLocation,
    dailyLockedSlotTimestampsDraftByLocation,
    serviceGroupLabelMap,
    addHistoryEntry,
    toast,
    saveDailyAdjustments,
  ]);

  const handleRemoveHoliday = async (holidayId: string, holidayName: string) => {
    try {
      await deleteHoliday(parseInt(holidayId));
      addHistoryEntry({
        what: `Holiday deleted: ${holidayName}`,
      });
      toast.success({
        title: "Holiday deleted",
        description: "The holiday has been removed successfully.",
      });
    } catch (error: any) {
      toast.error({
        title: "Delete failed",
        description: error.message || "Failed to delete holiday",
      });
    }
  };

  return (
    <div className="px-3 pb-5 sm:px-4 md:px-5">
      <div className="mb-4 flex flex-col items-start justify-between gap-3 sm:mb-5 sm:flex-row sm:items-center sm:gap-4 md:mb-6">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="relative inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gray-700 sm:h-11 sm:w-11 md:h-12 md:w-12">
            <svg
              className="h-5 w-5 text-white sm:h-5 sm:w-5 md:h-6 md:w-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
                d="M8 7V3m8 4V3m-9 8h10M5 5h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z"
              />
            </svg>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold text-gray-900 sm:text-2xl md:text-3xl">
              Booking Times
            </span>
          </div>
        </div>
      </div>

      {/* Spot Settings */}
      <div className="mb-4 sm:mb-5">
        <div className="rounded-lg border border-gray-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
          <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 sm:px-5 sm:py-3 md:px-6 md:py-4">
            <h2 className="text-base font-semibold text-gray-900 sm:text-base md:text-lg">
              Time Settings
            </h2>
          </div>

          <div className="flex flex-col gap-4 px-4 py-4 sm:px-5 sm:py-4 md:px-6 md:py-4 lg:flex-row lg:justify-between lg:gap-4">
            <div className="flex flex-row items-center gap-0 sm:gap-2 md:gap-4">
              <button
                onClick={() => setActiveTab("daily-settings")}
                className={`relative cursor-pointer px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors sm:px-4 sm:py-2.5 sm:text-xs md:px-5 md:py-3 md:text-sm ${
                  activeTab === "daily-settings"
                    ? "border-b-2 border-gray-600 bg-gray-50 text-gray-600"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                Daily Settings
              </button>
              <button
                onClick={() => setActiveTab("holidays")}
                className={`relative cursor-pointer px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors sm:px-4 sm:py-2.5 sm:text-xs md:px-5 md:py-3 md:text-sm ${
                  activeTab === "holidays"
                    ? "border-b-2 border-gray-600 bg-gray-50 text-gray-600"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                Holidays
              </button>
              <button
                onClick={() => setActiveTab("maximum-settings")}
                className={`relative cursor-pointer px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors sm:px-4 sm:py-2.5 sm:text-xs md:px-5 md:py-3 md:text-sm ${
                  activeTab === "maximum-settings"
                    ? "border-b-2 border-gray-600 bg-gray-50 text-gray-600"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                Max Settings
              </button>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-3 md:gap-4">
              {activeTab === "daily-settings" && (
                <div className="flex flex-col gap-2 sm:mb-[2px] sm:flex-1 xl:flex-initial">
                  <div className="w-full xl:w-[240px]">
                    <CustomDateRangePicker
                      startDate={startDate}
                      endDate={endDate}
                      onChange={(start, end) => {
                        setStartDate(start);
                        setEndDate(end);
                      }}
                      placeholder="Select date range"
                      className="w-full"
                      inputClassName="h-10 px-3 text-[14px] font-medium"
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2 sm:flex-1 xl:flex-initial">
                <div className="relative w-full sm:mb-[2px] xl:w-[240px]">
                  <Dropdown
                    label={
                      activeTab === "holidays"
                        ? selectedHolidayLocations.size === 0
                          ? "Select location(s)"
                          : selectedHolidayLocations.size === 1
                            ? locations.find(
                                (loc) =>
                                  loc.value ===
                                  Array.from(selectedHolidayLocations)[0],
                              )?.label || "Select location"
                            : selectedHolidayLocations.size === locations.length
                              ? "All Active Locations"
                              : `${selectedHolidayLocations.size} locations selected`
                        : selectedLocation === "all"
                          ? "All Active Locations"
                          : selectedLocation === ""
                            ? "Select location"
                            : locations.find(
                                (loc) => loc.value === selectedLocation,
                              )?.label || "Select location"
                    }
                    dismissOnClick={activeTab !== "holidays"}
                    className="w-full"
                    theme={{
                      floating: {
                        target:
                          "flex h-10 w-full cursor-pointer items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-all outline-none hover:bg-gray-50 focus:border-gray-100 [&>span]:block [&>span]:min-w-0 [&>span]:flex-1 [&>span]:truncate [&>span]:overflow-hidden [&>span]:text-ellipsis [&>span]:whitespace-nowrap",
                        base: "z-50 w-54 max-w-full min-w-full rounded-lg border border-gray-200 bg-white py-1 shadow-lg",
                        content: "w-54 max-w-full min-w-full py-1",
                      },
                    }}
                  >
                    {locations.map((location) => {
                      const isSelected =
                        activeTab === "holidays"
                          ? selectedHolidayLocations.has(location.value)
                          : selectedLocation === location.value;
                      return (
                        <DropdownItem
                          key={location.value}
                          onClick={() => {
                            if (activeTab === "holidays") {
                              setSelectedHolidayLocations((prev) => {
                                const next = new Set(prev);
                                if (next.has(location.value)) {
                                  next.delete(location.value);
                                } else {
                                  next.add(location.value);
                                }
                                return next;
                              });
                            } else {
                              setSelectedLocation(location.value);
                            }
                          }}
                          className={
                            isSelected
                              ? "bg-gray-50 font-medium text-gray-700"
                              : "hover:bg-gray-100"
                          }
                        >
                          <div className="flex w-full items-center justify-between">
                            <span>{location.label}</span>
                            {isSelected && (
                              <svg
                                className="h-4 w-4 text-gray-700"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                          </div>
                        </DropdownItem>
                      );
                    })}
                  </Dropdown>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {activeTab === "daily-settings" && (
        <DailySettings
          selectedLocation={activeLocationForData}
          serviceGroups={serviceGroups}
          isAdvanceServiceGroupEnabled={isAdvanceServiceGroupEnabled}
          startDate={startDate}
          endDate={endDate}
          maximumDaySettings={maximumDaySettings}
          lockedSlots={
            dailyLockedSlotsDraftByLocation[activeLocationForData] ?? {}
          }
          committedLockedSlots={
            dailyLockedSlotsByLocation[activeLocationForData] ?? {}
          }
          lockedSlotTimestamps={
            dailyLockedSlotTimestampsDraftByLocation[activeLocationForData] ??
            {}
          }
          committedLockedSlotTimestamps={
            dailyLockedSlotTimestampsByLocation[activeLocationForData] ?? {}
          }
          jobsAvailability={
            dailyJobsAvailabilityDraftByLocation[activeLocationForData] ?? {}
          }
          committedJobsAvailability={
            dailyJobsAvailabilityByLocation[activeLocationForData] ?? {}
          }
          onLockedSlotsChange={handleDailyLockedSlotsChange}
          onLockedSlotTimestampsChange={handleDailyLockedSlotTimestampsChange}
          onJobsAvailabilityChange={handleDailyJobsAvailabilityChange}
          onViewHistory={openHistoryModal}
          onSaveChanges={handleSaveDailySettings}
        />
      )}

      {activeTab === "holidays" && (
      <Holidays
        selectedLocations={selectedHolidayLocations}
        locations={locations}
        holidays={localHolidays}
        setHolidays={setLocalHolidays}
        isAddHolidayFormOpen={isAddHolidayFormOpen}
        setIsAddHolidayFormOpen={setIsAddHolidayFormOpen}
        newHolidayStartDate={newHolidayStartDate}
        setNewHolidayStartDate={setNewHolidayStartDate}
        newHolidayEndDate={newHolidayEndDate}
        setNewHolidayEndDate={setNewHolidayEndDate}
        newHolidayLocations={newHolidayLocations}
        setNewHolidayLocations={setNewHolidayLocations}
        newHolidayDescription={newHolidayDescription}
        setNewHolidayDescription={setNewHolidayDescription}
        addHistoryEntry={addHistoryEntry}
        onRemoveHoliday={handleRemoveHoliday}
        onCreateHoliday={createHoliday}
        onUpdateHoliday={updateHoliday}
      />
    )}

      {activeTab === "maximum-settings" ? (
        <>
          <MaximumSettings
            selectedLocation={selectedLocation}
            serviceGroups={serviceGroups}
            isAdvanceServiceGroupEnabled={isAdvanceServiceGroupEnabled}
            setIsAdvanceServiceGroupEnabled={setIsAdvanceServiceGroupEnabled}
            selectedServiceGroups={selectedServiceGroups}
            editingServiceGroupId={editingServiceGroupId}
            editServiceGroupDraft={editServiceGroupDraft}
            editServiceValidationErrors={editServiceValidationErrors}
            isAddServiceGroupFormOpen={isAddServiceGroupFormOpen}
            newServiceGroup={newServiceGroup}
            newServiceValidationErrors={newServiceValidationErrors}
            serviceGroupParentRefs={serviceGroupParentRefs}
            onToggleServiceGroup={handleToggleServiceGroup}
            onToggleService={handleToggleService}
            onOpenEditServiceGroup={handleOpenEditServiceGroup}
            onCloseEditServiceGroup={handleCloseEditServiceGroup}
            onEditGroupNameChange={handleEditGroupNameChange}
            onEditServiceLabelChange={handleEditServiceLabelChange}
            onRemoveServiceFromDraft={handleRemoveServiceFromDraft}
            onAddServiceToDraft={handleAddServiceToDraft}
            onUpdateServiceGroup={handleUpdateServiceGroup}
            onOpenDeleteServiceGroup={handleOpenDeleteServiceGroup}
            onOpenAddServiceGroup={handleOpenAddServiceGroup}
            onCloseAddServiceGroup={handleCloseAddServiceGroup}
            onAddGroupNameChange={handleAddGroupNameChange}
            onAddGroupServiceChange={handleAddGroupServiceChange}
            onAddGroupAddService={handleAddGroupAddService}
            onAddGroupRemoveService={handleAddGroupRemoveService}
            onConfirmAddServiceGroup={handleConfirmAddServiceGroup}
            daySettings={maximumDaySettingsDraft}
            onDaySettingsChange={handleMaximumDaySettingsChange}
            onSaveChanges={handleSaveMaximumDaySettings}
            onViewHistory={openHistoryModal}
            availableServices={dbServices
              .filter((s) => {
                const locationId = parseInt(activeLocationForData);
                if (isNaN(locationId)) return false;
                // Filter out archived services
                if (s.status === 'archived') return false;
                return s.locations?.some((loc) => loc.id === locationId) ?? false;
              })
              .map((s) => ({
                id: s.id,
                name: s.name,
              }))
            }
          />
        </>
      ) : null}

      <DeleteConfirmationModal
        isOpen={deleteServiceGroupModal.isOpen}
        onClose={handleCloseDeleteServiceGroup}
        onConfirm={handleConfirmDeleteServiceGroup}
        title="Delete Service Group"
        itemName={deleteServiceGroupModal.groupLabel}
        itemType="service group"
        message={
          deleteServiceGroupModal.groupLabel
            ? `Are you sure you want to delete the service group "${deleteServiceGroupModal.groupLabel}"? This action cannot be undone.`
            : "Are you sure you want to delete this service group? This action cannot be undone."
        }
      />

      <TeamHistoryModal
        open={isHistoryModalOpen}
        onClose={closeHistoryModal}
        teamName="Booking Times"
        items={historyItems}
      />
    </div>
  );
};

export default BookingSpots;