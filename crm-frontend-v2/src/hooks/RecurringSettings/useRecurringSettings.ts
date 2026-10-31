import { useState, useCallback, useEffect } from "react";
import usePrivateService from "../Auth/usePrivateService";
import {
  RecurringSettings,
} from "../../types/recurringSettings";

const DEFAULT_SETTINGS: RecurringSettings = {
  mode: "exclude_first",
  blockCount: 12,
};

export const useRecurringSettings = () => {
  const privateService = usePrivateService();

  const [settings, setSettings] = useState<RecurringSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await privateService.get("/recurring-settings");
      const data: RecurringSettings = res.data?.data ?? DEFAULT_SETTINGS;
      setSettings(data);
    } catch (err: any) {
      console.error("Error fetching recurring settings:", err);
      const msg =
        err?.response?.data?.error || "Failed to load recurring settings";
      setError(msg);
      setSettings(DEFAULT_SETTINGS);
    } finally {
      setLoading(false);
    }
  }, [privateService]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const saveSettings = useCallback(
    async (payload: RecurringSettings) => {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      try {
        const res = await privateService.put("/recurring-settings", payload);
        const data: RecurringSettings = res.data?.data ?? payload;
        setSettings(data);
        setSuccessMessage("Recurring booking settings saved");
        return data;
      } catch (err: any) {
        console.error("Error saving recurring settings:", err);
        const msg =
          err?.response?.data?.error || "Failed to save recurring settings";
        setError(msg);
        throw new Error(msg);
      } finally {
        setSaving(false);
      }
    },
    [privateService]
  );

  return {
    settings,
    loading,
    saving,
    error,
    successMessage,
    fetchSettings,
    saveSettings,
    setError,
    setSuccessMessage,
  };
};
