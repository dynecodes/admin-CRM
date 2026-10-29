// src/hooks/Integrations/useGoogleAnalytics.ts
import { useState, useEffect, useCallback } from "react";
import type { GoogleAnalyticsSettings } from "../../types/googleAnalytics";
import { mockGoogleAnalyticsSettings } from "../../utils/mockGoogleAnalytics";

/* ------------------------------------------------------------------ */
/* localStorage helpers                                               */
/* ------------------------------------------------------------------ */

const SETTINGS_KEY = "google_analytics_settings";
const hasWindow = typeof window !== "undefined";

function readFromStorage<T>(key: string, fallback: T): T {
  if (!hasWindow) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
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

/* ------------------------------------------------------------------ */
/* Hook                                                               */
/* ------------------------------------------------------------------ */

export const useGoogleAnalytics = () => {
  const [settings, setSettings] = useState<GoogleAnalyticsSettings | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  // initial load
  useEffect(() => {
    const stored = readFromStorage<GoogleAnalyticsSettings>(
      SETTINGS_KEY,
      mockGoogleAnalyticsSettings,
    );
    setSettings(stored);
    setLoading(false);
  }, []);

  const updateSettings = useCallback(
    async (
      next: Partial<GoogleAnalyticsSettings>,
    ): Promise<GoogleAnalyticsSettings> => {
      const current = settings || mockGoogleAnalyticsSettings;
      const merged: GoogleAnalyticsSettings = {
        ...current,
        ...next,
      };
      setSettings(merged);
      writeToStorage(SETTINGS_KEY, merged);
      return merged;
    },
    [settings],
  );

  return {
    settings,
    loading,
    updateSettings,
  };
};
