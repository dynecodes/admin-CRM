import type {
  TimeSlot,
  DaySettings,
  LocationServiceGroups,
} from "../types/bookingSpots";

// Color Constants
export const SERVICE_GROUP_CARD_COLORS = [
  "#6366F1",
  "#14B8A6",
  "#F97316",
  "#0EA5E9",
  "#F59E0B",
  "#EC4899",
];

export const SERVICE_GROUP_COLORS = [
  "#2563EB",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#14B8A6",
  "#F97316",
  "#6366F1",
];

// Daily Settings
export type BaseSlot = {
  time: string;
  jobsAvailable: number;
  jobsScheduled: number;
  jobsFree: number;
  isLocked: boolean;
  editedOn?: string | null;
  isFullMax?: boolean;
};

export type BaseBookingRow = {
  date: string;
  dayName: string;
  dateValue: string;
  jobsAvailable: number;
  jobsScheduled: number;
  isClosed: boolean;
  slots: BaseSlot[];
};

export const baseBookingData: BaseBookingRow[] = [
  {
    date: "Wednesday 11/12/2025",
    dayName: "Wednesday",
    dateValue: "11/12/2025",
    jobsAvailable: 60,
    jobsScheduled: 35,
    isClosed: false,
    slots: [
      {
        time: "7:30 AM",
        jobsAvailable: 20,
        jobsScheduled: 12,
        jobsFree: 8,
        isLocked: false,
        editedOn: "11/11/2025 11:30 AM",
      },
      {
        time: "8:00 AM - 10:00 AM",
        jobsAvailable: 20,
        jobsScheduled: 12,
        jobsFree: 8,
        isLocked: false,
        editedOn: "11/11/2025 11:30 AM",
      },
      {
        time: "2:00 PM",
        jobsAvailable: 20,
        jobsScheduled: 11,
        jobsFree: 9,
        isLocked: false,
        editedOn: "11/11/2025 11:30 AM",
      },
    ],
  },
  {
    date: "Thursday 11/13/2025",
    dayName: "Thursday",
    dateValue: "11/13/2025",
    jobsAvailable: 60,
    jobsScheduled: 28,
    isClosed: false,
    slots: [
      {
        time: "7:30 AM",
        jobsAvailable: 20,
        jobsScheduled: 11,
        jobsFree: 9,
        isLocked: true,
        editedOn: "11/12/2025 4:45 PM",
      },
      {
        time: "8:00 AM - 10:00 AM",
        jobsAvailable: 20,
        jobsScheduled: 9,
        jobsFree: 11,
        isLocked: false,
        editedOn: "11/12/2025 4:45 PM",
      },
      {
        time: "2:00 PM",
        jobsAvailable: 20,
        jobsScheduled: 8,
        jobsFree: 12,
        isLocked: false,
        editedOn: "11/12/2025 4:45 PM",
      },
    ],
  },
  {
    date: "Friday 11/14/2025",
    dayName: "Friday",
    dateValue: "11/14/2025",
    jobsAvailable: 60,
    jobsScheduled: 18,
    isClosed: false,
    slots: [
      {
        time: "7:30 AM",
        jobsAvailable: 20,
        jobsScheduled: 6,
        jobsFree: 14,
        isLocked: false,
        editedOn: "11/13/2025 2:10 PM",
      },
      {
        time: "8:00 AM - 10:00 AM",
        jobsAvailable: 20,
        jobsScheduled: 6,
        jobsFree: 14,
        isLocked: false,
        editedOn: "11/13/2025 2:10 PM",
      },
      {
        time: "2:00 PM",
        jobsAvailable: 20,
        jobsScheduled: 6,
        jobsFree: 14,
        isLocked: false,
        editedOn: "11/13/2025 2:10 PM",
      },
    ],
  },
  {
    date: "Saturday 11/15/2025",
    dayName: "Saturday",
    dateValue: "11/15/2025",
    jobsAvailable: 40,
    jobsScheduled: 25,
    isClosed: false,
    slots: [
      {
        time: "7:30 AM",
        jobsAvailable: 15,
        jobsScheduled: 9,
        jobsFree: 6,
        isLocked: false,
        editedOn: "11/14/2025 10:00 AM",
      },
      {
        time: "8:00 AM - 10:00 AM",
        jobsAvailable: 15,
        jobsScheduled: 10,
        jobsFree: 5,
        isLocked: false,
        editedOn: "11/14/2025 10:00 AM",
      },
      {
        time: "2:00 PM",
        jobsAvailable: 10,
        jobsScheduled: 6,
        jobsFree: 4,
        isLocked: false,
        editedOn: "11/14/2025 10:00 AM",
      },
    ],
  },
  {
    date: "Sunday 11/16/2025",
    dayName: "Sunday",
    dateValue: "11/16/2025",
    jobsAvailable: 0,
    jobsScheduled: 0,
    isClosed: true,
    slots: [
      {
        time: "7:30 AM",
        jobsAvailable: 0,
        jobsScheduled: 0,
        jobsFree: 0,
        isLocked: false,
        editedOn: null,
      },
      {
        time: "8:00 AM - 10:00 AM",
        jobsAvailable: 0,
        jobsScheduled: 0,
        jobsFree: 0,
        isLocked: false,
        editedOn: null,
      },
      {
        time: "2:00 PM",
        jobsAvailable: 0,
        jobsScheduled: 0,
        jobsFree: 0,
        isLocked: false,
        editedOn: null,
      },
    ],
  },
  {
    date: "Monday 11/17/2025",
    dayName: "Monday",
    dateValue: "11/17/2025",
    jobsAvailable: 60,
    jobsScheduled: 32,
    isClosed: false,
    slots: [
      {
        time: "7:30 AM",
        jobsAvailable: 20,
        jobsScheduled: 12,
        jobsFree: 8,
        isLocked: false,
        editedOn: "11/16/2025 8:30 AM",
      },
      {
        time: "8:00 AM - 10:00 AM",
        jobsAvailable: 20,
        jobsScheduled: 11,
        jobsFree: 9,
        isLocked: false,
        editedOn: "11/16/2025 8:30 AM",
      },
      {
        time: "2:00 PM",
        jobsAvailable: 20,
        jobsScheduled: 9,
        jobsFree: 11,
        isLocked: false,
        editedOn: "11/16/2025 8:30 AM",
      },
    ],
  },
  {
    date: "Tuesday 11/18/2025",
    dayName: "Tuesday",
    dateValue: "11/18/2025",
    jobsAvailable: 60,
    jobsScheduled: 41,
    isClosed: false,
    slots: [
      {
        time: "7:30 AM",
        jobsAvailable: 20,
        jobsScheduled: 14,
        jobsFree: 6,
        isLocked: false,
        editedOn: "11/17/2025 9:15 AM",
      },
      {
        time: "8:00 AM - 10:00 AM",
        jobsAvailable: 20,
        jobsScheduled: 14,
        jobsFree: 6,
        isLocked: true,
        editedOn: "11/17/2025 9:15 AM",
      },
      {
        time: "2:00 PM",
        jobsAvailable: 20,
        jobsScheduled: 13,
        jobsFree: 7,
        isLocked: false,
        editedOn: "11/17/2025 9:15 AM",
      },
    ],
  },
];

// Maximum Settings
export const createAtlantaDaySlots = (): TimeSlot[] => [
  {
    id: "atl-slot-1",
    startTime: "7:30 AM",
    endTime: "7:30 AM",
    jobsMax: 3,
    type: "specific-time",
  },
  {
    id: "atl-slot-2",
    startTime: "8:00 AM",
    endTime: "10:00 AM",
    jobsMax: 3,
    type: "arrival-window",
  },
  {
    id: "atl-slot-3",
    startTime: "2:00 PM",
    endTime: "2:00 PM",
    jobsMax: 0,
    type: "specific-time",
  },
];

export const createLosAngelesDaySlots = (): TimeSlot[] => [
  {
    id: "la-slot-1",
    startTime: "9:00 AM",
    endTime: "9:00 AM",
    jobsMax: 2,
    type: "specific-time",
  },
  {
    id: "la-slot-2",
    startTime: "11:00 AM",
    endTime: "1:00 PM",
    jobsMax: 3,
    type: "arrival-window",
  },
  {
    id: "la-slot-3",
    startTime: "4:00 PM",
    endTime: "4:00 PM",
    jobsMax: 1,
    type: "specific-time",
  },
];

export const createNewYorkDaySlots = (): TimeSlot[] => [
  {
    id: "ny-slot-1",
    startTime: "6:30 AM",
    endTime: "6:30 AM",
    jobsMax: 4,
    type: "specific-time",
  },
  {
    id: "ny-slot-2",
    startTime: "8:30 AM",
    endTime: "10:30 AM",
    jobsMax: 3,
    type: "arrival-window",
  },
  {
    id: "ny-slot-3",
    startTime: "1:30 PM",
    endTime: "3:30 PM",
    jobsMax: 2,
    type: "arrival-window",
  },
];

const buildBaseSettings = (
  slotFactory: () => TimeSlot[],
  overrides: Partial<
    Record<string, { isOpen: boolean; slots?: TimeSlot[] }>
  > = {},
): DaySettings[] => {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  return days.map((day, index) => {
    const override = overrides[day];
    const isOpen = override?.isOpen ?? day !== "Sunday";
    const baseSlots = override?.slots ?? slotFactory();
    const slots = isOpen ? baseSlots : [];

    const uniqueSlots = slots.map((slot, idx) => ({
      ...slot,
      id: `${slot.id}-${day.toLowerCase()}-${idx}`,
    }));

    return {
      id: `${index + 1}`,
      day,
      isOpen,
      timeSlots: isOpen ? uniqueSlots : [],
      serviceGroupSlots: {},
    };
  });
};

export const baseMaximumSettings = buildBaseSettings(createAtlantaDaySlots);

export const baseMaximumSettingsByLocation: Record<string, DaySettings[]> = {
  atlanta: baseMaximumSettings,
  "los-angeles": buildBaseSettings(createLosAngelesDaySlots, {
    Sunday: { isOpen: false, slots: [] },
    Saturday: { isOpen: true, slots: createLosAngelesDaySlots() },
  }),
  "new-york": buildBaseSettings(createNewYorkDaySlots, {
    Sunday: { isOpen: false, slots: [] },
    Saturday: {
      isOpen: true,
      slots: [
        {
          id: "ny-slot-weekend-1",
          startTime: "7:00 AM",
          endTime: "9:00 AM",
          jobsMax: 2,
          type: "arrival-window",
        },
        {
          id: "ny-slot-weekend-2",
          startTime: "12:00 PM",
          endTime: "12:00 PM",
          jobsMax: 1,
          type: "specific-time",
        },
      ],
    },
  }),
};

// Location Service Groups
export const LOCATION_SERVICE_GROUPS: LocationServiceGroups = {
  "los-angeles": [
    {
      id: "studio",
      label: "Studio",
      services: [
        { id: "studio-1-bed", label: "1 bed" },
        { id: "studio-2-bed", label: "2 bed" },
        { id: "studio-3-bed", label: "3 bed" },
      ],
    },
    {
      id: "apartment-house",
      label: "Apartment House",
      services: [
        { id: "apartment-house-1-bed", label: "1 bed" },
        { id: "apartment-house-2-bed", label: "2 bed" },
        { id: "apartment-house-3-bed", label: "3 bed" },
      ],
    },
  ],
  "new-york": [
    {
      id: "loft",
      label: "Loft",
      services: [
        { id: "loft-standard", label: "Standard" },
        { id: "loft-deluxe", label: "Deluxe" },
        { id: "loft-premium", label: "Premium" },
      ],
    },
    {
      id: "brownstone",
      label: "Brownstone",
      services: [
        { id: "brownstone-garden", label: "Garden Level" },
        { id: "brownstone-duplex", label: "Duplex" },
        { id: "brownstone-triplex", label: "Triplex" },
      ],
    },
  ],
  atlanta: [
    {
      id: "commercial",
      label: "Commercial",
      services: [
        { id: "commercial-suite", label: "Suite" },
        { id: "commercial-floor", label: "Full Floor" },
        { id: "commercial-building", label: "Whole Building" },
      ],
    },
    {
      id: "townhouse",
      label: "Townhouse",
      services: [
        { id: "townhouse-standard", label: "Standard" },
        { id: "townhouse-deluxe", label: "Deluxe" },
        { id: "townhouse-premium", label: "Premium" },
      ],
    },
  ],
};