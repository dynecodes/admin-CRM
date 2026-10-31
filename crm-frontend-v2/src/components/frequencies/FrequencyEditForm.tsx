import React, { useState } from "react";
import { Label, Checkbox, Button } from "flowbite-react";
import { FrequencyStatus, FrequencyType } from "../../types/frequency";
import { Dropdown, DropdownItem } from "flowbite-react";
import { useFrequencies } from "../../hooks/useFrequencies";
import MultiSelectDropdown from "../ui/MultiSelectDropdown";
import NumericInput from "../ui/NumericInput";

interface FrequencyEditFormProps {
  frequency: any;
  onSave: (data: any) => void;
  onCancel: () => void;
}

const FREQUENCY_OPTIONS: { key: FrequencyType; label: string }[] = [
  { key: "One Time", label: "One Time" },
  { key: "Every Week", label: "Every Week" },
  { key: "Every 2 Weeks", label: "Every 2 Weeks" },
  { key: "Every 3 Weeks", label: "Every 3 Weeks" },
  { key: "Every 4 Weeks", label: "Every 4 Weeks" },
  { key: "Custom", label: "Custom" },
];

const WEEKDAYS = [
  { key: 0, label: "Sun" },
  { key: 1, label: "Mon" },
  { key: 2, label: "Tue" },
  { key: 3, label: "Wed" },
  { key: 4, label: "Thu" },
  { key: 5, label: "Fri" },
  { key: 6, label: "Sat" },
];

const FrequencyEditForm: React.FC<FrequencyEditFormProps> = ({
  frequency,
  onSave,
  onCancel,
}) => {
  const { frequencyOptions, frequencyUtils } = useFrequencies();

  const [name, setName] = useState(frequency.name);
  const [status, setStatus] = useState<FrequencyStatus>(frequency.status);
  const [staffOnly, setStaffOnly] = useState(frequency.staff_only || false);

  // Parse frequency type from label
  const getFrequencyType = (): FrequencyType => {
    return frequencyUtils.getFrequencyTypeFromLabel(
      frequency.frequency_label,
    ) as FrequencyType;
  };

  const [frequencyType, setFrequencyType] =
    useState<FrequencyType>(getFrequencyType());
  const [customEvery, setCustomEvery] = useState<number>(
    frequency.custom_every || 1,
  );
  const [customDays, setCustomDays] = useState<number[]>(
    frequency.custom_days || [],
  );
  const [discountType, setDiscountType] = useState<"percentage" | "amount">(
    frequency.discount_type || "percentage",
  );
  const [discountValue, setDiscountValue] = useState<number>(
    frequency.discount_value || 0,
  );
  const [discountApplyMode, setDiscountApplyMode] = useState<"all" | "after">(
    frequency.discount_apply_mode || "all",
  );
  const [discountAfterN, setDiscountAfterN] = useState<number>(
    frequency.discount_after_n || 1,
  );
  const [selectedServices, setSelectedServices] = useState<number[]>(
    frequency.services?.map((s: any) => s.id) || [],
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleDayToggle = (dayKey: number) => {
    setCustomDays((prev) =>
      prev.includes(dayKey)
        ? prev.filter((d) => d !== dayKey)
        : [...prev, dayKey].sort(),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert("Frequency name is required");
      return;
    }

    setIsSaving(true);

    try {
      await onSave({
        name: name.trim(),
        frequency_type: frequencyType,
        custom_every: customEvery,
        custom_days: customDays,
        discount_type: discountType,
        discount_value: discountValue,
        discount_apply_mode: discountApplyMode,
        discount_after_n: discountAfterN,
        status,
        is_default: false,
        staff_only: staffOnly,
        services: selectedServices,
      });
    } catch (error) {
      console.error("Failed to save frequency:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to save frequency. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusToggle = async () => {
    if (!name.trim()) {
      alert("Frequency name is required");
      return;
    }

    setIsSaving(true);

    try {
      const newStatus: FrequencyStatus =
        status === "active" ? "archived" : "active";

      await onSave({
        name: name.trim(),
        frequency_type: frequencyType,
        custom_every: customEvery,
        custom_days: customDays,
        discount_type: discountType,
        discount_value: discountValue,
        discount_apply_mode: discountApplyMode,
        discount_after_n: discountAfterN,
        status: newStatus,
        is_default: false,
        staff_only: staffOnly,
        services: selectedServices,
      });

      setStatus(newStatus);
    } catch (error) {
      console.error("Failed to toggle status:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to update status. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label
            htmlFor={`name-${frequency.id}`}
            className="mb-1 block text-xs"
          >
            Frequency Name
          </Label>
          <input
            id={`name-${frequency.id}`}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={50}
            disabled={isSaving}
            className="block w-full rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-xs text-gray-900 focus:border-blue-500 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div>
            <Label className="mb-1 block text-xs">Frequency Type</Label>
            <Dropdown
              label={
                FREQUENCY_OPTIONS.find((opt) => opt.key === frequencyType)
                  ?.label || "Select Frequency"
              }
              dismissOnClick={true}
              size="sm"
              placement="bottom"
              theme={{
                floating: {
                  target:
                    "w-full cursor-pointer rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-xs text-gray-800 hover:bg-gray-200 hover:text-gray-900 focus:ring-2 focus:ring-blue-400",
                  base: "z-50 w-fit rounded-md shadow-md",
                },
              }}
            >
              {FREQUENCY_OPTIONS.map((option) => (
                <DropdownItem
                  key={option.key}
                  onClick={() => setFrequencyType(option.key)}
                >
                  <span className="text-xs">{option.label}</span>
                </DropdownItem>
              ))}
            </Dropdown>
          </div>

          <div>
            <Label className="mb-1 block text-xs">Discount Type</Label>
            <Dropdown
              label={
                discountType === "percentage"
                  ? "Percentage (%)"
                  : "Fixed Amount ($)"
              }
              dismissOnClick={true}
              size="sm"
              placement="bottom"
              theme={{
                floating: {
                  target:
                    "w-full cursor-pointer rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-xs text-gray-800 hover:bg-gray-200 hover:text-gray-900 focus:ring-2 focus:ring-blue-400",
                  base: "z-50 w-fit rounded-md shadow-md",
                },
              }}
            >
              <DropdownItem onClick={() => setDiscountType("percentage")}>
                <span className="text-xs">Percentage (%)</span>
              </DropdownItem>
              <DropdownItem onClick={() => setDiscountType("amount")}>
                <span className="text-xs">Fixed Amount ($)</span>
              </DropdownItem>
            </Dropdown>
          </div>

          <div>
            <Label
              htmlFor={`discount-value-${frequency.id}`}
              className="mb-1 block text-xs"
            >
              Discount Value
            </Label>

            <NumericInput
              value={discountValue}
              onValueChange={setDiscountValue}
              decimals={2}
              min={0}
              max={discountType === "percentage" ? 100 : undefined}
              step={0.01}
              disabled={isSaving}
              placeholder="0.00"
              prefix={discountType === "amount" ? <span>$</span> : undefined}
              suffix={
                discountType === "percentage" ? <span>%</span> : undefined
              }
              className={`block w-full rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-xs text-gray-900 focus:border-blue-500 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 ${
                discountType === "amount" ? "pl-8" : "pr-8"
              }`}
              inputProps={{
                id: `discount-value-${frequency.id}`,
              }}
            />
          </div>
        </div>

        {frequencyType === "Custom" && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-700">Every</span>
                <input
                  type="number"
                  min="1"
                  value={customEvery}
                  onChange={(e) =>
                    setCustomEvery(Math.max(1, parseInt(e.target.value) || 1))
                  }
                  disabled={isSaving}
                  className="w-16 rounded border border-gray-300 px-2 py-1 text-xs focus:border-blue-500 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <span className="text-xs text-gray-700">
                  week{customEvery > 1 ? "s" : ""}
                </span>
              </div>

              <div>
                <Label className="mb-1 block text-xs">On days:</Label>
                <div className="flex w-full rounded-md shadow-sm" role="group">
                  {WEEKDAYS.map((day, index) => {
                    const isFirst = index === 0;
                    const isLast = index === WEEKDAYS.length - 1;
                    const isSelected = customDays.includes(day.key);

                    return (
                      <button
                        key={day.key}
                        type="button"
                        onClick={() => handleDayToggle(day.key)}
                        disabled={isSaving}
                        className={`flex-1 border px-2 py-1 text-xs font-medium transition-colors duration-200 ${isFirst ? "rounded-l-md" : ""} ${isLast ? "rounded-r-md" : ""} ${!isFirst ? "-ml-px" : ""} ${
                          isSelected
                            ? "relative z-10 border-blue-600 bg-blue-600 text-white hover:bg-blue-700"
                            : "border-gray-300 bg-white text-gray-900 hover:bg-gray-50 hover:text-gray-900"
                        } cursor-pointer focus:z-10 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50`}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <Label className="text-xs font-medium">Apply discount to:</Label>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="radio"
                id={`apply-all-${frequency.id}`}
                name={`discount-apply-${frequency.id}`}
                value="all"
                checked={discountApplyMode === "all"}
                onChange={(e) => setDiscountApplyMode(e.target.value as "all")}
                disabled={isSaving}
                className="h-3 w-3 cursor-pointer disabled:cursor-not-allowed"
              />
              <Label
                htmlFor={`apply-all-${frequency.id}`}
                className="cursor-pointer text-xs"
              >
                All jobs in series
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="radio"
                id={`apply-after-${frequency.id}`}
                name={`discount-apply-${frequency.id}`}
                value="after"
                checked={discountApplyMode === "after"}
                onChange={(e) =>
                  setDiscountApplyMode(e.target.value as "after")
                }
                disabled={isSaving}
                className="h-3 w-3 cursor-pointer disabled:cursor-not-allowed"
              />
              <Label
                htmlFor={`apply-after-${frequency.id}`}
                className="mr-1 cursor-pointer text-xs"
              >
                After
              </Label>
              <input
                type="number"
                min="1"
                value={discountAfterN}
                onChange={(e) =>
                  setDiscountAfterN(Math.max(1, parseInt(e.target.value) || 1))
                }
                disabled={discountApplyMode !== "after" || isSaving}
                className="w-12 rounded border border-gray-300 px-1 py-1 text-xs focus:border-blue-500 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-white disabled:opacity-50"
              />
              <span className="text-xs text-gray-700">job(s)</span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <Label className="mb-1 block text-xs">Associated Services</Label>
          <div className="[&_button]:!bg-white [&_button:hover]:!bg-gray-100">
            <MultiSelectDropdown
              options={frequencyOptions.services}
              selected={selectedServices}
              onChange={setSelectedServices}
              placeholder="Select Services"
              modalTitle="Select Services"
              disabled={isSaving}
            />
          </div>
        </div>

        <div className="flex items-center rounded-lg border border-gray-200 bg-white p-3">
          <Checkbox
            id={`staff-only-${frequency.id}`}
            checked={staffOnly}
            onChange={(e) => setStaffOnly(e.target.checked)}
            disabled={isSaving}
            className="h-3 w-3 cursor-pointer bg-white disabled:cursor-not-allowed"
          />
          <Label
            htmlFor={`staff-only-${frequency.id}`}
            className="ml-2 cursor-pointer text-xs"
          >
            Staff only
          </Label>
        </div>

        <div className="flex flex-col justify-end gap-2 border-t border-gray-200 pt-3 sm:flex-row">
          {frequency.status && (
            <Button
              type="button"
              onClick={handleStatusToggle}
              size="xs"
              disabled={isSaving}
              className={`order-first w-full cursor-pointer sm:order-none sm:w-20 ${
                status === "active"
                  ? "bg-orange-500 text-white hover:bg-orange-600 focus:ring-orange-300"
                  : "bg-green-500 text-white hover:bg-green-600 focus:ring-green-300"
              }`}
            >
              {isSaving
                ? "Saving..."
                : status === "active"
                  ? "Archive"
                  : "Activate"}
            </Button>
          )}
          <Button
            color="light"
            onClick={onCancel}
            size="xs"
            disabled={isSaving}
            className="w-full cursor-pointer border sm:w-20"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            color="blue"
            size="xs"
            disabled={isSaving || !name.trim()}
            className="w-full cursor-pointer sm:w-20"
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    </>
  );
};

export default FrequencyEditForm;
