// src/components/services/SameDayFeeSection.tsx
import * as React from "react";
import { Label, HelperText } from "flowbite-react";
import CustomToggle from "../ui/CustomToggle";
import NumericInput from "../ui/NumericInput";

export type CutoffDay = "dayBefore" | "dayOf";

type Props = {
  hasSameDayFee: boolean;
  setHasSameDayFee: (v: boolean) => void;

  sameDayFeeAmount: number;
  setSameDayFeeAmount: (v: number) => void;

  cutoffTime: string; // "HH:mm" (24h)
  setCutoffTime: (v: string) => void;

  cutoffDay: CutoffDay;
  setCutoffDay: (v: CutoffDay) => void;

  /** Optional: show an inline error if amount is missing/invalid */
  amountError?: string | null;
};

const SameDayFeeSection: React.FC<Props> = ({
  hasSameDayFee,
  setHasSameDayFee,
  sameDayFeeAmount,
  setSameDayFeeAmount,
  cutoffTime,
  setCutoffTime,
  cutoffDay,
  setCutoffDay,
  amountError,
}) => {
  const disabled = !hasSameDayFee;

  const helper = React.useMemo(() => {
    const t = cutoffTime || "—:—";
    if (cutoffDay === "dayBefore") {
      return `Bookings made after ${formatTime(
        t,
      )} on the day before service will be charged the same-day fee.`;
    }
    return `Bookings made after ${formatTime(
      t,
    )} on the day of service will be charged the same-day fee.`;
  }, [cutoffTime, cutoffDay]);

  return (
    <>
      {/* Header / Toggle */}
      <div className="mt-6 flex w-full items-start gap-2 rounded-lg border border-gray-300 bg-white p-2 sm:mb-4 sm:flex-row sm:items-center sm:justify-between sm:gap-0 sm:p-3">
        <div>
          <Label className="text-xs font-medium text-gray-900 sm:text-sm">
            Same Day Fee
          </Label>
          <p className="mt-1 text-xs text-gray-500">
            Charge a fee for short-notice bookings.
          </p>
        </div>
        <CustomToggle checked={hasSameDayFee} onChange={setHasSameDayFee} />
      </div>

      {/* Body */}
      {hasSameDayFee && (
        <div className="mt-3 space-y-4 sm:mt-6">
          {/* Amount */}
          <div>
            <Label
              htmlFor="same_day_fee_amount"
              className="mb-1 block text-xs sm:mb-2 sm:text-sm"
            >
              Price ($)
            </Label>
            <NumericInput
              value={sameDayFeeAmount}
              onValueChange={setSameDayFeeAmount}
              decimals={2}
              min={0}
              step={0.01}
              placeholder="0.00"
              prefix={<span>$</span>}
              className="block w-full rounded-lg border border-gray-300 bg-white px-2.5 py-2 pl-8 text-xs text-gray-900 focus:border-blue-500 focus:ring-blue-500 sm:px-3 sm:py-2.5 sm:pl-10 sm:text-sm"
              inputProps={{
                id: "same_day_fee_amount",
                name: "same_day_fee_amount",
              }}
            />
            {!!amountError && (
              <HelperText color="failure" className="mt-1 text-xs">
                {amountError}
              </HelperText>
            )}
          </div>

          {/* Cutoff settings */}
          <div className="mt-1 p-3 sm:p-4">
            <Label className="text-xs font-medium text-gray-900 sm:text-sm">
              Cutoff Settings
            </Label>
            <p className="mt-1 text-xs text-gray-500">
              Choose the time and day when the same-day fee begins to apply.
            </p>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {/* Time */}
              <div>
                <Label
                  htmlFor="cutoff_time"
                  className="mb-1 block text-xs sm:mb-2 sm:text-sm"
                >
                  Cutoff Time
                </Label>
                <input
                  type="time"
                  id="cutoff_time"
                  name="cutoff_time"
                  value={cutoffTime}
                  onChange={(e) => setCutoffTime(e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 bg-white p-2 text-xs text-gray-900 focus:border-blue-500 focus:ring-blue-500 sm:p-2.5 sm:text-sm"
                />
              </div>

              {/* Day */}
              <div>
                <Label
                  htmlFor="cutoff_day"
                  className="mb-1 block text-xs sm:mb-2 sm:text-sm"
                >
                  Cutoff Day
                </Label>

                <div className="flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white p-1 shadow-sm sm:p-1.5">
                  {[
                    { key: "dayBefore", label: "Day Before Service" },
                    { key: "dayOf", label: "Day of Service" },
                  ].map((opt) => {
                    const selected = cutoffDay === opt.key;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() =>
                          setCutoffDay(opt.key as "dayBefore" | "dayOf")
                        }
                        className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-all duration-150 sm:px-3 sm:py-2 sm:text-sm ${
                          selected
                            ? "bg-blue-600 text-white shadow hover:bg-blue-700"
                            : "bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500">{helper}</p>
          </div>
        </div>
      )}

      {/* Keep DOM structure stable for ARIA / future use */}
      <fieldset
        disabled={disabled}
        aria-disabled={disabled}
        className="sr-only"
      />
    </>
  );
};

/** Format "HH:mm" (24h) to a friendlier "h:mm AM/PM" without pulling in date-fns just for this. */
function formatTime(hhmm: string) {
  const [h, m] = hhmm.split(":").map((n) => parseInt(n || "0", 10));
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = ((h + 11) % 12) + 1;
  const mm = String(m ?? 0).padStart(2, "0");
  return `${hour12}:${mm} ${ampm}`;
}

export default SameDayFeeSection;
