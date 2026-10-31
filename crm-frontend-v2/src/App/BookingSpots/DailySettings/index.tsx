import { useMemo } from "react";
import { Dropdown, DropdownItem, Button } from "flowbite-react";
import { HiCog, HiMinusSm, HiPlusSm } from "react-icons/hi";
import useTheme from "../../../hooks/useTheme";
import {
  formatTimeSlotDisplay,
  sortTimeSlots,
  convertTimeToMinutes,
} from "../MaximumSettings";
import { SERVICE_GROUP_COLORS } from "../../../utils/mockBookingSpotsData";
import type {
  DaySettings as MaximumDaySettings,
  LockedSlotsMap,
  LockedSlotTimestampsMap,
  JobsAvailabilityMap,
} from "../../../types/bookingSpots";

const DEFAULT_SERVICE_GROUP_KEY = "default";

type DailySlot = {
  time: string;
  jobsAvailable: number;
  jobsScheduled: number;
  jobsFree: number;
  isLocked: boolean;
  editedOn: string | null;
  isPlaceholder?: boolean;
  isFullMax: boolean;
  baseJobsAvailable: number;
};

type BookingRow = {
  date: string;
  dayName: string;
  dateValue: string;
  jobsAvailable: number;
  jobsScheduled: number;
  isClosed: boolean;
  slots: DailySlot[];
  groupSlots: Record<string, DailySlot[]>;
  groupJobsAvailable: Record<string, number>;
  groupJobsScheduled: Record<string, number>;
};

interface DailySettingsProps {
  selectedLocation: string;
  serviceGroups: Array<{ id: string; label: string }>;
  isAdvanceServiceGroupEnabled: boolean;
  startDate: Date | null;
  endDate: Date | null;
  maximumDaySettings: MaximumDaySettings[];
  lockedSlots: LockedSlotsMap;
  committedLockedSlots: LockedSlotsMap;
  lockedSlotTimestamps: LockedSlotTimestampsMap;
  committedLockedSlotTimestamps: LockedSlotTimestampsMap;
  jobsAvailability: JobsAvailabilityMap;
  committedJobsAvailability: JobsAvailabilityMap;
  onLockedSlotsChange: (
    updater: (prev: LockedSlotsMap) => LockedSlotsMap,
  ) => void;
  onLockedSlotTimestampsChange: (
    updater: (prev: LockedSlotTimestampsMap) => LockedSlotTimestampsMap,
  ) => void;
  onJobsAvailabilityChange: (
    updater: (prev: JobsAvailabilityMap) => JobsAvailabilityMap,
  ) => void;
  onViewHistory?: () => void;
  onSaveChanges?: () => void;
}

const DailySettings = ({
  selectedLocation,
  serviceGroups,
  isAdvanceServiceGroupEnabled,
  startDate,
  endDate,
  maximumDaySettings,
  lockedSlots,
  committedLockedSlots,
  onLockedSlotsChange,
  lockedSlotTimestamps,
  committedLockedSlotTimestamps,
  jobsAvailability,
  committedJobsAvailability,
  onLockedSlotTimestampsChange,
  onJobsAvailabilityChange,
  onViewHistory,
  onSaveChanges,
}: DailySettingsProps) => {
  void lockedSlotTimestamps;
  void committedJobsAvailability;
  const { getColorByPath } = useTheme();

  const rowOddBgColor = getColorByPath("datatable", "row_odd", "background");
  const rowEvenBgColor = getColorByPath("datatable", "row_even", "background");
  const rowOddBorderColor = getColorByPath("datatable", "row_odd", "border");
  const rowEvenBorderColor = getColorByPath("datatable", "row_even", "border");

  const getLockState = (
    dateValue: string,
    time: string,
    serviceGroupId?: string | null,
  ): boolean => {
    const dateMap = lockedSlots[dateValue];
    const timeMap = dateMap?.[time];
    if (!timeMap) return false;
    if (serviceGroupId && serviceGroupId in timeMap) {
      return timeMap[serviceGroupId];
    }
    if ("default" in timeMap) {
      return timeMap.default;
    }
    return false;
  };

  const getCommittedLockState = (
    dateValue: string,
    time: string,
    serviceGroupId?: string | null,
  ): boolean => {
    const dateMap = committedLockedSlots[dateValue];


    const timeMap = dateMap?.[time];
    if (!timeMap) {
      return false;
    }
    if (serviceGroupId && serviceGroupId in timeMap) {
      return timeMap[serviceGroupId];
    }
    if ("default" in timeMap) {
      return timeMap.default;
    }
    return false;
  };

  const getCommittedLockTimestamp = (
    dateValue: string,
    time: string,
    serviceGroupId?: string | null,
  ): string | null => {
    const dateMap = committedLockedSlotTimestamps[dateValue];
    const timeMap = dateMap?.[time];
    if (!timeMap) return null;
    if (serviceGroupId && serviceGroupId in timeMap) {
      return timeMap[serviceGroupId] ?? null;
    }
    if ("default" in timeMap) {
      return timeMap.default ?? null;
    }
    return null;
  };

  const updateLockedSlotTimestamp = (
    dateValue: string,
    time: string,
    serviceGroupId: string | null,
    nextLocked: boolean,
  ) => {
    onLockedSlotTimestampsChange((prev) => {
      const next = { ...prev };
      const dateEntry = { ...(next[dateValue] ?? {}) };
      const timeEntry = { ...(dateEntry[time] ?? {}) };
      const key = serviceGroupId ?? "default";

      if (nextLocked) {
        timeEntry[key] = new Date().toISOString();
      } else {
        delete timeEntry[key];
      }

      if (Object.keys(timeEntry).length > 0) {
        dateEntry[time] = timeEntry;
      } else {
        delete dateEntry[time];
      }

      if (Object.keys(dateEntry).length > 0) {
        next[dateValue] = dateEntry;
      } else {
        delete next[dateValue];
      }

      return next;
    });
  };

  const updateLockState = (
    dateValue: string,
    time: string,
    serviceGroupId: string | null,
    nextLocked: boolean,
  ) => {
    onLockedSlotsChange((prev) => {
      const next = { ...prev };
      const dateEntry = { ...(next[dateValue] ?? {}) };
      const timeEntry = { ...(dateEntry[time] ?? {}) };
      timeEntry[serviceGroupId ?? "default"] = nextLocked;
      dateEntry[time] = timeEntry;
      next[dateValue] = dateEntry;
      return next;
    });
    updateLockedSlotTimestamp(dateValue, time, serviceGroupId, nextLocked);
  };

  const toggleSlotLock = (
    dateValue: string,
    time: string,
    serviceGroupId: string | null,
  ) => {
    const current = getLockState(dateValue, time, serviceGroupId ?? undefined);
    updateLockState(dateValue, time, serviceGroupId, !current);
  };

  const preventNewBooking = (
    dateValue: string,
    time: string,
    serviceGroupId: string | null,
  ) => {
    updateLockState(dateValue, time, serviceGroupId, true);
  };

  const setJobsAvailable = (
    dateValue: string,
    _dayName: string,
    slot: DailySlot,
    nextValue: number,
    _serviceGroupId: string | null,
    options: { allowFullMax?: boolean } = {},
  ) => {
    if (slot.isFullMax && !options.allowFullMax) {
      return;
    }

    const baseValue = slot.baseJobsAvailable;
    const overridesForDate = jobsAvailability[dateValue] ?? {};
    const currentOverride = overridesForDate[slot.time];
    const currentValue =
      currentOverride !== undefined ? currentOverride : baseValue;

    const clampedValue = Math.max(0, nextValue);
    const isResettingFromFullMax = slot.isFullMax && options.allowFullMax;
    if (
      clampedValue === currentValue &&
      !slot.isFullMax &&
      !isResettingFromFullMax
    ) {
      return;
    }

    onJobsAvailabilityChange((prev) => {
      const next = { ...prev };
      const dateEntry = { ...(next[dateValue] ?? {}) };
      if (clampedValue === baseValue && !slot.isFullMax) {
        delete dateEntry[slot.time];
      } else {
        dateEntry[slot.time] = clampedValue;
      }

      if (Object.keys(dateEntry).length === 0) {
        delete next[dateValue];
      } else {
        next[dateValue] = dateEntry;
      }

      return next;
    });
  };

  const adjustJobsAvailable = (
    dateValue: string,
    dayName: string,
    slot: DailySlot,
    delta: number,
    serviceGroupId: string | null,
  ) => {
    if (delta === 0 || slot.isFullMax) {
      return;
    }

    const baseValue = slot.baseJobsAvailable;
    const overridesForDate = jobsAvailability[dateValue] ?? {};
    const currentOverride = overridesForDate[slot.time];
    const currentValue =
      currentOverride !== undefined ? currentOverride : baseValue;
    const targetValue = currentValue + delta;

    setJobsAvailable(dateValue, dayName, slot, targetValue, serviceGroupId);
  };

  const resetJobsAvailableToDefault = (
    dateValue: string,
    dayName: string,
    slot: DailySlot,
    serviceGroupId: string | null,
  ) => {
    setJobsAvailable(
      dateValue,
      dayName,
      slot,
      slot.baseJobsAvailable,
      serviceGroupId,
      { allowFullMax: true },
    );
  };

  const formatSlotTimestamp = (timestamp: string | null): string | null => {
    if (!timestamp) {
      return null;
    }

    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) {
      return null;
    }

    const now = new Date();
    const isSameDay =
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate();

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      date.getFullYear() === yesterday.getFullYear() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getDate() === yesterday.getDate();

    const timePart = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });

    const datePart = date.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });

    if (isSameDay) {
      return `${datePart} ${timePart}`;
    }

    if (isYesterday) {
      return `${datePart} ${timePart}`;
    }

    const weekday = date.toLocaleDateString("en-US", { weekday: "long" });

    return `${weekday} ${datePart} ${timePart}`;
  };

  const maximumDayMap = useMemo(() => {
    const map = new Map<
      string,
      {
        settings: MaximumDaySettings;
        sortedSlots: ReturnType<typeof sortTimeSlots>;
        sortedSlotsByGroup: Record<string, ReturnType<typeof sortTimeSlots>>;
      }
    >();
    maximumDaySettings.forEach((day) => {
      const sortedGroupEntries = Object.entries(
        day.serviceGroupSlots ?? {},
      ).reduce<Record<string, ReturnType<typeof sortTimeSlots>>>(
        (acc, [groupId, slots]) => {
          acc[groupId] = sortTimeSlots(slots);
          return acc;
        },
        {},
      );

      map.set(day.day, {
        settings: day,
        sortedSlots: sortTimeSlots(day.timeSlots),
        sortedSlotsByGroup: sortedGroupEntries,
      });
    });
    return map;
  }, [maximumDaySettings]);

  const maximumTimeLabels = useMemo(() => {
    const labelMap = new Map<string, number>();

    const appendSlots = (slots: ReturnType<typeof sortTimeSlots>) => {
      slots.forEach((slot) => {
        const label = formatTimeSlotDisplay(slot);
        const minutes = convertTimeToMinutes(slot.startTime);
        if (!labelMap.has(label) || minutes < labelMap.get(label)!) {
          labelMap.set(label, minutes);
        }
      });
    };

    maximumDaySettings.forEach((day) => {
      appendSlots(sortTimeSlots(day.timeSlots));
      Object.values(day.serviceGroupSlots ?? {}).forEach((groupSlots) => {
        appendSlots(sortTimeSlots(groupSlots));
      });
    });

    return Array.from(labelMap.entries())
      .sort((a, b) => a[1] - b[1])
      .map(([label]) => label);
  }, [maximumDaySettings]);

  const bookingData = useMemo(() => {
    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    let start: Date;
    let end: Date;

    if (startDate && endDate) {
      start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      end = new Date(endDate);
      end.setHours(0, 0, 0, 0);
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      start = new Date(today);
      end = new Date(today);
      end.setDate(today.getDate() + 6);
    }

    const generateDays = (): BookingRow[] => {
      const days: BookingRow[] = [];
      const currentDate = new Date(start);

      while (currentDate <= end) {
        const month = currentDate.getMonth() + 1;
        const day = currentDate.getDate();
        const year = currentDate.getFullYear();
        const dateValue = `${month}/${day}/${year}`;
        const dayName = dayNames[currentDate.getDay()];
        const formattedDate = `${dayName} ${dateValue}`;

        // Only use data from database, never use mock data
        days.push({
          date: formattedDate,
          dayName,
          dateValue,
          jobsAvailable: 0,
          jobsScheduled: 0,
          isClosed: false,
          slots: [],
          groupSlots: {},
          groupJobsAvailable: {},
          groupJobsScheduled: {},
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }

      return days;
    };

    const sourceRows = generateDays();

    const mappedRows: BookingRow[] = sourceRows.map((row) => {
      const dayEntry = maximumDayMap.get(row.dayName);
      const sortedTimeSlots = dayEntry?.sortedSlots ?? [];
      const sortedServiceGroupSlots = dayEntry?.sortedSlotsByGroup ?? {};

      const isClosed = dayEntry ? !dayEntry.settings.isOpen : row.isClosed;

      if (isClosed) {
        return {
          date: row.date,
          dayName: row.dayName,
          dateValue: row.dateValue,
          jobsAvailable: 0,
          jobsScheduled: 0,
          isClosed: true,
          slots: [],
          groupSlots: {},
          groupJobsAvailable: {},
          groupJobsScheduled: {},
        } satisfies BookingRow;
      }

      const buildSlotsFromDefinitions = (
        definitions: ReturnType<typeof sortTimeSlots>,
      ): DailySlot[] => {
        return definitions.map((definition) => {
          const label = formatTimeSlotDisplay(definition);
          const jobsMax = definition.jobsMax ?? 0;

          return {
            time: label,
            jobsAvailable: jobsMax,
            jobsScheduled: 0,
            jobsFree: jobsMax,
            isLocked: false,
            editedOn: null,
            isPlaceholder: false,
            isFullMax: definition.isFullMax ?? false,
            baseJobsAvailable: jobsMax,
          } satisfies DailySlot;
        });
      };

      const overridesForDate = jobsAvailability[row.dateValue] ?? {};

      const applyOverrides = (slots: DailySlot[]): DailySlot[] =>
        slots.map((slot) => {
          const override = overridesForDate[slot.time];
          if (override !== undefined) {
            const jobsAvailable = override;
            const jobsFree = jobsAvailable - slot.jobsScheduled;

            return {
              ...slot,
              jobsAvailable,
              jobsFree,
              isFullMax: false,
            };
          }

          return slot;
        });

      const defaultSlots = applyOverrides(
        buildSlotsFromDefinitions(sortedTimeSlots),
      ).filter((slot) => slot.jobsAvailable > 0 || slot.isFullMax);

      const groupSlots: Record<string, DailySlot[]> = {
        [DEFAULT_SERVICE_GROUP_KEY]: defaultSlots,
      };
      const groupJobsAvailable: Record<string, number> = {
        [DEFAULT_SERVICE_GROUP_KEY]: defaultSlots.reduce(
          (sum, slot) => (slot.isFullMax ? sum : sum + slot.jobsAvailable),
          0,
        ),
      };
      const groupJobsScheduled: Record<string, number> = {
        [DEFAULT_SERVICE_GROUP_KEY]: defaultSlots.reduce(
          (sum, slot) => sum + (slot.jobsScheduled ?? 0),
          0,
        ),
      };

      Object.entries(sortedServiceGroupSlots).forEach(
        ([groupId, definitions]) => {
          const slots = applyOverrides(
            buildSlotsFromDefinitions(definitions),
          ).filter((slot) => slot.jobsAvailable > 0 || slot.isFullMax);

          groupSlots[groupId] = slots;
          groupJobsAvailable[groupId] = slots.reduce(
            (sum, slot) => (slot.isFullMax ? sum : sum + slot.jobsAvailable),
            0,
          );
          groupJobsScheduled[groupId] = slots.reduce(
            (sum, slot) => sum + (slot.jobsScheduled ?? 0),
            0,
          );
        },
      );

      const jobsAvailableFromSlots =
        groupJobsAvailable[DEFAULT_SERVICE_GROUP_KEY] ?? 0;
      const jobsScheduled = groupJobsScheduled[DEFAULT_SERVICE_GROUP_KEY] ?? 0;

      return {
        date: row.date,
        dayName: row.dayName,
        dateValue: row.dateValue,
        jobsAvailable: jobsAvailableFromSlots,
        jobsScheduled,
        isClosed: false,
        slots: defaultSlots,
        groupSlots,
        groupJobsAvailable,
        groupJobsScheduled,
      } satisfies BookingRow;
    });

    return mappedRows;
  }, [maximumDayMap, jobsAvailability, startDate, endDate]);

  const availableTimeSlots = useMemo(() => {
    const timeSlotJobCounts = new Map<string, number>();

    bookingData.forEach((row) => {
      const relevantSlots = Object.entries(row.groupSlots).filter(
        ([groupKey]) => {
          if (isAdvanceServiceGroupEnabled && serviceGroups.length > 0) {
            return groupKey !== DEFAULT_SERVICE_GROUP_KEY;
          } else {
            return groupKey === DEFAULT_SERVICE_GROUP_KEY;
          }
        },
      );

      relevantSlots.forEach(([, collection]) => {
        collection.forEach((slot) => {
          const currentCount = timeSlotJobCounts.get(slot.time) ?? 0;
          const hasJobs = slot.isFullMax || slot.jobsAvailable > 0;
          timeSlotJobCounts.set(
            slot.time,
            currentCount + (hasJobs ? slot.jobsAvailable || 1 : 0),
          );
        });
      });
    });

    const slotsWithJobs = Array.from(timeSlotJobCounts.entries())
      .filter(([, count]) => count > 0)
      .map(([timeSlot]) => timeSlot);
    if (maximumTimeLabels.length > 0) {
      return maximumTimeLabels.filter((label) => slotsWithJobs.includes(label));
    }
    return slotsWithJobs;
  }, [
    maximumTimeLabels,
    bookingData,
    isAdvanceServiceGroupEnabled,
    serviceGroups,
  ]);

  return (
    <>
      {onSaveChanges || onViewHistory ? (
        <div className="mb-4 flex w-full gap-3 sm:items-center sm:justify-end">
          {onViewHistory && (
            <Button
              onClick={onViewHistory}
              color="light"
              className="w-full cursor-pointer sm:w-auto"
            >
              View History
            </Button>
          )}
          {onSaveChanges && (
            <Button
              onClick={onSaveChanges}
              color="gray"
              className="w-full cursor-pointer sm:w-auto"
            >
              Save Changes
            </Button>
          )}
        </div>
      ) : null}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm transition-all duration-200">
        <div className="relative overflow-x-auto">
          <style>{`
            .sticky-date-column::after {
              content: '';
              position: absolute;
              top: 0;
              right: 0;
              bottom: 0;
              width: 1px;
              background-color: #E5E7EB;
              z-index: 40;
              pointer-events: none;
            }
          `}</style>
          <table
            className="w-full min-w-[600px] border-collapse text-left text-xs transition-all duration-200"
            style={{ tableLayout: "fixed" }}
          >
            <colgroup>
              <col
                className="w-[90px] sm:w-[140px]"
                style={{ minWidth: "90px" }}
              />
              {availableTimeSlots.map((_, index) => (
                <col
                  key={index}
                  style={{
                    width: "138px",
                    minWidth: "138px",
                    maxWidth: "138px",
                  }}
                />
              ))}
            </colgroup>
            <thead className="bg-[#F8FAFC]">
              <tr>
                <th
                  scope="col"
                  className="sticky-date-column sticky left-0 z-30 w-[90px] min-w-[90px] border-b border-gray-200 bg-gray-50 px-2 py-3 text-[12px] font-bold tracking-wider text-black uppercase sm:w-[140px] sm:min-w-[120px] sm:px-4"
                >
                  Date
                </th>
                {availableTimeSlots.map((time, index) => (
                  <th
                    key={time}
                    scope="col"
                    style={{
                      width: "138px",
                      minWidth: "138px",
                      maxWidth: "138px",
                    }}
                    className={`overflow-hidden border-b border-gray-200 px-3 py-3 text-[12px] font-bold tracking-wider text-ellipsis whitespace-nowrap text-black uppercase sm:px-4 ${
                      index < availableTimeSlots.length - 1 ? "border-r" : ""
                    }`}
                  >
                    {time}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {bookingData.map((row, rowIndex) => {
                const isEven = rowIndex % 2 === 1;
                const rowBgColor = isEven ? rowEvenBgColor : rowOddBgColor;
                const rowBorderColor = isEven
                  ? rowEvenBorderColor
                  : rowOddBorderColor;
                const isClosedDay = row.isClosed;
                const resolvedRowBgColor = rowBgColor;
                const resolvedRowBorderColor = rowBorderColor;
                const serviceGroupRows =
                  isAdvanceServiceGroupEnabled && serviceGroups.length > 0
                    ? serviceGroups.map((group, index) => ({
                        id: group.id,
                        label: group.label,
                        color:
                          SERVICE_GROUP_COLORS[
                            index % SERVICE_GROUP_COLORS.length
                          ],
                      }))
                    : [];

                const displayRows =
                  isAdvanceServiceGroupEnabled && serviceGroupRows.length > 0
                    ? serviceGroupRows
                    : [null];

                return displayRows.map((serviceGroup, groupIndex) => {
                  const isFirstGroupRow = groupIndex === 0;
                  const groupKey =
                    serviceGroup?.id ?? DEFAULT_SERVICE_GROUP_KEY;
                  const slotsForGroup = row.groupSlots[groupKey] ?? [];
                  const jobsAvailableForGroup =
                    row.groupJobsAvailable[groupKey] ?? 0;
                  const jobsScheduledForGroup =
                    row.groupJobsScheduled[groupKey] ?? 0;

                  const hasMaxSlots = slotsForGroup.some(
                    (slot) => slot.isFullMax,
                  );
                  const numericSum = slotsForGroup.reduce((sum, slot) => {
                    if (slot.isFullMax) {
                      return sum;
                    }
                    return sum + (slot.jobsAvailable ?? 0);
                  }, 0);
                  const jobsAvailableDisplay = hasMaxSlots
                    ? numericSum > 0
                      ? `${numericSum}, MAX`
                      : "MAX"
                    : jobsAvailableForGroup;
                  return (
                    <tr
                      key={`${row.date}-${serviceGroup?.id ?? "default"}-${groupIndex}-${selectedLocation}`}
                      className={`border-b transition-colors duration-200 ${
                        isClosedDay ? "border-red-200 bg-red-50" : ""
                      }`}
                      style={
                        isClosedDay
                          ? undefined
                          : {
                              backgroundColor: resolvedRowBgColor,
                              borderBottomColor: resolvedRowBorderColor,
                            }
                      }
                    >
                      <td
                        className={`sticky-date-column sticky left-0 z-30 w-[90px] min-w-[90px] align-top sm:w-[140px] sm:min-w-[120px] ${
                          isClosedDay ? "h-auto bg-red-50" : "h-32"
                        }`}
                        style={
                          isClosedDay
                            ? undefined
                            : {
                                backgroundColor: resolvedRowBgColor,
                              }
                        }
                      >
                        <div
                          className={`group relative flex cursor-pointer flex-col rounded-lg p-4 ${
                            isClosedDay ? "" : "h-full"
                          }`}
                        >
                          <div className="flex flex-col space-y-1">
                            {isFirstGroupRow ? (
                              <p
                                className={`pr-1 text-sm font-semibold ${
                                  isClosedDay ? "text-red-700" : "text-black"
                                }`}
                              >
                                {row.date}
                              </p>
                            ) : null}

                            {isClosedDay && (
                              <div
                                className={`inline-flex w-fit items-center rounded-md bg-red-100 px-1.5 py-0.5 text-[9px] font-medium text-red-700 ${
                                  isFirstGroupRow ? "" : "mt-1"
                                }`}
                              >
                                Closed
                              </div>
                            )}

                            {serviceGroup && (
                              <div
                                className={`flex w-fit items-center gap-1.5 ${
                                  isFirstGroupRow ? "mt-1.5" : ""
                                }`}
                              >
                                <span
                                  className="inline-flex h-1.5 w-1.5 shrink-0 rounded-full"
                                  style={{
                                    backgroundColor:
                                      serviceGroup.color !== "transparent"
                                        ? serviceGroup.color
                                        : "#E5E7EB",
                                  }}
                                />
                                <span className="text-[13px] font-semibold text-gray-900">
                                  {serviceGroup.label}
                                </span>
                              </div>
                            )}
                          </div>

                          {!isClosedDay && (
                            <div className="mt-auto flex flex-col gap-0.5 border-t border-gray-200 pt-3.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[13px] font-semibold text-[#06b548]">
                                  Jobs Available
                                </span>
                                <span className="text-[13px] font-semibold text-[#06b548]">
                                  {jobsAvailableDisplay}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-[13px] font-semibold">
                                  Job Scheduled
                                </span>
                                <span className="text-[13px] font-semibold">
                                  {jobsScheduledForGroup}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>

                      {availableTimeSlots.map((timeSlot) => {
                        const slot = slotsForGroup.find(
                          (s) => s.time === timeSlot,
                        );
                        const slotIndex = availableTimeSlots.indexOf(timeSlot);
                        const isLast =
                          slotIndex === availableTimeSlots.length - 1;
                        const isLocked = getLockState(
                          row.dateValue,
                          timeSlot,
                          serviceGroup?.id ?? null,
                        );
                        const isSavedLock = getCommittedLockState(
                          row.dateValue,
                          timeSlot,
                          serviceGroup?.id ?? null,
                        );
                        const savedTimestamp = getCommittedLockTimestamp(
                          row.dateValue,
                          timeSlot,
                          serviceGroup?.id ?? null,
                        );
                        const formattedTimestamp =
                          formatSlotTimestamp(savedTimestamp);
                        const jobsFreeDisplay = isLocked
                          ? 0
                          : slot?.isFullMax
                            ? "MAX"
                            : (slot?.jobsFree ?? 0);
                        const jobsFreeNumberForClass =
                          isLocked || !slot ? 0 : slot.jobsFree;
                        const jobsAvailableDisplay = isLocked
                          ? 0
                          : slot?.isFullMax
                            ? "MAX"
                            : (slot?.jobsAvailable ?? 0);
                        const jobsScheduledDisplay =
                          isLocked || !slot ? 0 : slot.jobsScheduled;
                        const metricTextClassName = isLocked
                          ? "text-red-700"
                          : !isLocked && isClosedDay
                            ? "text-red-700"
                            : "";
                        const jobsFreeValueClass = !isLocked
                          ? jobsFreeNumberForClass < 0
                            ? "text-red-600"
                            : "text-[#06b548]"
                          : "";

                        return (
                          <td
                            key={`${row.date}-${timeSlot}-${serviceGroup?.id ?? "default"}-${groupIndex}-${selectedLocation}`}
                            style={{
                              width: "138px",
                              minWidth: "138px",
                              maxWidth: "138px",
                            }}
                            className={`overflow-hidden transition-all duration-200 ${
                              isClosedDay ? "h-auto" : "h-40 align-top"
                            } ${!isLast ? "border-r border-gray-200" : ""}`}
                          >
                            {slot ? (
                              <div
                                className={`group relative flex h-full cursor-pointer flex-col p-2.5 transition-all duration-200 sm:p-3 ${
                                  isLocked ? "bg-red-50 text-red-700" : ""
                                } ${
                                  !isLocked && isClosedDay ? "text-red-700" : ""
                                }`}
                              >
                                <div className="absolute top-2 right-2 z-[5]">
                                  {isLocked ? (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleSlotLock(
                                          row.dateValue,
                                          timeSlot,
                                          serviceGroup?.id ?? null,
                                        );
                                      }}
                                      className="cursor-pointer rounded-full bg-red-700 p-1 transition-colors"
                                      title="Click to unlock"
                                    >
                                      <svg
                                        className="h-3.5 w-3.5 text-white"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth="2"
                                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                        />
                                      </svg>
                                    </button>
                                  ) : (
                                    <Dropdown
                                      label=""
                                      dismissOnClick={true}
                                      renderTrigger={() => (
                                        <button
                                          type="button"
                                          className="flex cursor-pointer items-center rounded-sm border border-gray-200 bg-gray-50 px-1 py-1 text-[11px] font-medium text-gray-700 transition-colors hover:bg-white"
                                          title="Settings"
                                        >
                                          <HiCog className="h-3.5 w-3.5 text-black" />
                                          <span
                                            aria-hidden="true"
                                            className="ml-[2px] inline-block h-0 w-0 border-t-[4px] border-r-[4px] border-l-[4px] border-t-black border-r-transparent border-l-transparent"
                                          />
                                        </button>
                                      )}
                                      theme={{
                                        floating: {
                                          target: "w-auto",
                                          base: "z-50 min-w-[200px] rounded-lg border border-gray-200 bg-white shadow-lg",
                                          content: "py-1 text-xs",
                                        },
                                      }}
                                    >
                                      <DropdownItem
                                        onClick={() =>
                                          preventNewBooking(
                                            row.dateValue,
                                            timeSlot,
                                            serviceGroup?.id ?? null,
                                          )
                                        }
                                        className="text-[13px] font-medium whitespace-nowrap"
                                      >
                                        Prevent New Booking
                                      </DropdownItem>
                                      {!slot.isFullMax && (
                                        <DropdownItem
                                          onClick={() =>
                                            resetJobsAvailableToDefault(
                                              row.dateValue,
                                              row.dayName,
                                              slot,
                                              serviceGroup?.id ?? null,
                                            )
                                          }
                                          className="text-[13px] font-medium whitespace-nowrap"
                                        >
                                          {`Reset to Default (${slot.baseJobsAvailable} Jobs)`}
                                        </DropdownItem>
                                      )}
                                    </Dropdown>
                                  )}
                                </div>
                                <div className="mb-1 pr-6 text-[12px] font-semibold">
                                  <div
                                    className={`flex flex-wrap items-center gap-1 ${
                                      isLocked ? "text-red-700" : ""
                                    }`}
                                  >
                                    <span className="whitespace-nowrap">
                                      ({slot.time})
                                    </span>
                                    {!isLocked ? (
                                      <div className="flex flex-shrink-0 items-center gap-0.5">
                                        <button
                                          type="button"
                                          aria-label="Decrease jobs available"
                                          onClick={(event) => {
                                            event.stopPropagation();
                                            adjustJobsAvailable(
                                              row.dateValue,
                                              row.dayName,
                                              slot,
                                              -1,
                                              serviceGroup?.id ?? null,
                                            );
                                          }}
                                          disabled={
                                            isClosedDay ||
                                            slot.isFullMax ||
                                            slot.jobsAvailable <= 0
                                          }
                                          className="flex h-4 w-4 cursor-pointer items-center justify-center rounded-sm border border-gray-400 bg-white text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
                                        >
                                          <HiMinusSm className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                          type="button"
                                          aria-label="Increase jobs available"
                                          onClick={(event) => {
                                            event.stopPropagation();
                                            adjustJobsAvailable(
                                              row.dateValue,
                                              row.dayName,
                                              slot,
                                              1,
                                              serviceGroup?.id ?? null,
                                            );
                                          }}
                                          disabled={
                                            isClosedDay || slot.isFullMax
                                          }
                                          className="flex h-4 w-4 cursor-pointer items-center justify-center rounded-sm border border-gray-400 bg-white text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
                                        >
                                          <HiPlusSm className="h-4 w-4" />
                                        </button>
                                      </div>
                                    ) : null}
                                  </div>
                                </div>
                                <div className="flex flex-1 flex-col justify-between px-2 text-[11px]">
                                  <div className="h-2" />
                                  <div className="flex flex-col gap-0.5">
                                    <div className="flex items-center justify-between">
                                      <span
                                        className={`text-[13px] font-medium${metricTextClassName}`}
                                      >
                                        Jobs Available
                                      </span>
                                      <span
                                        className={`text-[13px] font-medium${metricTextClassName}`}
                                      >
                                        {jobsAvailableDisplay}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span
                                        className={`text-[13px] font-medium opacity-80${metricTextClassName}`}
                                      >
                                        Job Scheduled
                                      </span>
                                      <span
                                        className={`text-[13px] font-medium opacity-80${metricTextClassName}`}
                                      >
                                        {jobsScheduledDisplay}
                                      </span>
                                    </div>
                                  </div>
                                  <div
                                    className={`my-3 flex flex-col gap-1 border-t ${
                                      isLocked || isClosedDay
                                        ? "border-white/70"
                                        : "border-gray-200"
                                    }`}
                                  ></div>

                                  <div className="flex items-center justify-between">
                                    <span
                                      className={`text-[13px] font-semibold ${
                                        isLocked
                                          ? "text-red-700"
                                          : "text-[#06b548]"
                                      }`}
                                    >
                                      Jobs Free
                                    </span>
                                    <span
                                      className={`text-[13px] font-semibold ${jobsFreeValueClass} ${
                                        isLocked ? "text-red-700" : ""
                                      }`}
                                    >
                                      {jobsFreeDisplay}
                                    </span>
                                  </div>
                                  <div className="h-6">
                                    {isLocked &&
                                      isSavedLock &&
                                      formattedTimestamp && (
                                        <div className="flex items-center gap-2">
                                          <span className="text-[12px] text-gray-700">
                                            Edited On:
                                          </span>
                                          <p className="text-[12px] text-gray-700">
                                            {formattedTimestamp}
                                          </p>
                                        </div>
                                      )}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div
                                className={`flex items-center justify-center ${
                                  isClosedDay ? "h-full min-h-[60px]" : "h-full"
                                }`}
                              >
                                <span
                                  className={`text-[9px] ${
                                    isClosedDay
                                      ? "text-red-700"
                                      : "text-gray-400"
                                  }`}
                                >
                                  —
                                </span>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                });
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default DailySettings;