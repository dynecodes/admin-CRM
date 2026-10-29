import * as React from "react";

export type FunnelStageCfg = {
  id: string;            // stable id for reordering
  name: string;          // label shown in UI
  color: string;         // hex
};

export type FunnelCfg = {
  id: number;
  name: string;
  slug: string;
  sourceId?: string | null; // optional “Connect to Form Source”
  stages: FunnelStageCfg[]; // max 8
  createdAt: string;        // ISO
};

const LS_KEY = "mm_funnels_v1";

function slugify(s: string) {
  return s.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

function load(): FunnelCfg[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
function save(list: FunnelCfg[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(list));
}

export function useFunnels() {
  const [funnels, setFunnels] = React.useState<FunnelCfg[]>(() => load());

  const refresh = React.useCallback(() => setFunnels(load()), []);

  const add = React.useCallback((input: Omit<FunnelCfg, "id" | "slug" | "createdAt">) => {
    const list = load();
    const id = Date.now();
    const slug = slugify(input.name);
    const next: FunnelCfg = { ...input, id, slug, createdAt: new Date().toISOString() };
    const updated = [next, ...list];
    save(updated);
    setFunnels(updated);
    return next;
  }, []);

  const update = React.useCallback((id: number, patch: Partial<FunnelCfg>) => {
    const list = load();
    const updated = list.map(f =>
      f.id === id ? { ...f, ...patch, slug: patch.name ? slugify(patch.name) : f.slug } : f
    );
    save(updated);
    setFunnels(updated);
  }, []);

  const remove = React.useCallback((id: number) => {
    const list = load().filter(f => f.id !== id);
    save(list);
    setFunnels(list);
  }, []);

  const findBySlug = React.useCallback((slug: string) => {
    return funnels.find(f => f.slug === slug);
  }, [funnels]);

  return { funnels, add, update, remove, findBySlug, refresh };
}
