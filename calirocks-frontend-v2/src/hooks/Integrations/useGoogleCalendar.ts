// src/hooks/Integrations/useGoogleCalendar.ts
import { useCallback, useEffect, useState } from "react";

export type GoogleCalendarItem = {
  id: string;
  name: string;
};

export type GoogleCalendarSettings = {
  connected: boolean;
  calendars: GoogleCalendarItem[];
  selectedCalendarId: string | null;
  lastSyncAt: string | null;
};

const STORAGE_KEY = "crx_google_calendar_settings_v1";

function loadFromStorage(): GoogleCalendarSettings {
  if (typeof window === "undefined") {
    return {
      connected: false,
      calendars: [],
      selectedCalendarId: null,
      lastSyncAt: null,
    };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        connected: false,
        calendars: [],
        selectedCalendarId: null,
        lastSyncAt: null,
      };
    }
    const parsed = JSON.parse(raw) as GoogleCalendarSettings;
    return {
      connected: !!parsed.connected,
      calendars: Array.isArray(parsed.calendars) ? parsed.calendars : [],
      selectedCalendarId: parsed.selectedCalendarId ?? null,
      lastSyncAt: parsed.lastSyncAt ?? null,
    };
  } catch {
    return {
      connected: false,
      calendars: [],
      selectedCalendarId: null,
      lastSyncAt: null,
    };
  }
}

function saveToStorage(settings: GoogleCalendarSettings) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function useGoogleCalendar() {
  const [settings, setSettings] = useState<GoogleCalendarSettings>(() =>
    loadFromStorage(),
  );
  const [loading] = useState(false);
  const [authorizing, setAuthorizing] = useState(false);
  const [savingCalendar, setSavingCalendar] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // persist to localStorage whenever settings change
  useEffect(() => {
    saveToStorage(settings);
  }, [settings]);

  const clearMessages = () => {
    setError(null);
    setSuccessMessage(null);
  };

  /** Step 1 – Authorize (mocked for now) */
  const authorize = useCallback(async () => {
    clearMessages();
    setAuthorizing(true);

    try {
      // In real life, you’d redirect to your backend OAuth route here.
      // For now, just mark as connected + add a few fake calendars.
      await new Promise((res) => setTimeout(res, 700));

      const mockCalendars: GoogleCalendarItem[] = [
        { id: "primary", name: "Primary" },
        { id: "team", name: "Team Calendar" },
        { id: "owner", name: "Owner Personal" },
      ];

      setSettings((prev) => ({
        ...prev,
        connected: true,
        calendars: mockCalendars,
        // keep previous selection if still present
        selectedCalendarId:
          prev.selectedCalendarId &&
          mockCalendars.some((c) => c.id === prev.selectedCalendarId)
            ? prev.selectedCalendarId
            : null,
      }));
      setSuccessMessage("Google Calendar has been authorized.");
    } catch (e: any) {
      setError(
        e?.message || "Failed to authorize with Google Calendar. Try again.",
      );
    } finally {
      setAuthorizing(false);
    }
  }, []);

  /** Step 2 – Save chosen calendar */
  const saveSelectedCalendar = useCallback(
    async (calendarId: string | null) => {
      clearMessages();
      if (!calendarId) {
        setError("Please choose a calendar before saving.");
        return;
      }

      setSavingCalendar(true);
      try {
        // In real life, call your backend here.
        await new Promise((res) => setTimeout(res, 500));

        setSettings((prev) => ({
          ...prev,
          selectedCalendarId: calendarId,
        }));
        setSuccessMessage("Calendar selection has been saved.");
      } catch (e: any) {
        setError(e?.message || "Failed to save calendar.");
      } finally {
        setSavingCalendar(false);
      }
    },
    [],
  );

  /** Step 3 – Synchronize bookings */
  const syncBookings = useCallback(async () => {
    clearMessages();
    if (!settings.connected || !settings.selectedCalendarId) {
      setError(
        "You need to authorize and choose a calendar before synchronizing.",
      );
      return;
    }

    setSyncing(true);
    try {
      // In real life, call your backend to start a sync job.
      await new Promise((res) => setTimeout(res, 1200));

      setSettings((prev) => ({
        ...prev,
        lastSyncAt: new Date().toISOString(),
      }));
      setSuccessMessage("Bookings synchronization has been started.");
    } catch (e: any) {
      setError(e?.message || "Failed to synchronize bookings.");
    } finally {
      setSyncing(false);
    }
  }, [settings.connected, settings.selectedCalendarId]);

  return {
    settings,
    loading,
    authorizing,
    savingCalendar,
    syncing,
    error,
    successMessage,
    setError,
    setSuccessMessage,
    authorize,
    saveSelectedCalendar,
    syncBookings,
  };
}
