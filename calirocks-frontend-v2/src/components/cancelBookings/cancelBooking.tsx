import * as React from "react";
import { useState, useMemo, useEffect } from "react";
import { Button, Radio, Checkbox, Alert, Spinner } from "flowbite-react";

import {
  TextInput as IBTextInput,
} from "../../components/ui/InputsBundle";

import CheckboxDropdown, {
  type CDItem,
} from "../../components/ui/DropDownButton";

import {
  useCancellationSettings,
  type CancellationSettings,
  type PolicyMode,
  type LeadTimeUnit,
  type FeeType,
} from "../../hooks/useCancellationSettings";

const CancelBookingPage: React.FC = () => {
  const {
    settings,
    loading,
    saving,
    error,
    successMessage,
    saveSettings,
  } = useCancellationSettings();

  const [form, setForm] = useState<CancellationSettings>({
    mode: "custom",
    leadTimeValue: 1,
    leadTimeUnit: "days",
    feeType: "flat",
    flatAmount: 80,
    percent: 0,
    requireReason: true,
  });

  // hydrate local form from backend when it loads
  useEffect(() => {
    if (settings) {
      setForm(settings);
    }
  }, [settings]);

  const { isValid, problems } = useMemo(() => {
    const p: string[] = [];
    if (form.mode === "custom" && (!form.leadTimeValue || form.leadTimeValue <= 0)) {
      p.push("Lead time must be greater than 0.");
    }
    if (form.feeType === "flat" && (form.flatAmount ?? 0) < 0) {
      p.push("Flat fee must be non-negative.");
    }
    if (form.feeType === "percent" && (form.percent < 0 || form.percent > 100)) {
      p.push("Percentage must be between 0–100.");
    }
    return { isValid: p.length === 0, problems: p };
  }, [form]);

  const handleSave = async () => {
    if (!isValid) return;
    try {
      await saveSettings(form);
      // you can also hook into your global toast here if you want
    } catch {
      // error already stored in hook
    }
  };

  const handleCancel = () => {
    // revert to last saved settings from backend
    if (settings) {
      setForm(settings);
    }
  };

  const leadTimeOptions: CDItem[] = React.useMemo(
    () => [
      { value: "hours", label: "hours" },
      { value: "days", label: "days" },
    ],
    []
  );

  return (
    <div className="px-4 sm:px-5 pb-10 space-y-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Booking Cancellation</h2>
          <p className="mt-1 text-sm text-gray-500">
            Charges the customer a fee if they cancel their booking after a certain time.
          </p>
        </div>
        {loading && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Spinner size="sm" /> Loading…
          </div>
        )}
      </div>

      {error && (
        <Alert color="failure">
          <span className="font-medium">Error:</span> {error}
        </Alert>
      )}

      {successMessage && (
        <Alert color="success">
          {successMessage}
        </Alert>
      )}

      {/* ======= Policy Section ======= */}
      <div className="border border-gray-200 bg-gray-50 rounded-md p-5">
        <h3 className="text-base font-semibold text-gray-900 mb-1">Policy</h3>
        <p className="text-sm text-gray-500 mb-4">
          Charges the customer a fee if they cancel their booking after a certain time.
        </p>

        <div className="space-y-3">
          <label className="flex items-start gap-3">
            <Radio
              color="gray"
              name="policy-mode"
              checked={form.mode === "prior_day_5pm"}
              onChange={() =>
                setForm((s) => ({ ...s, mode: "prior_day_5pm" as PolicyMode }))
              }
            />
            <span className="pt-0.5 text-sm text-gray-800">
              Cancel by <strong>5pm</strong> the day before the booking
            </span>
          </label>

          <div className="flex flex-col gap-2">
            <label className="flex items-start gap-3">
              <Radio
                color="gray"
                name="policy-mode"
                checked={form.mode === "custom"}
                onChange={() =>
                  setForm((s) => ({ ...s, mode: "custom" as PolicyMode }))
                }
              />
              <span className="pt-0.5 text-sm text-gray-800">
                Set your own Terms
              </span>
            </label>

            <div className="flex flex-wrap items-center gap-2 pl-7">
              <IBTextInput
                type="number"
                min={1}
                value={String(form.leadTimeValue)}
                onChange={(e) =>
                  setForm((s) => ({
                    ...s,
                    leadTimeValue: Number(e.target.value),
                  }))
                }
                className="w-28"
              />

              <div className="w-full">
                <CheckboxDropdown
                  items={leadTimeOptions}
                  values={[form.leadTimeUnit]}
                  single
                  onChange={(next) => {
                    const v = (next[0] ?? "days") as LeadTimeUnit;
                    setForm((s) => ({ ...s, leadTimeUnit: v }));
                  }}
                  placeholder="Select…"
                />
              </div>

              <span className="text-sm text-gray-700">
                before the appointment
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ======= Penalty Fee Section ======= */}
      <div className="border border-gray-200 bg-gray-50 rounded-md p-5">
        <h3 className="text-base font-semibold text-gray-900 mb-1">Penalty Fee</h3>
        <p className="text-sm text-gray-500 mb-4">
          Charge a fee if the cancellation occurs within the policy window.
        </p>

        <div className="space-y-3">
          {/* Flat Fee */}
          <div className="flex flex-col gap-2">
            <label className="flex items-start gap-3">
              <Radio
                color="gray"
                name="fee-type"
                checked={form.feeType === "flat"}
                onChange={() =>
                  setForm((s) => ({ ...s, feeType: "flat" as FeeType }))
                }
              />
              <span className="pt-0.5 text-sm text-gray-800">Flat Fee</span>
            </label>

            <div className="flex items-center gap-2 pl-7">
              <IBTextInput
                type="number"
                min={0}
                step="0.01"
                value={String(form.flatAmount)}
                onChange={(e) =>
                  setForm((s) => ({
                    ...s,
                    flatAmount: Number(e.target.value),
                  }))
                }
                className="w-36"
              />
              <span className="text-sm text-gray-700">$</span>
            </div>
          </div>

          {/* Percentage Fee */}
          <div className="flex flex-col gap-2">
            <label className="flex items-start gap-3">
              <Radio
                color="gray"
                name="fee-type"
                checked={form.feeType === "percent"}
                onChange={() =>
                  setForm((s) => ({ ...s, feeType: "percent" as FeeType }))
                }
              />
              <span className="pt-0.5 text-sm text-gray-800">
                Percentage of pre-tax Total
              </span>
            </label>

            <div className="flex items-center gap-2 pl-7">
              <IBTextInput
                type="number"
                min={0}
                max={100}
                step="0.1"
                value={String(form.percent)}
                onChange={(e) =>
                  setForm((s) => ({
                    ...s,
                    percent: Number(e.target.value),
                  }))
                }
                className="w-28"
              />
              <span className="text-sm text-gray-700">%</span>
            </div>
          </div>
        </div>

        {problems.length > 0 && (
          <ul className="mt-3 list-disc pl-6 text-xs text-red-600">
            {problems.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        )}
      </div>

      {/* ======= Require Reason Section ======= */}
      <div className="border border-gray-200 bg-gray-50 rounded-md p-5">
        <h3 className="text-base font-semibold text-gray-900 mb-1">
          Cancellation Reason
        </h3>
        <p className="text-sm text-gray-500 mb-3">
          Require the customer to provide a reason when cancelling a booking.
        </p>
        <label className="flex items-center gap-3">
          <Checkbox
            color="gray"
            className="cursor-pointer"
            checked={form.requireReason}
            onChange={(e) =>
              setForm((s) => ({
                ...s,
                requireReason: e.target.checked,
              }))
            }
          />
          <span className="text-sm text-gray-800">
            Reason for cancelling the booking must be given
          </span>
        </label>
      </div>

      {/* ======= Actions ======= */}
      <div className="flex justify-end gap-2">
        <Button color="light" className="cursor-pointer" onClick={handleCancel} disabled={saving || loading}>
          Cancel
        </Button>
        <Button
          color="gray"
          className="cursor-pointer"
          onClick={handleSave}
          disabled={!isValid || saving || loading}
        >
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  );
};

export default CancelBookingPage;
