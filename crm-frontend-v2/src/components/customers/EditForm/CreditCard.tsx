// src/components/Customers/CreditCardTab.tsx
import * as React from "react";
import { Button, HelperText, Label, Spinner, Alert } from "flowbite-react";
import {  HiExclamationCircle } from "react-icons/hi";
import { USStateSelect, ZipCodeInput, onlyDigits } from "../../../components/ui/InputsBundle";

export type BillingSummary = {
  brand?: string;
  last4?: string;
  expMonth?: number;
  expYear?: number;
  tokenId?: string; // gateway token
  isDefault?: boolean;
  // Billing address fields (sent to gateway for AVS/fraud checks)
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
};

type Props = {
  initial?: BillingSummary | null;
  onSave: (summary: BillingSummary) => Promise<void> | void;
};

const required = (s: string) => s.trim().length > 0;

export default function CreditCardTab({ onSave }: Props) {
  // Card details
  const [cardholder, setCardholder] = React.useState("");
  const [cardNumber, setCardNumber] = React.useState("");
  const [exp, setExp] = React.useState(""); // MM/YY or MMYYYY
  const [cvc, setCvc] = React.useState("");
  const [isDefault, setIsDefault] = React.useState<boolean>(true);

  // Billing address (formatted like your CustomerForm)
  const [address, setAddress] = React.useState("");
  const [city, setCity] = React.useState("");
  const [state, setState] = React.useState("");
  const [zip, setZip] = React.useState("");

  const [errors, setErrors] = React.useState<Partial<Record<
    | "cardholder"
    | "cardNumber"
    | "exp"
    | "cvc"
    | "address"
    | "city"
    | "state"
    | "zip",
    string
  >>>({});

  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  const brandFromPAN = (pan: string) => {
    const d = onlyDigits(pan);
    if (/^4/.test(d)) return "Visa";
    if (/^(5[1-5]|2(2[2-9]|[3-6]\d|7[01]|720))/.test(d)) return "Mastercard";
    if (/^3[47]/.test(d)) return "Amex";
    if (/^6(011|5)/.test(d)) return "Discover";
    return "Card";
  };

  function validate(): boolean {
    const next: typeof errors = {};

    // Card fields
    if (!required(cardholder)) next.cardholder = "Cardholder name is required";

    const pan = onlyDigits(cardNumber);
    if (pan.length < 13 || pan.length > 19) next.cardNumber = "Enter a valid card number";

    const expDigits = onlyDigits(exp);
    if (!(expDigits.length === 4 || expDigits.length === 6)) {
      next.exp = "Enter expiry as MM/YY";
    } else {
      const mm = parseInt(expDigits.slice(0, 2), 10);
      if (isNaN(mm) || mm < 1 || mm > 12) next.exp = "Invalid expiry month";
    }

    const cvcDigits = onlyDigits(cvc);
    if (!/^\d{3,4}$/.test(cvcDigits)) next.cvc = "Invalid CVC";

    // Billing address (mirrors CustomerForm style)
    if (!required(address)) next.address = "Address is required";
    if (!required(city)) next.city = "City is required";
    if (!required(state)) next.state = "State is required";

    const zipDigits = onlyDigits(zip);
    if (!required(zip)) next.zip = "Zip Code is required";
    else if (zipDigits.length !== 5) next.zip = "Enter a 5-digit Zip Code";

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSave(e?: React.FormEvent) {
    e?.preventDefault?.();
    setSubmitError(null);
    if (!validate()) return;

    setSaving(true);
    try {
      const digits = onlyDigits(cardNumber);
      const last4 = digits.slice(-4);
      const brand = brandFromPAN(digits);

      const [mmStr, yyStrRaw] = exp.includes("/")
        ? exp.split("/")
        : [exp.slice(0, 2), exp.slice(2)];
      const expMonth = parseInt(mmStr, 10);
      const yyStr = yyStrRaw.length === 2 ? `20${yyStrRaw}` : yyStrRaw;
      const expYear = parseInt(yyStr, 10);

      const tokenId = `tok_${Math.random().toString(36).slice(2, 10)}`; // demo token

      await onSave({
        brand,
        last4,
        expMonth,
        expYear,
        tokenId,
        isDefault,
        address,
        city,
        state,
        zip,
      });

      // Clear sensitive fields
      setCardNumber("");
      setCvc("");
    } catch (err: any) {
      setSubmitError(err?.message ?? "Failed to save card.");
    } finally {
      setSaving(false);
    }
  }

  // Styling tokens to mirror your CustomerForm
  const focusBlue =
    "focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-600 focus:ring-offset-0 transition-colors";
  const baseInput =
    "block w-full rounded-lg border bg-white px-2.5 py-2 text-xs sm:px-3 sm:py-2.5 sm:text-sm text-gray-900 placeholder:text-gray-400";
  const okInput = `border-gray-300 ${focusBlue}`;

  return (
    <form className="space-y-6 p-4" onSubmit={handleSave} noValidate>
      {submitError && (
        <Alert color="failure" icon={HiExclamationCircle}>
          <span className="text-xs sm:text-sm">{submitError}</span>
        </Alert>
      )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-4">
          {/* Cardholder */}
          <div>
            <Label htmlFor="cardholder" className="mb-1 block sm:mb-2 text-sm">
              Cardholder Name
            </Label>
            <input
              id="cardholder"
              value={cardholder}
              onChange={(e) => setCardholder(e.target.value)}
              aria-invalid={!!errors.cardholder}
              className={`${baseInput} ${okInput}`}
              placeholder="Jane Doe"
            />
            {errors.cardholder && (
              <HelperText color="failure">{errors.cardholder}</HelperText>
            )}
          </div>

          {/* Card Number */}
          <div>
            <Label htmlFor="cardNumber" className="mb-1 block sm:mb-2 text-sm">
              Card Number
            </Label>
            <input
              id="cardNumber"
              inputMode="numeric"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              aria-invalid={!!errors.cardNumber}
              className={`${baseInput} ${okInput}`}
              placeholder="4242 4242 4242 4242"
            />
            {errors.cardNumber && (
              <HelperText color="failure">{errors.cardNumber}</HelperText>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-4">
          {/* Expiry */}
          <div>
            <Label htmlFor="exp" className="mb-1 block sm:mb-2 text-sm">
              Expiry (MM/YY)
            </Label>
            <input
              id="exp"
              inputMode="numeric"
              value={exp}
              onChange={(e) => setExp(e.target.value)}
              aria-invalid={!!errors.exp}
              className={`${baseInput} ${okInput}`}
              placeholder="12/28"
            />
            {errors.exp && <HelperText color="failure">{errors.exp}</HelperText>}
          </div>

          {/* CVC */}
          <div>
            <Label htmlFor="cvc" className="mb-1 block sm:mb-2 text-sm">
              CVC
            </Label>
            <input
              id="cvc"
              inputMode="numeric"
              value={cvc}
              onChange={(e) => setCvc(e.target.value)}
              aria-invalid={!!errors.cvc}
              className={`${baseInput} ${okInput}`}
              placeholder="CVC"
            />
            {errors.cvc && <HelperText color="failure">{errors.cvc}</HelperText>}
          </div>
        </div>

        {/* Default checkbox */}
        <label className="mt-2 inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isDefault}
            onChange={(e) => setIsDefault(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Set as default payment method
        </label>

      {/* BILLING ADDRESS (formatted like CustomerForm) */}
        <div className="mb-3 flex items-center gap-2 sm:mb-4 sm:gap-3">
          {/* <h3 className="text-lg font-semibold text-gray-900">Billing Address</h3> */}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:gap-4">
          {/* Address */}
          <div>
            <Label htmlFor="bill-address" className="mb-1 block sm:mb-2 text-sm">
              Address
            </Label>
            <input
              id="bill-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className={`${baseInput} ${okInput}`}
              placeholder="123 Main St"
              aria-invalid={!!errors.address}
            />
            {errors.address && <HelperText color="failure">{errors.address}</HelperText>}
          </div>

          <div className="grid min-w-0 grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
            {/* City */}
            <div className="min-w-0">
              <Label htmlFor="bill-city" className="mb-1 block sm:mb-2 text-sm">
                City
              </Label>
              <input
                id="bill-city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className={`${baseInput} ${okInput}`}
                placeholder="Los Angeles"
                aria-invalid={!!errors.city}
              />
              {errors.city && <HelperText color="failure">{errors.city}</HelperText>}
            </div>

            <div className="min-w-0">
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4">
                {/* State */}
                <div className="col-span-1 min-w-0">
                  <Label className="mb-1 block sm:mb-2 text-sm">State</Label>
                  <USStateSelect
                    value={state}
                    onChange={(abbr) => setState(abbr)}
                    error={!!errors.state}
                    className="w-full cursor-pointer"
                  />
                  {errors.state && <HelperText color="failure">{errors.state}</HelperText>}
                </div>

                {/* ZIP */}
                <div className="col-span-2 min-w-0 sm:col-span-3">
                  <Label className="mb-1 block sm:mb-2 text-sm">Zip Code</Label>
                  <ZipCodeInput
                    value={zip}
                    onChange={(z) => setZip(z)}
                    error={!!errors.zip}
                    className="w-full"
                    placeholder="90001"
                  />
                  {errors.zip && <HelperText color="failure">{errors.zip}</HelperText>}
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* Actions */}
      <div className="flex justify-end pt-1">
        <div className="flex gap-3">
          <Button
            type="button"
            color="light"
            className="h-10 cursor-pointer border border-gray-300 px-11 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500"
            onClick={() => {
              // optional: reset sensitive fields on cancel
              setCardNumber("");
              setCvc("");
              // feel free to lift a passed onCancel if you add it to Props later
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            color="blue"
            disabled={saving}
            className="h-10 cursor-pointer bg-blue-600 px-12 text-sm font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
          >
            {saving ? (
              <span className="inline-flex items-center gap-2">
                <Spinner size="sm" /> Saving…
              </span>
            ) : (
              "Save"
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
