import * as React from "react";
import usePrivateService from "../Auth/usePrivateService";

/* ---------- Types ---------- */
export type CustomerDetailsPayload = {
  tags: string[];
  preferred_teams: number[];
  do_not_serve_teams: number[];

  // NEW (moved here, services removed)
  specialSalesTaxEnabled?: boolean;
  specialSalesTaxPercent?: number | null;
};

export type CustomerNote = {
  id: number;
  authorId?: number | null;
  body: string;
  created_at: string;
  updated_at?: string;
};

export type CustomerNotificationPrefs = {
  booking_email: boolean;
  booking_sms: boolean;
  reminder_email: boolean;
  reminder_sms: boolean;
  changes_email: boolean;
  receipt_email: boolean;
};

export type CustomerPaymentMethod = {
  id: number;
  gateway: string;
  token: string;
  brand?: string;
  last4?: string;
  expMonth?: number;
  expYear?: number;
  isDefault?: boolean;
};

/* ---------- Hook ---------- */
export function useCustomerExtras(companyId?: number) {
  const api = usePrivateService();

  /* ================= DETAILS ================= */
  const getDetails = React.useCallback(async (customerId: number) => {
    const res = await api.get(`/customers/${customerId}/details`, {
      params: companyId ? { companyId } : undefined,
    });
    // backend returns camel/json fields already
    return res.data?.data as CustomerDetailsPayload;
  }, [api, companyId]);

  const saveDetails = React.useCallback(
    async (customerId: number, payload: CustomerDetailsPayload) => {
      const res = await api.put(`/customers/${customerId}/details`, payload);
      return res.data?.data as CustomerDetailsPayload;
    },
    [api],
  );

  /* ================= NOTES ================= */
  const listNotes = React.useCallback(async (customerId: number) => {
    const res = await api.get(`/customers/${customerId}/notes`);
    return res.data?.data as CustomerNote[];
  }, [api]);

  const addNote = React.useCallback(
    async (customerId: number, body: string) => {
      const res = await api.post(`/customers/${customerId}/notes`, { body });
      return res.data;
    },
    [api],
  );

  const deleteNote = React.useCallback(
    async (customerId: number, noteId: number) => {
      const res = await api.delete(`/customers/${customerId}/notes/${noteId}`);
      return res.data;
    },
    [api],
  );

  /* ================= EMAIL PREFS ================= */
  const getNotifications = React.useCallback(async (customerId: number) => {
    const res = await api.get(`/customers/${customerId}/notifications`);
    return res.data?.data as CustomerNotificationPrefs;
  }, [api]);

  const saveNotifications = React.useCallback(
    async (customerId: number, prefs: CustomerNotificationPrefs) => {
      const res = await api.put(`/customers/${customerId}/notifications`, prefs);
      return res.data?.data as CustomerNotificationPrefs;
    },
    [api],
  );

  /* ================= PAYMENT METHODS ================= */
  const listPaymentMethods = React.useCallback(async (customerId: number) => {
    const res = await api.get(`/customers/${customerId}/payment-methods`);
    return res.data?.data as CustomerPaymentMethod[];
  }, [api]);

  const addPaymentMethod = React.useCallback(
    async (customerId: number, data: Omit<CustomerPaymentMethod, "id">) => {
      const res = await api.post(`/customers/${customerId}/payment-methods`, data);
      return res.data;
    },
    [api],
  );

  const deletePaymentMethod = React.useCallback(
    async (customerId: number, id: number) => {
      const res = await api.delete(`/customers/${customerId}/payment-methods/${id}`);
      return res.data;
    },
    [api],
  );

  return {
    // Details (no services, includes special tax)
    getDetails,
    saveDetails,

    // Notes
    listNotes,
    addNote,
    deleteNote,

    // Notifications
    getNotifications,
    saveNotifications,

    // Payments
    listPaymentMethods,
    addPaymentMethod,
    deletePaymentMethod,
  };
}
