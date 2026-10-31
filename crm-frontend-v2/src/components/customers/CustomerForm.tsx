// src/components/Customers/CustomerForm.tsx
import * as React from "react";
import {
  Button,
  Label,
  HelperText,
  Card,
  Alert,
} from "flowbite-react";
import { Link } from "react-router-dom";
import { HiUser, HiExclamationCircle } from "react-icons/hi";
import { Customer, CustomerStatus, Confirmed } from "../../types/customers";
import { useLocations } from "../../hooks/Locations/useLocations";
import {
  TextInput,
  PhoneInput,
   USStateSelect,
   ZipCodeInput,
   onlyDigits,
} from "../ui/InputsBundle";
import { useCustomers } from "../../hooks/Customers/useCustomers";

type FormValue = {
  email: string;
  firstName: string;
  lastName: string;
  companyName: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  status: CustomerStatus;
  confirmed: Confirmed;
  locationId?: number | null;
};

type Props = {
  customer?: Customer;
  onSubmit: (values: FormValue) => void;
  onCancel: () => void;
};

const empty: FormValue = {
  email: "",
  firstName: "",
  lastName: "",
  companyName: "",
  address: "",
  city: "",
  state: "",
  zip: "",
  phone: "",
  status: "active",
  confirmed: "-",
  locationId: null,
};

const required = (s: string) => s.trim().length > 0;

// ---------- helpers for duplicate detection ----------
const normalizeEmail = (s: string) => s.trim().toLowerCase();
const last10Digits = (s: string) => {
  const d = onlyDigits(s);
  return d.slice(-10); // compare using canonical US 10-digit
};


export default function CustomerForm({ customer, onSubmit, onCancel }: Props) {
  const isEdit = !!customer;
  const { customers } = useCustomers();
  const {locations} = useLocations();
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const [form, setForm] = React.useState<FormValue>(() =>
    customer
      ? {
          email: customer.email ?? "",
          firstName: customer.firstName ?? "",
          lastName: customer.lastName ?? "",
          companyName: customer.companyName ?? "",
          address: customer.address ?? "",
          state: customer.state ?? "",
          city: customer.city ?? "",
          zip: customer.zip ?? "",
          phone: customer.phone ?? "",
          status: customer.status,
          confirmed: customer.confirmed,
          locationId: (customer as any).locationId ?? null,
        }
      : empty
  );

  // Auto-map ZIP → location
React.useEffect(() => {
  const zip = form.zip?.trim();
  if (!zip || zip.length !== 5) {
    handleChange("locationId", null);
    return;
  }

  let match: number | null = null;

  for (const loc of locations) {
    if (loc.postal_codes?.includes(zip)) {
      match = loc.id;
      break;
    }
  }

  handleChange("locationId", match);
}, [form.zip, locations]);

  const [errors, setErrors] = React.useState<
    Partial<Record<keyof FormValue, string>>
  >({});

  // ---------- duplicate detection state ----------
  const [dupMatch, setDupMatch] = React.useState<Customer | null>(null);
  const [dupBy, setDupBy] = React.useState<null | "email" | "phone" | "both">(
    null
  );

  // Debounced duplicate check on email/phone change
  React.useEffect(() => {
    const t = setTimeout(() => {
      const email = normalizeEmail(form.email);
      const phone10 = last10Digits(form.phone);

      let emailHit: Customer | undefined;
      let phoneHit: Customer | undefined;

      if (email) {
        emailHit = customers.find(
          (c) =>
            normalizeEmail(c.email ?? "") === email &&
            c.id !== (customer?.id ?? -1)
        );
      }
      if (phone10) {
        phoneHit = customers.find(
          (c) =>
            last10Digits(c.phone ?? "") === phone10 &&
            c.id !== (customer?.id ?? -1)
        );
      }

      if (emailHit && phoneHit) {
        // if both matched, prefer a single consistent record if possible
        const sameRecord =
          emailHit.id === phoneHit.id ? emailHit : (emailHit ?? phoneHit);
        setDupMatch(sameRecord ?? null);
        setDupBy("both");
      } else if (emailHit) {
        setDupMatch(emailHit);
        setDupBy("email");
      } else if (phoneHit) {
        setDupMatch(phoneHit);
        setDupBy("phone");
      } else {
        setDupMatch(null);
        setDupBy(null);
      }
    }, 250); // small debounce to avoid checking on every keystroke

    return () => clearTimeout(t);
  }, [form.email, form.phone, customers, customer?.id]);

  function handleChange<K extends keyof FormValue>(key: K, val: FormValue[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function validate(): boolean {
  const next: typeof errors = {};

  // Email
  if (!required(form.email)) next.email = "Email is required";
  else if (!/^\S+@\S+\.\S+$/.test(form.email))
    next.email = "Enter a valid email";

  // Names
  if (!required(form.firstName)) next.firstName = "First Name is required";
  if (!required(form.lastName)) next.lastName = "Last Name is required";

  // Phone: 10 digits
  const phoneDigits = onlyDigits(form.phone);
  if (!required(form.phone)) next.phone = "Phone is required";
  else if (phoneDigits.length !== 10)
    next.phone = "Enter a 10-digit US phone";

  // Zip: only validate if provided (optional)
  const zipDigits = onlyDigits(form.zip);
  if (form.zip && zipDigits.length !== 5)
    next.zip = "Enter a 5-digit Zip Code";

    // Duplicate flags (block submit)
    if (dupBy === "email" || dupBy === "both") {
      next.email = next.email ?? "A customer with this email already exists.";
    }
    if (dupBy === "phone" || dupBy === "both") {
      next.phone = next.phone ?? "A customer with this phone already exists.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    if (!validate()) return;
    try {
      onSubmit(form);
    } catch (err) {
      setSubmitError((err as Error).message || "Something went wrong.");
    }
  }

  // Local styling tokens (kept to match your existing look)
  const pathPrefix = window.location.pathname.split('/')[1];

  const dupBanner =
    dupMatch && dupBy ? (
      <Alert color="warning" icon={HiExclamationCircle}>
        <div className="text-xs sm:text-sm">
          {dupBy === "both"
            ? "This email and phone match an existing customer."
            : dupBy === "email"
            ? "This email matches an existing customer."
            : "This phone matches an existing customer."}{" "}
          {/* {dupMatch?.id != null && (
            <>
              View existing record:&nbsp;
              <Link
                className="underline hover:no-underline"
                to={`/${pathPrefix}/customers/${dupMatch.id}`}
              >
                #{dupMatch.id} {dupMatch.firstName} {dupMatch.lastName}
              </Link>
            </>
          )} */}
        </div>
      </Alert>
    ) : null;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center text-gray-700" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <Link
              to={`/${pathPrefix}/customers`}
              className="inline-flex items-center text-xs font-medium text-gray-700 hover:text-gray-600 sm:text-sm"
            >
              Customers
            </Link>
          </li>
          <li aria-current="page">
            <div className="flex items-center">
              <svg
                className="mx-1 h-3 w-3 text-gray-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="ml-1 text-xs font-medium text-gray-500 sm:text-sm md:ml-2">
                {isEdit ? "Edit Customer" : "New Customer"}
              </span>
            </div>
          </li>
        </ol>
      </nav>

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="relative inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-black sm:h-12 sm:w-12">
            <HiUser className="h-5 w-5 text-white sm:h-6 sm:w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 sm:text-2xl lg:text-3xl">
              {isEdit ? "Edit Customer" : "New Customer"}
            </h1>
            <p className="text-xs text-gray-500 sm:text-sm">
              {isEdit
                ? "Update customer details"
                : "Add a new customer to your list"}
            </p>
          </div>
        </div>
      </div>

      {submitError && (
        <Alert color="failure" icon={HiExclamationCircle}>
          <span className="text-xs sm:text-sm">{submitError}</span>
        </Alert>
      )}

      {/* Duplicate banner (if any) */}
      {dupBanner}

      <form className="space-y-4 sm:space-y-6" onSubmit={submit} noValidate>
        {/* Basic Info */}
        <Card className="bg-gray-50">
          <div className="mb-3 flex items-center gap-2 sm:mb-4 sm:gap-3">
            <h3 className="text-lg font-semibold text-gray-900 s">
              Customer Information
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-4">
            <div>
              <Label htmlFor="firstName" className="mb-1 block sm:mb-2 text-sm">
                First Name
              </Label>
             <TextInput
              id="firstName"
              value={form.firstName}
              onChange={(e) => handleChange("firstName", e.target.value)}
              autoComplete="given-name"
              placeholder="Enter First Name"
              error={!!errors.firstName}
              required
            />
              {errors.firstName && (
                <HelperText color="failure">{errors.firstName}</HelperText>
              )}
            </div>

            <div>
              <Label htmlFor="lastName" className="mb-1 block sm:mb-2 text-sm">
                Last Name
              </Label>
              <TextInput
              id="lastName"
              value={form.lastName}
              onChange={(e) => handleChange("lastName", e.target.value)}
              autoComplete="family-name"
              placeholder="Enter Last Name"
              error={!!errors.lastName}
              required
            />
              {errors.lastName && (
                <HelperText color="failure">{errors.lastName}</HelperText>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-4">
            <div>
              <Label htmlFor="email" className="mb-1 block sm:mb-2 text-sm">
                Email
              </Label>
              <TextInput
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                autoComplete="email"
                placeholder="Enter Email"
                error={!!errors.email}
                required
              />
              {errors.email && (
                <HelperText color="failure">{errors.email}</HelperText>
              )}
            </div>
            <div>
              <Label htmlFor="phone" className="mb-1 block sm:mb-2 text-sm">
                Phone
              </Label>
              <PhoneInput
                id="phone"
                value={form.phone}
                onChange={(formatted) => handleChange("phone", formatted)}
                error={!!errors.phone}
                placeholder="(800) 555-1212"
              />
              {errors.phone && (
                <HelperText color="failure">{errors.phone}</HelperText>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="companyName" className="mb-1 block sm:mb-2 text-sm">
              Company Name
            </Label>
           <TextInput
              id="companyName"
              value={form.companyName}
              onChange={(e) => handleChange("companyName", e.target.value)}
              placeholder="(Optional)"
              autoComplete="organization"/>
          </div>
        </Card>

        {/* Address */}
        <div className="lg:col-span-2">
          <Card className="bg-gray-50">
            <div className="mb-3 flex items-center gap-2 sm:mb-4 sm:gap-3">
              <h3 className="text-lg font-semibold text-gray-900">Address</h3>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:gap-4">
              <div>
                <Label className="mb-1 block  sm:mb-2 text-sm">Address</Label>
               <TextInput
                  value={form.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  placeholder="Enter Address"
                  error={!!errors.address}
                />
                {errors.address && (
                  <HelperText color="failure">{errors.address}</HelperText>
                )}
              </div>

              <div className="grid min-w-0 grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
                <div className="min-w-0">
                  <Label className="mb-1 block  sm:mb-2 text-sm">City</Label>
                 <TextInput
                    value={form.city}
                    onChange={(e) => handleChange("city", e.target.value)}
                    placeholder="Enter City"
                    error={!!errors.city}
                  />
                  {errors.city && (
                    <HelperText color="failure">{errors.city}</HelperText>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4">
                    {/* State */}
                    <div className="col-span-1 min-w-0">
                      <Label className="mb-1 block sm:mb-2 text-sm">
                        State
                      </Label>
                      <USStateSelect
                        value={form.state}
                        onChange={(abbr) => handleChange("state", abbr)}
                        error={!!errors.state}
                        className="w-full cursor-pointer"
                      />
                      {errors.state && (
                        <HelperText color="failure">{errors.state}</HelperText>
                      )}
                    </div>

                    {/* Zip */}
                    <div className="col-span-2 min-w-0 sm:col-span-3">
                      <Label className="mb-1 block  sm:mb-2 text-sm">
                        Zip Code
                      </Label>
                      <ZipCodeInput
                        value={form.zip}
                        onChange={(zip) => handleChange("zip", zip)}
                        error={!!errors.zip}
                        className="w-full"
                        placeholder="Enter Zip Code"
                      />
                      {errors.zip && (
                        <HelperText color="failure">{errors.zip}</HelperText>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="flex justify-end pt-4">
          <div className="flex gap-3">
            <Button
              type="button"
              color="light"
              onClick={onCancel}
              className="h-10 border cursor-pointer border-gray-300 px-11 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              color="gray"
              className="h-10 bg-gray-600 cursor-pointer px-12 text-sm font-medium text-white hover:bg-gray-700 focus:ring-2 focus:ring-gray-500"
            >
              {isEdit ? "Update" : "Save"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
