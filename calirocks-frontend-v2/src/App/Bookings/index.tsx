import React, { useMemo, useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppDataTable from "../../components/ui/AppDataTable";
import { Button, Checkbox } from "flowbite-react";
import { useBookings } from "../../hooks/Bookings/useBookings";
import { useProviders } from "../../hooks/Providers/useProviders";
import { useServices } from "../../hooks/useServices";
import { useFrequencies } from "../../hooks/useFrequencies";
import {  HiClipboardList } from "react-icons/hi";

type BookingRow = {
  id: number;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  startIso: string;
  endIso: string;
  createdAtIso: string; // ← used for Newest/Oldest sorting
  serviceName: string;
  frequency: string;
  status: "completed" | "upcoming" | "cancelled";
  providerId?: number;
  providerName?: string;
};

/* ------------------ SAFE Date/Time helpers ------------------ */
// True type guard so TS narrows `iso` to string after the check
function isValidIso(iso: unknown): iso is string {
  return typeof iso === "string" && !Number.isNaN(Date.parse(iso));
}

// If `date` already a full ISO, use it; else build from date + time
function toIso(date?: string, time?: string) {
  if (isValidIso(date)) return date; // already an ISO datetime from API
  if (!date) return "";
  const hhmm = time && /^\d{1,2}:\d{2}$/.test(time) ? time : "09:00";
  const [h, m] = hhmm.split(":");
  const hh = String(h).padStart(2, "0");
  return `${date}T${hh}:${m}:00`;
}

function formatDate(iso?: string) {
  if (!isValidIso(iso)) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
function formatTime(iso?: string) {
  if (!isValidIso(iso)) return "—";
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

const Bookings: React.FC = () => {
  const navigate = useNavigate();
  const { bookings } = useBookings();
  const { providers } = useProviders();
  const { services } = useServices();
  const { frequencies } = useFrequencies();

  // id -> provider name
  const providerNameById = useMemo(() => {
    const map = new Map<number, string>();
    (providers ?? []).forEach((p: any) => {
      if (typeof p?.id === "number") {
        map.set(p.id, p.teamTitle ?? p.name ?? `Team #${p.id}`);
      }
    });
    return map;
  }, [providers]);

  // id -> service name
  const serviceNameById = useMemo(() => {
    const map = new Map<number, string>();
    (services ?? []).forEach((s: any) => {
      const id = Number(s?.id ?? s?.value);
      if (Number.isFinite(id)) map.set(id, s?.name ?? s?.title ?? `Service #${id}`);
    });
    return map;
  }, [services]);

  // id -> frequency name
  const freqNameById = useMemo(() => {
    const map = new Map<number, string>();
    (frequencies ?? []).forEach((f: any) => {
      const id = Number(f?.id ?? f?.value);
      if (Number.isFinite(id)) map.set(id, f?.name ?? f?.title ?? `Frequency #${id}`);
    });
    return map;
  }, [frequencies]);

  const rows: BookingRow[] = useMemo(() => {
    const list: BookingRow[] = bookings.map((b: any) => {
      // DISPLAY: schedule date/time
      const startIso = toIso(b.schedule?.date, b.schedule?.time);

      // Derived end (2h) for display only
      let endIso = "";
      if (isValidIso(startIso)) {
        const end = new Date(startIso);
        end.setHours(end.getHours() + 2);
        endIso = end.toISOString().slice(0, 16);
      }

      // CREATED AT for Newest/Oldest
      const createdAtIso =
        (typeof b.createdAt === "string" && b.createdAt) ||
        (typeof b.created_at === "string" && b.created_at) ||
        "";

      // provider normalization
      const providerRaw = b.schedule?.providerId ?? b.providerId ?? b.teamId;
      const providerId = typeof providerRaw === "number" ? providerRaw : undefined;
      const providerName = providerId ? providerNameById.get(providerId) : undefined;

      // service/frequency names from lookups
      const serviceId = Number(b.service?.serviceId);
      const frequencyId = Number(b.service?.frequencyId);
      const serviceName = Number.isFinite(serviceId) ? (serviceNameById.get(serviceId) ?? "") : "";
      const frequency = Number.isFinite(frequencyId) ? (freqNameById.get(frequencyId) ?? "") : "";

      const status: BookingRow["status"] =
        b.status === "cancelled"
          ? "cancelled"
          : isValidIso(startIso) && Date.parse(startIso) < Date.now()
          ? "completed"
          : "upcoming";

      return {
        id: b.id,
        customerName:
          `${b.customer?.firstName ?? ""} ${b.customer?.lastName ?? ""}`.trim() || "(no name)",
        email: b.customer?.email ?? "",
        phone: b.customer?.phone ?? "",
        address: b.address?.address ?? "",
        city: b.address?.city ?? "",
        startIso,
        endIso,
        createdAtIso,
        serviceName,
        frequency,
        status,
        providerId,
        providerName,
      };
    });

    // Do NOT presort; table sort handles it
    return list;
  }, [bookings, providerNameById, serviceNameById, freqNameById]);

  const handleNew = () => {
    const pathPrefix = window.location.pathname.split("/")[1];
    navigate(`/${pathPrefix}/bookings/new`);
  };

  const handleRow = (row: BookingRow) => {
    const pathPrefix = window.location.pathname.split("/")[1];
    navigate(`/${pathPrefix}/bookings/edit/${row.id}`);
  };

  // selection
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const headerCheckboxRef = useRef<HTMLInputElement>(null);
  const allChecked = rows.length > 0 && selectedIds.size === rows.length;
  const someChecked = selectedIds.size > 0 && selectedIds.size < rows.length;

  useEffect(() => {
    if (headerCheckboxRef.current) headerCheckboxRef.current.indeterminate = someChecked;
  }, [someChecked]);

  const toggleSelectAll = () => {
    setSelectedIds((prev) => (prev.size ? new Set() : new Set(rows.map((r) => r.id))));
  };
  const toggleRow = (id: number) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

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
        cell: (row: BookingRow) => (
          <Checkbox
            checked={selectedIds.has(row.id)}
            onClick={(e) => e.stopPropagation()}
            onChange={() => toggleRow(row.id)}
            className="cursor-pointer"
          />
        ),
      },
      {
        name: "Date",
        selector: (row: BookingRow) => row.startIso, // schedule display only
        sortable: true,
        width: "180px",
        cell: (row: BookingRow) => (
          <div className="text-sm">
            <div className="font-medium text-gray-900">{formatDate(row.startIso)}</div>
            {/* <div className="text-xs text-gray-500">
              {formatTime(row.startIso)} – {formatTime(row.endIso)}
            </div> */}
          </div>
        ),
      },
      {
        name: "Customer",
        selector: (row: BookingRow) => row.customerName,
        sortable: true,
        width: "200px",
        cell: (row: BookingRow) => (
          <button
            type="button"
            className="cursor-pointer text-left"
            onClick={(e) => {
              e.stopPropagation();
              handleRow(row);
            }}
            title="Open booking"
          >
            <div className="text-sm font-semibold text-gray-900">{row.customerName}</div>
            <div className="text-xs text-gray-500">{row.email}</div>
            <div className="text-xs text-gray-500">{row.phone}</div>
          </button>
        ),
      },
      {
        name: "Service",
        selector: (row: BookingRow) => row.serviceName,
        sortable: true,
        width: "200px",
        cell: (row: BookingRow) => (
          <div className="text-sm">
            <div className="font-medium text-gray-900">{row.serviceName }</div>
            <div className="text-xs text-gray-500">{row.frequency }</div>
          </div>
        ),
      },
      {
        name: "Address",
        width: "160px",
        selector: (row: BookingRow) => row.address,
        sortable: true,
        grow: 2,
        cell: (row: BookingRow) => (
          <div className="text-sm text-gray-900">
            <div>{row.address}</div>
            <div className="text-xs text-gray-500">{row.city}</div>
          </div>
        ),
      },
      {
        name: "Team",
        selector: (row: BookingRow) => String(row.providerId ?? ""),
        width: "200px",
        cell: (row: BookingRow) => (
          <div className="text-sm">
            <div className="font-medium text-gray-900">{row.providerName ?? "Unassigned"}</div>
          </div>
        ),
      },
    ],
    [allChecked, selectedIds]
  );

  const filterOptions = [
    { value: "all", label: "All" },
    { value: "upcoming", label: "Upcoming" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
  ];

  // 🔑 Newest/Oldest sort by created_at; Date column shows schedule only
  const sortOptions = [
    {
      value: "newest",
      label: "Newest",
      sortFn: (a: BookingRow, b: BookingRow) => {
        const at = isValidIso(a.createdAtIso) ? Date.parse(a.createdAtIso) : -Infinity;
        const bt = isValidIso(b.createdAtIso) ? Date.parse(b.createdAtIso) : -Infinity;
        return bt - at; // newest created on top
      },
    },
    {
      value: "oldest",
      label: "Oldest",
      sortFn: (a: BookingRow, b: BookingRow) => {
        const at = isValidIso(a.createdAtIso) ? Date.parse(a.createdAtIso) : Infinity;
        const bt = isValidIso(b.createdAtIso) ? Date.parse(b.createdAtIso) : Infinity;
        return at - bt; // oldest created on top
      },
    },
    {
      value: "customer",
      label: "Customer",
      sortFn: (a: BookingRow, b: BookingRow) => a.customerName.localeCompare(b.customerName),
    },
    {
      value: "service",
      label: "Service",
      sortFn: (a: BookingRow, b: BookingRow) => a.serviceName.localeCompare(b.serviceName),
    },
  ];

  return (
    <div className="px-4 pb-5 sm:px-5">
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <div className="relative inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-black">
              <HiClipboardList className="h-6 w-6 text-white"/>
          </div>
          <span className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Bookings ({rows.length})
          </span>
        </div>
       <Button
          color="gray"
          onClick={handleNew}
          className="w-full sm:w-auto cursor-pointer"
        >
          Add New Bookings
        </Button>

      </div>

      <AppDataTable
        data={rows}
        columns={columns}
        searchPlaceholder="Search bookings…"
        searchKeys={[
          "customerName",
          "email",
          "phone",
          "serviceName",
          "frequency",
          "address",
          "city",
          "status",
          "providerName",
        ]}
        filterOptions={filterOptions}
        filterKey="status"
        defaultFilter="all"
        onRowClick={handleRow}
        sortOptions={sortOptions}
        defaultSort="newest" // created_at newest on top
        paginationOptions={[10, 20, 50, 100]}
        defaultPerPage={20}
        mobileCard={{
          titleField: "customerName",
          titleRender: (row: BookingRow) => (
            <div className="text-sm">
              <div className="font-semibold text-gray-900">{row.customerName}</div>
              <div className="text-xs text-gray-500">
                {formatDate(row.startIso)} • {formatTime(row.startIso)}–{formatTime(row.endIso)}
              </div>
            </div>
          ),
          subtitleRender: (row: BookingRow) => `${row.serviceName} • ${row.frequency}`,
          statusField: "status",
          fields: [
            { key: "providerName", label: "Team" },
            { key: "address", label: "Address" },
            { key: "city", label: "City" },
          ],
          actions: [
            {
              label: "Edit",
              color: "gray",
              onClick: (row: BookingRow) => handleRow(row),
            },
          ],
          enableEdit: false,
        }}
      />
    </div>
  );
};

export default Bookings;
