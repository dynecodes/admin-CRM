// // src/App/Analytics/TrackingDashboard.tsx
// import React, { useState, useMemo, useEffect, useRef } from "react";
// import AppDataTable from "../../components/ui/AppDataTable"; // Update the path to the correct location
// import { Badge, Checkbox } from "flowbite-react";
// import { HiOutlineChartBar } from "react-icons/hi"; 
// // ========================= Types =========================
// type AnalyticsEvent = {
//   id: number;
//   name: string;
//   platform: "GA4" | "Meta" | "Other";
//   status: "success" | "failed";
//   lastFiredIso: string;
//   payloadSize?: number; // KB
// };

// // ========================= Helpers =========================
// function formatDate(iso: string) {
//   const d = new Date(iso);
//   return isNaN(d.getTime())
//     ? "-"
//     : d.toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
// }

// function statusColor(status: "success" | "failed") {
//   return status === "success" ? "success" : "failure"; // Flowbite Badge color
// }

// // ========================= Component =========================
// const TrackingDashboard: React.FC = () => {
//   // Mock data for now
//   const [events] = useState<AnalyticsEvent[]>([
//     { id: 1, name: "lead_add", platform: "GA4", status: "success", lastFiredIso: new Date().toISOString(), payloadSize: 2 },
//     { id: 2, name: "lead_row_selection", platform: "Meta", status: "failed", lastFiredIso: new Date().toISOString(), payloadSize: 1.5 },
//     { id: 3, name: "lead_stage_changed", platform: "GA4", status: "success", lastFiredIso: new Date().toISOString(), payloadSize: 2.3 },
//     { id: 4, name: "funnel_create", platform: "Meta", status: "success", lastFiredIso: new Date().toISOString(), payloadSize: 1.2 },
//   ]);

//   const [searchQuery] = useState<string>("");
//   const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(new Set());


//   // Filter & search
//   const filteredEvents = useMemo(() => {
//     return events.filter((e) => {
//       const matchesSearch = e.name.toLowerCase().includes(searchQuery.toLowerCase());
//       const matchesPlatform = selectedPlatforms.size === 0 || selectedPlatforms.has(e.platform);
//       return matchesSearch && matchesPlatform;
//     });
//   }, [events, searchQuery, selectedPlatforms]);

//   const togglePlatform = (platform: string) => {
//     setSelectedPlatforms((prev) => {
//       const next = new Set(prev);
//       if (next.has(platform)) next.delete(platform);
//       else next.add(platform);
//       return next;
//     });
//   };

//   // ========================= Columns =========================
//   const columns = useMemo(
//     () => [
//       {
//         name: "Event Name",
//         selector: (row: AnalyticsEvent) => row.name,
//         sortable: true, 
//         width: "200px",
//         cell: (row: AnalyticsEvent) => <div className="text-sm font-medium text-gray-900">{row.name}</div>,
//       },
//       {
//         name: "Platform",
//         selector: (row: AnalyticsEvent) => row.platform,
//         sortable: true,
//         width: "200px",
//         cell: (row: AnalyticsEvent) => <div className="text-sm font-medium text-gray-900">{row.platform}</div>,
//       },
//       {
//         name: "Status",
//         selector: (row: AnalyticsEvent) => row.status,
//         width: "200px",
//         cell: (row: AnalyticsEvent) => (
//           <Badge color={statusColor(row.status)} size="sm">
//             {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
//           </Badge>
//         ),
//       },
//       {
//         name: "Last Fired",
//         selector: (row: AnalyticsEvent) => row.lastFiredIso,
//         sortable: true,
//         width: "200px",
//         cell: (row: AnalyticsEvent) => <div className="text-sm text-gray-700">{formatDate(row.lastFiredIso)}</div>,
//       },
//       {
//         name: "Payload",
//         selector: (row: AnalyticsEvent) => row.payloadSize ?? 0,
//         sortable: true,
//         width: "120px",
//         cell: (row: AnalyticsEvent) => <div className="text-sm text-gray-700">{row.payloadSize?.toFixed(1)}</div>,
//       },
//     ],
//     []
//   );

//   return (
//    <div className="px-4 pb-5 sm:px-5">
//     <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
//       <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
//         <div className="relative inline-flex h-12 min-h-[3rem] w-12 min-w-[3rem] flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-black">
//         <HiOutlineChartBar className="h-6 w-6 flex-shrink-0 text-white" />
//         </div>
//         Tracking 
//       </h2>
//       <div className="flex items-center gap-2">
//         {/* Additional controls can go here */}
//       </div>
//     </div>

//       {/* Platform filters */}
//       <div className="flex gap-3 mb-4">
//         {["GA4", "Meta", "Other"].map((p) => (
//           <label className="flex items-center gap-2">
//             <Checkbox
//               key={p}
//               checked={selectedPlatforms.has(p)}
//               onChange={() => togglePlatform(p)}
//               className="cursor-pointer"
//             />
//             {p}
//           </label>
//         ))}
//       </div>

//       <AppDataTable
//         data={filteredEvents}
//         columns={columns}
//         searchPlaceholder="Search events..."
//         searchKeys={["name", "platform", "status"]}
//         defaultSort="Last Fired"
//         paginationOptions={[10, 20, 50]}
//         defaultPerPage={10}
//       />
//     </div>
//   );
// };

// export default TrackingDashboard;


import React, { useMemo, useState } from "react";
import AppDataTable from "../../components/ui/AppDataTable";
import { Badge, Checkbox } from "flowbite-react";
import { HiOutlineChartBar } from "react-icons/hi";

import { useTrackingHealth } from "../../hooks/Analytics/useTrackingHealth";
import type { AnalyticsEvent, Platform } from "../../types/tracking";

/* ========================= Helpers ========================= */

function formatDate(iso: string) {
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? "-"
    : d.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
}

function getHealth(event: AnalyticsEvent) {
  if (!event.uiFired) {
    return { label: "UI Not Fired", color: "failure" } as const;
  }
  if (!event.gtmReceived) {
    return { label: "Blocked at GTM", color: "warning" } as const;
  }
  if (event.successRate < 80) {
    return { label: "Unstable", color: "warning" } as const;
  }
  return { label: "Healthy", color: "success" } as const;
}

/* ========================= Component ========================= */

const TrackingDashboard: React.FC = () => {
  const { events, loading } = useTrackingHealth();

  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<Platform>>(
    new Set(),
  );
  const [selectedEvent, setSelectedEvent] =
    useState<AnalyticsEvent | null>(null);

  /* ========================= Filtering ========================= */

  const filteredEvents = useMemo(() => {
    return events.filter(
      (e) =>
        selectedPlatforms.size === 0 ||
        selectedPlatforms.has(e.platform),
    );
  }, [events, selectedPlatforms]);

  const togglePlatform = (platform: Platform) => {
    setSelectedPlatforms((prev) => {
      const next = new Set(prev);
      next.has(platform) ? next.delete(platform) : next.add(platform);
      return next;
    });
  };

  /* ========================= Table Columns ========================= */

  const columns = useMemo(
    () => [
      {
        name: "Event",
        selector: (row: AnalyticsEvent) => row.name,
        sortable: true,
        width: "220px",
        cell: (row: AnalyticsEvent) => (
          <div className="font-medium text-gray-900">{row.name}</div>
        ),
      },
      {
        name: "Platform",
        selector: (row: AnalyticsEvent) => row.platform,
        width: "120px",
      },
      {
        name: "Health",
        width: "160px",
        cell: (row: AnalyticsEvent) => {
          const h = getHealth(row);
          return <Badge color={h.color}>{h.label}</Badge>;
        },
      },
      {
        name: "UI",
        width: "120px",
        cell: (row: AnalyticsEvent) =>
          row.uiFired ? "✅ Fired" : "❌ Not Fired",
      },
      {
        name: "GTM",
        width: "140px",
        cell: (row: AnalyticsEvent) =>
          row.gtmReceived ? "✅ Received" : "❌ Blocked",
      },
      {
        name: "Success %",
        selector: (row: AnalyticsEvent) => row.successRate,
        sortable: true,
        width: "120px",
        cell: (row: AnalyticsEvent) => `${row.successRate}%`,
      },
      {
        name: "Last Fired",
        selector: (row: AnalyticsEvent) => row.lastFiredIso,
        sortable: true,
        width: "200px",
        cell: (row: AnalyticsEvent) => formatDate(row.lastFiredIso),
      },
    ],
    [],
  );

  /* ========================= Render ========================= */

  return (
    <div className="px-4 pb-5 sm:px-5">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-black">
          <HiOutlineChartBar className="h-6 w-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">
          Tracking Health
        </h2>
      </div>

      {/* Platform Filters */}
      <div className="mb-4 flex gap-4">
        {(Array.from(["GA4", "Meta", "Other"]) as Platform[]).map(
          (platform) => (
            <label
              key={platform}
              className="flex items-center gap-2"
            >
              <Checkbox
                checked={selectedPlatforms.has(platform)}
                onChange={() => togglePlatform(platform)}
                className="cursor-pointer"
              />
              {platform}
            </label>
          ),
        )}
      </div>

      {/* Data Table */}
      <AppDataTable
        data={filteredEvents}
        columns={columns}
        onRowClick={(row: AnalyticsEvent) =>
          setSelectedEvent(row)
        }
        paginationOptions={[10, 20, 50]}
        defaultPerPage={10}
      />

      {/* Debug Panel */}
      {selectedEvent && (
        <div className="mt-6 rounded-lg border bg-gray-50 p-4">
          <h3 className="mb-2 font-semibold text-gray-900">
            Debug Details
          </h3>

          {selectedEvent.lastError && (
            <p className="mb-2 text-sm text-red-600">
              Error: {selectedEvent.lastError}
            </p>
          )}

          <pre className="max-h-64 overflow-auto rounded bg-white p-3 text-xs">
            {JSON.stringify(
              selectedEvent.payload ?? {},
              null,
              2,
            )}
          </pre>
        </div>
      )}
    </div>
  );
};

export default TrackingDashboard;
