import * as React from "react";
import { Promotion } from "../../types/promotions";
import { mockPromotions } from "../../utils/mockPromotionsData";

type Updater<T> = (items: T[]) => T[];

export function usePromotions() {
  const [discounts, setDiscounts] = React.useState<Promotion[]>(() =>
    mockPromotions.map((p) => ({
      ...p,
      usageCount:
        p.usageCount ??
        (p.activeBookings?.length || 0) + (p.cancelledBookings?.length || 0),
    })),
  );

  const [loading] = React.useState(false);

  const set = (u: Updater<Promotion>) => setDiscounts((prev) => u([...prev]));

  const isCodeTaken = (code: string, excludeId?: number) =>
    discounts.some(
      (d) => d.code.toLowerCase() === code.toLowerCase() && d.id !== excludeId,
    );

  const getPromotion = (id: number) => discounts.find((d) => d.id === id);

  const archive = async (id: number) => {
    set((list) =>
      list.map((d) => (d.id === id ? { ...d, status: "archived" } : d)),
    );
  };

  const upsert = async (
    payload: Omit<Promotion, "id" | "created_at" | "updated_at"> &
      Partial<Pick<Promotion, "id">>,
  ) => {
    const now = new Date().toISOString();

    if (payload.id) {
      set((list) =>
        list.map((d) =>
          d.id === payload.id
            ? {
                ...d,
                ...payload,
                usageCount:
                  (payload.activeBookings?.length ??
                    d.activeBookings?.length ??
                    0) +
                  (payload.cancelledBookings?.length ??
                    d.cancelledBookings?.length ??
                    0),
                updated_at: now,
              }
            : d,
        ),
      );
      return payload.id;
    }

    const nextId = Math.max(0, ...discounts.map((d) => d.id)) + 1;
    const item: Promotion = {
      ...payload,
      id: nextId,
      created_at: now,
      updated_at: now,
      status: payload.status ?? "active",
      usageCount:
        (payload.activeBookings?.length || 0) +
        (payload.cancelledBookings?.length || 0),
    } as Promotion;

    set((list) => {
      list.push(item);
      return list;
    });
    return nextId;
  };

  // names aligned with Bookings hook
  const addPromotions = async (
    data: Omit<Promotion, "id" | "created_at" | "updated_at">,
  ) => upsert(data);

  const updatePromotion = async (
    id: number,
    data: Omit<Promotion, "id" | "created_at" | "updated_at">,
  ) => upsert({ id, ...data });

  return {
    discounts,
    loading,
    getPromotion,
    addPromotions,
    updatePromotion,
    archive,
    upsert,
    isCodeTaken,
  };
}
