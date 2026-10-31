// src/components/Customers/EditForm/NotificationPreferences.tsx
import * as React from "react";
import { Button, ToggleSwitch, Tooltip } from "flowbite-react";
import { HiQuestionMarkCircle } from "react-icons/hi";

/** ========================= Types ========================= */
export type CustomerPrefValues = {
  /** Transactional */
  bookingConfirmationEmail: boolean;
  bookingConfirmationSms: boolean;
  remindersEmail: boolean; // day-before / morning-of reminders
  remindersSms: boolean;
  bookingChangesEmail: boolean; // cancellations & reschedules
  receiptEmail: boolean; // email payment receipts

  /** Marketing (opt-ins) */
  marketingEmailOptIn: boolean;
  marketingSmsOptIn: boolean;
};

type Props = {
  /** Seed values from your Customer model */
  initial?: CustomerPrefValues;
  /** Persist handler; may return canonical values from server */
  onSave?: (
    values: CustomerPrefValues
  ) => void | CustomerPrefValues | Promise<void | CustomerPrefValues>;
};

/** Reasonable defaults: transactional = on, marketing = off */
const DEFAULTS: CustomerPrefValues = {
  bookingConfirmationEmail: true,
  bookingConfirmationSms: true,
  remindersEmail: true,
  remindersSms: true,
  bookingChangesEmail: true,
  receiptEmail: true,
  marketingEmailOptIn: false,
  marketingSmsOptIn: false,
};

function isEqual(a: CustomerPrefValues, b: CustomerPrefValues) {
  return (
    a.bookingConfirmationEmail === b.bookingConfirmationEmail &&
    a.bookingConfirmationSms === b.bookingConfirmationSms &&
    a.remindersEmail === b.remindersEmail &&
    a.remindersSms === b.remindersSms &&
    a.bookingChangesEmail === b.bookingChangesEmail &&
    a.receiptEmail === b.receiptEmail &&
    a.marketingEmailOptIn === b.marketingEmailOptIn &&
    a.marketingSmsOptIn === b.marketingSmsOptIn
  );
}

/** ========================= Component ========================= */
export default function NotificationPreferences({ initial, onSave }: Props) {
  const seed = initial ?? DEFAULTS;

  const [values, setValues] = React.useState<CustomerPrefValues>(seed);
  const [saving, setSaving] = React.useState(false);
  const [dirty, setDirty] = React.useState(false);

  // Keep track of last committed values (after save or external sync)
  const lastSavedRef = React.useRef<CustomerPrefValues>(seed);

  // Sync when parent genuinely changes canonical values
  React.useEffect(() => {
    if (!initial) return;
    if (!isEqual(initial, lastSavedRef.current)) {
      setValues(initial);
      lastSavedRef.current = initial;
      setDirty(false);
    }
  }, [initial]);

  const update = <K extends keyof CustomerPrefValues>(
    k: K,
    v: CustomerPrefValues[K]
  ) => {
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
      const committed =
        maybeUpdated && typeof maybeUpdated === "object"
          ? (maybeUpdated as CustomerPrefValues)
          : values;

      lastSavedRef.current = committed;
      setValues(committed);
      setDirty(false);
    } catch (err) {
      console.error("Customer preferences save failed:", err);
      // keep dirty so user can retry
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
      <ToggleSwitch checked={value} label="" onChange={onChange} />
    </div>
  );

  return (
    <div className="space-y-4 p-4">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-gray-900">
            Customer Notifications &amp; Preferences
          </h3>
          <p className="mt-2 text-sm text-gray-600">
            Choose which messages this customer receives by email or SMS.
          </p>
        </div>
      </div>

      {/* Transactional */}
      <div className="space-y-3 mt-6">
        <h4 className="text-sm font-semibold text-gray-800">Transactional</h4>
        <Row
          label="Booking Confirmation (Email)"
          help="Email a confirmation after a booking is created or accepted."
          value={values.bookingConfirmationEmail}
          onChange={(v) => update("bookingConfirmationEmail", v)}
        />
        <Row
          label="Booking Confirmation (SMS)"
          help="Send an SMS confirmation after a booking is created or accepted."
          value={values.bookingConfirmationSms}
          onChange={(v) => update("bookingConfirmationSms", v)}
        />
        <Row
          label="Reminders (Email)"
          help="Email reminders (e.g., day before or morning of the service)."
          value={values.remindersEmail}
          onChange={(v) => update("remindersEmail", v)}
        />
        <Row
          label="Reminders (SMS)"
          help="SMS reminders (e.g., day before or morning of the service)."
          value={values.remindersSms}
          onChange={(v) => update("remindersSms", v)}
        />
        <Row
          label="Booking Changes (Email)"
          help="Email when a booking is cancelled or rescheduled."
          value={values.bookingChangesEmail}
          onChange={(v) => update("bookingChangesEmail", v)}
        />
        <Row
          label="Payment Receipt (Email)"
          help="Email a receipt after a payment is processed."
          value={values.receiptEmail}
          onChange={(v) => update("receiptEmail", v)}
        />
      </div>

      {/* Marketing */}
      {/* <div className="space-y-3 mt-8">
        <h4 className="text-sm font-semibold text-gray-800">Marketing (Opt-In)</h4>
        <Row
          label="Promotions & Updates (Email)"
          help="Allow marketing emails like promos, newsletters, and updates."
          value={values.marketingEmailOptIn}
          onChange={(v) => update("marketingEmailOptIn", v)}
        />
        <Row
          label="Promotions & Updates (SMS)"
          help="Allow marketing SMS like promos and special offers."
          value={values.marketingSmsOptIn}
          onChange={(v) => update("marketingSmsOptIn", v)}
        />
      </div> */}

      {/* Save */}
      <div className="flex flex-row justify-end shrink-0 pt-1">
        <Button
          color="blue"
          onClick={handleSave}
          disabled={!dirty || saving}
          className="px-8 inline-flex items-center gap-2 cursor-pointer"
        >
          {saving && (
            <svg
              className="h-4 w-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"
              />
            </svg>
          )}
          {saving ? "Saving..." : dirty ? "Save" : "Saved"}
        </Button>
      </div>
    </div>
  );
}
