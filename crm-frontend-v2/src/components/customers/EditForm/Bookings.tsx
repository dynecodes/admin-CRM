// src/components/Customers/EditForm/Bookings.tsx
import * as React from "react";
import { Badge } from "flowbite-react";
import { HiClock, HiLocationMarker, HiStar, HiSelector } from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import { useProviders } from "../../../hooks/Providers/useProviders";
import type { CustomerBooking } from "../../../types/customers";
import { getTeamById } from "../../../utils/mockProvidersData";

type Props = {
  customerId: number;
  customerName?: string;
  /** bookings array that comes directly from /customers/:id response */
  initialBookings?: any[];
};

type Tab = "completed" | "upcoming" | "cancelled" | "feedback";

/* ----------------- helpers ----------------- */
function fmtTime(d: Date) {
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatTimeRange(startIso?: string, endIso?: string) {
  if (!startIso) return "—";
  const start = new Date(startIso);
  const end = endIso ? new Date(endIso) : undefined;
  return end ? `${fmtTime(start)} – ${fmtTime(end)}` : fmtTime(start);
}

/** Normalize backend status to UI buckets; treat `draft` (and friends) as "upcoming". */
const normalizeStatus = (raw?: string, startIso?: string) => {
  const s = String(raw || "").toLowerCase();

  const UPCOMING = [
    "upcoming",
    "draft",
    "scheduled",
    "confirmed",
    "assigned",
    "booked",
    "pending",
  ];
  if (UPCOMING.includes(s)) return "upcoming";
  if (["completed", "done", "finished"].includes(s)) return "completed";
  if (["cancelled", "canceled", "void", "no_show", "no-show"].includes(s))
    return "cancelled";

  // Fallback: infer by time
  if (startIso) return new Date(startIso).getTime() >= Date.now() ? "upcoming" : "completed";
  return "upcoming";
};

export default function CustomerBookings({
  customerId,
  customerName,
  initialBookings,
}: Props) {
  // keep used so lint doesn’t complain if we don’t need them later
  void customerId;
  void customerName;

  const navigate = useNavigate();
  const pathPrefix = window.location.pathname.split("/")[1] || "";
  const { providers } = useProviders();

 const goToBooking = (bookingId?: number) => {
  if (!bookingId) return;
  navigate(`/${pathPrefix}/bookings/edit/${bookingId}`);
};


  const [raw, setRaw] = React.useState<CustomerBooking[]>([]);
  const [tab, setTab] = React.useState<Tab>("upcoming"); // default to Upcoming
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement | null>(null);

   React.useEffect(() => {
    const list = Array.isArray(initialBookings) ? initialBookings : [];

    const mapped: CustomerBooking[] = list.map((b: any) => {
      const sched = b.schedule ?? {};
      const rawDate = sched.date;
      const rawTime = sched.time;

      let startIso: string | undefined;
      let endIso: string | undefined;

      if (rawDate) {
        // Build a local Date from the booking date + time
        let start: Date;
        if (typeof rawDate === "string" && rawDate.includes("T")) {
          // already looks like an ISO-ish string
          start = new Date(rawDate);
        } else if (rawTime) {
          // "YYYY-MM-DD" + "HH:MM" -> local date time
          start = new Date(`${rawDate}T${rawTime}`);
        } else {
          // date only, assume midnight local
          start = new Date(`${rawDate}T00:00`);
        }

        // exactly +2 hours from the start time
        const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);

        startIso = start.toISOString();
        endIso = end.toISOString();
      }

      // provider/team id
      let providerId: number | undefined;
      if (typeof sched.providerId === "number") {
        providerId = sched.providerId;
      } else if (
        typeof sched.providerId === "string" &&
        sched.providerId.trim() !== ""
      ) {
        const parsed = Number(sched.providerId);
        providerId = Number.isFinite(parsed) ? parsed : undefined;
      }

      const provider =
        providers.find((p) => p.id === providerId) ??
        (providerId != null ? getTeamById(providerId) : undefined);

      const teamTitle =
        (provider as any)?.teamTitle ??
        (provider as any)?.name ??
        (providerId != null ? `Team #${providerId}` : "Team");

      const svc = b.service ?? {};
      const freqObj = svc.frequency ?? {};

      const frequencyLabel =
        svc.frequencyLabel ??
        freqObj.frequencyLabel ??
        freqObj.name ??
        "";

      const serviceName = svc.serviceLabel ?? svc.name ?? "";

      const vars: any[] = Array.isArray(svc.variables) ? svc.variables : [];

      const bedsVar = vars.find((v) => /bed/i.test(v.name || ""));
      const bathsVar = vars.find((v) => /bath/i.test(v.name || ""));

      const beds =
        bedsVar != null
          ? Number(
              bedsVar.qty ??
                bedsVar.value ??
                bedsVar.count ??
                bedsVar.quantity ??
                0
            ) || undefined
          : undefined;

      const baths =
        bathsVar != null
          ? Number(
              bathsVar.qty ??
                bathsVar.value ??
                bathsVar.count ??
                bathsVar.quantity ??
                0
            ) || undefined
          : undefined;

      const addr = b.address ?? {};
      const addressParts = [addr.address, addr.city, addr.state, addr.zip]
        .map((x: any) => (x || "").trim())
        .filter(Boolean);
      const address = addressParts.length ? addressParts.join(", ") : undefined;

      return {
        id: b.id,
        startIso,
        endIso,
        status: normalizeStatus(b.status, startIso),
        frequency: frequencyLabel,
        serviceName,
        beds,
        baths,
        sqft:
          svc.squareFeet != null
            ? Number(svc.squareFeet)
            : undefined,
        address,
        rating: b.rating ?? undefined,
        feedback: b.feedback ?? undefined,
        providerId,
        // convenience for rendering
        // @ts-ignore
        _teamTitle: teamTitle,
      } as CustomerBooking & { _teamTitle?: string };
    });

    setRaw(mapped);
  }, [initialBookings, providers]);


  const counts = React.useMemo(
    () => ({
      completed: raw.filter((b) => b.status === "completed").length,
      upcoming: raw.filter((b) => b.status === "upcoming").length,
      cancelled: raw.filter((b) => b.status === "cancelled").length,
      feedback: raw.filter((b) => b.status === "completed" && (b.rating || b.feedback)).length,
    }),
    [raw]
  );

 const filtered = React.useMemo(() => {
  const list =
    tab === "feedback"
      ? raw.filter(
          (b) => b.status === "completed" && (b.rating || b.feedback)
        )
      : raw.filter((b) => b.status === tab);

  return list.sort(
    (a, b) =>
      new Date(a.startIso ?? 0).getTime() -
      new Date(b.startIso ?? 0).getTime()
  );
}, [raw, tab]);


 const grouped = React.useMemo(() => {
  const groups = new Map<string, CustomerBooking[]>();
  filtered.forEach((b) => {
    const key = b.startIso
      ? new Date(b.startIso).toLocaleDateString()
      : "Unknown date";
    const arr = groups.get(key) || [];
    arr.push(b);
    groups.set(key, arr);
  });

  return Array.from(groups.entries()).sort(
    (a, b) =>
      new Date(a[0]).getTime() - new Date(b[0]).getTime()
  );
}, [filtered]);

  const labelMap: Record<Tab, string> = {
    completed: `Completed Bookings (${counts.completed})`,
    upcoming: `Upcoming Bookings (${counts.upcoming})`,
    cancelled: `Cancelled Bookings (${counts.cancelled})`,
    feedback: `Feedback (${counts.feedback})`,
  };

  // close dropdown when clicking outside / ESC
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

  const goToTeam = (providerId?: number) => {
    if (providerId == null) return;
    navigate(`/${pathPrefix}/providers/edit/${providerId}`);
  };

  /* ----------------- render ----------------- */
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
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-gray-50 bg-white"
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
                  <span className="text-gray-500">
                    {t === "completed"
                      ? counts.completed
                      : t === "upcoming"
                      ? counts.upcoming
                      : t === "cancelled"
                      ? counts.cancelled
                      : counts.feedback}
                  </span>
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
              {/* date header */}
              <div className="mb-2 text-xs font-medium text-gray-500">{dateLabel}</div>

              <div className="space-y-3">
                {items.map((b) => {
                  const teamTitle =
                    (b as any)._teamTitle ??
                    (b.providerId != null
                      ? getTeamById(b.providerId)?.teamTitle ?? `Team #${b.providerId}`
                      : "Team");

                  const avatarText = (teamTitle || "Team")
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((s: string) => s[0]?.toUpperCase())
                    .join("");

                  return (
<div
  key={b.id}
  onClick={() => goToBooking(b.id)}
  onKeyDown={(e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      goToBooking(b.id);
    }
  }}
  role="button"
  tabIndex={0}
  className="group flex gap-3 rounded-lg border border-gray-300 p-3 hover:shadow-sm cursor-pointer"
>

                      <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
                        {avatarText || "T"}
                      </div>

                      <div className="min-w-0 flex-1">
                        {/* top row */}
                        <div className="flex flex-wrap items-center gap-2">
                          {b.frequency && (
                            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                              {b.frequency}
                            </span>
                          )}
                          {b.serviceName && (
                            <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[11px] font-medium text-purple-700">
                              {b.serviceName}
                            </span>
                          )}

                          {b.status === "cancelled" && <Badge color="failure">Cancelled</Badge>}
                          {b.status === "upcoming" && <Badge color="info">Upcoming</Badge>}

                          {/* RIGHT SIDE Team chip */}
<button
  type="button"
  onClick={(e) => {
    e.stopPropagation();
    goToTeam(b.providerId);
  }}
  className="ml-auto rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-blue-700 hover:bg-gray-200 cursor-pointer"
  title="View team/provider"
>
  {teamTitle}
</button>

                        </div>

                        {/* details */}
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
                                    i < Math.round(b.rating ? b.rating : 0) ? "" : "opacity-30"
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
