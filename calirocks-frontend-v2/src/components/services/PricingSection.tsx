import React, { useEffect } from "react";
import { Label, Radio, Checkbox } from "flowbite-react";
import { PricingType, AdvancedPricing } from "../../types/service";
import CustomToggle from "../ui/CustomToggle";
import ShiftConfiguration from "./ShiftConfiguration";
import NumericInput from "../ui/NumericInput";
import TimeDrop from "../ui/TimeDrop";

interface PricingSectionProps {
  pricingType: PricingType;
  setPricingType: (type: PricingType) => void;
  mainPrice: number;
  setMainPrice: (price: number) => void;
  isAdvancedPricing: boolean;
  setIsAdvancedPricing: (advanced: boolean) => void;
  advancedPricing: AdvancedPricing;
  setAdvancedPricing: (
    pricing: AdvancedPricing | ((prev: AdvancedPricing) => AdvancedPricing),
  ) => void;
  service?: any;
  durationHours: number;
  setDurationHours: (hours: number) => void;
  durationMinutes: number;
  setDurationMinutes: (minutes: number) => void;
  minServiceProviders: number;
  setMinServiceProviders: (min: number) => void;
  maxServiceProviders: number;
  setMaxServiceProviders: (max: number) => void;
  allow30MinIncrements: boolean;
  setAllow30MinIncrements: (allow: boolean) => void;
  allow15MinIncrements: boolean;
  setAllow15MinIncrements: (allow: boolean) => void;
  hourlyMinDuration: string;
  setHourlyMinDuration: (duration: string) => void;
  hourlyMaxDuration: string;
  setHourlyMaxDuration: (duration: string) => void;
  hasSameDayFee: boolean;
  setHasSameDayFee: (has: boolean) => void;
  sameDayFeeAmount: number;
  setSameDayFeeAmount: (amount: number) => void;
  serviceSettings?: any | null;
}

const WEEKDAYS = [
  { key: "sunday", label: "Sun" },
  { key: "monday", label: "Mon" },
  { key: "tuesday", label: "Tue" },
  { key: "wednesday", label: "Wed" },
  { key: "thursday", label: "Thu" },
  { key: "friday", label: "Fri" },
  { key: "saturday", label: "Sat" },
];

const generateHourOptions = (
  allow30Min: boolean,
  allow15Min: boolean,
): string[] => {
  const options: string[] = [];

  if (allow15Min) {
    for (let hour = 0; hour <= 24; hour++) {
      for (let min = 0; min < 60; min += 15) {
        if (hour === 24 && min > 0) break;
        const totalMinutes = hour * 60 + min;
        if (totalMinutes === 0) continue;

        if (hour === 0) {
          options.push(`${min} mins`);
        } else if (min === 0) {
          options.push(`${hour} hr${hour > 1 ? "s" : ""}`);
        } else {
          options.push(`${hour} hr${hour > 1 ? "s" : ""} ${min} mins`);
        }
      }
    }
  } else if (allow30Min) {
    for (let hour = 0; hour <= 24; hour++) {
      for (let min = 0; min < 60; min += 30) {
        if (hour === 24 && min > 0) break;
        const totalMinutes = hour * 60 + min;
        if (totalMinutes === 0) continue;

        if (hour === 0) {
          options.push(`${min} mins`);
        } else if (min === 0) {
          options.push(`${hour} hr${hour > 1 ? "s" : ""}`);
        } else {
          options.push(`${hour} hr${hour > 1 ? "s" : ""} ${min} mins`);
        }
      }
    }
  } else {
    for (let hour = 1; hour <= 24; hour++) {
      options.push(`${hour} hr${hour > 1 ? "s" : ""}`);
    }
  }

  return options;
};

const PricingSection: React.FC<PricingSectionProps> = ({
  pricingType,
  setPricingType,
  mainPrice,
  setMainPrice,
  isAdvancedPricing,
  setIsAdvancedPricing,
  advancedPricing,
  setAdvancedPricing,
  durationHours,
  setDurationHours,
  durationMinutes,
  setDurationMinutes,
  minServiceProviders,
  setMinServiceProviders,
  maxServiceProviders,
  setMaxServiceProviders,
  allow30MinIncrements,
  setAllow30MinIncrements,
  allow15MinIncrements,
  setAllow15MinIncrements,
  hourlyMinDuration,
  setHourlyMinDuration,
  hourlyMaxDuration,
  setHourlyMaxDuration,
  hasSameDayFee,
  setHasSameDayFee,
  sameDayFeeAmount,
  setSameDayFeeAmount,
  serviceSettings,
}) => {
  const handleDayToggle = (dayKey: string) => {
    const beforeHourFee = serviceSettings
      ? parseFloat(serviceSettings.before_hour_fee) || 0
      : 0;
    const afterHourFee = serviceSettings
      ? parseFloat(serviceSettings.after_hour_fee) || 0
      : 0;

    setAdvancedPricing((prev: AdvancedPricing) => {
      const existingDay = prev[dayKey];
      const isCurrentlyEnabled = existingDay?.enabled;

      if (isCurrentlyEnabled) {
        // Toggling OFF - just disable it
        return {
          ...prev,
          [dayKey]: {
            ...existingDay,
            enabled: false,
          },
        };
      } else {
        // Toggling ON - use mainPrice
        return {
          ...prev,
          [dayKey]: {
            enabled: true,
            hasBeforeShift: existingDay?.hasBeforeShift || false,
            hasOffShift: existingDay?.hasOffShift || false,
            beforeShift: existingDay?.beforeShift || {
              startTime: "06:00",
              endTime: "08:00",
              rate: mainPrice + beforeHourFee,
            },
            onShift: {
              startTime: "08:00",
              endTime: "17:00",
              rate: mainPrice,
            },
            offShift: existingDay?.offShift || {
              startTime: "17:00",
              endTime: "22:00",
              rate: mainPrice + afterHourFee,
            },
          },
        };
      }
    });
  };

  const handleBeforeShiftToggle = (dayKey: string) => {
    const beforeHourFee = serviceSettings
      ? parseFloat(serviceSettings.before_hour_fee) || 0
      : 0;
    const beforeShiftRate = mainPrice + beforeHourFee;

    setAdvancedPricing((prev: AdvancedPricing) => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        hasBeforeShift: !prev[dayKey].hasBeforeShift,
        beforeShift: !prev[dayKey].hasBeforeShift
          ? { startTime: "06:00", endTime: "08:00", rate: beforeShiftRate }
          : prev[dayKey].beforeShift,
      },
    }));
  };

  const handleOffShiftToggle = (dayKey: string) => {
    const afterHourFee = serviceSettings
      ? parseFloat(serviceSettings.after_hour_fee) || 0
      : 0;
    const offShiftRate = mainPrice + afterHourFee;

    setAdvancedPricing((prev: AdvancedPricing) => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        hasOffShift: !prev[dayKey].hasOffShift,
        offShift: !prev[dayKey].hasOffShift
          ? { startTime: "17:00", endTime: "22:00", rate: offShiftRate }
          : prev[dayKey].offShift,
      },
    }));
  };

  const handleShiftTimeChange = (
    dayKey: string,
    shift: "beforeShift" | "onShift" | "offShift",
    field: "startTime" | "endTime",
    value: string,
  ) => {
    setAdvancedPricing((prev: AdvancedPricing) => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        [shift]: {
          ...prev[dayKey][shift]!,
          [field]: value,
        },
      },
    }));
  };

  const handleShiftRateChange = (
    dayKey: string,
    shift: "beforeShift" | "onShift" | "offShift",
    rate: number,
  ) => {
    setAdvancedPricing((prev: AdvancedPricing) => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        [shift]: {
          ...prev[dayKey][shift]!,
          rate,
        },
      },
    }));
  };

  const handle30MinIncrementsChange = (checked: boolean) => {
    if (checked && allow15MinIncrements) {
      setAllow15MinIncrements(false);
    }
    setAllow30MinIncrements(checked);
    setHourlyMinDuration("1 hr");
    setHourlyMaxDuration("1 hr");
  };

  const handle15MinIncrementsChange = (checked: boolean) => {
    if (checked && allow30MinIncrements) {
      setAllow30MinIncrements(false);
    }
    setAllow15MinIncrements(checked);
    setHourlyMinDuration("1 hr");
    setHourlyMaxDuration("1 hr");
  };

  const hourOptions = generateHourOptions(
    allow30MinIncrements,
    allow15MinIncrements,
  );

  // const [cutoffTime, setCutoffTime] = useState("17:00"); // 5:00 PM default
  // const [cutoffDay, setCutoffDay] = useState("dayBefore"); // "Day Before Service"
  // Cutoff time state for same-day fee
  // const [cutoffTime, setCutoffTime] = React.useState<string | null>(null);
  const [cutoffTime, setCutoffTime] = React.useState("17:00"); // 5:00 PM default
  const [cutoffDay, setCutoffDay] = React.useState("dayBefore");

  useEffect(() => {
    if (pricingType === "hourly") {
      if (!hourlyMinDuration) setHourlyMinDuration("1 hr");
      if (!hourlyMaxDuration) setHourlyMaxDuration("1 hr");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pricingType]);

  useEffect(() => {
    const currentOptions = generateHourOptions(
      allow30MinIncrements,
      allow15MinIncrements,
    );

    if (hourlyMinDuration && !currentOptions.includes(hourlyMinDuration)) {
      setHourlyMinDuration("1 hr");
    }
    if (hourlyMaxDuration && !currentOptions.includes(hourlyMaxDuration)) {
      setHourlyMaxDuration("1 hr");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allow30MinIncrements, allow15MinIncrements]);

  // Initialize advanced pricing with mainPrice when toggling it ON
  useEffect(() => {
    if (isAdvancedPricing && Object.keys(advancedPricing).length === 0) {
      // First time enabling advanced pricing - initialize all days with mainPrice
      const initialPricing: AdvancedPricing = {};
      WEEKDAYS.forEach((day) => {
        initialPricing[day.key] = {
          enabled: false,
          hasBeforeShift: false,
          hasOffShift: false,
          beforeShift: {
            startTime: "06:00",
            endTime: "08:00",
            rate: mainPrice,
          },
          onShift: {
            startTime: "08:00",
            endTime: "17:00",
            rate: mainPrice,
          },
          offShift: {
            startTime: "17:00",
            endTime: "22:00",
            rate: mainPrice,
          },
        };
      });
      setAdvancedPricing(initialPricing);
    }
  }, [isAdvancedPricing, mainPrice]);

  useEffect(() => {
    if (isAdvancedPricing && serviceSettings) {
      // ONLY apply if serviceSettings exist (new service)
      const beforeHourFee = parseFloat(serviceSettings.before_hour_fee) || 0;
      const afterHourFee = parseFloat(serviceSettings.after_hour_fee) || 0;

      setAdvancedPricing((prev: AdvancedPricing) => {
        const updated: AdvancedPricing = {};
        Object.keys(prev).forEach((dayKey) => {
          const dayData = prev[dayKey];
          if (dayData?.enabled) {
            updated[dayKey] = {
              ...dayData,
              onShift: {
                ...dayData.onShift,
                rate: mainPrice,
              },
              beforeShift: dayData.beforeShift
                ? {
                    ...dayData.beforeShift,
                    rate: mainPrice + beforeHourFee,
                  }
                : dayData.beforeShift,
              offShift: dayData.offShift
                ? {
                    ...dayData.offShift,
                    rate: mainPrice + afterHourFee,
                  }
                : dayData.offShift,
            };
          } else {
            updated[dayKey] = dayData;
          }
        });
        return updated;
      });
    }
  }, [mainPrice, serviceSettings, isAdvancedPricing]);

  return (
    // rounded-xl border border-gray-200 bg-white p-5 shadow-sm
    <div className="mt-1 sm:p-1">
      {/* <div className="mb-3 flex items-center gap-2 sm:mb-4 sm:gap-3">
        <h3 className="text-lg font-semibold text-gray-900">
          Pricing Configuration              
        </h3>  
      </div> */}
      <div className="mb-4 rounded-lg sm:mb-6">
        <Label className="mt-1 mb-1 block text-xs sm:mb-2 sm:text-sm">
          Pricing Type
        </Label>
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {(
            [
              {
                type: "flat",
                label: "Flat Rate",
                desc: "Fixed price per service",
              },
              {
                type: "hourly",
                label: "Hourly Rate",
                desc: "Price per hour worked",
              },
            ] as const
          ).map(({ type, label, desc }) => (
            <div
              key={type}
              className="flex items-start gap-2 rounded-lg border border-gray-200 bg-white p-2 transition-colors hover:border-blue-300 sm:gap-3 sm:p-3"
            >
              <Radio
                id={type}
                name="pricing_type_radio"
                value={type}
                checked={pricingType === type}
                onChange={(e) => setPricingType(e.target.value as PricingType)}
                className="mt-1"
              />
              <div>
                <Label
                  htmlFor={type}
                  className="cursor-pointer text-xs font-medium text-gray-900 sm:text-sm"
                >
                  {label}
                </Label>
                <p className="mt-1 text-xs text-gray-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>{" "}
      {pricingType === "flat" && (
        <div className="mb-4 rounded-lg sm:mb-6">
          <div>
            <Label
              htmlFor="price_amount"
              className="mt-6 mb-1 block text-xs sm:mb-2 sm:text-sm"
            >
              Price ($)
            </Label>
            <NumericInput
              value={mainPrice}
              onValueChange={setMainPrice}
              decimals={2}
              min={0}
              step={0.01}
              placeholder="0.00"
              prefix={<span>$</span>}
              className="block w-full rounded-lg border border-gray-300 bg-white px-2.5 py-2 pl-8 text-xs text-gray-900 focus:border-blue-500 focus:ring-blue-500 sm:px-3 sm:py-2.5 sm:pl-10 sm:text-sm"
              inputProps={{ id: "price_amount", name: "price_amount" }}
            />
          </div>

          <div className="mb-4 rounded-lg sm:mb-6">
            <Label className="mt-6 mb-1 block text-xs sm:mb-2 sm:text-sm">
              Duration
            </Label>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div>
                <Label
                  htmlFor="duration_hours"
                  className="mb-1 block text-xs text-gray-600"
                >
                  Hours
                </Label>
                <NumericInput
                  value={durationHours}
                  onValueChange={setDurationHours}
                  decimals={0}
                  min={0}
                  max={24}
                  step={1}
                  placeholder="0"
                  className="block w-full rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-xs text-gray-900 focus:border-blue-500 focus:ring-blue-500 sm:px-3 sm:py-2.5 sm:text-sm"
                  inputProps={{ id: "duration_hours", name: "duration_hours" }}
                />
              </div>
              <div>
                <Label
                  htmlFor="duration_minutes"
                  className="mb-1 block text-xs text-gray-600"
                >
                  Minutes
                </Label>
                <NumericInput
                  value={durationMinutes}
                  onValueChange={(n) =>
                    setDurationMinutes(Math.min(59, Math.max(0, n || 0)))
                  }
                  decimals={0}
                  min={0}
                  max={59}
                  step={1}
                  placeholder="0"
                  className="block w-full rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-xs text-gray-900 focus:border-blue-500 focus:ring-blue-500 sm:px-3 sm:py-2.5 sm:text-sm"
                  inputProps={{
                    id: "duration_minutes",
                    name: "duration_minutes",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
      {pricingType === "hourly" && (
        <div className="mb-4 space-y-3 sm:mb-6 sm:space-y-4">
          {/* Hourly Rate ($) with spinners */}
          <div>
            <Label
              htmlFor="price_amount"
              className="mb-1 block text-xs sm:mb-2 sm:text-sm"
            >
              Hourly Rate ($)
            </Label>
            <NumericInput
              value={mainPrice}
              onValueChange={setMainPrice}
              decimals={2}
              min={0}
              step={0.01}
              placeholder="0.00"
              prefix={<span>$</span>}
              className="block w-full rounded-lg border border-gray-300 bg-white px-2.5 py-2 pl-8 text-xs text-gray-900 focus:border-blue-500 focus:ring-blue-500 sm:px-3 sm:py-2.5 sm:pl-10 sm:text-sm"
              inputProps={{ id: "price_amount", name: "price_amount" }}
            />
          </div>

          <div>
            <Label className="mb-2 block text-xs sm:text-sm">
              Time Increments
            </Label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="allow_15min_increments"
                  name="allow_15min_increments"
                  checked={allow15MinIncrements}
                  onChange={(e) =>
                    handle15MinIncrementsChange(e.target.checked)
                  }
                  className="cursor-pointer"
                />
                <Label
                  htmlFor="allow_15min_increments"
                  className="cursor-pointer text-xs sm:text-sm"
                >
                  Allow 15 minutes increments
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="allow_30min_increments"
                  name="allow_30min_increments"
                  checked={allow30MinIncrements}
                  onChange={(e) =>
                    handle30MinIncrementsChange(e.target.checked)
                  }
                  className="cursor-pointer"
                />
                <Label
                  htmlFor="allow_30min_increments"
                  className="cursor-pointer text-xs sm:text-sm"
                >
                  Allow 30 minutes increments
                </Label>
              </div>
            </div>
          </div>

          <div>
            {/* <Label className="mb-1 block text-xs sm:mb-2 sm:text-sm">
              Service Providers Range
            </Label> */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div>
                <Label
                  htmlFor="min_service_providers"
                  className="mb-1 block text-xs text-gray-600"
                >
                  Minimum
                </Label>
                <NumericInput
                  value={minServiceProviders}
                  onValueChange={(n) =>
                    setMinServiceProviders(Math.max(1, n || 1))
                  }
                  decimals={0}
                  min={1}
                  step={1}
                  placeholder="1"
                  className="block w-full rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-xs text-gray-900 focus:border-blue-500 focus:ring-blue-500 sm:px-3 sm:py-2.5 sm:text-sm"
                  inputProps={{
                    id: "min_service_providers",
                    name: "min_service_providers",
                  }}
                />
              </div>
              <div>
                <Label
                  htmlFor="max_service_providers"
                  className="mb-1 block text-xs text-gray-600"
                >
                  Maximum
                </Label>
                <NumericInput
                  value={maxServiceProviders}
                  onValueChange={(n) =>
                    setMaxServiceProviders(Math.max(1, n || 1))
                  }
                  decimals={0}
                  min={1}
                  step={1}
                  placeholder="1"
                  className="block w-full rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-xs text-gray-900 focus:border-blue-500 focus:ring-blue-500 sm:px-3 sm:py-2.5 sm:text-sm"
                  inputProps={{
                    id: "max_service_providers",
                    name: "max_service_providers",
                  }}
                />
              </div>
            </div>
          </div>

          <div>
            <Label className="sm:sm mb-1 block text-xs sm:mb-2">
              Hours Range
            </Label>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div>
                <Label
                  htmlFor="hourly_min_duration"
                  className="mb-1 block text-xs text-gray-600"
                >
                  From
                </Label>
                <select
                  id="hourly_min_duration"
                  name="hourly_min_duration"
                  value={hourlyMinDuration}
                  onChange={(e) => setHourlyMinDuration(e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-xs text-gray-900 focus:border-blue-500 focus:ring-blue-500 sm:px-3 sm:py-2.5 sm:text-sm"
                  style={{ maxHeight: "200px" }}
                >
                  {hourOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label
                  htmlFor="hourly_max_duration"
                  className="mb-1 block text-xs text-gray-600"
                >
                  To
                </Label>
                <select
                  id="hourly_max_duration"
                  name="hourly_max_duration"
                  value={hourlyMaxDuration}
                  onChange={(e) => setHourlyMaxDuration(e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-xs text-gray-900 focus:border-blue-500 focus:ring-blue-500 sm:px-3 sm:py-2.5 sm:text-sm"
                  style={{ maxHeight: "200px" }}
                >
                  {hourOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Same Day Fee */}
      <div className="mt-8 flex w-full items-start gap-2 rounded-lg border border-gray-300 bg-white p-2 sm:mb-4 sm:flex-row sm:items-center sm:justify-between sm:gap-0 sm:p-3">
        <div>
          <Label className="text-xs font-medium text-gray-900 sm:text-sm">
            Same Day Fee
          </Label>
          <p className="mt-1 text-xs text-gray-500">
            Charge a fee for same day bookings
          </p>
        </div>
        <CustomToggle checked={hasSameDayFee} onChange={setHasSameDayFee} />
      </div>
      {/* Cutoff Settings */}
      {hasSameDayFee && (
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Same-Day Fee */}
          <div className="mt-1 flex flex-col gap-1 sm:gap-2">
            <Label
              htmlFor="same_day_fee_amount"
              className="text-xs font-medium sm:text-sm"
            >
              Same-Day Fee Amount ($)
            </Label>
            <NumericInput
              value={sameDayFeeAmount}
              onValueChange={setSameDayFeeAmount}
              decimals={2}
              min={0}
              step={0.01}
              placeholder="0.00"
              prefix={<span>$</span>}
              className="block h-9 w-full rounded-lg border border-gray-300 bg-white px-3 pl-8 text-xs text-gray-900 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              inputProps={{
                id: "same_day_fee_amount",
                name: "same_day_fee_amount",
              }}
            />
          </div>

          {/* Cutoff Time */}
          <div className="mt-1 flex flex-col gap-1 sm:gap-2">
            <Label
              htmlFor="cutoff_time"
              className="text-xs font-medium sm:text-sm"
            >
              Cutoff Time
            </Label>
            <TimeDrop
              id="cutoff_time"
              name="cutoff_time"
              value={cutoffTime} // string
              onChange={setCutoffTime} // Dispatch<SetStateAction<string>> fits
              minuteStep={5}
              className="w-full"
              inputClassName="text-xs sm:text-sm"
            />
          </div>

          {/* Cutoff Day */}
          <div className="mt-1 flex flex-col gap-1 sm:gap-2">
            <Label
              htmlFor="cutoff_day"
              className="text-xs font-medium sm:text-sm"
            >
              Cutoff Day
            </Label>
            <select
              id="cutoff_day"
              name="cutoff_day"
              value={cutoffDay}
              onChange={(e) => setCutoffDay(e.target.value)}
              className="block h-9 w-full cursor-pointer rounded-lg border border-gray-300 bg-white px-3 text-xs text-gray-900 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="dayBefore">Day Before Service</option>
              <option value="dayOf">Day of Service</option>
            </select>
          </div>
        </div>
      )}
      {/* Advanced Pricing */}
      <div className="mt-7 flex w-full items-start gap-2 rounded-lg border border-gray-300 bg-white p-2 sm:mb-1 sm:flex-row sm:items-center sm:justify-between sm:gap-0 sm:p-3">
        <div>
          <Label className="text-xs font-medium text-gray-900 sm:text-sm">
            Advanced Pricing
          </Label>
          <p className="mt-1 text-xs text-gray-500">
            Set different rates and schedules for each day of the week
          </p>
        </div>
        <CustomToggle
          checked={isAdvancedPricing}
          onChange={setIsAdvancedPricing}
        />
      </div>
      {isAdvancedPricing && (
        <div className="mt-7 space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="flex items-start gap-2 sm:mb-4">
            <div>
              <p className="text-xs font-medium text-gray-900 sm:text-sm">
                Custom pricing by day
              </p>
              <p className="mb-3 text-xs text-gray-500">
                Select days to customize their pricing and schedule
              </p>
            </div>
          </div>

          {/* Select Days */}
          <div>
            <Label className="mb-2 block text-xs font-medium sm:mb-3 sm:text-sm">
              Select Days
            </Label>
            <div className="flex w-full rounded-md shadow-sm" role="group">
              {WEEKDAYS.map((day, index) => {
                const isFirst = index === 0;
                const isLast = index === WEEKDAYS.length - 1;
                const isSelected = advancedPricing[day.key]?.enabled;

                return (
                  <button
                    key={day.key}
                    type="button"
                    onClick={() => handleDayToggle(day.key)}
                    className={`flex-1 border px-2 py-1.5 text-xs font-medium transition-colors duration-200 sm:px-4 sm:py-2 sm:text-sm ${isFirst ? "rounded-l-md" : ""} ${isLast ? "rounded-r-md" : ""} ${!isFirst ? "-ml-px" : ""} ${
                      isSelected
                        ? "relative z-10 border-blue-600 bg-blue-600 text-white hover:bg-blue-700"
                        : "border-gray-200 bg-white text-gray-900 hover:bg-gray-50 hover:text-gray-900"
                    } cursor-pointer focus:z-10 focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Daily Configurations */}
          <div className="space-y-3 sm:space-y-4">
            {WEEKDAYS.map((day) => {
              const dayData = advancedPricing[day.key];
              if (!dayData?.enabled) return null;

              return (
                <ShiftConfiguration
                  key={day.key}
                  dayKey={day.key}
                  dayLabel={day.key}
                  dayData={dayData}
                  pricingType={pricingType}
                  onBeforeShiftToggle={() => handleBeforeShiftToggle(day.key)}
                  onOffShiftToggle={() => handleOffShiftToggle(day.key)}
                  onShiftTimeChange={(shift, field, value) =>
                    handleShiftTimeChange(day.key, shift, field, value)
                  }
                  onShiftRateChange={(shift, rate) =>
                    handleShiftRateChange(day.key, shift, rate)
                  }
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default PricingSection;
