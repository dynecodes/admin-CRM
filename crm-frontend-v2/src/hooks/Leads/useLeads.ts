// src/hooks/Leads/useLeads.ts
import * as React from "react";
import type { Lead, LeadStage } from "../../types/leads";
import { mockLeadsData } from "../../utils/mockLeadsData";

type Updater<T> = (items: T[]) => T[];

const STORAGE_KEY = "__calirocks_leads__";

function loadFromStorage(): Lead[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as Lead[];
  } catch {}
  return null;
}

function saveToStorage(leads: Lead[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
  } catch {}
}

function nextId(leads: Lead[]) {
  return Math.max(0, ...leads.map((l) => l.id)) + 1;
}

type AddLeadInput = Omit<Lead, "id" | "created_at" | "stage"> & {
  created_at?: string;
  stage?: LeadStage;
};

export function useLeads() {
  const [leads, setLeads] = React.useState<Lead[]>(
    () => loadFromStorage() ?? mockLeadsData,
  );

  React.useEffect(() => {
    saveToStorage(leads);
  }, [leads]);

  const set = (u: Updater<Lead>) => {
    setLeads((prev) => u([...prev]));
  };

  /* ============== CRUD ============== */

  // ✅ No duplicate `stage` key; no TS2783 warning
  const addLead = (input: AddLeadInput) => {
    set((list) => {
      const id = nextId(list);

      const {
        created_at: createdAtIn,
        stage: stageIn,
        ...rest
      } = input;

      const created_at = createdAtIn ?? new Date().toISOString();
      const stage: LeadStage = stageIn ?? "new";

      const lead: Lead = {
        id,
        created_at,
        stage,
        ...rest,
      };
      list.push(lead);
      return list;
    });
  };

  const updateLead = (id: number, patch: Partial<Lead>) => {
    set((list) => {
      const idx = list.findIndex((l) => l.id === id);
      if (idx >= 0) list[idx] = { ...list[idx], ...patch };
      return list;
    });
  };

  const removeLead = (id: number) => {
    set((list) => list.filter((l) => l.id !== id));
  };

  const bulkImport = (items: Array<Partial<Lead>>) => {
    set((list) => {
      items.forEach((raw) => {
        const id = nextId(list);
        const created_at = raw.created_at ?? new Date().toISOString();
        const stage = (raw.stage ?? "new") as LeadStage;
        list.push({
          id,
          created_at,
          stage,
          firstName: raw.firstName,
          lastName: raw.lastName,
          company: raw.company,
          email: raw.email,
          phone: raw.phone,
          address: raw.address,
          serviceKey: raw.serviceKey,
          serviceName: raw.serviceName,
          source: raw.source,
          providerId: raw.providerId ?? null,
          score: (raw.score as number) ?? null,
          next_follow_up: raw.next_follow_up ?? null,
          notes: raw.notes,
        });
      });
      return list;
    });
  };

  const resetToMock = () => {
    set(() => [...mockLeadsData]);
  };

  /* ============== Pipeline / Ownership helpers ============== */

  const setStage = (id: number, stage: LeadStage) => updateLead(id, { stage });
  const assignProvider = (id: number, providerId: number | null) =>
    updateLead(id, { providerId });
  const setNextFollowUp = (id: number, iso: string | null) =>
    updateLead(id, { next_follow_up: iso });
  const setScore = (id: number, score: number | null) =>
    updateLead(id, { score });

  /* ============== Query helpers ============== */

  const getById = React.useCallback(
    (id: number) => leads.find((l) => l.id === id),
    [leads],
  );
  const listByStage = React.useCallback(
    (stage: LeadStage) => leads.filter((l) => l.stage === stage),
    [leads],
  );
  const listAssignedTo = React.useCallback(
    (providerId: number) => leads.filter((l) => l.providerId === providerId),
    [leads],
  );

  return {
    leads,
    setLeads,
    addLead,
    updateLead,
    removeLead,
    bulkImport,
    resetToMock,
    setStage,
    assignProvider,
    setNextFollowUp,
    setScore,
    getById,
    listByStage,
    listAssignedTo,
  };
}

export default useLeads;
