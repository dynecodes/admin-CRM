// src/components/Providers/Bookings.tsx
import * as React from "react";
import { Badge } from "flowbite-react";
import { HiClock, HiLocationMarker, HiStar, HiSelector } from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import { useCustomers } from "../../../hooks/Customers/useCustomers"; // <-- use customers, not mockBookings
import { CustomerBooking } from "../../../types/customers";

type Props = { providerId: number };
type Tab = "completed" | "upcoming" | "cancelled" | "feedback";

// Type helper so we can show names in the list
type ProviderBookingWithNames = CustomerBooking & {
  customerName: string;
  customerId: number;
  providerId?: number;
};

function fmtTime(t: Date) {
  return t.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}
function formatTimeRange(startIso?: string, endIso?: string) {
  if (!startIso) return "—";
  const start = new Date(startIso);
  const end = endIso ? new Date(endIso) : undefined;
  return end ? `${fmtTime(start)} – ${fmtTime(end)}` : fmtTime(start);
}

export default function Bookings({ providerId }: Props) {
  const navigate = useNavigate();
  const pathPrefix = window.location.pathname.split('/')[1];
  const { customers } = useCustomers();

  // Flatten all customers' bookings, annotate with names, then filter by provider
  const allBookings: ProviderBookingWithNames[] = React.useMemo(() => {
    const rows: ProviderBookingWithNames[] = [];
    for (const c of customers) {
      const name = `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim() || "Customer";
      for (const b of c.bookings ?? []) {
        // only include those that belong to this provider
        if (b.providerId === providerId) {
          rows.push({ ...b, customerName: name, customerId: c.id });
        }
      }
    }
    // newest first
    return rows.sort(
      (a, b) => new Date(b.startIso).getTime() - new Date(a.startIso).getTime()
    );
  }, [customers, providerId]);

  const [tab, setTab] = React.useState<Tab>("completed");
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement | null>(null);

  const counts = React.useMemo(
    () => ({
      completed: allBookings.filter((b) => b.status === "completed").length,
      upcoming: allBookings.filter((b) => b.status === "upcoming").length,
      cancelled: allBookings.filter((b) => b.status === "cancelled").length,
      feedback: allBookings.filter(
        (b) => b.status === "completed" && (b.rating || b.feedback)
      ).length,
    }),
    [allBookings]
  );

  const filtered = React.useMemo(() => {
    const list =
      tab === "feedback"
        ? allBookings.filter(
            (b) => b.status === "completed" && (b.rating || b.feedback)
          )
        : allBookings.filter((b) => b.status === tab);
    return list;
  }, [allBookings, tab]);

  const grouped = React.useMemo(() => {
    const groups = new Map<string, ProviderBookingWithNames[]>();
    filtered.forEach((b) => {
      const key = new Date(b.startIso).toLocaleDateString();
      (groups.get(key) ?? groups.set(key, []).get(key)!)!.push(b);
    });
    return Array.from(groups.entries()).sort(
      (a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime()
    );
  }, [filtered]);

  const labelMap: Record<Tab, string> = {
    completed: `Completed Bookings (${counts.completed})`,
    upcoming: `Upcoming Bookings (${counts.upcoming})`,
    cancelled: `Cancelled Bookings (${counts.cancelled})`,
    feedback: `Feedback (${counts.feedback})`,
  };

  React.useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuOpen) return;
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [menuOpen]);

  // Navigation helpers — tweak these routes to match your app
  const goToCustomer = (customerId: number) =>
    navigate(`/${pathPrefix}/customers/edit/${customerId}`);
  const goToTeam = (providerId: number | undefined) => {
    if (providerId == null) return;
    navigate(`/${pathPrefix}/teams/edit/${providerId}`); // or `/admin/providers/edit/${providerId}`
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex sm:flex-row flex-col gap-2 items-start justify-between">
        <div className="text-base font-semibold">Bookings</div>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 cursor-pointer"
          >
            {labelMap[tab]}
            <HiSelector className="ml-2 h-4 w-4 text-gray-400" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 z-20 mt-2 w-64 overflow-hidden rounded-md border border-gray-300 bg-white shadow-lg cursor-pointer">
              {(["completed", "upcoming", "cancelled", "feedback"] as Tab[]).map((t) => (
                <button
                  key={t}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-gray-50 cursor-pointer bg-white"
                  onClick={() => {
                    setTab(t);
                    setMenuOpen(false);
                  }}
                >
                  <span>
                    {t === "completed" && "✓ Completed Bookings"}
                    {t === "upcoming" && "⏳ Upcoming Bookings"}
                    {t === "cancelled" && "✖ Cancelled Bookings"}
                    {t === "feedback" && "⭐ Feedback"}
                  </span>
                  <span className="text-gray-500">{counts[t]}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {grouped.length === 0 ? (
        <div className="text-sm text-gray-500">No items to show.</div>
      ) : (
        <div className="space-y-5">
          {grouped.map(([dateLabel, items]) => (
            <div key={dateLabel}>
              <div className="mb-2 flex items-center gap-2 text-xs font-medium text-gray-600">
                <span className="inline-block rounded bg-white px-2 py-0.5">
                  {dateLabel}
                </span>
                <span className="text-gray-400">•</span>
                <span>
                  {items.length} booking{items.length > 1 ? "s" : ""}
                </span>
              </div>

              <div className="space-y-3">
                {items.map((b) => {
                  const initials = b.customerName
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((s) => s[0]?.toUpperCase())
                    .join("");
                  return (
                    <div
                      key={b.id}
                      className="flex gap-3 rounded-lg border border-gray-300 p-3 hover:shadow-sm"
                    >
                      <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg--600 text-sm font-semibold text-white">
                        {initials || "C"}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Clickable customer name */}
                          <button
                            type="button"
                            onClick={() => goToCustomer(b.customerId)}
                            className="truncate font-medium text--700 hover:underline cursor-pointer"
                            title="View customer"
                          >
                            {b.customerName}
                          </button>

                          <span className="rounded-full bg--50 px-2 py-0.5 text-[11px] font-medium text--700">
                            {b.frequency}
                          </span>
                          <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[11px] font-medium text-purple-700">
                            {b.serviceName}
                          </span>

                          {b.status === "cancelled" && (
                            <Badge color="failure">Cancelled</Badge>
                          )}
                          {b.status === "upcoming" && (
                            <Badge color="info">Upcoming</Badge>
                          )}

                          {/* Small "Team" chip to navigate to the provider/team */}
                          <button
                            type="button"
                            onClick={() => goToTeam(b.providerId)}
                            className="ml-1 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700 hover:bg-gray-200 cursor-pointer"
                            title="View team/provider"
                          >
                            Team
                          </button>
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-600">
                          <span className="inline-flex items-center gap-1">
                            <HiClock className="h-4 w-4" />
                            {formatTimeRange(b.startIso, b.endIso)}
                          </span>
                          {typeof b.beds === "number" && (
                            <span className="inline-flex items-center gap-1">
                              🛏️ {b.beds} Beds
                            </span>
                          )}
                          {typeof b.baths === "number" && (
                            <span className="inline-flex items-center gap-1">
                              🛁 {b.baths} Baths
                            </span>
                          )}
                          {typeof b.sqft === "number" && (
                            <span className="inline-flex items-center gap-1">
                              ◻️ {b.sqft.toLocaleString()} sqft
                            </span>
                          )}
                        </div>

                        {b.address && (
                          <div className="mt-1 flex items-start gap-1 text-xs text-gray-500">
                            <HiLocationMarker className="mt-0.5 h-4 w-4" />
                            <span className="line-clamp-1">{b.address}</span>
                          </div>
                        )}

                        {(b.rating || b.feedback) && b.status !== "upcoming" && (
                          <div className="mt-2 flex items-center justify-between">
                            <div className="flex items-center gap-0.5 text-yellow-500">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <HiStar
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < Math.round(b.rating ? b.rating : 0)
                                      ? ""
                                      : "opacity-30"
                                  }`}
                                />
                              ))}
                            </div>
                            <div className="ml-3 flex-1 text-right text-xs text-gray-500">
                              {b.feedback || "—"}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
