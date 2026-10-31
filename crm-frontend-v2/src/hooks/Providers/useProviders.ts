// src/hooks/Providers/useProviders.ts
import * as React from "react";
import { ServiceProvider } from "../../types/providers";
import { mockServiceProviders, getPersonById } from "../../utils/mockProvidersData"; // ✅ Single source

type Updater<T> = (items: T[]) => T[];

export function useProviders() {
  const [providers, setProviders] = React.useState<ServiceProvider[]>(
    () => mockServiceProviders,
  );

  const set: (u: Updater<ServiceProvider>) => void = (u) =>
    setProviders((prev) => u([...prev]));

  const addProvider = (
    p: Omit<ServiceProvider, "id" | "created_at" | "updated_at">,
  ) => {
    set((list) => {
      const id = Math.max(0, ...list.map((i) => i.id)) + 1;
      const now = new Date().toISOString();
      list.push({ ...p, id, created_at: now, updated_at: now });
      return list;
    });
  };

  const updateProvider = (id: number, patch: Partial<ServiceProvider>) => {
    set((list) =>
      list.map((p) =>
        p.id === id
          ? { ...p, ...patch, updated_at: new Date().toISOString() }
          : p,
      ),
    );
  };

  const removeProvider = (id: number) => {
    set((list) => list.filter((p) => p.id !== id));
  };

  const getById = (id: number) => providers.find((p) => p.id === id);

  // Helper to get full person details for any member
  const getPersonDetails = (personId: number) => getPersonById(personId);

  return { 
    providers, 
    addProvider, 
    updateProvider, 
    removeProvider, 
    getById,
    getPersonDetails 
  };
}