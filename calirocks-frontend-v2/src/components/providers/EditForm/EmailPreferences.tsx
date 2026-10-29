// src/components/Providers/EditForm/EmailTab.tsx
import * as React from "react";
import { Button, ToggleSwitch, Tooltip } from "flowbite-react";
import { HiQuestionMarkCircle } from "react-icons/hi";

export type EmailTabValues = {
  bookingInviteEmail: boolean;
  bookingInviteSms: boolean;
  dailyScheduleSms: boolean;
  bookingCancelledEmail: boolean;
};

type Props = {
  /** Seed values (use your provider model to supply these) */
  initial?: EmailTabValues;
  /** Persist handler from the parent editor.
   *  You may optionally return the updated, canonical values from the server.
   */
  onSave?: (values: EmailTabValues) => void | EmailTabValues | Promise<void | EmailTabValues>;
};

const DEFAULTS: EmailTabValues = {
  bookingInviteEmail: true,
  bookingInviteSms: true,
  dailyScheduleSms: true,
  bookingCancelledEmail: true,
};

function isEqual(a: EmailTabValues, b: EmailTabValues) {
  return (
    a.bookingInviteEmail === b.bookingInviteEmail &&
    a.bookingInviteSms === b.bookingInviteSms &&
    a.dailyScheduleSms === b.dailyScheduleSms &&
    a.bookingCancelledEmail === b.bookingCancelledEmail
  );
}

export default function EmailTab({ initial, onSave }: Props) {
  const seed = initial ?? DEFAULTS;

  const [values, setValues] = React.useState<EmailTabValues>(seed);
  const [saving, setSaving] = React.useState(false);
  const [dirty, setDirty] = React.useState(false);

  // Tracks the most recently "committed" (saved or externally synced) state
  const lastSavedRef = React.useRef<EmailTabValues>(seed);

  // Sync from parent ONLY when parent truly changes the canonical values
  React.useEffect(() => {
    if (!initial) return;
    if (!isEqual(initial, lastSavedRef.current)) {
      setValues(initial);
      lastSavedRef.current = initial;
      setDirty(false);
    }
  }, [initial]);

  const update = <K extends keyof EmailTabValues>(k: K, v: EmailTabValues[K]) => {
    setValues((prev) => {
      const next = { ...prev, [k]: v };
      setDirty(!isEqual(next, lastSavedRef.current));
      return next;
    });
  };

  const handleSave = async () => {
    if (!dirty || saving) return;
    setSaving(true);
    try {
      const maybeUpdated = await onSave?.(values);

      // If parent returned canonical values (e.g., server echo), use them.
      const committed = (maybeUpdated && typeof maybeUpdated === "object")
        ? (maybeUpdated as EmailTabValues)
        : values;

      lastSavedRef.current = committed;
      setValues(committed);
      setDirty(false);
    } catch (err) {
      // Keep dirty=true so the user can retry
      console.error("EmailTab save failed:", err);
    } finally {
      setSaving(false);
    }
  };

  const Row = ({
    label,
    help,
    value,
    onChange,
  }: {
    label: string;
    help: string;
    value: boolean;
    onChange: (v: boolean) => void;
  }) => (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-gray-200 bg-white px-4 py-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900">{label}</span>
          <Tooltip content={help} style="light">
            <HiQuestionMarkCircle className="h-4 w-4 text-gray-400" />
          </Tooltip>
        </div>
        <p className="mt-0.5 text-xs text-gray-500">{help}</p>
      </div>
      <ToggleSwitch color="gray" checked={value} label="" onChange={onChange} />
    </div>
  );

  return (
    <div className="space-y-4 p-4">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Email &amp; SMS Preferences</h3>
          <p className="mt-2 text-sm text-gray-600">
            Choose which notifications the team should receive.
          </p>
        </div>
      </div>

      <div className="space-y-3 mt-8">
        <Row
          label="Booking Invitation (Email)"
          help="Send an email when a new booking invitation is created."
          value={values.bookingInviteEmail}
          onChange={(v) => update("bookingInviteEmail", v)}
        />
        <Row
          label="Booking Invitation (SMS)"
          help="Send an SMS when a new booking invitation is created."
          value={values.bookingInviteSms}
          onChange={(v) => update("bookingInviteSms", v)}
        />
        <Row
          label="Daily Schedule (SMS)"
          help="Morning text with today's bookings."
          value={values.dailyScheduleSms}
          onChange={(v) => update("dailyScheduleSms", v)}
        />
        <Row
          label="Booking Cancelled (Email)"
          help="Email when a team booking is cancelled."
          value={values.bookingCancelledEmail}
          onChange={(v) => update("bookingCancelledEmail", v)}
        />
      </div>

      {/* Save button */}
      <div className="flex flex-row justify-end shrink-0 pt-1 ">
        <Button
          color="gray"
          onClick={handleSave}
          disabled={!dirty || saving}
          className="px-8 inline-flex items-center gap-2 cursor-pointer"
        >
          {saving && (
            <svg
              className="h-4 w-4 animate-spin cursor-pointer"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle
                className="opacity-25 cursor-pointer"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75 cursor-pointer"
                fill="currentColor"
                d="M4 12a 8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"
              />
            </svg>
          )}
          {saving ? "Saving..." : dirty ? "Save" : "Saved"}
        </Button>
      </div>
    </div>
  );
}
