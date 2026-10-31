// src/components/Customers/EditFormCustomer.tsx
import * as React from "react";
import {
  Button,
  Card,
  Label,
  HelperText,
  Dropdown
} from "flowbite-react";
import {
  HiUser,
  HiClipboardList,
  HiCalendar,
  HiDocumentText,
  HiMail,
  HiCreditCard,
  HiChevronDown,
  HiChevronUp,
  HiClock,
  HiTrash,
} from "react-icons/hi";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "../ui/Toast";
import { useLocations } from "../../hooks/Locations/useLocations";
import {
  TextInput,
 PhoneInput,
   USStateSelect,
   ZipCodeInput,
   onlyDigits,
} from "../ui/InputsBundle";
import { useCustomerAddresses } from "../../hooks/Customers/useCustomerAddresses";
import CustomerNotes from "./EditForm/Notes";
import CreditCardTab from "./EditForm/CreditCard";
import CustomerPreferencesDetails from "./EditForm/Details";
import CustomerBookings from "./EditForm/Bookings";
import NotificationPreferences from "./EditForm/Email";
import { createPortal } from "react-dom";
import SendMessageModal from "../providers/EditForm/SendMessageModal";
import TeamHistoryModal from "../providers/EditForm/TeamHistoryModal";
import { Customer, Confirmed, CustomerHistoryRecord} from "../../types/customers";
import { useCustomers } from "../../hooks/Customers/useCustomers";
import {
  useCustomerExtras,
  type CustomerDetailsPayload,
  type CustomerNotificationPrefs,
  type CustomerPaymentMethod,
} from "../../hooks/Customers/useCustomerExtras";
import type { BookingFormState } from "../../types/bookings";
// If your hook doesn’t have updateNote yet
import usePrivateService from "../../hooks/Auth/usePrivateService";
import type { CustomerAddress,CustomerEditForm } from "../../types/customers";
/* ================== props & types ================== */
type Props = {
  customer: Customer;
  onCancel: () => void;
  onSaved?: () => void;
};

type InfoDetailsProps = {
  form: CustomerEditForm;
  errors: Partial<Record<keyof CustomerEditForm, string>>;
  onChange: <K extends keyof CustomerEditForm>(
    k: K,
    v: CustomerEditForm[K]
  ) => void;

  // multi-address props
  addresses: CustomerAddress[];

  // 🔹 Return created/updated address (matches the hook)
  onAddAddress: (data: Partial<CustomerAddress>) => Promise<CustomerAddress>;
  onUpdateAddress: (
    id: number,
    patch: Partial<CustomerAddress>
  ) => Promise<CustomerAddress>;
  onDeleteAddress: (id: number) => Promise<void>;
  onSetDefaultAddress: (id: number) => Promise<CustomerAddress>;
};



type Tab =
  | "info"
  | "details"
  | "creditcard"
  | "bookings"
  | "notes"
  | "files"
  | "email";

/* ================== helpers ================== */
const toBoolConfirmed = (val: Confirmed): boolean => {
  const s = String(val ?? "").trim().toLowerCase();
  return s === "✓" || s === "yes" || s === "true" || s === "confirmed";
};
const toConfirmedValue = (b: boolean): Confirmed => (b ? "✓" : "-") as Confirmed;

const initialsFromName = (first?: string, last?: string) => {
  const a = (first ?? "").trim()[0] ?? "";
  const b = (last ?? "").trim()[0] ?? "";
  const n = `${a}${b}`.toUpperCase();
  return n || "C";
};

const toCustomerEditForm = (c: Customer): CustomerEditForm => {
  const baseAddress: CustomerAddress = {
    address: c.address ?? "",
    city: c.city ?? "",
    state: (c as any).state ?? "",
    zip: (c as any).zip ?? "",
    locationId: (c as any).locationId ?? null,
    isDefault: true,
  };

  const existingAddresses = ((c as any).addresses as CustomerAddress[] | undefined) ?? [];

  return {
    email: c.email ?? "",
    firstName: c.firstName ?? "",
    lastName: c.lastName ?? "",
    companyName: c.companyName ?? "",
    address: baseAddress.address,
    city: baseAddress.city,
    state: baseAddress.state,
    zip: baseAddress.zip,
    phone: c.phone ?? "",
    status: c.status ?? "active",
    confirmed: c.confirmed ?? "-",
    billing: (c as any).billing ?? null,
    locationId: baseAddress.locationId ?? null,
    isDefaultAddress: (c as any).isDefaultAddress ?? true,

    // NEW: multi-address list (default = single address)
    addresses: existingAddresses.length ? existingAddresses : [baseAddress],

    // defaults for new UI
    avatarUrl: (c as any).avatarUrl ?? null,
    blocked: (c as any).blocked ?? false,
    blockedReason: (c as any).blockedReason ?? (c as any).blocked_reason ?? null,
    specialSalesTaxEnabled: (c as any).specialSalesTaxEnabled ?? false,
    specialSalesTaxPercent:
      (c as any).specialSalesTaxPercent ?? (c as any).special_sales_tax ?? null,
  };
};


const required = (s: string) => s.trim().length > 0;

/* ---------- Block Customer modal (portal) ---------- */
function BlockCustomerDialog({
  open,
  name,
  initial,
  initialReason,
  onClose,
  onSave,
}: {
  open: boolean;
  name: string;
  initial: boolean;
  initialReason?: string | null;
  onClose: () => void;
  onSave: (blocked: boolean, reason: string | null) => void | Promise<void>;
}) {
  const panelRef = React.useRef<HTMLDivElement | null>(null);
  const [blocked, setBlocked] = React.useState(initial);
  const [reason, setReason] = React.useState<string>(initialReason ?? "");
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setBlocked(initial);
    setReason(initialReason ?? "");
    setError(null);
  }, [initial, initialReason, open]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const onDoc = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDoc);
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDoc);
      document.documentElement.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Block Customer"
        className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl ring-1 ring-black/10"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Block Customer: {name}</h3>
          <button
            onClick={onClose}
            className="rounded-md p-2 hover:bg-gray-100 text-gray-500 cursor-pointer"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="px-5 py-4 space-y-3 text-sm text-gray-700">
          <p>
            Blocking prevents new bookings (they’ll see <strong>0 available spots</strong>).
            They can still log in to manage existing bookings.
          </p>

          <div className="mt-2 flex items-center gap-4">
            <Label className="text-sm">Block Customer</Label>
            <button
              type="button"
              onClick={() => setBlocked(!blocked)}
              className={`inline-flex items-center justify-between cursor-pointer rounded-lg border px-3 py-1.5 text-sm ${
                blocked
                  ? "bg-[#ff0000] text-white border-red-600"
                  : "bg-white text-gray-700 border-gray-300"
              }`}
            >
              {blocked ? "Yes" : "No"}
            </button>
          </div>

          {blocked && (
            <div className="mt-3">
              <Label className="mb-1 block text-xs sm:text-sm">Reason for blocking</Label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Chargeback / repeated no-shows / abusive messages"
                rows={3}
                className={`w-full rounded-md border px-3 py-2 text-sm outline-none ${
                  error ? "border-red-400 focus:ring-2 focus:ring-red-300" : "border-gray-300 focus:ring-2 focus:ring-blue-300"
                }`}
              />
              {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
              <p className="mt-1 text-xs text-gray-500">This note will be visible to staff.</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="rounded-lg cursor-pointer px-4 py-2 text-sm border border-gray-300 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              if (blocked && !reason.trim()) {
                setError("Please provide a reason.");
                return;
              }
              await onSave(blocked, blocked ? reason.trim() : null);
              onClose();
            }}
            className="rounded-lg px-4 py-2 cursor-pointer text-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
/* ================== inline field UI (Info tab) ================== */
function InfoDetails({
  form,
  errors,
  onChange,
  addresses,
  onAddAddress,
  onUpdateAddress,
  onDeleteAddress,
  onSetDefaultAddress,
}: InfoDetailsProps) {
  const { locations } = useLocations();
  const toast = useToast();

  // Local, fast addresses used by the UI
  const [localAddresses, setLocalAddresses] = React.useState<CustomerAddress[]>([]);
  const [collapsed, setCollapsed] = React.useState<Record<number, boolean>>({});

  const firstLoadRef = React.useRef(true);
  const ensureCollapsedMap = (arr: CustomerAddress[]) => {
    // default row (index 0) open, others closed
    const map: Record<number, boolean> = {};
    arr.forEach((_, i) => {
      map[i] = i === 0 ? false : true;
    });
    return map;
  };

  const toggleCollapsed = (idx: number) =>
    setCollapsed((m) => ({ ...m, [idx]: !m[idx] }));

  /**
   * Seed localAddresses from backend (or legacy single address).
   * ONLY depends on `addresses` so we don't blow away local edits while typing.
   */
React.useEffect(() => {
  let next: CustomerAddress[];

  if (addresses && addresses.length) {
    // Put default at the top
    const sorted = [...addresses].sort((a, b) => {
      const aRank = a.isDefault ? 0 : 1;
      const bRank = b.isDefault ? 0 : 1;
      return aRank - bRank;
    });
    next = sorted;
  } else {
    // Legacy c_customers single address
    next = [
      {
        id: 0 as any,
        address: form.address ?? "",
        city: form.city ?? "",
        state: form.state ?? "",
        zip: form.zip ?? "",
        locationId: form.locationId ?? null,
        isDefault: form.isDefaultAddress ?? true,
      },
    ];
  }

  setLocalAddresses(next);

  setCollapsed((prev) => {
    if (firstLoadRef.current) {
      firstLoadRef.current = false;
      const map: Record<number, boolean> = {};
      next.forEach((_, i) => {
        map[i] = i === 0 ? false : true; // first open, others closed
      });
      return map;
    }

    // If length didn't change, keep the user's open/closed state
    if (Object.keys(prev).length === next.length) return prev;

    // If length changed (add/remove), keep old where possible, init new rows
    const map: Record<number, boolean> = {};
    next.forEach((_, i) => {
      if (i in prev) {
        map[i] = prev[i];
      } else {
        map[i] = i === 0 ? false : true;
      }
    });
    return map;
  });
}, [
  addresses,         
]);

// ❌ You can now remove zipBelongsToLocation entirely if it's unused

const handleLocationChange = async (
  addr: CustomerAddress,
  idx: number,
  loc: any
) => {
  const nextLocId = Number(loc.id);

  // ✅ Do NOT touch zip here – keep whatever the user typed.
  updateLocalAddress(idx, {
    locationId: nextLocId,
  });

  // ✅ Persist to backend with the current zip (no cleaning)
  try {
    const basePayload = {
      address: addr.address ?? "",
      city: addr.city ?? "",
      state: addr.state ?? "",
      zip: addr.zip ?? "",          // keep whatever user typed
      locationId: nextLocId,
      isDefault: !!addr.isDefault,
    };

    if (addr.id && addr.id !== 0) {
      // Existing address
      await onUpdateAddress(addr.id, basePayload);
      toast.success({
        title: "Location updated",
        description: "Address location has been updated.",
      });
    } else {
      // New address
      const created = await onAddAddress(basePayload);

      setLocalAddresses((prev) =>
        prev.map((a, i) => (i === idx ? { ...a, ...created } : a))
      );

      toast.success({
        title: "Address saved",
        description: "Address with new location has been saved.",
      });
    }
  } catch (e) {
    console.error("Failed to update address location", e);
    toast.error({
      title: "Update failed",
      description: "We couldn’t update this address location.",
    });
  }
};


React.useEffect(() => {
  if (!localAddresses.length) return;
  const def = localAddresses.find((a) => a.isDefault) ?? localAddresses[0];

  onChange("address", (def.address ?? "") as any);
  onChange("city", (def.city ?? "") as any);
  onChange("state", (def.state ?? "") as any);
  onChange("zip", (def.zip ?? "") as any);
  onChange("locationId", (def.locationId ?? null) as any);
  onChange("isDefaultAddress", (def.isDefault ?? true) as any);
  onChange("addresses", localAddresses as any);  // 👈 this is the key
}, [localAddresses]);



  /** Local update helper (instant typing) */
  const updateLocalAddress = (idx: number, patch: Partial<CustomerAddress>) => {
    setLocalAddresses((prev) =>
      prev.map((a, i) =>
        i === idx ? { ...a, ...patch, updatedAt: new Date().toISOString() } : a
      )
    );
  };

  /** Persist one row to backend (called onBlur) */
const persistAddress = async (idx: number) => {
  const addr = localAddresses[idx];
  if (!addr) return;

  const { id, createdAt, updatedAt, ...body } = addr as any;

  try {
    if (id && id !== 0) {
      await onUpdateAddress(id, body);
      toast.success({
        title: "Address saved",
        description: "Address changes have been saved.",
      });
    } else {
      const created = await onAddAddress(body);
      setLocalAddresses((prev) =>
        prev.map((a, i) => (i === idx ? { ...a, ...created } : a))
      );
      toast.success({
        title: "Address added",
        description: "New address has been created.",
      });
    }
  } catch (e) {
    console.error("Failed to persist address", e);
    toast.error({
      title: "Save failed",
      description: "We couldn’t save this address. Please try again.",
    });
  }
};


  /** Auto-map location when ZIP reaches 5 digits */
  const autoLocationIdForZip = (zip: string): number | null => {
    const digits = zip.replace(/\D/g, "");
    if (digits.length !== 5) return null;

    for (const loc of locations ?? []) {
      if (loc.postal_codes?.includes(digits)) {
        return Number(loc.id);
      }
    }
    return null;
  };

  /** Add Address – instant, only local; backend save happens on blur */
  const handleAddAddress = () => {
    setLocalAddresses((prev) => {
      const newIndex = prev.length;
      const next: CustomerAddress[] = [
        ...prev,
        {
          id: 0 as any,
          address: "",
          city: "",
          state: "",
          zip: "",
          locationId: null,
          isDefault: prev.length === 0, // if first ever, mark default
          // createdAt: new Date().toISOString(),
          // updatedAt: new Date().toISOString(),
        },
      ];

      setCollapsed((old) => {
        const map: Record<number, boolean> = {};
        next.forEach((_, i) => {
          if (i === 0 || i === newIndex) {
            // default row & newly added row open
            map[i] = false;
          } else {
            map[i] = old[i] ?? true;
          }
        });
        return map;
      });

      return next;
    });
  };

 /** Remove address */
const handleRemoveAddress = async (addr: CustomerAddress, idx: number) => {
  if (localAddresses.length === 1) return; // never remove the only one

  const next = localAddresses.filter((_, i) => i !== idx);
  setLocalAddresses(next);
  setCollapsed(ensureCollapsedMap(next));

  if (addr.id && addr.id !== 0) {
    try {
      await onDeleteAddress(addr.id);
      toast.success({
        title: "Address removed",
        description: "The address has been deleted.",
      });
    } catch (e) {
      console.error("Failed to delete address", e);
      toast.error({
        title: "Delete failed",
        description: "We couldn’t delete this address.",
      });
    }
  }
};


 /** Set default and move it to first row */
const handleSetDefault = async (addr: CustomerAddress, idx: number) => {
  setLocalAddresses((prev) => {
    const updated = prev.map((a, i) => ({
      ...a,
      isDefault: i === idx,
    }));

    const chosen = updated[idx];
    const others = updated.filter((_, i) => i !== idx);
    const reordered = [chosen, ...others];
    setCollapsed(ensureCollapsedMap(reordered)); // default open, others closed
    return reordered;
  });

  if (!addr.id || addr.id === 0) return;
  try {
    await onSetDefaultAddress(addr.id);
    toast.success({
      title: "Default address updated",
      description: "This address is now the default.",
    });
  } catch (e) {
    console.error("Failed to set default address", e);
    toast.error({
      title: "Update failed",
      description: "We couldn’t set this address as default.",
    });
  }
};

  return (
    <div className="space-y-6 p-4">
      {/* ---------- Customer basic info ---------- */}
      <div className="mb-3 flex items-center gap-2 sm:mb-4 sm:gap-3">
        <h3 className="text-base font-semibold text-gray-900 sm:text-lg">
          Customer Information
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label className="mb-1 block text-xs sm:mb-2 sm:text-sm">First Name</Label>
          <TextInput
            value={form.firstName}
            onChange={(e) => onChange("firstName", e.target.value)}
            placeholder="First Name"
            error={!!errors.firstName}
          />
          {errors.firstName && (
            <HelperText color="failure">{errors.firstName}</HelperText>
          )}
        </div>

        <div>
          <Label className="mb-1 block text-xs sm:mb-2 sm:text-sm">Last Name</Label>
          <TextInput
            value={form.lastName}
            onChange={(e) => onChange("lastName", e.target.value)}
            placeholder="Last Name"
            error={!!errors.lastName}
          />
          {errors.lastName && (
            <HelperText color="failure">{errors.lastName}</HelperText>
          )}
        </div>

        <div>
          <Label className="mb-1 block text-xs sm:mb-2 sm:text-sm">Email</Label>
          <TextInput
            type="email"
            value={form.email}
            onChange={(e) => onChange("email", e.target.value)}
            placeholder="name@email.com"
            error={!!errors.email}
          />
          {errors.email && (
            <HelperText color="failure">{errors.email}</HelperText>
          )}
        </div>

        <div>
          <Label className="mb-1 block text-xs sm:mb-2 sm:text-sm">Phone</Label>
          <PhoneInput
            value={form.phone}
            onChange={(formatted) => onChange("phone", formatted)}
            error={!!errors.phone}
            placeholder="(800) 555-1212"
          />
          {errors.phone && (
            <HelperText color="failure">{errors.phone}</HelperText>
          )}
        </div>

        <div className="sm:col-span-2">
          <Label className="mb-1 block text-xs sm:mb-2 sm:text-sm">
            Company (optional)
          </Label>
          <TextInput
            value={form.companyName ?? ""}
            onChange={(e) => onChange("companyName", e.target.value)}
            placeholder="Company"
          />
        </div>
      </div>

      {/* ---------- Address header ---------- */}
      <div className="mb-1 flex flex-row items-center justify-between gap-2 sm:mb-2 sm:gap-3">
        <h3 className="text-base font-semibold text-gray-900 sm:text-lg">
          Address
        </h3>
        <Button color="blue" type="button" onClick={handleAddAddress} className="cursor-pointer">
          Add Address
        </Button>
      </div>

      {/* ---------- Address cards ---------- */}
      <div className="space-y-3">
        {localAddresses.map((addr, idx) => {
          const locationName =
            addr.locationId &&
            locations.find((l) => Number(l.id) === Number(addr.locationId))?.name;

          const parts = [addr.address, addr.city, addr.state, addr.zip]
            .map((v) => (v || "").trim())
            .filter(Boolean);

          const hasAddress = parts.length > 0;
          const summary = hasAddress ? parts.join(", ") : "No address set";

          const isDefault =
            !!addr.isDefault || (!localAddresses.some((a) => a.isDefault) && idx === 0);
          const isCollapsed = collapsed[idx] ?? (idx !== 0); // default row open if unset

          return (
           <div
  key={addr.id ? `id-${addr.id}` : `temp-${idx}`}
  className="rounded-lg border border-gray-200 bg-white overflow-hidden"
>

              {/* Summary row */}
              <div className="flex items-center justify-between px-4 py-3">
                <button
                  type="button"
                  className="flex flex-1 items-center justify-between text-left cursor-pointer"
                  onClick={() => toggleCollapsed(idx)}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-sm ${ hasAddress ? "text-gray-900" : "text-gray-400" }`}>{summary}</span>
                    {isDefault && summary !== "No address set" && (
                      <span className="inline-flex items-center rounded-sm bg-emerald-500 px-3 py-0.5 text-[11px] font-medium text-white">
                        Default Address
                      </span>
                    )}

                    {addr.locationId && locationName && (
                      <span
                        className="inline-flex items-center rounded-sm font-medium text-[11px] px-3 py-0.5"
                        style={{ backgroundColor: "#bad5fb", color: "#000" }}
                      >
                        {locationName}
                      </span>
                    )}
                  </div>

                  <span className="ml-3 text-gray-400">
                    {isCollapsed ? (
                      <HiChevronDown className="h-4 w-4" />
                    ) : (
                      <HiChevronUp className="h-4 w-4" />
                    )}
                  </span>
                </button>

                {localAddresses.length > 1 && !isDefault && (
                  <button
                    type="button"
                    onClick={() => handleRemoveAddress(addr, idx)}
                    className="ml-3 text-xs text-gray-400 hover:text-red-500 cursor-pointer"
                    title="Remove address"
                  >
                    <svg className="w-3 h-3 text-gray-400 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                      <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18 17.94 6M18 18 6.06 6"/>
                    </svg>

                  </button>
                )}
              </div>

              {/* Expanded body */}
              {!isCollapsed && (
                <div className="border-t border-gray-200 px-4 py-4">
                  <div className="grid grid-cols-1 gap-3 sm:gap-4">
                    <div>
                      <Label className="mb-1 block text-xs sm:mb-2 sm:text-sm">
                        Address
                      </Label>
                      <TextInput
                        value={addr.address ?? ""}
                        onChange={(e) =>
                          updateLocalAddress(idx, { address: e.target.value })
                        }
                        onBlur={() => persistAddress(idx)}
                        placeholder="Enter Address"
                      />
                    </div>

                    <div className="grid min-w-0 grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
                      <div className="min-w-0">
                        <Label className="mb-1 block text-xs sm:mb-2 sm:text-sm">
                          City
                        </Label>
                        <TextInput
                          value={addr.city ?? ""}
                          onChange={(e) =>
                            updateLocalAddress(idx, { city: e.target.value })
                          }
                          onBlur={() => persistAddress(idx)}
                          placeholder="Enter City"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4">
                          <div className="col-span-1 min-w-0">
                            <Label className="mb-1 block text-xs sm:mb-2 sm:text-sm">
                              State
                            </Label>
                                <div onBlur={() => persistAddress(idx)} className="w-full">
                              <USStateSelect
                                value={addr.state ?? ""}
                                onChange={(abbr) =>
                                  updateLocalAddress(idx, { state: abbr })
                                }
                                className="w-full cursor-pointer"
                              />
                            </div>

                          </div>
                          <div className="col-span-2 min-w-0 sm:col-span-3">
                            <Label className="mb-1 block text-xs sm:mb-2 sm:text-sm">
                              Zip Code
                            </Label>
                            <ZipCodeInput
                              value={addr.zip ?? ""}
                              onChange={(zip) => {
                                const locId = autoLocationIdForZip(zip);
                                updateLocalAddress(idx, {
                                  zip,
                                  locationId: locId ?? addr.locationId ?? null,
                                });
                              }}
                              onBlur={() => persistAddress(idx)}
                              className="w-full"
                              placeholder="Enter Zip Code"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Location picker + Set default */}
                    <div>
                      <Label className="mb-1 block text-xs sm:mb-2 sm:text-sm">
                        Location
                      </Label>
                      <Dropdown
                        label={
                          addr.locationId && locationName ? (
                            <span
                              className="inline-flex items-center rounded-sm font-medium text-[11px] px-3 py-1 cursor-pointer"
                              style={{ backgroundColor: "#bad5fb", color: "#000" }}
                            >
                              {locationName}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-500">
                              Select location
                            </span>
                          )
                        }
                        dismissOnClick
                        size="sm"
                        placement="bottom-start"
                        theme={{
                          floating: {
                            target:
                              "w-full justify-between bg-white text-gray-800 border border-gray-300 focus:ring-2 focus:ring-blue-400 hover:bg-gray-50 cursor-pointer",
                            base: "z-20 rounded-md shadow-md",
                            content:
                              "bg-white rounded-md shadow-md border border-gray-200",
                          },
                        }}
                      >
                        <div className="max-h-60 overflow-y-auto py-1">
                          {(locations ?? []).map((loc) => (
                            <button
                              key={String(loc.id)}
                              type="button"
                              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                              onClick={() => {
                                handleLocationChange(addr, idx, loc);
                              }}
                            >
                              {loc.name}
                            </button>


                          ))}
                        </div>
                      </Dropdown>

                      <div className="mt-3 flex items-center gap-2">
                        <input
                          id={`default-address-${addr.id ?? idx}`}
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 cursor-pointer text-green-600 focus:ring-green-500"
                          checked={isDefault}
                          onChange={() => handleSetDefault(addr, idx)}
                        />
                        <Label
                          htmlFor={`default-address-${addr.id ?? idx}`}
                          className="text-xs sm:text-sm text-gray-600"
                        >
                          Set as Default Address
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}



/* ========== Archive Customer Modal (headless, sample style) ========== */
function ArchiveCustomerModal({
  open,
  name,
  onClose,
  onConfirm,
}: {
  open: boolean;
  name: string;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
}) {
  const panelRef = React.useRef<HTMLDivElement | null>(null);
  const [checked, setChecked] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setChecked(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const onDoc = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDoc);
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDoc);
      document.documentElement.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Archive Customer"
        className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl ring-1 ring-black/10"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">
            Are you sure you want to archive {name}?
          </h3>
          <button
            onClick={onClose}
            className="rounded-md p-2 hover:bg-gray-100 text-gray-500 cursor-pointer"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4 text-sm text-gray-700">
          <p>
            All of their data will still be preserved, except the customer will no
            longer be able to create new bookings or log in to their account.
          </p>
          <p>You can undo this later by restoring the customer.</p>
          <label className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <span>
              I have read the information above and would like to archive this
              customer.
            </span>
          </label>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="rounded-lg cursor-pointer px-4 py-2 text-sm border border-gray-300 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            disabled={!checked}
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 cursor-pointer text-sm text-white ${
              checked ? "bg-red-600 hover:bg-red-700" : "bg-red-300 cursor-not-allowed"
            }`}
          >
            Archive Customer
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ========== Delete Customer Modal (permanent) ========== */
function DeleteCustomerModal({
  open,
  name,
  onClose,
  onConfirm,
}: {
  open: boolean;
  name: string;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
}) {
  const panelRef = React.useRef<HTMLDivElement | null>(null);
  const [checked, setChecked] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setChecked(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const onDoc = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDoc);
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDoc);
      document.documentElement.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Delete Customer"
        className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl ring-1 ring-black/10"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-red-700">
            Permanently delete {name}?
          </h3>
          <button
            onClick={onClose}
            className="rounded-md p-2 hover:bg-gray-100 text-gray-500 cursor-pointer"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 text-sm text-gray-700">
          <p>This action cannot be undone.</p>
          <p>
            All customer data (profile, notes, payment methods) will be deleted.
          </p>
          <label className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <span>I understand and want to permanently delete this customer.</span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="rounded-lg cursor-pointer px-4 py-2 text-sm border border-gray-300 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            disabled={!checked}
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 cursor-pointer text-sm text-white ${
              checked ? "bg-red-600 hover:bg-red-700" : "bg-red-300 cursor-not-allowed"
            }`}
          >
            Delete Customer
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}


/* ================== Files stub ================== */
function FilesStub() {
  return (
    <Card>
      <p className="text-sm text-gray-600">Files for the customer will appear here.</p>
    </Card>
  );
}

/* ================== MAIN ================== */
export default function EditFormCustomer({ customer, onCancel }: Props) {
  // top of file
const {
  updateCustomer,
  deleteCustomer,
  archiveCustomer,
  restoreCustomer,
  setCustomerBlock,
  getCustomerHistory,
  getCustomerById,
} = (useCustomers?.({ skipInitialFetch: true }) as any) ?? {};

  const toast = useToast();

  const [activeTab, setActiveTab] = React.useState<Tab>("info");
  const [form, setForm] = React.useState<CustomerEditForm>(() => toCustomerEditForm(customer));
  const [errors, setErrors] = React.useState<Partial<Record<keyof CustomerEditForm, string>>>({});

const { locations } = useLocations();



const {
  addresses,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} = useCustomerAddresses();

// Pick the best address to use when creating a new booking
const defaultAddressForBooking = React.useMemo(() => {
  // 1) Prefer the multi-address list coming from the Info tab (localAddresses copy)
  if (form.addresses && form.addresses.length > 0) {
    const def = form.addresses.find((a) => a.isDefault) ?? form.addresses[0];
    return {
      address: def.address ?? "",
      city: def.city ?? "",
      state: def.state ?? "",
      zip: def.zip ?? "",
      locationId: def.locationId ?? undefined, // <- number | undefined (no null)
    };
  }

  // 2) Fallback: hook's addresses (server copy)
  if (addresses && addresses.length > 0) {
    const def = addresses.find((a) => a.isDefault) ?? addresses[0];
    return {
      address: def.address ?? "",
      city: def.city ?? "",
      state: def.state ?? "",
      zip: def.zip ?? "",
      locationId: def.locationId ?? undefined,
    };
  }

  // 3) Fallback: legacy single-address fields on the form
  return {
    address: form.address ?? "",
    city: form.city ?? "",
    state: form.state ?? "",
    zip: form.zip ?? "",
    locationId: form.locationId ?? undefined,
  };
}, [
  // multi-address from Info tab (synced via InfoDetails useEffect)
  form.addresses,
  // legacy single fields
  form.address,
  form.city,
  form.state,
  form.zip,
  form.locationId,
  // server copy, as a backup
  addresses,
]);


// All locations for this customer's addresses (for header chips)
const locationChips = React.useMemo(() => {
  if (!addresses || !addresses.length || !locations || !locations.length) return [];

  const byLocationId: Record<number, { name: string; hasDefault: boolean }> = {};

  for (const addr of addresses) {
    if (!addr.locationId) continue;

    const idNum = Number(addr.locationId);
    const loc = locations.find((l: any) => Number(l.id) === idNum);
    if (!loc) continue;

    const existing = byLocationId[idNum];
    const isDefault = !!addr.isDefault;

    if (!existing) {
      byLocationId[idNum] = { name: loc.name, hasDefault: isDefault };
    } else if (isDefault && !existing.hasDefault) {
      byLocationId[idNum] = { name: loc.name, hasDefault: true };
    }
  }

  return Object.entries(byLocationId).map(([id, info]) => ({
    id: Number(id),
    name: info.name,
    hasDefault: info.hasDefault,
  }));
}, [addresses, locations]);


// Load addresses for this customer on mount
React.useEffect(() => {
  getAddresses(customer.id).catch(() => {
    // you can log or show toast if needed
  });
}, [customer.id, getAddresses]);

// Keep legacy single-address fields in sync with the DEFAULT address
React.useEffect(() => {
  if (!addresses || !addresses.length) return;

  const def = addresses.find((a) => a.isDefault) ?? addresses[0];

  setForm((f) => ({
    ...f,
    address: def.address ?? "",
    city: def.city ?? "",
    state: def.state ?? "",
    zip: def.zip ?? "",
    locationId: def.locationId ?? null,
    isDefaultAddress: true as any,
    // optional: keep a copy on the form for other UI pieces if you need
    addresses: (addresses as any),
  }));
}, [addresses]);



// const locationName = React.useMemo(() => {
//   if (!form.locationId) return "";
//   const match = locations.find(
//     (l: any) => Number(l.id) === Number(form.locationId)
//   );
//   return match ? match.name : `Location #${form.locationId}`;
// }, [form.locationId, locations]);


// React.useEffect(() => {
//   const zip = form.zip?.trim();
//   if (!zip || zip.length !== 5) {
//     setForm((f) => ({ ...f, locationId: null }));
//     return;
//   }

//   let match: number | null = null;

//   for (const loc of locations) {
//     if (loc.postal_codes?.includes(zip)) {
//       match = loc.id;
//       break;
//     }
//   }

//   setForm((f) => ({ ...f, locationId: match }));
// }, [form.zip, locations]);

// React.useEffect(() => {
//   if (!form.zip || form.locationId != null) return;

//   const zip = form.zip.trim();
//   if (zip.length !== 5) return;

//   let match: number | null = null;
//   for (const loc of locations) {
//     if (loc.postal_codes?.includes(zip)) {
//       match = loc.id;
//       break;
//     }
//   }

//   if (match !== form.locationId) {
//     setForm((f) => ({ ...f, locationId: match }));
//   }
// }, [locations]);


// Start with the customer passed via props (from list view)
const [detailCustomer, setDetailCustomer] = React.useState<Customer>(customer);

// On mount / when customer id changes, fetch the full customer (with bookings)
React.useEffect(() => {
  if (typeof getCustomerById !== "function") return;

  let isMounted = true;

  (async () => {
    try {
      const full = await getCustomerById(customer.id);
      if (!isMounted || !full) return;
      setDetailCustomer(full); // full includes bookings from /customers/:id
    } catch (e) {
      console.error("Failed to load full customer with bookings", e);
      // keep the base customer if it fails
    }
  })();

  return () => {
    isMounted = false;
  };
}, [customer.id, getCustomerById]);



// Unique frequency chips (from customer's bookings)
const frequencyChips = React.useMemo(() => {
  const bookings = ((detailCustomer as any)?.bookings ?? []) as any[];

  const seen: Record<string, boolean> = {};
  const out: string[] = [];

  for (const b of bookings) {
    const freq = b?.service?.frequency;
    const name =
      (freq as any)?.name ||
      (freq as any)?.frequencyLabel ||
      (freq as any)?.label;

    if (!name) continue;
    if (seen[name]) continue;

    seen[name] = true;
    out.push(name);
  }

  return out;
}, [detailCustomer]);


  // open/close for your provided modals
const [sendOpen, setSendOpen] = React.useState(false);
const [historyOpen, setHistoryOpen] = React.useState(false);

// archive/delete flow
const [archiveOpen, setArchiveOpen] = React.useState(false);
const [deleteOpen, setDeleteOpen] = React.useState(false);


  const navigate = useNavigate();
  const pathPrefix = window.location.pathname.split("/")[1];

const goToNewBooking = () => {
  const addr = defaultAddressForBooking;

  const seed = {
    status: "draft",
    customer: {
      id: Number(customer.id),
      firstName: customer.firstName ?? "",
      lastName: customer.lastName ?? "",
      email: customer.email ?? "",
      phone: customer.phone ?? "",
      companyName: (customer as any).companyName ?? "",
      blocked: customer.blocked ?? false,
    },
    address: {
      address: addr.address ?? "",
      city: addr.city ?? "",
      state: addr.state ?? "",
      zip: addr.zip ?? "",
      locationId: addr.locationId,
    },
  } satisfies Partial<BookingFormState>;

  navigate(`/${pathPrefix}/bookings/new`, {
    state: { prefillBooking: seed },
  });
};


  // ---- “confirmed” is auto (login flips it). Keep in payload but hide the toggle.
  const isConfirmed = React.useMemo(
    () => toBoolConfirmed((customer?.confirmed ?? form.confirmed) as Confirmed),
    [customer?.confirmed, form.confirmed]
  );

  const handleChange = <K extends keyof CustomerEditForm>(k: K, v: CustomerEditForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  /* ---------- validate Info tab ---------- */
  const validate = () => {
  const next: typeof errors = {};
  if (!required(form.firstName)) next.firstName = "First name is required";
  if (!required(form.lastName)) next.lastName = "Last name is required";
  if (!required(form.email)) next.email = "Email is required";
  else if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = "Enter a valid email";

  // Phone required (unchanged)
  if (!required(form.phone)) next.phone = "Phone is required";
  else if (onlyDigits(form.phone).length !== 10)
    next.phone = "Enter a 10-digit US phone";

  // ✅ Address fields are OPTIONAL now
  // Zip: only validate if provided (optional)
  const zipDigits = onlyDigits(form.zip);
  if (form.zip && zipDigits.length !== 5)
    next.zip = "Enter a 5-digit Zip Code";

  setErrors(next);
  return Object.keys(next).length === 0;
};

const onSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!validate()) {
    setActiveTab("info");
    return;
  }

  try {
    const payload = {
      email: form.email,
      firstName: form.firstName,
      lastName: form.lastName,
      companyName: form.companyName,
      address: form.address,
      city: form.city,
      state: form.state,
      zip: form.zip,
      phone: form.phone,
      status: form.status,
      confirmed: toConfirmedValue(isConfirmed), // hidden control
      billing: form.billing ?? undefined,
      locationId: form.locationId ?? null,

      // NEW fields
      avatarUrl: form.avatarUrl ?? undefined,
      blocked: !!form.blocked,
      blockedReason: form.blocked ? (form.blockedReason || "") : null,
    };

    // 1) Save core customer
    if (typeof updateCustomer === "function") {
      await updateCustomer(customer.id, payload);
    } else {
      console.warn(
        "updateCustomer() not available; implement useCustomers.updateCustomer to enable saving."
      );
    }

    // 2) Save details (tags, teams, special tax)
    try {
      const detailsPayload: CustomerDetailsPayload & {
        special_sales_tax_enabled?: boolean;
        special_sales_tax?: number | null;
      } = {
        tags: normalizeTagsForSave(detailsForm.tags),
        preferred_teams: detailsForm.preferred_teams ?? [],
        do_not_serve_teams: detailsForm.do_not_serve_teams ?? [],
        special_sales_tax_enabled: !!detailsForm.specialSalesTaxEnabled,
        special_sales_tax: detailsForm.specialSalesTaxEnabled
          ? detailsForm.specialSalesTaxPercent ?? null
          : null,
      };

      await saveDetails(customer.id, detailsPayload);
    } catch (err) {
      console.error("Failed to save customer details", err);
      toast.error({
        title: "Details not saved",
        description: "Customer core info saved, but details failed.",
      });
    }

    // ✅ Stay on this page, just show toast
    toast.success({
      title: "Customer updated",
      description: "All changes have been saved.",
    });

    // ❌ Do NOT call onSaved() anymore so we don't close / navigate
    // onSaved?.();
  } catch (err) {
    console.error("Failed to save customer", err);
    toast.error({
      title: "Save failed",
      description: "We couldn’t save the customer. Please try again.",
    });
  }
};


  /* ==========================================================
     BACKEND WIRING (Details / Notes / Notifications / Payments)
     ========================================================== */
  const companyId =
    (customer as any).companyId ??
    (customer as any).company_id ??
    undefined;

  const {
    // Details
    getDetails,
    saveDetails,
    // Notes
    listNotes,
    addNote,
    deleteNote,
    // Notifications
    getNotifications,
    saveNotifications,
    // Payments
    addPaymentMethod,
  } = useCustomerExtras(companyId);

  // If your hook doesn’t expose updateNote yet, use the API directly:
  const api = usePrivateService();
  const updateNote = React.useCallback(
    async (customerId: number, noteId: number | string, body: string) => {
      await api.put(`/customers/${customerId}/notes/${noteId}`, { body });
      return { ok: true };
    },
    [api],
  );

  // Normalize tags into string[] of tag names for the API
const normalizeTagsForSave = (raw: any): string[] => {
  if (!raw) return [];
  if (!Array.isArray(raw)) return [];

  const out: string[] = [];

  for (const item of raw) {
    if (item == null) continue;

    if (typeof item === "string") {
      const name = item.trim();
      if (name) out.push(name);
      continue;
    }

    if (typeof item === "number") {
      // if somehow ids leaked here, we can't know the name on this layer
      // so we just stringify as a fallback
      out.push(String(item));
      continue;
    }

    if (typeof item === "object") {
      const name =
        (item as any).tag_name ??
        (item as any).name ??
        (item as any).label ??
        "";

      if (typeof name === "string" && name.trim()) {
        out.push(name.trim());
      }
    }
  }

  // de-dupe
  return Array.from(new Set(out));
};


  /* ---------- Details tab state ---------- */
const [detailsForm, setDetailsForm] = React.useState<
  CustomerDetailsPayload & {
    specialSalesTaxEnabled?: boolean;
    specialSalesTaxPercent?: number | null;
  }
>({
  tags: [],
  preferred_teams: [],
  do_not_serve_teams: [],
  specialSalesTaxEnabled: (customer as any).specialSalesTaxEnabled ?? false,
  specialSalesTaxPercent:
    (customer as any).specialSalesTaxPercent ??
    (customer as any).special_sales_tax ??
    null,
});

const [, setDetailsLoaded] = React.useState(false);

React.useEffect(() => {
  (async () => {
    try {
      if (!getDetails) return; // safety
      const d = await getDetails(customer.id);
      if (!d) return;

      setDetailsForm((prev) => ({
        ...prev,
        ...d, // ⬅️ bring in tags, preferred_teams, do_not_serve_teams from backend
        // sane fallbacks if server didn’t return them:
        specialSalesTaxEnabled:
          (d as any).specialSalesTaxEnabled ??
          (d as any).special_sales_tax_enabled ??
          prev.specialSalesTaxEnabled ??
          false,
        specialSalesTaxPercent:
          (d as any).specialSalesTaxPercent ??
          (d as any).special_sales_tax ??
          prev.specialSalesTaxPercent ??
          null,
      }));
    } finally {
      setDetailsLoaded(true);
    }
  })();
}, [customer.id, getDetails]);

  /* ---------- Email (notifications) tab ---------- */
  const [notif, setNotif] = React.useState<CustomerNotificationPrefs | null>(null);
  React.useEffect(() => {
    (async () => {
      const n = await getNotifications(customer.id);
      setNotif(n);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer.id]);

  /* ---------- Credit card tab wiring ---------- */
  const onSaveCard = async (summary: {
    brand?: string;
    last4?: string;
    expMonth?: number;
    expYear?: number;
    tokenId?: string;
    isDefault?: boolean;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
  }) => {
    const payload: Omit<CustomerPaymentMethod, "id"> = {
      gateway: "stripe",
      token: summary.tokenId ?? "",
      brand: summary.brand,
      last4: summary.last4,
      expMonth: summary.expMonth,
      expYear: summary.expYear,
      isDefault: summary.isDefault,
    };
    await addPaymentMethod(customer.id, payload);
  };

  /* ---------- Notes tab (server mode) ---------- */
  const fetchNotes = async (customerId: number, page: number, pageSize: number) => {
    const all = await listNotes(customerId);
    const sorted = [...all].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    const total = sorted.length;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const items = sorted.slice(start, end).map((n) => ({
      id: String(n.id),
      text: n.body,
      createdAt: n.created_at,
      updatedAt: n.updated_at,
      author: n.authorId ? `#${n.authorId}` : undefined,
    }));
    return { items, total };
  };

  const createNote = async (customerId: number, text: string) => {
    const res = await addNote(customerId, text);
    return {
      id: String(res?.data?.id ?? crypto.randomUUID()),
      text,
      createdAt: new Date().toISOString(),
      author: "You",
    };
  };

  const editNote = async (_customerId: number, id: string, text: string) => {
    await updateNote(customer.id, id, text);
    return { id, text, createdAt: new Date().toISOString() };
  };

  const destroyNote = async (_customerId: number, id: string) => {
    await deleteNote(customer.id, Number(id));
  };

  /* ====================== Avatar (copy of TeamInfo style) ====================== */
  const avatarAnchorRef = React.useRef<HTMLDivElement | null>(null);
  const avatarPanelRef = React.useRef<HTMLDivElement | null>(null);
  const [avatarEditorOpen, setAvatarEditorOpen] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const openFilePicker = () => fileInputRef.current?.click();
  const readFileToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  const onSelectFile = async (f: File | null) => {
    if (!f || !f.type.startsWith("image/")) return;
    const dataUrl = await readFileToDataUrl(f);
    setForm((f0) => ({ ...f0, avatarUrl: dataUrl }));
  };
  const onDrop: React.DragEventHandler<HTMLDivElement> = async (e) => {
    e.preventDefault(); e.stopPropagation();
    await onSelectFile(e.dataTransfer.files?.[0] || null);
  };
  const onPaste: React.ClipboardEventHandler<HTMLDivElement> = async (e) => {
    const img = Array.from(e.clipboardData.files || []).find((f) => f.type.startsWith("image/"));
    if (img) await onSelectFile(img);
  };
  React.useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!avatarPanelRef.current || !avatarAnchorRef.current) return;
      const insidePanel = avatarPanelRef.current.contains(t);
      const insideAnchor = avatarAnchorRef.current.contains(t);
      if (!insidePanel && !insideAnchor) setAvatarEditorOpen(false);
    };
    if (avatarEditorOpen) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [avatarEditorOpen]);

  /* ====================== UI ====================== */
  const tabs: Array<{ id: Tab; label: string; icon: React.ComponentType<any> }> = [
    { id: "info", label: "Info", icon: HiUser },
    { id: "details", label: "Details", icon: HiClipboardList },
    { id: "notes", label: "Notes", icon: HiDocumentText },
    { id: "creditcard", label: "Credit Card", icon: HiCreditCard },
    { id: "bookings", label: "Bookings", icon: HiCalendar },
    { id: "email", label: "Email", icon: HiMail },
  ];


const [historyItems, setHistoryItems] = React.useState<any[]>([]);

React.useEffect(() => {
  (async () => {
    try {
      const items: CustomerHistoryRecord[] = await getCustomerHistory(customer.id);
      setHistoryItems(
        items.map((h: CustomerHistoryRecord) => ({
          id: h.id,
          at: new Date(h.at),
          actor: { name: h.actorDisplay || h.actorName || "System" },
          type: "profile",
          summary: `${h.action}${h.reason ? `: ${h.reason}` : ""}`,
          details: h.changes ? JSON.stringify(h.changes, null, 2) : "",
        }))
      );
    } catch {
      setHistoryItems([]);
    }
  })();
}, [customer.id, getCustomerHistory]);



  const [blockOpen, setBlockOpen] = React.useState(false);
const [isReasonOpen, setIsReasonOpen] = React.useState(false);
const reasonPopoverRef = React.useRef<HTMLDivElement | null>(null);

React.useEffect(() => {
  if (!isReasonOpen) return;

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") setIsReasonOpen(false);
  };
  const onClick = (e: MouseEvent) => {
    if (
      reasonPopoverRef.current &&
      !reasonPopoverRef.current.contains(e.target as Node)
    ) {
      setIsReasonOpen(false);
    }
  };

  document.addEventListener("keydown", onKey);
  document.addEventListener("mousedown", onClick);
  return () => {
    document.removeEventListener("keydown", onKey);
    document.removeEventListener("mousedown", onClick);
  };
}, [isReasonOpen]);

  return (
    <form className="space-y-4 sm:space-y-6" onSubmit={onSubmit} noValidate>
      {/* Breadcrumb */}
      <nav className="flex items-center text-gray-700" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <Link
              to="/admin/customers"
              className="inline-flex items-center text-xs font-medium text-gray-700 hover:text-blue-600 sm:text-sm"
            >
              Customers
            </Link>
          </li>
          <li aria-current="page">
            <div className="flex items-center">
              <svg className="mx-1 h-3 w-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="ml-1 text-xs font-medium text-gray-500 sm:text-sm md:ml-2">
                Edit Customer
              </span>
            </div>
          </li>
        </ol>
      </nav>

     {/* Header (with Avatar + Actions) */}
<div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
  {/* Left: avatar + name */}
  <div className="flex items-start gap-4">
    <div ref={avatarAnchorRef} className="relative">
      <button
        type="button"
        onClick={() => setAvatarEditorOpen((o) => !o)}
        className="relative group outline-none rounded-full focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 cursor-pointer"
        aria-label="Edit customer avatar"
      >
        <div
          className="
            flex items-center justify-center rounded-full text-white font-bold shadow ring-1 ring-black/5
            h-24 w-24 text-3xl
            sm:h-28 sm:w-28 sm:text-4xl
            lg:h-32 lg:w-32 lg:text-5xl
          "
          style={{
            backgroundColor: form.avatarUrl ? undefined : "#2563eb",
            backgroundImage: form.avatarUrl ? `url(${form.avatarUrl})` : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {!form.avatarUrl && initialsFromName(form.firstName, form.lastName)}
        </div>

        {/* edit “pencil” chip */}
        <span
          className="
            cursor-pointer absolute -top-1 right-1 inline-flex items-center justify-center rounded-full
            bg-gray-700 text-white shadow ring-2 ring-white opacity-0 group-hover:opacity-100
            h-6 w-6 text-xs sm:h-7 sm:w-7
          "
          aria-hidden="true"
        >
          ✎
        </span>
      </button>
    </div>

    

    <div className="min-w-0">
      <h1 className="truncate text-lg font-bold sm:text-2xl flex items-center gap-2">
        {form.firstName || form.lastName ? `${form.firstName} ${form.lastName}`.trim() : "Edit Customer"}
        {form.blocked && (
          <span className="inline-flex items-center gap-1 rounded-sm bg-[#ff0000] px-2.5 py-0.5 text-[11px] font-medium text-white">
             Blocked
          </span>
        )}
      </h1>

      <p className="text-xs text-gray-500 sm:text-sm">
  {isConfirmed ? "Confirmed" : "Unconfirmed"} • {form.email}
</p>

{locationChips.length > 0 && (
  <div className="mt-1 flex flex-wrap gap-1">
    {locationChips.map((loc) => (
      <span
        key={loc.id}
        className="inline-flex h-[18px] items-center justify-center rounded-sm bg-[#bad5fb]
                   px-2 text-[11px] font-medium leading-none text-black"
      >
        {loc.name}
      </span>
    ))}
  </div>
)}

{frequencyChips.length > 0 && (
  <div className="mt-1 flex flex-wrap gap-1">
    {frequencyChips.map((name) => (
      <span
        key={name}
        className="inline-flex h-[18px] items-center justify-center rounded-sm bg-[#bad5fb]
                   px-2 text-[11px] font-medium leading-none text-black"
      >
        {name}
      </span>
    ))}
  </div>
)}


{form.blocked && (
  <div className="relative mt-3 w-full max-w-md">
    {/* Collapsed bar */}
    <button
      type="button"
      onClick={() => setIsReasonOpen((v) => !v)}
      className="flex w-full items-center justify-between rounded-lg 
               bg-[#ff0000] px-4 py-2 text-xs sm:text-sm 
                 text-white shadow-sm cursor-pointer"
      aria-label={isReasonOpen ? "Hide blocked reason" : "Show blocked reason"}
    >
      <span className="font-semibold">Reason Blocked</span>
      <span className="ml-3 flex h-7 w-7 items-center justify-center rounded-md ">
        {isReasonOpen ? (
          <HiChevronUp className="h-4 w-4 text-white" />
        ) : (
          <HiChevronDown className="h-4 w-4 text-white" />
        )}
      </span>
    </button>

    {/* Expanded content – same width as header, only height grows */}
    {isReasonOpen && (
      <div
        ref={reasonPopoverRef}
        className="absolute left-0 right-0 z-30 mt-2 w-full rounded-lg 
                   bg-[#ff0000] p-4 text-xs sm:text-sm text-white shadow-2xl"
      >
        <p className="whitespace-pre-wrap break-words">
          {form.blockedReason || "No reason provided."}
        </p>
      </div>
    )}
  </div>
)}



    </div>
  </div>

  {/* Right: quick actions */}
  <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
    <Button color="light" className="cursor-pointer gap-2" onClick={() => setSendOpen(true)}>
      <HiMail className="h-5 w-5 text-gray-500" />
      Send Message
    </Button>
    <Button color="light" className="cursor-pointer gap-2" onClick={() => setHistoryOpen(true)}>
      <HiClock className="h-5 w-5 text-gray-500" />
      View History
    </Button>
    <Button color="blue" onClick={goToNewBooking} className="cursor-pointer">
      Add New Booking
    </Button>
  </div>
</div>

      {/* Small centered avatar editor panel */}
      {avatarEditorOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 pointer-events-none">
          <div
            ref={avatarPanelRef}
            className="pointer-events-auto w-full max-w-xs rounded-2xl border border-gray-300 bg-white p-4 shadow-2xl"
            role="dialog"
            aria-label="Update Customer Avatar"
            onDrop={onDrop}
            onDragOver={(e) => e.preventDefault()}
            onPaste={onPaste}
          >
            <div className="space-y-4 ">
              <div>
                <div className="mb-1 text-xs font-medium text-gray-700">Photo</div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={openFilePicker}
                    className="flex-1 rounded-lg border border-dashed border-green-400 bg-white px-3 py-3 text-center text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    Upload Customer Photo
                  </button>
                  {form.avatarUrl && (
                    <button
                      type="button"
                      onClick={() => handleChange("avatarUrl", null)}
                      className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                      title="Remove photo"
                    >
                      <HiTrash className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const f = e.target.files?.[0] || null;
                    await onSelectFile(f);
                    e.currentTarget.value = "";
                  }}
                />
              </div>
              <p className="text-xs text-gray-500">You can also drag & drop or paste an image here.</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="-mb-[2px]">
        <nav
          className="scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-300 flex overflow-x-auto"
          aria-label="Tabs"
        >
          <div className="flex min-w-max gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={[
                    "relative flex cursor-pointer items-center rounded-t-lg px-2 py-2 text-sm font-medium transition-all sm:px-4 sm:py-3",
                    isActive
                      ? "z-10 border border-gray-300 border-b-gray-50 bg-gray-50 text-blue-600"
                      : "border border-transparent text-gray-500 hover:text-gray-700",
                  ].join(" ")}
                  aria-label={tab.label}
                  title={tab.label}
                >
                  <Icon className="h-6 w-6 sm:hidden" />
                  <span className="hidden sm:ml-0 sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Tab content */}
      <div
        className={[
          "border border-gray-300 bg-gray-50 p-4 shadow-sm sm:p-6",
          "rounded-br-lg rounded-bl-lg",
          activeTab === "info" ? "rounded-tr-lg" : "rounded-tl-lg rounded-tr-lg",
        ].join(" ")}
      >
        {activeTab === "info" && (
  <InfoDetails
    form={form}
    errors={errors}
    onChange={handleChange}
    addresses={addresses}
    onAddAddress={(data) => addAddress(customer.id, data)}
    onUpdateAddress={(id, patch) => updateAddress(customer.id, id, patch)}
    onDeleteAddress={(id) => deleteAddress(customer.id, id)}
    onSetDefaultAddress={(id) => setDefaultAddress(customer.id, id)}
  />
)}



        {activeTab === "details" && (
        <CustomerPreferencesDetails
          form={{
            tags: detailsForm.tags as any,
            preferredTeamIds: detailsForm.preferred_teams,
            avoidTeamIds: detailsForm.do_not_serve_teams,
            specialSalesTaxEnabled: detailsForm.specialSalesTaxEnabled,
            specialSalesTaxPercent: detailsForm.specialSalesTaxPercent,
          }}
          onChange={(k, v) => {
            if (k === "tags") setDetailsForm((f) => ({ ...f, tags: v as any }));
            if (k === "preferredTeamIds")
              setDetailsForm((f) => ({ ...f, preferred_teams: (v as number[]) ?? [] }));
            if (k === "avoidTeamIds")
              setDetailsForm((f) => ({ ...f, do_not_serve_teams: (v as number[]) ?? [] }));
            if (k === "specialSalesTaxEnabled")
              setDetailsForm((f) => ({ ...f, specialSalesTaxEnabled: !!v }));
            if (k === "specialSalesTaxPercent")
              setDetailsForm((f) => ({
                ...f,
                specialSalesTaxPercent:
                  (v as any) === "" || v == null ? null : Number(v as any),
              }));
          }}
        />
      )}


        {activeTab === "creditcard" && (
          <CreditCardTab initial={form.billing ?? null} onSave={onSaveCard} />
        )}

{activeTab === "bookings" && (
  <CustomerBookings
    customerId={customer.id}
    customerName={`${customer.firstName ?? ""} ${customer.lastName ?? ""}`.trim()}
    initialBookings={((detailCustomer as any)?.bookings ?? [])}
  />
)}



        {activeTab === "notes" && (
          <CustomerNotes
            customerId={customer.id}
            onFetchNotes={fetchNotes}
            onCreateNote={createNote}
            onUpdateNote={editNote}
            onDeleteNote={destroyNote}
            pageSize={10}
          />
        )}

        {activeTab === "files" && <FilesStub />}

        {activeTab === "email" && notif && (
          <NotificationPreferences
            initial={{
              bookingConfirmationEmail: notif.booking_email,
              bookingConfirmationSms: notif.booking_sms,
              remindersEmail: notif.reminder_email,
              remindersSms: notif.reminder_sms,
              bookingChangesEmail: notif.changes_email,
              receiptEmail: notif.receipt_email,
              marketingEmailOptIn: false,
              marketingSmsOptIn: false,
            }}
            onSave={async (v) => {
              const payload: CustomerNotificationPrefs = {
                booking_email: v.bookingConfirmationEmail,
                booking_sms: v.bookingConfirmationSms,
                reminder_email: v.remindersEmail,
                reminder_sms: v.remindersSms,
                changes_email: v.bookingChangesEmail,
                receipt_email: v.receiptEmail,
              };
              const saved = await saveNotifications(customer.id, payload);
              return {
                bookingConfirmationEmail: saved.booking_email,
                bookingConfirmationSms: saved.booking_sms,
                remindersEmail: saved.reminder_email,
                remindersSms: saved.reminder_sms,
                bookingChangesEmail: saved.changes_email,
                receiptEmail: saved.receipt_email,
                marketingEmailOptIn: false,
                marketingSmsOptIn: false,
              };
            }}
          />
        )}
      </div>

      {/* Actions */}
     {/* Actions */}
<div className="flex flex-col justify-between gap-2 pt-1 sm:flex-row sm:pt-2">
  {/* Left side: Block + Archive/Restore/Delete */}
  <div className="flex flex-col gap-2 sm:flex-row sm:justify-start">
    <Button
      type="button"
      onClick={() => setBlockOpen(true)}
      className={`w-full sm:w-auto cursor-pointer ${
        form.blocked
          ? "bg-[#ff0000] hover:bg-[#ff3232]"
          : "bg-gray-800 hover:bg-gray-900"
      }`}
    >
      {form.blocked ? "Unblock Customer" : "Block Customer"}
    </Button>

    {form.status !== "archived" ? (
      <Button
        type="button"
        onClick={() => setArchiveOpen(true)}
        className="w-full sm:w-auto cursor-pointer bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-300"
      >
        Archive
      </Button>
    ) : (
      <>
        <Button
          type="button"
          onClick={async () => {
            await restoreCustomer(customer.id);
            setForm((f) => ({ ...f, status: "active" as const }));
          }}
          className="w-full sm:w-auto cursor-pointer bg-green-600 text-white hover:bg-green-700"
        >
          Restore
        </Button>
        <Button
          type="button"
          onClick={() => setDeleteOpen(true)}
          className="w-full sm:w-auto cursor-pointer bg-red-600 px-8 text-white hover:bg-red-700"
        >
          Delete
        </Button>
      </>
    )}
  </div>

  {/* Right side: Cancel + Save */}
  <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
    <Button
      type="button"
      color="light"
      onClick={onCancel}
      className="w-full sm:w-auto cursor-pointer px-8"
    >
      Cancel
    </Button>
    <Button
      type="submit"
      color="blue"
      className="w-full sm:w-auto cursor-pointer px-10"
    >
      Save
    </Button>
  </div>
</div>

   
      <BlockCustomerDialog
  open={blockOpen}
  name={`${form.firstName} ${form.lastName}`.trim() || "Customer"}
  initial={!!form.blocked}
  initialReason={form.blockedReason ?? ""}
  onClose={() => setBlockOpen(false)}
  onSave={async (blocked, reason) => {
    setForm((f0) => ({ ...f0, blocked, blockedReason: reason || null }));
    await setCustomerBlock(customer.id, blocked, reason || null); // ← NEW
  }}
/>


      {/* Send Email (your sample modal) */}
<SendMessageModal
  open={sendOpen}
  onClose={() => setSendOpen(false)}
  teamName={`${form.firstName} ${form.lastName}`.trim() || "Customer"}
  defaultRecipients={
    form.email ? [{ name: `${form.firstName} ${form.lastName}`.trim(), email: form.email }] : []
  }
  onSend={async ({ recipients, subject, message }) => {
    // TODO: call your backend email endpoint
    console.log("send email", { customerId: customer.id, recipients, subject, message });
  }}
/>

{/* View History (your sample modal) */}
<TeamHistoryModal
  open={historyOpen}
  onClose={() => setHistoryOpen(false)}
  items={historyItems}
/>


{/* Archive confirm */}
<ArchiveCustomerModal
  open={archiveOpen}
  name={`${form.firstName} ${form.lastName}`.trim() || "Customer"}
  onClose={() => setArchiveOpen(false)}
  onConfirm={async () => {
    setArchiveOpen(false);
    await archiveCustomer(customer.id);    // ← NEW
    setForm((f) => ({ ...f, status: "archived" as const }));
  }}
/>

{/* Delete confirm (only show after archived) */}
<DeleteCustomerModal
  open={deleteOpen}
  name={`${form.firstName} ${form.lastName}`.trim() || "Customer"}
  onClose={() => setDeleteOpen(false)}
  onConfirm={async () => {
    setDeleteOpen(false);
    if (typeof deleteCustomer === "function") {
      await deleteCustomer(customer.id);
    }
  }}
/>

    </form>
  );
}
