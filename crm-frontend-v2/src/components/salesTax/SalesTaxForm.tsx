// src/components/salesTax/SalesTaxForm.tsx
import React, { useActionState, useRef, useEffect, useState } from "react";
import { Alert, Label } from "flowbite-react";
import { HiExclamationCircle, HiCheckCircle, HiCog } from "react-icons/hi";
import { SalesTax } from "../../types/salesTax";
import { useSalesTax } from "../../hooks/SalesTax/useSalesTax";
import { useLocations } from "../../hooks/Locations/useLocations";
import DatePicker from "../ui/DatePicker";

interface SalesTaxFormProps {
  rule?: SalesTax;
  onSuccess: (ruleData: any) => void;
  onCancel?: () => void; // still allowed, just not used here
  formId?: string;
}

interface ActionState {
  success: boolean;
  message: string | null;
  data: any;
  error: string | null;
}

const SalesTaxForm: React.FC<SalesTaxFormProps> = ({
  rule,
  onSuccess,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onCancel: _onCancel,
  formId = "sales-tax-form",
}) => {
  const formRef = useRef<HTMLFormElement>(null);
  const hasCalledOnSuccess = useRef(false);
  const isEditing = !!rule;
  const { createRule, updateRule, loading } = useSalesTax();
  const { locations } = useLocations();

  const inputCls =
    "block w-full rounded-lg border border-gray-300 bg-white px-3 h-10 sm:h-11 " +
    "text-xs sm:text-sm text-gray-900 placeholder-gray-400 " +
    "focus:border-gray-500 focus:ring-gray-500";

  const [effectiveDate, setEffectiveDate] = useState<string | null>(
    rule?.effective_date ?? null,
  );
  const [taxPercent, setTaxPercent] = useState<string>(
    rule ? String(rule.tax_percent) : "",
  );
  const [selectedLocationIds, setSelectedLocationIds] = useState<number[]>(
    rule?.location_ids || [],
  );
  const [locationsDropdownOpen, setLocationsDropdownOpen] = useState(false);

  const toggleLocation = (id: number) => {
    setSelectedLocationIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const activeLocations = locations.filter((l) => l.status === "active");

  const selectAllActive = () => {
    setSelectedLocationIds(activeLocations.map((l) => l.id));
  };

  const clearAll = () => {
    setSelectedLocationIds([]);
  };

  const summaryLabel =
    selectedLocationIds.length === 0
      ? ""
      : `${selectedLocationIds.length} location(s) selected`;

  const salesTaxAction = async (
    _prev: ActionState,
    _formData: FormData,
  ): Promise<ActionState> => {
    try {
      if (!effectiveDate) {
        throw new Error("Effective date is required");
      }
      if (!taxPercent || Number.isNaN(Number(taxPercent))) {
        throw new Error("Tax rate is required");
      }
      const percent = Number(taxPercent);
      if (percent < 0 || percent > 100) {
        throw new Error("Tax rate must be between 0 and 100");
      }

      const payload = {
        effective_date: effectiveDate,
        tax_percent: percent,
        location_ids: selectedLocationIds,
      };

      const result = isEditing
        ? await updateRule(rule!.id, payload)
        : await createRule(payload);

      return {
        success: true,
        message: `Sales tax rule ${
          isEditing ? "updated" : "created"
        } successfully!`,
        data: result,
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

  const [state, dispatch, isPending] = useActionState(salesTaxAction, {
    success: false,
    message: null,
    data: null,
    error: null,
  });

  useEffect(() => {
    if (state.success && state.data && !hasCalledOnSuccess.current) {
      hasCalledOnSuccess.current = true;
      onSuccess(state.data);
      if (!isEditing) {
        formRef.current?.reset();
        setEffectiveDate("");
        setTaxPercent("");
        setSelectedLocationIds([]);
      }
    }
  }, [state.success, state.data, isEditing, onSuccess]);

  // --- Date helpers (string "YYYY-MM-DD" <-> Date) ---
  function toYMD(d: Date | null | undefined): string | null {
    if (!d) return null;
    const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return z.toISOString().slice(0, 10);
  }

  function fromYMD(s: string | null | undefined): Date | null {
    if (!s) return null;
    const [y, m, d] = s.split("-").map(Number);
    return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1, 12, 0, 0));
  }

  const fieldCls =
    "block w-full h-10 sm:h-11 px-3 text-xs sm:text-sm text-gray-900 " +
    "bg-white border border-gray-200 rounded-lg " +
    "focus:border-gray-500 focus:ring-1 focus:ring-gray-500 focus:outline-none";

  return (
    <form
      id={formId}
      ref={formRef}
      action={dispatch}
      className="space-y-4 sm:space-y-6"
      onSubmit={(e) => {
        if (isPending || loading) {
          e.preventDefault();
        }
      }}
    >
      {/* Alerts at the top of the card content */}
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

      {/* IMPORTANT banner */}
      <div className="mb-4 rounded-md border border-yellow-200 bg-yellow-50 px-3 py-2 sm:mb-6">
        <p className="text-xs text-gray-800 sm:text-sm">
          <span className="font-semibold">IMPORTANT:</span> changes will affect
          charges for the correspondent period.
        </p>
      </div>

      {/* Sales Tax details */}
      <div>
        <div className="mb-4 flex items-center gap-2 sm:mb-6">
          <h3 className="text-base font-semibold text-gray-900 sm:text-lg">
            Sales Tax Details
          </h3>
        </div>

        <div className="space-y-4 sm:space-y-8">
          {/* Effective Date */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[140px_minmax(0,1fr)] sm:items-center">
            <Label
              htmlFor="effective_date"
              className="mb-1 block text-xs sm:mb-0 sm:text-sm"
            >
              Effective Date
            </Label>
            <DatePicker
              value={fromYMD(effectiveDate) ?? null}
              onChange={(v: Date | null) => setEffectiveDate(toYMD(v))}
              placeholder="MM/DD/YYYY"
            />
          </div>

          {/* Tax */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[140px_minmax(0,1fr)] sm:items-center">
            <Label
              htmlFor="tax_percent"
              className="mb-1 block text-xs sm:mb-0 sm:text-sm"
            >
              Tax
            </Label>
            <input

              id="tax_percent"
              name="tax_percent"
              type="number"
              step="0.01"
              min={0}
              max={100}
              placeholder="e.g., 13.00"
              value={taxPercent}
              onChange={(e) => setTaxPercent(e.target.value)}
              required
              className={inputCls}
            />
          </div>

          {/* Locations */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[140px_minmax(0,1fr)] sm:items-start">
            <span className="mb-1 block text-xs sm:mb-0 sm:text-sm">
              Locations
            </span>
            <div className="relative">
              <button
                type="button"
                onClick={() => setLocationsDropdownOpen((o) => !o)}
                className={`${fieldCls} flex cursor-pointer items-center justify-between gap-2`}
              >
                <span>{summaryLabel}</span>
                <HiCog className="h-4 w-4 text-gray-600" />
              </button>

              {locationsDropdownOpen && (
                <div className="absolute z-20 mt-1 w-full rounded border border-gray-200 bg-white shadow-lg">
                  <div className="flex border-b border-gray-200 text-xs">
                    <button
                      type="button"
                      className="flex-1 cursor-pointer px-2 py-1 hover:bg-gray-50"
                      onClick={selectAllActive}
                    >
                      All Active Locations
                    </button>
                    <button
                      type="button"
                      className="flex-1 cursor-pointer px-2 py-1 hover:bg-gray-50"
                      onClick={clearAll}
                    >
                      Deselect All
                    </button>
                  </div>
                  <div className="max-h-56 space-y-1 overflow-y-auto p-2 text-xs">
                    {locations.map((loc) => (
                      <label
                        key={loc.id}
                        className="flex cursor-pointer items-center justify-between gap-2 rounded px-1 py-0.5 hover:bg-gray-50"
                      >
                        <span className="flex-1">
                          {loc.name}
                          {loc.is_default && (
                            <span className="ml-1 text-[11px] text-gray-500" />
                          )}
                        </span>
                        <input
                          type="checkbox"
                          className="h-3 w-3"
                          checked={selectedLocationIds.includes(loc.id)}
                          onChange={() => toggleLocation(loc.id)}
                        />
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};

export default SalesTaxForm;
