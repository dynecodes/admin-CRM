// src/components/referrals/ReferralEditForm.tsx
import React, { useState } from "react";
import { Label, Button } from "flowbite-react";
import type { ReferralProgram } from "../../types/referrals";
import { useReferrals } from "../../hooks/useReferrals";
import DatePicker from "../ui/DatePicker";

/* ---------------- Decimal helpers (money inputs) ---------------- */
// allows: "", "0", "0.", "0.0", "12.34"
function sanitizeDecimal(next: string) {
  let v = next.replace(/[^\d.]/g, "");

  const parts = v.split(".");
  if (parts.length > 2) v = parts[0] + "." + parts.slice(1).join("");

  const [intPart, decPart] = v.split(".");
  if (decPart != null) v = intPart + "." + decPart.slice(0, 2);

  return v;
}
function toNumberOrNull(v: string): number | null {
  if (v === "" || v === ".") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function format2(v: string): string {
  const n = toNumberOrNull(v);
  if (n == null) return "";
  return n.toFixed(2);
}

/* ---------------- Date helpers ("YYYY-MM-DD" <-> Date) ---------------- */
function toYMD(d: Date | null | undefined): string {
  if (!d) return "";
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
}
function fromYMD(s: string | null | undefined): Date | null {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1, 12, 0, 0));
}

interface ReferralEditFormProps {
  referral: ReferralProgram;
  onSave: (data: any) => void;
  onCancel: () => void;
}

const ReferralEditForm: React.FC<ReferralEditFormProps> = ({
  referral,
  onSave,
  onCancel,
}) => {
  const { updateReferral } = useReferrals();

  // Initialize state from referral
  const [startDate, setStartDate] = useState<string>(referral.startDate ?? "");
  const [endDate, setEndDate] = useState<string>(referral.endDate ?? "");

  // Money inputs as string (better typing UX)
  const [discountStr, setDiscountStr] = useState<string>(
    referral.discount != null ? referral.discount.toFixed(2) : "",
  );
  const [rewardStr, setRewardStr] = useState<string>(
    referral.reward != null ? referral.reward.toFixed(2) : "",
  );

  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  const validate = () => {
    const next: Record<string, string | undefined> = {};

    if (!startDate.trim()) next.startDate = "Start date is required.";
    if (!endDate.trim()) next.endDate = "End date is required.";

    if (startDate && endDate && endDate < startDate) {
      next.endDate = "End date must be after start date.";
    }

    const discountNum = toNumberOrNull(discountStr);
    const rewardNum = toNumberOrNull(rewardStr);

    if (discountNum == null || discountNum < 0) {
      next.discount = "Discount must be 0 or greater.";
    }
    if (rewardNum == null || rewardNum < 0) {
      next.reward = "Reward must be 0 or greater.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const buildPayload = () => ({
    startDate,
    endDate,
    discount: toNumberOrNull(discountStr) ?? 0,
    reward: toNumberOrNull(rewardStr) ?? 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSave(buildPayload());
  };

  const handleStatusToggle = async () => {
    try {
      const nextStatus = referral.status === "active" ? "archived" : "active";
      await updateReferral(referral.id, {
        ...buildPayload(),
        status: nextStatus,
      });
      onSave({ ...buildPayload(), status: nextStatus });
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("Failed to update status. Please try again.");
    }
  };

  /* ---------------- Styles matching PromotionsEditForm ---------------- */
  const inputCls =
    "block w-full rounded-lg border border-gray-300 bg-white px-3 h-10 sm:h-11 " +
    "text-xs sm:text-sm text-gray-900 placeholder-gray-400 " +
    "focus:border-blue-500 focus:ring-blue-500 cursor-pointer";

  const inputDollar =
    "block w-full rounded-lg border border-gray-300 bg-white px-3 h-10 sm:h-11 " +
    "text-xs sm:text-sm text-gray-900 placeholder-gray-400 " +
    "focus:border-blue-500 focus:ring-blue-500";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="mb-3 text-base font-semibold text-gray-900">
        Referral Program Information
      </h2>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {/* Start Date */}
        <div>
          <Label
            htmlFor={`startDate-${referral.id}`}
            className="mb-1 block text-sm font-medium text-gray-900"
          >
            Start Date
          </Label>
          <DatePicker
            value={fromYMD(startDate)}
            onChange={(d) => setStartDate(toYMD(d))}
            placeholder="MM/DD/YYYY"
            inputClassName={inputCls}
          />
          {errors.startDate && (
            <p className="mt-1.5 text-xs text-red-600">{errors.startDate}</p>
          )}
        </div>

        {/* End Date */}
        <div>
          <Label
            htmlFor={`endDate-${referral.id}`}
            className="mb-1 block text-sm font-medium text-gray-900"
          >
            End Date
          </Label>
          <DatePicker
            value={fromYMD(endDate)}
            onChange={(d) => setEndDate(toYMD(d))}
            placeholder="MM/DD/YYYY"
            inputClassName={inputCls}
          />
          {errors.endDate && (
            <p className="mt-1.5 text-xs text-red-600">{errors.endDate}</p>
          )}
        </div>

        {/* Discount */}
        <div className="mt-4">
          <Label
            htmlFor={`discount-${referral.id}`}
            className="mb-1 block text-sm font-medium text-gray-900"
          >
            Discount
          </Label>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-10 min-w-[2.25rem] items-center justify-center rounded-lg border border-gray-300 bg-white px-2 text-xs text-gray-600 sm:h-11 sm:text-sm">
              $
            </span>
            <input
              id={`discount-${referral.id}`}
              type="text"
              inputMode="decimal"
              placeholder="00.00"
              value={discountStr}
              onChange={(e) => setDiscountStr(sanitizeDecimal(e.target.value))}
              onBlur={() => setDiscountStr(format2(discountStr))}
              aria-invalid={!!errors.discount}
              className={inputDollar}
            />
          </div>
          <p className="mt-1 p-1 text-xs text-gray-500">for New Customer</p>
          {errors.discount && (
            <p className="mt-1.5 text-xs text-red-600">{errors.discount}</p>
          )}
        </div>

        {/* Reward */}
        <div className="mt-4">
          <Label
            htmlFor={`reward-${referral.id}`}
            className="mb-1 block text-sm font-medium text-gray-900"
          >
            Reward
          </Label>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-10 min-w-[2.25rem] items-center justify-center rounded-lg border border-gray-300 bg-white px-2 text-xs text-gray-600 sm:h-11 sm:text-sm">
              $
            </span>
            <input
              id={`reward-${referral.id}`}
              type="text"
              inputMode="decimal"
              placeholder="00.00"
              value={rewardStr}
              onChange={(e) => setRewardStr(sanitizeDecimal(e.target.value))}
              onBlur={() => setRewardStr(format2(rewardStr))}
              aria-invalid={!!errors.reward}
              className={inputDollar}
            />
          </div>
          <p className="mt-1 p-1 text-xs text-gray-500">
            for Referring Customer
          </p>
          {errors.reward && (
            <p className="mt-1.5 text-xs text-red-600">{errors.reward}</p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col justify-end gap-2 border-t border-gray-200 pt-3 sm:flex-row">
        <Button
          type="button"
          onClick={handleStatusToggle}
          size="xs"
          className={`order-first w-full cursor-pointer sm:order-none sm:w-24 ${
            referral.status === "active"
              ? "bg-orange-500 text-white hover:bg-orange-600 focus:ring-orange-300"
              : "bg-green-500 text-white hover:bg-green-600 focus:ring-green-300"
          }`}
        >
          {referral.status === "active" ? "Archive" : "Activate"}
        </Button>
        <Button
          color="gray"
          onClick={onCancel}
          size="xs"
          className="w-full cursor-pointer sm:w-24"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          color="blue"
          size="xs"
          className="w-full cursor-pointer sm:w-24"
          disabled={
            !startDate.trim() ||
            !endDate.trim() ||
            (toNumberOrNull(discountStr) ?? -1) < 0 ||
            (toNumberOrNull(rewardStr) ?? -1) < 0
          }
        >
          Save
        </Button>
      </div>
    </form>
  );
};

export default ReferralEditForm;
