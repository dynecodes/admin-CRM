import * as React from "react";
import { useState, useMemo, useEffect } from "react";
import { Button, Radio, Alert, Spinner } from "flowbite-react";

import CheckboxDropdown, {
  type CDItem,
} from "../../components/ui/DropDownButton";
import {
  useRecurringSettings,
} from "../../hooks/RecurringSettings/useRecurringSettings";
import {
  RecurringSettings,
  RecurringDiscountMode,
} from "../../types/recurringSettings";

const RecurringBookingsPage: React.FC = () => {
  const {
    settings,
    loading,
    saving,
    error,
    successMessage,
    saveSettings,
    setError,
    setSuccessMessage,
  } = useRecurringSettings();

  const [form, setForm] = useState<RecurringSettings>({
    mode: "exclude_first",
    blockCount: 12,
  });

  useEffect(() => {
    if (settings) {
      setForm(settings);
    }
  }, [settings]);

  const { isValid, problems } = useMemo(() => {
    const p: string[] = [];
    if (!form.blockCount || form.blockCount <= 0) {
      p.push("Block count must be greater than 0.");
    }
    return { isValid: p.length === 0, problems: p };
  }, [form]);

  const handleSave = async () => {
    if (!isValid) {
      alert("Fix validation errors first");
      return;
    }
    try {
      await saveSettings(form);
    } catch {
      // handled in hook
    }
  };

  const handleCancel = () => {
    if (settings) {
      setForm(settings);
    } else {
      setForm({ mode: "exclude_first", blockCount: 12 });
    }
    setError(null);
    setSuccessMessage(null);
  };

  const blockOptions: CDItem[] = React.useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => i + 1).map((n) => ({
        value: String(n),
        label: String(n),
      })),
    []
  );

  return (
    <div className="px-4 sm:px-5 pb-10 space-y-6">
      <div className="mb-10 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Recurring Bookings
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Control how frequency discounts are applied to recurring appointments.
          </p>
        </div>
        {loading && <Spinner size="sm" />}
      </div>

      {error && (
        <Alert
          color="failure"
          onDismiss={() => setError(null)}
          className="max-w-xl"
        >
          {error}
        </Alert>
      )}
      {successMessage && (
        <Alert
          color="success"
          onDismiss={() => setSuccessMessage(null)}
          className="max-w-xl"
        >
          {successMessage}
        </Alert>
      )}

      <div className="border border-gray-200 bg-gray-50 rounded-md p-5">
        <h3 className="text-base font-semibold text-gray-900 mb-1">
          Frequency Discount
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Choose how the recurring discount applies and how many future
          bookings are blocked when changes are made.
        </p>

        <div className="space-y-3">
          <label className="flex items-start gap-3">
            <Radio
              color="gray"
              className="cursor-pointer"
              name="discount-mode"
              checked={form.mode === "all_bookings"}
              onChange={() =>
                setForm((s) => ({
                  ...s,
                  mode: "all_bookings" as RecurringDiscountMode,
                }))
              }
            />
            <span className="pt-0.5 text-sm text-gray-800">
              Applies to <strong>ALL bookings</strong> of a recurring
              appointment
            </span>
          </label>

          <label className="flex items-start gap-3">
            <Radio
              color="gray"
              className="cursor-pointer"
              name="discount-mode"
              checked={form.mode === "exclude_first"}
              onChange={() =>
                setForm((s) => ({
                  ...s,
                  mode: "exclude_first" as RecurringDiscountMode,
                }))
              }
            />
            <span className="pt-0.5 text-sm text-gray-800">
              Excludes the <strong>First booking</strong> of a recurring
              appointment
            </span>
          </label>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3 pl-7">
          <span className="text-sm font-medium text-gray-900 w-16">Block</span>

          <div className="w-28">
            <CheckboxDropdown
              items={blockOptions}
              values={[String(form.blockCount)]}
              single
              onChange={(next) => {
                const v = next[0];
                setForm((s) => ({
                  ...s,
                  blockCount: v ? Number(v) : 0,
                }));
              }}
              placeholder="Select…"
            />
          </div>

          <span className="text-sm text-gray-700">
            recurring booking(s) into the future
          </span>
        </div>

        {problems.length > 0 && (
          <ul className="mt-3 list-disc pl-6 text-xs text-red-600">
            {problems.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button color="light" className="cursor-pointer" onClick={handleCancel} disabled={saving}>
          Cancel
        </Button>
        <Button
          color="gray"
          className="cursor-pointer"
          onClick={handleSave}
          disabled={!isValid || saving}
        >
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
};

export default RecurringBookingsPage;
