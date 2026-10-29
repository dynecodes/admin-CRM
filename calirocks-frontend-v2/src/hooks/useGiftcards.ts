// src/hooks/useGiftcards.ts (UPDATED with all actions)
import * as React from "react";
import {
  GiftcardPurchase,
  GiftcardSettings,
  GiftcardFormData,
  GiftcardRedemption,
} from "../types/giftcards";
import {
  mockGiftcardPurchases,
  mockGiftcardSettings,
} from "../utils/mockGiftcardsData";

type Updater<T> = (items: T[]) => T[];

// Change log type for tracking
interface ChangeLog {
  id: number;
  giftcardId: number;
  action: string;
  description: string;
  performedBy: string;
  timestamp: string;
  amount?: number;
  previousValue?: string;
  newValue?: string;
}

export function useGiftcards() {
  const [giftcards, setGiftcards] = React.useState<GiftcardPurchase[]>(
    mockGiftcardPurchases,
  );
  const [settings, setSettings] =
    React.useState<GiftcardSettings>(mockGiftcardSettings);
  const [changeLogs, setChangeLogs] = React.useState<ChangeLog[]>([]);
  const [loading, setLoading] = React.useState(false);

  const set = (u: Updater<GiftcardPurchase>) =>
    setGiftcards((prev) => u([...prev]));

  const getGiftcard = (id: number) => giftcards.find((g) => g.id === id);

  const getGiftcardByCode = (code: string) =>
    giftcards.find((g) => g.code.toLowerCase() === code.toLowerCase());

  const isCodeTaken = (code: string, excludeId?: number) =>
    giftcards.some(
      (g) => g.code.toLowerCase() === code.toLowerCase() && g.id !== excludeId,
    );

  const generateGiftcardCode = (): string => {
    const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const segments = 3;
    const segmentLength = 4;

    const code = Array(segments)
      .fill(0)
      .map(() =>
        Array(segmentLength)
          .fill(0)
          .map(() => chars[Math.floor(Math.random() * chars.length)])
          .join(""),
      )
      .join("-");

    if (isCodeTaken(code)) {
      return generateGiftcardCode();
    }

    return code;
  };

  const purchaseGiftcard = async (data: GiftcardFormData): Promise<number> => {
    setLoading(true);
    try {
      const now = new Date().toISOString();
      const nextId = Math.max(0, ...giftcards.map((g) => g.id)) + 1;
      const code = generateGiftcardCode();

      const newGiftcard: GiftcardPurchase = {
        id: nextId,
        code,
        sender: data.sender,
        senderEmail: data.senderEmail,
        recipient: data.recipient,
        recipientEmail: data.recipientEmail,
        message: data.message,
        amount: data.amount,
        balance: data.amount,
        status: "active",
        purchaseDate: now,
        expirationDate: null,
        transactionId: `ch_${Math.random().toString(36).substring(2, 15)}`,
        redemptions: [],
        created_at: now,
        updated_at: now,
        redeemDate: undefined,
      };

      set((list) => {
        list.push(newGiftcard);
        return list;
      });

      // Add log
      setChangeLogs((logs) => [
        ...logs,
        {
          id: logs.length + 1,
          giftcardId: nextId,
          action: "created",
          description: "Gift card purchased",
          performedBy: "System",
          timestamp: now,
          amount: data.amount,
        },
      ]);

      return nextId;
    } finally {
      setLoading(false);
    }
  };

  const updateGiftcard = async (
    id: number,
    data: Partial<GiftcardPurchase>,
  ): Promise<void> => {
    setLoading(true);
    try {
      const now = new Date().toISOString();

      set((list) =>
        list.map((g) =>
          g.id === id
            ? {
                ...g,
                ...data,
                updated_at: now,
              }
            : g,
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  // ========== NEW ACTIONS FROM SCREENSHOTS ==========

  // 1. Send Receipt (Screenshot 1)
  const sendReceipt = async (id: number, email: string): Promise<void> => {
    setLoading(true);
    try {
      const now = new Date().toISOString();

      // In production, make API call here
      // await fetch('/api/giftcards/send-receipt', { ... })

      console.log(`Sending receipt for gift card ${id} to ${email}`);

      // Add log
      setChangeLogs((logs) => [
        ...logs,
        {
          id: logs.length + 1,
          giftcardId: id,
          action: "receipt_sent",
          description: `Receipt sent to ${email}`,
          performedBy: "Current User",
          timestamp: now,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // 2. Send Gift Card (Screenshot 1)
  const sendGiftcard = async (id: number, email: string): Promise<void> => {
    setLoading(true);
    try {
      const now = new Date().toISOString();

      // In production, make API call here
      // await fetch('/api/giftcards/send-giftcard', { ... })

      console.log(`Sending gift card ${id} to ${email}`);

      // Add log
      setChangeLogs((logs) => [
        ...logs,
        {
          id: logs.length + 1,
          giftcardId: id,
          action: "card_sent",
          description: `Gift card sent to ${email}`,
          performedBy: "Current User",
          timestamp: now,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // 3. Refund Gift Card (Screenshot 2)
  const refundGiftcard = async (
    id: number,
    amount: number,
    refundType: "full" | "partial",
    reason?: string,
  ): Promise<{ success: boolean; newBalance: number }> => {
    setLoading(true);
    try {
      const giftcard = getGiftcard(id);
      if (!giftcard) {
        throw new Error("Gift card not found");
      }

      if (amount > giftcard.balance) {
        throw new Error("Refund amount exceeds available balance");
      }

      const now = new Date().toISOString();
      const newBalance = giftcard.balance - amount;
      const previousBalance = giftcard.balance;

      // Update balance and status
      set((list) =>
        list.map((g) =>
          g.id === id
            ? {
                ...g,
                balance: newBalance,
                status: newBalance === 0 ? "cancelled" : g.status,
                updated_at: now,
              }
            : g,
        ),
      );

      // Add log
      setChangeLogs((logs) => [
        ...logs,
        {
          id: logs.length + 1,
          giftcardId: id,
          action: "refunded",
          description: `${refundType === "full" ? "Full" : "Partial"} refund of $${amount.toFixed(2)}${reason ? ` - ${reason}` : ""}`,
          performedBy: "Current User",
          timestamp: now,
          amount: amount,
          previousValue: previousBalance.toString(),
          newValue: newBalance.toString(),
        },
      ]);

      return { success: true, newBalance };
    } finally {
      setLoading(false);
    }
  };

  // 4. Get Changes (Screenshot 2)
  const getGiftcardChanges = async (id: number): Promise<ChangeLog[]> => {
    // In production, fetch from API
    // const response = await fetch(`/api/giftcards/${id}/changes`);
    // return response.json();

    // For now, return mock data + logged changes
    const giftcard = getGiftcard(id);
    if (!giftcard) return [];

    const baseChanges: ChangeLog[] = [
      {
        id: 1,
        giftcardId: id,
        action: "created",
        description: "Gift card purchased",
        performedBy: "System",
        timestamp: giftcard.purchaseDate,
        amount: giftcard.amount,
      },
    ];

    // Add any logged changes for this gift card
    const logged = changeLogs.filter((log) => log.giftcardId === id);

    return [...baseChanges, ...logged].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  };

  // 5. Get Redemptions (Screenshot 2)
  const getGiftcardRedemptions = async (
    id: number,
  ): Promise<GiftcardRedemption[]> => {
    // In production, fetch from API with booking details
    // const response = await fetch(`/api/giftcards/${id}/redemptions`);
    // return response.json();

    const giftcard = getGiftcard(id);
    if (!giftcard) return [];

    return giftcard.redemptions || [];
  };

  // ========== END NEW ACTIONS ==========

  const cancelGiftcard = async (id: number): Promise<void> => {
    await updateGiftcard(id, { status: "cancelled" });
  };

  const archiveGiftcard = async (id: number): Promise<void> => {
    await updateGiftcard(id, { status: "archived" });
  };

  const redeemGiftcard = async (
    id: number,
    amount: number,
    bookingId?: number,
    redeemedBy?: string,
  ): Promise<void> => {
    setLoading(true);
    try {
      const giftcard = getGiftcard(id);
      if (!giftcard) throw new Error("Giftcard not found");

      if (giftcard.balance < amount) {
        throw new Error("Insufficient balance");
      }

      const now = new Date().toISOString();
      const newBalance = giftcard.balance - amount;
      const nextRedemptionId =
        Math.max(0, ...(giftcard.redemptions?.map((r) => r.id) ?? [0])) + 1;

      const newRedemption: GiftcardRedemption = {
        id: nextRedemptionId,
        giftcardId: id,
        bookingId,
        amount,
        redeemedAt: now,
        redeemedBy,
      };

      set((list) =>
        list.map((g) =>
          g.id === id
            ? {
                ...g,
                balance: newBalance,
                status: newBalance === 0 ? "redeemed" : g.status,
                redemptions: [...(g.redemptions || []), newRedemption],
                updated_at: now,
              }
            : g,
        ),
      );

      // Add log
      setChangeLogs((logs) => [
        ...logs,
        {
          id: logs.length + 1,
          giftcardId: id,
          action: "redeemed",
          description: `Redeemed $${amount.toFixed(2)}${bookingId ? ` for booking #${bookingId}` : ""}`,
          performedBy: redeemedBy || "Customer",
          timestamp: now,
          amount: amount,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (
    data: Partial<GiftcardSettings>,
  ): Promise<void> => {
    setLoading(true);
    try {
      const now = new Date().toISOString();
      setSettings((prev) => ({
        ...prev,
        ...data,
        updated_at: now,
      }));
    } finally {
      setLoading(false);
    }
  };

  const deleteGiftcard = async (id: number): Promise<void> => {
    setLoading(true);
    try {
      set((list) => list.filter((g) => g.id !== id));
    } finally {
      setLoading(false);
    }
  };

  return {
    giftcards,
    settings,
    loading,
    getGiftcard,
    getGiftcardByCode,
    purchaseGiftcard,
    updateGiftcard,
    cancelGiftcard,
    archiveGiftcard,
    redeemGiftcard,
    updateSettings,
    deleteGiftcard,
    isCodeTaken,
    generateGiftcardCode,
    // New actions from screenshots
    sendReceipt,
    sendGiftcard,
    refundGiftcard,
    getGiftcardChanges,
    getGiftcardRedemptions,
  };
}
