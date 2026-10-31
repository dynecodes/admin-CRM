import * as React from "react";

type NumericInputProps = {
  value: number;                                  // canonical numeric value
  onValueChange: (n: number) => void;             // parsed/clamped number
  decimals?: number;                              // 0 for ints, 2 for money, etc.
  min?: number;
  max?: number;
  step?: number;                                  // default derived from decimals
  placeholder?: string;                           // "0.00", "0", etc.
  disabled?: boolean;
  prefix?: React.ReactNode;                       // "$" or icon
  suffix?: React.ReactNode;                       // "%" etc.
  className?: string;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
};

/**
 * Number input that:
 * - Uses `type="number"` → keeps native spinner arrows.
 * - Shows placeholder when external value === 0 (renders "").
 * - Parses/clamps on change.
 * - Normalizes to fixed decimals on blur (if decimals > 0).
 */
export default function NumericInput({
  value,
  onValueChange,
  decimals = 0,
  min,
  max,
  step,
  placeholder,
  disabled,
  prefix,
  suffix,
  className,
  inputProps,
}: NumericInputProps) {
  const [text, setText] = React.useState<string>("");

  // Keep internal text synced with external numeric value
  React.useEffect(() => {
    if (value === 0) {
      setText("");
    } else {
      setText(String(value));
    }
  }, [value]);

  const effectiveStep =
    typeof step === "number"
      ? step
      : decimals > 0
      ? Number("1e-" + decimals) // e.g. 0.01 for 2 decimals
      : 1;

  const clamp = (n: number) => {
    let out = n;
    if (typeof min === "number") out = Math.max(min, out);
    if (typeof max === "number") out = Math.min(max, out);
    return out;
  };

  const parseFromString = (raw: string): number | null => {
    if (raw === "" || raw === "-") return 0; // treat empty/minus as zero (shows placeholder)
    const n = Number(raw);
    if (Number.isNaN(n)) return null;
    return clamp(n);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Allow native number typing, including partial like "" or "-"
    setText(raw);

    const parsed = parseFromString(raw);
    if (parsed === null) return;
    onValueChange(parsed);
  };

  const handleBlur = () => {
    // Normalize on blur
    const parsed = parseFromString(text);
    if (parsed === null) {
      setText("");
      onValueChange(0);
      return;
    }
    if (parsed === 0) {
      setText(""); // keep placeholder look
      onValueChange(0);
      return;
    }
    const fixed =
      decimals > 0 ? parsed.toFixed(decimals) : String(Math.trunc(parsed));
    setText(fixed);
    onValueChange(Number(fixed));
  };

  return (
    <div className="relative">
      <input
        type="number"
        step={effectiveStep}
        min={min}
        max={max}
        value={text}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={disabled}
        placeholder={placeholder}
        className={className}
        {...inputProps}
      />
      {prefix && (
        <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs sm:text-sm text-gray-500">
          {prefix}
        </span>
      )}
      {suffix && (
        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs sm:text-sm text-gray-500">
          {suffix}
        </span>
      )}
    </div>
  );
}
