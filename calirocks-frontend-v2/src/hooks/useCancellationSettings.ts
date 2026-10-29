import * as React from "react";
import usePrivateService from "../hooks/Auth/usePrivateService";

export type LeadTimeUnit = "hours" | "days";
export type PolicyMode = "prior_day_5pm" | "custom";
export type FeeType = "flat" | "percent";

export interface CancellationSettings {
  mode: PolicyMode;
  leadTimeValue: number;
  leadTimeUnit: LeadTimeUnit;
  feeType: FeeType;
  flatAmount: number;
  percent: number;
  requireReason: boolean;
}

const DEFAULT_SETTINGS: CancellationSettings = {
  mode: "custom",
  leadTimeValue: 1,
  leadTimeUnit: "days",
  feeType: "flat",
  flatAmount: 80,
  percent: 0,
  requireReason: true,
};

export function useCancellationSettings() {
  const api = usePrivateService();
  const [settings, setSettings] = React.useState<CancellationSettings | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/booking-cancellation-settings");
      const data = (res.data?.data ?? res.data) as CancellationSettings | undefined;
      setSettings(data ?? DEFAULT_SETTINGS);
    } catch (e: any) {
      const msg =
        e?.response?.data?.error ||
        e?.response?.data?.message ||
        e?.message ||
        "Failed to load booking cancellation settings";
      console.error("GET /booking-cancellation-settings failed:", msg);
      setError(msg);
      setSettings(DEFAULT_SETTINGS);
    } finally {
      setLoading(false);
    }
  }, [api]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const saveSettings = React.useCallback(
    async (next: CancellationSettings) => {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);
      try {
        const payload = {
          mode: next.mode,
          leadTimeValue: next.leadTimeValue,
          leadTimeUnit: next.leadTimeUnit,
          feeType: next.feeType,
          flatAmount: next.flatAmount,
          percent: next.percent,
          requireReason: next.requireReason,
        };

        const res = await api.put("/booking-cancellation-settings", payload);
        const saved = (res.data?.data ?? res.data) as CancellationSettings;
        setSettings(saved);
        setSuccessMessage("Booking cancellation settings saved");
        return saved;
      } catch (e: any) {
        const msg =
          e?.response?.data?.error ||
          e?.response?.data?.message ||
          e?.message ||
          "Failed to save booking cancellation settings";
        console.error("PUT /booking-cancellation-settings failed:", msg);
        setError(msg);
        throw new Error(msg);
      } finally {
        setSaving(false);
      }
    },
    [api]
  );

  return {
    settings,
    loading,
    saving,
    error,
    successMessage,
    refresh,
    saveSettings,
    setSettings, // in case you want to update locally before saving
  };
}
