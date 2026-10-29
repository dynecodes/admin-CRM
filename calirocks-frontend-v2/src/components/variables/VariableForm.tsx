import React, { useActionState, useRef, useEffect, useState } from "react";
import { Alert, Label, Card, Button } from "flowbite-react";
import {
  HiExclamationCircle,
  HiCheckCircle,
  HiCurrencyDollar,
  HiX,
  HiPlus,
} from "react-icons/hi";
import { Link } from "react-router-dom";
import { useVariables } from "../../hooks/Variables/useVariables";
import FormActions from "../ui/FormActions";
import MultiSelectDropdown from "../ui/MultiSelectDropdown";
import { VariableRow, VariableStatus } from "../../types/variables";
import ChangePriceModal from "./ChangePriceModal";
import { TbCodeVariablePlus } from "react-icons/tb";
import NumericInput from "../ui/NumericInput";

interface VariableFormProps {
  variable?: VariableRow;
  onSuccess: (variableData: any) => void;
  onCancel: () => void;
}

interface ActionState {
  success: boolean;
  message: string | null;
  data: any;
  error: string | null;
}

interface PriceRange {
  id: string;
  label: string;
  min: number;
  max: number;
  price: number;
  hours: number;
  minutes: number;
}

const VariableForm: React.FC<VariableFormProps> = ({
  variable,
  onSuccess,
  onCancel,
}) => {
  const formRef = useRef<HTMLFormElement>(null);
  const hasCalledOnSuccess = useRef(false);
  const isEditing = !!variable;
  const { serviceOptions } = useVariables();

  // modal state
  const [showChangePriceModal, setShowChangePriceModal] = useState(false);
  const [isPending, setIsPending] = useState(false);

  // form states
  const [variableStatus, setVariableStatus] = useState<VariableStatus>(
    variable?.status || "active",
  );
  const [selectedServices, setSelectedServices] = useState<number[]>(
    variable?.services?.map((s) => parseInt(s.id)) || [],
  );
  const [pricingMode, setPricingMode] = useState<"flat" | "ranges">(
    variable?.pricing_type === "ranges" ? "ranges" : "flat",
  );

  // flat pricing states
  const [flatPrice, setFlatPrice] = useState<number>(
    variable?.price_amount || 0,
  );
  const [flatHours, setFlatHours] = useState<number>(
    variable?.duration_hours || 0,
  );
  const [flatMinutes, setFlatMinutes] = useState<number>(
    variable?.duration_minutes || 0,
  );
  const [valuesFrom, setValuesFrom] = useState<number>(
    variable?.values_from || 1,
  );
  const [valuesTo, setValuesTo] = useState<number>(variable?.values_to || 1);

  // ranges pricing states
  const [priceRanges, setPriceRanges] = useState<PriceRange[]>(
    variable?.price_ranges || [
      {
        id: crypto.randomUUID(),
        label: "",
        min: 0,
        max: 0,
        price: 0,
        hours: 0,
        minutes: 0,
      },
    ],
  );
  const [rangeErrors, setRangeErrors] = useState<{ [key: string]: boolean }>(
    {},
  );

  const addPriceRange = () => {
    // Validate current ranges before adding new one
    const errors: { [key: string]: boolean } = {};
    let hasErrors = false;

    priceRanges.forEach((range) => {
      if (
        !range.label.trim() ||
        range.price === 0 ||
        range.min === 0 ||
        range.max === 0
      ) {
        errors[range.id] = true;
        hasErrors = true;
      }
    });

    if (hasErrors) {
      setRangeErrors(errors);
      return;
    }

    // Clear errors and add new range
    setRangeErrors({});
    setPriceRanges([
      ...priceRanges,
      {
        id: crypto.randomUUID(),
        label: "",
        min: 0,
        max: 0,
        price: 0,
        hours: 0,
        minutes: 0,
      },
    ]);
  };

  const removePriceRange = (id: string) => {
    if (priceRanges.length > 1) {
      setPriceRanges(priceRanges.filter((range) => range.id !== id));
      // Clear error for removed range
      setRangeErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[id];
        return newErrors;
      });
    }
  };

  const updatePriceRange = (
    id: string,
    field: keyof PriceRange,
    value: number | string,
  ) => {
    setPriceRanges(
      priceRanges.map((range) =>
        range.id === id ? { ...range, [field]: value } : range,
      ),
    );

    // Clear error for this range when user starts typing
    if (rangeErrors[id]) {
      setRangeErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[id];
        return newErrors;
      });
    }
  };

  const handlePriceChange = (newPrice: number) => {
    setFlatPrice(newPrice);
    console.log("New price:", newPrice);
  };

  const variableAction = async (
    _prevState: ActionState,
    formData: FormData,
  ): Promise<ActionState> => {
    try {
      const data = Object.fromEntries(formData);

      // Validate ranges if in ranges mode
      if (pricingMode === "ranges") {
        const errors: { [key: string]: boolean } = {};
        let hasErrors = false;

        priceRanges.forEach((range) => {
          if (
            !range.label.trim() ||
            range.price === 0 ||
            range.min === 0 ||
            range.max === 0
          ) {
            errors[range.id] = true;
            hasErrors = true;
          }
        });

        if (hasErrors) {
          setRangeErrors(errors);
          return {
            success: false,
            message: null,
            data: null,
            error: "Please fill in all required fields in price ranges",
          };
        }
      }

      const variableData = {
        name: data.name as string,
        serviceIds: selectedServices.map((id) => id.toString()),
        status: variableStatus,
        pricing_type: pricingMode,
        price_amount: pricingMode === "flat" ? flatPrice : 0,
        duration_hours: pricingMode === "flat" ? flatHours : 0,
        duration_minutes: pricingMode === "flat" ? flatMinutes : 0,
        values_from: pricingMode === "flat" ? valuesFrom : 0,
        values_to: pricingMode === "flat" ? valuesTo : 0,
        price_ranges: pricingMode === "ranges" ? priceRanges : [],
      };

      // Call the onSuccess handler which will handle the API call
      await onSuccess(variableData);

      return {
        success: true,
        message: `Variable ${isEditing ? "updated" : "created"} successfully!`,
        data: variableData,
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

  const [state, _dispatch] = useActionState(variableAction, {
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
        setSelectedServices([]);
        setPricingMode("flat");
        setFlatPrice(0);
        setFlatHours(0);
        setFlatMinutes(0);
        setValuesFrom(1);
        setValuesTo(1);
        setPriceRanges([
          {
            id: crypto.randomUUID(),
            label: "",
            min: 0,
            max: 0,
            price: 0,
            hours: 0,
            minutes: 0,
          },
        ]);
        setRangeErrors({});
      }
    }
  }, [state.success, state.data, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);

    try {
      const formData = new FormData(formRef.current!);
      const result = await variableAction(state, formData);

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
    if (!isEditing || !variable) return;

    try {
      const nameValue = formRef.current?.elements.namedItem(
        "name",
      ) as HTMLInputElement;
      if (!nameValue?.value.trim()) {
        alert("Variable name is required");
        return;
      }

      const newStatus: VariableStatus =
        variableStatus === "active" ? "archived" : "active";

      setIsPending(true);

      const variableData = {
        name: nameValue.value.trim(),
        serviceIds: selectedServices.map((id) => id.toString()),
        status: newStatus,
        pricing_type: pricingMode,
        price_amount: pricingMode === "flat" ? flatPrice : 0,
        duration_hours: pricingMode === "flat" ? flatHours : 0,
        duration_minutes: pricingMode === "flat" ? flatMinutes : 0,
        values_from: pricingMode === "flat" ? valuesFrom : 0,
        values_to: pricingMode === "flat" ? valuesTo : 0,
        price_ranges: pricingMode === "ranges" ? priceRanges : [],
      };

      console.log("Toggling status with data:", variableData);

      // Call onSuccess which will handle the API call
      await onSuccess(variableData);

      // Update local state only after successful API call
      setVariableStatus(newStatus);
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

  const pathPrefix = window.location.pathname.split('/')[1];
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* breadcrumb */}
      <nav className="flex items-center text-gray-700" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <Link
              to={`/${pathPrefix}/variables`}
              className="inline-flex items-center text-xs font-medium text-gray-700 hover:text-gray-600 sm:text-sm"
            >
              Variables
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
                {isEditing ? "Edit Variable" : "New Variable"}
              </span>
            </div>
          </li>
        </ol>
      </nav>

      {/* header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="relative inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-black sm:h-12 sm:w-12">
            <TbCodeVariablePlus className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 sm:text-2xl lg:text-3xl">
              {isEditing ? "Edit Variable" : "New Variable"}
            </h1>
            <p className="text-xs text-gray-500 sm:text-sm">
              {isEditing
                ? "Update variable details and pricing configuration"
                : "Create a new pricing variable"}
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

        {/* basic info */}
        <Card className="bg-gray-50">
          <div className="mb-3 flex items-center gap-2 sm:mb-4 sm:gap-3">
            {/* <HiInformationCircle className="w-7 h-7 sm:w-6 sm:h-6 text-gray-600" /> */}
            <h3 className="text-lg font-semibold text-gray-900">
              Variable Information
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
            <div className="lg:col-span-2">
              <Label
                htmlFor="name"
                className="mb-1 block text-xs sm:mb-2 sm:text-sm"
              >
                Variable Name
              </Label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Enter Variable Name"
                defaultValue={variable?.name || ""}
                required
                maxLength={50}
                className="block w-full rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-xs text-gray-900 focus:border-gray-500 focus:ring-gray-500 sm:px-3 sm:py-2.5 sm:text-sm"
              />
            </div>
          </div>

          {/* <div className="flex items-center gap-2">
            <HiCurrencyDollar className="w-7 h-7 sm:w-6 sm:h-6 text-green-600" /> 
            <h3 className="text-lg font-semibold text-gray-900">Pricing Configuration</h3> 
          </div> */}

          <div className="space-y-3 sm:space-y-4">
            {/* pricing mode selection */}
            <div>
              <Label className="mb-1 block text-xs sm:mb-2 sm:text-sm">
                Pricing Mode
              </Label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
                {(["flat", "ranges"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setPricingMode(mode)}
                    className={`flex items-center gap-2 rounded-lg border p-2 transition-all sm:gap-3 sm:p-3 ${
                      pricingMode === mode
                        ? "border-gray-500 bg-gray-50"
                        : "border-gray-300 bg-white hover:border-gray-300"
                    }`}
                  >
                    <div
                      className={`flex h-4 w-4 items-center justify-center rounded-full border sm:h-5 sm:w-5 ${
                        pricingMode === mode
                          ? "border-gray-600 bg-gray-600"
                          : "border-gray-300 bg-gray-300"
                      }`}
                    >
                      {pricingMode === mode && (
                        <svg
                          className="h-2 w-2 text-white sm:h-3 sm:w-3"
                          fill="currentColor"
                          viewBox="0 0 12 12"
                        >
                          <path
                            d="M10 3L4.5 8.5 2 6"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            fill="none"
                          />
                        </svg>
                      )}
                    </div>
                    <div className="cursor-pointer text-left">
                      <div className="text-xs font-medium text-gray-900 sm:text-sm">
                        {mode === "flat" ? "Flat Pricing" : "Range Pricing"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {mode === "flat"
                          ? "Fixed price with duration"
                          : "Multiple price ranges"}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* flat pricing fields */}
            {pricingMode === "flat" && (
              //rounded-lg border border-gray-200 bg-gray-50
              <div className="space-y-3 sm:space-y-4">
                {/* Price Row */}
                <div className="grid grid-cols-1">
                  <div>
                    <Label
                      htmlFor="flat_price"
                      className="mb-1 block text-xs sm:mb-2 sm:text-sm"
                    >
                      Price ($)
                    </Label>

                    {isEditing ? (
                      <div className="flex max-w-xs gap-2">
                        <div className="relative flex-1">
                          <input
                            id="flat_price"
                            type="number"
                            min={0}
                            step={0.01}
                            value={flatPrice}
                            readOnly
                            className="block w-full cursor-not-allowed rounded-lg border border-gray-300 bg-white px-2.5 py-2 pl-8 text-xs text-gray-900 sm:px-3 sm:py-2.5 sm:pl-10 sm:text-sm"
                          />
                          <HiCurrencyDollar className="block w-full rounded-lg border border-gray-300 bg-white px-2.5 py-2 pl-8 text-xs text-gray-900 focus:border-red-500" />
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => setShowChangePriceModal(true)}
                          className="cursor-pointer bg-red-600 text-xs whitespace-nowrap text-white hover:bg-red-700 sm:text-sm"
                        >
                          Change Price
                        </Button>
                      </div>
                    ) : (
                      <NumericInput
                        value={flatPrice}
                        onValueChange={setFlatPrice}
                        decimals={2}
                        min={0}
                        placeholder="0.00"
                        prefix={<span>$</span>}
                        step={0.01}
                        className="block w-full rounded-lg border border-gray-300 bg-white px-2.5 py-2 pl-8 text-xs text-gray-900 focus:border-gray-500 focus:ring-gray-500 sm:px-3 sm:py-2.5 sm:pl-10 sm:text-sm"
                      />
                    )}
                  </div>
                </div>

                {/* Values Row */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label
                      htmlFor="values_from"
                      className="mb-1 block text-xs sm:mb-2 sm:text-sm"
                    >
                      Values From
                    </Label>
                    <NumericInput
                      value={valuesFrom}
                      onValueChange={(n) => setValuesFrom(n || 0)}
                      decimals={0}
                      min={0}
                      step={1}
                      placeholder="0"
                      className="block w-full rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-xs text-gray-900 focus:border-gray-500 focus:ring-gray-500 sm:px-3 sm:py-2.5 sm:text-sm"
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="values_to"
                      className="mb-1 block text-xs sm:text-sm"
                    >
                      Values To
                    </Label>
                    <NumericInput
                      value={valuesTo}
                      onValueChange={(n) => setValuesTo(n || 0)}
                      decimals={0}
                      min={0}
                      step={1}
                      placeholder="0"
                      className="block w-full rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-xs text-gray-900 focus:border-gray-500 focus:ring-gray-500 sm:px-3 sm:py-2.5 sm:text-sm"
                    />
                  </div>
                </div>

                {/* Duration Row */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label
                      htmlFor="flat_hours"
                      className="mb-1 block text-xs sm:mb-2 sm:text-sm"
                    >
                      Duration (Hours)
                    </Label>
                    <NumericInput
                      value={flatHours}
                      onValueChange={(n) => setFlatHours(n || 0)}
                      decimals={0}
                      min={0}
                      step={1}
                      placeholder="0"
                      className="block w-full rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-xs text-gray-900 focus:border-gray-500 focus:ring-gray-500 sm:px-3 sm:py-2.5 sm:text-sm"
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="flat_minutes"
                      className="mb-1 block text-xs sm:mb-2 sm:text-sm"
                    >
                      Duration (Minutes)
                    </Label>
                    <NumericInput
                      value={flatMinutes}
                      onValueChange={(n) =>
                        setFlatMinutes(Math.min(59, Math.max(0, n || 0)))
                      }
                      decimals={0}
                      min={0}
                      max={59}
                      step={1}
                      placeholder="0"
                      className="block w-full rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-xs text-gray-900 focus:border-gray-500 focus:ring-gray-500 sm:px-3 sm:py-2.5 sm:text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ranges pricing fields */}
            {pricingMode === "ranges" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium sm:text-sm">
                    Price Ranges
                  </Label>
                  <Button
                    type="button"
                    size="xs"
                    color="gray"
                    onClick={addPriceRange}
                    className="cursor-pointer"
                  >
                    <HiPlus className="mr-1 h-3 w-3" />
                    Add Range
                  </Button>
                </div>

                {priceRanges.map((range, index) => (
                  <div
                    key={range.id}
                    className="space-y-3 bg-gray-50 p-3 sm:p-1"
                  >
                    <div className="mb-2 flex items-center justify-between sm:mb-3">
                      <span className="text-xs font-medium text-gray-700 sm:text-sm">
                        Range {index + 1}
                      </span>
                      {priceRanges.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePriceRange(range.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <HiX className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    {/* Label and Price Row */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <Label className="mb-1 block text-xs">Label</Label>
                        <input
                          type="text"
                          value={range.label}
                          onChange={(e) =>
                            updatePriceRange(range.id, "label", e.target.value)
                          }
                          placeholder="e.g., 1-10 units"
                          className={`block w-full rounded-lg border bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-gray-500 focus:ring-gray-500 sm:px-2.5 sm:py-2 sm:text-sm ${
                            rangeErrors[range.id] && !range.label.trim()
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                        />
                        {rangeErrors[range.id] && !range.label.trim() && (
                          <p className="mt-1 text-xs text-red-600">
                            Please enter a label
                          </p>
                        )}
                      </div>

                      <div>
                        <Label className="mb-1 block text-xs">Price ($)</Label>
                        <NumericInput
                          value={range.price}
                          onValueChange={(n) =>
                            updatePriceRange(range.id, "price", n)
                          }
                          decimals={2}
                          min={0}
                          step={0.01}
                          placeholder="0.00"
                          className={`block w-full rounded-lg border bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-gray-500 focus:ring-gray-500 sm:px-2.5 sm:py-2 sm:text-sm ${
                            rangeErrors[range.id] && range.price === 0
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                        />
                        {rangeErrors[range.id] && range.price === 0 && (
                          <p className="mt-1 text-xs text-red-600">
                            Please enter a price
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Min and Max Row */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="mb-1 block text-xs">Min</Label>
                        <NumericInput
                          value={range.min}
                          onValueChange={(n) =>
                            updatePriceRange(range.id, "min", n || 0)
                          }
                          decimals={0}
                          min={0}
                          step={1}
                          placeholder="0"
                          className={`block w-full rounded-lg border bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-gray-500 focus:ring-gray-500 sm:px-2.5 sm:py-2 sm:text-sm ${
                            rangeErrors[range.id] && range.min === 0
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                        />
                        {rangeErrors[range.id] && range.min === 0 && (
                          <p className="mt-1 text-xs text-red-600">
                            Please enter min value
                          </p>
                        )}
                      </div>

                      <div>
                        <Label className="mb-1 block text-xs">Max</Label>
                        <NumericInput
                          value={range.max}
                          onValueChange={(n) =>
                            updatePriceRange(range.id, "max", n || 0)
                          }
                          decimals={0}
                          min={0}
                          step={1}
                          placeholder="0"
                          className={`block w-full rounded-lg border bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-gray-500 focus:ring-gray-500 sm:px-2.5 sm:py-2 sm:text-sm ${
                            rangeErrors[range.id] && range.max === 0
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                        />
                        {rangeErrors[range.id] && range.max === 0 && (
                          <p className="mt-1 text-xs text-red-600">
                            Please enter max value
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Duration Row */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="mb-1 block text-xs sm:mb-2 sm:text-sm">
                          Duration (Hours)
                        </Label>
                        <NumericInput
                          value={range.hours}
                          onValueChange={(n) =>
                            updatePriceRange(range.id, "hours", n || 0)
                          }
                          decimals={0}
                          min={0}
                          step={1}
                          placeholder="0"
                          className="block w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-gray-500 focus:ring-gray-500 sm:px-2.5 sm:py-2 sm:text-sm"
                        />
                      </div>

                      <div>
                        <Label className="mb-1 block text-xs sm:mb-2 sm:text-sm">
                          Duration (Minutes)
                        </Label>
                        <NumericInput
                          value={range.minutes}
                          onValueChange={(n) =>
                            updatePriceRange(
                              range.id,
                              "minutes",
                              Math.min(59, Math.max(0, n || 0)),
                            )
                          }
                          decimals={0}
                          min={0}
                          max={59}
                          step={1}
                          placeholder="0"
                          className="block w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-gray-500 focus:ring-gray-500 sm:px-2.5 sm:py-2 sm:text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Services */}
          {/* <div className="flex items-center">
            <HiTag className="w-7 h-7 sm:w-6 sm:h-6 text-purple-600" />
            <Label className="mb-1 block text-xs sm:mb-2 sm:text-sm">
              Choose Services
            </Label>
          </div>
          <div>
            <MultiSelectDropdown
              options={serviceOptions}
              selected={selectedServices}
              onChange={setSelectedServices}
              placeholder="Select Services"
              modalTitle="Select Services"
            />
          </div> */}

          {/* Services */}
          <div className="space-y-1 sm:space-y-2">
            <Label className="block text-xs text-gray-900 sm:text-sm">
              Choose Services
            </Label>

            <MultiSelectDropdown
              options={serviceOptions}
              selected={selectedServices}
              onChange={setSelectedServices}
              placeholder="Select Services"
              modalTitle="Select Services"
            />
          </div>
        </Card>

        <div className="pt-0 sm:pt-1">
          <FormActions
            onCancel={onCancel}
            isPending={isPending}
            isEditing={isEditing}
            submitText="Save"
            editText="Save"
            showStatusToggle={isEditing}
            status={variableStatus}
            onStatusToggle={handleStatusToggle}
          />
        </div>
      </form>

      {/* Change Price Modal - Only for editing */}
      {isEditing && (
        <ChangePriceModal
          isOpen={showChangePriceModal}
          onClose={() => setShowChangePriceModal(false)}
          currentPrice={flatPrice}
          onConfirm={handlePriceChange}
        />
      )}

    </div>
  );
};

export default VariableForm;
