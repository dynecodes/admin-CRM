// src/App/Recurrences/CancelledRecurrences.tsx
import React, { useMemo, useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Checkbox, Dropdown } from "flowbite-react";
import AppDataTable from "../../components/ui/AppDataTable";
import { useCustomers } from "../../hooks/Customers/useCustomers";
import { Customer } from "../../types/customers";
import { useTags } from "../../hooks/useTags";
import { TagColor } from "../../types/tag";
import { useLocations } from "../../hooks/Locations/useLocations";
import { useFrequencies } from "../../hooks/useFrequencies";
import { useBookings } from "../../hooks/Bookings/useBookings";
import type { Booking } from "../../types/bookings";

/* ================================================================== */
/* Helpers                                                            */
/* ================================================================== */

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

// helper – is this booking actually recurring?
const isBookingRecurring = (b: Booking): boolean => {
  const f = b.service?.frequency as any;
  if (!f) return false;
  const intervalDays = f.intervalDays ?? f.interval_days;
  return !!intervalDays && Number(intervalDays) > 0;
};

// try to get a reasonable date for sorting from the booking
const getBookingDateForSort = (b: Booking): string | null => {
  const anyB: any = b;

  return (
    anyB.schedule?.startDate ||
    anyB.schedule?.date ||
    anyB.schedule?.nextDate ||
    anyB.serviceDate ||
    anyB.startDate ||
    anyB.createdAt ||
    anyB.created_at ||
    null
  );
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
/* Search text builder – everything into one lower-cased string    */
/* =============================================================== */

function buildSearchText(
  customer: any,
  locationNamesText: string | null
): string {
  const parts: string[] = [];
  const push = (v: any) => {
    if (v == null) return;
    const s = String(v).trim();
    if (s) parts.push(s);
  };

  // Identity
  push(customer.firstName);
  push(customer.lastName);
  push(customer.companyName);
  push(customer.email);
  push(customer.phone);

  // Address (legacy single-address fields on customer row)
  push(customer.address);
  push(customer.city);
  push(customer.state);
  push(customer.zip);

  // Location names (can be multiple)
  push(locationNamesText);

  // Status-ish
  push(customer.status);
  push(isConfirmed(customer.confirmed) ? "confirmed" : "unconfirmed");
  push(customer.blocked ? "blocked" : "not blocked");

  // Tags from likely locations
  const rawTags =
    customer.tags ??
    customer.details?.tags ??
    customer.preferences?.tags ??
    customer.meta?.tags ??
    [];

  const tagNames: string[] = [];
  const pushTag = (v: any) => {
    if (!v) return;
    if (typeof v === "string") {
      v
        .split(",")
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
/* Inline Tags                                                       */
/* ================================================================== */

function InlineTags({
  customer,
  catalog,
  loadingTags,
  max = 4,
}: {
  customer: Customer;
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
    const raw =
      (customer as any).tags ??
      (customer as any).details?.tags ??
      (customer as any).preferences?.tags ??
      (customer as any).meta?.tags ??
      [];
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
/* Page Component – Cancelled Recurrences                            */
/* ================================================================== */

const CancelledRecurrences: React.FC = () => {
  const navigate = useNavigate();
  const { customers } = useCustomers();
  const { locations } = useLocations();
  const { frequencies } = useFrequencies();
  const { tags: tagCatalog, loading: tagsLoading } = useTags();

  // load all bookings so we can see which are cancelled + recurring
  const { bookings } = useBookings();

  const pathPrefix = window.location.pathname.split("/")[1];
  const handleNew = () => navigate(`/${pathPrefix}/customers/new`);
  const handleEdit = (row: Customer) =>
    navigate(`/${pathPrefix}/customers/edit/${row.id}`);

  /* =============================================================== */
  /* Map: customerId → cancelled meta (hasCancelled + latest date)   */
  /* =============================================================== */

  const cancelledRecurringByCustomerId = useMemo(() => {
    const map = new Map<
      number,
      { hasCancelled: boolean; latestDate: string | null }
    >();

    bookings.forEach((b) => {
      if (b.status === "cancelled" && isBookingRecurring(b) && b.customer?.id) {
        const customerId = b.customer.id;
        const bookingDate = getBookingDateForSort(b);

        const existing = map.get(customerId);
        if (!existing) {
          map.set(customerId, {
            hasCancelled: true,
            latestDate: bookingDate,
          });
        } else if (bookingDate) {
          const existingTime = existing.latestDate
            ? new Date(existing.latestDate).getTime()
            : 0;
          const bookingTime = new Date(bookingDate).getTime();

          if (!Number.isNaN(bookingTime) && bookingTime > existingTime) {
            existing.latestDate = bookingDate;
          }
        }
      }
    });

    return map;
  }, [bookings]);

  /* =============================================================== */
  /* Location Filter (MULTI-SELECT, default = All Locations)         */
  /* =============================================================== */

  const [selectedLocationIds, setSelectedLocationIds] = useState<number[]>([]);

  const locationFilterOptions = useMemo(() => {
    if (!locations) return [];

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

  const isArchivedRow = (row: any) => {
    const status = String((row as any).status ?? "").toLowerCase();
    return status === "archived" || !!(row as any).archivedAt;
  };

  /* =============================================================== */
  /* Blocked Filter with All Option                                 */
  /* =============================================================== */

  const [blockedFilter, setBlockedFilter] = useState<
    "all" | "blocked" | "not_blocked"
  >("not_blocked");

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

  /* =============================================================== */
  /* Recurrences Filter (MULTI-SELECT, like Locations)               */
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
    if (!frequencies || frequencies.length === 0)
      return "All Recurrences";
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
  /* Selection State                                                 */
  /* =============================================================== */

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const headerCheckboxRef = useRef<HTMLInputElement>(null);

  const allChecked =
    customers.length > 0 && selectedIds.size === customers.length;
  const someChecked =
    selectedIds.size > 0 && selectedIds.size < customers.length;

  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = someChecked;
    }
  }, [someChecked]);

  const toggleSelectAll = () => {
    if (allChecked) setSelectedIds(new Set());
    else setSelectedIds(new Set(customers.map((c) => c.id)));
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

  const tableRows = useMemo(() => {
    return customers.map((c) => {
      const addresses: any[] = (c as any).addresses ?? [];

      const addrLocationIds: number[] = addresses
        .map((a) => a.locationId)
        .filter((id: any) => id != null)
        .map((id: any) => Number(id));

      const uniqueAddrLocationIds = Array.from(new Set(addrLocationIds));

      const baseLocationId =
        (c as any).locationId != null ? Number((c as any).locationId) : null;

      const allLocationIds =
        uniqueAddrLocationIds.length > 0
          ? uniqueAddrLocationIds
          : baseLocationId != null
          ? [baseLocationId]
          : [];

      const allLocationNames =
        locations && allLocationIds.length
          ? allLocationIds
              .map((id) => {
                const hit = locations.find((l) => Number(l.id) === id);
                return hit ? hit.name : null;
              })
              .filter((n): n is string => !!n)
          : [];

      const locationNamesText =
        allLocationNames.length > 0 ? allLocationNames.join(" ") : null;

      // Recurrence IDs – read from possible fields, else []
      const recurrenceIdsRaw: any =
        (c as any).recurrenceIds ??
        (c as any).frequencyIds ??
        (c as any).frequencies ??
        [];

      const recurrenceIds: number[] = Array.isArray(recurrenceIdsRaw)
        ? recurrenceIdsRaw
            .map((r) =>
              typeof r === "number"
                ? r
                : Number((r as any).id ?? (r as any).frequencyId)
            )
            .filter((id) => !Number.isNaN(id))
        : [];

      const recurrenceNames =
        frequencies && recurrenceIds.length
          ? recurrenceIds
              .map((id) => {
                const fr = frequencies.find((f: any) => Number(f.id) === id);
                return fr ? fr.name ?? null : null;
              })
              .filter((n): n is string => !!n)
          : [];

      // does this customer have any cancelled recurring bookings?
      const meta = cancelledRecurringByCustomerId.get(c.id);
      const hasCancelledRecurring = meta?.hasCancelled ?? false;
      const lastCancelledAt = meta?.latestDate ?? null;

      return {
        ...c,
        statusForFilter: hasCancelledRecurring ? "cancelled" : "active",
        hasCancelledRecurring,
        lastCancelledAt,
        locationIds: allLocationIds,
        locationNames: allLocationNames,
        recurrenceIds,
        recurrenceNames,
        searchText: buildSearchText(c, locationNamesText),
      };
    });
  }, [customers, locations, frequencies, cancelledRecurringByCustomerId]);

  // Apply blocked / location / recurrence filters first
  const filteredRows = useMemo(() => {
    let rows: any[] = [...tableRows];

    // Blocked
    if (blockedFilter === "blocked") {
      rows = rows.filter((r) => !!r.blocked);
    } else if (blockedFilter === "not_blocked") {
      rows = rows.filter((r) => !r.blocked);
    }

    // Location (multi-select)
    if (selectedLocationIds.length > 0) {
      rows = rows.filter((r: any) => {
        const ids: number[] = Array.isArray(r.locationIds)
          ? r.locationIds
          : r.locationId != null
          ? [Number(r.locationId)]
          : [];

        if (!ids.length) return false;

        return ids.some((id) => selectedLocationIds.includes(id));
      });
    }

    // Recurrences (multi-select)
    if (selectedRecurrenceIds.length > 0) {
      rows = rows.filter((r: any) => {
        const ids: number[] = Array.isArray(r.recurrenceIds)
          ? r.recurrenceIds
          : [];
        if (!ids.length) return false;
        return ids.some((id) => selectedRecurrenceIds.includes(id));
      });
    }

    return rows;
  }, [
    tableRows,
    blockedFilter,
    selectedLocationIds,
    selectedRecurrenceIds,
  ]);

  // 🔥 FINAL: only show rows that actually have cancelled recurring bookings
  // and list them by newest cancelled recurrence first
  const cancelledRows = useMemo(() => {
    const rows = filteredRows.filter((r: any) => r.hasCancelledRecurring);

    rows.sort((a: any, b: any) => {
      const aStr = a.lastCancelledAt || "";
      const bStr = b.lastCancelledAt || "";

      const aTime = new Date(aStr).getTime();
      const bTime = new Date(bStr).getTime();

      const safeA = Number.isNaN(aTime) ? 0 : aTime;
      const safeB = Number.isNaN(bTime) ? 0 : bTime;

      // newest first
      return safeB - safeA;
    });

    return rows;
  }, [filteredRows]);

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
        cell: (row: Customer) => (
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
        selector: (row: any) =>
          `${row.firstName} ${row.lastName}`.trim(),
        sortable: true,
        width: "290px",
        cell: (row: any) => {
          const archived = isArchivedRow(row);

          return (
            <div className="flex items-center">
              <button
                type="button"
                className="text-left cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit(row);
                }}
              >
                <div className="text-sm font-semibold text-gray-900">
                  {row.firstName} {row.lastName}
                </div>

                <div className="mt-1 flex flex-wrap gap-1">
                  {row.blocked && (
                    <span className="inline-flex items-center rounded-sm bg-[#ff0000] font-medium text-[11px] px-3 py-1 text-white">
                      Blocked
                    </span>
                  )}

                  {archived && (
                    <span className="inline-flex items-center rounded-sm bg-[#ff6666] font-medium text-[11px] px-3 py-1 text-white">
                      Archived
                    </span>
                  )}

                  <InlineTags
                    customer={row}
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
        selector: (row: any) =>
          Array.isArray(row.locationNames) && row.locationNames.length
            ? row.locationNames.join(", ")
            : "",
        sortable: true,
        width: "180px",
        cell: (row: any) => {
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
                handleEdit(row);
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
        selector: (row: any) =>
          Array.isArray(row.recurrenceNames) && row.recurrenceNames.length
            ? row.recurrenceNames.join(", ")
            : "",
        sortable: false,
        width: "220px",
        cell: (row: any) => {
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
        name: "Last Job",
        selector: (row: Customer) => row.phone,
        sortable: true,
        width: "150px",
        cell: (row: Customer) => (
          <button
            type="button"
            className="text-left w-full text-sm cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(row);
            }}
          >
            {row.phone}
          </button>
        ),
      },
    ],
    [
      allChecked,
      selectedIds,
      toggleSelectAll,
      toggleRow,
      handleEdit,
      tagCatalog,
      tagsLoading,
    ]
  );

  /* =============================================================== */
  /* Final Page Render                                               */
  /* =============================================================== */

  // For this page we only care about cancelled, so keep a simple filter
  const filterOptions = [{ value: "cancelled", label: "Cancelled" }];

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
              Cancelled Recurrences ({cancelledRows.length})
            </span>
            <div className="text-sm text-gray-500">
              Customers with cancelled recurring bookings
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
        data={cancelledRows}
        columns={columns}
        searchPlaceholder="Search cancelled recurrences"
        searchKeys={["searchText"]}
        filterOptions={filterOptions}
        filterKey="statusForFilter"
        filterLabel="Filter by"
        defaultFilter="cancelled"
        onRowClick={handleEdit}
        paginationOptions={[10, 20, 50, 100]}
        defaultPerPage={20}
        showAdditionalFilter={true}
        additionalFilterLabel="Blocked"
        additionalFilterOptions={blockedFilterOptions}
        additionalFilterValue={blockedFilterId}
        additionalFilterShowAll={false}
        onAdditionalFilterChange={(id) => {
          if (id === 0) setBlockedFilter("all");
          else if (id === 1) setBlockedFilter("not_blocked");
          else if (id === 2) setBlockedFilter("blocked");
        }}
        customFilters={
          <div className="mt-2 grid w-full gap-4 md:grid-cols-2">
            {/* ===== Recurrences dropdown ===== */}
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex items-center text-sm text-gray-500 whitespace-nowrap">
                <svg
                  className="mr-2 h-5 w-5 text-gray-500"
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeWidth="2"
                    d="M5 7h14M5 12h14M5 17h14"
                  />
                </svg>
                Recurrences:
              </div>

              <div className="relative flex-shrink-0">
                <Dropdown
                  label={recurrenceLabel}
                  dismissOnClick={false}
                  size="sm"
                  placement="bottom"
                  theme={{
                    floating: {
                      target:
                        "min-w-[170px] whitespace-nowrap justify-between bg-white text-gray-800 border border-gray-300 focus:ring-2 focus:ring-blue-400 hover:bg-gray-200 hover:text-gray-900 cursor-pointer",
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
            </div>

            {/* ===== Location dropdown ===== */}
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex items-center text-sm text-gray-500 whitespace-nowrap">
                <svg
                  className="mr-2 h-5 w-5 text-gray-500"
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeWidth="2"
                    d="M5 7h14M5 12h14M5 17h14"
                  />
                </svg>
                Location:
              </div>

              <div className="relative flex-shrink-0">
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
                              <span className={CHIP_MORE_CLASS}>
                                [ Default ]
                              </span>
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
          </div>
        }
        /* ================= MOBILE CARDS ================= */
        mobileCard={{
          titleField: "name",
          titleRender: (item: any) => (
            <span className="font-semibold text-gray-900">
              {item.firstName} {item.lastName}
            </span>
          ),
          subtitleRender: (item: any) => {
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
          statusField: "blocked",
          enableEdit: true,
          fields: [
            {
              key: "email",
              label: "Email",
              type: "text",
              render: (_value, item) => (
                <span className="text-xs break-all">{item.email}</span>
              ),
            },
            {
              key: "phone",
              label: "Phone",
              type: "text",
              render: (_value, item) => (
                <span className="text-xs font-medium">{item.phone}</span>
              ),
            },
            {
              key: "tags",
              label: "Tags",
              type: "badges",
              render: (_value, item) => {
                const archived = isArchivedRow(item);
                return (
                  <div className="flex flex-wrap gap-1">
                    {item.blocked && (
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
                        Archived
                      </span>
                    )}

                    <InlineTags
                      customer={item}
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
              onClick: (item: any) => handleEdit(item),
            },
          ],
        }}
      />
    </div>
  );
};

export default CancelledRecurrences;
