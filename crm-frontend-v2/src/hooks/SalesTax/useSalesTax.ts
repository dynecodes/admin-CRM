// src/hooks/SalesTax/useSalesTax.ts
import { useState, useCallback, useEffect } from "react";
import type {
  SalesTax,
  SalesTaxSettings,
  SalesTaxHistoryEntry,
} from "../../types/salesTax";
import {
  mockSalesTaxes,
  mockSalesTaxSettings,
  // ⬇️ NOTE: we no longer use mockSalesTaxHistory on purpose
  // mockSalesTaxHistory,
} from "../../utils/mockSalesTaxData";

/* ------------------------------------------------------------------ */
/* localStorage helpers                                               */
/* ------------------------------------------------------------------ */

const RULES_KEY = "salesTax_rules";
const SETTINGS_KEY = "salesTax_settings";
const HISTORY_PREFIX = "salesTax_history_";

const hasWindow = typeof window !== "undefined";

function readFromStorage<T>(key: string, fallback: T): T {
  if (!hasWindow) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed as T;
  } catch {
    return fallback;
  }
}

function writeToStorage(key: string, value: unknown) {
  if (!hasWindow) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota errors etc.
  }
}

function loadRulesFromStorage(): SalesTax[] {
  const stored = readFromStorage<SalesTax[]>(RULES_KEY, mockSalesTaxes);
  return stored && stored.length ? stored : mockSalesTaxes;
}

function saveRulesToStorage(rules: SalesTax[]) {
  writeToStorage(RULES_KEY, rules);
}

function loadSettingsFromStorage(): SalesTaxSettings {
  return readFromStorage<SalesTaxSettings>(SETTINGS_KEY, mockSalesTaxSettings);
}

function saveSettingsToStorage(settings: SalesTaxSettings) {
  writeToStorage(SETTINGS_KEY, settings);
}

/**
 * Per-rule history loader.
 * IMPORTANT: we now default to [] so NO mock history is injected.
 */
function loadHistoryForRule(ruleId: number): SalesTaxHistoryEntry[] {
  const key = `${HISTORY_PREFIX}${ruleId}`;
  const stored = readFromStorage<SalesTaxHistoryEntry[]>(key, []);
  return stored && stored.length ? stored : [];
}

function saveHistoryForRule(ruleId: number, entries: SalesTaxHistoryEntry[]) {
  const key = `${HISTORY_PREFIX}${ruleId}`;
  writeToStorage(key, entries);
}

/* ------------------------------------------------------------------ */
/* Hook                                                               */
/* ------------------------------------------------------------------ */

export const useSalesTax = () => {
  const [rules, setRules] = useState<SalesTax[]>([]);
  const [settings, setSettings] = useState<SalesTaxSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);

  // per-rule history cache (kept in memory but also mirrored to localStorage)
  const [historyCache, setHistoryCache] = useState<
    Record<number, SalesTaxHistoryEntry[]>
  >({});

  /* ---------- initial load ---------- */

  useEffect(() => {
    setLoading(true);
    setSettingsLoading(true);
    try {
      setRules(loadRulesFromStorage());
      setSettings(loadSettingsFromStorage());
    } finally {
      setLoading(false);
      setSettingsLoading(false);
    }
  }, []);

  /* ---------- shared validators ---------- */

  const validateRule = useCallback((rule: Partial<SalesTax>) => {
    if (!rule.effective_date) throw new Error("Effective date is required");
    if (rule.tax_percent == null || Number.isNaN(Number(rule.tax_percent))) {
      throw new Error("Tax % is required");
    }
    const pct = Number(rule.tax_percent);
    if (pct < 0 || pct > 100) {
      throw new Error("Tax % must be between 0 and 100");
    }
  }, []);

  /* ---------- history helpers ---------- */

  const pushHistoryForRule = useCallback((ruleId: number, action: string) => {
    setHistoryCache((prev) => {
      const existing =
        prev[ruleId] !== undefined ? prev[ruleId] : loadHistoryForRule(ruleId);

      const nextEntry: SalesTaxHistoryEntry = {
        id: existing.length ? existing[existing.length - 1].id + 1 : 1,
        user_name: "You",
        action,
        created_at: new Date().toISOString(),
        ip_address: "local",
      };

      const nextList = [...existing, nextEntry];
      saveHistoryForRule(ruleId, nextList);

      return {
        ...prev,
        [ruleId]: nextList,
      };
    });
  }, []);

  /* ---------- fetchers (front-end only) ---------- */

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      setRules(loadRulesFromStorage());
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    setSettingsLoading(true);
    try {
      setSettings(loadSettingsFromStorage());
    } finally {
      setSettingsLoading(false);
    }
  }, []);

  /* ---------- CRUD: create / update / delete ---------- */

  const createRule = useCallback(
    async (payload: Partial<SalesTax>): Promise<SalesTax> => {
      validateRule(payload);

      const percent = Number(payload.tax_percent);
      const nowIso = new Date().toISOString();

      const baseRules: SalesTax[] = rules.length
        ? rules
        : loadRulesFromStorage();
      const nextId =
        baseRules.reduce((max, r) => (r.id > max ? r.id : max), 0) + 1;

      const newRule: SalesTax = {
        id: nextId,
        effective_date: payload.effective_date!,
        tax_percent: percent,
        location_ids: payload.location_ids || [],
        created_at: nowIso,
      };

      const updatedRules = [...baseRules, newRule];
      setRules(updatedRules);
      saveRulesToStorage(updatedRules);

      pushHistoryForRule(
        newRule.id,
        `Created Sales Tax: ${percent.toFixed(
          2,
        )}% (effective ${newRule.effective_date})`,
      );

      return newRule;
    },
    [rules, validateRule, pushHistoryForRule],
  );

  const updateRule = useCallback(
    async (id: number, payload: Partial<SalesTax>): Promise<SalesTax> => {
      validateRule(payload);

      const percent = Number(payload.tax_percent);
      const nowIso = new Date().toISOString();

      const baseRules: SalesTax[] = rules.length
        ? rules
        : loadRulesFromStorage();

      let updatedRule: SalesTax | null = null;

      const updatedRules: SalesTax[] = baseRules.map((r) => {
        if (r.id !== id) return r;

        const next: SalesTax = {
          ...r,
          ...payload,
          tax_percent: percent,
          updated_at: nowIso,
        };

        updatedRule = next;
        return next;
      });

      if (!updatedRule) {
        throw new Error("Sales tax rule not found");
      }

      setRules(updatedRules);
      saveRulesToStorage(updatedRules);

      const updated = updatedRule as SalesTax;

      pushHistoryForRule(
        id,
        `Updated Sales Tax to ${percent.toFixed(
          2,
        )}% (effective ${updated.effective_date})`,
      );

      return updated;
    },
    [rules, validateRule, pushHistoryForRule],
  );

  const deleteRule = useCallback(
    async (id: number) => {
      const baseRules: SalesTax[] = rules.length
        ? rules
        : loadRulesFromStorage();
      const updatedRules = baseRules.filter((r) => r.id !== id);
      setRules(updatedRules);
      saveRulesToStorage(updatedRules);

      pushHistoryForRule(id, "Deleted Sales Tax rule");
    },
    [rules, pushHistoryForRule],
  );

  /* ---------- recalc + history ---------- */

  const recalculateRule = useCallback(
    async (id: number) => {
      // purely front-end: just log an entry
      pushHistoryForRule(id, "Recalculated sales taxes for this rule");
      return { ok: true };
    },
    [pushHistoryForRule],
  );

  const getHistory = useCallback(
    async (id: number): Promise<SalesTaxHistoryEntry[]> => {
      if (historyCache[id]) return historyCache[id];

      const list = loadHistoryForRule(id);
      setHistoryCache((prev) => ({ ...prev, [id]: list }));
      return list;
    },
    [historyCache],
  );

  /* ---------- settings ---------- */

  const updateSettings = useCallback(
    async (next: Partial<SalesTaxSettings>): Promise<SalesTaxSettings> => {
      const current = settings || mockSalesTaxSettings;
      const merged: SalesTaxSettings = {
        ...current,
        ...next,
      };
      setSettings(merged);
      saveSettingsToStorage(merged);
      return merged;
    },
    [settings],
  );

  /* ---------- exposed API ---------- */

  return {
    rules,
    loading,
    settings,
    settingsLoading,
    fetchRules,
    fetchSettings,
    createRule,
    updateRule,
    deleteRule,
    recalculateRule,
    getHistory,
    updateSettings,
  };
};
