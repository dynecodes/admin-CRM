// src/components/promotions/PromotionEditForm.tsx
import React, { useMemo, useState } from "react";
import { Label, Checkbox, Button } from "flowbite-react";
import {
  Promotion,
  PromotionStatus,
  DiscountType,
  DaysOfWeek,
} from "../../types/promotions";
import { usePromotions } from "../../hooks/Promotions/usePromotions";
import DatePicker from "../ui/DatePicker";

/* ---------- helpers ---------- */
function splitDiscount(s?: string) {
  const t = (s || "").trim().toLowerCase();
  if (!t) return { pct: null as number | null, amt: null as number | null };
  const pctM = t.match(/([\d]+(?:\.\d+)?)\s*%/);
  if (pctM) return { pct: Number(pctM[1]), amt: null };
  const amtM = t.match(/\$?\s*([\d]+(?:\.\d+)?)/);
  if (amtM) return { pct: null, amt: Number(amtM[1]) };
  return { pct: null, amt: null };
}

function composeDiscountText(
  type: DiscountType,
  pct: number | null,
  amt: number | null,
) {
  if (type === "Giftcard") return `$${amt ?? pct ?? 0} gift card`;
  if (amt && amt > 0) return `$${amt} off`;
  if (pct && pct > 0) return `${pct}% off`;
  return "";
}

// If your DatePicker emits a Date object, uncomment this and use it in onChange handlers.
// const toYMD = (d: Date | null) =>
//   d ? new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10) : null;

interface PromotionEditFormProps {
  promotion: Promotion;
  onSave: (data: any) => void;
  onCancel: () => void;
}
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

const WEEKDAYS = [
  { key: "sun", label: "Sun" },
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
] as const;

const PromotionEditForm: React.FC<PromotionEditFormProps> = ({
  promotion,
  onSave,
  onCancel,
}) => {
  const { updatePromotion, isCodeTaken } = usePromotions();

  // ---------- seed state from promotion ----------
  const seed = useMemo(() => {
    const { pct, amt } = splitDiscount(promotion.discount);
    return {
      type: (promotion.type ?? "Booking") as DiscountType,
      code: promotion.code ?? "",
      percentValue: promotion.type === "Booking" ? pct : null,
      dollarValue:
        promotion.type === "Booking"
          ? amt
          : promotion.type === "Giftcard"
            ? (amt ?? pct ?? null)
            : null,
      numberOfUses: promotion.limit?.perCode ?? null,
      expirationDate:
        (promotion as any)?.expirationDate ?? promotion.serviceDateEnd ?? null,
      newCustomersDate: promotion.limit?.newCustomerAfter ?? null,
      serviceDateStart: promotion.serviceDateStart ?? null,
      serviceDateEnd: promotion.serviceDateEnd ?? null,
      canCombine: (promotion as any)?.canCombine ?? false,
      daysOfWeek: promotion.daysOfWeek as DaysOfWeek,
      status: (promotion.status ?? "active") as PromotionStatus,
      minBookingAmount:
        promotion.limit?.minBookingAmount != null
          ? Number(promotion.limit.minBookingAmount)
          : null,
    };
  }, [promotion]);

  // ---------- local state ----------
  const [type, setType] = useState<DiscountType>(seed.type);
  const [code, setCode] = useState(seed.code);
  const [percentValue, setPercentValue] = useState<number | null>(
    seed.percentValue,
  );
  const [dollarValue, setDollarValue] = useState<number | null>(
    seed.dollarValue,
  );
  const [numberOfUses, setNumberOfUses] = useState<number | null>(
    seed.numberOfUses,
  );
  const [expirationDate, setExpirationDate] = useState<string | null>(
    seed.expirationDate,
  );
  const [newCustomersDate, setNewCustomersDate] = useState<string | null>(
    seed.newCustomersDate,
  );
  const [serviceDateStart, setServiceDateStart] = useState<string | null>(
    seed.serviceDateStart,
  );
  const [serviceDateEnd, setServiceDateEnd] = useState<string | null>(
    seed.serviceDateEnd,
  );
  const [canCombine, setCanCombine] = useState<boolean>(seed.canCombine);
  const [daysOfWeek, setDaysOfWeek] = useState<DaysOfWeek>(seed.daysOfWeek);
  const [status, setStatus] = useState<PromotionStatus>(seed.status);
  const [minBookingAmount] = useState<number | null>(seed.minBookingAmount);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [isSaving, setIsSaving] = useState(false);

  // keep Expiration and serviceDateEnd in sync (single source)
  React.useEffect(() => {
    if (expirationDate !== serviceDateEnd) {
      setServiceDateEnd(expirationDate ?? null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expirationDate]);

  // discount change helpers (mutually exclusive for Booking)
  const percentChange = (v: string) => {
    const val = v === "" ? null : Number(v);
    setPercentValue(val);
    if (type === "Booking" && (val ?? 0) > 0) setDollarValue(null);
  };
  const dollarChange = (v: string) => {
    const val = v === "" ? null : Number(v);
    setDollarValue(val);
    if (type === "Booking" && (val ?? 0) > 0) setPercentValue(null);
  };

  const toggleDay = (day: keyof DaysOfWeek) =>
    setDaysOfWeek((prev) => ({ ...prev, [day]: !prev[day] }));

  const validate = () => {
    const next: Record<string, string | undefined> = {};
    if (!code.trim()) next.code = "Code is required.";
    else if (isCodeTaken && isCodeTaken(code, promotion.id))
      next.code = "Code already exists.";

    const hasValue =
      (type === "Booking" &&
        (percentValue ?? 0) > 0 !== (dollarValue ?? 0) > 0) ||
      (type === "Giftcard" && (dollarValue ?? percentValue ?? 0) > 0);

    if (!hasValue) next.discount = "Provide a percent OR a dollar value.";

    if (serviceDateStart && serviceDateEnd && serviceDateEnd < serviceDateStart)
      next.serviceDateEnd = "End date must be after start date.";

    if (!Object.values(daysOfWeek).some(Boolean))
      next.days = "At least one day must be selected.";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const buildPayload = () => {
    const giftAmt =
      type === "Giftcard" ? (dollarValue ?? percentValue ?? null) : null;

    const discountText = composeDiscountText(
      type,
      type === "Booking" ? (percentValue ?? null) : null,
      type === "Booking" ? (dollarValue ?? null) : giftAmt,
    );

    return {
      code: code.trim().toUpperCase(),
      discount: discountText,
      type,
      status,
      daysOfWeek,
      serviceDateStart: serviceDateStart || null,
      serviceDateEnd: serviceDateEnd || expirationDate || null,
      expirationDate: expirationDate || null,
      canCombine,
      limit: {
        ...(promotion.limit || {}),
        perCode: numberOfUses ?? null,
        minBookingAmount: minBookingAmount ?? null,
        newCustomerAfter: newCustomersDate || null,
      },
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSaving(true);
    try {
      await onSave(buildPayload());
    } catch (error) {
      console.error("Failed to save promotion:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to save promotion. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusToggle = async () => {
    const next = status === "active" ? "archived" : "active";
    setStatus(next);
    setIsSaving(true);
    try {
      if (!validate()) return;
      await updatePromotion(promotion.id, { ...buildPayload(), status: next });
      onSave({ ...buildPayload(), status: next });
    } catch (e) {
      setStatus(status);
      console.error(e);
      alert("Failed to update status. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Shared input classes matching your design
  const inputCls =
    "block w-full px-3 h-10 sm:h-11 text-xs sm:text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-gray-500 focus:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed placeholder-gray-400";

  const selectCls =
    "block w-full px-3 h-10 sm:h-11 text-xs sm:text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-gray-500 focus:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";

  /* ---------------- render ---------------- */
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Discount Type & Code Section */}
      <h2 className="mb-3 text-base font-semibold text-gray-900">
        Discount Information
      </h2>

      <div className="space-y-3">
        {/* Type */}
        <div>
          <Label
            htmlFor={`type-${promotion.id}`}
            className="mb-1 block text-sm font-medium text-gray-900"
          >
            Discount Type
          </Label>
          <select
            id={`type-${promotion.id}`}
            value={type}
            onChange={(e) => setType(e.target.value as DiscountType)}
            disabled={isSaving}
            className={selectCls}
          >
            <option value="Booking">Booking</option>
            <option value="Giftcard">Giftcard</option>
          </select>
        </div>

        {/* Code */}
        <div>
          <Label
            htmlFor={`code-${promotion.id}`}
            className="mb-1 block text-sm font-medium text-gray-900"
          >
            Discount Code
          </Label>
          <input
            id={`code-${promotion.id}`}
            type="text"
            placeholder="Enter Discount Code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            disabled={isSaving}
            aria-invalid={!!errors.code}
            className={inputCls}
          />
          {errors.code && (
            <p className="mt-1.5 text-xs text-red-600">{errors.code}</p>
          )}
        </div>
      </div>

      {/* Discount Value Section */}
      <Label className="mb-1 block text-sm font-medium text-gray-900">
        Discount
      </Label>

      {type === "Booking" && (
        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <input
            type="number"
            placeholder="0"
            inputMode="numeric"
            min={0}
            max={100}
            step="0.01"
            value={percentValue ?? ""}
            onChange={(e) => percentChange(e.target.value)}
            disabled={isSaving}
            aria-invalid={!!errors.discount}
            className={`${inputCls} w-full sm:flex-1`}
          />
          <span className="inline-flex h-10 min-w-[2.25rem] items-center justify-center rounded-lg border border-gray-300 bg-white px-2 text-xs text-gray-600 sm:h-11 sm:text-sm">
            %
          </span>
          <span className="text-lg font-semibold text-gray-500 sm:mx-2">
            or
          </span>
          <span className="inline-flex h-10 min-w-[2.25rem] items-center justify-center rounded-lg border border-gray-300 bg-white px-2 text-xs text-gray-600 sm:h-11 sm:text-sm">
            $
          </span>
          <input
            type="number"
            placeholder="0.00"
            inputMode="decimal"
            min={0}
            step="0.01"
            value={dollarValue ?? ""}
            onChange={(e) => dollarChange(e.target.value)}
            disabled={isSaving}
            aria-invalid={!!errors.discount}
            className={`${inputCls} w-full sm:flex-1`}
          />
        </div>
      )}

      {type === "Giftcard" && (
        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <span className="inline-flex h-10 min-w-[2.25rem] items-center justify-center rounded-lg border border-gray-300 bg-white px-2 text-xs text-gray-600 sm:h-11 sm:text-sm">
            $
          </span>
          <input
            type="number"
            placeholder="0.00"
            inputMode="decimal"
            min={0}
            step="0.01"
            value={dollarValue ?? percentValue ?? ""}
            onChange={(e) => dollarChange(e.target.value)}
            disabled={isSaving}
            aria-invalid={!!errors.discount}
            className={`${inputCls} w-full sm:flex-1`}
          />
        </div>
      )}

      {errors.discount && (
        <p className="mt-1.5 text-xs text-red-600">{errors.discount}</p>
      )}

      {/* Booking-only: Combine Option */}
      {type === "Booking" && (
        <div className="flex items-center p-1">
          <Checkbox
            id={`combine-${promotion.id}`}
            checked={!!canCombine}
            onChange={(e) => setCanCombine(e.target.checked)}
            disabled={isSaving}
            className="h-4 w-4 cursor-pointer bg-white disabled:cursor-not-allowed"
          />
          <Label
            htmlFor={`combine-${promotion.id}`}
            className="ml-2 cursor-pointer text-sm"
          >
            Can be combined with other discounts
          </Label>
        </div>
      )}

      {/* Usage & Dates Section */}
      <div className="space-y-4">
        {/* Number of Uses */}
        <div>
          <Label
            htmlFor={`uses-${promotion.id}`}
            className="mb-1 block text-sm font-medium text-gray-900"
          >
            Number of Uses
          </Label>
          <input
            id={`uses-${promotion.id}`}
            type="number"
            inputMode="numeric"
            placeholder="Enter Number of Uses"
            value={numberOfUses ?? ""}
            onChange={(e) =>
              setNumberOfUses(
                e.target.value === "" ? null : Number(e.target.value),
              )
            }
            disabled={isSaving}
            className={inputCls}
          />
          <p className="mt-1 p-1 text-xs text-gray-500">
            Number of times the code can be used
          </p>
        </div>

        {/* Dates grid: Expiration, New Customers */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Expiration Date */}
          <div>
            <Label className="mb-1 block text-sm font-medium text-gray-900">
              Expiration Date
            </Label>
            <DatePicker
              value={fromYMD(expirationDate) ?? null}
              onChange={(v: Date | null) => setExpirationDate(toYMD(v))}
              placeholder="MM/DD/YYYY"
            />
            <p className="mt-1 p-1 text-xs text-gray-500">
              The code cannot be used after this date
            </p>
          </div>

          {/* New Customers Date */}
          <div>
            <Label className="mb-1 block text-sm font-medium text-gray-900">
              New Customers Date
            </Label>
            <DatePicker
              value={fromYMD(newCustomersDate) ?? null}
              onChange={(v: Date | null) => setNewCustomersDate(toYMD(v))}
              placeholder="MM/DD/YYYY"
            />
            <p className="mt-1 p-1 text-xs text-gray-500">
              Only customers who became new on/after this date qualify
            </p>
          </div>
        </div>

        {/* Service Date (Booking only) */}
        {type === "Booking" && (
          <div>
            <Label className="mb-2 block text-sm font-medium text-gray-900">
              Service Date
            </Label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
              <DatePicker
                value={fromYMD(serviceDateStart) ?? null}
                onChange={(v: Date | null) => {
                  const next = toYMD(v);
                  setServiceDateStart(next);
                  if (serviceDateEnd && next && serviceDateEnd < next) {
                    setServiceDateEnd(next);
                  }
                }}
                placeholder="Start (MM/DD/YYYY)"
              />

              {/* dash separator on desktop; hidden on mobile */}
              <div className="hidden items-center justify-center text-gray-500 select-none sm:flex">
                &ndash;
              </div>

              <DatePicker
                value={fromYMD(serviceDateEnd) ?? null}
                onChange={(v: Date | null) => setServiceDateEnd(toYMD(v))}
                placeholder="End (MM/DD/YYYY)"
              />
            </div>
            {errors.serviceDateEnd && (
              <p className="mt-1.5 text-xs text-red-600">
                {errors.serviceDateEnd}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Days of the Week Section */}
      <Label className="mb-1 block text-sm font-medium text-gray-900">
        Days of the Week
      </Label>
      <div className="flex w-full rounded-md shadow-sm" role="group">
        {WEEKDAYS.map((day, index) => {
          const isFirst = index === 0;
          const isLast = index === WEEKDAYS.length - 1;
          const isSelected = daysOfWeek[day.key];

          return (
            <button
              key={day.key}
              type="button"
              onClick={() => toggleDay(day.key)}
              disabled={isSaving}
              className={`flex-1 border px-2 py-1 text-sm font-medium transition-colors duration-200 ${isFirst ? "rounded-l-md" : ""} ${isLast ? "rounded-r-md" : ""} ${!isFirst ? "-ml-px" : ""} ${
                isSelected
                  ? "relative z-10 border-gray-600 bg-gray-600 text-white hover:bg-gray-700"
                  : "border-gray-300 bg-white text-gray-900 hover:bg-gray-50 hover:text-gray-900"
              } cursor-pointer focus:z-10 focus:ring-2 focus:ring-gray-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {day.label}
            </button>
          );
        })}
      </div>
      {errors.days && (
        <p className="mt-1 text-xs text-red-600">{errors.days}</p>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col justify-end gap-2 border-t border-gray-200 pt-3 sm:flex-row">
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
          color="gray"
          size="xs"
          disabled={
            isSaving ||
            !code.trim() ||
            !(
              (type === "Giftcard" && (dollarValue ?? percentValue ?? 0) > 0) ||
              (type === "Booking" &&
                (percentValue ?? 0) > 0 !== (dollarValue ?? 0) > 0)
            ) ||
            !Object.values(daysOfWeek).some(Boolean)
          }
          className="w-full cursor-pointer sm:w-20"
        >
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
};

export default PromotionEditForm;
