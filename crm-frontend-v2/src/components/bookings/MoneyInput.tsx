// src/components/ui/MoneyInput.tsx
import * as React from "react";
import { sanitizeMoney } from "./utils/money";

type Props = {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  disabled?: boolean;
  className?: string;
  allowNegative?: boolean;
  "aria-label"?: string;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
};

// src/components/ui/MoneyInput.tsx
export default function MoneyInput({
  value,
  onChange,
  placeholder,          // 👈 no default here
  readOnly = false,
  disabled = false,
  className = "",
  allowNegative = false,
  id,
  "aria-label": ariaLabel,
  onBlur,
  onKeyDown,
}: Props) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-sm text-gray-500">
        $
      </span>
      <input
        id={id}
        aria-label={ariaLabel}
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(sanitizeMoney(e.target.value, allowNegative))}
        placeholder={placeholder}  
        readOnly={readOnly}
        disabled={disabled}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        className={`${className} pl-8 sm:pl-6`}
      />
    </div>
  );
}
