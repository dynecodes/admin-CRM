import React, { useMemo, useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppDataTable from "../../components/ui/AppDataTable";
import { Checkbox, Button } from "flowbite-react";
import { useQuotes } from "../../hooks/Quotes/useQuotes";
import QuoteQuickView from "../../components/quotes/QuoteDetailsModal";

import { useServices } from "../../hooks/useServices";
import { useCategories } from "../../hooks/Categories/useCategories";
import { useFrequencies } from "../../hooks/useFrequencies";
import { useVariables } from "../../hooks/Variables/useVariables";
import { useAddons } from "../../hooks/useAddons";

/* ========================= Local Types ========================= */
type Status = "draft" | "sent" | "accepted" | "declined" | "expired" | "converted";

type Row = {
  id: number;

  // canonical name fields
  firstName: string;
  lastName: string;
  displayName: string;

  email: string;
  phone: string;
  address: string;
  city: string;

  startIso?: string;             // derived from schedule date+time
  serviceName: string;
  frequency: string;
  status: Status;
  total: number;
  teamId?: number | "";

  // meta from backend
  createdAt?: string | null;
  expirationAt?: string | null;
  expiresInDays?: number | null;

  // preview needs the exact snapshot used by EditQuoteForm
  payload?: any;

  // derived
  daysLeft?: number | null;
  isExpired?: boolean;

  // converted → booking
  convertedBookingId?: number | null;
};

/* ========================= Small helpers ========================= */

// Prefer nested customer.* over root
function pickStr<T extends Record<string, any>>(q: T, getters: Array<(q: T) => unknown>) {
  for (const g of getters) {
    const v = g(q);
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}
function getFirstName(q: any) {
  return pickStr(q, [(x) => x.customer?.firstName, (x) => x.firstName]);
}
function getLastName(q: any) {
  return pickStr(q, [(x) => x.customer?.lastName, (x) => x.lastName]);
}
function getEmail(q: any) {
  return pickStr(q, [(x) => x.customer?.email, (x) => x.email]);
}
function getPhone(q: any) {
  return pickStr(q, [(x) => x.customer?.phone, (x) => x.phone]);
}

// Name fallback builder
function toDisplayName(q: any): string {
  const first = getFirstName(q);
  const last = getLastName(q);
  if (first || last) return `${first} ${last}`.trim();
  return (q as any).customerName || "(no name)";
}

function toIso(date?: string, time?: string) {
  return date && time ? `${date}T${time}:00` : undefined;
}
function formatDate(iso?: string) {
  return iso
    ? new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    : "—";
}
function formatTime(iso?: string) {
  return iso
    ? new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
    : "";
}
function toNumSafe(v: any, d = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}
function money(n: number | null | undefined) {
  return toNumSafe(n, 0).toLocaleString(undefined, { style: "currency", currency: "USD" });
}

function normalizeAddressFields(q: any) {
  const a = (q as any).address;
  if (a && typeof a === "object") {
    return {
      address: String(a.address ?? ""),
      city: String(a.city ?? ""),
      state: String(a.state ?? ""),
      zip: String(a.zip ?? ""),
      locationId: a.locationId ?? "",
    };
  }
  return {
    address: String((q as any).address ?? ""),
    city: String((q as any).city ?? ""),
    state: String((q as any).state ?? ""),
    zip: String((q as any).zip ?? ""),
    locationId: (q as any).locationId ?? "",
  };
}

/* ===== Expiration helpers ===== */

function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}
function daysBetween(a: Date, b: Date) {
  const ms = endOfDay(a).getTime() - endOfDay(b).getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}
function fmtDate(iso?: string | null) {
  return iso
    ? new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    : "—";
}
function isBooked(status: Row["status"]) {
  const s = String(status).toLowerCase();
  return s === "accepted" || s === "converted";
}

/* ========================= Component ========================= */

const Quotes: React.FC = () => {
  const navigate = useNavigate();
  const { quotes } = useQuotes();

  // lookups for names/prices in preview
  const { services } = useServices();
  const { categories } = useCategories();
  const { frequencies } = useFrequencies();
  const { variables } = useVariables();
  const { addons } = useAddons();

  const lookups = useMemo(() => {
    const mapBy = (arr: any[] | undefined, nameKey: string) => {
      const m = new Map<number, string>();
      (arr ?? []).forEach((x: any) => m.set(Number(x.id), String(x[nameKey] ?? `#${x.id}`)));
      return m;
    };
    const priceBy = (arr: any[] | undefined, priceKey: string) => {
      const m = new Map<number, number>();
      (arr ?? []).forEach((x: any) => {
        const v = Number(x[priceKey] ?? x.price_amount ?? x.price ?? x.amount);
        if (Number.isFinite(v)) m.set(Number(x.id), v);
      });
      return m;
    };

    return {
      categoryNameById: mapBy(categories as any[], "name"),
      serviceNameById: mapBy(services as any[], "name"),
      frequencyNameById: mapBy(frequencies as any[], "name"),
      variableNameById: mapBy(variables as any[], "name"),
      variablePriceById: priceBy(variables as any[], "price"),
      addonNameById: mapBy(addons as any[], "name"),
      addonPriceById: priceBy(addons as any[], "price"),
    };
  }, [categories, services, frequencies, variables, addons]);

  // map API → rows (carry payload + createdAt/expirationAt)
  const rows: Row[] = useMemo(() => {
    return quotes
      .map((q: any) => {
        const p = (q as any).payload ?? {};
        const addr = normalizeAddressFields(p);
        const startIso = toIso(p?.schedule?.date, p?.schedule?.time);

        const expirationAt = q.expirationAt ?? null;
        const expiresInDays =
          typeof q.expiresInDays === "number" ? q.expiresInDays : null;

        const now = new Date();
        const expDate = expirationAt ? new Date(expirationAt) : null;
        const daysLeft =
          expDate
            ? Math.max(daysBetween(expDate, now), 0)
            : typeof expiresInDays === "number"
            ? expiresInDays
            : null;

        const isExpired =
          String(q.status).toLowerCase() === "expired" ||
          (expDate ? endOfDay(expDate).getTime() < now.getTime() : false);

        return {
          id: q.id,
          firstName: getFirstName(p),
          lastName: getLastName(p),
          displayName: toDisplayName(p),
          email: getEmail(p),
          phone: getPhone(p),
          address: addr.address,
          city: addr.city,

          startIso,
          serviceName: "",
          frequency: "",
          status: q.status,
          total: toNumSafe(p?.pricing?.total ?? 0),
          teamId: p?.schedule?.providerId ?? "",

          // preview inputs
          payload: p,
          createdAt: q.createdAt ?? null,
          expirationAt,
          expiresInDays,
          daysLeft,
          isExpired,

          convertedBookingId: q.convertedBookingId ?? q.bookingId ?? null,
        } as Row;
      })
      .sort((a, b) => {
        const A = a.startIso ? +new Date(a.startIso) : Number.MAX_SAFE_INTEGER;
        const B = b.startIso ? +new Date(b.startIso) : Number.MAX_SAFE_INTEGER;
        return A - B;
      });
  }, [quotes]);

  // navigation + edit handlers
  const openQuote = (row: Row) => navigate(`/admin/quotes/edit/${row.id}`);
  const openBooking = (bookingId: number) => navigate(`/admin/bookings/${bookingId}`);
  const handleEdit = (row: Row) => {
    if (isBooked(row.status)) return; // lock accepted/converted
    openQuote(row);
  };

  // selection UI state
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const headerCheckboxRef = useRef<HTMLInputElement>(null);
  const allChecked = rows.length > 0 && selectedIds.size === rows.length;
  const someChecked = selectedIds.size > 0 && selectedIds.size < rows.length;

  useEffect(() => {
    if (headerCheckboxRef.current) headerCheckboxRef.current.indeterminate = someChecked;
  }, [someChecked]);

  const toggleSelectAll = () =>
    setSelectedIds((prev) => (prev.size ? new Set() : new Set(rows.map((r) => r.id))));
  const toggleRow = (id: number) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  // preview
  const [previewRow, setPreviewRow] = useState<Row | null>(null);
  const openPreview = (row: Row) => setPreviewRow(row);
  const closePreview = () => setPreviewRow(null);

  // table columns
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
        cell: (row: Row) => (
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
        selector: (row: Row) => row.displayName,
        sortable: true,
        width: "160px",
        cell: (row: Row) => (
          <button
            type="button"
            className="text-left cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              openPreview(row);
            }}
            title="Preview quote"
          >
            <div className="text-sm font-medium text-gray-900">{row.displayName}</div>
          </button>
        ),
      },
      {
        name: "Email",
        selector: (row: Row) => row.email,
        sortable: true,
        width: "220px",
        cell: (row: Row) => {
          const locked = isBooked(row.status);
          return (
            <button
              type="button"
              className={`${locked ? "cursor-not-allowed opacity-60" : "cursor-pointer"} text-left`}
              onClick={(e) => {
                e.stopPropagation();
                if (!locked) openQuote(row);
              }}
              title={locked ? "Already booked — editing disabled" : "Open quote"}
              aria-disabled={locked}
            >
              <div className="text-sm text-gray-900">{row.email}</div>
            </button>
          );
        },
      },
      {
        name: "Phone",
        selector: (row: Row) => row.phone,
        sortable: true,
        width: "160px",
        cell: (row: Row) => {
          const locked = isBooked(row.status);
          return (
            <button
              type="button"
              className={`${locked ? "cursor-not-allowed opacity-60" : "cursor-pointer"} text-left`}
              onClick={(e) => {
                e.stopPropagation();
                if (!locked) openQuote(row);
              }}
              title={locked ? "Already booked — editing disabled" : "Open quote"}
              aria-disabled={locked}
            >
              <div className="text-sm text-gray-900">{row.phone}</div>
            </button>
          );
        },
      },
      {
        name: "Expires",
        selector: (row: Row) => row.expirationAt ?? "",
        sortable: true,
        width: "140px",
        cell: (row: Row) => {
          if (row.isExpired) {
            return (
              <div className="text-sm">
                <span className="rounded-md bg-red-100 px-2 py-0.5 text-red-700">Expired</span>
                {row.expirationAt ? (
                  <div className="mt-1 text-xs text-gray-500">{fmtDate(row.expirationAt)}</div>
                ) : null}
              </div>
            );
          }

          if (!row.expirationAt && row.expiresInDays == null) {
            return <div className="text-sm text-gray-500">—</div>;
          }

          return (
            <div className="text-sm text-gray-900">
              {typeof row.daysLeft === "number" ? (
                <span className="text-xs text-gray-500">{row.daysLeft} days</span>
              ) : null}
            </div>
          );
        },
      },
      {
        name: "Booked",
        selector: (row: Row) => (isBooked(row.status) ? "yes" : "no"),
        sortable: true,
        width: "120px",
        cell: (row: Row) => {
          if (!isBooked(row.status)) return <span className="text-xs text-gray-400" />;
          const bookingId = row.convertedBookingId ?? null;

          return (
            <button
              type="button"
              className="inline-flex items-center gap-2 cursor-pointer"
              title={bookingId ? `Open booking #${bookingId}` : "Converted"}
              onClick={(e) => {
                e.stopPropagation();
                if (bookingId) openBooking(bookingId);
              }}
              aria-label={bookingId ? `Open booking ${bookingId}` : "Converted"}
            >
              <svg
                className="h-4 w-4 text-emerald-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {bookingId ? <span className="text-xs text-gray-700">#{bookingId}</span> : null}
            </button>
          );
        },
      },
      {
        name: "Actions",
        width: "100px",
        ignoreRowClick: true,
        cell: (row: Row) => {
          const locked = isBooked(row.status);
          return (
            <div className="flex items-center gap-2 cursor-pointer">
              <Button
                color="blue"
                size="xs"
                className="cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!locked) handleEdit(row);
                }}
                disabled={locked}
                title={locked ? "Already booked — editing disabled" : "Edit quote"}
              >
                Edit
              </Button>

              {locked && row.convertedBookingId ? (
                <Button
                  color="blue"
                  size="xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    openBooking(row.convertedBookingId!);
                  }}
                  title={`Open booking #${row.convertedBookingId}`}
                >
                  View booking
                </Button>
              ) : null}
            </div>
          );
        },
      },
    ],
    [allChecked, selectedIds]
  );

  const filterOptions = [
    { value: "all", label: "All" },
    { value: "draft", label: "Draft" },
    { value: "sent", label: "Sent" },
    { value: "accepted", label: "Accepted" },
    { value: "declined", label: "Declined" },
    { value: "expired", label: "Expired" },
    { value: "converted", label: "Converted" },
  ];

  const sortOptions = [
    {
      value: "recent",
      label: "Most Recent",
      sortFn: (a: Row, b: Row) =>
        (b.startIso ? +new Date(b.startIso) : 0) - (a.startIso ? +new Date(a.startIso) : 0),
    },
    { value: "customer", label: "Customer", sortFn: (a: Row, b: Row) => a.displayName.localeCompare(b.displayName) },
    { value: "amount", label: "Amount", sortFn: (a: Row, b: Row) => a.total - b.total },
    { value: "status", label: "Status", sortFn: (a: Row, b: Row) => a.status.localeCompare(b.status) },
  ];

  return (
    <div className="px-4 pb-5 sm:px-5">
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <div className="relative inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-blue-700">
            <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden>
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 3H8a2 2 0 0 0-2 2v14l6-3 6 3V5a2 2 0 0 0-2-2Z" />
            </svg>
          </div>
          <span className="text-2xl font-bold text-gray-900 sm:text-3xl">Quotes ({rows.length})</span>
        </div>
      </div>

      <AppDataTable
        data={rows}
        columns={columns}
        searchPlaceholder="Search quotes…"
        searchKeys={[
          "firstName",
          "lastName",
          "displayName",
          "email",
          "phone",
          "serviceName",
          "frequency",
          "address",
          "city",
          "status",
        ]}
        filterOptions={filterOptions}
        filterKey="status"
        defaultFilter="all"
        onRowClick={(row: Row) => {
          if (!isBooked(row.status)) openQuote(row);
        }}
        sortOptions={sortOptions}
        defaultSort="recent"
        paginationOptions={[10, 20, 50, 100]}
        defaultPerPage={20}
        mobileCard={{
          titleField: "displayName",
          titleRender: (row: Row) => (
            <div className="text-sm">
              <div className="font-semibold text-gray-900">{row.displayName}</div>
              <div className="text-xs text-gray-500">
                {row.startIso ? `${formatDate(row.startIso)} • ${formatTime(row.startIso)}` : "No date"}
              </div>
            </div>
          ),
          subtitleRender: (row: Row) => `${row.serviceName} • ${row.frequency} • ${money(row.total)}`,
          statusField: "status",
          fields: [
            { key: "address", label: "Address" },
            { key: "city", label: "City" },
          ],
          actions: [
            {
              label: "Edit",
              color: "blue",
              onClick: (row: Row) => {
                if (!isBooked(row.status)) openQuote(row);
              },
            },
          ],
          enableEdit: false,
        }}
      />

      {previewRow && (
        <QuoteQuickView
          open={!!previewRow}
          onClose={closePreview}
          titleName={
            `${previewRow?.payload?.customer?.firstName ?? ""} ${previewRow?.payload?.customer?.lastName ?? ""}`
              .trim() || undefined
          }
          titleEmail={previewRow?.payload?.customer?.email ?? undefined}
          createdAt={previewRow.createdAt ?? null}
          expiresAt={previewRow.expirationAt ?? null}
          payload={(previewRow.payload ?? {}) as any}
          lookups={lookups}
        />
      )}
    </div>
  );
};

export default Quotes;
