import React, { useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AppDataTable from "../../components/ui/AppDataTable";
import { Button } from "flowbite-react";
import { ServiceProvider } from "../../types/providers";
import { useProviders } from "../../hooks/Providers/useProviders";
import { useLocations } from "../../hooks/Locations/useLocations";

import { mockLocations } from "../../utils/mockLocationData";

/** Local wage type (matches your WageModal shape) */
type WageMethod = "hourly" | "flat" | "percentage";
type WageEntry = {
  method: WageMethod;
  pay: number;
  effectiveDate: string; // ISO
  notes?: string;
};

function latestWage(wages?: WageEntry[]): WageEntry | undefined {
  if (!wages || wages.length === 0) return undefined;
  return [...wages].sort(
    (a, b) =>
      new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime(),
  )[0];
}

function formatWage(w?: WageEntry): string {
  if (!w) return "—";
  switch (w.method) {
    case "hourly":
      return `$${w.pay.toFixed(2)}/hr`;
    case "flat":
      return `$${w.pay.toFixed(2)}`;
    case "percentage":
      return `${w.pay.toFixed(0)}%`;
    default:
      return "—";
  }
}

const Providers: React.FC = () => {
  const navigate = useNavigate();
  const { providers } = useProviders();
  const { locations } = useLocations();

  const pathPrefix = window.location.pathname.split('/')[1];
  const handleNew = () => navigate(`/${pathPrefix}/providers/new`);
  const handleEdit = (row: ServiceProvider) =>
    navigate(`/${pathPrefix}/providers/edit/${row.id}`);

  /** Map of API locations (id -> name) */
  const apiLocationMap = useMemo(() => {
    const m = new Map<string, string>();
    (locations || []).forEach((l: any) => {
      if (l?.id != null && l?.name != null) {
        m.set(String(l.id), String(l.name));
      }
    });
    return m;
  }, [locations]);

  /** Map of mock locations (id -> name), as a fallback */
  const mockLocationMap = useMemo(() => {
    const m = new Map<string, string>();
    (mockLocations || []).forEach((l: any) => {
      if (l?.id != null && l?.name != null) {
        m.set(String(l.id), String(l.name));
      }
    });
    return m;
  }, []);

  const getLocationNamesList = useCallback(
    (row: ServiceProvider) => {
      if (row.locations?.length) return row.locations;
      const ids = (row.locationIds ?? []) as Array<number | string>;
      return ids.map((id) => {
        const key = String(id);
        return apiLocationMap.get(key) ?? mockLocationMap.get(key) ?? `#${id}`;
      });
    },
    [apiLocationMap, mockLocationMap],
  );

  const columns = useMemo(
    () => [
      {
        name: "Team",
        selector: (row: ServiceProvider) => row.teamTitle,
        sortable: true,
        width: "280px",
        cell: (row: ServiceProvider) => (
          <div>
            {/* Explicit clickable target that routes to edit */}
            <button
              type="button"
              className="text-left cursor-pointer"
              onClick={(e) => { e.stopPropagation();
              handleEdit(row);
              }}
              title="Edit team"
            >
              <div className="text-sm font-semibold text-gray-900">
                {row.teamTitle}
              </div>
              <div className="text-xs text-gray-500">
                {row.teamMembers?.length
                  ? row.teamMembers
                      .map((m) => `${m.firstName} ${m.lastName}`)
                      .join(", ")
                  : row.memberIds?.length
                  ? `${row.memberIds.length} member${
                      row.memberIds.length > 1 ? "s" : ""
                    }`
                  : "—"}
              </div>
            </button>
          </div>
        ),
      },
      {
        name: "Contact",
        selector: (row: ServiceProvider) => row.email,
        sortable: true,
        width: "250px",
        cell: (row: ServiceProvider) => (
          <div className="text-sm text-gray-900">
            <a
              href={`mailto:${row.email}`}
              className="text-gray-900 text-sm no-underline hover:cursor-pointer"
              onClick={(e) => e.stopPropagation()}
            >
              {row.email}
            </a>
            <div className="text-xs text-gray-500">{row.phone}</div>
          </div>
        ),
      },
      {
        name: "Locations",
        selector: (row: ServiceProvider) => getLocationNamesList(row).join(" | "),
        sortable: true,
        width: "180px",
        cell: (row: ServiceProvider) => {
          const names = getLocationNamesList(row);
          const isLoading = !locations?.length && !(row.locations?.length);
          return (
            <button
              type="button"
              className="text-left w-full text-sm leading-5 text-gray-900 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(row);
              }}
              title="Edit provider"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="text-gray-400">Loading…</span>
              ) : names.length ? (
                names.map((n, i) => (
                  <div key={`${row.id}-loc-${i}`} className="truncate">
                    {n}
                  </div>
                ))
              ) : (
                <span className="text-gray-400">—</span>
              )}
            </button>
          );
        },
      },
      {
        name: "Wages",
        selector: (row: ServiceProvider) => {
          const w = latestWage((row as any).wages as WageEntry[] | undefined);
          return w ? `${w.method}:${w.pay}` : "";
        },
        sortable: true,
        width: "140px",
        cell: (row: ServiceProvider) => {
          const w = latestWage((row as any).wages as WageEntry[] | undefined);
          return (
            <button
              type="button"
              className="text-left w-full text-xs cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(row);
              }}
              title="Edit wages"
            >
              <span className="rounded-full text-gray-900">
                {formatWage(w)}
              </span>
            </button>
          );
        },
      },
    ],
    [getLocationNamesList, locations],
  );

  const filterOptions = [
    { value: "all", label: "All" },
    { value: "active", label: "Active" },
    { value: "archived", label: "Archived" },
  ];

  const sortOptions = [
    {
      value: "team",
      label: "Team",
      sortFn: (a: ServiceProvider, b: ServiceProvider) =>
        a.teamTitle.localeCompare(b.teamTitle),
    },
    {
      value: "newest",
      label: "Newest",
      sortFn: (a: ServiceProvider, b: ServiceProvider) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    }
  ];

  return (
    <div className="px-4 pb-5 sm:px-5">
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <div className="relative inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-black">
            <svg
              className="h-6 w-6"
              fill="white"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm-7 9a7 7 0 1 1 14 0H5Z"
              />
            </svg>
          </div>
          <div className="font-medium">
            <span className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Team Providers ({providers.length})
            </span>
            <div className="text-sm text-gray-500">Manage Teams</div>
          </div>
        </div>
        <Button
          color="gray"
          onClick={handleNew}
          className="w-full sm:w-auto cursor-pointer"
        >
          Add New Team
        </Button>
      </div>

      <AppDataTable
        data={providers}
        columns={columns}
        searchPlaceholder="Search providers…"
        searchKeys={["teamTitle", "email", "phone"]}
        filterOptions={filterOptions}
        filterKey="status"
        defaultFilter="all"
        sortOptions={sortOptions}
        defaultSort="team"
        paginationOptions={[10, 20, 50, 100]}
        defaultPerPage={20}

        /* Whole-row click opens the same edit route as the buttons */
        showEditButton
        onEditClick={handleEdit}
        onRowClick={handleEdit}

        mobileCard={{
          titleField: "teamTitle",
          subtitleRender: (row: ServiceProvider) => row.email,
          statusField: "status",
          fields: [{ key: "phone", label: "Phone" }],
          actions: [
            {
              label: "Edit",
              color: "gray",
              onClick: (item: ServiceProvider) => handleEdit(item),
            },
          ],
          enableEdit: false,
        }}
      />
    </div>
  );
};

export default Providers;
