// src/hooks/Quotes/useQuotes.ts
import * as React from "react";
import usePrivateService from "../../hooks/Auth/usePrivateService";
import type { BookingFormState } from "../../types/bookings";

export type QuoteStatus =
  | "draft"
  | "sent"
  | "accepted"
  | "declined"
  | "expired"
  | "converted";

export type QuoteRecord = {
  id: number;
  companyId: number;
  bookingId?: number;
  status: QuoteStatus;
  expiresInDays: number;
  expirationAt: string | null;
  sentAt?: string | null;
  acceptedAt?: string | null;
  declinedAt?: string | null;
  convertedBookingId?: number;
  publicToken?: string | null;
  /** Full BookingForm snapshot saved at quote time */
  payload?: BookingFormState;
  createdAt: string;
  updatedAt: string;
};

export function useQuotes(basePath = "/quotes") {
  const api = usePrivateService();

  const [quotes, setQuotes] = React.useState<QuoteRecord[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async (params?: { status?: QuoteStatus }) => {
    setLoading(true);
    setError(null);
    try {
      const qs = params?.status ? `?status=${encodeURIComponent(params.status)}` : "";
      const res = await api.get(`${basePath}${qs}`);
      const data = res?.data?.data ?? res?.data ?? res;
      setQuotes(Array.isArray(data) ? data : data?.data ?? []);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load quotes");
    } finally {
      setLoading(false);
    }
  }, [api, basePath]);

  const getQuote = React.useCallback(async (id: number): Promise<QuoteRecord | undefined> => {
    try {
      const res = await api.get(`${basePath}/${id}`);
      return (res?.data?.data ?? res?.data ?? res) as QuoteRecord;
    } catch {
      return undefined;
    }
  }, [api, basePath]);

  /** Create a draft quote from the exact BookingForm snapshot */
  const createQuote = React.useCallback(async (payload: {
    status?: QuoteStatus;           // default "draft"
    expiresInDays?: number;         // optional
    expirationAt?: string | null;   // optional ISO (nullable)
    payload: BookingFormState;      // 🔒 strongly typed snapshot
  }) => {
    const res = await api.post(basePath, payload);
    const created = res?.data?.data ?? res?.data ?? res;
    setQuotes(qs => [created, ...qs]);
    return created as QuoteRecord;
  }, [api, basePath]);

  const updateQuote = React.useCallback(async (id: number, patch: Partial<{
    status: QuoteStatus;
    expiresInDays: number;
    expirationAt: string | null;
    sentAt: string | null;
    acceptedAt: string | null;
    declinedAt: string | null;
    payload: BookingFormState;
  }>) => {
    const res = await api.put(`${basePath}/${id}`, patch);
    const updated = res?.data?.data ?? res?.data ?? res;
    setQuotes(qs => qs.map(q => q.id === id ? updated : q));
    return updated as QuoteRecord;
  }, [api, basePath]);

  const deleteQuote = React.useCallback(async (id: number) => {
    await api.delete(`${basePath}/${id}`);
    setQuotes(qs => qs.filter(q => q.id !== id));
  }, [api, basePath]);

  /** Convert quote → booking (backend path OR you can ignore and just open BookingForm with payload) */
  const convertQuote = React.useCallback(async (id: number) => {
    const res = await api.post(`${basePath}/${id}/convert`, {});
    setQuotes(qs => qs.map(q => q.id === id ? { ...q, status: "converted" } : q));
    return res?.data?.data ?? res?.data ?? res;
  }, [api, basePath]);

  const changeExpiration = React.useCallback(async (id: number, isoDateOrNull: string | null) => {
    return updateQuote(id, { expirationAt: isoDateOrNull ?? null });
  }, [updateQuote]);

  React.useEffect(() => { refresh().catch(() => void 0); }, [refresh]);

  return {
    quotes, loading, error,
    refresh, getQuote, createQuote, updateQuote, deleteQuote, convertQuote, changeExpiration
  };
}
