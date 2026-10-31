// src/App/Tags/TagCustomersPage.tsx
import * as React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { HiTag } from "react-icons/hi";
import AppDataTable from "../../components/ui/AppDataTable";
import { useTagCustomers } from "../../hooks/useTagsCustomers";
import type { Customer } from "../../types/customers";
import { useTags } from "../../hooks/useTags";
import { useCustomerExtras } from "../../hooks/Customers/useCustomerExtras";
import type { TagColor } from "../../types/tag";

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

type TagChip = { id?: number; name: string; color: TagColor };

const TAG_COLORS: Record<
  TagColor,
  { primary: string; bg?: string; label?: string; textColor?: string }
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

/* ================================================================== */
/* Inline Tags (customers page style + currentTag first)              */
/* ================================================================== */

function InlineTagsForTagPage({
  customer,
  max = 4,
  currentTagId,
}: {
  customer: Customer;
  max?: number;
  currentTagId?: number | null;
}) {
  const companyId =
    (customer as any).companyId ?? (customer as any).company_id ?? undefined;
  const { getDetails } = useCustomerExtras(companyId);
  const { tags: catalog, loading } = useTags() as any;

  const tagsReady =
    !loading && Array.isArray(catalog) && (catalog as any[]).length > 0;

  const byId = React.useMemo(() => {
    const m = new Map<number, { id: number; name: string; color: TagColor }>();
    (catalog ?? []).forEach((t: any) => {
      const id = Number(t.id);
      m.set(id, {
        id,
        name: String(t.tag_name),
        color: (t.tag_color || "blue") as TagColor,
      });
    });
    return m;
  }, [catalog]);

  const colorByNameLc = React.useMemo(() => {
    const m = new Map<string, TagColor>();
    (catalog ?? []).forEach((t: any) =>
      m.set(
        String(t.tag_name).toLowerCase(),
        (t.tag_color || "blue") as TagColor
      )
    );
    return m;
  }, [catalog]);

  // name of the opened tag (lowercased), so we can match by name as well as id
  const openedTagNameLc = React.useMemo(() => {
    if (!currentTagId || !catalog) return null;
    const hit = (catalog as any[]).find(
      (t) => Number(t.id) === Number(currentTagId)
    );
    if (!hit) return null;
    const name = String(hit.tag_name || "").trim();
    return name ? name.toLowerCase() : null;
  }, [currentTagId, catalog]);

  const normalizeFromRow = React.useCallback((): TagChip[] => {
    const raw =
      (customer as any).tags ??
      (customer as any).details?.tags ??
      (customer as any).preferences?.tags ??
      (customer as any).meta?.tags ??
      [];
    const out: TagChip[] = [];

    const push = (name: string, color?: TagColor, id?: number) => {
      const n = name?.trim();
      if (!n) return;
      const lc = n.toLowerCase();
      const c = color ?? colorByNameLc.get(lc) ?? "blue";
      const safe = (["blue", "yellow", "orange", "purple"] as const).includes(
        c
      )
        ? c
        : "blue";
      out.push({ id, name: n, color: safe });
    };

    if (Array.isArray(raw)) {
      raw.forEach((v) => {
        if (typeof v === "number") {
          if (!tagsReady) return;
          const hit = byId.get(v);
          if (hit) push(hit.name, hit.color, hit.id);
        } else if (typeof v === "string") {
          const maybeId = Number(v);
          if (Number.isFinite(maybeId)) {
            if (!tagsReady) return;
            const hit = byId.get(maybeId);
            if (hit) {
              push(hit.name, hit.color, hit.id);
              return;
            }
          }
          push(v);
        } else if (v && typeof v === "object") {
          const name = String(
            (v as any).tag_name ?? (v as any).name ?? ""
          ).trim();
          if (!name) return;
          const possibleId =
            (v as any).id != null
              ? Number((v as any).id)
              : (v as any).tag_id != null
              ? Number((v as any).tag_id)
              : undefined;
          const color =
            ((v as any).tag_color as TagColor) ??
            colorByNameLc.get(name.toLowerCase()) ??
            "blue";
          push(name, color, possibleId);
        }
      });
    } else if (typeof raw === "string") {
      raw.split(",").forEach((s) => push(s));
    }

    const seen = new Set<string>();
    return out.filter((t) => {
      const k = t.name.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }, [customer, byId, colorByNameLc, tagsReady]);

  const [chips, setChips] = React.useState<TagChip[]>(() => normalizeFromRow());
  const cacheRef = React.useRef<Map<number, TagChip[]>>(new Map());

  React.useEffect(() => {
    const fromRow = normalizeFromRow();
    setChips(fromRow);

    if (fromRow.length > 0 || !tagsReady) return;

    const cached = cacheRef.current.get(customer.id);
    if (cached) {
      setChips(cached);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const details = await getDetails(customer.id);
        const dRaw = (details as any)?.tags ?? [];
        const viaDetails: TagChip[] = [];

        if (Array.isArray(dRaw)) {
          dRaw.forEach((v) => {
            if (typeof v === "number") {
              const hit = byId.get(v);
              if (hit)
                viaDetails.push({
                  id: hit.id,
                  name: hit.name,
                  color: hit.color,
                });
            } else if (typeof v === "string") {
              const maybeId = Number(v);
              const lc = v.toLowerCase();
              if (Number.isFinite(maybeId)) {
                const hit = byId.get(maybeId);
                if (hit) {
                  viaDetails.push({
                    id: hit.id,
                    name: hit.name,
                    color: hit.color,
                  });
                  return;
                }
              } else {
                viaDetails.push({
                  name: v,
                  color: colorByNameLc.get(lc) ?? "blue",
                });
              }
            } else if (v && typeof v === "object") {
              const name = String(
                (v as any).tag_name ?? (v as any).name ?? ""
              ).trim();
              if (!name) return;
              const possibleId =
                (v as any).id != null
                  ? Number((v as any).id)
                  : (v as any).tag_id != null
                  ? Number((v as any).tag_id)
                  : undefined;
              const color =
                ((v as any).tag_color as TagColor) ??
                colorByNameLc.get(name.toLowerCase()) ??
                "blue";
              viaDetails.push({ id: possibleId, name, color });
            }
          });
        }

        const seen = new Set<string>();
        const final = viaDetails.filter((t) => {
          const k = t.name.toLowerCase();
          if (seen.has(k)) return false;
          seen.add(k);
          return true;
        });

        if (!cancelled && final.length) {
          cacheRef.current.set(customer.id, final);
          setChips(final);
        }
      } catch {
        /* ignore */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [customer.id, normalizeFromRow, getDetails, byId, colorByNameLc, tagsReady]);

  // Order chips so the opened tag is always first (by id OR by name)
  const orderedChips = React.useMemo(() => {
    if (!currentTagId && !openedTagNameLc) return chips;

    return [...chips].sort((a, b) => {
      const aCurrentById =
        a.id != null && currentTagId != null && a.id === currentTagId;
      const bCurrentById =
        b.id != null && currentTagId != null && b.id === currentTagId;

      const aCurrentByName =
        openedTagNameLc &&
        a.name &&
        a.name.toLowerCase() === openedTagNameLc;

      const bCurrentByName =
        openedTagNameLc &&
        b.name &&
        b.name.toLowerCase() === openedTagNameLc;

      const aCurrent = aCurrentById || aCurrentByName;
      const bCurrent = bCurrentById || bCurrentByName;

      if (aCurrent === bCurrent) return 0;
      return aCurrent ? -1 : 1; // current tag first
    });
  }, [chips, currentTagId, openedTagNameLc]);

  if (!tagsReady) {
    return (
      <div className="mt-1 flex flex-wrap gap-1">
        <span className="h-5 w-12 animate-pulse rounded-sm bg-gray-200" />
        <span className="h-5 w-12 animate-pulse rounded-sm bg-gray-200" />
      </div>
    );
  }

  if (orderedChips.length === 0) return null;

  const shown = orderedChips.slice(0, max);
  const remaining = orderedChips.length - shown.length;

  return (
    <>
      {shown.map((chip, i) => {
        const colorConfig = TAG_COLORS[chip.color];
        const isCurrent =
          (currentTagId && chip.id === currentTagId) ||
          (openedTagNameLc &&
            chip.name.toLowerCase() === openedTagNameLc);

        return (
          <span
            key={`${chip.name}-${i}`}
            className={`inline-flex items-center rounded-sm font-medium text-[11px] px-3 py-1 ${
              isCurrent ? "" : ""
            }`}
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

const TagCustomersPage: React.FC = () => {
  const { tagId } = useParams<{ tagId: string }>();
  const navigate = useNavigate();
  const numericTagId = tagId ? Number(tagId) : null;

  const { customers = [], loading, error } = useTagCustomers(numericTagId);
  const totalCustomers = customers.length;

  const tableRows = React.useMemo(
    () =>
      customers.map((c: any) => {
        const baseStatus =
          String(c.status ?? "").trim().toLowerCase() || "active";
        return {
          ...c,
          statusForFilter: baseStatus,
        };
      }),
    [customers]
  );

  const columns = React.useMemo(
    () => [
      {
        name: "Name",
        selector: (row: any) =>
          `${row.firstName ?? ""} ${row.lastName ?? ""}`.trim(),
        sortable: true,
         width: "320px", 
        cell: (row: any) => {
          const fullName = `${row.firstName ?? ""} ${
            row.lastName ?? ""
          }`.trim();
          return (
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => {
                  navigate(`/admin/customers/edit/${row.id}`);
                }}
                className="text-left cursor-pointer"
              >
                <div className="text-sm font-semibold text-gray-900">
                  {fullName || "Unnamed customer"}
                </div>

                <div className="mt-1 flex flex-wrap gap-1">
                  <InlineTagsForTagPage
                    customer={row}
                    currentTagId={numericTagId}
                  />
                </div>
              </button>
            </div>
          );
        },
      },
      {
        name: "Email",
        selector: (row: any) => row.email ?? "",
        sortable: true,
      },
      {
        name: "Phone",
        selector: (row: any) => row.phone ?? "",
        sortable: true,
      },
      {
        name: "Confirmed",
        selector: (row: any) => (isConfirmed(row.confirmed) ? 1 : 0),
        sortable: true,
        cell: (row: any) =>
          isConfirmed(row.confirmed) ? (
            <svg
              className="h-5 w-5 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          ) : (
            <span className="text-sm text-gray-400"></span>
          ),
      },
    ],
    [navigate, numericTagId]
  );

  const filterOptions = [
    { value: "all", label: "All" },
    { value: "active", label: "Active" },
    { value: "archived", label: "Archived" },
  ];

  const sortOptions = [
    {
      value: "name",
      label: "Name",
      sortFn: (a: Customer, b: Customer) =>
        `${a.firstName ?? ""} ${a.lastName ?? ""}`.localeCompare(
          `${b.firstName ?? ""} ${b.lastName ?? ""}`
        ),
    },
    {
      value: "newest",
      label: "Newest",
      sortFn: (a: Customer, b: Customer) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    },
  ];

  return (
    <div className="px-4 sm:px-5 pb-5">
      {/* Header with icon */}
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <div className="relative inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-blue-700">
            <HiTag className="h-6 w-6 text-white" />
          </div>
          <div className="font-medium">
            <span className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Customers with Tag ({totalCustomers})
            </span>
            <div className="text-sm text-gray-500">
              Click a customer name to open their profile.
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <p className="mb-3 text-sm text-gray-500">Loading customers…</p>
      )}
      {error && (
        <p className="mb-3 text-sm text-red-500">
          Failed to load customers: {error}
        </p>
      )}

      {!loading && !error && (
        <AppDataTable
          data={tableRows}
          columns={columns}
          searchPlaceholder="Search customers..."
          searchKeys={["firstName", "lastName", "email", "phone"]}
          /* Filters */
          filterOptions={filterOptions}
          filterKey="statusForFilter"
          filterLabel="Filter by"
          defaultFilter="all"
          /* Sort */
          sortOptions={sortOptions}
          defaultSort="name"
          /* Misc */
          paginationOptions={[10, 20, 50]}
          defaultPerPage={10}
        />
      )}
    </div>
  );
};

export default TagCustomersPage;
