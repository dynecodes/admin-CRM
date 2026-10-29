// src/App/Integrations/GoogleCalendar/index.tsx
import React from "react";
import { Button, Alert, Label, Select, Spinner } from "flowbite-react";
import { HiExclamationCircle, HiCheckCircle, HiCalendar } from "react-icons/hi";
import { useGoogleCalendar } from "../../../hooks/Integrations/useGoogleCalendar";

// NEW: dedicated base URL for Google Calendar integration
const GC_API_BASE =
  import.meta.env.VITE_GOOGLE_CALENDAR_API_BASE_URL ||
  import.meta.env.VITE_API_BASE_URL;

const GoogleCalendarPage: React.FC = () => {
  const {
    settings,
    savingCalendar,
    syncing,
    error,
    successMessage,
    saveSelectedCalendar,
    syncBookings,
    setError,
    setSuccessMessage,
  } = useGoogleCalendar();

  const [pendingCalendarId, setPendingCalendarId] = React.useState<string | "">(
    settings.selectedCalendarId ?? "",
  );

  React.useEffect(() => {
    setPendingCalendarId(settings.selectedCalendarId ?? "");
  }, [settings.selectedCalendarId]);

  const handleSaveCalendar = async () => {
    await saveSelectedCalendar(pendingCalendarId || null);
  };

  const handleDismissAlerts = () => {
    setError(null);
    setSuccessMessage(null);
  };

  const connected = settings.connected;
  const hasCalendars = settings.calendars.length > 0;

  const fmtLastSync = (iso: string | null) => {
    if (!iso) return "Never";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "Never";
    return d.toLocaleString();
  };

  const handleAuthorizeClick = () => {
    setError(null);
    setSuccessMessage(null);

    // use the Google-Calendar-specific backend base
    window.location.href = `${GC_API_BASE}/integrations/google-calendar/authorize`;
  };


  return (
    <div className="px-4 pb-6 sm:px-5">
      <div className="mx-auto max-w-5xl">
        {/* Header (same logo + spacing style as Automated Tasks / GA) */}
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-[230px] flex-shrink-0 items-center gap-4">
            <div className="relative inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-black">
              <HiCalendar className="h-6 w-6 text-white"/>
            </div>
            <div className="font-medium">
              <span className="text-2xl font-bold text-gray-900 sm:text-3xl">
                Google Calendar
              </span>
              <div className="text-sm text-gray-500">
                Connect your Google Calendar so bookings can be synchronized.
              </div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {(error || successMessage) && (
          <div className="mb-4 space-y-2">
            {error && (
              <Alert
                color="failure"
                icon={HiExclamationCircle}
                onDismiss={handleDismissAlerts}
              >
                <span className="text-xs sm:text-sm">{error}</span>
              </Alert>
            )}
            {successMessage && (
              <Alert
                color="success"
                icon={HiCheckCircle}
                onDismiss={handleDismissAlerts}
              >
                <span className="text-xs sm:text-sm">{successMessage}</span>
              </Alert>
            )}
          </div>
        )}

        {/* Main card */}
        <div className="space-y-8 rounded-lg border border-gray-200 bg-gray-50 p-4 shadow-sm sm:p-6">
          {/* Step 1 */}
          <section>
            <h2 className="text-base font-semibold text-gray-900">
              Step 1. Authorize Autommaid to manage your Google Calendars
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Please click <strong>&ldquo;Authorize&rdquo;</strong> to connect
              your Google account and allow access to your calendars.
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Button
                color="gray"
                onClick={handleAuthorizeClick}
                className="cursor-pointer"
              >
                Authorize
              </Button>

              <div className="text-xs text-gray-500">
                Status:{" "}
                {connected ? (
                  <span className="font-medium text-emerald-600">
                    Connected
                  </span>
                ) : (
                  <span className="font-medium text-red-500">
                    Not connected
                  </span>
                )}
              </div>
            </div>
          </section>

          {/* Divider */}
          <hr className="border-gray-200" />

          {/* Step 2 */}
          <section>
            <h2 className="text-base font-semibold text-gray-900">
              Step 2. Choose one of your Google Calendars
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Please choose which calendar you want bookings to be synchronized
              with, then click <strong>Save</strong>.
            </p>

            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex-1">
                <Label
                  htmlFor="gc-calendar-select"
                  className="mb-1 block text-xs font-medium text-gray-700 sm:text-sm"
                >
                  Calendar
                </Label>
                <Select
                  id="gc-calendar-select"
                  value={pendingCalendarId}
                  disabled={!connected || !hasCalendars || savingCalendar}
                  onChange={(e) => setPendingCalendarId(e.target.value)}
                  className="text-sm"
                >
                  <option value="" disabled>
                    {connected
                      ? hasCalendars
                        ? "Select a calendar…"
                        : "No calendars found"
                      : "Authorize first to load calendars"}
                  </option>
                  {settings.calendars.map((cal) => (
                    <option key={cal.id} value={cal.id}>
                      {cal.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="pt-1 sm:pt-6">
                <Button
                  color="gray"
                  onClick={handleSaveCalendar}
                  disabled={
                    !connected ||
                    !pendingCalendarId ||
                    savingCalendar ||
                    !hasCalendars
                  }
                  className="w-full cursor-pointer sm:w-auto"
                >
                  {savingCalendar ? "Saving…" : "Save"}
                </Button>
              </div>
            </div>
          </section>

          {/* Divider */}
          <hr className="border-gray-200" />

          {/* Step 3 */}
          <section>
            <h2 className="text-base font-semibold text-gray-900">
              Step 3. Synchronize bookings
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Once connected and a calendar is selected, click the button below
              to synchronize your bookings.
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Button
                color="success"
                onClick={syncBookings}
                disabled={!connected || !settings.selectedCalendarId || syncing}
                className="cursor-pointer"
              >
                {syncing && (
                  <Spinner
                    size="sm"
                    className="mr-2 text-white"
                    aria-label="Synchronizing…"
                  />
                )}
                {syncing ? "Synchronizing…" : "Synchronize bookings"}
              </Button>

              <div className="text-xs text-gray-500">
                Last synchronized:{" "}
                <span className="font-medium">
                  {fmtLastSync(settings.lastSyncAt)}
                </span>
              </div>
            </div>
          </section>
        </div>

        {/* Footnote like Launch27 */}
        <p className="mt-6 text-xs text-gray-400">
          Tip: After connecting, you can track booking events and availability
          directly in this Google Calendar.
        </p>
      </div>
    </div>
  );
};

export default GoogleCalendarPage;
