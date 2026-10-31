// src/components/referrals/ReferralForm.tsx
import * as React from "react";
import { Label } from "flowbite-react";
import DatePicker from "../ui/DatePicker";
import { TextInput } from "../ui/InputsBundle";

export type ReferralFormData = {
  startDate: string;
  endDate: string;
  discount: number | null;
  reward: number | null;
};
export type ReferralFormExtras = {
  newCustomersCount?: number | null;
};
export type ReferralFormErrors = Partial<
  Record<keyof ReferralFormData, string>
>;

type Props = {
  formId?: string; // <-- used by external Save button
  formData: ReferralFormData;
  errors: ReferralFormErrors;
  isPending?: boolean;
  isEditing?: boolean;
  newCustomersCount?: number | null;
  onFieldChange: <K extends keyof ReferralFormData>(
    k: K,
    v: ReferralFormData[K],
  ) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void; // kept for API compat
  onSuccess?: (data: any) => void | Promise<void>;
} & ReferralFormExtras;

/* ---------------- Decimal helpers (money inputs) ---------------- */
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

/* ---------------- Date helpers ---------------- */
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

const inputCls =
  "block w-full rounded-lg border border-gray-300 bg-white px-3 h-10 sm:h-11 " +
  "text-xs sm:text-sm text-gray-900 placeholder-gray-400 " +
  "focus:border-gray-500 focus:ring-gray-500 cursor-pointer ";

const inputDollar =
  "block w-full rounded-lg border border-gray-300 bg-white px-3 h-10 sm:h-11 " +
  "text-xs sm:text-sm text-gray-900 placeholder-gray-400 " +
  "focus:border-gray-500 focus:ring-gray-500";

const ReferralForm: React.FC<Props> = ({
  formId = "referral-form",
  formData,
  errors,
  isPending,
  isEditing,
  newCustomersCount,
  onFieldChange,
  onSubmit,
}) => {
  // show values as strings (2dp) while still storing numbers upstream
  const discountStr =
    formData.discount != null ? formData.discount.toFixed(2) : "";
  const rewardStr = formData.reward != null ? formData.reward.toFixed(2) : "";

  return (
    <form id={formId} onSubmit={onSubmit} className="space-y-4 sm:space-y-6">
      {isEditing && typeof newCustomersCount === "number" && (
        <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-900">
          <span className="font-medium">{newCustomersCount}</span> New Customer
          {newCustomersCount === 1 ? "" : "s"} signed up using this Referral
          Program
        </div>
      )}

      <Label className="mt-3 mb-5 text-base font-semibold text-gray-900">
        Referral Program Information
      </Label>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {/* Start Date */}
        <div>
          <Label
            htmlFor="startDate"
            className="mb-1 block cursor-pointer text-sm font-medium text-gray-900"
          >
            Start Date
          </Label>
          <DatePicker
            value={fromYMD(formData.startDate)}
            onChange={(d) => onFieldChange("startDate", toYMD(d))}
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
            htmlFor="endDate"
            className="mb-1 block cursor-pointer text-sm font-medium text-gray-900"
          >
            End Date
          </Label>
          <DatePicker
            value={fromYMD(formData.endDate)}
            onChange={(d) => onFieldChange("endDate", toYMD(d))}
            placeholder="MM/DD/YYYY"
            inputClassName={inputCls}
          />
          {errors.endDate && (
            <p className="mt-1.5 text-xs text-red-600">{errors.endDate}</p>
          )}
        </div>

        {/* Discount */}
        <div>
          <Label
            htmlFor="discount"
            className="mb-1 block text-sm font-medium text-gray-900"
          >
            Discount
          </Label>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-10 min-w-[2.5rem] items-center justify-center rounded-md border border-gray-300 bg-gray-200 px-2 text-sm text-gray-600 sm:h-11">
              $
            </span>
            <TextInput
              color="gray"
              id="discount"
              type="text"
              inputMode="decimal"
              placeholder="00.00"
              className={inputDollar}
              value={discountStr}
              onChange={(e) =>
                onFieldChange(
                  "discount",
                  toNumberOrNull(sanitizeDecimal(e.target.value)),
                )
              }
              onBlur={(e) =>
                onFieldChange(
                  "discount",
                  toNumberOrNull(format2(e.target.value)),
                )
              }
              aria-invalid={!!errors.discount}
              disabled={isPending}
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">for New Customer</p>
          {errors.discount && (
            <p className="mt-1.5 text-xs text-red-600">{errors.discount}</p>
          )}
        </div>

        {/* Reward */}
        <div>
          <Label
            htmlFor="reward"
            className="mb-1 block text-sm font-medium text-gray-900"
          >
            Reward
          </Label>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-10 min-w-[2.5rem] items-center justify-center rounded-md border border-gray-300 bg-gray-200 px-2 text-sm text-gray-600 sm:h-11">
              $
            </span>
            <TextInput
              color="gray"
              id="reward"
              type="text"
              inputMode="decimal"
              placeholder="00.00"
              className={inputDollar}
              value={rewardStr}
              onChange={(e) =>
                onFieldChange(
                  "reward",
                  toNumberOrNull(sanitizeDecimal(e.target.value)),
                )
              }
              onBlur={(e) =>
                onFieldChange("reward", toNumberOrNull(format2(e.target.value)))
              }
              aria-invalid={!!errors.reward}
              disabled={isPending}
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">for Referring Customer</p>
          {errors.reward && (
            <p className="mt-1.5 text-xs text-red-600">{errors.reward}</p>
          )}
        </div>
      </div>
    </form>
  );
};

export default ReferralForm;
