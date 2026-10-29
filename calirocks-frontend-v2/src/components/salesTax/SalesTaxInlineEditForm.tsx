// src/components/salesTax/SalesTaxInlineEditForm.tsx
import React from "react";
import { Button, Label, Checkbox, Alert } from "flowbite-react";
import { HiCog, HiExclamationCircle } from "react-icons/hi";
import type { SalesTax } from "../../types/salesTax";
import type { Location } from "../../types/location";
import DatePicker from "../ui/DatePicker";

type Props = {
  rule: SalesTax;
  locations: Location[];
  onSave: (data: Partial<SalesTax>) => Promise<void> | void;
  onCancel: () => void;
  onViewHistory: () => void;
  onRecalculate: () => void;
};

const inputCls =
  "block w-full rounded-lg border border-gray-200 bg-white px-3 h-10 sm:h-11 " +
  "text-xs sm:text-sm text-gray-900 placeholder-gray-400 " +
  "focus:border-gray-500 focus:ring-gray-500";

const fieldCls =
  "block w-full h-10 sm:h-11 px-3 text-xs sm:text-sm text-gray-900 " +
  "bg-white border border-gray-200 rounded-lg " +
  "focus:border-gray-500 focus:ring-1 focus:ring-gray-500 focus:outline-none";

const SalesTaxInlineEditForm: React.FC<Props> = ({
  rule,
  locations,
  onSave,
  onCancel,
  onViewHistory,
  onRecalculate,
}) => {
  const [effectiveDate, setEffectiveDate] = React.useState<string | null>(
    rule.effective_date ?? null,
  );
  const [taxPercent, setTaxPercent] = React.useState<string>(
    rule ? String(rule.tax_percent) : "",
  );
  const [selectedLocationIds, setSelectedLocationIds] = React.useState<
    number[]
  >(rule.location_ids || []);
  const [locationsDropdownOpen, setLocationsDropdownOpen] =
    React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // keep state in sync if a different row opens inline edit
  React.useEffect(() => {
    setEffectiveDate(rule.effective_date ?? null);
    setTaxPercent(rule ? String(rule.tax_percent) : "");
    setSelectedLocationIds(rule.location_ids || []);
    setError(null);
    setIsSaving(false);
  }, [rule]);

  const activeLocations = locations.filter((l) => l.status === "active");

  const toggleLocation = (id: number) => {
    setSelectedLocationIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

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

  const validate = () => {
    if (!effectiveDate) {
      setError("Effective date is required");
      return false;
    }
    if (!taxPercent || Number.isNaN(Number(taxPercent))) {
      setError("Tax rate is required");
      return false;
    }
    const percent = Number(taxPercent);
    if (percent < 0 || percent > 100) {
      setError("Tax rate must be between 0 and 100");
      return false;
    }
    setError(null);
    return true;
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return; // extra safety

    if (!validate()) return;

    setIsSaving(true);
    try {
      const payload: Partial<SalesTax> = {
        effective_date: effectiveDate ?? undefined,
        tax_percent: Number(taxPercent),
        location_ids: selectedLocationIds,
      };
      await onSave(payload);
    } catch (e) {
      console.error(e);
      setError(
        e instanceof Error ? e.message : "Failed to save sales tax rule.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  // --- Date helpers (string "YYYY-MM-DD" <-> Date) ---
  function toYMD(d: Date | null | undefined): string | null {
    if (!d) return null;
    // strip timezone so we get a stable YYYY-MM-DD
    const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return z.toISOString().slice(0, 10);
  }

  function fromYMD(s: string | null | undefined): Date | null {
    if (!s) return null;
    const [y, m, d] = s.split("-").map(Number);
    // Use UTC noon to avoid DST edges
    return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1, 12, 0, 0));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Header + secondary actions (similar idea to PromotionEditForm footer buttons) */}
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 sm:text-base">
            Sales Tax Details
          </h2>
          <p className="text-xs text-gray-500 sm:text-sm">
            Update the effective date, rate, and locations for this tax rule.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
          <Button
            type="button"
            size="xs"
            color="light"
            onClick={onViewHistory}
            className="cursor-pointer border-gray-200 bg-white"
          >
            View History
          </Button>
          <Button
            type="button"
            size="xs"
            color="light"
            onClick={onRecalculate}
            className="cursor-pointer border-gray-200 bg-white"
          >
            Recalculate Taxes
          </Button>
        </div>
      </div>

      {/* Effective date */}
      <div className="space-y-3 sm:space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[140px_1fr] sm:items-center">
          <Label
            htmlFor={`effective_date_${rule.id}`}
            className="mb-1 block font-medium text-black sm:mb-0 sm:text-sm"
          >
            Effective Date
          </Label>

          <DatePicker
            value={fromYMD(effectiveDate) ?? null}
            onChange={(v: Date | null) => setEffectiveDate(toYMD(v))}
            placeholder="MM/DD/YYYY"
          />
        </div>

        {/* Tax percent */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[140px_auto_min-content] sm:items-center">
          <Label
            htmlFor={`tax_percent_${rule.id}`}
            className="mb-1 block font-medium text-black sm:mb-0 sm:text-sm"
          >
            Tax
          </Label>
          <input
            id={`tax_percent_${rule.id}`}
            type="number"
            step="0.01"
            min={0}
            max={100}
            placeholder="e.g., 13.00"
            value={taxPercent}
            onChange={(e) => setTaxPercent(e.target.value)}
            className={inputCls}
            disabled={isSaving}
          />
          <span className="mt-1 text-xs text-gray-700 sm:mt-0 sm:text-sm">
            %
          </span>
        </div>

        {/* Locations multi-select (same pattern as full SalesTaxForm) */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[140px_1fr] sm:items-start">
          <span className="mb-1 block font-medium text-black sm:mb-0 sm:text-sm">
            Locations
          </span>
          <div className="relative">
            <button
              type="button"
              onClick={() => setLocationsDropdownOpen((o) => !o)}
              className={`${fieldCls} flex cursor-pointer items-center justify-between gap-2`}
              disabled={isSaving}
            >
              <span className="truncate">{summaryLabel}</span>
              <HiCog className="h-4 w-4 flex-shrink-0 text-gray-600" />
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
                          <span className="ml-1 text-[11px] text-gray-500"></span>
                        )}
                      </span>
                      <Checkbox
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

      {error && (
        <Alert color="failure" icon={HiExclamationCircle} className="mt-2">
          <span className="text-xs sm:text-sm">{error}</span>
        </Alert>
      )}

      {/* Action buttons – same arrangement as PromotionEditForm footer */}
      <div className="mt-4 flex flex-col gap-2 border-t border-gray-200 pt-3 sm:flex-row sm:justify-end">
        <Button
          type="button"
          color="light"
          size="xs"
          onClick={onCancel}
          disabled={isSaving}
          className="w-full cursor-pointer sm:w-24"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          color="gray"
          size="xs"
          disabled={isSaving}
          className="w-full cursor-pointer sm:w-24"
        >
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
};

export default SalesTaxInlineEditForm;
