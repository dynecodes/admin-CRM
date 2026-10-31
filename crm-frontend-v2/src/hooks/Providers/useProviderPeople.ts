// src/hooks/Providers/useProviderPeople.ts
import * as React from "react";
import { ProviderPerson } from "../../types/providers";
import { mockProviderPeople } from "../../utils/mockProvidersData"; 

type Updater<T> = (items: T[]) => T[];

export function useProviderPeople() {
  const [people, setPeople] = React.useState<ProviderPerson[]>(
    () => mockProviderPeople,
  );

  const set = (u: Updater<ProviderPerson>) => setPeople((prev) => u([...prev]));

  const addPerson = (
    p: Omit<ProviderPerson, "id" | "created_at" | "updated_at">,
  ) => {
    set((list) => {
      const id = Math.max(0, ...list.map((i) => i.id)) + 1;
      const now = new Date().toISOString();
      list.push({ ...p, id, created_at: now, updated_at: now });
      return list;
    });
  };

  const updatePerson = (id: number, patch: Partial<ProviderPerson>) => {
    set((list) =>
      list.map((p) =>
        p.id === id
          ? { ...p, ...patch, updated_at: new Date().toISOString() }
          : p,
      ),
    );
  };

  const removePerson = (id: number) => {
    set((list) => list.filter((p) => p.id !== id));
  };

  const getById = (id: number) => people.find((p) => p.id === id);

  return { people, addPerson, updatePerson, removePerson, getById };
}