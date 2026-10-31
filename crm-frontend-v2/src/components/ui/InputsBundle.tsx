// // src/components/ui/InputBundle.tsx
// import * as React from "react";

// /* =========================
//  * Helpers & Types
//  * ========================= */
// export const onlyDigits = (s: string) => s.replace(/\D+/g, "");

// export const formatUSPhone = (digitsRaw: string) => {
//   const d = onlyDigits(digitsRaw).slice(0, 10);
//   const len = d.length;
//   if (len === 0) return "";
//   if (len < 3) return `(${d}`;
//   if (len === 3) return `(${d}) `;
//   if (len <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
//   return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
// };

// export const formatUSZip5 = (s: string) => onlyDigits(s).slice(0, 5);

// export const US_STATES = [
//   "AK", "AL", "AR", "AZ", "CA", "CO", "CT", "DC", "DE", "FL", "GA", "HI",
//   "IA", "ID", "IL", "IN", "KS", "KY", "LA", "MA", "MD", "ME", "MI", "MN",
//   "MO", "MS", "MT", "NC", "ND", "NE", "NH", "NJ", "NM", "NV", "NY", "OH",
//   "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VA", "VT", "WA",
//   "WI", "WV", "WY",
// ] as const;
// export type USState = typeof US_STATES[number];

// /* =========================
//  * Shared styling tokens
//  * ========================= */
// const focusGray =
//   "focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-600";
// const inputBase =
//   "block w-full rounded-lg border bg-white px-2.5 py-2 text-xs sm:px-3 sm:py-2.5 sm:text-sm text-gray-900 placeholder:text-gray-400";
// const ok = `border-gray-300 ${focusGray}`;
// const bad = `border-red-500 ring-1 ring-red-500/20 ${focusGray}`;

// // Helper for dynamic class
// export const inputClass = (error?: boolean) =>
//   `${inputBase} ${error ? bad : ok}`;

// /* =========================
//  * TextInput / TextArea
//  * ========================= */
// /* =========================
//  * TextInput / TextArea
//  * ========================= */
// export function TextInput({
//   error,
//   className,
//   ...rest
// }: React.InputHTMLAttributes<HTMLInputElement> & { error?: boolean }) {
//   return <input className={`${inputClass(error)} ${className ?? ""}`} {...rest} />;
// }


// export function TextArea({
//   error,
//   className,
//   ...rest
// }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: boolean }) {
//   return <textarea className={`${inputClass(error)} ${className ?? ""}`} {...rest} />;
// }

// /* =========================
//  * PhoneInput
//  * ========================= */
// type PhoneInputProps = Omit<
//   React.InputHTMLAttributes<HTMLInputElement>,
//   "onChange" | "value"
// > & {
//   value: string;
//   onChange: (formatted: string) => void;
//   error?: boolean;
// };

// export function PhoneInput({
//   value,
//   onChange,
//   error,
//   className,
//   ...rest
// }: PhoneInputProps) {
//   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const nextDigits = onlyDigits(e.target.value).slice(0, 10);
//     onChange(formatUSPhone(nextDigits));
//   };

//   const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
//     const allowed = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab", "Home", "End"];
//     if (allowed.includes(e.key)) return;
//     if (!/^\d$/.test(e.key)) e.preventDefault();
//     if (/^\d$/.test(e.key) && onlyDigits(value).length >= 10) e.preventDefault();
//   };

//   return (
//     <input
      
//       inputMode="numeric"
//       autoComplete="tel"
//       maxLength={14}
//       value={value}
//       onChange={handleChange}
//       onKeyDown={handleKeyDown}
//       placeholder="(800) 555-1212"
//       className={`${inputClass(error)} ${className ?? ""}`}
//       aria-invalid={!!error}
//       {...rest}
//     />
//   );
// }

// /* =========================
//  * USStateSelect
//  * ========================= */
// type USStateSelectProps = {
//   value?: string;
//   onChange: (abbr: USState) => void;
//   error?: boolean;
//   className?: string;
//   placeholder?: string;
// };

// export function USStateSelect({
//   value,
//   onChange,
//   error,
//   className,
//   placeholder = "Select",
// }: USStateSelectProps) {
//   return (
//     <select
//       value={value ?? ""}
//       onChange={(e) => onChange(e.target.value as USState)}
//       className={`${inputClass(error)} ${className ?? ""}`}
//       aria-invalid={!!error}
//     >
//       <option value="">{placeholder}</option>
//       {US_STATES.map((abbr) => (
//         <option key={abbr} value={abbr}>
//           {abbr}
//         </option>
//       ))}
//     </select>
//   );
// }

// /* =========================
//  * ZipCodeInput
//  * ========================= */
// type ZipCodeInputProps = Omit<
//   React.InputHTMLAttributes<HTMLInputElement>,
//   "onChange" | "value"
// > & {
//   value: string;
//   onChange: (zip: string) => void;
//   error?: boolean;
// };

// export function ZipCodeInput({
//   value,
//   onChange,
//   error,
//   className,
//   ...rest
// }: ZipCodeInputProps) {
//   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     onChange(formatUSZip5(e.target.value));
//   };

//   const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
//     const control = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab", "Home", "End"];
//     if (control.includes(e.key)) return;
//     if (!/^\d$/.test(e.key)) {
//       e.preventDefault();
//       return;
//     }
//     if (onlyDigits(value).length >= 5) e.preventDefault();
//   };

//   return (
//     <input
//       inputMode="numeric"
//       autoComplete="postal-code"
//       maxLength={5}
//       value={value}
//       onChange={handleChange}
//       onKeyDown={handleKeyDown}
//       className={`${inputClass(error)} ${className ?? ""}`}
//       aria-invalid={!!error}
//       {...rest}
//     />
//   );
// }


// src/components/ui/InputBundle.tsx
import * as React from "react";

/* =========================
 * Helpers & Types
 * ========================= */
export const onlyDigits = (s: string) => s.replace(/\D+/g, "");

export const formatUSPhone = (digitsRaw: string) => {
  const d = onlyDigits(digitsRaw).slice(0, 10);
  const len = d.length;
  if (len === 0) return "";
  if (len < 3) return `(${d}`;
  if (len === 3) return `(${d}) `;
  if (len <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
};

export const formatUSZip5 = (s: string) => onlyDigits(s).slice(0, 5);

export const US_STATES = [
  "AK","AL","AR","AZ","CA","CO","CT","DC","DE","FL","GA","HI",
  "IA","ID","IL","IN","KS","KY","LA","MA","MD","ME","MI","MN",
  "MO","MS","MT","NC","ND","NE","NH","NJ","NM","NV","NY","OH",
  "OK","OR","PA","RI","SC","SD","TN","TX","UT","VA","VT","WA",
  "WI","WV","WY",
] as const;

export type USState = typeof US_STATES[number];

/* =========================
 * Shared styling tokens
 * ========================= */
const focusGray =
  "focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-600";
const inputBase =
  "block w-full rounded-lg border bg-white px-2.5 py-2 text-xs sm:px-3 sm:py-2.5 sm:text-sm text-gray-900 placeholder:text-gray-400";
const ok = `border-gray-300 ${focusGray}`;
const bad = `border-red-500 ring-1 ring-red-500/20 ${focusGray}`;

export const inputClass = (error?: boolean) =>
  `${inputBase} ${error ? bad : ok}`;

/* =========================
 * ✅ TextInput (FIXED)
 * ========================= */
type TextInputProps =
  React.InputHTMLAttributes<HTMLInputElement> & {
    error?: boolean;
  };

export const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  ({ error, className, ...rest }, ref) => {
    return (
      <input
        ref={ref}
        className={`${inputClass(error)} ${className ?? ""}`}
        {...rest}
      />
    );
  }
);

TextInput.displayName = "TextInput";

/* =========================
 * TextArea
 * ========================= */
export function TextArea({
  error,
  className,
  ...rest
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: boolean }) {
  return <textarea className={`${inputClass(error)} ${className ?? ""}`} {...rest} />;
}

/* =========================
 * PhoneInput
 * ========================= */
type PhoneInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "onChange" | "value"
> & {
  value: string;
  onChange: (formatted: string) => void;
  error?: boolean;
};

export function PhoneInput({
  value,
  onChange,
  error,
  className,
  ...rest
}: PhoneInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextDigits = onlyDigits(e.target.value).slice(0, 10);
    onChange(formatUSPhone(nextDigits));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const allowed = ["Backspace","Delete","ArrowLeft","ArrowRight","Tab","Home","End"];
    if (allowed.includes(e.key)) return;
    if (!/^\d$/.test(e.key)) e.preventDefault();
    if (/^\d$/.test(e.key) && onlyDigits(value).length >= 10) e.preventDefault();
  };

  return (
    <input
      inputMode="numeric"
      autoComplete="tel"
      maxLength={14}
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      placeholder="(800) 555-1212"
      className={`${inputClass(error)} ${className ?? ""}`}
      aria-invalid={!!error}
      {...rest}
    />
  );
}

/* =========================
 * USStateSelect
 * ========================= */
type USStateSelectProps = {
  value?: string;
  onChange: (abbr: USState) => void;
  error?: boolean;
  className?: string;
  placeholder?: string;
};

export function USStateSelect({
  value,
  onChange,
  error,
  className,
  placeholder = "Select",
}: USStateSelectProps) {
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value as USState)}
      className={`${inputClass(error)} ${className ?? ""}`}
      aria-invalid={!!error}
    >
      <option value="">{placeholder}</option>
      {US_STATES.map((abbr) => (
        <option key={abbr} value={abbr}>
          {abbr}
        </option>
      ))}
    </select>
  );
}

/* =========================
 * ZipCodeInput
 * ========================= */
type ZipCodeInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "onChange" | "value"
> & {
  value: string;
  onChange: (zip: string) => void;
  error?: boolean;
};

export function ZipCodeInput({
  value,
  onChange,
  error,
  className,
  ...rest
}: ZipCodeInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(formatUSZip5(e.target.value));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const control = ["Backspace","Delete","ArrowLeft","ArrowRight","Tab","Home","End"];
    if (control.includes(e.key)) return;
    if (!/^\d$/.test(e.key)) e.preventDefault();
    if (onlyDigits(value).length >= 5) e.preventDefault();
  };

  return (
    <input
      inputMode="numeric"
      autoComplete="postal-code"
      maxLength={5}
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      className={`${inputClass(error)} ${className ?? ""}`}
      aria-invalid={!!error}
      {...rest}
    />
  );
}
