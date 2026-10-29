import * as React from "react";
import usePrivateService from "../Auth/usePrivateService";

/* -------------------- Types -------------------- */

// src/hooks/Customers/useCustomerAddresses.ts
export type CustomerAddress = {
  id: number;
  address: string;
  city: string;
  state: string;
  zip: string;
  locationId: number | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

const mapApiAddress = (row: any): CustomerAddress => ({
  id: Number(row.id),
  address: row.address ?? "",
  city: row.city ?? "",
  state: row.state ?? "",
  zip: row.zip ?? "",
  locationId:
    row.location_id != null
      ? Number(row.location_id)
      : row.locationId != null
      ? Number(row.locationId)
      : null,
  isDefault:
    row.is_default === 1 ||
    row.is_default === true ||
    row.isDefault === 1 ||
    row.isDefault === true,
  createdAt: row.created_at ?? row.createdAt ?? new Date().toISOString(),
  updatedAt: row.updated_at ?? row.updatedAt ?? new Date().toISOString(),
});

/* Removes blank → null */
// const normalizeOptional = (v: any): string | null =>
//   v == null || String(v).trim() === "" ? null : String(v).trim();

/* -------------------- Hook -------------------- */

export function useCustomerAddresses() {
  const api = usePrivateService();

  const [addresses, setAddresses] = React.useState<CustomerAddress[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  /* ===========================================================
     GET all addresses
  ============================================================ */
  const getAddresses = React.useCallback(
    async (customerId: number) => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/customers/${customerId}/addresses`);
        const raw = res.data?.data ?? [];

        const list = raw.map(mapApiAddress);
        setAddresses(list);
        return list;
      } catch (e: any) {
        const msg =
          e?.response?.data?.error || e?.message || "Failed to fetch addresses";
        setError(msg);
        throw new Error(msg);
      } finally {
        setLoading(false);
      }
    },
    [api]
  );

  /* ===========================================================
     ADD address
  ============================================================ */
  const addAddress = React.useCallback(
    async (customerId: number, data: any): Promise<CustomerAddress> => {
      setLoading(true);
      setError(null);
      try {
        const payload = {
        address: data.address ?? "",
        city: data.city ?? "",
        state: data.state ?? "",
        zip: data.zip ?? "",
        locationId: data.locationId ?? null,
        isDefault: !!data.isDefault,
        };

        const res = await api.post(`/customers/${customerId}/addresses`, payload);


        const created = mapApiAddress(res.data?.data ?? res.data);

        // Prepend if default, else append
        setAddresses((prev) =>
          created.isDefault
            ? [created, ...prev.map((a) => ({ ...a, isDefault: false }))]
            : [...prev, created]
        );

        return created;
      } catch (e: any) {
        const msg =
          e?.response?.data?.error ||
          e?.message ||
          "Failed to create customer address";
        setError(msg);
        throw new Error(msg);
      } finally {
        setLoading(false);
      }
    },
    [api]
  );

  /* ===========================================================
     UPDATE address
  ============================================================ */
  const updateAddress = React.useCallback(
  async (customerId: number, addressId: number, patch: Partial<CustomerAddress>) => {
    setLoading(true);
    setError(null);

    try {
      const payload: any = {
        address: patch.address,
        city: patch.city,
        state: patch.state,
        zip: patch.zip,
        // 👇 camelCase
        locationId: patch.locationId ?? null,
      };

      // Only send isDefault when caller actually wants to change it
      if (typeof patch.isDefault === "boolean") {
        payload.isDefault = patch.isDefault;
      }

      const res = await api.put(
        `/customers/${customerId}/addresses/${addressId}`,
        payload
      );

      const updated = mapApiAddress(res.data?.data ?? res.data);

      setAddresses((prev) => {
        let list = prev.map((a) => (a.id === addressId ? updated : a));

        // If this one is default now, clear default on others
        if (updated.isDefault) {
          list = list.map((a) =>
            a.id === updated.id ? a : { ...a, isDefault: false }
          );
        }

        return list;
      });

      return updated;
    } catch (e: any) {
      const msg =
        e?.response?.data?.error ||
        e?.message ||
        "Failed to update customer address";
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  },
  [api]
);


  /* ===========================================================
     DELETE address
  ============================================================ */
  const deleteAddress = React.useCallback(
    async (customerId: number, addressId: number) => {
      setLoading(true);
      setError(null);
      try {
        await api.delete(
          `/customers/${customerId}/addresses/${addressId}`
        );
        setAddresses((prev) => prev.filter((a) => a.id !== addressId));
      } catch (e: any) {
        const msg =
          e?.response?.data?.error ||
          e?.message ||
          "Failed to delete address";
        setError(msg);
        throw new Error(msg);
      } finally {
        setLoading(false);
      }
    },
    [api]
  );

  /* ===========================================================
     SET DEFAULT address
  ============================================================ */
  const setDefaultAddress = React.useCallback(
    async (customerId: number, addressId: number) => {
      setLoading(true);
      setError(null);

      try {
        const res = await api.put(
          `/customers/${customerId}/addresses/${addressId}/default`
        );

        const updated = mapApiAddress(res.data?.data ?? res.data);

        setAddresses((prev) =>
          prev.map((a) =>
            a.id === updated.id
              ? { ...a, isDefault: true }
              : { ...a, isDefault: false }
          )
        );

        return updated;
      } catch (e: any) {
        const msg =
          e?.response?.data?.error ||
          e?.message ||
          "Failed to set default address";
        setError(msg);
        throw new Error(msg);
      } finally {
        setLoading(false);
      }
    },
    [api]
  );

  return {
    addresses,
    loading,
    error,

    getAddresses,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
  };
}
