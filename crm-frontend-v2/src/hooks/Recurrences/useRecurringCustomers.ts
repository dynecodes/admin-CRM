import * as React from "react";
import usePrivateService from "../Auth/usePrivateService";

export interface RecurringCustomer {
  id: number;
  status: "active" | "paused" | "cancelled";
  customer: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    companyName?: string | null;
    status?: string;
    blocked?: boolean;
    confirmed?: boolean | number | string;
    // tag-ish fields – keep loose so UI can read them
    tags?: any;
    details?: any;
    preferences?: any;
    meta?: any;
  };
  service: {
    id: number;
    name: string | null;
  };
  frequency: {
    id: number;
    name: string | null;
    label: string | null;
    intervalDays: number | null;
  };
  schedule: {
    startDate: string;
    lastBookingDate: string;
    nextDate: string | null;
    time: string; // "HH:MM:SS"
    providerId: number | null;
    locationId: number | null;
  };
  meta: {
    baseBookingId: number | null;
    cancellationReason: string | null;
    cancelledAt: string | null;
    createdAt: string;
    updatedAt: string;
  };
}

// Small mapper so backend shape changes don't explode the UI
const mapApiToRecurring = (row: any): RecurringCustomer => ({
  id: Number(row.id),
  status: row.status,
  customer: {
    id: Number(row.customer?.id ?? row.customerId ?? 0),
    firstName: row.customer?.firstName ?? row.customer?.first_name ?? "",
    lastName: row.customer?.lastName ?? row.customer?.last_name ?? "",
    email: row.customer?.email ?? "",
    phone: row.customer?.phone ?? "",
    companyName:
      row.customer?.companyName ??
      row.customer?.company_name ??
      row.customer_company_name ??
      null,
    status: row.customer?.status ?? row.customer_status ?? row.status ?? undefined,
    blocked:
      row.customer?.blocked ??
      row.customer_blocked ??
      row.blocked ??
      false,
    confirmed:
      row.customer?.confirmed ??
      row.customer_confirmed ??
      row.confirmed ??
      undefined,
    tags:
      row.customer?.tags ??
      row.customer_tags ??
      row.tags ??
      undefined,
    details: row.customer?.details ?? undefined,
    preferences: row.customer?.preferences ?? undefined,
    meta: row.customer?.meta ?? undefined,
  },
  service: {
    id: Number(row.service?.id ?? row.serviceId ?? 0),
    name: row.service?.name ?? row.service_name ?? null,
  },
  frequency: {
    id: Number(row.frequency?.id ?? row.frequencyId ?? 0),
    name: row.frequency?.name ?? row.frequency_name ?? null,
    label: row.frequency?.label ?? row.frequency_label ?? null,
    intervalDays:
      row.frequency?.intervalDays ?? row.frequency?.interval_days ?? null,
  },
  schedule: {
    startDate: row.schedule?.startDate ?? row.start_date ?? "",
    lastBookingDate: row.schedule?.lastBookingDate ?? row.last_booking_date ?? "",
    nextDate: row.schedule?.nextDate ?? row.next_date ?? null,
    time: row.schedule?.time ?? row.schedule_time ?? "",
    providerId: row.schedule?.providerId ?? row.providerId ?? null,
    locationId: row.schedule?.locationId ?? row.locationId ?? null,
  },
  meta: {
    baseBookingId: row.meta?.baseBookingId ?? row.base_booking_id ?? null,
    cancellationReason:
      row.meta?.cancellationReason ?? row.cancellation_reason ?? null,
    cancelledAt: row.meta?.cancelledAt ?? row.cancelled_at ?? null,
    createdAt: row.meta?.createdAt ?? row.created_at ?? "",
    updatedAt: row.meta?.updatedAt ?? row.updated_at ?? "",
  },
});

export function useRecurringCustomers(defaultStatus: string = "active") {
  const api = usePrivateService();

  const [recurringCustomers, setRecurringCustomers] = React.useState<
    RecurringCustomer[]
  >([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [statusFilter, setStatusFilter] = React.useState(defaultStatus);

  const refresh = React.useCallback(
    async (statusOverride?: string) => {
      const status = statusOverride ?? statusFilter;
      setLoading(true);
      setError(null);
      try {
        const res = await api.get("/recurring-customers", {
          params: { status },
        });
        const raw = res.data?.data ?? res.data ?? [];
        setRecurringCustomers(raw.map(mapApiToRecurring));
        setStatusFilter(status);
      } catch (e: any) {
        const msg =
          e?.response?.data?.error ||
          e?.response?.data?.message ||
          e?.message ||
          "Failed to load recurring customers";
        setError(msg);
        setRecurringCustomers([]);
      } finally {
        setLoading(false);
      }
    },
    [api, statusFilter]
  );

  React.useEffect(() => {
    // initial load based on defaultStatus passed in
    refresh(defaultStatus);
  }, [refresh, defaultStatus]);

  const getRecurring = React.useCallback(
    async (id: number) => {
      const res = await api.get(`/recurring-customers/${id}`);
      const body = res.data ?? {};
      const record = Array.isArray(body.data) ? body.data[0] : body.data ?? body;
      return mapApiToRecurring(record);
    },
    [api]
  );

  const updateRecurring = React.useCallback(
    async (id: number, patch: any) => {
      const res = await api.put(`/recurring-customers/${id}`, patch);
      const updated = mapApiToRecurring(res.data?.data ?? res.data);
      setRecurringCustomers((prev) =>
        prev.map((r) => (r.id === id ? updated : r))
      );
      return updated;
    },
    [api]
  );

  const cancelRecurring = React.useCallback(
    async (id: number, reason?: string) => {
      const res = await api.delete(`/recurring-customers/${id}`, {
        data: { reason: reason ?? null },
      });
      const updated = mapApiToRecurring(res.data?.data ?? res.data);
      setRecurringCustomers((prev) =>
        prev.map((r) => (r.id === id ? updated : r))
      );
      return updated;
    },
    [api]
  );

  return {
    recurringCustomers,
    loading,
    error,
    statusFilter,
    setStatusFilter,
    refresh,
    getRecurring,
    updateRecurring,
    cancelRecurring,
  };
}
