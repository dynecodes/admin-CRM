// // src/App/Leads/index.tsx
// import React, { useMemo, useRef, useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import AppDataTable from "../../components/ui/AppDataTable";
// import { Button, Checkbox } from "flowbite-react";
// import { HiChevronDown, HiPlus } from "react-icons/hi";
// import { useProviders } from "../../hooks/Providers/useProviders";
// import { useLeads } from "../../hooks/Leads/useLeads";
// import FunnelFormModal from "../../components/leads/FunnelForm";
// import { useFunnels } from "../../hooks/Leads/useFunnels";

// /* ========================= Types & Helpers ========================= */
// type LeadStage = "new" | "contacted" | "qualified" | "quoted" | "converted" | "lost";

// type LeadRow = {
//   id: number;
//   name: string;
//   email?: string;
//   phone?: string;
//   city?: string;
//   createdIso: string;
//   nextFollowUpIso?: string;
//   interestedService?: string;
//   source?: string;
//   stage: LeadStage;
//   providerId?: number;
//   providerName?: string;
//   score?: number;
// };

// function toIso(date?: string | null, time?: string | null) {
//   if (!date) return "";
//   return `${date}T${time ?? "09:00"}:00`;
// }
// function safeIso(d?: string | null) {
//   if (!d) return "";
//   try {
//     const date = new Date(d);
//     if (!Number.isNaN(date.getTime())) return date.toISOString().slice(0, 16);
//   } catch {}
//   return d && d.length >= 16 ? d.slice(0, 16) : (d || "");
// }
// function formatDate(iso: string) {
//   const d = new Date(iso);
//   return isNaN(d.getTime())
//     ? "-"
//     : d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
// }

// function slugify(s: string) {
//   return s.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
// }

// /* ========================= Component ========================= */
// const Leads: React.FC = () => {
//   const navigate = useNavigate();
//   const { providers } = useProviders();
//   const { leads } = useLeads();
//   const { funnels, add } = useFunnels();

//   const scope =
//     (typeof window !== "undefined" ? window.location.pathname.split("/")[1] : "admin") || "admin";

//   const providerNameById = useMemo(() => {
//     const map = new Map<number, string>();
//     (providers ?? []).forEach((p: any) => {
//       if (typeof p?.id === "number") {
//         map.set(p.id, p.teamTitle ?? p.name ?? `Team #${p.id}`);
//       }
//     });
//     return map;
//   }, [providers]);

//   const rows: LeadRow[] = useMemo(() => {
//     const list: LeadRow[] = (leads ?? []).map((l: any) => {
//       const id: number = typeof l?.id === "number" ? l.id : Number(l?.leadId ?? l?.ID ?? 0);

//       const first = l?.firstName ?? l?.first_name ?? l?.customer?.firstName ?? "";
//       const last = l?.lastName ?? l?.last_name ?? l?.customer?.lastName ?? "";
//       const company = l?.company ?? l?.businessName;
//       const name =
//         `${first ?? ""} ${last ?? ""}`.trim() ||
//         company?.trim() ||
//         l?.name?.trim() ||
//         "(no name)";

//       const email = l?.email ?? l?.customer?.email;
//       const phone = l?.phone ?? l?.customer?.phone;
//       const city =
//         l?.city ?? l?.address?.city ?? l?.customer?.address?.city ?? l?.locationCity;

//       const createdIso =
//         safeIso(l?.createdAt ?? l?.created_at) ||
//         safeIso(toIso(l?.createdDate, l?.createdTime)) ||
//         safeIso(new Date().toISOString().slice(0, 16));

//       const nextFollowUpIso =
//         safeIso(l?.nextFollowUp ?? l?.next_follow_up) ||
//         safeIso(toIso(l?.followUpDate, l?.followUpTime)) ||
//         undefined;

//       const stageRaw = (l?.stage ?? l?.status ?? "new").toString().toLowerCase();
//       const stage: LeadStage =
//         stageRaw === "contacted" ||
//         stageRaw === "qualified" ||
//         stageRaw === "quoted" ||
//         stageRaw === "converted" ||
//         stageRaw === "lost"
//           ? (stageRaw as LeadStage)
//           : "new";

//       const source = l?.source ?? l?.funnel ?? l?.origin ?? l?.leadSource ?? undefined;

//       const interestedService =
//         l?.serviceName ??
//         l?.interestedService ??
//         l?.service?.name ??
//         (l?.serviceKey === "deep"
//           ? "Deep Cleaning"
//           : l?.serviceKey === "moveInOut"
//           ? "Move In/Out"
//           : l?.serviceKey
//           ? "Standard Cleaning"
//           : undefined);

//       const rawProvider = l?.providerId ?? l?.assignedProviderId ?? l?.ownerId;
//       const providerId =
//         typeof rawProvider === "number"
//           ? rawProvider
//           : Number.isFinite(Number(rawProvider))
//           ? Number(rawProvider)
//           : undefined;
//       const providerName = providerId ? providerNameById.get(providerId) : undefined;

//       const score = typeof l?.score === "number" ? l.score : undefined;

//       return {
//         id,
//         name,
//         email,
//         phone,
//         city,
//         createdIso,
//         nextFollowUpIso,
//         interestedService,
//         source,
//         stage,
//         providerId,
//         providerName,
//         score,
//       };
//     });

//     return list.sort((a, b) => +new Date(b.createdIso) - +new Date(a.createdIso));
//   }, [leads, providerNameById]);

//   /* ========================= Funnels list (dynamic) ========================= */
//   const [showFunnelNavMenu, setShowFunnelNavMenu] = useState(false);
//   const [showFunnelModal, setShowFunnelModal] = useState(false);
//   const funnelNavBtnRef = useRef<HTMLButtonElement | null>(null);
//   const funnelNavMenuRef = useRef<HTMLDivElement | null>(null);

//   useEffect(() => {
//     function onDocClick(e: MouseEvent) {
//       const t = e.target as Node;
//       if (
//         funnelNavMenuRef.current &&
//         !funnelNavMenuRef.current.contains(t) &&
//         funnelNavBtnRef.current &&
//         !funnelNavBtnRef.current.contains(t)
//       ) {
//         setShowFunnelNavMenu(false);
//       }
//     }
//     function onKey(e: KeyboardEvent) {
//       if (e.key === "Escape") setShowFunnelNavMenu(false);
//     }
//     document.addEventListener("mousedown", onDocClick);
//     document.addEventListener("keydown", onKey);
//     return () => {
//       document.removeEventListener("mousedown", onDocClick);
//       document.removeEventListener("keydown", onKey);
//     };
//   }, []);

//   const openFunnel = (slugOrName: string) => {
//     const slug = slugify(slugOrName);
//     navigate(`/${scope}/leads/funnels/${slug}?label=${encodeURIComponent(slugOrName)}`);
//   };

//   /* ========================= Navigation ========================= */
//   const startNew = () => navigate(`/${scope}/leads/new`);
//   const handleRow = (row: LeadRow) => navigate(`/${scope}/leads/edit/${row.id}`);

//   /* ========================= Selection ========================= */
//   const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
//   const headerCheckboxRef = useRef<HTMLInputElement>(null);

//   const allChecked = rows.length > 0 && selectedIds.size === rows.length;
//   const someChecked = selectedIds.size > 0 && selectedIds.size < rows.length;

//   useEffect(() => {
//     if (headerCheckboxRef.current) headerCheckboxRef.current.indeterminate = someChecked;
//   }, [someChecked]);

//   const toggleSelectAll = () => {
//     setSelectedIds((prev) => (prev.size ? new Set() : new Set(rows.map((r) => r.id))));
//   };
//   const toggleRow = (id: number) =>
//     setSelectedIds((prev) => {
//       const next = new Set(prev);
//       next.has(id) ? next.delete(id) : next.add(id);
//       return next;
//     });

//   /* ========================= Columns ========================= */
//   const columns = useMemo(
//     () => [
//       {
//         name: (
//           <Checkbox
//             ref={headerCheckboxRef}
//             checked={allChecked}
//             onChange={(e) => {
//               e.stopPropagation();
//               toggleSelectAll();
//             }}
//             className="cursor-pointer"
//           />
//         ),
//         width: "56px",
//         ignoreRowClick: true,
//         cell: (row: LeadRow) => (
//           <Checkbox
//             checked={selectedIds.has(row.id)}
//             onClick={(e) => e.stopPropagation()}
//             onChange={() => toggleRow(row.id)}
//             className="cursor-pointer"
//           />
//         ),
//       },
//       {
//         name: "Lead",
//         selector: (row: LeadRow) => row.name,
//         sortable: true,
//         width: "250px",
//         cell: (row: LeadRow) => (
//           <button
//             type="button"
//             className="cursor-pointer text-left"
//             onClick={(e) => {
//               e.stopPropagation();
//               handleRow(row);
//             }}
//             title="Open lead"
//           >
//             <div className="text-sm font-semibold text-gray-900">{row.name}</div>
//             {!!row.email && <div className="text-xs text-gray-500">{row.email}</div>}
//             {!!row.phone && <div className="text-xs text-gray-500">{row.phone}</div>}
//           </button>
//         ),
//       },
//       {
//         name: "Source",
//         selector: (row: LeadRow) => row.source ?? "",
//         sortable: true,
//         width: "190px",
//         cell: (row: LeadRow) => (
//           <div className="text-sm">
//             <div className="font-medium text-gray-900">{row.source ?? "Website"}</div>
//           </div>
//         ),
//       },
//       {
//         name: "Service",
//         selector: (row: LeadRow) => row.interestedService ?? "",
//         sortable: true,
//         width: "220px",
//         cell: (row: LeadRow) => (
//           <div className="text-sm">
//             <div className="font-medium text-gray-900">{row.interestedService ?? "Deep Cleaning"}</div>
//           </div>
//         ),
//       },
//       {
//         name: "Assigned Team",
//         selector: (row: LeadRow) => String(row.providerId ?? ""),
//         width: "200px",
//         cell: (row: LeadRow) => (
//           <div className="text-sm">
//             <div className="font-medium text-gray-900">{row.providerName ?? "Unassigned"}</div>
//           </div>
//         ),
//       },
//     ],
//     [allChecked, selectedIds],
//   );

//   /* ========================= Render ========================= */
//   return (
//     <div className="px-4 pb-5 sm:px-5">
//       <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
//         {/* Left: Title */}
//         <div className="flex items-center gap-3">
//           <div className="relative inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-black">
//             <svg
//               className="h-6 w-6 text-white"
//               xmlns="http://www.w3.org/2000/svg"
//               fill="none"
//               viewBox="0 0 24 24"
//               aria-hidden
//             >
//               <path
//                 stroke="currentColor"
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 strokeWidth="2"
//                 d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Zm-3 7H7a4 4 0 0 0-4 4v2h18v-2a4 4 0 0 0-4-4h-4Z"
//               />
//             </svg>
//           </div>

//           <span className="text-2xl font-bold text-gray-900 sm:text-3xl">
//             Leads ({rows.length})
//           </span>
//         </div>

//         {/* Right: Actions (Funnels + Add New Lead) */}
//         <div className="relative flex items-center gap-2">
//           <button
//             ref={funnelNavBtnRef}
//             type="button"
//             onClick={() => setShowFunnelNavMenu((v) => !v)}
//             className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition
//                         ${showFunnelNavMenu ? "border-gray-600 bg-gray-50 text-black-700" : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"}`}
//             title="Open a funnel"
//             aria-haspopup="menu"
//             aria-expanded={showFunnelNavMenu}
//           >
//             <span className="font-medium">Funnels</span>
//             <HiChevronDown
//               className={`h-4 w-4 transition-transform ${showFunnelNavMenu ? "rotate-180" : ""}`}
//               aria-hidden
//             />
//           </button>

//           <Button color="gray" onClick={startNew} className="w-full cursor-pointer sm:w-auto ">
//             Add New Lead
//           </Button>

//           {showFunnelNavMenu && (
//             <div
//               ref={funnelNavMenuRef}
//               role="menu"
//               className="absolute right-0 top-12 z-20 w-62 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg"
//             >
//               {/* Existing funnels */}
//               {funnels.length === 0 && (
//                 <div className="px-3 py-2 text-sm text-gray-500">No funnels yet</div>
//               )}
//               {funnels.map((f) => (
//                 <button
//                   key={f.id}
//                 type="button"
//                   onClick={() => {
//                     setShowFunnelNavMenu(false);
//                     openFunnel(f.slug || f.name);
//                   }}
//                   className="flex w-full cursor-pointer items-center justify-between px-3 py-2 text-left text-sm hover:bg-gray-100"
//                 >
//                   <span>{f.name}</span>
//                 </button>
//               ))}

//               <div className="my-1 h-px bg-gray-100" />

//               {/* Add new funnel */}
//               <button
//                 type="button"
//                 onClick={() => {
//                   setShowFunnelNavMenu(false);
//                   setShowFunnelModal(true);
//                 }}
//                 className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm font-medium text-gray-600 hover:bg-gray-50"
//                 title="Create a new funnel"
//               >
//                 <HiPlus className="h-4 w-4" />
//                 Add New Funnel
//               </button>
//             </div>
//           )}
//         </div>
//       </div>

//       <AppDataTable
//         data={rows}
//         columns={columns}
//         searchPlaceholder="Search Leads"
//         searchKeys={[
//           "name",
//           "email",
//           "phone",
//           "interestedService",
//           "source",
//           "city",
//           "stage",
//           "providerName",
//         ]}
//         filterOptions={[
//           { value: "all", label: "All" },
//           { value: "new", label: "New" },
//           { value: "contacted", label: "Contacted" },
//           { value: "qualified", label: "Qualified" },
//           { value: "quoted", label: "Quoted" },
//           { value: "converted", label: "Converted" },
//           { value: "lost", label: "Lost" },
//         ]}
//         filterKey="stage"
//         defaultFilter="all"
//         onRowClick={handleRow}
//         sortOptions={[
//           {
//             value: "newest",
//             label: "Newest",
//             sortFn: (a: LeadRow, b: LeadRow) =>
//               new Date(b.createdIso).getTime() - new Date(a.createdIso).getTime(),
//           },
//           {
//             value: "nextAction",
//             label: "Next Action",
//             sortFn: (a: LeadRow, b: LeadRow) =>
//               new Date(a.nextFollowUpIso ?? "9999-12-31").getTime() -
//               new Date(b.nextFollowUpIso ?? "9999-12-31").getTime(),
//           },
//           { value: "name", label: "Name", sortFn: (a: LeadRow, b: LeadRow) => a.name.localeCompare(b.name) },
//         ]}
//         defaultSort="newest"
//         paginationOptions={[10, 20, 50, 100]}
//         defaultPerPage={20}
//         mobileCard={{
//           titleField: "name",
//           titleRender: (row: LeadRow) => (
//             <div className="text-sm">
//               <div className="font-semibold text-gray-900">{row.name}</div>
//               <div className="text-xs text-gray-500">
//                 {formatDate(row.createdIso)}
//               </div>
//             </div>
//           ),
//           subtitleRender: (row: LeadRow) =>
//             `${row.interestedService ?? "—"} • ${row.source ?? "—"}`,
//           statusField: "stage",
//           fields: [
//             { key: "providerName", label: "Team" },
//             { key: "city", label: "City" },
//             {
//               key: "nextFollowUpIso",
//               label: "Next Action",
//               render: (value: LeadRow["nextFollowUpIso"] | undefined, row?: LeadRow) => {
//                 const iso = typeof value === "string" && value.length ? value : row?.nextFollowUpIso;
//                 return iso ? `${formatDate(iso)}` : "—";
//               },
//             },
//           ],
//           actions: [
//             {
//               label: "Edit",
//               color: "gray",
//               onClick: (row: LeadRow) => handleRow(row),
//             },
//           ],
//           enableEdit: false,
//         }}
//       />

//       {/* Create Funnel Modal */}
//       <FunnelFormModal
//         open={showFunnelModal}
//         onClose={() => setShowFunnelModal(false)}
//         onSave={async (payload) => {
//           const created = await add(payload);
//           openFunnel(created.slug || created.name);
//         }}
//       />
//     </div>
//   );
// };

// export default Leads;

// src/App/Leads/index.tsx
import React, { useMemo, useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppDataTable from "../../components/ui/AppDataTable";
import { Button, Checkbox } from "flowbite-react";
import { HiChevronDown, HiPlus } from "react-icons/hi";
import { useProviders } from "../../hooks/Providers/useProviders";
import { useLeads } from "../../hooks/Leads/useLeads";
import FunnelFormModal from "../../components/leads/FunnelForm";
import { useFunnels } from "../../hooks/Leads/useFunnels";
import { Dropdown, DropdownItem } from "flowbite-react";

/* ========================= Types & Helpers ========================= */
type LeadStage = "new" | "contacted" | "qualified" | "quoted" | "converted" | "lost";

type LeadRow = {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  city?: string;
  createdIso: string;
  nextFollowUpIso?: string;
  interestedService?: string;
  source?: string;
  stage: LeadStage;
  providerId?: number;
  providerName?: string;
  score?: number;
};

function toIso(date?: string | null, time?: string | null) {
  if (!date) return "";
  return `${date}T${time ?? "09:00"}:00`;
}
function safeIso(d?: string | null) {
  if (!d) return "";
  try {
    const date = new Date(d);
    if (!Number.isNaN(date.getTime())) return date.toISOString().slice(0, 16);
  } catch {}
  return d && d.length >= 16 ? d.slice(0, 16) : (d || "");
}
function formatDate(iso: string) {
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? "-"
    : d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function slugify(s: string) {
  return s.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

/* ========================= Event Tracking ========================= */
const EVENT_MAPPINGS = {
  addLead: "lead_add",
  leadRowSelection: "lead_row_selection",
  leadStageChanged: "lead_stage_changed",
  openFunnel: "funnel_open",
  createFunnel: "funnel_create",
  leadSearch: "lead_search",
  leadFilterApplied: "lead_filter_applied",
};

const trackEvent = (eventName: string, payload?: Record<string, any>) => {
  window.dataLayer = window.dataLayer || [];

  window.dataLayer.push({
    event: eventName,
    ...payload,
  });

  console.log("[Track Event]", eventName, payload);
};


/* ========================= Component ========================= */
const Leads: React.FC = () => {
  const navigate = useNavigate();
  const { providers } = useProviders();
  const { leads } = useLeads();
  const { funnels, add } = useFunnels();

  const scope = (typeof window !== "undefined" ? window.location.pathname.split("/")[1] : "admin") || "admin";

  const providerNameById = useMemo(() => {
    const map = new Map<number, string>();
    (providers ?? []).forEach((p: any) => {
      if (typeof p?.id === "number") {
        map.set(p.id, p.teamTitle ?? p.name ?? `Team #${p.id}`);
      }
    });
    return map;
  }, [providers]);

  const rows: LeadRow[] = useMemo(() => {
    const list: LeadRow[] = (leads ?? []).map((l: any) => {
      const id: number = typeof l?.id === "number" ? l.id : Number(l?.leadId ?? l?.ID ?? 0);

      const first = l?.firstName ?? l?.first_name ?? l?.customer?.firstName ?? "";
      const last = l?.lastName ?? l?.last_name ?? l?.customer?.lastName ?? "";
      const company = l?.company ?? l?.businessName;
      const name =
        `${first ?? ""} ${last ?? ""}`.trim() ||
        company?.trim() ||
        l?.name?.trim() ||
        "(no name)";

      const email = l?.email ?? l?.customer?.email;
      const phone = l?.phone ?? l?.customer?.phone;
      const city =
        l?.city ?? l?.address?.city ?? l?.customer?.address?.city ?? l?.locationCity;

      const createdIso =
        safeIso(l?.createdAt ?? l?.created_at) ||
        safeIso(toIso(l?.createdDate, l?.createdTime)) ||
        safeIso(new Date().toISOString().slice(0, 16));

      const nextFollowUpIso =
        safeIso(l?.nextFollowUp ?? l?.next_follow_up) ||
        safeIso(toIso(l?.followUpDate, l?.followUpTime)) ||
        undefined;

      const stageRaw = (l?.stage ?? l?.status ?? "new").toString().toLowerCase();
      const stage: LeadStage =
        ["contacted", "qualified", "quoted", "converted", "lost"].includes(stageRaw)
          ? (stageRaw as LeadStage)
          : "new";

      const source = l?.source ?? l?.funnel ?? l?.origin ?? l?.leadSource ?? undefined;

      const interestedService =
        l?.serviceName ?? l?.interestedService ?? l?.service?.name ?? (l?.serviceKey === "deep" ? "Deep Cleaning" : l?.serviceKey === "moveInOut" ? "Move In/Out" : l?.serviceKey ? "Standard Cleaning" : undefined);

      const rawProvider = l?.providerId ?? l?.assignedProviderId ?? l?.ownerId;
      const providerId =
        typeof rawProvider === "number"
          ? rawProvider
          : Number.isFinite(Number(rawProvider))
          ? Number(rawProvider)
          : undefined;
      const providerName = providerId ? providerNameById.get(providerId) : undefined;

      const score = typeof l?.score === "number" ? l.score : undefined;

      return {
        id,
        name,
        email,
        phone,
        city,
        createdIso,
        nextFollowUpIso,
        interestedService,
        source,
        stage,
        providerId,
        providerName,
        score,
      };
    });

    return list.sort((a, b) => +new Date(b.createdIso) - +new Date(a.createdIso));
  }, [leads, providerNameById]);

  /* ========================= Funnels ========================= */
  const [showFunnelNavMenu, setShowFunnelNavMenu] = useState(false);
  const [showFunnelModal, setShowFunnelModal] = useState(false);
  const funnelNavBtnRef = useRef<HTMLButtonElement | null>(null);
  const funnelNavMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const t = e.target as Node;
      if (
        funnelNavMenuRef.current &&
        !funnelNavMenuRef.current.contains(t) &&
        funnelNavBtnRef.current &&
        !funnelNavBtnRef.current.contains(t)
      ) {
        setShowFunnelNavMenu(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setShowFunnelNavMenu(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const openFunnel = (slugOrName: string) => {
    trackEvent(EVENT_MAPPINGS.openFunnel, { funnelName: slugOrName });
    const slug = slugify(slugOrName);
    navigate(`/${scope}/leads/funnels/${slug}?label=${encodeURIComponent(slugOrName)}`);
  };

  /* ========================= Navigation ========================= */
  const startNew = () => {
    trackEvent(EVENT_MAPPINGS.addLead);
    navigate(`/${scope}/leads/new`);
  };
  const handleRow = (row: LeadRow) => navigate(`/${scope}/leads/edit/${row.id}`);

  /* ========================= Selection ========================= */
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const headerCheckboxRef = useRef<HTMLInputElement | null>(null);
  const allChecked = rows.length > 0 && selectedIds.size === rows.length;
  const someChecked = selectedIds.size > 0 && selectedIds.size < rows.length;

  useEffect(() => {
    if (headerCheckboxRef.current) headerCheckboxRef.current.indeterminate = someChecked;
  }, [someChecked]);

  const toggleSelectAll = () => {
    const action = selectedIds.size ? "deselect_all" : "select_all";
    trackEvent(EVENT_MAPPINGS.leadRowSelection, { action, leadIds: rows.map((r) => r.id) });
    setSelectedIds((prev) => (prev.size ? new Set() : new Set(rows.map((r) => r.id))));
  };
  const toggleRow = (id: number) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const action = next.has(id) ? "deselected" : "selected";
      trackEvent(EVENT_MAPPINGS.leadRowSelection, { leadId: id, action });
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  /* ========================= Stage Change ========================= */
  const [rowsState, setRows] = useState<LeadRow[]>(rows);
  useEffect(() => setRows(rows), [rows]);
  const handleStageChange = (lead: LeadRow, newStage: LeadStage) => {
    if (lead.stage === newStage) return;
    trackEvent(EVENT_MAPPINGS.leadStageChanged, { leadId: lead.id, oldStage: lead.stage, newStage });
    setRows(rowsState.map((r) => (r.id === lead.id ? { ...r, stage: newStage } : r)));
  };

  /* ========================= Columns ========================= */
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
        cell: (row: LeadRow) => (
          <Checkbox
            checked={selectedIds.has(row.id)}
            onClick={(e) => e.stopPropagation()}
            onChange={() => toggleRow(row.id)}
            className="cursor-pointer"
          />
        ),
      },
      {
        name: "Lead",
        selector: (row: LeadRow) => row.name,
        sortable: true,
        width: "220px",
        cell: (row: LeadRow) => (
          <button
            type="button"
            className="cursor-pointer text-left"
            onClick={(e) => {
              e.stopPropagation();
              handleRow(row);
            }}
            title="Open lead"
          >
            <div className="text-sm font-semibold text-gray-900">{row.name}</div>
            {!!row.email && <div className="text-xs text-gray-500">{row.email}</div>}
            {!!row.phone && <div className="text-xs text-gray-500">{row.phone}</div>}
          </button>
        ),
      },
      {
        name: "Source",
        selector: (row: LeadRow) => row.source ?? "",
        sortable: true,
        width: "140px",
        cell: (row: LeadRow) => <div className="text-sm font-medium text-gray-900">{row.source ?? "Website"}</div>,
      },
      {
        name: "Service",
        selector: (row: LeadRow) => row.interestedService ?? "",
        sortable: true,
        width: "180px",
        cell: (row: LeadRow) => <div className="text-sm font-medium text-gray-900">{row.interestedService ?? "Deep Cleaning"}</div>,
      },
     {
        name: "Stage",
        selector: (row: LeadRow) => row.stage,
        width: "200px",
        ignoreRowClick: true,   // ✅ ADD THIS
        cell: (row: LeadRow) => (
          <div
            onClick={(e) => e.stopPropagation()} // ✅ ADD THIS
            className="w-full"
          >
            <Dropdown
              label={row.stage.charAt(0).toUpperCase() + row.stage.slice(1)}
              dismissOnClick
              size="sm"
              placement="bottom-start"
              theme={{
                floating: {
                  target:
                    "w-[80%] flex justify-start items-center text-left px-2 py-1 focus:ring-1 focus:ring-gray-400 bg-white text-gray-800 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-100",
                  base: "z-50 rounded-md shadow-md bg-white",
                },
              }}
            >
              {["new", "contacted", "qualified", "quoted", "converted", "lost"].map(
                (s) => (
                  <DropdownItem
                    key={s}
                    onClick={() => handleStageChange(row, s as LeadStage)}
                    className={row.stage === s ? "font-semibold text-blue-600" : ""}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </DropdownItem>
                )
              )}
            </Dropdown>
          </div>
        ),
      },

      {
        name: "Assigned Team",
        selector: (row: LeadRow) => String(row.providerId ?? ""),
        width: "200px",
        cell: (row: LeadRow) => <div className="text-sm font-medium text-gray-900">{row.providerName ?? "Unassigned"}</div>,
      },
    ],
    [allChecked, selectedIds, rowsState],
  );

  /* ========================= Render ========================= */
  return (
    <div className="px-4 pb-5 sm:px-5">
      {/* Header: Title + Funnel + Add Lead buttons */}
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
            <div className="relative inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-black">
            <svg
              className="h-6 w-6 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Zm-3 7H7a4 4 0 0 0-4 4v2h18v-2a4 4 0 0 0-4-4h-4Z"
              />
            </svg>
          </div>

          <span className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Leads ({rows.length})
          </span>
        </div>

        <div className="relative flex items-center gap-2">
          <button
            ref={funnelNavBtnRef}
            type="button"
            onClick={() => setShowFunnelNavMenu((v) => !v)}
            className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
              showFunnelNavMenu
                ? "border-gray-600 bg-gray-50 text-black-700"
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            <span className="font-medium">Funnels</span>
            <HiChevronDown className={`h-4 w-4 transition-transform ${showFunnelNavMenu ? "rotate-180" : ""}`} />
          </button>

          <Button color="gray" onClick={startNew} className="w-full cursor-pointer sm:w-auto">
            Add New Lead
          </Button>

          {showFunnelNavMenu && (
            <div
              ref={funnelNavMenuRef}
              className="absolute right-0 top-12 z-20 w-62 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg"
            >
              {funnels.length === 0 && <div className="px-3 py-2 text-sm text-gray-500">No funnels yet</div>}
              {funnels.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    setShowFunnelNavMenu(false);
                    openFunnel(f.slug || f.name);
                  }}
                  className="flex w-full cursor-pointer items-center justify-between px-3 py-2 text-left text-sm hover:bg-gray-100"
                >
                  <span>{f.name}</span>
                </button>
              ))}
              <div className="my-1 h-px bg-gray-100" />
              <button
                type="button"
                onClick={() => {
                  setShowFunnelNavMenu(false);
                  setShowFunnelModal(true);
                }}
                className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                <HiPlus className="h-4 w-4" />
                Add New Funnel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* AppDataTable: search, filter, sort, mobile cards, pagination */}
      <AppDataTable
        data={rowsState}
        columns={columns}
        searchPlaceholder="Search Leads"
        searchKeys={["name", "email", "phone", "interestedService", "source", "city", "stage", "providerName"]}
        onRowClick={handleRow}
        filterOptions={[
          { value: "all", label: "All" },
          { value: "new", label: "New" },
          { value: "contacted", label: "Contacted" },
          { value: "qualified", label: "Qualified" },
          { value: "quoted", label: "Quoted" },
          { value: "converted", label: "Converted" },
          { value: "lost", label: "Lost" },
        ]}
        filterKey="stage"
        defaultFilter="all"
        sortOptions={[
          { value: "newest", label: "Newest", sortFn: (a, b) => new Date(b.createdIso).getTime() - new Date(a.createdIso).getTime() },
          { value: "nextAction", label: "Next Action", sortFn: (a, b) => new Date(a.nextFollowUpIso ?? "9999-12-31").getTime() - new Date(b.nextFollowUpIso ?? "9999-12-31").getTime() },
          { value: "name", label: "Name", sortFn: (a, b) => a.name.localeCompare(b.name) },
        ]}
        defaultSort="newest"
        paginationOptions={[10, 20, 50, 100]}
        defaultPerPage={20}
        mobileCard={{
          titleField: "name",
          titleRender: (row: LeadRow) => <div className="text-sm"><div className="font-semibold text-gray-900">{row.name}</div><div className="text-xs text-gray-500">{formatDate(row.createdIso)}</div></div>,
          subtitleRender: (row: LeadRow) => `${row.interestedService ?? "—"} • ${row.source ?? "—"}`,
          statusField: "stage",
          fields: [
            { key: "providerName", label: "Team" },
            { key: "city", label: "City" },
            { key: "nextFollowUpIso", label: "Next Action", render: (value: string | undefined, row?: LeadRow) => value ? formatDate(value) : "—" },
          ],
          actions: [{ label: "Edit", color: "gray", onClick: handleRow }],
          enableEdit: false,
        }}
      />

      {/* Funnel Modal */}
      <FunnelFormModal
        open={showFunnelModal}
        onClose={() => setShowFunnelModal(false)}
        onSave={async (payload) => {
          const created = await add(payload);
          trackEvent(EVENT_MAPPINGS.createFunnel, { funnelId: created.id });
          openFunnel(created.slug || created.name);
        }}
      />
    </div>
  );
};

export default Leads;
