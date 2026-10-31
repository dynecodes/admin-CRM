// src/App/Recurrences/index.tsx
import React, { useMemo, useRef, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button, Checkbox, Dropdown } from "flowbite-react";
import AppDataTable from "../../components/ui/AppDataTable";
import { useTags } from "../../hooks/useTags";
import { TagColor } from "../../types/tag";
import { useLocations } from "../../hooks/Locations/useLocations";
import { useFrequencies } from "../../hooks/useFrequencies";
import {
  useRecurringCustomers,
  RecurringCustomer,
} from "../../hooks/Recurrences/useRecurringCustomers";

/* ================================================================== */
/* Helpers                                                            */
/* ================================================================== */

const formatNextJobDate = (value?: string | null): string => {
  if (!value) return "—";

  const d = new Date(value);
  if (isNaN(d.getTime())) {
    // fallback – if it's not a valid date, just show raw
    return value;
  }

  const weekday = d.toLocaleDateString("en-US", { weekday: "short" }); // Mon
  const fullMonth = d.toLocaleDateString("en-US", { month: "long" });  // March, December, June
  // If month name is 5+ chars, cut to 3; if 4 or less, keep as-is
  const month =
    fullMonth.length > 4 ? fullMonth.slice(0, 3) : fullMonth;

  const day = d.getDate(); // 10
  const year = d.getFullYear(); // 2025

  return `${weekday} - ${month} ${day}, ${year}`;
};


const isConfirmed = (val: unknown): boolean => {
  if (val == null) return false;
  if (typeof val === "boolean") return val;
  if (typeof val === "number") return val === 1;
  if (typeof val === "string") {
    const s = val.trim().toLowerCase();
    return s === "✓" || s === "yes" || s === "true" || s === "confirmed";
  }
  return false;
};

const formatShortDate = (value?: string | null): string => {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";

  return d.toLocaleDateString("en-US", {
    month: "short", // Nov
    day: "numeric", // 24
    year: "numeric", // 2025
  });
};

const getWeekdayLong = (value?: string | null): string => {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { weekday: "long" }); // Monday
};

const formatTimeFromHHMMSS = (time?: string | null): string => {
  if (!time) return "";
  const [h, m] = time.split(":");
  const d = new Date();
  d.setHours(Number(h || 0), Number(m || 0), 0, 0);
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }); // 10:10 AM
};

type TagChip = { name: string; color: TagColor };

const TAG_COLORS: Record<
  TagColor,
  { primary: string; bg: string; label: string; textColor?: string }
> = {
  blue: { primary: "#1976f2", bg: "#e3f2fd", label: "Blue" },
  yellow: {
    primary: "#f5f117",
    bg: "#ffffe0",
    label: "Yellow",
    textColor: "#1a1a1a",
  },
  orange: { primary: "#ff9800", bg: "#fff3e0", label: "Orange" },
  purple: { primary: "#9c27b0", bg: "#f3e5f5", label: "Purple" },
};

const CHIP_BASE_CLASS =
  "inline-flex items-center rounded-sm font-medium text-[11px] leading-tight px-3 py-1";
const CHIP_MORE_CLASS =
  "inline-flex items-center py-1 text-[10px] font-medium text-gray-600";

/* =============================================================== */
/* Search text builder – uses backend customer.tags                */
/* =============================================================== */

function buildSearchText(
  customer: RecurringCustomer["customer"],
  locationNamesText: string | null
): string {
  const parts: string[] = [];
  const push = (v: any) => {
    if (v == null) return;
    const s = String(v).trim();
    if (s) parts.push(s);
  };

  push(customer.firstName);
  push(customer.lastName);
  push((customer as any).companyName);
  push(customer.email);
  push(customer.phone);

  push(locationNamesText);

  push(customer.status);
  push(isConfirmed(customer.confirmed) ? "confirmed" : "unconfirmed");
  push(customer.blocked ? "blocked" : "not blocked");

  const rawTags = (customer as any).tags ?? [];

  const tagNames: string[] = [];
  const pushTag = (v: any) => {
    if (!v) return;
    if (typeof v === "string") {
      v
        .split(/[;,]/)
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((s) => tagNames.push(s));
    } else if (typeof v === "number") {
      tagNames.push(String(v));
    } else if (typeof v === "object") {
      const name =
        (v as any).tag_name ?? (v as any).name ?? (v as any).label ?? "";
      if (name && String(name).trim()) tagNames.push(String(name).trim());
    }
  };

  if (Array.isArray(rawTags)) {
    rawTags.forEach(pushTag);
  } else {
    pushTag(rawTags);
  }

  const seen = new Set<string>();
  tagNames.forEach((t) => {
    const lc = t.toLowerCase();
    if (!seen.has(lc)) {
      seen.add(lc);
      parts.push(t);
    }
  });

  return parts.join(" ").toLowerCase();
}

/* ================================================================== */
/* Inline Tags – now just uses customer.tags from backend            */
/* ================================================================== */

function InlineTags({
  customer,
  catalog,
  loadingTags,
  max = 4,
}: {
  customer: RecurringCustomer["customer"] | any;
  catalog: ReturnType<typeof useTags>["tags"];
  loadingTags: boolean;
  max?: number;
}) {
  const colorByNameLc = React.useMemo(() => {
    const m = new Map<string, TagColor>();
    (catalog ?? []).forEach((t) => {
      const name = String(t.tag_name ?? "").trim();
      if (!name) return;
      m.set(name.toLowerCase(), (t.tag_color || "blue") as TagColor);
    });
    return m;
  }, [catalog]);

  const chips: TagChip[] = React.useMemo(() => {
    const raw = (customer as any).tags ?? [];
    const out: TagChip[] = [];

    const pushFromName = (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      const lc = trimmed.toLowerCase();

      const resolved = colorByNameLc.get(lc) ?? "blue";
      const safe: TagColor = (
        ["blue", "yellow", "orange", "purple"] as const
      ).includes(resolved as TagColor)
        ? (resolved as TagColor)
        : "blue";

      out.push({ name: trimmed, color: safe });
    };

    if (Array.isArray(raw)) {
      raw.forEach((v) => {
        if (typeof v === "string") {
          if (v.includes(",") || v.includes(";")) {
            v.split(/[;,]/)
              .map((s) => s.trim())
              .filter(Boolean)
              .forEach(pushFromName);
          } else {
            pushFromName(v);
          }
        } else if (typeof v === "number") {
          const hit = (catalog ?? []).find((t) => Number(t.id) === v);
          if (hit) pushFromName(hit.tag_name);
        } else if (v && typeof v === "object") {
          const name =
            (v as any).tag_name ?? (v as any).name ?? (v as any).label ?? "";
          if (!name) return;

          const rawColor =
            ((v as any).tag_color as TagColor | undefined) ??
            colorByNameLc.get(String(name).toLowerCase()) ??
            "blue";

          const safe: TagColor = (
            ["blue", "yellow", "orange", "purple"] as const
          ).includes(rawColor as TagColor)
            ? (rawColor as TagColor)
            : "blue";

          out.push({ name: String(name).trim(), color: safe });
        }
      });
    } else if (typeof raw === "string") {
      raw
        .split(/[;,]/)
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach(pushFromName);
    }

    const seen = new Set<string>();
    return out.filter((chip) => {
      const k = chip.name.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }, [customer, catalog, colorByNameLc]);

  if (loadingTags) {
    return (
      <div className="mt-1 flex flex-wrap gap-1">
        <span className="h-5 w-12 animate-pulse rounded-sm bg-gray-200" />
        <span className="h-5 w-12 animate-pulse rounded-sm bg-gray-200" />
      </div>
    );
  }

  if (chips.length === 0) return null;

  const shown = chips.slice(0, max);
  const remaining = chips.length - shown.length;

  return (
    <>
      {shown.map((chip, i) => {
        const colorConfig = TAG_COLORS[chip.color];
        return (
          <span
            key={`${chip.name}-${i}`}
            className="inline-flex items-center rounded-sm font-medium text-[11px] px-3 py-1"
            style={{
              backgroundColor: colorConfig.primary,
              color:
                chip.color === "yellow"
                  ? colorConfig.textColor || "#1a1a1a"
                  : "white",
            }}
            title={chip.name}
          >
            {chip.name}
          </span>
        );
      })}

      {remaining > 0 && (
        <span className="inline-flex items-center rounded-sm bg-gray-200 text-gray-700 font-medium text-[11px] px-3 py-1">
          +{remaining} more
        </span>
      )}
    </>
  );
}

/* ================================================================== */
/* Page Component                                                     */
/* ================================================================== */

type RecurrenceRowUI = RecurringCustomer & {
  locationIds: number[];
  locationNames: string[];
  recurrenceIds: number[];
  recurrenceNames: string[];
  statusForFilter: string;
  searchText: string;
  bookingId: number | null;

  repeatsText: string;
  timeslotText: string;
  startDateText: string;
  nextJobText: string;
};

const Recurrences: React.FC = () => {
  const navigate = useNavigate();
  const routerLocation = useLocation();

  const { locations } = useLocations();
  const { frequencies } = useFrequencies();
  const { tags: tagCatalog, loading: tagsLoading } = useTags();
const isCancelledView = routerLocation.pathname.includes(
  "/recurrences/cancelled"
);
const defaultStatusParam = isCancelledView ? "cancelled" : "active";
const { recurringCustomers } = useRecurringCustomers(defaultStatusParam);

  const pathPrefix = window.location.pathname.split("/")[1];

  const handleNew = () => navigate(`/${pathPrefix}/bookings/new`);

  const handleOpenCustomer = (row: RecurrenceRowUI) => {
    const customerId =
      (row.customer as any)?.id ??
      (row as any).customerId ??
      (row as any).customer_id;
    if (!customerId) return;
    navigate(`/${pathPrefix}/customers/edit/${customerId}`);
  };

  const isArchivedRow = (row: RecurrenceRowUI | any) => {
    const status = String(row.status ?? "").toLowerCase();
    return status === "cancelled";
  };

  /* =============================================================== */
  /* Location Filter (multi-select)                                  */
  /* =============================================================== */

  const [selectedLocationIds, setSelectedLocationIds] = useState<number[]>([]);

  const locationFilterOptions = useMemo(() => {
    if (!locations || locations.length === 0) {
      return [
        {
          id: null as number | null,
          name: "All Locations",
          isDefault: false,
        },
      ];
    }

    const defaultLoc = locations.find((l) => l.is_default);
    const others = locations
      .filter((l) => !l.is_default)
      .sort((a, b) => a.name.localeCompare(b.name));

    return [
      { id: null as number | null, name: "All Locations", isDefault: false },
      ...(defaultLoc
        ? [
            {
              id: Number(defaultLoc.id),
              name: defaultLoc.name,
              isDefault: true,
            },
          ]
        : []),
      ...others.map((l) => ({
        id: Number(l.id),
        name: l.name,
        isDefault: false,
      })),
    ];
  }, [locations]);

  const locationLabel = useMemo(() => {
    if (!locations || locations.length === 0) return "All Locations";
    if (selectedLocationIds.length === 0) return "All Locations";
    if (selectedLocationIds.length === 1) {
      const loc = locations.find(
        (l) => Number(l.id) === selectedLocationIds[0]
      );
      return loc ? loc.name : "1 location";
    }
    return `${selectedLocationIds.length} locations`;
  }, [locations, selectedLocationIds]);

  const toggleLocationSelection = (id: number | null) => {
    if (id === null) {
      setSelectedLocationIds([]);
      return;
    }

    const numericId = Number(id);
    setSelectedLocationIds((prev) => {
      if (prev.includes(numericId)) {
        return prev.filter((x) => x !== numericId);
      }
      return [...prev, numericId];
    });
  };

  /* =============================================================== */
  /* Blocked Filter                                                  */
  /* =============================================================== */

const [blockedFilter, setBlockedFilter] = useState<
  "all" | "blocked" | "not_blocked"
>("all");


  const blockedFilterOptions = [
    { id: 0, name: "All" },
    { id: 1, name: "Not Blocked" },
    { id: 2, name: "Blocked Only" },
  ];

  const blockedFilterId =
    blockedFilter === "all"
      ? 0
      : blockedFilter === "not_blocked"
      ? 1
      : 2;

  const blockedLabel = useMemo(() => {
    if (blockedFilter === "all") return "All";
    if (blockedFilter === "blocked") return "Blocked Only";
    return "Not Blocked";
  }, [blockedFilter]);

  /* =============================================================== */
  /* Recurrences Filter (multi-select)                               */
  /* =============================================================== */

  const [selectedRecurrenceIds, setSelectedRecurrenceIds] = useState<number[]>(
    []
  );

  const recurrenceFilterOptions = useMemo(() => {
    if (!frequencies || frequencies.length === 0) {
      return [{ id: null as number | null, name: "All Recurrences" }];
    }

    return [
      { id: null as number | null, name: "All Recurrences" },
      ...frequencies.map((f: any) => ({
        id: Number(f.id),
        name: f.name ?? "Unnamed",
      })),
    ];
  }, [frequencies]);

  const recurrenceLabel = useMemo(() => {
    if (!frequencies || frequencies.length === 0) return "All Recurrences";
    if (selectedRecurrenceIds.length === 0) return "All Recurrences";
    if (selectedRecurrenceIds.length === 1) {
      const f = frequencies.find(
        (fr: any) => Number(fr.id) === selectedRecurrenceIds[0]
      );
      return f ? f.name ?? "1 recurrence" : "1 recurrence";
    }
    return `${selectedRecurrenceIds.length} recurrences`;
  }, [frequencies, selectedRecurrenceIds]);

  const toggleRecurrenceSelection = (id: number | null) => {
    if (id === null) {
      setSelectedRecurrenceIds([]);
      return;
    }
    const numericId = Number(id);
    setSelectedRecurrenceIds((prev) => {
      if (prev.includes(numericId)) {
        return prev.filter((x) => x !== numericId);
      }
      return [...prev, numericId];
    });
  };

  /* =============================================================== */
  /* Selection State (checkboxes)                                    */
  /* =============================================================== */

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const headerCheckboxRef = useRef<HTMLInputElement>(null);

  const allChecked =
    recurringCustomers.length > 0 &&
    selectedIds.size === recurringCustomers.length;
  const someChecked =
    selectedIds.size > 0 && selectedIds.size < recurringCustomers.length;

  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = someChecked;
    }
  }, [someChecked]);

  const toggleSelectAll = () => {
    if (allChecked) setSelectedIds(new Set());
    else setSelectedIds(new Set(recurringCustomers.map((r) => r.id)));
  };

  const toggleRow = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  /* =============================================================== */
  /* Table Rows with Filters + searchText                            */
  /* =============================================================== */

  const tableRows: RecurrenceRowUI[] = useMemo(() => {
    return recurringCustomers.map((rec) => {
      const customerForUI = rec.customer;

      const locIds: number[] =
        rec.schedule.locationId != null
          ? [Number(rec.schedule.locationId)]
          : [];

      const allLocationNames =
        locations && locIds.length
          ? locIds
              .map((id) => {
                const hit = locations.find((l) => Number(l.id) === id);
                return hit ? hit.name : null;
              })
              .filter((n): n is string => !!n)
          : [];

      const locationNamesText =
        allLocationNames.length > 0 ? allLocationNames.join(" ") : null;

      const recurrenceIds = rec.frequency?.id ? [Number(rec.frequency.id)] : [];
      const recurrenceNames = rec.frequency?.name ? [rec.frequency.name] : [];

            const startDateText = formatShortDate(rec.schedule.startDate);
      const nextJobText = formatShortDate(rec.schedule.nextDate);
      const timeslotText = formatTimeFromHHMMSS(rec.schedule.time);

      const weekday = getWeekdayLong(rec.schedule.startDate);
      const freqName = rec.frequency?.name ?? "";
      const repeatsText =
        freqName && weekday
          ? `${freqName} on ${weekday}`
          : freqName || weekday || "";

      // 🔹 For Filter by:
      // - "archived" → any cancelled/archived recurrence
      // - "next_job" → active recurrences with a next job date
      // - "active"   → active recurrences with NO next job date
      const rawStatus = String(rec.status ?? "").toLowerCase();
      const hasNextJob = !!rec.schedule.nextDate;

      let statusForFilter: string;
      if (rawStatus === "cancelled" || rawStatus === "archived") {
        statusForFilter = "archived";
      } else if (hasNextJob) {
        statusForFilter = "next_job";
      } else {
        statusForFilter = "active";
      }

      return {
        ...rec,
        customer: customerForUI,
        locationIds: locIds,
        locationNames: allLocationNames,
        recurrenceIds,
        recurrenceNames,
        statusForFilter,
        searchText: buildSearchText(customerForUI, locationNamesText),
        bookingId: rec.meta?.baseBookingId ?? null,
        repeatsText,
        timeslotText,
        startDateText,
        nextJobText,
      };
    });
  }, [recurringCustomers, locations]);

  const filteredRows: RecurrenceRowUI[] = useMemo(() => {
    let rows = [...tableRows];

    if (blockedFilter === "blocked") {
      rows = rows.filter((r) => !!r.customer.blocked);
    } else if (blockedFilter === "not_blocked") {
      rows = rows.filter((r) => !r.customer.blocked);
    }

    if (selectedLocationIds.length > 0) {
      rows = rows.filter((r) => {
        const ids: number[] = Array.isArray(r.locationIds)
          ? r.locationIds
          : [];
        if (!ids.length) return false;
        return ids.some((id) => selectedLocationIds.includes(id));
      });
    }

    if (selectedRecurrenceIds.length > 0) {
      rows = rows.filter((r) => {
        const ids: number[] = Array.isArray(r.recurrenceIds)
          ? r.recurrenceIds
          : [];
        if (!ids.length) return false;
        return ids.some((id) => selectedRecurrenceIds.includes(id));
      });
    }

    // 🔽 Sort by newest recurrence (latest startDate / nextDate first)
    rows.sort((a, b) => {
      const aDateStr = a.schedule.startDate || a.schedule.nextDate || "";
      const bDateStr = b.schedule.startDate || b.schedule.nextDate || "";

      const aTime = new Date(aDateStr).getTime();
      const bTime = new Date(bDateStr).getTime();

      // handle invalid dates by treating them as very old
      const safeA = Number.isNaN(aTime) ? 0 : aTime;
      const safeB = Number.isNaN(bTime) ? 0 : bTime;

      // newest first
      return safeB - safeA;
    });

    return rows;
  }, [
    tableRows,
    blockedFilter,
    selectedLocationIds,
    selectedRecurrenceIds,
  ]);


  /* =============================================================== */
  /* Columns                                                         */
  /* =============================================================== */

  const columns = useMemo(
    () => [
      {
        name: (
          <Checkbox
            ref={headerCheckboxRef}
            checked={allChecked}
            onChange={(e) => {
              e.stopPropagation();
              toggleSelectAll();
            }}
            className="cursor-pointer"
          />
        ),
        width: "56px",
        ignoreRowClick: true,
        cell: (row: RecurrenceRowUI) => (
          <Checkbox
            checked={selectedIds.has(row.id)}
            onClick={(e) => e.stopPropagation()}
            onChange={() => toggleRow(row.id)}
            className="cursor-pointer"
          />
        ),
      },
      {
        name: "Name",
        selector: (row: RecurrenceRowUI) =>
          `${row.customer.firstName} ${row.customer.lastName}`.trim(),
        sortable: true,
        width: "290px",
        cell: (row: RecurrenceRowUI) => {
          const archived = isArchivedRow(row);

          return (
            <div className="flex items-center">
              <button
                type="button"
                className="text-left cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenCustomer(row);
                }}
              >
                <div className="text-sm font-semibold text-gray-900">
                  {row.customer.firstName} {row.customer.lastName}
                </div>

                <div className="mt-1 flex flex-wrap gap-1">
                  {row.customer.blocked && (
                    <span className="inline-flex items-center rounded-sm bg-[#ff0000] font-medium text-[11px] px-3 py-1 text-white">
                      Blocked
                    </span>
                  )}

                  {archived && (
                    <span className="inline-flex items-center rounded-sm bg-[#ff6666] font-medium text-[11px] px-3 py-1 text-white">
                      Cancelled
                    </span>
                  )}

                  <InlineTags
                    customer={row.customer}
                    catalog={tagCatalog}
                    loadingTags={tagsLoading}
                  />
                </div>
              </button>
            </div>
          );
        },
      },
      {
        name: "Location",
        selector: (row: RecurrenceRowUI) =>
          Array.isArray(row.locationNames) && row.locationNames.length
            ? row.locationNames.join(", ")
            : "",
        sortable: true,
        width: "160px",
        cell: (row: RecurrenceRowUI) => {
          const names: string[] =
            Array.isArray(row.locationNames) && row.locationNames.length
              ? row.locationNames
              : [];

          return (
            <button
              type="button"
              className="text-left cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenCustomer(row);
              }}
            >
              {names.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {names.map((name, idx) => (
                    <span
                      key={`${name}-${idx}`}
                      className={CHIP_BASE_CLASS}
                      style={{
                        backgroundColor: "#bad5fb",
                        color: "#000",
                      }}
                    >
                      {name}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-gray-400 text-sm"></span>
              )}
            </button>
          );
        },
      },
      {
        name: "Recurrences",
        selector: (row: RecurrenceRowUI) =>
          Array.isArray(row.recurrenceNames) && row.recurrenceNames.length
            ? row.recurrenceNames.join(", ")
            : "",
        sortable: false,
        width: "220px",
        cell: (row: RecurrenceRowUI) => {
          const names: string[] =
            Array.isArray(row.recurrenceNames) && row.recurrenceNames.length
              ? row.recurrenceNames
              : ["Weekly"];

          return (
            <div className="flex flex-wrap gap-1">
              {names.map((name, idx) => (
                <span
                  key={`${name}-${idx}`}
                  className="inline-flex items-center rounded-sm bg-blue-100 px-3 py-1 text-[11px] font-medium text-gray-900"
                >
                  {name}
                </span>
              ))}
            </div>
          );
        },
      },
      {
        name: "Next Job",
        selector: (row: RecurrenceRowUI) => row.schedule.nextDate ?? "",
        sortable: true,
        width: "240px",
        cell: (row: RecurrenceRowUI) => {
          const formatted = formatNextJobDate(row.schedule.nextDate);

          return (
            <button
              type="button"
              className="text-left w-full text-sm cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenCustomer(row);
              }}
            >
              {formatted}
            </button>
          );
        },
      },
    ],
    [
      allChecked,
      selectedIds,
      toggleSelectAll,
      toggleRow,
      handleOpenCustomer,
      tagCatalog,
      tagsLoading,
    ]
  );

  /* =============================================================== */
  /* Final Page Render                                               */
  /* =============================================================== */

 const filterOptions = isCancelledView
  ? [
      { value: "all", label: "All" },
      { value: "archived", label: "Archived" },
      { value: "next_job", label: "Next Job" },
    ]
  : [
      { value: "all", label: "All" },
      { value: "next_job", label: "Next Job" },
      { value: "active", label: "Active" },
      { value: "archived", label: "Archived" },
    ];

// UI default (what shows in the "Filter by" dropdown initially)
const defaultStatusFilterUI = isCancelledView ? "archived" : "all";

  return (
    <div className="px-4 pb-5 sm:px-5">
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <div className="relative inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-black">
            <svg className="h-6 w-6" fill="white" viewBox="0 0 24 24">
              <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm-7 9a7 7 0 1 1 14 0H5Z" />
            </svg>
          </div>

          <div className="font-medium">
            <span className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Recurrences ({recurringCustomers.length})
            </span>
            <div className="text-sm text-gray-500">
              Manage Customer Recurrences
            </div>
          </div>
        </div>

        <Button
          color="gray"
          onClick={handleNew}
          className="w-full cursor-pointer sm:w-auto"
        >
          Add New Recurrences
        </Button>
      </div>

      <AppDataTable
        data={filteredRows}
        columns={columns}
        searchPlaceholder="Search recurrences"
        searchKeys={["searchText"]}
       filterOptions={filterOptions}
filterKey="statusForFilter"
filterLabel="Filter by"
defaultFilter={defaultStatusFilterUI}

        onRowClick={handleOpenCustomer}
        paginationOptions={[10, 20, 50, 100]}
        defaultPerPage={20}
        showAdditionalFilter={false}
        customFilters={
          <div className="flex sm:flex-row flex-col gap-4">
            {/* Recurrence dropdown */}
            <div className="flex min-w-[180px] items-center gap-2">
              <div className="flex items-center text-sm text-gray-500 whitespace-nowrap">
                
                Recurrence:
              </div>

              <Dropdown
                label={recurrenceLabel}
                dismissOnClick={false}
                size="sm"
                placement="bottom"
                theme={{
                  floating: {
                    target:
                      "min-w-[200px] whitespace-nowrap justify-between bg-white text-gray-800 border border-gray-300 focus:ring-2 focus:ring-blue-400 hover:bg-gray-200 hover:text-gray-900 cursor-pointer",
                    base: "z-50 rounded-md shadow-md",
                    content:
                      "bg-white rounded-md shadow-md border border-gray-200",
                  },
                }}
              >
                <div className="max-h-64 overflow-y-auto py-1 cursor-pointer">
                  {recurrenceFilterOptions.map((opt) => {
                    const isAll = opt.id === null;
                    const isSelected = isAll
                      ? selectedRecurrenceIds.length === 0
                      : selectedRecurrenceIds.includes(Number(opt.id));

                    return (
                      <button
                        key={String(opt.id)}
                        className={
                          "flex w-full cursor-pointer items-center justify-between px-4 py-2 text-sm " +
                          (isSelected ? "" : "hover:bg-gray-100")
                        }
                        onClick={() => toggleRecurrenceSelection(opt.id)}
                      >
                        <span>{opt.name}</span>
                        {isSelected && (
                          <svg
                            className="h-4 w-4 text-green-600"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <path
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 11.917 9.724 16.5 19 7.5"
                            />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              </Dropdown>
            </div>

            {/* Blocked dropdown */}
            <div className="flex min-w-[160px] items-center gap-2">
              <div className="flex items-center text-sm text-gray-500 whitespace-nowrap">
                Blocked:
              </div>

              <Dropdown
                label={blockedLabel}
                dismissOnClick={true}
                size="sm"
                placement="bottom"
                theme={{
                  floating: {
                    target:
                      "min-w-[140px] whitespace-nowrap justify-between bg-white text-gray-800 border border-gray-300 focus:ring-2 focus:ring-blue-400 hover:bg-gray-200 hover:text-gray-900 cursor-pointer",
                    base: "z-50 rounded-md shadow-md",
                    content:
                      "bg-white rounded-md shadow-md border border-gray-200",
                  },
                }}
              >
                <div className="max-h-64 overflow-y-auto py-1 cursor-pointer">
                  {blockedFilterOptions.map((opt) => {
                    const isSelected = opt.id === blockedFilterId;

                    return (
                      <button
                        key={opt.id}
                        className={
                          "flex w-full cursor-pointer items-center justify-between px-4 py-2 text-sm " +
                          (isSelected ? "" : "hover:bg-gray-100")
                        }
                        onClick={() => {
                          if (opt.id === 0) setBlockedFilter("all");
                          else if (opt.id === 1) setBlockedFilter("not_blocked");
                          else if (opt.id === 2) setBlockedFilter("blocked");
                        }}
                      >
                        <span>{opt.name}</span>
                        {isSelected && (
                          <svg
                            className="h-4 w-4 text-green-600"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <path
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 11.917 9.724 16.5 19 7.5"
                            />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              </Dropdown>
            </div>

            {/* Location dropdown */}
            <div className="flex min-w-[200px] items-center gap-2">
              <div className="flex items-center text-sm text-gray-500 whitespace-nowrap">
                Location:
              </div>

              <Dropdown
                label={locationLabel}
                dismissOnClick={false}
                size="sm"
                placement="bottom"
                theme={{
                  floating: {
                    target:
                      "min-w-[150px] whitespace-nowrap justify-between bg-white text-gray-800 border border-gray-300 focus:ring-2 focus:ring-blue-400 hover:bg-gray-200 hover:text-gray-900 cursor-pointer",
                    base: "z-50 rounded-md shadow-md",
                    content:
                      "bg-white rounded-md shadow-md border border-gray-200",
                  },
                }}
              >
                <div className="max-h-64 overflow-y-auto py-1 cursor-pointer">
                  {locationFilterOptions.map((opt) => {
                    const isAll = opt.id === null;
                    const isSelected = isAll
                      ? selectedLocationIds.length === 0
                      : selectedLocationIds.includes(Number(opt.id));

                    return (
                      <button
                        key={String(opt.id)}
                        className={
                          "flex w-full cursor-pointer items-center justify-between px-4 py-2 text-sm " +
                          (isSelected ? "" : "hover:bg-gray-100")
                        }
                        onClick={() => toggleLocationSelection(opt.id)}
                      >
                        <span className="flex items-center gap-1">
                          <span>{opt.name}</span>
                          {opt.isDefault && !isAll && (
                            <span className={CHIP_MORE_CLASS}>[ Default ]</span>
                          )}
                        </span>

                        {isSelected && (
                          <svg
                            className="h-4 w-4 text-green-600"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <path
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 11.917 9.724 16.5 19 7.5"
                            />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              </Dropdown>
            </div>
          </div>
        }
        mobileCard={{
          titleField: "searchText",
          titleRender: (item: RecurrenceRowUI) => (
            <span className="font-semibold text-gray-900">
              {item.customer.firstName} {item.customer.lastName}
            </span>
          ),
          subtitleRender: (item: RecurrenceRowUI) => {
            const names: string[] =
              Array.isArray(item.locationNames) && item.locationNames.length
                ? item.locationNames
                : [];

            if (names.length === 0) {
              return (
                <span className="text-[11px] text-gray-400">No location</span>
              );
            }

            return (
              <div className="flex flex-wrap gap-1">
                {names.map((name, idx) => (
                  <span
                    key={`${name}-${idx}`}
                    className={CHIP_BASE_CLASS}
                    style={{ backgroundColor: "#a3c8f9", color: "#000" }}
                  >
                    {name}
                  </span>
                ))}
              </div>
            );
          },
          statusField: "status",
          enableEdit: true,
          fields: [
            {
              key: "email",
              label: "Email",
              type: "text",
              render: (_value: any, item: RecurrenceRowUI) => (
                <span className="text-xs break-all">
                  {item.customer.email}
                </span>
              ),
            },
            {
              key: "phone",
              label: "Phone",
              type: "text",
              render: (_value: any, item: RecurrenceRowUI) => (
                <span className="text-xs font-medium">
                  {item.customer.phone}
                </span>
              ),
            },
            {
              key: "tags",
              label: "Tags",
              type: "badges",
              render: (_value: any, item: RecurrenceRowUI) => {
                const archived = isArchivedRow(item);
                return (
                  <div className="flex flex-wrap gap-1">
                    {item.customer.blocked && (
                      <span
                        className={CHIP_BASE_CLASS}
                        style={{ backgroundColor: "#b91c1c", color: "#fff" }}
                      >
                        Blocked
                      </span>
                    )}
                    {archived && (
                      <span
                        className={CHIP_BASE_CLASS}
                        style={{ backgroundColor: "#374151", color: "#fff" }}
                      >
                        Cancelled
                      </span>
                    )}

                    <InlineTags
                      customer={item.customer}
                      catalog={tagCatalog}
                      loadingTags={tagsLoading}
                    />
                  </div>
                );
              },
            },
          ],
          actions: [
            {
              label: "Edit",
              color: "blue",
              onClick: (item: RecurrenceRowUI) => handleOpenCustomer(item),
            },
          ],
        }}
      />
    </div>
  );
};

export default Recurrences;
