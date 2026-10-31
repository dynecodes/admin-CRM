// src/hooks/Analytics/useTrackingHealth.ts
import * as React from "react";
import type { AnalyticsEvent } from "../../types/tracking";

/* ================= Mock data (temporary) ================= */

const mockTrackingHealth: AnalyticsEvent[] = [
  {
    id: 1,
    name: "lead_add",
    platform: "GA4",
    uiFired: true,
    gtmReceived: true,
    successRate: 100,
    lastFiredIso: new Date().toISOString(),
    payload: { leadId: 123, source: "website" },
  },
  {
    id: 2,
    name: "lead_row_selection",
    platform: "Meta",
    uiFired: true,
    gtmReceived: false,
    successRate: 0,
    lastFiredIso: new Date().toISOString(),
    lastError: "GTM trigger not matched",
    payload: { leadId: 456 },
  },
  {
    id: 3,
    name: "lead_stage_changed",
    platform: "GA4",
    uiFired: true,
    gtmReceived: true,
    successRate: 92,
    lastFiredIso: new Date().toISOString(),
    payload: { from: "new", to: "qualified" },
  },
];

/* ================= Hook ================= */

export function useTrackingHealth() {
  const [events, setEvents] = React.useState<AnalyticsEvent[]>(mockTrackingHealth);
  const [loading, setLoading] = React.useState(false);

  // Future real API
  // React.useEffect(() => {
  //   setLoading(true);
  //   fetch("/api/tracking/health")
  //     .then((r) => r.json())
  //     .then(setEvents)
  //     .finally(() => setLoading(false));
  // }, []);

  return {
    events,
    loading,
  };
}

export default useTrackingHealth;
