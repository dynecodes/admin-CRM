import * as React from "react";
import { useMemo, useState, useEffect, useRef } from "react";
import { Link, useParams,  useNavigate } from "react-router-dom";
import { Button } from "flowbite-react";
import {
  HiOutlineMail,
  HiOutlinePhone,
  HiLocationMarker,
  HiPlus,
  HiChevronRight, 
  HiChevronLeft, 
} from "react-icons/hi";

import { useLeads } from "../../hooks/Leads/useLeads";
import { useProviders } from "../../hooks/Providers/useProviders";
import { useFunnels } from "../../hooks/Leads/useFunnels";
import FilterSection from "../../components/ui/AppDataTable/FilterSection";
import FunnelFormModal from "../../components/leads/FunnelForm";
import LeadForm from "./LeadForm";
import { createPortal } from "react-dom";

/* ============ helpers ============ */
type StageKey = string;
const keyify = (s: string) => s.toLowerCase().trim().replace(/\s+/g, "-");

const safeIso = (d?: string | null) => {
  if (!d) return "";
  try {
    const t = new Date(d);
    if (!Number.isNaN(t.getTime())) return t.toISOString();
  } catch {}
  return "";
};

const formatDate = (iso?: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

/** Decide if a raw lead belongs to the currently opened funnel (STRICT ONLY) */
function belongsToFunnel(l: any, funnel: any): boolean {
  if (!funnel) return false;

  // strict matches only
  if (l?.funnelId != null && funnel?.id != null) {
    if (Number(l.funnelId) === Number(funnel.id)) return true;
  }
  if (l?.funnelSlug && funnel?.slug) {
    if (String(l.funnelSlug) === String(funnel.slug)) return true;
  }
  if (l?.sourceId && funnel?.sourceId) {
    if (String(l.sourceId) === String(funnel.sourceId)) return true;
  }

  // 🚫 Removed legacy name-based fallback that was pulling in mock leads
  return false;
}

/* ============ types ============ */
type LeadCard = {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  city?: string;
  createdIso: string;
  interestedService?: string;
  source?: string;
  stage: StageKey;
  providerName?: string;
};

/* Display mapping for funnel.sourceId chip */
const SOURCE_LABEL: Record<string, string> = {
  lead_form: "Lead Form",
  quote_form: "Quote Form",
  website: "Website",
};

/* ============ page ============ */
const FunnelBoardPage: React.FC = () => {
  const params = useParams<{ slug: string }>();

  const scope =
    (typeof window !== "undefined"
      ? window.location.pathname.split("/")[1]
      : "admin") || "admin";
  const leadsUrl = `/${scope}/leads`;

  // hooks
  const leadsCtx = useLeads() as any;
  const { leads, updateLead, refresh: refreshLeads } = leadsCtx;
  const { providers } = useProviders();
  const { findBySlug, update, add, refresh } = useFunnels();

  const funnel = React.useMemo(
    () => findBySlug(params.slug || ""),
    [findBySlug, params.slug]
  );



  const [leadModalOpen, setLeadModalOpen] = useState(false);
const openLeadModal = () => setLeadModalOpen(true);
const closeLeadModal = () => setLeadModalOpen(false);

// close on ESC
useEffect(() => {
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") setLeadModalOpen(false);
  };
  if (leadModalOpen) document.addEventListener("keydown", onKey);
  return () => document.removeEventListener("keydown", onKey);
}, [leadModalOpen]);

// prevent body scroll while open (optional)
useEffect(() => {
  if (!leadModalOpen) return;
  const prev = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  return () => {
    document.body.style.overflow = prev;
  };
}, [leadModalOpen]);

const navigate = useNavigate();

  // single source of truth for stages (fallback only if funnel missing)
  const columnDefs =
    funnel?.stages ?? [
      { id: "new", name: "New", color: "#DBEAFE" },
      { id: "contacted", name: "Contacted", color: "#E9D5FF" },
      { id: "qualified", name: "Qualified", color: "#DCFCE7" },
      { id: "proposal", name: "Proposal Sent", color: "#FEF3C7" },
      { id: "won", name: "Won", color: "#BBF7D0" },
    ];
  const stageKeys = columnDefs.map((c) => keyify(c.name));

  /* provider lookup */
  const providerNameById = useMemo(() => {
    const map = new Map<number, string>();
    (providers ?? []).forEach((p: any) => {
      if (typeof p?.id === "number")
        map.set(p.id, p.teamTitle ?? p.name ?? `Team #${p.id}`);
    });
    return map;
  }, [providers]);

  /* optimistic stage overrides (id -> stageKey) */
  const [stageOverrides, setStageOverrides] = useState<
    Record<number, StageKey>
  >({});

  async function persistStageChange(leadId: number, newStageKey: StageKey) {
    try {
      if (typeof updateLead === "function") {
        await updateLead(leadId, { stage: newStageKey });
        await refreshLeads?.();
      } else {
        console.warn(
          "[FunnelBoard] updateLead not available; stage change is UI-only."
        );
      }
    } catch (err) {
      console.error("[FunnelBoard] failed to persist stage:", err);
      // revert optimistic change on error
      setStageOverrides((prev) => {
        const copy = { ...prev };
        delete copy[leadId];
        return copy;
      });
    }
  }

  const allCards = useMemo<LeadCard[]>(() => {
    const inThisFunnel = (leads ?? []).filter((l: any) =>
      belongsToFunnel(l, funnel)
    );

    const rows: LeadCard[] = inThisFunnel.map((l: any) => {
      const id: number =
        typeof l?.id === "number" ? l.id : Number(l?.leadId ?? l?.ID ?? 0);
      const first =
        l?.firstName ?? l?.first_name ?? l?.customer?.firstName ?? "";
      const last =
        l?.lastName ?? l?.last_name ?? l?.customer?.lastName ?? "";
      const company = l?.company ?? l?.businessName;
      const name =
        `${first ?? ""} ${last ?? ""}`.trim() ||
        company?.trim() ||
        l?.name?.trim() ||
        "(no name)";
      const email = l?.email ?? l?.customer?.email;
      const phone = l?.phone ?? l?.customer?.phone;
      const city =
        l?.city ??
        l?.address?.city ??
        l?.customer?.address?.city ??
        l?.locationCity;
      const createdIso =
        safeIso(l?.createdAt ?? l?.created_at) ||
        safeIso(l?.createdDate) ||
        new Date().toISOString();

      const source =
        l?.source ?? l?.funnel ?? l?.origin ?? l?.leadSource ?? undefined;

      const rawProvider = l?.providerId ?? l?.assignedProviderId ?? l?.ownerId;
      const providerId =
        typeof rawProvider === "number"
          ? rawProvider
          : Number.isFinite(Number(rawProvider))
          ? Number(rawProvider)
          : undefined;
      const providerName = providerId
        ? providerNameById.get(providerId)
        : undefined;

      // base key from data
      const normalized = keyify((l?.stage ?? l?.status ?? "new").toString());
      const baseKey = stageKeys.includes(normalized) ? normalized : stageKeys[0];

      // apply optimistic override if present
      const matchedKey = stageOverrides[id] ? stageOverrides[id] : baseKey;

      return {
        id,
        name,
        email,
        phone,
        city,
        createdIso,
        interestedService: l?.serviceName,
        source,
        stage: matchedKey,
        providerName,
      };
    });

    return rows.sort(
      (a, b) => +new Date(b.createdIso) - +new Date(a.createdIso)
    );
  }, [leads, funnel, providerNameById, stageKeys, stageOverrides]);

  /* view + filters */
  const [view, setView] = useState<"kanban" | "table">("kanban");
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<"all" | StageKey>("all");
  const [sortKey, setSortKey] = useState<"newest" | "name">("newest");
  const [, setPage] = useState(1); // for FilterSection API

  type Option = { value: string; label: string };
  const filterOptions = useMemo<Option[]>(
    () => [
      { value: "all", label: "All" },
      ...stageKeys.map((k, i) => ({
        value: k,
        label: columnDefs[i]?.name ?? k,
      })),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stageKeys.join("|")]
  );
  const sortOptions = useMemo(
    () => [
      { value: "newest", label: "Newest" },
      { value: "name", label: "Name" },
    ],
    []
  );

  const visibleCards = useMemo(() => {
    let list = allCards;
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.email || "").toLowerCase().includes(q) ||
          (c.phone || "").toLowerCase().includes(q) ||
          (c.city || "").toLowerCase().includes(q)
      );
    }
    if (stageFilter !== "all")
      list = list.filter((c) => c.stage === stageFilter);

    if (sortKey === "name")
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    else
      list = [...list].sort(
        (a, b) => +new Date(b.createdIso) - +new Date(a.createdIso)
      );

    return list;
  }, [allCards, query, stageFilter, sortKey]);

  /* bucket for kanban */
  const [cardsByStage, setCardsByStage] = useState<Record<StageKey, LeadCard[]>>(
    {}
  );
useEffect(() => {
  const next: Record<StageKey, LeadCard[]> = {};
  stageKeys.forEach(k => (next[k] = []));
  visibleCards.forEach(c => (next[c.stage] ??= []).push(c));

  // shallow compare
  let changed = false;
  for (const k of stageKeys) {
    const prevIds = (cardsByStage[k] || []).map(c => c.id).join(',');
    const nextIds = (next[k] || []).map(c => c.id).join(',');
    if (prevIds !== nextIds) {
      changed = true;
      break;
    }
  }
  if (changed) setCardsByStage(next);
}, [visibleCards, stageKeys, cardsByStage]);

  /* DnD for kanban */
  const dragIdRef = useRef<string | null>(null);
  const [overStage, setOverStage] = useState<StageKey | null>(null);

  const onDragStart = (card: LeadCard) => (e: React.DragEvent) => {
    const payload = JSON.stringify({ id: card.id, stage: card.stage });
    dragIdRef.current = payload;
    e.dataTransfer.setData("application/json", payload);
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragEnterCol = (stageKey: StageKey) => (e: React.DragEvent) => {
    e.preventDefault();
    setOverStage(stageKey);
  };

  const onDragOverCol = (stageKey: StageKey) => (e: React.DragEvent) => {
    e.preventDefault();
    setOverStage(stageKey);
    e.dataTransfer.dropEffect = "move";
  };

 const onDragLeaveCol = (stageKey: StageKey) => (_e: React.DragEvent) => {
  if (overStage === stageKey) setOverStage(null);
};


  const onDropToColumn = (stageKey: StageKey) => (e: React.DragEvent) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData("application/json") || dragIdRef.current;
    setOverStage(null);
    if (!raw) return;
    try {
      const { id, stage: fromStage } = JSON.parse(raw) as {
        id: number;
        stage: StageKey;
      };
      if (fromStage === stageKey) return;

      // Optimistic UI in kanban buckets
      setCardsByStage((prev) => {
        const fromList = [...(prev[fromStage] || [])];
        const toList = [...(prev[stageKey] || [])];
        const idx = fromList.findIndex((c) => c.id === id);
        if (idx === -1) return prev;
        const [moved] = fromList.splice(idx, 1);
        toList.unshift({ ...moved, stage: stageKey });
        return { ...prev, [fromStage]: fromList, [stageKey]: toList };
      });

      // Optimistic override for table/allCards
      setStageOverrides((prev) => ({ ...prev, [id]: stageKey }));

      // Persist
      persistStageChange(id, stageKey);
    } catch {}
  };

  /* horizontal scroller + sizing */
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [, setShowNudge] = useState(false);
  const hoverZoneRef = useRef<HTMLDivElement | null>(null);
  const COL_WIDTH = 300;
  const GAP = 20;

useEffect(() => {
  const interval = setInterval(() => {
    setShowNudge(true);
    setTimeout(() => setShowNudge(false), 2500);
  }, 10000);
  return () => clearInterval(interval);
}, []);

  useEffect(() => {
    const el = hoverZoneRef.current;
    if (!el) return;
    const onEnter = () => setShowNudge(true);
    const onLeave = () => setShowNudge(false);
    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mouseenter", onEnter);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, []);
  const [colHeight, setColHeight] = useState<number>(600);
  useEffect(() => {
    const measure = () => {
      const scrollerTop =
        scrollerRef.current?.getBoundingClientRect().top ?? 0;
      const available = window.innerHeight - scrollerTop - 16;
      setColHeight(Math.max(520, Math.floor(available)));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // ===== Funnel Settings modal control =====
  const [settingsOpen, setSettingsOpen] = useState(false);
  const openSettings = () => setSettingsOpen(true);
  const closeSettings = () => setSettingsOpen(false);

  /* ============ render ============ */
  if (!funnel) {
    return (
      <div className="px-4 pb-10">
        <nav className="mb-4" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 text-sm text-gray-700 md:space-x-2">
            <li className="inline-flex items-center">
              <Link
                to={leadsUrl}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-700"
              >
                Leads
              </Link>
            </li>
          </ol>
        </nav>
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
          Funnel not found
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Go back to{" "}
          <Link to={leadsUrl} className="text-blue-600 underline">
            Leads
          </Link>{" "}
          and open a funnel.
        </p>
      </div>
    );
  }
const [canScrollLeft, setCanScrollLeft] = useState(false);
const [canScrollRight, setCanScrollRight] = useState(false);

const updateScrollButtons = React.useCallback(() => {
  const el = scrollerRef.current;
  if (!el) return;

  const left = el.scrollLeft > 1; // small threshold
  const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;

  setCanScrollLeft(prev => (prev !== left ? left : prev));
  setCanScrollRight(prev => (prev !== right ? right : prev));
}, []);
;

useEffect(() => {
  const el = scrollerRef.current;
  if (!el) return;

  // Initialize once
  updateScrollButtons();

  // Attach scroll listener
  el.addEventListener("scroll", updateScrollButtons);

  return () => el.removeEventListener("scroll", updateScrollButtons);
}, []); // <- run only on mount, no dependencies


  // modal initial (for editing funnel settings)
const modalInitial = React.useMemo(() => {
  return {
    name: funnel.name,
    sourceId: funnel.sourceId ?? "",
    stages: funnel.stages ?? [],
    id: funnel.id,
    slug: funnel.slug,
  };
}, [funnel]);

  return (
    
    <div className="relative px-4 pb-10">
      <style>{`
        .no-scrollbar { -ms-overflow-style:none; scrollbar-width:none; }
        .no-scrollbar::-webkit-scrollbar{ display:none; }

        .kanban-card { cursor: grab; }
        .kanban-card:active { cursor: grabbing; }

        .kanban-col.active { box-shadow: 0 0 0 2px rgba(59,130,246,.35) inset; }

        .drop-zone {
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px dashed #D1D5DB;
          background: rgba(255,255,255,0.5);
          border-radius: 0.75rem;
          transition: all 160ms ease;
          min-height: 48px;
          margin-top: 12px;
        }
        .drop-zone.expanded {
          min-height: 78px;
          border-color: #60A5FA;
          background: rgba(219, 234, 254, 0.45);
        }
      `}</style>

      {/* Title */}
      <nav className="mb-3 flex items-center text-sm text-gray-600">
        <ol className="inline-flex items-center space-x-2">
          <li>
            <button
              onClick={() => navigate(-1)}
              className="cursor-pointer font-medium text-gray-600 hover:text-gray-900"
            >
              Leads
            </button>
          </li>

          <li aria-hidden="true" className="text-gray-400">›</li>

          <li aria-current="page">
            <span className="font-medium text-gray-500">
              {funnel.name}
            </span>
          </li>
        </ol>
      </nav>

        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            {funnel.name}
          </h1>

          {/* Source chip */}
          {funnel?.sourceId && (
            <div className="mt-1 text-sm text-gray-500">
              Source:{" "}
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-700">
                {SOURCE_LABEL[funnel.sourceId] ?? funnel.sourceId}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 mb-2 justify-end">
          <Button
            color="light"
            className="h-10 cursor-pointer"
            onClick={openSettings}
            title="Funnel Settings"
          >
            Funnel Settings
          </Button>
            <Button
              color="gray"
              onClick={openLeadModal}
              className="h-10 cursor-pointer"
            >
              Add New Lead
            </Button>
        </div>
    

      {/* View toggle */}
      <div className="mb-4 gap-5 mt-6 hidden overflow-hidden rounded-lg border border-gray-200 bg-white p-1 sm:inline-flex">
        <button
          className={`cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium ${
            view === "kanban"
              ? "bg-blue-100 text-blue-700"
              : "text-gray-500 hover:bg-gray-100"
          }`}
          onClick={() => setView("kanban")}
        >
          Kanban
        </button>
        <button
          className={`cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium ${
            view === "table"
              ? "bg-blue-100 text-blue-700"
              : "text-gray-500 hover:bg-gray-100"
          }`}
          onClick={() => setView("table")}
        >
          Table
        </button>
      </div>

      {/* Filters */}
      <FilterSection
        showSearch
        search={query}
        setSearch={setQuery}
        searchPlaceholder="Search Leads"
        showFilter
        filterOptions={filterOptions}
        filterKey="stage"
        filterLabel="Filter by"
        statusFilter={stageFilter}
        setStatusFilter={(v) => setStageFilter(v as any)}
        setCurrentPage={setPage}
        showSort
        sortOptions={sortOptions}
        sortBy={sortKey}
        setSortBy={(v) => setSortKey(v as any)}
      />

        {/* TABLE */}
        {view === "table" && (
          <div className="mt-5 overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div
              className="border-b border-gray-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500"
              style={{
                display: "grid",
                gridTemplateColumns: "40px minmax(260px,1.6fr) 1fr 1.2fr 1fr 120px",
                columnGap: "16px",
              }}
            >

              <div>Lead name</div>
              <div>Phone</div>
              <div>Email</div>
              <div>Status</div>
              <div className="text-right">Action</div>
            </div>

            <ul className="divide-y divide-gray-200">
              {visibleCards.map((row) => (
                <li
                  key={row.id}
                  className="px-4 py-3"
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "minmax(260px,1.6fr) 1fr 1.2fr 1fr 120px",
                    columnGap: "16px",
                    alignItems: "center",
                  }}
                >
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-gray-900">
                      {row.name}
                    </div>
                    <div className="mt-0.5 space-x-2 text-xs text-gray-600">
                      {row.city && (
                        <span className="inline-block truncate">{row.city}</span>
                      )}
                      {/* <span className="inline-block text-gray-400">•</span> */}
                      <span className="inline-block">
                        {formatDate(row.createdIso)}
                      </span>
                    </div>
                  </div>

                  <div className="truncate text-sm text-gray-700">
                    {row.phone ?? "—"}
                  </div>

                  <div className="truncate text-sm text-gray-700">
                    {row.email ?? "—"}
                  </div>

                  <div className="text-sm">
                    <span
                      className="inline-flex items-center rounded-full  px-2.5 py-1 text-sm text-gray-700"
                    
                    >
                      {
                        (columnDefs.find(
                          (c) => keyify(c.name) === row.stage
                        )?.name) ?? row.stage
                      }
                    </span>
                  </div>

                  <div className="flex justify-end">
                  
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

      {/* KANBAN */}
      {view === "kanban" && (
        <div
          ref={scrollerRef}
          className="no-scrollbar cursor-pointer relative mt-5 overflow-x-auto overflow-y-hidden"
          style={{ paddingBottom: 2 }}
          onClick={(e) => {
            const el = scrollerRef.current;
            if (!el) return;

            const { left, width } = el.getBoundingClientRect();
            const clickX = e.clientX - left;

            const COL_TOTAL = COL_WIDTH + GAP;

            if (clickX > width / 2) {
              // clicked right half → scroll right
              el.scrollBy({ left: COL_TOTAL, behavior: "smooth" });
            } else {
              // clicked left half → scroll left
              el.scrollBy({ left: -COL_TOTAL, behavior: "smooth" });
            }
          }}
        >
          <div className="flex w-max gap-5">
            {columnDefs.map((col) => {
              const key = keyify(col.name);
              const items = cardsByStage[key] || [];
              const isActive = overStage === key;

              return (
                <section
                  key={col.id ?? key}
                  className={`kanban-col flex-shrink-0 rounded-2xl border border-gray-200 bg-gray-50 ${
                    isActive ? "active" : ""
                  }`}
                  style={{
                    minWidth: COL_WIDTH,
                    maxWidth: COL_WIDTH,
                    width: COL_WIDTH,
                    height: colHeight,
                  }}
                  onDragEnter={onDragEnterCol(key)}
                  onDragOver={onDragOverCol(key)}
                  onDragLeave={onDragLeaveCol(key)}
                  onDrop={onDropToColumn(key)}
                >
                  {/* column header */}
                  <div
                    className="flex items-center justify-between rounded-t-2xl px-3 py-2"
                    style={{ background: col.color }}
                  >
                    <div className="text-sm font-semibold text-gray-800">
                      {col.name}
                    </div>
                    <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-white/80 px-2 text-xs font-semibold text-gray-700">
                      {items.length}
                    </span>
                  </div>

                  {/* cards */}
                  <div className="flex-1 space-y-4 overflow-y-auto px-3 pb-4 pt-3">
                    {items.map((card) => (
                      <article
                        key={card.id}
                        draggable
                        onDragStart={onDragStart(card)}
                        className="kanban-card rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                        title="Drag to another stage"
                      >
                        {/* card content */}
                        <div className="text-sm font-semibold text-gray-900">
                          {card.name}
                        </div>
                        <div className="mt-2 space-y-1 text-xs text-gray-600">
                          {card.email && (
                            <div className="flex items-center gap-2">
                              <HiOutlineMail className="h-4 w-4 text-gray-400" />
                              <span className="truncate">{card.email}</span>
                            </div>
                          )}
                          {card.phone && (
                            <div className="flex items-center gap-2">
                              <HiOutlinePhone className="h-4 w-4 text-gray-400" />
                              <span className="truncate">{card.phone}</span>
                            </div>
                          )}
                          {card.city && (
                            <div className="flex items-center gap-2">
                              <HiLocationMarker className="h-4 w-4 text-gray-400" />
                              <span className="truncate">{card.city}</span>
                            </div>
                          )}
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          {card.interestedService && (
                            <span className="rounded-md border border-gray-300 bg-gray-50 px-2 py-0.5 text-[11px] text-gray-700">
                              {card.interestedService}
                            </span>
                          )}
                          <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-700">
                            Ready
                          </span>
                          <span className="ml-auto text-[11px] text-gray-500">
                            {formatDate(card.createdIso)}
                          </span>
                        </div>
                      </article>
                    ))}

                    <div className={`drop-zone ${isActive ? "expanded" : ""}`}>
                      <HiPlus
                        className={`${isActive ? "h-6 w-6" : "h-5 w-5"} text-gray-400`}
                      />
                    </div>
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      )}

      <FunnelFormModal
        open={settingsOpen}
        onClose={closeSettings}
        initial={modalInitial}
        onSave={async (payload) => {
          if (typeof funnel?.id === "number") {
            update(funnel.id, {
              name: payload.name,
              sourceId: payload.sourceId ?? null,
              stages: payload.stages,
            });
          } else {
            add({
              name: payload.name,
              sourceId: payload.sourceId ?? null,
              stages: payload.stages,
            });
          }
          await refresh?.();
          closeSettings();
        }}
      />


      {leadModalOpen &&
  createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="lead-create-title"
      className="fixed inset-0 z-[9998] flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={closeLeadModal}
      />

      {/* Panel */}
      <div className="relative z-[9999] w-full max-w-3xl rounded-2xl bg-white shadow-2xl ring-1 ring-black/10">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-300 px-5 py-4">
          <h2 id="lead-create-title" className="text-lg font-semibold text-gray-900">
            Add New Lead
          </h2>
        </div>

        {/* Content */}
        <div className="px-5 py-4">
          <LeadForm
            selectedFunnelId={typeof funnel?.id === "number" ? funnel.id : undefined}
            onSuccess={async () => {
              await refreshLeads?.();
              closeLeadModal();
            }}
            onCancel={closeLeadModal}
          />
        </div>
      </div>
    </div>,
    document.body
  )
}

    </div>
  );
};

export default FunnelBoardPage;
