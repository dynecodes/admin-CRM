// src/hooks/Customers/useCustomers.ts
import * as React from "react";
import type { Customer, CustomerAddress } from "../../types/customers";
import usePrivateService from "../Auth/usePrivateService";

/* -------------------- helpers -------------------- */

const toUiConfirmed = (v: any): "✓" | "-" =>
  String(v ?? "")
    .toLowerCase()
    .trim()
    .match(/^(✓|yes|true|1|y)$/)
    ? "✓"
    : "-";

const ensureBookingsArray = <T extends Record<string, any>>(
  row: T
): T & { bookings: any[] } => ({
  ...row,
  bookings: Array.isArray(row.bookings) ? row.bookings : [],
});

const toOptionalUi = (v: any): string | undefined =>
  v == null || String(v).trim() === "" ? undefined : String(v);

/** Robust boolean parser for various backend representations */
const toBool = (v: any): boolean => {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v === 1;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    return (
      s === "1" || s === "true" || s === "yes" || s === "y" || s === "blocked"
    );
  }
  return false;
};

/** Parse tags coming from backend (JSON array, CSV, or simple string) */
const normalizeTags = (raw: any): string[] => {
  if (Array.isArray(raw)) {
    return raw.map((t) => String(t).trim()).filter(Boolean);
  }

  if (raw == null) return [];

  const s = String(raw).trim();
  if (!s) return [];

  // JSON array?
  if (
    (s.startsWith("[") && s.endsWith("]")) ||
    (s.startsWith("{") && s.endsWith("}"))
  ) {
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) {
        return parsed.map((t) => String(t).trim()).filter(Boolean);
      }
    } catch {
      // fall through to CSV/single
    }
  }

  // CSV fallback
  if (s.includes(",") || s.includes(";")) {
    return s
      .split(/[;,]/)
      .map((x) => x.trim())
      .filter(Boolean);
  }

  // single token
  return [s];
};

function mapApiToCustomer(row: any): Customer {
  const createdAt = row.created_at ?? row.createdAt;
  const updatedAt = row.updated_at ?? row.updatedAt;

  // 👇 normalize tags from backend (or fallbacks)
  const rawTags = row.tags ?? row.details_tags ?? row.details?.tags;
  const tags = normalizeTags(rawTags);

  // 👇 Normalize addresses coming from backend (or undefined)
  const addressesRaw: any[] = Array.isArray(row.addresses)
    ? row.addresses
    : [];

  const addresses: CustomerAddress[] = addressesRaw.map((a: any) => ({
    id: a.id != null ? Number(a.id) : undefined,
    address: a.address ?? "",
    city: a.city ?? "",
    state: a.state ?? "",
    zip: a.zip ?? "",
    locationId:
      a.locationId != null
        ? Number(a.locationId)
        : a.location_id != null
        ? Number(a.location_id)
        : null,
    isDefault:
      a.isDefault === true ||
      a.isDefault === 1 ||
      a.is_default === true ||
      a.is_default === 1,
  }));

  // Prefer the default address if present, else just take the first
  const defaultAddress =
    addresses.find((a) => a.isDefault) || addresses[0] || null;

  return {
    id: Number(row.id),
    email: row.email,
    firstName: row.first_name ?? row.firstName,
    lastName: row.last_name ?? row.lastName,
    companyName: row.company_name ?? row.companyName ?? undefined,

    // 👇 use defaultAddress as primary address for backward-compat
    address: defaultAddress?.address ?? toOptionalUi(row.address),
    city: defaultAddress?.city ?? toOptionalUi(row.city),
    state: defaultAddress?.state ?? toOptionalUi(row.state),
    zip: defaultAddress?.zip ?? toOptionalUi(row.zip),
    locationId:
      defaultAddress?.locationId ?? row.location_id ?? row.locationId ?? null,

    phone: row.phone,
    status: row.status,
    confirmed: toUiConfirmed(row.confirmed),

    avatarUrl: row.avatar_url ?? row.avatarUrl ?? null,
    blocked: toBool(row.blocked ?? row.is_blocked ?? row.isBlocked),
    blockedReason: row.blocked_reason ?? row.blockedReason ?? null,
    blockedAt: row.blocked_at ?? row.blockedAt ?? null,
    archivedAt: row.archived_at ?? row.archivedAt ?? null,

    created_at: createdAt
      ? new Date(createdAt).toISOString()
      : new Date().toISOString(),
    updated_at: updatedAt
      ? new Date(updatedAt).toISOString()
      : new Date().toISOString(),
    bookings: Array.isArray(row.bookings) ? row.bookings : [],

    // 👇 keep full list for list view & edit
    addresses,
    tags,
  };
}

// Empty string → null
const normalizeOptional = (v: any): string | null =>
  v == null || String(v).trim() === "" ? null : String(v).trim();

const toDbConfirmed = (v: any): 0 | 1 => (toUiConfirmed(v) === "✓" ? 1 : 0);

/* -------------------- hook -------------------- */

type UseCustomersOptions = {
  /** If true, don't auto-call fetchCustomers() on mount */
  skipInitialFetch?: boolean;
};

export function useCustomers(options?: UseCustomersOptions) {
  const api = usePrivateService();
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchCustomers = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/customers");
      const raw = res.data?.data ?? res.data ?? [];

      const list: Customer[] = raw.map((r: any) =>
        mapApiToCustomer(ensureBookingsArray(r))
      );

      setCustomers(list);
    } catch (e: any) {
      setError(
        e?.response?.data?.error || e?.message || "Failed to fetch customers"
      );
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [api]);

  const skipInitialFetch = options?.skipInitialFetch ?? false;

  React.useEffect(() => {
    if (skipInitialFetch) return;
    fetchCustomers();
  }, [fetchCustomers, skipInitialFetch]);

  const addCustomer = React.useCallback(
    async (data: any): Promise<Customer> => {
      setLoading(true);
      setError(null);
      try {
        const payload = {
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          companyName: normalizeOptional(data.companyName),
          address: normalizeOptional(data.address),
          city: normalizeOptional(data.city),
          state: normalizeOptional(data.state),
          zip: normalizeOptional(data.zip),
          phone: data.phone,
          status: data.status,
          confirmed: toDbConfirmed(data.confirmed),
          avatarUrl: data.avatarUrl ?? null,
          blocked: !!data.blocked,
          locationId: data.locationId ?? null,
        };
        const res = await api.post("/customers", payload);
        const created = mapApiToCustomer(
          ensureBookingsArray(res.data?.data ?? res.data)
        );
        setCustomers((prev) => [created, ...prev]);
        return created;
      } catch (e: any) {
        const msg =
          e?.response?.data?.error ||
          e?.message ||
          "Failed to create customer";
        setError(msg);
        throw new Error(msg);
      } finally {
        setLoading(false);
      }
    },
    [api]
  );

  const updateCustomer = React.useCallback(
    async (id: number, patch: Partial<Customer>) => {
      setLoading(true);
      setError(null);
      try {
        const payload: any = {};
        if (patch.email !== undefined)
          payload.email = String(patch.email).trim();
        if (patch.firstName !== undefined)
          payload.firstName = String(patch.firstName).trim();
        if (patch.lastName !== undefined)
          payload.lastName = String(patch.lastName).trim();
        if (patch.companyName !== undefined)
          payload.companyName = normalizeOptional(patch.companyName);
        if (patch.address !== undefined)
          payload.address = normalizeOptional(patch.address);
        if (patch.city !== undefined)
          payload.city = normalizeOptional(patch.city);
        if (patch.state !== undefined)
          payload.state = normalizeOptional(patch.state);
        if (patch.zip !== undefined)
          payload.zip = normalizeOptional(patch.zip);
        if (patch.locationId !== undefined)
          payload.locationId = patch.locationId ?? null;
        if (patch.phone !== undefined)
          payload.phone = String(patch.phone).trim();
        if (patch.status !== undefined) payload.status = patch.status;
        if (patch.confirmed !== undefined)
          payload.confirmed = toDbConfirmed(patch.confirmed);

        // NEW
        if (patch.avatarUrl !== undefined)
          payload.avatarUrl = patch.avatarUrl ?? null;
        if (patch.blocked !== undefined) payload.blocked = !!patch.blocked;
        // if unblocking, clear reason; if blocking and no reason passed, send empty string to allow backend defaults
        if (patch.blockedReason !== undefined)
          payload.blockedReason = patch.blocked
            ? patch.blockedReason ?? ""
            : null;

        const res = await api.put(`/customers/${id}`, payload);
        const updated = mapApiToCustomer(
          ensureBookingsArray(res.data?.data ?? res.data)
        );
        setCustomers((prev) => prev.map((c) => (c.id === id ? updated : c)));
        return updated;
      } catch (e: any) {
        const msg =
          e?.response?.data?.error ||
          e?.message ||
          "Failed to update customer";
        setError(msg);
        throw new Error(msg);
      } finally {
        setLoading(false);
      }
    },
    [api]
  );

  const deleteCustomer = React.useCallback(
    async (id: number) => {
      setLoading(true);
      setError(null);
      try {
        await api.delete(`/customers/${id}`);
        setCustomers((prev) => prev.filter((c) => c.id !== id));
      } catch (e: any) {
        const msg =
          e?.response?.data?.error ||
          e?.message ||
          "Failed to delete customer";
        setError(msg);
        throw new Error(msg);
      } finally {
        setLoading(false);
      }
    },
    [api]
  );

  /* Dedicated endpoints so history is recorded server-side */
  const archiveCustomer = React.useCallback(
    async (id: number) => {
      await api.put(`/customers/${id}/archive`);
      await fetchCustomers();
    },
    [api, fetchCustomers]
  );

  const restoreCustomer = React.useCallback(
    async (id: number) => {
      await api.put(`/customers/${id}/restore`);
      await fetchCustomers();
    },
    [api, fetchCustomers]
  );

  const setCustomerBlock = React.useCallback(
    async (id: number, blocked: boolean, reason?: string | null) => {
      await api.put(`/customers/${id}/block`, {
        blocked,
        reason: blocked ? reason ?? null : null,
      });
      await fetchCustomers();
    },
    [api, fetchCustomers]
  );

  const getCustomerHistory = React.useCallback(
    async (id: number) => {
      const res = await api.get(`/customers/${id}/history`);
      return (res.data?.data ?? []) as Array<{
        id: number;
        at: string;
        actorId: number | null;
        actorName?: string | null;
        actorRole?: string | null;
        action: string;
        changes?: any;
        reason?: string | null;
        actorDisplay?: string;
      }>;
    },
    [api]
  );


  const getCustomerById = React.useCallback(
    async (id: number): Promise<Customer | null> => {
      try {
        const res = await api.get(`/customers/${id}`);
        const raw = res.data?.data ?? res.data;
        if (!raw) return null;

        // this keeps whatever `bookings` the backend attached
        return mapApiToCustomer(ensureBookingsArray(raw));
      } catch (e: any) {
        const msg =
          e?.response?.data?.error ||
          e?.message ||
          "Failed to fetch customer";
        setError(msg);
        return null;
      }
    },
    [api]
  );

  return {
    customers,
    loading,
    error,
    fetchCustomers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    archiveCustomer,
    restoreCustomer,
    setCustomerBlock,
    getCustomerHistory,
    getCustomerById,      // 👈 expose it
  };
}