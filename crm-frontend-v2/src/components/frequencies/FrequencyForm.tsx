import React, { useActionState, useRef, useEffect, useState } from "react";
import { Alert, Label, Checkbox, Card, Radio } from "flowbite-react";
import { HiExclamationCircle, HiCheckCircle, HiClock } from "react-icons/hi";
import { Link } from "react-router-dom";
import {
  Frequency,
  FrequencyStatus,
  FrequencyType,
  FrequencyFormData,
} from "../../types/frequency";
import { useFrequencies } from "../../hooks/useFrequencies";
import FormActions from "../ui/FormActions";
import { Dropdown, DropdownItem } from "flowbite-react";
import MultiSelectDropdown from "../ui/MultiSelectDropdown";
import NumericInput from "../ui/NumericInput";

interface FrequencyFormProps {
  frequency?: Frequency;
  onSuccess: (frequencyData: any) => void;
  onCancel: () => void;
}

interface ActionState {
  success: boolean;
  message: string | null;
  data: any;
  error: string | null;
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
  { key: 0, label: "Sun", fullLabel: "Sunday" },
  { key: 1, label: "Mon", fullLabel: "Monday" },
  { key: 2, label: "Tue", fullLabel: "Tuesday" },
  { key: 3, label: "Wed", fullLabel: "Wednesday" },
  { key: 4, label: "Thu", fullLabel: "Thursday" },
  { key: 5, label: "Fri", fullLabel: "Friday" },
  { key: 6, label: "Sat", fullLabel: "Saturday" },
];

const FrequencyForm: React.FC<FrequencyFormProps> = ({
  frequency,
  onSuccess,
  onCancel,
}) => {
  const formRef = useRef<HTMLFormElement>(null);
  const hasCalledOnSuccess = useRef(false);
  const isEditing = !!frequency;
  const { frequencyUtils, frequencyOptions } = useFrequencies();

  // Parse existing frequency data
  const parsedCustom = frequency
    ? frequencyUtils.parseCustomFrequency(frequency.frequency_label)
    : { every: 1, days: [] };
  const initialFrequencyType = frequency
    ? (frequencyUtils.getFrequencyTypeFromLabel(
        frequency.frequency_label,
      ) as FrequencyType)
    : "Every Week";

  // Form states
  const [frequencyType, setFrequencyType] =
    useState<FrequencyType>(initialFrequencyType);
  const [frequencyStatus, setFrequencyStatus] = useState<FrequencyStatus>(
    frequency?.status || "active",
  );
  const [staffOnly, setStaffOnly] = useState<boolean>(
    frequency?.staff_only || false,
  );
  const [customEvery, setCustomEvery] = useState<number>(parsedCustom.every);
  const [customDays, setCustomDays] = useState<number[]>(parsedCustom.days);
  const [discountType, setDiscountType] = useState<"percentage" | "amount">(
    frequency?.discount_type || "percentage",
  );
  const [discountValue, setDiscountValue] = useState<number>(
    frequency?.discount_value || 0,
  );
  const [discountApplyMode, setDiscountApplyMode] = useState<"all" | "after">(
    frequency?.discount_apply_mode || "all",
  );
  const [discountAfterN, setDiscountAfterN] = useState<number>(
    frequency?.discount_after_n || 1,
  );
  const [selectedServices, setSelectedServices] = useState<number[]>(
    frequency?.services?.map((s) => s.id) || [],
  );
  const [isPending, setIsPending] = useState(false);

  const frequencyAction = async (
    _prevState: ActionState,
    formData: FormData,
  ): Promise<ActionState> => {
    try {
      const data = Object.fromEntries(formData);

      const frequencyData: FrequencyFormData = {
        name: data.name as string,
        frequency_type: frequencyType,
        custom_every: customEvery,
        custom_days: customDays,
        discount_type: discountType,
        discount_value: discountValue,
        discount_apply_mode: discountApplyMode,
        discount_after_n: discountAfterN,
        status: frequencyStatus,
        is_default: false,
        staff_only: staffOnly,
        services: selectedServices,
      };

      // Call the onSuccess handler which will handle the API call
      await onSuccess(frequencyData);

      return {
        success: true,
        message: `Frequency ${isEditing ? "updated" : "created"} successfully!`,
        data: frequencyData,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        message: null,
        data: null,
        error: (error as Error).message,
      };
    }
  };

  const [state, _dispatch] = useActionState(frequencyAction, {
    success: false,
    message: null,
    data: null,
    error: null,
  });

  useEffect(() => {
    if (state.success && state.data && !hasCalledOnSuccess.current) {
      hasCalledOnSuccess.current = true;
      if (!isEditing) {
        formRef.current?.reset();
        setFrequencyType("Every Week");
        setFrequencyStatus("active");
        setStaffOnly(false);
        setCustomEvery(1);
        setCustomDays([]);
        setDiscountValue(0);
        setDiscountApplyMode("all");
        setDiscountAfterN(1);
        setSelectedServices([]);
      }
    }
  }, [state.success, state.data, isEditing]);

  const handleDayToggle = (dayKey: number) => {
    setCustomDays((prev) =>
      prev.includes(dayKey)
        ? prev.filter((d) => d !== dayKey)
        : [...prev, dayKey].sort(),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);

    try {
      const formData = new FormData(formRef.current!);
      const result = await frequencyAction(state, formData);

      if (!result.success) {
        alert(result.error);
      }
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setIsPending(false);
    }
  };

  // Handle immediate status toggle
  const handleStatusToggle = async () => {
    if (!isEditing || !frequency) return;

    try {
      const nameValue = formRef.current?.elements.namedItem(
        "name",
      ) as HTMLInputElement;
      if (!nameValue?.value.trim()) {
        alert("Frequency name is required");
        return;
      }

      const newStatus: FrequencyStatus =
        frequencyStatus === "active" ? "archived" : "active";

      setIsPending(true);

      const frequencyData: FrequencyFormData = {
        name: nameValue.value.trim(),
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
      };

      console.log("Toggling status with data:", frequencyData);

      // Call onSuccess which will handle the API call
      await onSuccess(frequencyData);

      // Update local state only after successful API call
      setFrequencyStatus(newStatus);
    } catch (error) {
      console.error("Failed to toggle status:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to update status. Please try again.",
      );
    } finally {
      setIsPending(false);
    }
  };

  const pathPrefix = window.location.pathname.split("/")[1];

  return (
    <>
      <div className="space-y-4 sm:space-y-6">
        {/* breadcrumb */}
        <nav
          className="flex items-center text-gray-700"
          aria-label="Breadcrumb"
        >
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <Link
                to={`/${pathPrefix}/frequencies`}
                className="inline-flex items-center text-xs font-medium text-gray-700 hover:text-gray-600 sm:text-sm"
              >
                Frequencies
              </Link>
            </li>
            <li aria-current="page">
              <div className="flex items-center">
                <svg
                  className="mx-1 h-3 w-3 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  ></path>
                </svg>
                <span className="ml-1 text-xs font-medium text-gray-500 sm:text-sm md:ml-2">
                  {isEditing ? "Edit Frequency" : "New Frequency"}
                </span>
              </div>
            </li>
          </ol>
        </nav>

        {/* header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="relative inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-black sm:h-12 sm:w-12">
              <HiClock className="h-5 w-5 text-white sm:h-6 sm:w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 sm:text-2xl lg:text-3xl">
                {isEditing ? "Edit Frequency" : "New Frequency"}
              </h1>
              <p className="text-xs text-gray-500 sm:text-sm">
                {isEditing
                  ? "Update frequency settings and discounts"
                  : "Create a new service frequency option"}
              </p>
            </div>
          </div>
        </div>

        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="space-y-4 sm:space-y-6"
        >
          {/* alerts */}
          {state.error && (
            <Alert color="failure" icon={HiExclamationCircle}>
              <span className="text-xs font-medium sm:text-sm">Error!</span>
              <span className="text-xs sm:text-sm">{state.error}</span>
            </Alert>
          )}

          {state.success && state.message && (
            <Alert color="success" icon={HiCheckCircle}>
              <span className="text-xs font-medium sm:text-sm">Success!</span>
              <span className="text-xs sm:text-sm">{state.message}</span>
            </Alert>
          )}

          {/* Service info */}
          <Card className="bg-gray-50">
            <div className="mb-3 flex items-center gap-2 sm:mb-4 sm:gap-3">
              <h3 className="text-lg font-semibold text-gray-900 sm:text-lg">
                Frequency Information
              </h3>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <Label
                htmlFor="name"
                className="mb-1 block text-xs sm:mb-2 sm:text-sm"
              >
                Frequency Name
              </Label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Enter Frequency Name"
                defaultValue={frequency?.name || ""}
                required
                maxLength={50}
                className="block w-full rounded-lg border border-gray-300 bg-white py-2 text-xs text-gray-900 focus:border-gray-500 focus:ring-gray-500 sm:px-3 sm:py-2.5 sm:text-sm"
              />
            </div>

            <div className="space-y-3 sm:space-y-4">
              <Label className="mb-1 block text-xs sm:mb-2 sm:text-sm">
                Frequency Type
              </Label>
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
                      "w-full cursor-pointer rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-xs text-gray-800 hover:bg-gray-200 hover:text-gray-900 focus:ring-2 focus:ring-gray-400 sm:px-3 sm:py-2.5 sm:text-sm",
                    base: "z-50 w-fit rounded-md shadow-md",
                  },
                }}
              >
                {FREQUENCY_OPTIONS.map((option) => (
                  <DropdownItem
                    key={option.key}
                    onClick={() => setFrequencyType(option.key)}
                  >
                    <span className="text-xs sm:text-sm">{option.label}</span>
                  </DropdownItem>
                ))}
              </Dropdown>

              {/* custom frequency */}
              {frequencyType === "Custom" && (
                <div className="p-3 sm:p-4">
                  <h4 className="mb-3 text-sm font-medium text-gray-900 sm:text-base">
                    Custom Frequency Settings
                  </h4>

                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-gray-700 sm:text-sm">
                        Every
                      </span>
                      <input
                        type="number"
                        min="1"
                        value={customEvery}
                        onChange={(e) =>
                          setCustomEvery(
                            Math.max(1, parseInt(e.target.value) || 1),
                          )
                        }
                        className="w-16 rounded border border-gray-300 px-2 py-1.5 text-xs focus:border-gray-500 focus:ring-gray-500 sm:w-20 sm:text-sm"
                      />
                      <span className="text-xs text-gray-700 sm:text-sm">
                        week{customEvery > 1 ? "s" : ""}
                      </span>
                    </div>

                    <div>
                      <Label className="mb-2 block text-xs sm:text-sm">
                        On days:
                      </Label>
                      <div
                        className="flex w-full rounded-md shadow-sm"
                        role="group"
                      >
                        {WEEKDAYS.map((day, index) => {
                          const isFirst = index === 0;
                          const isLast = index === WEEKDAYS.length - 1;
                          const isSelected = customDays.includes(day.key);

                          return (
                            <button
                              key={day.key}
                              type="button"
                              onClick={() => handleDayToggle(day.key)}
                              className={`flex-1 border px-1 py-1.5 text-xs font-medium transition-colors duration-200 sm:px-2 sm:py-2 sm:text-sm ${isFirst ? "rounded-l-md" : ""} ${isLast ? "rounded-r-md" : ""} ${!isFirst ? "-ml-px" : ""} ${
                                isSelected
                                  ? "relative z-10 border-gray-600 bg-gray-600 text-white hover:bg-gray-700"
                                  : "border-gray-300 bg-white text-gray-900 hover:bg-gray-50 hover:text-gray-900"
                              } cursor-pointer focus:z-10 focus:ring-2 focus:ring-gray-500 focus:outline-none`}
                            >
                              {day.label}
                            </button>
                          );
                        })}
                      </div>
                      {customDays.length > 0 && (
                        <p className="mt-2 text-xs text-gray-600">
                          Selected:{" "}
                          {customDays
                            .map((d) => WEEKDAYS[d].fullLabel)
                            .join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            {/* </Card> */}

            {/* discount */}
            {/* <Card className="bg-gray-50"> */}
            {/* <div className="mb-3 flex items-center gap-2 sm:mb-4 sm:gap-3">
              <HiCurrencyDollar className="h-7 w-7 text-green-600 sm:h-6 sm:w-6" />
              <h3 className="text-lg font-semibold text-gray-900 sm:text-lg">
                Discount Configuration
              </h3>
            </div> */}

            <div className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                <div>
                  <Label className="mb-1 block text-xs sm:mb-2 sm:text-sm">
                    Discount Type
                  </Label>
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
                          "w-full cursor-pointer rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-xs text-gray-800 hover:bg-gray-200 hover:text-gray-900 focus:ring-2 focus:ring-gray-400 sm:px-3 sm:py-2.5 sm:text-sm",
                        base: "z-50 w-fit rounded-md shadow-md",
                      },
                    }}
                  >
                    <DropdownItem onClick={() => setDiscountType("percentage")}>
                      <span className="text-xs sm:text-sm">Percentage (%)</span>
                    </DropdownItem>
                    <DropdownItem onClick={() => setDiscountType("amount")}>
                      <span className="text-xs sm:text-sm">
                        Fixed Amount ($)
                      </span>
                    </DropdownItem>
                  </Dropdown>
                </div>

                <div>
                  <Label
                    htmlFor="discount_value"
                    className="mb-1 block text-xs sm:mb-2 sm:text-sm"
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
                    placeholder="0.00"
                    // Show $ on the left for "amount", % on the right for "percentage"
                    prefix={
                      discountType === "amount" ? <span>$</span> : undefined
                    }
                    suffix={
                      discountType === "percentage" ? <span>%</span> : undefined
                    }
                    className={`block w-full rounded-lg border border-gray-300 bg-white px-2.5 text-xs text-gray-900 focus:border-gray-500 focus:ring-gray-500 sm:px-3 sm:text-sm ${
                      discountType === "amount"
                        ? "pl-8 sm:pl-10"
                        : "pr-8 sm:pr-10"
                    }`}
                    inputProps={{ id: "discount_value" }}
                  />
                </div>
              </div>

              <div className="space-y-2 rounded-lg border border-gray-300 bg-white p-3">
                <Label className="text-xs font-medium sm:text-sm">
                  Apply discount to:
                </Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Radio
                      color="gray"
                      id="apply_all"
                      name="discount_apply"
                      value="all"
                      checked={discountApplyMode === "all"}
                      onChange={(e) =>
                        setDiscountApplyMode(e.target.value as "all")
                      }
                      className="mt-1 cursor-pointer"
                    />
                  <Label
                      htmlFor="apply_all"
                      className="mt-2 cursor-pointer text-xs sm:text-sm"
                    >
                      All jobs in recurring series
                    </Label>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Radio
                      color="gray"
                      id="apply_after"
                      name="discount_apply"
                      value="after"
                      checked={discountApplyMode === "after"}
                      onChange={(e) =>
                        setDiscountApplyMode(e.target.value as "after")
                      }
                      className="h-3 w-3 cursor-pointer sm:h-4 sm:w-4"
                    />
                    <Label
                      htmlFor="apply_after"
                      className="mr-2 cursor-pointer text-xs sm:text-sm"
                    >
                      After
                    </Label>
                    <input
                      type="number"
                      min="1"
                      value={discountAfterN}
                      onChange={(e) =>
                        setDiscountAfterN(
                          Math.max(1, parseInt(e.target.value) || 1),
                        )
                      }
                      disabled={discountApplyMode !== "after"}
                      className="w-16 rounded border border-gray-300 px-2 py-1 text-xs focus:border-gray-500 focus:ring-gray-500 disabled:bg-gray-100 sm:w-20 sm:text-sm"
                    />
                    <span className="text-xs text-gray-700 sm:text-sm">
                      job(s)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* services card */}
            <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
              <div className="lg:col-span-2">
                <Label
                  htmlFor="name"
                  className="mb-1 block text-xs sm:mb-2 sm:text-sm"
                >
                  Choose Services
                </Label>
                <MultiSelectDropdown
                  options={frequencyOptions.services}
                  selected={selectedServices}
                  onChange={setSelectedServices}
                  placeholder="Select Services"
                  modalTitle="Select Services"
                  className="bg-white"
                />
              </div>
            </div>

            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-start gap-1 rounded-lg border border-gray-300 bg-white p-2 sm:gap-2 sm:p-2">
                <Checkbox
                  color="gray"
                  id="staff_only"
                  checked={staffOnly}
                  onChange={(e) => setStaffOnly(e.target.checked)}
                  className="mt-1 h-3 w-3 cursor-pointer sm:h-4 sm:w-4"
                />
                <div>
                  <Label
                    htmlFor="staff_only"
                    className="cursor-pointer text-xs font-medium sm:text-sm"
                  >
                    Staff Only
                  </Label>
                  <p className="mt-1 text-xs text-gray-500">
                    Only display this frequency option to staff members
                  </p>
                </div>
              </div>
            </div>
            {/* </Card> */}
          </Card>

          <div className="pt-0 sm:pt-1">
            <FormActions
              onCancel={onCancel}
              isPending={isPending}
              isEditing={isEditing}
              submitText="Save"
              editText="Save"
              showStatusToggle={isEditing}
              status={frequencyStatus}
              onStatusToggle={handleStatusToggle}
            />
          </div>
        </form>
      </div>
    </>
  );
};

export default FrequencyForm;
