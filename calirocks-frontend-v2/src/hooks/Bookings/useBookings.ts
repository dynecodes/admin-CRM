// src/hooks/Bookings/useBookings.ts
import * as React from "react";
import usePrivateService from "../Auth/usePrivateService";
import type { Booking, BookingFormState,FrequencySnapshot  } from "../../types/bookings";

// useBookings.ts
const numOrUndef = (v: any) => {
  if (v === undefined || v === null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

/* ---------- Mapping helpers ---------- */
// UI (what your form builds) ➜ API (what controller expects)
function mapUiToApi(input: BookingFormState | (any & { id?: number })) {
  const providerId =
    input.schedule?.providerId ??
    (typeof (input as any).providerId === "number" ? (input as any).providerId : null);

  const rawVars = input.service?.variables ?? (Array.isArray((input as any).variables) ? (input as any).variables : []);
  const rawAdds = input.service?.addons    ?? (Array.isArray((input as any).addons)    ? (input as any).addons    : []);

  const service: any = {
    // only include if present and valid
    ...(numOrUndef(input.service?.categoryId ?? (input as any).categoryId) !== undefined && {
      categoryId: numOrUndef(input.service?.categoryId ?? (input as any).categoryId),
    }),
    ...(numOrUndef(input.service?.serviceId ?? (input as any).serviceId) !== undefined && {
      serviceId: numOrUndef(input.service?.serviceId ?? (input as any).serviceId),
    }),
    ...(numOrUndef(input.service?.frequencyId ?? (input as any).frequencyId) !== undefined && {
      frequencyId: numOrUndef(input.service?.frequencyId ?? (input as any).frequencyId),
    }),
    variables: rawVars.map((v: any) => ({ id: Number(v.id), qty: Number(v.qty || 0) })),
    addons:    rawAdds.map((a: any) => ({ id: Number(a.id), qty: Math.max(1, Number(a.qty || 1)) })),
  };

  return {
    status: input.status ?? "draft",
    customer: { /* unchanged */ 
      id: input.customer?.id,
      firstName: input.customer?.firstName,
      lastName: input.customer?.lastName,
      email: input.customer?.email,
      phone: input.customer?.phone,
      companyName: input.customer?.companyName ?? null,
    },
    address: { /* unchanged */ 
      address: input.address?.address,
      city: input.address?.city,
      state: input.address?.state || null,
      zip: input.address?.zip,
      locationId: input.address?.locationId && input.address.locationId !== "" ? Number(input.address.locationId) : null,
    },
    service,
    schedule: {
      date: input.schedule?.date || null,
      time: input.schedule?.time || null,
      providerId: providerId || null,
    },
    notes: { /* unchanged */ 
      staffNotes: input.notes?.staffNotes ?? null,
      customerNotes: input.notes?.customerNotes ?? null,
    },
    payments: { method: input.payments?.method ?? "" },
    pricing: { /* unchanged */ 
      baseServicePrice: Number(input.pricing?.baseServicePrice || 0),
      extrasTotal: Number(input.pricing?.extrasTotal || 0),
      subtotal: Number(input.pricing?.subtotal || 0),
      adjustmentAmount: Number(input.pricing?.adjustmentAmount || 0),
      finalPrice: input.pricing?.finalPrice == null ? null : Number(input.pricing.finalPrice),
      tip: Number(input.pricing?.tip || 0),
      coupon: input.pricing?.coupon ?? null,
      adjustmentComment: input.pricing?.adjustmentComment ?? null,
      adjustmentAppliesOnlyHere: !!input.pricing?.adjustmentAppliesOnlyHere,
      total: Number(input.pricing?.total || 0),
    },
    serviceLines: { variables: service.variables, addons: service.addons },
    quoteId: input.quoteId ?? null,
  };
}


// API ➜ UI (shape you render everywhere)
function mapApiToUi(row: any): Booking {
  // controller already returns UI-ish fields; keep defensive guards
  const createdAt = row.created_at ?? row.createdAt ?? new Date().toISOString();
  const updatedAt = row.updated_at ?? row.updatedAt ?? createdAt;

  return {
    id: Number(row.id),
    createdAt,
    updatedAt,

    customer: {
      id: Number(row.customer?.id ?? row.customerId ?? 0) || undefined,
      firstName: row.customer?.firstName ?? "",
      lastName: row.customer?.lastName ?? "",
      email: row.customer?.email ?? "",
      phone: row.customer?.phone ?? "",
      companyName: row.customer?.companyName ?? null,
    },
    address: {
      address: row.address?.address ?? row.address ?? "",
      city: row.address?.city ?? row.city ?? "",
      state: row.address?.state ?? row.state ?? "",
      zip: row.address?.zip ?? row.zip ?? "",
      locationId: row.address?.locationId ?? row.locationId ?? "",
    },
   service: {
  categoryId: Number(row.service?.categoryId ?? row.categoryId ?? "") as any,
  serviceId: Number(row.service?.serviceId ?? row.serviceId ?? "") as any,
  frequencyId: Number(row.service?.frequencyId ?? row.frequencyId ?? "") as any,
  variables:
    row.service?.variables ??
    row.variables ??
    [],
  addons:
    row.service?.addons ??
    row.addons ??
    [],
  squareFeet: row.service?.squareFeet ?? row.squareFeet ?? null,

  frequency: (row.service?.frequency ?? null) as FrequencySnapshot | null,
},

    schedule: {
      date: row.schedule?.date ?? row.schedule_date ?? "",
      time: row.schedule?.time ?? row.schedule_time ?? "",
      providerId:
        row.schedule?.providerId ??
        row.providerId ??
        (row.teamId ? Number(row.teamId) : ""),
    },
    notes: {
      staffNotes: row.notes?.staffNotes ?? row.staff_notes ?? null,
      customerNotes: row.notes?.customerNotes ?? row.customer_notes ?? null,
    },
    payments: {
      method: row.payments?.method ?? row.payment_method ?? "",
    },
    pricing: {
      baseServicePrice:
        Number(row.pricing?.baseServicePrice ?? row.base_service_price ?? 0),
      extrasTotal: Number(row.pricing?.extrasTotal ?? row.extras_total ?? 0),
      subtotal: Number(row.pricing?.subtotal ?? row.subtotal ?? 0),
      adjustmentAmount:
        Number(row.pricing?.adjustmentAmount ?? row.adjustment_amount ?? 0),
      finalPrice:
        row.pricing?.finalPrice != null
          ? Number(row.pricing.finalPrice)
          : row.final_price != null
          ? Number(row.final_price)
          : null,
      tip: Number(row.pricing?.tip ?? row.tip ?? 0),
      coupon: row.pricing?.coupon ?? row.coupon ?? null,
      adjustmentComment:
        row.pricing?.adjustmentComment ?? row.adjustment_comment ?? null,
      adjustmentAppliesOnlyHere:
        !!(row.pricing?.adjustmentAppliesOnlyHere ?? row.adjustment_applies_only_here),
      total: Number(row.pricing?.total ?? row.total ?? 0),
    },
    status: row.status ?? "draft",
    quoteId: row.quoteId ?? undefined,
  };
}

/* ---------- Hook ---------- */
export function useBookings() {
  const api = usePrivateService();
  const [bookings, setBookings] = React.useState<Booking[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/bookings");
      const raw = res.data?.data ?? res.data ?? [];
      setBookings(raw.map(mapApiToUi));
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || "Failed to load bookings");
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [api]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const getBooking = React.useCallback(async (id: number) => {
    const res = await api.get(`/bookings/${id}`);
    const body = res.data ?? {};
    const record = Array.isArray(body.data) ? body.data[0] : (body.data ?? body);
    return mapApiToUi(record);
  }, [api]);

  const createBooking = React.useCallback(
    async (draft: BookingFormState) => {
      setLoading(true);
      setError(null);
      try {
        const payload = mapUiToApi(draft);

        // Vite/ESM-safe dev flag (no Node process)
        if (import.meta.env.DEV) {
          console.debug("[POST /bookings] payload", payload);
        }

        const res = await api.post("/bookings", payload);
        const created = mapApiToUi(res.data?.data ?? res.data);
        setBookings((prev) => [created, ...prev]);
        return created;
      } catch (e: any) {
        const msg =
          e?.response?.data?.error ||
          e?.response?.data?.message ||
          e?.message ||
          "Failed to create booking";
        console.error("POST /bookings failed:", e?.response?.data || e?.message || e);
        setError(msg);
        throw new Error(msg);
      } finally {
        setLoading(false);
      }
    },
    [api]
  );

  const updateBooking = React.useCallback(
    async (id: number, patch: Partial<BookingFormState>) => {
      const payload = mapUiToApi(patch as any);
      const res = await api.put(`/bookings/${id}`, payload);
      const updated = mapApiToUi(res.data?.data ?? res.data);
      setBookings((prev) => prev.map((b) => (b.id === id ? updated : b)));
      return updated;
    },
    [api]
  );


    const cancelBooking = React.useCallback(
    async (
      id: number,
      payload: {
        reason?: string;
        scope?: "single" | "series";
        applyFee?: boolean;
      }
    ) => {
      try {
        const res = await api.put(`/bookings/${id}/cancel`, payload);
        const updated = mapApiToUi(res.data?.data ?? res.data);

        setBookings((prev) => prev.map((b) => (b.id === id ? updated : b)));

        return updated;
      } catch (e: any) {
        const msg =
          e?.response?.data?.error ||
          e?.response?.data?.message ||
          e?.message ||
          "Failed to cancel booking";
        console.error("PUT /bookings/:id/cancel failed:", e?.response?.data || e?.message || e);
        setError(msg);
        throw new Error(msg);
      }
    },
    [api]
  );

  const deleteBooking = React.useCallback(
    async (id: number) => {
      await api.delete(`/bookings/${id}`);
      setBookings((prev) => prev.filter((b) => b.id !== id));
    },
    [api]
  );

   const listByCustomer = React.useCallback(
    async (customerId: number): Promise<Booking[]> => {
      setLoading(true);
      setError(null);
      try {
        // 1) preferred, if backend supports nested route
        try {
          const res = await api.get(`/customers/${customerId}/bookings`);
          const raw = res.data?.data ?? res.data ?? [];
          const list = raw.map(mapApiToUi);
          return list;
        } catch {
          // 2) fallback to query param route
          const res = await api.get(`/bookings`, { params: { customerId } });
          const raw = res.data?.data ?? res.data ?? [];
          const list = raw.map(mapApiToUi);
          return list;
        }
      } catch (e: any) {
        const msg =
          e?.response?.data?.error ||
          e?.response?.data?.message ||
          e?.message ||
          "Failed to load customer's bookings";
        setError(msg);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [api]
  );

  return { bookings, loading, error, refresh, getBooking, createBooking, updateBooking,cancelBooking, deleteBooking,listByCustomer };
}
