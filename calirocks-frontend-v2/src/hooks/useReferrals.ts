// src/hooks/Referrals/useReferrals.ts
import * as React from "react";
import {
  ReferralProgram,
  ReferralSettings,
  ReferralChangeLog,
} from "../types/referrals";
import {
  mockReferralPrograms,
  mockReferralSettings,
  mockReferralChangeLogs,
} from "../utils/mockReferralsData";

type Updater<T> = (items: T[]) => T[];
type NewReferralPayload = Omit<
  ReferralProgram,
  "id" | "created_at" | "updated_at"
> & {
  created_by?: string;
};
export function useReferrals() {
  const getReferralStats = async (id: number) => {
    const r = referrals.find((x) => x.id === id);
    return { newCustomers: r?.metrics?.newCustomers ?? 0 };
  };

  const [referrals, setReferrals] = React.useState<ReferralProgram[]>(() => [
    ...mockReferralPrograms,
  ]);
  const [settings, setSettings] = React.useState<ReferralSettings>(() => ({
    ...mockReferralSettings,
  }));
  const [changeLogs, setChangeLogs] = React.useState<ReferralChangeLog[]>(
    () => [...mockReferralChangeLogs],
  );
  const [loading] = React.useState(false);

  const set = (u: Updater<ReferralProgram>) =>
    setReferrals((prev) => u([...prev]));

  const getReferral = (id: number) => referrals.find((r) => r.id === id);

  const addReferral = async (data: NewReferralPayload) => {
    const now = new Date().toISOString();
    const nextId = Math.max(0, ...referrals.map((r) => r.id)) + 1;
    const newReferral: ReferralProgram = {
      ...data,
      id: nextId,
      created_at: now,
      updated_at: now,
      status: data.status ?? "active",
    };

    set((list) => {
      list.push(newReferral);
      return list;
    });

    // Add change log
    setChangeLogs((logs) => [
      ...logs,
      {
        id: logs.length + 1,
        who: data.created_by || "Unknown User",
        what: "Created Referral program",
        when: now,
        referralId: nextId,
      },
    ]);
  };

  const updateReferral = (id: number, patch: Partial<ReferralProgram>) => {
    const now = new Date().toISOString();
    set((list) =>
      list.map((r) =>
        r.id === id
          ? {
              ...r,
              ...patch,
              updated_at: now,
            }
          : r,
      ),
    );

    // Add change log
    setChangeLogs((logs) => [
      ...logs,
      {
        id: logs.length + 1,
        who: "Current User",
        what: "Updated Referral program",
        when: now,
        referralId: id,
      },
    ]);
  };

  const deleteReferral = (id: number) => {
    set((list) => list.filter((r) => r.id !== id));

    // Add change log
    const now = new Date().toISOString();
    setChangeLogs((logs) => [
      ...logs,
      {
        id: logs.length + 1,
        who: "Current User",
        what: "Deleted Referral program",
        when: now,
        referralId: id,
      },
    ]);
  };

  const archiveReferral = (id: number) => {
    updateReferral(id, { status: "archived" });
  };

  const updateSettings = (newSettings: Partial<ReferralSettings>) => {
    const now = new Date().toISOString();
    setSettings((prev) => ({
      ...prev,
      ...newSettings,
      updated_at: now,
    }));

    // Add change log
    setChangeLogs((logs) => [
      ...logs,
      {
        id: logs.length + 1,
        who: "Current User",
        what: `${newSettings.isEnabled ? "Enabled" : "Disabled"} Referral Programs`,
        when: now,
      },
    ]);
  };

  return {
    referrals,
    settings,
    changeLogs,
    loading,
    getReferral,
    getReferralStats,
    updateReferral,
    deleteReferral,
    archiveReferral,
    updateSettings,
    addReferral,
  };
}
