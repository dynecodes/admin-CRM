/* eslint-disable react-refresh/only-export-components */
import {
  baseMaximumSettings,
  baseMaximumSettingsByLocation,
  SERVICE_GROUP_COLORS,
} from "../../../utils/mockBookingSpotsData";
import type {
  TimeSlotType,
  TimeSlot,
  DaySettings,
  ServiceGroup,
  ServiceGroupRowConfig,
} from "../../../types/bookingSpots";

export { baseMaximumSettings };
export type { TimeSlotType, TimeSlot, DaySettings };

export const convertTimeToMinutes = (time: string): number => {
  if (!time) return 0;

  const [timeValue, modifier] = time.split(" ");
  const [rawHours, rawMinutes] = timeValue.split(":");

  let hours = Number(rawHours);
  const minutes = Number(rawMinutes);

  if (modifier === "PM" && hours !== 12) {
    hours += 12;
  }

  if (modifier === "AM" && hours === 12) {
    hours = 0;
  }

  return hours * 60 + minutes;
};

export const convertMinutesToTime = (totalMinutes: number): string => {
  const minutes = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const hours = Math.floor(minutes / 60);
  const remainderMinutes = minutes % 60;

  const date = new Date();
  date.setHours(hours, remainderMinutes, 0, 0);

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
};

export const formatTimeSlotDisplay = (slot: TimeSlot): string => {
  if (slot.type === "specific-time" || slot.startTime === slot.endTime) {
    return slot.startTime;
  }

  return `${slot.startTime} - ${slot.endTime}`;
};

export const sortTimeSlots = (timeSlots: TimeSlot[]): TimeSlot[] => {
  return [...timeSlots].sort((a, b) => {
    const startDiff =
      convertTimeToMinutes(a.startTime) - convertTimeToMinutes(b.startTime);

    if (startDiff !== 0) {
      return startDiff;
    }

    return convertTimeToMinutes(a.endTime) - convertTimeToMinutes(b.endTime);
  });
};

export const DEFAULT_JOBS_AVAILABLE = 3;

export const getBaseMaximumSettingsForLocation = (
  location: string,
): DaySettings[] => {
  const base =
    baseMaximumSettingsByLocation[location] ??
    baseMaximumSettingsByLocation.atlanta;

  return base.map((day) => ({
    ...day,
    timeSlots: day.timeSlots.map((slot) => ({ ...slot })),
    serviceGroupSlots: day.serviceGroupSlots
      ? Object.entries(day.serviceGroupSlots).reduce<
          NonNullable<DaySettings["serviceGroupSlots"]>
        >((acc, [groupId, slots]) => {
          acc[groupId] = slots.map((slot) => ({ ...slot }));
          return acc;
        }, {})
      : {},
  }));
};

const getSlotsForServiceGroup = (
  day: DaySettings,
  serviceGroupId: string | null,
  useFallback: boolean = false,
): TimeSlot[] => {
  if (serviceGroupId) {
    const serviceGroupSlots = day.serviceGroupSlots ?? {};
    if (serviceGroupId in serviceGroupSlots) {
      return serviceGroupSlots[serviceGroupId] ?? [];
    }
    return useFallback ? day.timeSlots : [];
  }
  return day.timeSlots;
};

const updateSlotsForServiceGroup = (
  day: DaySettings,
  serviceGroupId: string | null,
  nextSlots: TimeSlot[],
): DaySettings => {
  if (serviceGroupId) {
    return {
      ...day,
      serviceGroupSlots: {
        ...(day.serviceGroupSlots ?? {}),
        [serviceGroupId]: nextSlots,
      },
    };
  }

  return {
    ...day,
    timeSlots: nextSlots,
  };
};

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import useTheme from "../../../hooks/useTheme";
import { Button } from "flowbite-react/components/Button";
import { Dropdown, DropdownItem, ToggleSwitch, Label } from "flowbite-react";
import {
  HiPencil,
  HiX,
  HiPlus,
  HiTrash,
  HiOutlinePlus,
  HiMinus,
  HiBan,
  HiChevronDown,
  HiCheck,
} from "react-icons/hi";
import DeleteConfirmationModal from "../../../components/ui/DeleteConfirmationModal";
import CustomToggle from "../../../components/ui/CustomToggle";

const TIME_OPTIONS: string[] = Array.from({ length: 96 }, (_, index) => {
  const totalMinutes = index * 15;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
});

const ARRIVAL_WINDOW_STEP_MINUTES = 5;

const normalizeUserTimeInput = (value: string): string | null => {
  if (!value) {
    return null;
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  const match = trimmedValue.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM|am|pm))$/);

  if (!match) {
    return null;
  }

  const rawHour = Number(match[1]);
  const minutes = match[2];
  const meridiem = match[3]?.toUpperCase();

  if (
    Number.isNaN(rawHour) ||
    rawHour < 1 ||
    rawHour > 12 ||
    Number.isNaN(Number(minutes)) ||
    Number(minutes) > 59 ||
    !meridiem
  ) {
    return null;
  }

  return `${rawHour}:${minutes} ${meridiem}`;
};

const computeDurationParts = (
  startTime: string,
  endTime: string,
): { hours: string; minutes: string } | null => {
  if (!startTime || !endTime) {
    return null;
  }

  const normalizedStart = normalizeUserTimeInput(startTime) ?? startTime;
  const normalizedEnd = normalizeUserTimeInput(endTime) ?? endTime;

  const startMinutes = convertTimeToMinutes(normalizedStart);
  const endMinutes = convertTimeToMinutes(normalizedEnd);

  if (endMinutes <= startMinutes) {
    return null;
  }

  const duration = endMinutes - startMinutes;
  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;

  return {
    hours: String(hours),
    minutes: String(minutes),
  };
};

const APPLY_ALL_OPTION_ID = "all";

interface MaximumSettingsProps {
  selectedLocation: string;
  serviceGroups: ServiceGroup[];
  isAdvanceServiceGroupEnabled: boolean;
  setIsAdvanceServiceGroupEnabled: (
    updater: (prev: boolean) => boolean,
  ) => void;
  selectedServiceGroups: Record<string, string[]>;
  editingServiceGroupId: string | null;
  editServiceGroupDraft: ServiceGroup | null;
  editServiceValidationErrors: Set<string>;
  isAddServiceGroupFormOpen: boolean;
  newServiceGroup: ServiceGroup;
  newServiceValidationErrors: Set<string>;
  serviceGroupParentRefs: React.MutableRefObject<
    Record<string, HTMLInputElement | null>
  >;
  onToggleServiceGroup: (groupId: string) => void;
  onToggleService: (groupId: string, serviceId: string) => void;
  onOpenEditServiceGroup: (groupId: string) => void;
  onCloseEditServiceGroup: () => void;
  onEditGroupNameChange: (value: string) => void;
  onEditServiceLabelChange: (serviceId: string, value: string) => void;
  onRemoveServiceFromDraft: (serviceId: string) => void;
  onAddServiceToDraft: () => void;
  onUpdateServiceGroup: () => void;
  onOpenDeleteServiceGroup: (groupId: string) => void;
  onOpenAddServiceGroup: () => void;
  onCloseAddServiceGroup: () => void;
  onAddGroupNameChange: (value: string) => void;
  onAddGroupServiceChange: (index: number, value: string) => void;
  onAddGroupAddService: () => void;
  onAddGroupRemoveService: (index: number) => void;
  onConfirmAddServiceGroup: () => void;
  daySettings: DaySettings[];
  onDaySettingsChange: (
    updater: (prev: DaySettings[]) => DaySettings[],
  ) => void;
  onSaveChanges?: () => void;
  onViewHistory?: () => void;
  availableServices?: Array<{ id: number; name: string }>;
}

const MaximumSettings = ({
  selectedLocation,
  serviceGroups,
  isAdvanceServiceGroupEnabled,
  setIsAdvanceServiceGroupEnabled,
  selectedServiceGroups,
  editingServiceGroupId,
  editServiceGroupDraft,
  editServiceValidationErrors,
  isAddServiceGroupFormOpen,
  newServiceGroup,
  newServiceValidationErrors,
  serviceGroupParentRefs,
  onToggleServiceGroup,
  onToggleService,
  onOpenEditServiceGroup,
  onCloseEditServiceGroup,
  onEditGroupNameChange,
  onEditServiceLabelChange,
  onRemoveServiceFromDraft,
  onAddServiceToDraft,
  onUpdateServiceGroup,
  onOpenDeleteServiceGroup,
  onOpenAddServiceGroup,
  onCloseAddServiceGroup,
  onAddGroupNameChange,
  onAddGroupServiceChange,
  onAddGroupAddService,
  onAddGroupRemoveService,
  onConfirmAddServiceGroup,
  daySettings,
  onDaySettingsChange,
  onSaveChanges,
  onViewHistory,
  availableServices,
}: MaximumSettingsProps) => {
  const { getColorByPath } = useTheme();

  const rowOddBgColor =
    getColorByPath("datatable", "row_odd", "background") ?? "#F9FAFB";
  const rowEvenBgColor =
    getColorByPath("datatable", "row_even", "background") ?? "#FFFFFF";
  const rowOddBorderColor =
    getColorByPath("datatable", "row_odd", "border") ?? "#E5E7EB";
  const rowEvenBorderColor =
    getColorByPath("datatable", "row_even", "border") ?? "#E5E7EB";
  const closedDayBgColor = "#FEF2F2";
  const closedDayBorderColor = "#FEE2E2";

  const [serviceGroupStatus, setServiceGroupStatus] = useState<
    Record<string, Record<string, boolean>>
  >({});

  const updateDaySettings = useCallback(
    (updater: (prev: DaySettings[]) => DaySettings[]) => {
      onDaySettingsChange((prev) => {
        const next = updater(prev);
        return next.map((day) => ({
          ...day,
          timeSlots: sortTimeSlots(day.timeSlots),
          serviceGroupSlots: day.serviceGroupSlots
            ? Object.entries(day.serviceGroupSlots).reduce<
                NonNullable<DaySettings["serviceGroupSlots"]>
              >((acc, [groupId, slots]) => {
                acc[groupId] = sortTimeSlots(slots);
                return acc;
              }, {})
            : {},
        }));
      });
    },
    [onDaySettingsChange],
  );

  const buildAddTimeKey = (
    dayId: string,
    serviceGroupId: string | null,
  ): string => {
    return serviceGroupId ? `${dayId}__${serviceGroupId}` : dayId;
  };

  const [applyToSelection, setApplyToSelection] = useState<string[]>([]);
  const [activeAddTimeKey, setActiveAddTimeKey] = useState<string | null>(null);
  const [openAddTimeDropdownKey, setOpenAddTimeDropdownKey] = useState<
    string | null
  >(null);
  const [openArrivalWindowDropdownKey, setOpenArrivalWindowDropdownKey] =
    useState<string | null>(null);
  const [addTimeSelections, setAddTimeSelections] = useState<
    Record<
      string,
      {
        time: string;
        arrivalWindow: {
          enabled: boolean;
          hours: string;
          minutes: string;
          endTime: string;
        };
      }
    >
  >({});
  const [duplicateTimeErrors, setDuplicateTimeErrors] = useState<
    Record<string, boolean>
  >({});
  const [showServicesSection, setShowServicesSection] = useState(false);
  const [isServicesDropdownOpen, setIsServicesDropdownOpen] = useState(false);
  const servicesDropdownRef = useRef<HTMLDivElement>(null);

  const servicesToUse = availableServices || [];

  useEffect(() => {
    setServiceGroupStatus({});
    setApplyToSelection([]);
    setActiveAddTimeKey(null);
    setAddTimeSelections({});
    setDuplicateTimeErrors({});
    setOpenAddTimeDropdownKey(null);
    setOpenArrivalWindowDropdownKey(null);
  }, [selectedLocation]);

  useEffect(() => {
    if (!isAddServiceGroupFormOpen) {
      setShowServicesSection(false);
      setIsServicesDropdownOpen(false);
    }
  }, [isAddServiceGroupFormOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        servicesDropdownRef.current &&
        !servicesDropdownRef.current.contains(event.target as Node)
      ) {
        setIsServicesDropdownOpen(false);
      }
    };

    if (isServicesDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isServicesDropdownOpen]);

  const handleAddServiceFromDropdown = useCallback(
    (serviceName: string) => {
      if (newServiceGroup.services.length === 0) {
        onAddGroupAddService();
        setTimeout(() => {
          onAddGroupServiceChange(0, serviceName);
        }, 50);
      } else {
        const emptyIndex = newServiceGroup.services.findIndex(
          (s) => !s.label.trim(),
        );

        if (emptyIndex !== -1) {
          onAddGroupServiceChange(emptyIndex, serviceName);
        } else {
          onAddGroupAddService();
          const currentLength = newServiceGroup.services.length;
          setTimeout(() => {
            onAddGroupServiceChange(currentLength, serviceName);
          }, 50);
        }
      }

      setIsServicesDropdownOpen(false);
      setShowServicesSection(true);
    },
    [newServiceGroup.services, onAddGroupAddService, onAddGroupServiceChange],
  );

  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    isOpen: boolean;
    dayId: string;
    slotId: string;
    serviceGroupId?: string | null;
    slotInfo: string;
  }>({
    isOpen: false,
    dayId: "",
    slotId: "",
    serviceGroupId: null,
    slotInfo: "",
  });

  const handleToggleOpen = (dayId: string) => {
    updateDaySettings((prev) =>
      prev.map((day) =>
        day.id === dayId ? { ...day, isOpen: !day.isOpen } : day,
      ),
    );
  };

  const setServiceGroupOpenState = (
    dayId: string,
    groupId: string,
    nextOpen: boolean,
  ) => {
    setServiceGroupStatus((prev) => {
      const prevDayMap = prev[dayId] ?? {};

      if (nextOpen) {
        const restDayMap = { ...prevDayMap };
        delete restDayMap[groupId];
        if (Object.keys(restDayMap).length === 0) {
          const rest = { ...prev };
          delete rest[dayId];
          return rest;
        }
        return {
          ...prev,
          [dayId]: restDayMap,
        };
      }

      return {
        ...prev,
        [dayId]: {
          ...prevDayMap,
          [groupId]: false,
        },
      };
    });
  };

  const handleServiceGroupSwitchChange = (
    day: DaySettings,
    groupId: string,
    currentOpen: boolean,
  ) => {
    const nextOpen = !currentOpen;

    if (nextOpen && !day.isOpen) {
      handleToggleOpen(day.id);
    }

    setServiceGroupOpenState(day.id, groupId, nextOpen);
  };

  const handleIncreaseJobs = (
    dayId: string,
    slotId: string,
    serviceGroupId: string | null,
  ) => {
    updateDaySettings((prev) =>
      prev.map((day) => {
        if (day.id === dayId) {
          const slots = getSlotsForServiceGroup(day, serviceGroupId, true);
          const updatedSlots = slots.map((slot) =>
            slot.id === slotId
              ? { ...slot, jobsMax: slot.jobsMax + 1 }
              : { ...slot },
          );

          return updateSlotsForServiceGroup(day, serviceGroupId, updatedSlots);
        }
        return day;
      }),
    );
  };

  const handleDecreaseJobs = (
    dayId: string,
    slotId: string,
    serviceGroupId: string | null,
  ) => {
    updateDaySettings((prev) =>
      prev.map((day) => {
        if (day.id === dayId) {
          const slots = getSlotsForServiceGroup(day, serviceGroupId, true);
          const updatedSlots = slots.map((slot) =>
            slot.id === slotId
              ? { ...slot, jobsMax: Math.max(slot.jobsMax - 1, 0) }
              : { ...slot },
          );

          return updateSlotsForServiceGroup(day, serviceGroupId, updatedSlots);
        }
        return day;
      }),
    );
  };

  const allDayIds = daySettings.map((day) => day.id);

  const handleToggleApplyOption = (optionId: string) => {
    setApplyToSelection((prev) => {
      if (optionId === APPLY_ALL_OPTION_ID) {
        const isAllCurrentlySelected =
          prev.includes(APPLY_ALL_OPTION_ID) &&
          allDayIds.every((id) => prev.includes(id));

        if (isAllCurrentlySelected) {
          return [];
        }

        return [APPLY_ALL_OPTION_ID, ...allDayIds];
      }

      const nextSet = new Set(prev.filter((id) => id !== APPLY_ALL_OPTION_ID));

      if (nextSet.has(optionId)) {
        nextSet.delete(optionId);
      } else {
        nextSet.add(optionId);
      }

      if (allDayIds.length > 0 && allDayIds.every((id) => nextSet.has(id))) {
        return [APPLY_ALL_OPTION_ID, ...allDayIds];
      }

      return Array.from(nextSet);
    });
  };

  const isApplyOptionSelected = (
    optionId: string,
    sourceDayId?: string,
  ): boolean => {
    if (optionId === APPLY_ALL_OPTION_ID) {
      return applyToSelection.includes(APPLY_ALL_OPTION_ID);
    }

    if (sourceDayId && optionId === sourceDayId) {
      return true;
    }

    return applyToSelection.includes(optionId);
  };

  const getResolvedApplyTargets = (sourceDayId: string): string[] => {
    const baseSelection = applyToSelection.includes(APPLY_ALL_OPTION_ID)
      ? daySettings.map((day) => day.id)
      : applyToSelection;

    const withSourceDay = baseSelection.includes(sourceDayId)
      ? baseSelection
      : [...baseSelection, sourceDayId];

    const filtered = withSourceDay.filter((id) => id !== APPLY_ALL_OPTION_ID);

    return Array.from(new Set(filtered));
  };

  const handleToggleFullMax = (
    dayId: string,
    slotId: string,
    serviceGroupId: string | null,
  ) => {
    updateDaySettings((prev) =>
      prev.map((day) => {
        if (day.id === dayId) {
          const slots = getSlotsForServiceGroup(day, serviceGroupId, true);
          const updatedSlots = slots.map((slot) =>
            slot.id === slotId
              ? { ...slot, isFullMax: !slot.isFullMax }
              : { ...slot },
          );

          return updateSlotsForServiceGroup(day, serviceGroupId, updatedSlots);
        }
        return day;
      }),
    );
  };

  const handleDeleteSlot = (
    dayId: string,
    slotId: string,
    serviceGroupId: string | null,
  ) => {
    const day = daySettings.find((d) => d.id === dayId);
    if (!day) {
      return;
    }
    const slot = getSlotsForServiceGroup(day, serviceGroupId, true).find(
      (s) => s.id === slotId,
    );
    if (slot) {
      const slotInfo =
        slot.type === "specific-time"
          ? slot.startTime
          : `${slot.startTime} - ${slot.endTime}`;
      setDeleteConfirmModal({
        isOpen: true,
        dayId,
        slotId,
        serviceGroupId,
        slotInfo,
      });
    }
  };

  const confirmDeleteSlot = () => {
    updateDaySettings((prev) =>
      prev.map((day) => {
        if (day.id === deleteConfirmModal.dayId) {
          const serviceGroupId = deleteConfirmModal.serviceGroupId ?? null;
          const slots = getSlotsForServiceGroup(day, serviceGroupId, true);
          const filteredSlots = slots
            .filter((slot) => slot.id !== deleteConfirmModal.slotId)
            .map((slot) => ({ ...slot }));

          return updateSlotsForServiceGroup(day, serviceGroupId, filteredSlots);
        }
        return day;
      }),
    );
    setDeleteConfirmModal({
      isOpen: false,
      dayId: "",
      slotId: "",
      serviceGroupId: null,
      slotInfo: "",
    });
  };

  const getFilteredTimeSlots = (
    day: DaySettings,
    serviceGroupId: string | null,
  ): TimeSlot[] => {
    return getSlotsForServiceGroup(day, serviceGroupId, true);
  };

  const resolvedServiceGroupRows: ServiceGroupRowConfig[] = useMemo(() => {
    if (!isAdvanceServiceGroupEnabled) {
      return [];
    }

    return serviceGroups.map((group, index) => ({
      id: group.id,
      label: group.label,
      color: SERVICE_GROUP_COLORS[index % SERVICE_GROUP_COLORS.length],
    }));
  }, [isAdvanceServiceGroupEnabled, serviceGroups]);

  useEffect(() => {
    if (!isAdvanceServiceGroupEnabled || serviceGroups.length === 0) {
      return;
    }

    const hasMissingGroupSlots = daySettings.some((day) => {
      const groupSlots = day.serviceGroupSlots ?? {};
      return serviceGroups.some((group) => !(group.id in groupSlots));
    });

    if (!hasMissingGroupSlots) {
      return;
    }

    updateDaySettings((prev) =>
      prev.map((day) => {
        const existingGroupSlots = day.serviceGroupSlots ?? {};
        const nextGroupSlots = { ...existingGroupSlots };
        let dayChanged = false;

        serviceGroups.forEach((group) => {
          if (!(group.id in nextGroupSlots)) {
            nextGroupSlots[group.id] = [];
            dayChanged = true;
          }
        });

        if (!dayChanged) {
          return day;
        }

        return {
          ...day,
          serviceGroupSlots: nextGroupSlots,
        };
      }),
    );
  }, [
    daySettings,
    isAdvanceServiceGroupEnabled,
    serviceGroups,
    updateDaySettings,
  ]);

  const handleToggleAddTimeRow = (
    dayId: string,
    serviceGroupId: string | null,
  ) => {
    const key = buildAddTimeKey(dayId, serviceGroupId);
    setActiveAddTimeKey((prev) => {
      const isSame = prev === key;

      if (!isSame) {
        setAddTimeSelections((selectionPrev) => ({
          ...selectionPrev,
          [key]: selectionPrev[key] ?? {
            time: "",
            arrivalWindow: {
              enabled: false,
              hours: "",
              minutes: "",
              endTime: "",
            },
          },
        }));
        setDuplicateTimeErrors((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
        setOpenAddTimeDropdownKey(null);
        setOpenArrivalWindowDropdownKey(null);
      } else {
        setOpenAddTimeDropdownKey((prevOpen) =>
          prevOpen === key ? null : prevOpen,
        );
        setOpenArrivalWindowDropdownKey(null);
      }

      return isSame ? null : key;
    });
  };

  const updateAddTimeSelection = (
    dayId: string,
    serviceGroupId: string | null,
    updates: Partial<{
      time: string;
      arrivalWindow: Partial<{
        enabled: boolean;
        hours: string;
        minutes: string;
        endTime: string;
      }>;
    }>,
  ) => {
    const key = buildAddTimeKey(dayId, serviceGroupId);
    setAddTimeSelections((prev) => {
      const current = prev[key] ?? {
        time: "",
        arrivalWindow: {
          enabled: false,
          hours: "",
          minutes: "",
          endTime: "",
        },
      };
      const { arrivalWindow: arrivalWindowUpdates, ...restUpdates } = updates;
      const nextUpdates = { ...restUpdates };

      if (typeof restUpdates.time === "string") {
        const normalizedTime = normalizeUserTimeInput(restUpdates.time);
        nextUpdates.time = normalizedTime ?? restUpdates.time;
      }

      let nextArrivalWindow = arrivalWindowUpdates
        ? {
            ...current.arrivalWindow,
            ...arrivalWindowUpdates,
          }
        : current.arrivalWindow;

      if (
        arrivalWindowUpdates?.endTime !== undefined &&
        typeof arrivalWindowUpdates.endTime === "string"
      ) {
        const normalizedEndTime = normalizeUserTimeInput(
          arrivalWindowUpdates.endTime,
        );
        nextArrivalWindow = {
          ...nextArrivalWindow,
          endTime: normalizedEndTime ?? arrivalWindowUpdates.endTime,
        };
      }

      const nextTime =
        typeof nextUpdates.time === "string" ? nextUpdates.time : current.time;

      if (nextArrivalWindow.enabled) {
        if (
          arrivalWindowUpdates?.endTime !== undefined ||
          restUpdates.time !== undefined
        ) {
          const durationParts = computeDurationParts(
            nextTime,
            nextArrivalWindow.endTime ?? "",
          );

          nextArrivalWindow = durationParts
            ? {
                ...nextArrivalWindow,
                hours: durationParts.hours,
                minutes: durationParts.minutes,
              }
            : {
                ...nextArrivalWindow,
                hours: "",
                minutes: "",
              };
        }
      } else {
        nextArrivalWindow = {
          ...nextArrivalWindow,
          hours: "",
          minutes: "",
          endTime: "",
        };
      }

      return {
        ...prev,
        [key]: {
          ...current,
          ...nextUpdates,
          arrivalWindow: nextArrivalWindow,
        },
      };
    });
  };

  const checkTimeSlotExists = (
    dayId: string,
    serviceGroupId: string | null,
    startTime: string,
    endTime: string,
  ): boolean => {
    const day = daySettings.find((d) => d.id === dayId);
    if (!day) return false;

    const existingSlots = getSlotsForServiceGroup(day, serviceGroupId, true);
    return existingSlots.some(
      (slot) => slot.startTime === startTime && slot.endTime === endTime,
    );
  };

  const handleConfirmAddTime = (
    dayId: string,
    serviceGroupId: string | null,
  ) => {
    const key = buildAddTimeKey(dayId, serviceGroupId);
    const selection = addTimeSelections[key];

    if (!selection || !selection.time) {
      return;
    }

    let newSlot: TimeSlot | null = null;

    if (!selection.arrivalWindow.enabled) {
      newSlot = {
        id: `slot-${Date.now()}`,
        startTime: selection.time,
        endTime: selection.time,
        jobsMax: 0,
        type: "specific-time",
      };
    } else {
      const rawHours = parseInt(selection.arrivalWindow.hours ?? "0", 10);
      const rawMinutes = parseInt(selection.arrivalWindow.minutes ?? "0", 10);
      const durationMinutes =
        (Number.isNaN(rawHours) ? 0 : rawHours * 60) +
        (Number.isNaN(rawMinutes) ? 0 : rawMinutes);

      if (durationMinutes <= 0) {
        return;
      }

      const startMinutes = convertTimeToMinutes(selection.time);
      const endMinutes = startMinutes + durationMinutes;

      newSlot = {
        id: `slot-${Date.now()}`,
        startTime: selection.time,
        endTime: convertMinutesToTime(endMinutes),
        jobsMax: 0,
        type: "arrival-window",
      };
    }

    if (!newSlot) {
      return;
    }

    const isDuplicate = checkTimeSlotExists(
      dayId,
      serviceGroupId,
      newSlot.startTime,
      newSlot.endTime,
    );

    if (isDuplicate) {
      setDuplicateTimeErrors((prev) => ({
        ...prev,
        [key]: true,
      }));
      return;
    }

    setDuplicateTimeErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });

    updateDaySettings((prev) =>
      prev.map((day) =>
        day.id === dayId
          ? updateSlotsForServiceGroup(
              day,
              serviceGroupId,
              sortTimeSlots([
                ...getSlotsForServiceGroup(day, serviceGroupId, true).map(
                  (slot) => ({ ...slot }),
                ),
                newSlot!,
              ]),
            )
          : day,
      ),
    );

    setAddTimeSelections((prev) => ({
      ...prev,
      [key]: {
        time: "",
        arrivalWindow: {
          enabled: false,
          hours: "",
          minutes: "",
          endTime: "",
        },
      },
    }));

    setActiveAddTimeKey(null);
    setOpenAddTimeDropdownKey(null);
    setOpenArrivalWindowDropdownKey(null);
  };

  const handleApplyToDays = (
    sourceDayId: string,
    serviceGroupId: string | null,
  ) => {
    const sourceDay = daySettings.find((day) => day.id === sourceDayId);
    if (!sourceDay) {
      return;
    }

    const targetDayIds = getResolvedApplyTargets(sourceDayId);
    const applyToAllDays = applyToSelection.includes(APPLY_ALL_OPTION_ID);

    if (targetDayIds.length === 0 && !applyToAllDays) {
      return;
    }

    const finalTargetDayIds = applyToAllDays
      ? daySettings.map((day) => day.id)
      : targetDayIds;

    updateDaySettings((prev) =>
      prev.map((day) => {
        const shouldApplyToDay = finalTargetDayIds.includes(day.id);

        if (!shouldApplyToDay) {
          return day;
        }

        const sourceSlots = getSlotsForServiceGroup(
          sourceDay,
          serviceGroupId,
          true,
        ).map((slot) => ({ ...slot }));

        const clonedSlots = sourceSlots.map((slot, index) => ({
          ...slot,
          id: `slot-${day.id}-${index}-${Date.now()}`,
        }));

        if (serviceGroupId) {
          return updateSlotsForServiceGroup(
            day,
            serviceGroupId,
            sortTimeSlots(
              clonedSlots.map((slot, index) => ({
                ...slot,
                id: `slot-${day.id}-${serviceGroupId}-${index}-${Date.now()}`,
              })),
            ),
          );
        }

        let updatedDay = updateSlotsForServiceGroup(
          day,
          null,
          sortTimeSlots(
            clonedSlots.map((slot, index) => ({
              ...slot,
              id: `slot-${day.id}-default-${index}-${Date.now()}`,
            })),
          ),
        );

        serviceGroups.forEach((group) => {
          updatedDay = updateSlotsForServiceGroup(
            updatedDay,
            group.id,
            sortTimeSlots(
              clonedSlots.map((slot, index) => ({
                ...slot,
                id: `slot-${day.id}-${group.id}-${index}-${Date.now()}`,
              })),
            ),
          );
        });

        return updatedDay;
      }),
    );

    setApplyToSelection([]);
  };

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
      <div className="mb-4 w-full sm:mb-5">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
            <div>
              <Label className="text-xs font-medium text-gray-900 sm:text-sm">
                Advanced Service Groups
              </Label>
              <p className="mt-1 text-xs text-gray-500">
                Choose which services these maximum settings apply to.
              </p>
            </div>
            <CustomToggle
              checked={isAdvanceServiceGroupEnabled}
              onChange={(checked) =>
                setIsAdvanceServiceGroupEnabled(() => checked)
              }
            />
          </div>
          {isAdvanceServiceGroupEnabled && (
            <div className="mt-4 space-y-4 border-t border-gray-200 pt-4 sm:mt-5 sm:space-y-5 sm:pt-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">
                    Select Services
                  </h4>
                  <p className="text-xs text-gray-500">
                    Choose which services these maximum settings apply to.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-gray-50 px-3 py-1 text-[11px] font-medium text-gray-600">
                    {serviceGroups.length}{" "}
                    {serviceGroups.length === 1 ? "group" : "groups"}
                  </span>
                </div>
              </div>
              <div className="grid gap-4">
                {serviceGroups.length > 0 ? (
                  serviceGroups.map((group, index) => {
                    const groupSelections =
                      selectedServiceGroups[group.id] ?? [];
                    const isGroupSelected =
                      groupSelections.length === group.services.length &&
                      group.services.length > 0;
                    const accentColor =
                      SERVICE_GROUP_COLORS[index % SERVICE_GROUP_COLORS.length];
                    const accentBackground = `${accentColor}0F`;
                    const isEditingGroup =
                      editingServiceGroupId === group.id &&
                      editServiceGroupDraft?.id === group.id;

                    return (
                      <div key={group.id}>
                        {isEditingGroup ? (
                          <div className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm sm:px-5 sm:py-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 sm:text-sm">
                                <HiPencil className="h-3.5 w-3.5 text-gray-600 sm:h-4 sm:w-4" />
                                Edit Group
                              </div>
                              <button
                                type="button"
                                onClick={onCloseEditServiceGroup}
                                className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-transparent text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                              >
                                <HiX className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <div className="space-y-4">
                              <div className="flex flex-col space-y-2">
                                <label className="text-xs font-medium text-gray-600">
                                  Group Name
                                </label>
                                <input
                                  value={editServiceGroupDraft?.label ?? ""}
                                  onChange={(event) =>
                                    onEditGroupNameChange(event.target.value)
                                  }
                                  placeholder="Group name"
                                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-gray-500 focus:ring-1 focus:ring-gray-500 focus:outline-none"
                                />
                              </div>
                              <div className="space-y-2">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <label className="text-xs font-medium text-gray-600">
                                    Services
                                  </label>
                                  <button
                                    type="button"
                                    onClick={onAddServiceToDraft}
                                    className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                                  >
                                    <HiOutlinePlus className="h-3.5 w-3.5" />
                                    Add Services
                                  </button>
                                </div>
                                <div className="space-y-2">
                                  {editServiceGroupDraft?.services.map(
                                    (service) => (
                                      <div
                                        key={service.id}
                                        className="flex items-center gap-2"
                                      >
                                        <input
                                          value={service.label}
                                          onChange={(event) =>
                                            onEditServiceLabelChange(
                                              service.id,
                                              event.target.value,
                                            )
                                          }
                                          placeholder="Sub-item name"
                                          className={`flex-1 rounded-md border bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:ring-1 focus:outline-none ${
                                            editServiceValidationErrors.has(
                                              service.id,
                                            )
                                              ? "border-red-500 text-gray-700 focus:border-red-500 focus:ring-red-500"
                                              : "border-gray-300 text-gray-700 focus:border-gray-500 focus:ring-gray-500"
                                          }`}
                                        />
                                        <button
                                          type="button"
                                          onClick={() =>
                                            onRemoveServiceFromDraft(service.id)
                                          }
                                          className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-transparent text-red-500 transition-colors hover:bg-red-50 hover:text-red-600"
                                        >
                                          <HiX className="h-3.5 w-3.5" />
                                        </button>
                                      </div>
                                    ),
                                  )}
                                  {(editServiceGroupDraft?.services.length ??
                                    0) === 0 && (
                                    <p className="text-[11px] text-gray-500">
                                      Add at least one sub-item to this group.
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end">
                                <button
                                  type="button"
                                  onClick={onCloseEditServiceGroup}
                                  className="w-full cursor-pointer rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100 sm:w-auto"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={onUpdateServiceGroup}
                                  className="w-full cursor-pointer rounded-md bg-gray-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-gray-300 sm:w-auto"
                                  disabled={
                                    !editServiceGroupDraft?.label.trim() ||
                                    (
                                      editServiceGroupDraft?.services ?? []
                                    ).every(
                                      (service) =>
                                        service.label.trim().length === 0,
                                    )
                                  }
                                >
                                  Save Changes
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div
                            className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white px-5 py-4 sm:flex-row sm:items-start sm:justify-between"
                            style={{
                              borderLeftColor: accentColor,
                              borderLeftWidth: 4,
                              borderLeftStyle: "solid",
                              background:
                                "linear-gradient(90deg, " +
                                `${accentBackground} 0%, ` +
                                "#FFFFFF 35%)",
                            }}
                          >
                            <div>
                              <label className="flex items-center gap-3 text-sm font-semibold text-gray-900">
                                <span
                                  className="inline-flex h-2 w-2 shrink-0 rounded-full"
                                  style={{
                                    backgroundColor: accentColor,
                                  }}
                                />
                                <input
                                  ref={(node) => {
                                    if (serviceGroupParentRefs.current) {
                                      serviceGroupParentRefs.current[group.id] =
                                        node;
                                    }
                                  }}
                                  type="checkbox"
                                  checked={isGroupSelected}
                                  onChange={() =>
                                    onToggleServiceGroup(group.id)
                                  }
                                  className="h-4 w-4 rounded border-gray-300 text-gray-600 focus:ring-gray-500"
                                />
                                {group.label}
                              </label>
                              <div className="mt-3 space-y-2 pl-7">
                                {group.services.map((service) => {
                                  const isChecked = groupSelections.includes(
                                    service.id,
                                  );
                                  return (
                                    <label
                                      key={service.id}
                                      className="flex items-center gap-3 text-sm text-gray-700"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() =>
                                          onToggleService(group.id, service.id)
                                        }
                                        className="h-4 w-4 rounded border-gray-300 text-gray-600 focus:ring-gray-500"
                                      />
                                      {service.label}
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => onOpenEditServiceGroup(group.id)}
                                className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-gray-300 bg-white text-gray-500 transition-colors hover:border-gray-400 hover:text-gray-700"
                              >
                                <HiPencil className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  onOpenDeleteServiceGroup(group.id)
                                }
                                className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-gray-300 bg-white text-red-500 transition-colors hover:border-red-400 hover:text-red-600"
                              >
                                <HiTrash className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center">
                    <p className="text-sm font-semibold text-gray-900">
                      No service groups yet
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Add a group to target these maximum settings.
                    </p>
                  </div>
                )}
                {isAddServiceGroupFormOpen ? (
                  <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm sm:py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-semibold text-gray-900 sm:text-sm">
                        <HiOutlinePlus className="h-3.5 w-3.5 text-gray-600 sm:h-4 sm:w-4" />
                        Add New Group
                      </div>
                      <button
                        type="button"
                        onClick={onCloseAddServiceGroup}
                        className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-transparent text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                      >
                        <HiX className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="space-y-4">
                      <div className="flex flex-col space-y-2">
                        <label className="mb-2 block text-xs font-medium text-gray-600">
                          Group Name
                        </label>
                        <input
                          value={newServiceGroup.label}
                          onChange={(event) =>
                            onAddGroupNameChange(event.target.value)
                          }
                          placeholder="e.g., Studio, Apartment, House"
                          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-gray-500 focus:ring-1 focus:ring-gray-500 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-medium text-gray-600">
                              Services
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                setShowServicesSection(true);
                                onAddGroupAddService();
                              }}
                              className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                            >
                              <HiOutlinePlus className="h-3.5 w-3.5" />
                              Add Custom Services
                            </button>
                          </div>
                          <div className="relative" ref={servicesDropdownRef}>
                            <button
                              type="button"
                              onClick={() =>
                                setIsServicesDropdownOpen(
                                  !isServicesDropdownOpen,
                                )
                              }
                              className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 focus:border-gray-500 focus:ring-1 focus:ring-gray-500 focus:outline-none"
                            >
                              <span className="text-sm text-gray-500">
                                Select a service...
                              </span>
                              <HiChevronDown className="h-4 w-4 text-gray-500" />
                            </button>
                            {isServicesDropdownOpen && (
                              <div className="absolute right-0 left-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg">
                                <div className="py-1">
                                  {servicesToUse.map((service) => (
                                    <button
                                      key={service.id}
                                      type="button"
                                      onClick={() =>
                                        handleAddServiceFromDropdown(service.name)
                                      }
                                      className="w-full px-4 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100"
                                    >
                                      {service.name}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        {showServicesSection && (
                          <div className="space-y-2">
                            {newServiceGroup.services.map((service, index) => (
                              <div
                                key={service.id || index}
                                className="flex items-center gap-2"
                              >
                                <input
                                  value={service.label}
                                  onChange={(event) =>
                                    onAddGroupServiceChange(
                                      index,
                                      event.target.value,
                                    )
                                  }
                                  placeholder="Input custom service"
                                  className={`flex-1 rounded-md border bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:ring-1 focus:outline-none ${
                                    newServiceValidationErrors.has(service.id)
                                      ? "border-red-500 text-gray-700 focus:border-red-500 focus:ring-red-500"
                                      : "border-gray-300 text-gray-700 focus:border-gray-500 focus:ring-gray-500"
                                  }`}
                                />
                                <button
                                  type="button"
                                  onClick={() => onAddGroupRemoveService(index)}
                                  className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-transparent text-red-500 transition-colors hover:bg-red-50 hover:text-red-600"
                                >
                                  <HiX className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ))}
                            {newServiceGroup.services.length === 0 && (
                              <p className="text-[11px] text-gray-500">
                                Add at least one sub-item to this group.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end">
                        <button
                          type="button"
                          onClick={onCloseAddServiceGroup}
                          className="w-full cursor-pointer rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100 sm:w-auto"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={onConfirmAddServiceGroup}
                          className="w-full cursor-pointer rounded-md bg-gray-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-gray-300 sm:w-auto"
                          disabled={
                            !newServiceGroup.label.trim() ||
                            newServiceGroup.services.every(
                              (service) => service.label.trim().length === 0,
                            )
                          }
                        >
                          Save Group
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={onOpenAddServiceGroup}
                    className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-500 transition-colors hover:border-gray-400 hover:text-gray-600"
                  >
                    <HiPlus className="h-5 w-5" />
                    Add Group
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white transition-all duration-200">
        <div className="relative overflow-x-auto">
          <style>{`
            .sticky-day-column::after {
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
          <table className="w-full min-w-[700px] border-collapse text-left text-xs transition-all duration-200">
            <colgroup>
              <col className="w-[18%] min-w-[100px]" />
              <col className="w-[7rem] min-w-[110px]" />
              <col className="w-auto min-w-[300px]" />
              <col className="w-[12%] min-w-[120px]" />
            </colgroup>
            <thead className="bg-gray-100 text-[#F8FAFC]">
              <tr className="text-[#1F2937]">
                <th
                  scope="col"
                  className="sticky-day-column sticky left-0 z-30 border-r border-b border-gray-200 bg-gray-100 px-3 py-3 text-[11px] font-bold tracking-wider uppercase sm:px-4"
                >
                  Day
                </th>
                <th
                  scope="col"
                  className="border-r border-b border-gray-200 px-3 py-3 text-[11px] font-bold tracking-wider whitespace-nowrap uppercase sm:px-4"
                >
                  Business Hours
                </th>
                <th
                  scope="col"
                  className="border-r border-b border-gray-200 px-3 py-3 text-[11px] font-bold tracking-wider uppercase sm:px-4"
                >
                  Time Slots
                </th>
                <th
                  scope="col"
                  className="border-b border-gray-200 px-3 py-2 text-center text-[11px] font-bold tracking-wider uppercase"
                >
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {daySettings.map((day, rowIndex) => {
                const isOddDisplayRow = rowIndex % 2 === 1;
                const openRowBgColor = isOddDisplayRow
                  ? rowOddBgColor
                  : rowEvenBgColor;
                const openRowBorderColor = isOddDisplayRow
                  ? rowOddBorderColor
                  : rowEvenBorderColor;
                const resolvedApplyTargets = getResolvedApplyTargets(day.id);
                const serviceGroupRows = (
                  resolvedServiceGroupRows.length > 0
                    ? resolvedServiceGroupRows
                    : [null]
                ) as Array<ServiceGroupRowConfig | null>;

                return serviceGroupRows.map((serviceGroup, groupIndex) => {
                  const serviceGroupId = serviceGroup?.id ?? null;
                  const addTimeKey = buildAddTimeKey(day.id, serviceGroupId);
                  const addTimeSelection = addTimeSelections[addTimeKey] ?? {
                    time: "",
                    arrivalWindow: {
                      enabled: false,
                      hours: "",
                      minutes: "",
                      endTime: "",
                    },
                  };
                  const parsedArrivalWindowHours = parseInt(
                    addTimeSelection.arrivalWindow.hours ?? "0",
                    10,
                  );
                  const parsedArrivalWindowMinutes = parseInt(
                    addTimeSelection.arrivalWindow.minutes ?? "0",
                    10,
                  );
                  const arrivalWindowDurationMinutes =
                    (Number.isNaN(parsedArrivalWindowHours)
                      ? 0
                      : parsedArrivalWindowHours * 60) +
                    (Number.isNaN(parsedArrivalWindowMinutes)
                      ? 0
                      : parsedArrivalWindowMinutes);
                  const isConfirmDisabled =
                    !addTimeSelection.time ||
                    (addTimeSelection.arrivalWindow.enabled &&
                      arrivalWindowDurationMinutes <= 0);
                  const filteredTimeSlots = getFilteredTimeSlots(
                    day,
                    serviceGroupId,
                  );
                  const isApplyDisabled =
                    resolvedApplyTargets.length === 0 ||
                    filteredTimeSlots.length === 0;
                  const isAddTimeActive = activeAddTimeKey === addTimeKey;
                  const isFirstRow = groupIndex === 0;
                  const isGroupOpen =
                    day.isOpen &&
                    (serviceGroup?.id
                      ? serviceGroupStatus[day.id]?.[serviceGroup.id] !== false
                      : true);
                  const timeSlotsForRow = filteredTimeSlots;
                  const isTimeDropdownOpen =
                    openAddTimeDropdownKey === addTimeKey;
                  const normalizedTimeInput = addTimeSelection.time
                    .toLowerCase()
                    .trim();
                  const filteredTimeOptions =
                    normalizedTimeInput.length > 0
                      ? TIME_OPTIONS.filter((option) =>
                          option.toLowerCase().includes(normalizedTimeInput),
                        )
                      : TIME_OPTIONS;
                  const isArrivalWindowDropdownOpen =
                    openArrivalWindowDropdownKey === addTimeKey;
                  const arrivalWindowOptions =
                    addTimeSelection.arrivalWindow.enabled &&
                    addTimeSelection.time
                      ? (() => {
                          const baseMinutes = convertTimeToMinutes(
                            addTimeSelection.time,
                          );

                          if (
                            Number.isNaN(baseMinutes) ||
                            baseMinutes >= 24 * 60
                          ) {
                            return [] as string[];
                          }

                          const options: string[] = [];

                          for (
                            let minutes =
                              baseMinutes + ARRIVAL_WINDOW_STEP_MINUTES;
                            minutes < 24 * 60;
                            minutes += ARRIVAL_WINDOW_STEP_MINUTES
                          ) {
                            options.push(convertMinutesToTime(minutes));
                          }

                          return options;
                        })()
                      : [];
                  const arrivalWindowInputValue =
                    addTimeSelection.arrivalWindow.endTime ?? "";
                  const normalizedArrivalWindowInput = arrivalWindowInputValue
                    .toLowerCase()
                    .trim();
                  const hasArrivalWindowInput =
                    normalizedArrivalWindowInput.length > 0;
                  const isArrivalWindowExactMatch = arrivalWindowOptions.some(
                    (option) =>
                      option.toLowerCase() === normalizedArrivalWindowInput,
                  );
                  const filteredArrivalWindowOptions =
                    hasArrivalWindowInput && !isArrivalWindowExactMatch
                      ? arrivalWindowOptions.filter((option) =>
                          option
                            .toLowerCase()
                            .includes(normalizedArrivalWindowInput),
                        )
                      : arrivalWindowOptions;
                  const isArrivalWindowInputDisabled =
                    !addTimeSelection.time ||
                    Number.isNaN(convertTimeToMinutes(addTimeSelection.time));

                  return (
                    <tr
                      key={`${day.id}-${serviceGroup?.id ?? "default"}-${groupIndex}`}
                      className="border-b transition-colors duration-200"
                      style={{
                        backgroundColor: day.isOpen
                          ? openRowBgColor
                          : closedDayBgColor,
                        borderBottomColor: day.isOpen
                          ? openRowBorderColor
                          : closedDayBorderColor,
                      }}
                    >
                      <td
                        className={`sticky-day-column sticky left-0 z-30 border-r border-gray-200 px-3 py-3 align-top sm:px-4 ${
                          day.isOpen ? "" : "bg-red-50"
                        }`}
                        style={
                          day.isOpen
                            ? {
                                backgroundColor: isFirstRow
                                  ? openRowBgColor
                                  : openRowBgColor,
                              }
                            : undefined
                        }
                      >
                        {isFirstRow && (
                          <div className="flex flex-col space-y-1">
                            <p
                              className={`text-xs font-semibold sm:text-sm ${
                                day.isOpen ? "text-gray-900" : "text-red-700"
                              }`}
                            >
                              {day.day}
                            </p>
                          </div>
                        )}
                        {serviceGroup && (
                          <div className="mt-2 flex items-center gap-2">
                            <span
                              className="inline-flex h-2 w-2 shrink-0 rounded-full"
                              style={{ backgroundColor: serviceGroup.color }}
                            />
                            <span className="text-[12px] font-medium text-gray-900 sm:text-[13px]">
                              {serviceGroup.label}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="border-r border-gray-200 px-3 py-3 align-top sm:px-4">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <div className="scale-90 transform">
                              <ToggleSwitch     
                                color="gray"                      
                                checked={isGroupOpen}
                                label=""
                                onChange={() => {
                                  if (serviceGroup?.id) {
                                    handleServiceGroupSwitchChange(
                                      day,
                                      serviceGroup.id,
                                      isGroupOpen,
                                    );
                                  } else {
                                    handleToggleOpen(day.id);
                                  }
                                }}
                              />
                            </div>
                            <span
                              className={`text-[11px] font-semibold sm:text-[12px] ${
                                isGroupOpen ? "text-gray-900" : "text-red-700"
                              }`}
                            >
                              {isGroupOpen ? "Open" : "Closed"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center align-middle sm:px-4 sm:py-4">
                        {isGroupOpen ? (
                          <div className="flex flex-col gap-2 sm:gap-3">
                            {timeSlotsForRow.length > 0 ? (
                              timeSlotsForRow.map((slot) => (
                                <div
                                  key={slot.id}
                                  className="flex flex-row items-center justify-between gap-2"
                                >
                                  <span className="text-[12px] font-medium whitespace-nowrap text-gray-700 sm:text-[13px]">
                                    {formatTimeSlotDisplay(slot)}
                                  </span>
                                  <div className="flex items-center gap-1.5">
                                    <div className="flex items-center gap-1">
                                      <span
                                        className={`w-16 text-[11px] sm:w-20 sm:text-[12px] ${
                                          slot.isFullMax
                                            ? "font-semibold text-green-600"
                                            : "text-[#9CA3AF]"
                                        }`}
                                      >
                                        Full Max
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleToggleFullMax(
                                            day.id,
                                            slot.id,
                                            serviceGroupId,
                                          )
                                        }
                                        className={`relative flex h-6 w-10 cursor-pointer items-center justify-center rounded-full border transition-colors duration-200 ${
                                          slot.isFullMax
                                            ? "border-green-500 bg-green-500"
                                            : "border-gray-600 bg-gray-600"
                                        }`}
                                        aria-pressed={slot.isFullMax}
                                      >
                                        <span className="sr-only">
                                          {slot.isFullMax
                                            ? "Disable Full Max"
                                            : "Enable Full Max"}
                                        </span>
                                        <span
                                          aria-hidden
                                          className={`absolute top-[3px] bottom-[3px] aspect-square rounded-full bg-white shadow-sm transition-all duration-200 ${
                                            slot.isFullMax
                                              ? "left-[3px]"
                                              : "right-[3px]"
                                          }`}
                                        />
                                      </button>
                                      <span
                                        className={`w-18 text-right text-[11px] tabular-nums sm:w-21 sm:text-[12px] ${
                                          slot.isFullMax
                                            ? "text-[#9CA3AF]"
                                            : "font-semibold text-gray-600"
                                        }`}
                                      >
                                        {slot.isFullMax
                                          ? "- Jobs Max"
                                          : `${slot.jobsMax} Jobs Max`}
                                      </span>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-1.5 pl-1">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleDecreaseJobs(
                                            day.id,
                                            slot.id,
                                            serviceGroupId,
                                          )
                                        }
                                        disabled={slot.isFullMax}
                                        className={`flex h-6 w-6 items-center justify-center rounded border transition-colors ${
                                          slot.isFullMax
                                            ? "cursor-not-allowed border-gray-100 bg-white text-gray-300 opacity-65"
                                            : "cursor-pointer border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                                        }`}
                                      >
                                        <HiMinus className="h-3 w-3" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleIncreaseJobs(
                                            day.id,
                                            slot.id,
                                            serviceGroupId,
                                          )
                                        }
                                        disabled={slot.isFullMax}
                                        className={`flex h-6 w-6 items-center justify-center rounded border transition-colors ${
                                          slot.isFullMax
                                            ? "cursor-not-allowed border-gray-100 bg-white text-gray-300 opacity-65"
                                            : "cursor-pointer border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                                        }`}
                                      >
                                        <HiPlus className="h-3 w-3" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleDeleteSlot(
                                            day.id,
                                            slot.id,
                                            serviceGroupId,
                                          )
                                        }
                                        className="flex h-6 w-6 cursor-pointer items-center justify-center rounded border border-red-300 bg-white text-red-600 transition-colors hover:bg-red-50"
                                      >
                                        <HiX className="h-3 w-3" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <span className="text-[12px] text-gray-400">
                                No time slots
                              </span>
                            )}

                            {isGroupOpen &&
                              isAddTimeActive &&
                              (serviceGroupId ? true : isFirstRow) && (
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <div className="relative w-full sm:w-28">
                                      <input
                                        type="text"
                                        value={addTimeSelection.time}
                                        onFocus={() =>
                                          setOpenAddTimeDropdownKey(addTimeKey)
                                        }
                                        onClick={() =>
                                          setOpenAddTimeDropdownKey(addTimeKey)
                                        }
                                        onChange={(event) => {
                                          const nextValue = event.target.value;
                                          updateAddTimeSelection(
                                            day.id,
                                            serviceGroupId,
                                            {
                                              time: nextValue,
                                            },
                                          );
                                          setDuplicateTimeErrors((prev) => {
                                            const next = { ...prev };
                                            delete next[addTimeKey];
                                            return next;
                                          });
                                          setOpenAddTimeDropdownKey(addTimeKey);
                                        }}
                                        onBlur={() => {
                                          window.setTimeout(() => {
                                            setOpenAddTimeDropdownKey(
                                              (prevKey) =>
                                                prevKey === addTimeKey
                                                  ? null
                                                  : prevKey,
                                            );
                                          }, 100);
                                        }}
                                        placeholder="Time"
                                        autoComplete="off"
                                        className={`h-6 w-full rounded border bg-white px-2 text-xs focus:ring-1 focus:outline-none ${
                                          duplicateTimeErrors[addTimeKey]
                                            ? "border-red-500 text-gray-700 focus:border-red-500 focus:ring-red-500"
                                            : "border-gray-300 text-gray-700 focus:border-gray-500 focus:ring-gray-300"
                                        }`}
                                      />
                                      {isTimeDropdownOpen &&
                                        filteredTimeOptions.length > 0 && (
                                          <div className="absolute top-full left-0 z-10 mt-1 max-h-40 w-full overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg">
                                            {filteredTimeOptions.map(
                                              (timeOption) => (
                                                <button
                                                  key={timeOption}
                                                  type="button"
                                                  className="flex w-full cursor-pointer items-center px-2 py-1 text-left text-[11px] text-gray-700 hover:bg-gray-50"
                                                  onMouseDown={(event) => {
                                                    event.preventDefault();
                                                    updateAddTimeSelection(
                                                      day.id,
                                                      serviceGroupId,
                                                      { time: timeOption },
                                                    );
                                                    setDuplicateTimeErrors(
                                                      (prev) => {
                                                        const next = {
                                                          ...prev,
                                                        };
                                                        delete next[addTimeKey];
                                                        return next;
                                                      },
                                                    );
                                                    setOpenAddTimeDropdownKey(
                                                      null,
                                                    );
                                                  }}
                                                >
                                                  {timeOption}
                                                </button>
                                              ),
                                            )}
                                          </div>
                                        )}
                                    </div>
                                    <label className="flex cursor-pointer items-center gap-1 text-[10px] font-semibold whitespace-nowrap text-gray-500 sm:text-[11px]">
                                      <input
                                        type="checkbox"
                                        checked={
                                          addTimeSelection.arrivalWindow.enabled
                                        }
                                        onChange={(event) => {
                                          const nextEnabled =
                                            event.target.checked;
                                          setDuplicateTimeErrors((prev) => {
                                            const next = { ...prev };
                                            delete next[addTimeKey];
                                            return next;
                                          });

                                          if (nextEnabled) {
                                            const baseMinutes =
                                              convertTimeToMinutes(
                                                addTimeSelection.time,
                                              );
                                            const hasValidBase =
                                              !!addTimeSelection.time &&
                                              !Number.isNaN(baseMinutes);
                                            const defaultEndTime =
                                              hasValidBase &&
                                              baseMinutes +
                                                ARRIVAL_WINDOW_STEP_MINUTES <
                                                24 * 60
                                                ? convertMinutesToTime(
                                                    baseMinutes +
                                                      ARRIVAL_WINDOW_STEP_MINUTES,
                                                  )
                                                : "";

                                            updateAddTimeSelection(
                                              day.id,
                                              serviceGroupId,
                                              {
                                                arrivalWindow: {
                                                  enabled: true,
                                                  endTime: defaultEndTime,
                                                },
                                              },
                                            );
                                            setOpenArrivalWindowDropdownKey(
                                              defaultEndTime
                                                ? addTimeKey
                                                : null,
                                            );
                                          } else {
                                            updateAddTimeSelection(
                                              day.id,
                                              serviceGroupId,
                                              {
                                                arrivalWindow: {
                                                  enabled: false,
                                                  endTime: "",
                                                  hours: "",
                                                  minutes: "",
                                                },
                                              },
                                            );
                                            setOpenArrivalWindowDropdownKey(
                                              null,
                                            );
                                          }
                                        }}
                                        className="h-3 w-3 cursor-pointer rounded border border-gray-300 text-gray-600 focus:ring-0"
                                      />
                                      <span>Arrival Window</span>
                                    </label>
                                    {addTimeSelection.arrivalWindow.enabled && (
                                      <div className="flex items-center gap-1 text-[10px] whitespace-nowrap sm:text-[11px]">
                                        <div className="relative w-full sm:w-32">
                                          <input
                                            type="text"
                                            value={arrivalWindowInputValue}
                                            onFocus={() => {
                                              if (
                                                isArrivalWindowInputDisabled
                                              ) {
                                                return;
                                              }
                                              setOpenArrivalWindowDropdownKey(
                                                addTimeKey,
                                              );
                                            }}
                                            onClick={() => {
                                              if (
                                                isArrivalWindowInputDisabled
                                              ) {
                                                return;
                                              }
                                              setOpenArrivalWindowDropdownKey(
                                                addTimeKey,
                                              );
                                            }}
                                            onChange={(event) => {
                                              if (
                                                isArrivalWindowInputDisabled
                                              ) {
                                                return;
                                              }
                                              const nextValue =
                                                event.target.value;
                                              updateAddTimeSelection(
                                                day.id,
                                                serviceGroupId,
                                                {
                                                  arrivalWindow: {
                                                    endTime: nextValue,
                                                  },
                                                },
                                              );
                                              setDuplicateTimeErrors((prev) => {
                                                const next = { ...prev };
                                                delete next[addTimeKey];
                                                return next;
                                              });
                                              setOpenArrivalWindowDropdownKey(
                                                addTimeKey,
                                              );
                                            }}
                                            onBlur={() => {
                                              window.setTimeout(() => {
                                                setOpenArrivalWindowDropdownKey(
                                                  (prevKey) =>
                                                    prevKey === addTimeKey
                                                      ? null
                                                      : prevKey,
                                                );
                                              }, 100);
                                            }}
                                            placeholder="End Time"
                                            autoComplete="off"
                                            disabled={
                                              isArrivalWindowInputDisabled
                                            }
                                            className={`h-6 w-full rounded border bg-white px-2 text-xs focus:ring-1 focus:outline-none ${
                                              duplicateTimeErrors[addTimeKey]
                                                ? "border-red-500 text-gray-700 focus:border-red-500 focus:ring-red-500"
                                                : isArrivalWindowInputDisabled
                                                  ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                                                  : "border-gray-300 text-gray-700 focus:border-gray-500 focus:ring-gray-300"
                                            }`}
                                          />
                                          {isArrivalWindowDropdownOpen &&
                                            filteredArrivalWindowOptions.length >
                                              0 && (
                                              <div className="absolute top-full left-0 z-10 mt-1 max-h-40 w-full overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg">
                                                {filteredArrivalWindowOptions.map(
                                                  (timeOption) => (
                                                    <button
                                                      key={timeOption}
                                                      type="button"
                                                      className="flex w-full cursor-pointer items-center px-2 py-1 text-left text-[11px] text-gray-700 hover:bg-gray-50"
                                                      onMouseDown={(event) => {
                                                        event.preventDefault();
                                                        updateAddTimeSelection(
                                                          day.id,
                                                          serviceGroupId,
                                                          {
                                                            arrivalWindow: {
                                                              endTime:
                                                                timeOption,
                                                            },
                                                          },
                                                        );
                                                        setOpenArrivalWindowDropdownKey(
                                                          null,
                                                        );
                                                      }}
                                                    >
                                                      {timeOption}
                                                    </button>
                                                  ),
                                                )}
                                              </div>
                                            )}
                                        </div>
                                      </div>
                                    )}
                                    {duplicateTimeErrors[addTimeKey] && (
                                      <div className="flex items-center gap-1 text-[9px] whitespace-nowrap text-red-600 sm:text-[10px]">
                                        <span>Time already exists</span>
                                      </div>
                                    )}
                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleConfirmAddTime(
                                            day.id,
                                            serviceGroupId,
                                          )
                                        }
                                        disabled={isConfirmDisabled}
                                        className={`flex h-6 w-6 items-center justify-center rounded border ${
                                          isConfirmDisabled
                                            ? "cursor-not-allowed border-gray-200 bg-gray-200 text-white opacity-70"
                                            : "cursor-pointer border-gray-500 bg-gray-500 text-white"
                                        }`}
                                      >
                                        <HiCheck className="h-3 w-3" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveAddTimeKey(null);
                                          setOpenAddTimeDropdownKey(null);
                                          setOpenArrivalWindowDropdownKey(null);
                                        }}
                                        className="flex h-6 w-6 cursor-pointer items-center justify-center rounded border border-gray-300 bg-white text-gray-500 hover:bg-gray-50"
                                      >
                                        <HiX className="h-3 w-3" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                          </div>
                        ) : (
                          <div className="flex h-full w-full">
                            <div className="items-left flex justify-start gap-2 text-[12px] font-semibold text-red-700">
                              <HiBan className="h-3.5 w-3.5" />
                              <span>No scheduling available</span>
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="border-l border-gray-200 px-2 py-2 text-center align-middle sm:px-3">
                        {isGroupOpen ? (
                          <div className="flex flex-col items-stretch gap-1.5 sm:items-center">
                            <button
                              type="button"
                              onClick={() =>
                                handleToggleAddTimeRow(day.id, serviceGroupId)
                              }
                              className="flex h-8 w-full cursor-pointer items-center justify-center gap-1.5 rounded-md bg-gray-600 px-2 text-[11px] font-medium whitespace-nowrap text-white transition-colors hover:bg-gray-700 focus:ring-2 focus:ring-gray-300 focus:outline-none sm:w-auto sm:px-3 sm:text-[12px]"
                            >
                              <HiPlus className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                              <span>Add Time</span>
                            </button>
                            <Dropdown
                              dismissOnClick={false}
                              renderTrigger={() => (
                                <button
                                  type="button"
                                  className="flex h-8 w-full min-w-[96px] cursor-pointer items-center justify-between rounded-md border border-gray-300 bg-white px-2 text-[10px] font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:border-gray-300 focus:outline-none sm:w-auto sm:px-3"
                                >
                                  <span className="text-[11px] whitespace-nowrap sm:text-[12px]">
                                    Apply To
                                  </span>
                                  <HiChevronDown className="h-3.5 w-3.5 text-gray-500 sm:h-4 sm:w-4" />
                                </button>
                              )}
                              theme={{
                                floating: {
                                  base: "z-50 w-32 rounded-lg border border-gray-200 bg-white py-1 shadow-lg",
                                  content: "py-1 text-[11px] text-gray-700",
                                },
                              }}
                            >
                              <DropdownItem
                                onClick={() =>
                                  handleToggleApplyOption(APPLY_ALL_OPTION_ID)
                                }
                                className="flex cursor-pointer items-center gap-2 px-3 py-2 text-left text-[11px] font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:bg-gray-50"
                              >
                                <span
                                  className={`flex h-4 w-4 items-center justify-center rounded border ${
                                    isApplyOptionSelected(APPLY_ALL_OPTION_ID)
                                      ? "border-gray-500 bg-gray-500 text-white"
                                      : "border-gray-300 bg-white text-transparent"
                                  }`}
                                >
                                  <HiCheck className="h-3 w-3" />
                                </span>
                                <span>All</span>
                              </DropdownItem>
                              <div className="my-1.5 border-t border-gray-100" />
                              {daySettings.map((applyDay) => {
                                const isSourceDay = applyDay.id === day.id;
                                const isSelected = isApplyOptionSelected(
                                  applyDay.id,
                                  day.id,
                                );
                                return (
                                  <DropdownItem
                                    key={applyDay.id}
                                    onClick={() => {
                                      if (!isSourceDay) {
                                        handleToggleApplyOption(applyDay.id);
                                      }
                                    }}
                                    className={`flex items-center gap-2 px-3 py-2 text-left text-[11px] transition-colors ${
                                      isSourceDay
                                        ? "cursor-not-allowed text-gray-400 opacity-60"
                                        : "cursor-pointer text-gray-700 hover:bg-gray-50 focus:bg-gray-50"
                                    }`}
                                  >
                                    <span
                                      className={`flex h-4 w-4 items-center justify-center rounded border ${
                                        isSelected
                                          ? "border-gray-500 bg-gray-500 text-white"
                                          : "border-gray-300 bg-white text-transparent"
                                      }`}
                                    >
                                      <HiCheck className="h-3 w-3" />
                                    </span>
                                    <span>{applyDay.day}</span>
                                  </DropdownItem>
                                );
                              })}
                              <div className="px-2 pt-2 pb-1.5 sm:px-3">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleApplyToDays(day.id, serviceGroupId)
                                  }
                                  disabled={isApplyDisabled}
                                  className={`flex h-7 w-full items-center justify-center rounded-md text-[10px] font-semibold transition-colors focus:ring-2 focus:ring-gray-300 focus:outline-none sm:text-[11px] ${
                                    isApplyDisabled
                                      ? "cursor-not-allowed bg-gray-200 text-white opacity-70"
                                      : "cursor-pointer bg-gray-600 text-white hover:bg-gray-700"
                                  }`}
                                >
                                  Apply
                                </button>
                              </div>
                            </Dropdown>
                          </div>
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <span className="text-[11px] font-semibold text-red-400">
                              -
                            </span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                });
              })}
            </tbody>
          </table>
        </div>
      </div>

      {onSaveChanges && (
        <div className="mt-4 flex justify-end sm:mt-5">
          <Button
            onClick={onSaveChanges}
            color="gray"
            className="w-full cursor-pointer sm:w-auto"
          >
            Save Changes
          </Button>
        </div>
      )}

      <DeleteConfirmationModal
        isOpen={deleteConfirmModal.isOpen}
        onClose={() =>
          setDeleteConfirmModal({
            isOpen: false,
            dayId: "",
            slotId: "",
            serviceGroupId: null,
            slotInfo: "",
          })
        }
        onConfirm={confirmDeleteSlot}
        title="Confirm Delete"
        itemName={deleteConfirmModal.slotInfo}
        itemType="time slot"
        message={
          deleteConfirmModal.slotInfo
            ? `Are you sure you want to delete the time slot "${deleteConfirmModal.slotInfo}"? This action cannot be undone.`
            : "Are you sure you want to delete this time slot? This action cannot be undone."
        }
      />
    </>
  );
};

export default MaximumSettings;
