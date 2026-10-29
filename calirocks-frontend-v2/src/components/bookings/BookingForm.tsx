import * as React from "react";
import { Button, Label, HelperText, Checkbox, Alert } from "flowbite-react";
import { HiExclamationCircle, HiChevronDown, HiLink, HiClock, HiCollection } from "react-icons/hi";
import EmailQuoteModal from "../quotes/EmailQuoteModal";
import { Link } from "react-router-dom";
import { useToast } from "../ui/Toast";
import CollapsibleCard from "./reusableCollapsibleCard";
import DatePicker from "../ui/DatePicker";
import TimePicker from "../ui/TimePicker";
import { useLocations } from "../../hooks/Locations/useLocations";
import { useAddons } from "../../hooks/useAddons";
import { useVariables } from "../../hooks/Variables/useVariables";
import { useProviders } from "../../hooks/Providers/useProviders";
import { useFrequencies } from "../../hooks/useFrequencies";
import { useServices } from "../../hooks/useServices";
import { useCategories } from "../../hooks/Categories/useCategories";
import TypeOfServiceSection, { type TypeOfServiceModel, type CategoryInput } from "./TypesofServiceSection";
import MultiSelectDropdown from "../ui/MultiSelectDropdown";
import { useQuotes } from "../../hooks/Quotes/useQuotes";
import type { BookingFormState } from "../../types/bookings";
import CheckboxDropdown, { type CDItem } from "../ui/DropDownButton";
import type { Category } from "../../types/categories";
import type { Service } from "../../types/service";
import type { Frequency } from "../../types/service";
import { useCustomers } from "../../hooks/Customers/useCustomers";
import { useBookings } from "../../hooks/Bookings/useBookings";
import type { Customer } from "../../types/customers";
import { useLocation } from "react-router-dom";
import { useNavigate} from "react-router-dom";
import SmoothReveal from "./SmoothReveal";
import MoneyInput from "./MoneyInput";
import CustomerSuggestPanel from "./CustomerSuggestPanel";
import { currencyToNumber, formatCurrency, toNum, sanitizeMoney } from "./Money";
import {TextInput,PhoneInput,ZipCodeInput,USStateSelect,inputClass,} from "../../components/ui/InputsBundle";
import { CustErrors, OtherErrors, AddonOption, CustField, TeamOption, LocationOption } from "../../types/bookings";
import QuoteExpirationModal from "../quotes/QuoteExpirationModal";
import { useCustomerAddresses } from "../../hooks/Customers/useCustomerAddresses";
import RecurringDetailsBar from "../Recurrences/RecurringDetailsBar";
import CancelReasonModal from "../ui/CancelReasonModal";
import {  HiClipboardList } from "react-icons/hi";


export type BookingFormMode = "createBooking" | "editBooking" | "editQuote";

type Props = {
    initial?: BookingFormState;
    mode?: BookingFormMode;
    onCancel?: () => void | Promise<void>;
  onComplete?: (payload: any) => Promise<void> | void;
  onConvertToBooking?: (payload: any) => Promise<void> | void;
   onQuickSaveCustomer?: (
    customer: BookingFormState["customer"] 
  ) => Promise<void> | void;
  quoteUI?: {
    shareUrl?: string;
    history?: Array<{ date: string; action: string; detail?: string }>;
    onChangeExpire?: (isoDate: string | null) => Promise<void> | void;
    onSendEmail?: (args: {
      to: string;
      subject: string;
      message: string;
      link: string;
    }) => Promise<void> | void;
     createdAt?: string | Date;              // e.g. "2025-11-11T09:13:00Z" or Date
    expirationAt?: string | Date | null;
  };
   recurrenceDetails?: {
    repeatsText: string;   // "Every week on Tuesday"
    timeslotText: string;  // "9:00 AM – 11:00 AM"
    startDateText: string; // "Nov 19, 2025"
    nextJobText: string;   // "Nov 26, 2025"
    onCancelRecurring?: () => void | Promise<void>;
    cancelDisabled?: boolean;
   };
     titleOverride?: string;
};

export default function BookingForm({
  mode = "createBooking",
  initial,
  onComplete,
  quoteUI,
  onQuickSaveCustomer,
  recurrenceDetails,
   titleOverride,
}: Props) {

  

  const [firstName, setFirstName] = React.useState(initial?.customer?.firstName ?? "");
  const [lastName, setLastName] = React.useState(initial?.customer?.lastName ?? "");
  const [email, setEmail] = React.useState(initial?.customer?.email ?? "");
  const [phone, setPhone] = React.useState(initial?.customer?.phone ?? "");
  const [companyName, setCompanyName] = React.useState(
    initial?.customer?.companyName ?? ""
  );

 const location = useLocation();
const prefillBooking = (location.state as any)?.prefillBooking as BookingFormState | undefined;

const createdAt = quoteUI?.createdAt ?? (initial as any)?.createdAt ?? null;
const expiresAt  = quoteUI?.expirationAt ?? (initial as any)?.expirationAt ?? null;

// const { addAddress} = useCustomerAddresses();
const { addAddress, updateAddress } = useCustomerAddresses();
const [defaultAddressId, setDefaultAddressId] = React.useState<number | null>(null);

  // ---------- Pull data from hooks ----------
  const { locations = [], loading: loadingLocs } = useLocations() as any;
  const { variables = [] } = useVariables() as any;
  const { addons = [], loading: loadingAddons } = useAddons() as any;
  const { providers = [], loading: loadingProviders } = useProviders() as any;
  const { frequencies = [], loading: loadingFreqs } = useFrequencies() as any;
  const { categories = [] } = useCategories() as any;
  const { services = [] } = useServices() as any;
const {
  customers = [],
  // fetchCustomers,
  addCustomer,
  updateCustomer,
} = useCustomers() as any;

  const anyLoading = !!(loadingLocs || loadingAddons || loadingProviders || loadingFreqs);
  const [custMatches, setCustMatches] = React.useState<Customer[]>([]);
  const [showCustMatches, setShowCustMatches] = React.useState(false);
  const [justPickedExisting, setJustPickedExisting] = React.useState(false);
  const nav = useNavigate();
  const [isCustomerBlocked, setIsCustomerBlocked] = React.useState(false);
  const { createQuote } = useQuotes();

function buildPrefillFromCurrent(): BookingFormState {
  const variablesArr = variablesDetailed
    .filter(v => Number(v.qty) > 0)
    .map(v => ({ id: Number(v.id), qty: Number(v.qty) }));

  const addonsArr = altSelectedAddonRows.map(a => ({
  id: Number(a.id),
  qty: a.quantityBased
    ? Math.max(1, Number(altAddonQty[a.id] ?? 1))
    : 1, // non-quantity add-ons are always 1
}));

  const squareFeetId = "11";
  const sfLine = variablesDetailed.find(v => String(v.id) === squareFeetId);
  const squareFeet = sfLine ? Number(sfLine.qty) : null;

  const extrasCombined = variablesTotal + extrasTotal;

  const adj = currencyToNumber(adjustmentAmount);
  const tipNum = currencyToNumber(tip);
  const finalNum = finalPrice.trim() ? currencyToNumber(finalPrice) : null;

  const subtotalVal = baseServicePrice + extrasCombined;
  const totalVal = finalPrice.trim()
    ? finalNum!
    : subtotalVal + adj + tipNum;

  return {
    status: "draft",
    quoteId: initial?.quoteId,

    customer: {
      id: savedCustomerId ?? initial?.customer?.id,
      firstName, lastName, email, phone, companyName,
    },

    address: { address, city, state, zip, locationId: selectedLocationId || "" },

    service: {
      categoryId: Number(tos.categoryId || 0),
      serviceId:  Number(tos.serviceId  || 0),
      frequencyId:Number(tos.frequencyId|| 0),
      squareFeet,
      variables: variablesArr,
      addons: addonsArr,
    },

    schedule: { date, time, providerId: selectedTeamId || "" },

    notes: { staffNotes, customerNotes },

    payments: { method: paymentMethod },

    pricing: {
      baseServicePrice,
      extrasTotal: extrasCombined,
      subtotal: subtotalVal,
      adjustmentAmount: adj,
      finalPrice: finalNum, 
      tip: tipNum,
      coupon: coupon || null,
      adjustmentComment: adjustmentComment || null,
      adjustmentAppliesOnlyHere,
      total: totalVal,
    },
  };
}


// put near your other refs
const editPrefilledOnceRef = React.useRef(false);

React.useEffect(() => {
  if (mode !== "editBooking") return;
  if (editPrefilledOnceRef.current) return;

  const currentCustomerId = initial?.customer?.id;
  if (!currentCustomerId) return;

  const allCustomers = (customers as Customer[]) ?? [];
  const match = allCustomers.find(
    (c) => Number(c.id) === Number(currentCustomerId)
  );
  if (!match) return;

  // ✅ hydrate the form from the canonical customer (including default address)
  editPrefilledOnceRef.current = true;
  populateFromCustomer(match);
}, [mode, initial?.customer?.id, customers]);


const focusgray =
  "focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-600 focus:ring-offset-0 transition-colors";
const baseInput =
  "block w-full rounded-lg border bg-white px-2.5 py-2 text-xs sm:px-3 sm:py-2.5 sm:text-sm text-gray-900 placeholder:text-gray-400";
const okInput = `border-gray-300 ${focusgray}`;
const field = (err?: boolean) => inputClass(!!err); 


const norm = (s: unknown) => String(s || "").trim().toLowerCase();

function populateFromCustomer(c: Customer) {
  setSavedCustomerId(Number(c.id));

  // 🔹 Find the default address or fall back to the first one
  const defaultAddr =
    c.addresses?.find((a) => a.isDefault) ?? c.addresses?.[0] ?? null;

  setDefaultAddressId(defaultAddr?.id ?? null);

  setFirstName(c.firstName || "");
  setLastName(c.lastName || "");
  setEmail(c.email || "");
  setPhone(c.phone || "");
  setCompanyName(c.companyName || "");

  if (defaultAddr) {
    // Use the default address from addresses[]
    setAddress(defaultAddr.address || "");
    setCity(defaultAddr.city || "");
    setState(defaultAddr.state || "");
    setZip(defaultAddr.zip || "");

    const locId = defaultAddr.locationId;
    if (locId && Number.isFinite(Number(locId)) && Number(locId) > 0) {
      setLocationIds([Number(locId)]);
    } else {
      setLocationIds([]);
    }
  } else {
    // Fallback: use flattened fields (for older customers)
    setAddress((c as any)?.address || "");
    setCity((c as any)?.city || "");
    setState((c as any)?.state || "");
    setZip((c as any)?.zip || "");

    const locIdCandidate = Number((c as any)?.locationId);
    if (Number.isFinite(locIdCandidate) && locIdCandidate > 0) {
      setLocationIds([locIdCandidate]);
    } else {
      setLocationIds([]);
    }
  }


  setLocationAutoFromZip(false);

  setShowCustMatches(false);
  setJustPickedExisting(true);
  setCustErrors({});
}



React.useEffect(() => {
  const blocked = Boolean(prefillBooking?.customer?.blocked);
  setIsCustomerBlocked(blocked);
}, [prefillBooking]);

React.useEffect(() => {
  function handleOutsideClick(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (target.closest(".customer-field-wrapper")) return;
    setShowCustMatches(false);
    setActiveCustField(null);
  }

  document.addEventListener("click", handleOutsideClick);
  return () => document.removeEventListener("click", handleOutsideClick);
}, []);
const lookupKey = `${firstName}|${lastName}|${email}`;
React.useEffect(() => {
  if (justPickedExisting) {
    setJustPickedExisting(false);
    return;
  }

  const fn = norm(firstName);
  const ln = norm(lastName);
  const em = norm(email);
  const shouldSearch =
    (fn.length >= 2) || (ln.length >= 2) || (em.length >= 3);

  if (!shouldSearch) {
    setCustMatches([]);
    setShowCustMatches(false);
    return;
  }

  const timer = window.setTimeout(() => {
    const results = (customers as Customer[]).filter((c) => {
      const cfn = norm(c.firstName);
      const cln = norm(c.lastName);
      const cem = norm(c.email);
      const nameLikely =
        (fn && cfn.startsWith(fn)) ||
        (ln && cln.startsWith(ln)) ||
        (!!fn && !!ln && cfn.startsWith(fn) && cln.startsWith(ln));

      const emailLikely = !!em && cem.includes(em);

      return nameLikely || emailLikely;
    });

    setCustMatches(results.slice(0, 8));
    setShowCustMatches(results.length > 0);
  }, 250); 

  return () => window.clearTimeout(timer);
}, [lookupKey, customers]);

// const IS_EDIT = mode === "editBooking";
const IS_CREATE = mode === "createBooking";
const { createBooking } = useBookings();
const { updateBooking} = useBookings();
const { cancelBooking } = useBookings();

const [savedCustomerId, setSavedCustomerId] = React.useState<number | undefined>(
  initial?.customer?.id
);

function validateCustomer(): CustErrors {
  const alreadySaved = !!(savedCustomerId || initial?.customer?.id);
  const errs: CustErrors = {};
  if (!alreadySaved && !String(firstName).trim()) errs.firstName = "First name is required";
  if (!alreadySaved && !String(lastName).trim())  errs.lastName  = "Last name is required";
  if (
    !alreadySaved &&
    (!email.trim() || !/^\S+@\S+\.\S+$/.test(email))
  ) errs.email = "Valid email is required";
  if (!alreadySaved) {
    const digits = phone.replace(/\D+/g, "");
    if (digits.length !== 10) errs.phone = "Phone must be 10 digits";
  }
  return errs;
}

function toBookingPayload() {
  const variablesArr = variablesDetailed
    .filter((v) => Number(v.qty) > 0)
    .map((v) => ({ id: Number(v.id), qty: Number(v.qty) }));

  const addonsArr = altSelectedAddonRows.map((a) => ({
    id: Number(a.id),
    qty: a.quantityBased
      ? Math.max(1, Number(altAddonQty[a.id] ?? 1))
      : 1,
  }));

  const squareFeetId = "11";
  const sfLine = variablesDetailed.find((v) => String(v.id) === squareFeetId);
  const squareFeet = sfLine ? Number(sfLine.qty) : null;

  const providerId = selectedTeamId || "";
  const locationId = selectedLocationId || "";
  const frequencyIdNum = Number(tos.frequencyId || 0);

  return {
    status: initial?.status ?? "draft",

    customer: {
      id: savedCustomerId ?? initial?.customer?.id,
      firstName,
      lastName,
      email,
      phone,
      companyName,
    },

    address: { address, city, state, zip, locationId },

    service: {
      categoryId: Number(tos.categoryId || 0),
      serviceId: Number(tos.serviceId || 0),
      frequencyId: frequencyIdNum,

      // 🔥 full frequency snapshot (client-side only, backend ignores)
      frequency: frequencySnapshot,

      squareFeet,
      variables: variablesArr,
      addons: addonsArr,
    },

    // still convenient top-level copies for older code:
    variables: variablesArr,
    addons: addonsArr,

    schedule: { date, time, providerId },

    notes: { staffNotes, customerNotes },

    payments: { method: paymentMethod },

    pricing: {
      baseServicePrice,
      extrasTotal,
      subtotal,
      adjustmentAmount: currencyToNumber(adjustmentAmount),
      finalPrice: finalPrice ? currencyToNumber(finalPrice) : null,
      tip: currencyToNumber(tip),
      coupon: coupon || null,
      adjustmentComment: adjustmentComment || null,
      adjustmentAppliesOnlyHere,
      total: computedTotal,

      frequencyDiscountPercent: frequencyDiscountPct,
      nextBookingTotal,
    },

    quoteId: initial?.quoteId ?? undefined,
  };
}

  const [activeCustField, setActiveCustField] = React.useState<CustField>(null);
  const [showPriceAdj, setShowPriceAdj] = React.useState(false);
  const [otherErrors, setOtherErrors] = React.useState<OtherErrors>({});
  const [custErrors, setCustErrors] = React.useState<CustErrors>({});
  const [submitted, setSubmitted] = React.useState(false);
  const toast = useToast();
  const [altVarText, setAltVarText] = React.useState<Record<string, string>>({});
  const [altAddonText, setAltAddonText] = React.useState<Record<number, string>>({});
  const [customerSubmitted, setCustomerSubmitted] = React.useState(false);
  const [quoteSubmitted, setQuoteSubmitted] = React.useState(false);
  const showCustError = submitted || customerSubmitted || quoteSubmitted;
  const customerCardRef = React.useRef<HTMLDivElement>(null);

 // ✅ parse exactly the way Bookings does (let the ISO parser handle it)
function fromISODate(s: string): Date | null {
  return s ? new Date(s) : null; // "YYYY-MM-DD" is parsed as UTC midnight
}

// ✅ serialize so we keep a plain date string like Bookings expects
function toISODate(d: Date): string {
  // lock to the picked calendar day and emit just YYYY-MM-DD
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}


 
  function validateService(): Pick<OtherErrors, "frequencyId" | "categoryId" | "serviceId"> {
    const e: Pick<OtherErrors, "frequencyId" | "categoryId" | "serviceId"> = {};
    if (!tos.frequencyId) e.frequencyId = "Frequency is required";
    if (!tos.categoryId) e.categoryId = "Category is required";
    if (!tos.serviceId) e.serviceId = "Service is required";
    return e;
  }
  function validateFull(): {
    cust: CustErrors;
    other: OtherErrors;
    messages: string[];
  } {
    const cust = validateCustomer();
    const other: OtherErrors = { ...validateService() };
    const msgs: string[] = [];

    if (!date) {
      other.date = "Date is required";
      msgs.push("Date is required");
    }
    if (!time) {
      other.time = "Time is required";
      msgs.push("Time is required");
    }

    if (other.frequencyId || other.categoryId || other.serviceId)
      msgs.push("Service details are required");

    return { cust, other, messages: msgs };
  }


  function serviceSupportsLocation(svc: any, locId?: number | string) {
  if (!locId) return false;
  const locs = (svc.locationIds ?? []).map(Number);
  return locs.includes(Number(locId));
}

  const addonOptions: AddonOption[] = React.useMemo(() => {
    return (addons ?? []).map((a: any) => ({
      id:
        Number(a.id ?? 0) ||
        Math.abs(
          String(a.slug ?? a.key ?? "0")
            .split("")
            .reduce((acc: number, ch: string) => acc + ch.charCodeAt(0), 0)
        ),
      name: a.name ?? a.title ?? `Addon #${a.id}`,
      price: Number(a.price ?? a.amount ?? 0),
      keyForPayload: String(a.key ?? a.slug ?? a.id),
      quantityBased: Boolean(
        a.quantity_based ?? a.quantityBased ?? a.allow_quantity ?? false
      ),
      __raw: a,
    }));
  }, [addons]);

  const teamOptions: TeamOption[] = React.useMemo(() => {
    return (providers ?? []).map((p: any) => ({
      id: Number(p.id),
      name: p.teamTitle ?? p.name ?? `Team #${p.id}`,
      __raw: p,
    }));
  }, [providers]);

  const locationOptions: LocationOption[] = React.useMemo(() => {
    return (locations ?? []).map((l: any) => ({
      id: Number(l.id),
      name: l.name ?? l.title ?? `Location #${l.id}`,
      __raw: l,
    }));
  }, [locations]);

  const [tos, setTos] = React.useState<TypeOfServiceModel>({
    frequencyId: initial?.service?.frequencyId ? String(initial.service.frequencyId) : "",
    categoryId: initial?.service?.categoryId ? String(initial.service.categoryId) : "",
    serviceId: initial?.service?.serviceId ? String(initial.service.serviceId) : "",
  });


  const [address, setAddress] = React.useState(initial?.address?.address ?? "");
  const [city, setCity] = React.useState(initial?.address?.city ?? "");
  const [state, setState] = React.useState(initial?.address?.state ?? "");
  const [zip, setZip] = React.useState(initial?.address?.zip ?? "");

  const [locationIds, setLocationIds] = React.useState<number[]>(
    initial?.address?.locationId ? [Number(initial.address.locationId)] : []
  ); // single

  const [locationAutoFromZip, setLocationAutoFromZip] = React.useState(
    mode === "createBooking" // new booking starts in auto mode
  );

  const [teamIds, setTeamIds] = React.useState<number[]>(
    initial?.schedule?.providerId ? [Number(initial.schedule.providerId)] : []
  ); // single

  // Schedule
  const [date, setDate] = React.useState(initial?.schedule?.date ?? "");
  const [time, setTime] = React.useState(initial?.schedule?.time ?? "");

  // Notes
  const [staffNotes, setStaffNotes] = React.useState(initial?.notes?.staffNotes ?? "");
  const [customerNotes, setCustomerNotes] = React.useState(
    initial?.notes?.customerNotes ?? ""
  );

  // Payments
  const [paymentMethod, setPaymentMethod] = React.useState<
    "" | "card" | "cash" | "check"
  >(initial?.payments?.method ?? "card");

  // Adjustments
  const [coupon, setCoupon] = React.useState(initial?.pricing?.coupon ?? "");
  const [adjustmentAmount, setAdjustmentAmount] = React.useState(
    initial?.pricing?.adjustmentAmount != null
      ? String(initial.pricing.adjustmentAmount)
      : ""
  );
  const [finalPrice, setFinalPrice] = React.useState(
    initial?.pricing?.finalPrice != null ? String(initial.pricing.finalPrice) : ""
  );
  const [adjustmentComment, setAdjustmentComment] = React.useState(
    initial?.pricing?.adjustmentComment ?? ""
  );
  const [adjustmentAppliesOnlyHere, setAdjustmentAppliesOnlyHere] = React.useState(
    initial?.pricing?.adjustmentAppliesOnlyHere ?? true
  );
  const [tip, setTip] = React.useState(
    initial?.pricing?.tip != null ? String(initial.pricing.tip) : ""
  );
  const VAR_QTY_KEY = (serviceId: string | number) => `CALIROCKS_VAR_QTY_SVC_${serviceId}`;

  function loadVarQtyFromLS(serviceId?: string | number): Record<string, string> | null {
    if (!serviceId) return null;
    try {
      const raw = localStorage.getItem(VAR_QTY_KEY(serviceId));
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return parsed;
    } catch {}
    return null;
  }

  function saveVarQtyToLS(serviceId?: string | number, map?: Record<string, string>) {
    if (!serviceId || !map) return;
    try {
      localStorage.setItem(VAR_QTY_KEY(serviceId), JSON.stringify(map));
    } catch {}
  }
  const CLEAR_LS_ON_CREATE = false;
  React.useEffect(() => {
    if (!IS_CREATE || !CLEAR_LS_ON_CREATE) return;
    try {
      const toDelete: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith("CALIROCKS_VAR_QTY_SVC_")) toDelete.push(k);
      }
      toDelete.forEach((k) => localStorage.removeItem(k));
    } catch {}
  }, [IS_CREATE]);

  const lastSeededServiceIdRef = React.useRef<string>("");

  function clampVarQty(idStr: string, raw: unknown) {
    const min = getVarMin(idStr, variables, selectedService);
    const max = getVarMax(idStr, variables);
    const n = parseInt(String(raw ?? "").replace(/[^\d]/g, ""), 10);
    const val = Number.isFinite(n) ? n : min;
    return String(Math.max(min, Math.min(val, max)));
  }

  function buildDefaultsForService(): Record<string, string> {
    const out: Record<string, string> = {};
    for (const v of variablesForService) {
      const k = String(v.id ?? v.key ?? v.value);
      out[k] = String(getVarMin(k, variables, selectedService));
    }
    return out;
  }

  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  const selectedService = React.useMemo(() => {
    if (!tos.categoryId || !tos.serviceId) return undefined;
    const cat = (categories ?? []).find(
      (c: any) => String(c.id ?? c.key ?? c.value) === String(tos.categoryId)
    );
    return cat?.services?.find?.(
      (s: any) => String(s.id ?? s.key ?? s.value) === String(tos.serviceId)
    );
  }, [categories, tos.categoryId, tos.serviceId]);

  const selectedServiceId = React.useMemo(
    () => (selectedService ? String((selectedService as any).id ?? "") : ""),
    [selectedService]
  );

  const baseServicePrice = React.useMemo(() => {
    if (!selectedServiceId) return 0;

    const svc = (services as any[]).find(
      (s) => String(s.id ?? s.key ?? s.value) === String(selectedServiceId)
    );
    const svcPrice =
      toNum(svc?.price_amount ?? svc?.basePrice ?? svc?.price, NaN);
    if (Number.isFinite(svcPrice)) return svcPrice;

    const s = selectedService as any;
    return toNum(s?.price_amount ?? s?.basePrice ?? s?.price, 0);
  }, [services, selectedServiceId, selectedService]);

  const selectedLocationId = React.useMemo(
    () => locationIds[0] ?? "",
    [locationIds]
  );
  const selectedTeamId = React.useMemo(() => teamIds[0] ?? "", [teamIds]);

const allServices = (services as any[]) ?? [];
const allCategories = (categories as any[]) ?? [];

const categoriesFilteredByLocation = React.useMemo(() => {
  const locId = selectedLocationId;
  if (!locId) {
    return allCategories.map(c => ({
      ...c,
      services: [], 
    }));
  }
  return allCategories.map(cat => {
    const catId = String(cat.id);
    const catServices = allServices
      .filter(s => (s.categoryIds ?? []).map(String).includes(catId))
      .filter(s => serviceSupportsLocation(s, locId))
      .map(s => ({ id: s.id, name: s.name })); 

    return { ...cat, services: catServices };
  });
}, [allCategories, allServices, selectedLocationId]);


 // For EDIT: use all categories with all services by category (no location filtering)
 const categoriesUnfiltered = React.useMemo(() => {
   return allCategories.map(cat => {
     const catId = String(cat.id);
     const catServices = allServices
       .filter(s => (s.categoryIds ?? []).map(String).includes(catId))
       .map(s => ({ id: s.id, name: s.name }));
     return { ...cat, services: catServices };
   });
 }, [allCategories, allServices]);

 // put this near your other memos (after categoriesFilteredByLocation / categoriesUnfiltered exist)
const categoriesForTOS: CategoryInput[] = React.useMemo(() => {
  const src = mode === "createBooking" ? categoriesFilteredByLocation : categoriesUnfiltered;
  return (src ?? []).map((c: any) => ({
    id: c.id,
    name: c.name,
    services: (c.services ?? []).map((s: any) => ({ id: s.id, name: s.name })),
    status: c.status ?? "active",
  }));
}, [mode, categoriesFilteredByLocation, categoriesUnfiltered]);

React.useEffect(() => {
   if (mode !== "createBooking") return; // EDIT: never clear what backend set
   if (!tos.serviceId) return;
   const currentCat = categoriesFilteredByLocation.find(c => String(c.id) === String(tos.categoryId));
const allowed = (currentCat?.services ?? []).some(
  (s: { id: string | number }) => String(s.id) === String(tos.serviceId)
);
   if (!allowed) setTos(prev => ({ ...prev, serviceId: "" }));
 }, [mode, categoriesFilteredByLocation, tos.categoryId, tos.serviceId]);


 const selectedServiceRow = React.useMemo(() => {
  if (!tos.serviceId) return undefined;
  return allServices.find(s => String(s.id) === String(tos.serviceId));
}, [allServices, tos.serviceId]);

const frequenciesForService = React.useMemo(() => {
  if (!selectedServiceRow) return [];
  const allowed = new Set((selectedServiceRow.frequencyIds ?? []).map(String));
  return (frequencies as any[]).filter(f => allowed.has(String(f.id)));
}, [frequencies, selectedServiceRow]);

const addonOptionsForService = React.useMemo(() => {
  if (!selectedServiceRow) return addonOptions; 
  const ids = selectedServiceRow.addonIds;
  if (!ids || ids.length === 0) return addonOptions; 
  const allowed = new Set(ids.map(String));
  return addonOptions.filter((a) => allowed.has(String(a.id)));
}, [addonOptions, selectedServiceRow]);


const variablesForService = React.useMemo(() => {
  if (!selectedServiceRow) return [];
  const allowed = new Set((selectedServiceRow.variableIds ?? []).map(String));
  return (variables as any[]).filter(v => allowed.has(String(v.id)));
}, [variables, selectedServiceRow]);

  const parseIntFromText = (s: string | undefined | null) => {
    if (s == null) return NaN;
    const d = String(s).replace(/[^\d]/g, "");
    if (!d) return NaN;
    const n = parseInt(d, 10);
    return Number.isFinite(n) ? n : NaN;
  };

  function getLiveVarQty(
    idStr: string,
    min: number,
    max: number,
    altVarText: Record<string, string>,
    altVarQty: Record<string, string>
  ) {
    const typed = parseIntFromText(altVarText[idStr]);
    const fallback = parseIntFromText(altVarQty[idStr]);
    const raw = Number.isFinite(typed) ? typed : Number.isFinite(fallback) ? fallback : min;
    return Math.max(min, Math.min(raw, max));
  }

  function getLiveAddonQty(
    id: number,
    altAddonText: Record<number, string>,
    altAddonQty: Record<number, number>
  ) {
    const typed = parseIntFromText(altAddonText[id]);
    const fallback = altAddonQty[id];
    const raw = Number.isFinite(typed) ? typed : Number.isFinite(fallback) ? fallback : 1;
    return Math.max(1, raw);
  }

  const [altVarQty, setAltVarQty] = React.useState<Record<string, string>>({});

  const setAltVarQtyClamped = (
    idStr: string,
    raw: string | number,
    allVars: any[],
    selectedSvc?: any
  ) => {
    const min = getVarMin(idStr, allVars, selectedSvc);
    const max = getVarMax(idStr, allVars);
    const toInt = (v: string | number) => {
      if (typeof v === "number") return Math.floor(v);
      const cleaned = v.replace(/\D+/g, "");
      return cleaned === "" ? NaN : parseInt(cleaned, 10);
    };
    const parsed = toInt(raw);
    const clamped = Number.isFinite(parsed) ? Math.max(min, Math.min(parsed, max)) : min;
    setAltVarQty((prev) => ({ ...prev, [idStr]: String(clamped) }));
  };

  function commitVarText(
    idStr: string,
    allVars: any[],
    selectedSvc?: any,
    fallbackMin?: number
  ) {
    const min = fallbackMin ?? getVarMin(idStr, allVars, selectedSvc);
    const max = getVarMax(idStr, allVars);
    const raw = altVarText[idStr] ?? "";
    const n = raw.replace(/[^\d]/g, "");
    const parsed = n === "" ? NaN : parseInt(n, 10);
    const clamped = Number.isFinite(parsed) ? Math.max(min, Math.min(parsed, max)) : min;

    setAltVarQty((prev) => ({ ...prev, [idStr]: String(clamped) }));
    setAltVarText((prev) => ({ ...prev, [idStr]: String(clamped) }));
  }

  const didResetRef = React.useRef(false);
  const resetAllForCreate = React.useCallback(() => {
  // Service details
  setTos({ frequencyId: "", categoryId: "", serviceId: "" });

  // Customer
  setFirstName("");
  setLastName("");
  setEmail("");
  setPhone("");
  setCompanyName("");

  // Address
  setAddress("");
  setCity("");
  setState("");
  setZip("");
  setLocationIds([]);
  setLocationAutoFromZip(true); // new blank form → auto mode again

  // Team/Schedule
  setTeamIds([]);
  setDate("");
  setTime("");

  // Notes
  setStaffNotes("");
  setCustomerNotes("");

  // Pricing / payments
  setPaymentMethod("card");
  setCoupon("");
  setAdjustmentAmount("");
  setFinalPrice("");
  setAdjustmentComment("");
  setAdjustmentAppliesOnlyHere(true);
  setTip("");

  // Variables/Addons
  setAltVarQty({});
  setAltVarText({});
  setAltSelectedAddonIds([]);
  setAltAddonQty({});
}, []);


React.useEffect(() => {
  const cleanZip = String(zip || "").trim();
  if (!cleanZip) return;
  if (!Array.isArray(locations) || locations.length === 0) return;

  // find location whose postal_codes includes this zip
  const match = (locations as any[]).find((loc) => {
    const zips = loc.postal_codes ?? loc.postalCodes ?? [];
    if (!Array.isArray(zips)) return false;
    // compare as strings to be safe
    return zips.map(String).includes(cleanZip);
  });

  if (!match) return;

  const matchId = Number(match.id);
  if (!Number.isFinite(matchId)) return;

  // 🔒 If the user manually chose a location, don't override it
  if (!locationAutoFromZip && locationIds.length > 0) {
    return;
  }

  // already selected? nothing to do
  if (locationIds[0] === matchId) return;

  // ✅ auto-select the location for this ZIP and mark as auto-controlled
  setLocationIds([matchId]);
  setLocationAutoFromZip(true);
}, [zip, locations, locationIds, locationAutoFromZip]);



React.useEffect(() => {
  if (!IS_CREATE) return;
  if (didResetRef.current) return;

  if (prefillBooking) {
    didResetRef.current = true;
    return;
  }

  didResetRef.current = true;
  resetAllForCreate();
}, [IS_CREATE, resetAllForCreate, prefillBooking]);

const prefilledOnceRef = React.useRef(false);
React.useEffect(() => {
  if (!prefillBooking || prefilledOnceRef.current) return;
  prefilledOnceRef.current = true;

  const p = prefillBooking;

  // ——— Customer
  setSavedCustomerId(p.customer?.id);
  setFirstName(p.customer?.firstName ?? "");
  setLastName(p.customer?.lastName ?? "");
  setEmail(p.customer?.email ?? "");
  setPhone(p.customer?.phone ?? "");
  setCompanyName(p.customer?.companyName ?? "");

  // ——— Address
  setAddress(p.address?.address ?? "");
  setCity(p.address?.city ?? "");
  setState(p.address?.state ?? "");
  setZip(p.address?.zip ?? "");
  setLocationIds(p.address?.locationId ? [Number(p.address.locationId)] : []);
   setLocationAutoFromZip(false);

  // ——— ToS
  setTos({
    frequencyId: p.service?.frequencyId ? String(p.service.frequencyId) : "",
    categoryId:  p.service?.categoryId  ? String(p.service.categoryId)  : "",
    serviceId:   p.service?.serviceId   ? String(p.service.serviceId)   : "",
  });

  // ——— Schedule / Team
  setTeamIds(p.schedule?.providerId ? [Number(p.schedule.providerId)] : []);
  setDate(p.schedule?.date ?? "");
  setTime(p.schedule?.time ?? "");

  // ——— Notes
  setStaffNotes(p.notes?.staffNotes ?? "");
  setCustomerNotes(p.notes?.customerNotes ?? "");

  // ——— Payment / Pricing
  setPaymentMethod((p.payments?.method as any) ?? "card");
  setCoupon(p.pricing?.coupon ?? "");
  setAdjustmentAmount(
    p.pricing?.adjustmentAmount != null ? String(p.pricing.adjustmentAmount) : ""
  );
  setFinalPrice(p.pricing?.finalPrice != null ? String(p.pricing.finalPrice) : "");
  setAdjustmentComment(p.pricing?.adjustmentComment ?? "");
  setAdjustmentAppliesOnlyHere(Boolean(p.pricing?.adjustmentAppliesOnlyHere ?? true));
  setTip(p.pricing?.tip != null ? String(p.pricing.tip) : "");

const varMap: Record<string, string> = {};
(p.service?.variables ?? []).forEach(line => {
  if (line?.id == null) return;
  varMap[String(line.id)] = String(line.qty ?? "");
});
setAltVarQty(varMap);
setAltVarText(varMap);

const ids = (p.service?.addons ?? []).map(a => String(a.id));
setAltSelectedAddonIds(ids);
const aq: Record<number, number> = {};
(p.service?.addons ?? []).forEach(a => {
  aq[Number(a.id)] = Math.max(1, Number(a.qty ?? 1));
});
setAltAddonQty(aq);

}, [prefillBooking]);


  React.useEffect(() => {
    if (!IS_CREATE) return;
    if (didResetRef.current) return;
    didResetRef.current = true;
    resetAllForCreate();
  }, [IS_CREATE, resetAllForCreate]);

  React.useEffect(() => {
    if (IS_CREATE) return;
    const lines = initial?.service?.variables;
    if (!Array.isArray(lines) || lines.length === 0) return;

    setAltVarQty((prev) => {
      const next = { ...prev };
      for (const { id, qty } of lines) {
        const k = String(id);
        const min = getVarMin(k, variables, selectedService);
        const max = getVarMax(k, variables);
        const n = Number(qty);
        const clamped = Number.isFinite(n) ? Math.max(min, Math.min(n, max)) : min;
        next[k] = String(clamped);
      }
      return next;
    });

    setAltVarText((prev) => {
      const next = { ...prev };
      for (const { id, qty } of lines) {
        const k = String(id);
        next[k] = String(qty ?? "");
      }
      return next;
    });
  }, [IS_CREATE, initial, variables, selectedService]);

  React.useEffect(() => {
    const sid = selectedServiceId;
    if (!sid) return;

    const defaults = buildDefaultsForService();

    let chosen: Record<string, string> = { ...defaults };

    if (!IS_CREATE) {
      const ls = !Array.isArray(initial?.service?.variables)
        ? loadVarQtyFromLS(sid)
        : null;

      const initialLines = Array.isArray(initial?.service?.variables)
        ? (initial!.service!.variables as Array<{ id: number | string; qty: number }>)
        : null;

      if (ls) {
        for (const [k, raw] of Object.entries(ls)) {
          chosen[k] = clampVarQty(k, raw);
        }
      }

      if (initialLines) {
        for (const line of initialLines) {
          const k = String(line.id);
          chosen[k] = clampVarQty(k, line.qty);
        }
      }
    }

    const serviceChanged = lastSeededServiceIdRef.current !== sid;

    if (serviceChanged) {
      setAltVarQty(chosen);
      setAltVarText(chosen);
      lastSeededServiceIdRef.current = sid;
    } else {
   
      setAltVarQty((prev) => {
        const next = { ...prev };
        for (const [k, v] of Object.entries(chosen)) {
          if (next[k] == null) next[k] = v;
        }
        return next;
      });
      setAltVarText((prev) => {
        const next = { ...prev };
        for (const [k, v] of Object.entries(chosen)) {
          if (next[k] == null) next[k] = v;
        }
        return next;
      });
    }
  }, [IS_CREATE, selectedServiceId, variablesForService, variables, selectedService, initial]);

  React.useEffect(() => {
    const sid = selectedServiceId;
    if (!sid) return;

    const map: Record<string, string> = {};
    for (const v of variablesForService) {
      const k = String(v.id ?? v.key ?? v.value);
      const min = getVarMin(k, variables, selectedService);
      const max = getVarMax(k, variables);
      map[k] = String(getLiveVarQty(k, min, max, altVarText, altVarQty));
    }
    saveVarQtyToLS(sid, map);
  }, [selectedServiceId, variablesForService, altVarQty, altVarText, variables, selectedService]);

  const [altSelectedAddonIds, setAltSelectedAddonIds] = React.useState<string[]>(
    (initial?.service?.addons ?? []).map((a) => String(a.id))
  );
  const [altAddonQty, setAltAddonQty] = React.useState<Record<number, number>>(
    (initial?.service?.addons ?? []).reduce((acc, a) => {
      acc[Number(a.id)] = Math.max(1, Number(a.qty) || 1);
      return acc;
    }, {} as Record<number, number>)
  );

  React.useEffect(() => {
    if (!IS_CREATE) return;
    setAltSelectedAddonIds([]);
    setAltAddonQty({});
  }, [IS_CREATE]);

const addonItemsAlt: CDItem[] = React.useMemo(
  () =>
    addonOptionsForService.map((a) => ({
      value: String(a.id),
      label: a.name,
      hint: a.price ? formatCurrency(Number(a.price)) : undefined,
    })),
  [addonOptionsForService]
);

 const altSelectedAddonRows = React.useMemo(() => {
  const chosen = new Set(altSelectedAddonIds.map(String));
  return addonOptions.filter((a) => chosen.has(String(a.id))); 
}, [altSelectedAddonIds, addonOptions]);



React.useEffect(() => {
  if (!selectedServiceRow) {
    if (IS_CREATE) {
      setAltSelectedAddonIds([]);
      setAltAddonQty({});
      setAltAddonText({});
    }
    return;
  }

  if (!IS_CREATE) return;

  const allowed = new Set((addonOptionsForService ?? []).map((a) => String(a.id)));

  setAltSelectedAddonIds((prev) => prev.filter((id) => allowed.has(String(id))));
  setAltAddonQty((prev) => {
    const next = { ...prev };
    Object.keys(next).forEach((k) => {
      if (!allowed.has(String(k))) delete next[Number(k)];
    });
    return next;
  });
  setAltAddonText((prev) => {
    const next = { ...prev };
    Object.keys(next).forEach((k) => {
      if (!allowed.has(String(k))) delete next[Number(k)];
    });
    return next;
  });
}, [IS_CREATE, selectedServiceRow, addonOptionsForService]);

  const getVarStart = (
    vid: string | number,
    allVars: any[],
    selectedSvc?: any
  ) => {
    const idStr = String(vid);
    const svcLink =
      selectedSvc?.variables?.find?.(
        (x: any) => String(x.variableId ?? x.variable_id ?? x.id) === idStr
      ) ?? null;
    const svcRaw =
      svcLink?.values_from ?? svcLink?.valuesFrom ?? svcLink?.default_qty;

    const row = (allVars ?? []).find(
      (v: any) => String(v.id ?? v.key ?? v.value) === idStr
    );

    const varRaw =
      row?.values_from ??
      row?.valuesFrom ??
      row?.default_qty ??
      row?.defaultQty ??
      row?.meta?.values_from ??
      row?.meta?.default_qty;

    const raw = svcRaw ?? varRaw;
    const n = parseInt(String(raw ?? ""), 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  };

  const getVarMax = (vid: string | number, allVars: any[]) => {
    const row = (allVars ?? []).find(
      (v: any) => String(v.id ?? v.key ?? v.value) === String(vid)
    );
    const max = Number(row?.values_to);
    return Number.isFinite(max) ? max : Number.POSITIVE_INFINITY;
  };

  const getVarMin = (
    vid: string | number,
    allVars: any[],
    selectedSvc?: any
  ) => {
    return getVarStart(vid, allVars, selectedSvc);
  };

  const isSquareFeetVar = (v: any) => {
    const byId = String(v?.id) === "11";
    const byName =
      String(v?.name ?? "").toLowerCase().includes("square") &&
      String(v?.name ?? "").toLowerCase().includes("feet");
    return byId || byName;
  };

  function buildIntOptions(min: number, max: number) {
    const out: number[] = [];
    for (let i = min; i <= max; i++) out.push(i);
    return out;
  }

  const altSelectedVarRows = React.useMemo(() => {
    return variablesForService.map((row: any) => {
      const idStr = String(row.id ?? row.key ?? row.value);
      const unit = toNum(row?.price_amount ?? row?.price ?? row?.amount, 0);
      const min = getVarMin(idStr, variables, selectedService);
      const max = getVarMax(idStr, variables);
      const qty = getLiveVarQty(idStr, min, max, altVarText, altVarQty); 
      return {
        idStr,
        name: row?.name ?? row?.label ?? `Variable #${idStr}`,
        unit,
        qty,
        lineTotal: unit * qty,
      };
    });
  }, [variablesForService, altVarQty, altVarText, variables, selectedService]);

  const variablesDetailed = React.useMemo(
    () =>
      altSelectedVarRows.map((r) => ({
        id: r.idStr,
        qty: r.qty,
        unitPrice: r.unit,
        lineTotal: r.lineTotal,
      })),
    [altSelectedVarRows]
  );

  const variablesTotal = React.useMemo(
    () => altSelectedVarRows.reduce((sum, r) => sum + r.lineTotal, 0),
    [altSelectedVarRows]
  );

  const extrasDetailed = React.useMemo(
  () =>
    altSelectedAddonRows.map((a) => {
      const unit = Number(a.price ?? 0);
      const qty = a.quantityBased
        ? getLiveAddonQty(a.id, altAddonText, altAddonQty)
        : 1;

      return {
        key: a.keyForPayload ?? String(a.id),
        id: a.id,
        name: a.name,
        qty,
        unitPrice: unit,
        lineTotal: unit * qty,
      };
    }),
  [altSelectedAddonRows, altAddonText, altAddonQty]
);

  const extrasTotal = React.useMemo(
    () => extrasDetailed.reduce((s, r) => s + r.lineTotal, 0),
    [extrasDetailed]
  );

  React.useEffect(() => {
  if (mode !== "createBooking") return; // edit/quote: do NOT auto-pick location
  if (locationOptions.length > 0 && locationIds.length === 0) {
    setLocationIds([locationOptions[0].id]);
    setLocationAutoFromZip(true); // treat as auto choice
  }
}, [mode, locationOptions, locationIds.length]);

 const selectedFrequencyRow = React.useMemo(() => {
  return (frequencies ?? []).find(
    (x: any) => String(x.id ?? x.key ?? x.value) === tos.frequencyId
  );
}, [frequencies, tos.frequencyId]);

// use discount_percent/discount_value from your real shape
const frequencyDiscountPct = React.useMemo(() => {
  const f: any = selectedFrequencyRow;
  if (!f) return 0;
  // prefer discount_percent, fallback to discount_value
  const n =
    Number(f.discount_percent ?? f.discount_value ?? 0);
  return Number.isFinite(n) ? n : 0;
}, [selectedFrequencyRow]);

// 🔥 full snapshot using your /frequencies response shape
const frequencySnapshot = React.useMemo(() => {
  if (!selectedFrequencyRow) return null;
  const f: any = selectedFrequencyRow;

  const numOrNull = (v: any) => {
    if (v === null || v === undefined || v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  return {
    id: Number(f.id),
    name: f.name ?? null,                       // "Bi-Weekly"
    frequencyLabel: f.frequency_label ?? null,  // "Every 2 Weeks"
    intervalDays: numOrNull(f.interval_days),   // 14

    discountPercent: numOrNull(f.discount_percent),
    discountType: f.discount_type ?? null,      // "percentage"
    discountValue: numOrNull(f.discount_value),
    discountApplyMode: f.discount_apply_mode ?? null, // "after"
    discountAfterN: numOrNull(f.discount_after_n),

    status: f.status ?? null,                   // "active"
    isDefault: !!(f.is_default ?? false),
    staffOnly: !!(f.staff_only ?? false),

    customDays: f.custom_days ?? null,
    customEvery: numOrNull(f.custom_every),

    // For debugging / future use
    serviceIds: Array.isArray(f.serviceIds) ? f.serviceIds.map(Number) : [],
    raw: f,
  };
}, [selectedFrequencyRow]);


  const subtotal = React.useMemo(
    () => baseServicePrice + extrasTotal + variablesTotal,
    [baseServicePrice, extrasTotal, variablesTotal]
  );

  const discountAmount = React.useMemo(() => {
    if (!frequencyDiscountPct) return 0;
    return (subtotal * frequencyDiscountPct) / 100;
  }, [subtotal, frequencyDiscountPct]);

  const computedTotal = React.useMemo(() => {
    const base = subtotal;
    const adj = currencyToNumber(adjustmentAmount);
    const finalNum = currencyToNumber(finalPrice);
    const tipNum = currencyToNumber(tip);
    if (finalPrice.trim() !== "") return finalNum;
    return base + adj + tipNum;
  }, [subtotal, adjustmentAmount, finalPrice, tip]);

  const nextBookingTotal = React.useMemo(() => {
    if (!frequencyDiscountPct) return subtotal;
    return subtotal - discountAmount;
  }, [subtotal, discountAmount, frequencyDiscountPct]);

  const locationItems: CDItem[] = React.useMemo(
    () =>
      (locationOptions ?? []).map((l) => ({
        value: String(l.id),
        label: l.name,
      })),
    [locationOptions]
  );

  const paymentItems: CDItem[] = React.useMemo(
    () => [
      { value: "card", label: "Add Credit Card" },
      { value: "cash", label: "Cash" },
      { value: "check", label: "Check" },
    ],
    []
  );

  const finalPriceApplyTimer = React.useRef<number | null>(null);
  React.useEffect(() => {
    if (!finalPrice.trim()) {
      if (finalPriceApplyTimer.current) {
        window.clearTimeout(finalPriceApplyTimer.current);
        finalPriceApplyTimer.current = null;
      }
      return;
    }
    if (finalPriceApplyTimer.current) {
      window.clearTimeout(finalPriceApplyTimer.current);
    }
    finalPriceApplyTimer.current = window.setTimeout(() => {
      applyFinalAsAdjustment();
    }, 2000);
    return () => {
      if (finalPriceApplyTimer.current) {
        window.clearTimeout(finalPriceApplyTimer.current);
        finalPriceApplyTimer.current = null;
      }
    };
  }, [finalPrice]);

async function onSaveQuote() {
  if (saving) return;
  setQuoteSubmitted(true);

  const cErrs = validateCustomer();
  setCustErrors(cErrs);
  setOtherErrors({});
  if (Object.keys(cErrs).length) return;

  try {
    setSaving(true);
    const payloadSnapshot = buildPrefillFromCurrent();

    const q = await createQuote({
      status: "draft",
      payload: payloadSnapshot,
    });

    toast.success({ title: "Quote created", description: "Opening quote editor…" });
    nav(`/admin/quotes/edit/${q.id}`);
  } catch (err: any) {
    toast.error({
      title: "Couldn’t create quote",
      description: err?.message ?? "Something went wrong.",
      duration: 5000,
    });
  } finally {
    setSaving(false);
  }
}


  const [promoApplied, setPromoApplied] = React.useState(false);
  const [tipApplied, setTipApplied] = React.useState(false);

  function togglePromo() {
    if (!promoApplied) {
      if (!coupon.trim()) return;
      setPromoApplied(true);
    } else {
      setPromoApplied(false);
      setCoupon("");
    }
  }
  function toggleTip() {
    if (!tipApplied) {
      if (!tip.trim()) return;
      setTipApplied(true);
    } else {
      setTipApplied(false);
      setTip("");
    }
  }

  const onChangeAdjustment = (s: string) => {
    if (finalPriceApplyTimer.current) {
      window.clearTimeout(finalPriceApplyTimer.current);
      finalPriceApplyTimer.current = null;
    }
    if (finalPrice.trim() !== "") setFinalPrice("");
    setAdjustmentAmount(sanitizeMoney(s));
  };

  const onChangeFinal = (s: string) => {
    setFinalPrice(sanitizeMoney(s));
  };

  const formatCardNumber = (s: string) => {
    const digits = s.replace(/\D/g, "").slice(0, 19);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  };
  const formatExp = (s: string) => {
    const d = s.replace(/\D/g, "").slice(0, 4);
    if (d.length <= 2) return d;
    return `${d.slice(0, 2)}/${d.slice(2)}`;
  };

  const [cardNum, setCardNum] = React.useState("");
  const [cardExp, setCardExp] = React.useState("");
  const [cardCvc, setCardCvc] = React.useState("");

  const applyFinalAsAdjustment = () => {
    if (!finalPrice.trim()) return;

    const finalNum = currencyToNumber(finalPrice);
    const basePlusTip = subtotal + currencyToNumber(tip);
    let delta = finalNum - basePlusTip;

    if (Math.abs(delta) < 0.005) delta = 0;

    setAdjustmentAmount(delta.toFixed(2));
    setFinalPrice("");
  };

  const onFinalKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      applyFinalAsAdjustment();
    }
  };


const onSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (saving) return;
  setSubmitted(true);

  const { cust, other, messages } = validateFull();
  setCustErrors(cust);
  setOtherErrors(other);

  if (Object.keys(cust).length || Object.keys(other).length) {
    setSubmitError(messages[0] ?? "Please correct the highlighted fields.");
    return;
  }

  setSubmitError(null);
  setSaving(true);

  try {
    const payload = toBookingPayload();

    // ──────────────────────────────────────────────
    // 1) If editing an existing booking, sync the
    //    canonical customer + default address too.
    // ──────────────────────────────────────────────
    if (mode === "editBooking") {
      const customerId = savedCustomerId ?? initial?.customer?.id;
      if (customerId) {
        const coreFields = {
          firstName,
          lastName,
          email,
          phone,
          companyName: companyName || undefined,
          status: "active" as const,
        };

        const addressFields = {
          address,
          city,
          state,
          zip,
          locationId: selectedLocationId || null,
        };

        // Update main customer row (flat fields + fallback address)
        await updateCustomer(customerId, {
          ...coreFields,
          ...addressFields,
        });

        // Update the real default address record, if we know it
        if (defaultAddressId != null) {
          await updateAddress(customerId, defaultAddressId, {
            ...addressFields,
            isDefault: true,
          });
        }
      }
    }

    // ──────────────────────────────────────────────
    // 2) Booking itself (create or edit)
    // ──────────────────────────────────────────────
    if (onComplete) {
      await onComplete(payload);
    } else {
      if (mode === "createBooking") {
        await createBooking(payload as any);
      } else if (mode === "editBooking" && typeof (initial as any)?.id === "number") {
        await updateBooking((initial as any).id, payload as any);
      }
    }

    const successMsg =
      mode === "createBooking" ? "Booking completed" : "Changes saved";

    toast.success({
      title: successMsg,
      description:
        mode === "createBooking"
          ? "Staying on this page (mock)."
          : undefined,
    });
  } catch (err: any) {
    toast.error({
      title: "Save failed",
      description: err?.message ?? "Something went wrong while saving.",
      duration: 5000,
    });
  } finally {
    setSaving(false);
  }
};


const title =
  titleOverride ??
  (mode === "createBooking"
    ? "Create Booking"
    : mode === "editBooking"
    ? recurrenceDetails
      ? "Recurring Details"
      : "Edit Booking"
    : "Edit Quote");

  const backCrumb =
    mode === "editQuote"
      ? { href: "/admin/quotes", label: "Quotes" }
      : { href: "/admin/bookings", label: "Bookings" };

const [copied, setCopied] = React.useState(false);
const [showExpire, setShowExpire] = React.useState(false);
const [showEmail, setShowEmail] = React.useState(false);
const [emailTo] = React.useState(initial?.customer?.email ?? "");
const [showHistory, setShowHistory] = React.useState(false);
const [cancelModalType, setCancelModalType] =
  React.useState<null | "plain" | "percent">(null);
const [cancelSubmitting, setCancelSubmitting] = React.useState(false);

const shareUrl =
  mode === "editQuote"
    ? (quoteUI?.shareUrl ??
       ((typeof window !== "undefined" ? window.location.origin : "") +
         (initial?.quoteId ? `/quote/${initial.quoteId}` : "")))
    : "";

const historyItems = React.useMemo(
  () => (quoteUI?.history?.length ? quoteUI.history : []),
  [quoteUI?.history]
);

async function copyShareLink() {
  if (!shareUrl) return;
  try {
    await navigator.clipboard.writeText(shareUrl);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = shareUrl;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }
  setCopied(true);
  window.setTimeout(() => setCopied(false), 1600);
}


const emailData = React.useMemo(() => ({
  quoteId: initial?.quoteId ?? 0,
  shareUrl: shareUrl || "",
  firstName: initial?.customer?.firstName,
  lastName: initial?.customer?.lastName,
  email: initial?.customer?.email,
  phone: initial?.customer?.phone,
  address,
  city,
  state,
  zip,
  date,
  time,
 
 serviceCategory: (categories ?? []).find((c: Category) =>
  String(c.id) === String(tos.categoryId)
)?.name,

serviceName: (services ?? []).find((s: Service) =>
  String(s.id) === String(tos.serviceId)
)?.name,

frequency: (frequencies ?? []).find((f: Frequency) =>
  String(f.id) === String(tos.frequencyId)
)?.name,
  variables: altSelectedVarRows.map(v => ({ name: v.name, qty: v.qty })),  
  extras: extrasDetailed.map(e => ({ name: e.name, qty: e.qty })),
  discountCode: coupon || null,
  total: computedTotal,
  createdBy: undefined,
}), [
  initial, shareUrl, address, city, state, zip, date, time,
  categories, tos.categoryId, services, tos.serviceId,
  variablesDetailed, extrasDetailed, frequencies, tos.frequencyId, coupon, computedTotal
]);


  return (
    <form className="space-y-4 sm:space-y-6" onSubmit={onSubmit} noValidate>
      {/* Breadcrumb */}
      <nav className="flex items-center text-gray-700" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <Link
              to={backCrumb.href}
              className="inline-flex items-center text-xs font-medium text-gray-700 hover:text-gray-600 sm:text-sm"
            >
              {backCrumb.label}
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
                {title}
              </span>
            </div>
          </li>
        </ol>
      </nav>

      {/* Header */}
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-black text-white sm:h-12 sm:w-12">
          <HiClipboardList className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold sm:text-2xl">{title}</h1>
          <p className="text-xs text-gray-500 sm:text-sm">
            Enter customer, service, and pricing details
          </p>
        </div>
      </div>

       {mode === "editBooking" && recurrenceDetails && (
        <RecurringDetailsBar
          repeatsText={recurrenceDetails.repeatsText}
          timeslotText={recurrenceDetails.timeslotText}
          startDateText={recurrenceDetails.startDateText}
          nextJobText={recurrenceDetails.nextJobText}
          onCancelRecurring={recurrenceDetails.onCancelRecurring}
          cancelDisabled={recurrenceDetails.cancelDisabled}
        />
      )}

      {submitError && Object.keys(custErrors).length === 0 && (
        <Alert color="warning" icon={HiExclamationCircle}>
          <span className="text-xs sm:text-sm">{submitError}</span>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
        <div className="space-y-4 sm:space-y-6 lg:col-span-2">
{mode === "editQuote" && (
  <div className="items-center gap-2 grid grid-cols-2 ">
    <Button
      type="button"
      color="light"
      className="h-9 cursor-pointer"
      onClick={copyShareLink}
    >
      <span className="inline-flex items-center gap-2 text-xs sm:text-sm">
        <HiLink className="h-4 w-4" />
        {copied ? "Copied!" : "Copy Share Link"}
      </span>
    </Button>

    <Button
      type="button"
      color="light"
      className="h-9 cursor-pointer"
      onClick={() => setShowExpire(true)}
    >
      <span className="inline-flex items-center gap-2 text-xs sm:text-sm">
        <HiClock className="h-4 w-4" />
        Change Expiration
      </span>
    </Button>

    <Button
  type="button"
  color="light"
  className="h-9 cursor-pointer"
  onClick={() => setShowEmail(true)}
  disabled={!shareUrl}
  title={!shareUrl ? "No share URL yet" : ""}
  ><span className="inline-flex items-center gap-2 text-xs sm:text-sm">
        <HiClock className="h-4 w-4" />
        Email Qoute
      </span></Button>

    <Button
      type="button"
      color="light"
      className="h-9 cursor-pointer"
      onClick={() => setShowHistory(true)}
      title={!historyItems.length ? "No history yet" : ""}
    >
      <span className="inline-flex items-center gap-2 text-xs sm:text-sm">
        <HiCollection className="h-4 w-4" />
        View History {historyItems.length ? `(${historyItems.length})` : ""}
      </span>
    </Button>
  </div>
)}
          <CollapsibleCard title="Customer Information" defaultOpen>
            <div ref={customerCardRef}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="relative customer-field-wrapper">
                <Label className="mb-1 block sm:mb-2 text-sm">First Name</Label>
                <TextInput
                  value={firstName}
                  onChange={(e) => { setFirstName(e.target.value); if (savedCustomerId) setSavedCustomerId(undefined); }}
                  onFocus={() => { setActiveCustField("first"); if (custMatches.length) setShowCustMatches(true); }}
                onBlur={() => setTimeout(() => setActiveCustField(f => f === "first" ? null : f), 0)}
                  placeholder="Enter First Name"
                autoComplete="given-name"
                error={showCustError && !!custErrors.firstName}
                 />

                {activeCustField === "first" && showCustMatches && (
                  <CustomerSuggestPanel
                    matches={custMatches}
                    onPick={(c) => populateFromCustomer(c)}
                    onClose={() => setShowCustMatches(false)}
                  />
                )}

                {showCustError && custErrors.firstName && (
                  <HelperText color="failure" className="mt-1">{custErrors.firstName}</HelperText>
                )}
              </div>



             <div className="relative customer-field-wrapper">
              <Label className="mb-1 block sm:mb-2 text-sm">Last Name</Label>
            <TextInput
              value={lastName}
              onChange={(e) => { setLastName(e.target.value); if (savedCustomerId) setSavedCustomerId(undefined); }}
              onFocus={() => { setActiveCustField("last"); if (custMatches.length) setShowCustMatches(true); }}
              onBlur={() => setTimeout(() => setActiveCustField(f => f === "last" ? null : f), 0)}
              placeholder="Enter Last Name"
              autoComplete="family-name"
              error={showCustError && !!custErrors.lastName}
              />

              {activeCustField === "last" && showCustMatches && (
                <CustomerSuggestPanel
                  matches={custMatches}
                  onPick={(c) => populateFromCustomer(c)}
                  onClose={() => setShowCustMatches(false)}
                />
              )}

              {showCustError && custErrors.lastName && (
                <HelperText color="failure" className="mt-1">{custErrors.lastName}</HelperText>
              )}
            </div>


            <div className="relative customer-field-wrapper">
              <Label className="mb-1 block sm:mb-2 text-sm">Email</Label>
              <TextInput
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (savedCustomerId) setSavedCustomerId(undefined); }}
              onFocus={() => { setActiveCustField("email"); if (custMatches.length) setShowCustMatches(true); }}
            onBlur={() => setTimeout(() => setActiveCustField(f => f === "email" ? null : f), 0)}
            placeholder="Enter Email"
            autoComplete="email"
              error={showCustError && !!custErrors.email}
              />

              {activeCustField === "email" && showCustMatches && (
                <CustomerSuggestPanel
                  matches={custMatches}
                  onPick={(c) => populateFromCustomer(c)}
                  onClose={() => setShowCustMatches(false)}
                />
              )}

              {showCustError && custErrors.email && (
                <HelperText color="failure" className="mt-1">{custErrors.email}</HelperText>
              )}
            </div>


                <div>
                  <Label className="mb-1 block sm:mb-2 text-sm">Phone</Label>
                  <PhoneInput
                    value={phone}
                    onChange={(formatted) => setPhone(formatted)}
                    aria-invalid={showCustError && !!custErrors.phone}
                    error={showCustError && !!custErrors.phone}
                    placeholder="(800) 555-1212"
                  />
                  {showCustError && custErrors.phone && (
                    <HelperText id="phone-error" color="failure" className="mt-1">
                      {custErrors.phone}
                    </HelperText>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <Label className="mb-1 block sm:mb-2 text-sm">Company Name</Label>
                  <TextInput
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="(Optional)"
                    autoComplete="organization"
                  />
                </div>
              </div>
            </div>
          </CollapsibleCard>

          {/* Address */}
          <CollapsibleCard title="Address" defaultOpen>
            <div className="grid grid-cols-1 gap-4 ">
              <div>
                <Label className="mb-1 block sm:mb-2 text-sm">Address</Label>
               <TextInput
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter Address"
                              />
              </div>

              <div className="grid min-w-0 grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
                <div className="min-w-0">
                  <Label className="mb-1 block sm:mb-2 text-sm">City</Label>
                 <TextInput
                  value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Enter City"
                  />

                </div>

                <div className="min-w-0">
                  <div className="grid grid-cols-5 gap-3 sm:gap-4">
                    <div className="col-span-2 min-w-0">
                      <Label className="mb-1 block sm:mb-2 text-sm">State</Label>
                      <USStateSelect
                        value={state}
                        onChange={(abbr) => setState(abbr)}
                        error={false}
                        className="w-full cursor-pointer"
                      />
                    </div>
                    <div className="col-span-3 min-w-0">
                      <Label className="mb-1 block sm:mb-2 text-sm">Zip Code</Label>
                      <ZipCodeInput
                        value={zip}
                        onChange={(z) => setZip(z)}
                        error={false}
                        className="w-full"
                        placeholder="Enter Zip Code"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <CheckboxDropdown
                label="Location"
                items={locationItems}
                values={locationIds.length ? [String(locationIds[0])] : []}
                onChange={(next) => {
                  setLocationIds(next.length ? [Number(next[0])] : []);
                  setLocationAutoFromZip(false);
                }}
                single
                placeholder={locationItems.length ? "Select location" : "No locations"}
                disabled={anyLoading || locationItems.length === 0}
              />


            </div>
          </CollapsibleCard>

         {IS_CREATE && (
  <div className="flex justify-end">
    <Button
      type="button"
      color="gray"
      className="w-50 h-11 cursor-pointer"
      onClick={async () => {
        setCustomerSubmitted(true);

        const errs = validateCustomer();
        setCustErrors(errs);
        if (Object.keys(errs).length > 0) return;

        // Existing customer? (from autocomplete, initial, or prefillBooking)
        const existingId =
          savedCustomerId ?? (initial?.customer?.id as number | undefined);

        const coreFields = {
          firstName,
          lastName,
          email,
          phone,
          companyName: companyName || undefined,
          status: "active" as const,
        };

        const addressFields = {
          address,
          city,
          state,
          zip,
          locationId: selectedLocationId || null,
        };

        try {
          let customerId = existingId;

          // ─────────────────────────────
          // 1) Create or update customer
          // ─────────────────────────────
          if (customerId) {
            // UPDATE EXISTING CUSTOMER (flat row)
            await updateCustomer(customerId, {
              ...coreFields,
              ...addressFields,
            });
          } else {
            // CREATE NEW CUSTOMER
            const created = await addCustomer({
              ...coreFields,
              ...addressFields,
            });

            customerId =
              (created as any)?.data?.id ??
              (created as any)?.id ??
              undefined;

            if (!customerId) {
              throw new Error("Could not determine new customer id.");
            }

            setSavedCustomerId(customerId);
          }

          // ─────────────────────────────
          // 2) Sync multi-address default
          // ─────────────────────────────
          if (customerId) {
            let addrId = defaultAddressId;

            // If we don't know the default yet, try to infer from customers[]
            if (!addrId) {
              const existing = (customers as Customer[]).find(
                (c) => Number(c.id) === Number(customerId)
              );
              const def =
                existing?.addresses?.find((a) => a.isDefault) ??
                existing?.addresses?.[0];

              if (def?.id) {
                addrId = def.id;
                setDefaultAddressId(def.id);
              }
            }

            if (addrId) {
              // Update the known default address row
              await updateAddress(customerId, addrId, {
                ...addressFields,
                isDefault: true,
              });
            } else {
              // No address row yet → create a default one
              const createdAddr = await addAddress(customerId, {
                ...addressFields,
                isDefault: true,
              });
              if ((createdAddr as any)?.id) {
                setDefaultAddressId((createdAddr as any).id);
              }
            }
          }

          // ─────────────────────────────
          // 3) Notify parent / toast
          // ─────────────────────────────
          if (onQuickSaveCustomer && customerId) {
            await onQuickSaveCustomer({
              id: customerId,
              firstName,
              lastName,
              email,
              phone,
              companyName,
            });
          }

          toast.success({
            title: "Customer saved",
            description: "Customer details and address have been updated.",
          });
        } catch (err: any) {
          console.error("Customer quick save failed", err);
          toast.error({
            title: "Quick save failed",
            description:
              err?.message ?? "We couldn’t save this customer. Please try again.",
          });
        }
      }}
    >
      Customer Quick Save
    </Button>
  </div>
)}




          {/* Service Details */}
          <CollapsibleCard title="Service Details" defaultOpen>
            <div className="space-y-4">
              <TypeOfServiceSection
                value={tos}
                onChange={setTos}
                categories={categoriesForTOS}
                frequencies={frequenciesForService}
                autoSeedDefaults={mode === "createBooking"}
                errors={{
                  frequencyId: submitted ? otherErrors.frequencyId : undefined,
                  categoryId:  submitted ? otherErrors.categoryId  : undefined,
                  serviceId:   submitted ? otherErrors.serviceId   : undefined,
                }}
              />
            </div>

            {/* Variables */}
            <div className="mt-3 space-y-2">
              <h4 className="mb-1 text-sm font-medium text-gray-700">Variables</h4>
              {variablesForService.map((v: any) => {
                const idStr = String(v.id ?? v.key ?? v.value);
                const unit = toNum(v?.price_amount ?? v?.price ?? v?.amount, 0);
                const min = getVarMin(idStr, variables, selectedService);
                const max = getVarMax(idStr, variables);
                const qtyStr = altVarQty[idStr] ?? String(min);
                const qtyNum = Math.max(min, parseInt(qtyStr, 10) || min);
                const isSF = isSquareFeetVar(v);

                const items =
                  !isSF
                    ? buildIntOptions(min, Math.min(max, min + 500)).map((n) => ({
                        value: String(n),
                        label: String(n),
                      }))
                    : [];

                return (
                  <div
                    key={idStr}
                    className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-gray-700">
                        {v?.name ?? `Variable #${idStr}`}
                      </div>
                      <div className="text-xs text-gray-500">Unit: {formatCurrency(unit)}</div>
                    </div>

                    {isSF ? (
                      <div className="flex items-center rounded-md border border-gray-300">
                        <button
                          type="button"
                          onClick={() => {
                            const next = Math.max(min, qtyNum - 1);
                            setAltVarQtyClamped(idStr, next, variables, selectedService);
                            setAltVarText((p) => ({ ...p, [idStr]: String(next) }));
                          }}
                          className="cursor-pointer px-2 py-1 text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={qtyNum <= min}
                          aria-label={`Decrease ${v?.name ?? `Variable #${idStr}`} quantity`}
                        >
                          –
                        </button>

                        <input
                          value={altVarText[idStr] ?? qtyStr}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/[^\d]/g, "");
                            setAltVarText((p) => ({ ...p, [idStr]: raw }));
                          }}
                          onBlur={() => commitVarText(idStr, variables, selectedService, min)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              commitVarText(idStr, variables, selectedService, min);
                            }
                          }}
                          inputMode="numeric"
                          placeholder={String(min)}
                          className="w-12 border-l border-r border-gray-300 py-1 text-center text-sm focus:outline-none"
                          aria-label={`${v?.name ?? `Variable #${idStr}`} quantity`}
                        />

                        <button
                          type="button"
                          onClick={() => {
                            const next = qtyNum + 1;
                            setAltVarQtyClamped(idStr, next, variables, selectedService);
                            setAltVarText((p) => ({ ...p, [idStr]: String(next) } ));
                          }}
                          className="cursor-pointer px-2 py-1 text-gray-700 hover:bg-gray-100"
                          aria-label={`Increase ${v?.name ?? `Variable #${idStr}`} quantity`}
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <div className="w-24">
                        <CheckboxDropdown
                          items={items}
                          values={[String(qtyNum)]}
                          onChange={(next) => {
                            const chosen = next[0] ?? String(min);
                            setAltVarQtyClamped(idStr, chosen, variables, selectedService);
                            setAltVarText((p) => ({ ...p, [idStr]: String(chosen) } ));
                          }}
                          single
                          placeholder="Select…"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Add Ons */}
            <div className="mt-4 space-y-2">
              <h4 className="mb-1 text-sm font-medium text-gray-700">Add Ons</h4>

              <CheckboxDropdown
                items={addonItemsAlt}
                values={altSelectedAddonIds}
                onChange={(next) => {
                setAltSelectedAddonIds(next);
                const nextSet = new Set(next);
                setAltAddonQty((prev) => {
                  const out = { ...prev };
                  addonOptionsForService.forEach((a) => {
                    if (nextSet.has(String(a.id)) && out[a.id] == null) {
                      out[a.id] = 1; 
                    }
                  });
                  Object.keys(out).forEach((k) => {
                    if (!nextSet.has(String(k))) delete out[parseInt(k, 10)];
                  });
                  return out;
                });
              }}

                placeholder={
                  !tos.serviceId
                    ? "Pick a service first"
                    : addonItemsAlt.length
                    ? "Choose add ons…"
                    : "No add ons for this service"
                }
                disabled={!tos.serviceId || addonItemsAlt.length === 0}
              />

              {altSelectedAddonRows.length === 0 ? (
  <div className="text-sm text-gray-500" />
) : (
  altSelectedAddonRows.map((a) => {
    const unit = Number(a.price ?? 0);

    // 🔸 Non-quantity-based: no stepper, implicitly qty = 1
    if (!a.quantityBased) {
      return (
        <div
          key={a.id}
          className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2"
        >
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-gray-700">
              {a.name}
            </div>
            <div className="text-xs text-gray-500">
              Unit: {formatCurrency(unit)} 
            </div>
          </div>
        </div>
      );
    }

    // 🔹 Quantity-based: show the - [qty] + stepper
    return (
      <div
        key={a.id}
        className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2"
      >
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-gray-700">
            {a.name}
          </div>
          <div className="text-xs text-gray-500">
            Unit: {formatCurrency(unit)}
          </div>
        </div>

        <div className="flex items-center rounded-md border border-gray-300">
          <button
            type="button"
            onClick={() =>
              setAltAddonQty((p) => {
                const next = Math.max(1, (p[a.id] ?? 1) - 1);
                setAltAddonText((t) => ({ ...t, [a.id]: String(next) }));
                return { ...p, [a.id]: next };
              })
            }
            className="cursor-pointer px-2 py-1 text-gray-700 hover:bg-gray-100"
            aria-label={`Decrease ${a.name} quantity`}
          >
            –
          </button>

          <input
            value={altAddonText[a.id] ?? String(altAddonQty[a.id] ?? 1)}
            onChange={(e) => {
              const raw = e.target.value.replace(/[^\d]/g, "");
              setAltAddonText((t) => ({ ...t, [a.id]: raw }));
            }}
            onBlur={() => {
              const raw = (altAddonText[a.id] ?? "").replace(/[^\d]/g, "");
              const parsed = raw === "" ? NaN : parseInt(raw, 10);
              const clamped = Number.isFinite(parsed) ? Math.max(1, parsed) : 1;
              setAltAddonQty((p) => ({ ...p, [a.id]: clamped }));
              setAltAddonText((t) => ({ ...t, [a.id]: String(clamped) }));
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const raw = (altAddonText[a.id] ?? "").replace(/[^\d]/g, "");
                const parsed = raw === "" ? NaN : parseInt(raw, 10);
                const clamped = Number.isFinite(parsed) ? Math.max(1, parsed) : 1;
                setAltAddonQty((p) => ({ ...p, [a.id]: clamped }));
                setAltAddonText((t) => ({ ...t, [a.id]: String(clamped) }));
              }
            }}
            inputMode="numeric"
            className="w-12 border-l border-r border-gray-300 py-1 text-center text-sm focus:outline-none"
            aria-label={`${a.name} quantity`}
          />

          <button
            type="button"
            onClick={() =>
              setAltAddonQty((p) => {
                const next = (p[a.id] ?? 1) + 1;
                setAltAddonText((t) => ({ ...t, [a.id]: String(next) }));
                return { ...p, [a.id]: next };
              })
            }
            className="cursor-pointer px-2 py-1 text-gray-700 hover:bg-gray-100"
            aria-label={`Increase ${a.name} quantity`}
          >
            +
          </button>
        </div>
      </div>
    );
  })
)}


            </div>
          </CollapsibleCard>

          {/* Schedule */}
          <CollapsibleCard title="Schedule" defaultOpen>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 ">
              <div>
                <Label className="mb-1 block sm:mb-2 text-sm">Date</Label>
               <DatePicker
                value={fromISODate(date)}               
                onChange={(d) => setDate(d ? toISODate(d) : "")} 
                placeholder="Select date"
                inputClassName="text-sm"
              />

              </div>

              <div>
                <Label className="mb-1 block sm:mb-2 text-sm">Time</Label>
              <TimePicker
              disabled={isCustomerBlocked}
              value={time || null}
              onChange={(t) => setTime(t ?? "")}
              placeholder={isCustomerBlocked ? "Customer is blocked" : "Select time"}
              inputClassName="text-sm"
              helperText={
                isCustomerBlocked
                  ? "This customer is blocked and cannot select a booking time."
                  : undefined
              }
            />
              </div>
            </div>

            <div className="mt-4">
              <h4 className="mb-1 text-sm sm:mb-2">Assign Team</h4>
              <MultiSelectDropdown
                
                placeholder={teamOptions.length ? "Select team" : "No teams"}
                options={teamOptions}
                max={1}
                selected={teamIds}
                onChange={(ids) => setTeamIds(ids.slice(0, 1))}
                disabled={anyLoading || teamOptions.length === 0}
                modalTitle="Select Team"
              />
            </div>
          </CollapsibleCard>

          {/* Notes & Comments */}
          <CollapsibleCard title="Notes & Comments" defaultOpen>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label className="mb-1 block sm:mb-2 text-sm">Staff Notes (Internal)</Label>
                <textarea
                  rows={4}
                  className={`${baseInput} ${okInput} resize-y`}
                  value={staffNotes}
                  onChange={(e) => setStaffNotes(e.target.value)}
                  placeholder="Internal notes for staff..."
                />
              </div>
              <div>
                <Label className="mb-1 block sm:mb-2 text-sm">Customer Notes</Label>
                <textarea
                  rows={4}
                  className={`${baseInput} ${okInput} resize-y`}
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  placeholder="Notes from customer..."
                />
              </div>
            </div>
          </CollapsibleCard>

          {/* Payments */}
          <CollapsibleCard title="Payments" defaultOpen>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <div className="relative">
                  <CheckboxDropdown
                    label="Payment Method"
                    items={paymentItems}
                    values={paymentMethod ? [paymentMethod] : []}
                    onChange={(next) =>
                      setPaymentMethod(((next[0] ?? "") as "" | "card" | "cash" | "check"))
                    }
                    single
                    placeholder="Select Payment Method"
                  />
                </div>
              </div>

              <SmoothReveal show={paymentMethod === "card"}>
                <div className="pt-1">
                  <Label className="mb-1 block sm:mb-2 text-sm">Credit Card </Label>
                 <div className={`${field()} flex items-center gap-3 py-2 pr-3 sm:py-2.5`}>
                    <input
                      className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-0"
                      placeholder="Card number"
                      inputMode="numeric"
                      autoComplete="cc-number"
                      value={cardNum}
                      onChange={(e) => setCardNum(formatCardNumber(e.target.value))}
                    />
                    <input
                      className="w-[84px] border-0 bg-transparent p-0 text-right text-sm placeholder:text-gray-400 focus:outline-none focus:ring-0"
                      placeholder="MM / YY"
                      inputMode="numeric"
                      autoComplete="cc-exp"
                      value={cardExp}
                      onChange={(e) => setCardExp(formatExp(e.target.value))}
                      maxLength={7}
                    />
                    <input
                      className="w-[56px] border-0 bg-transparent p-0 text-right text-sm placeholder:text-gray-400 focus:outline-none focus:ring-0"
                      placeholder="CVC"
                      inputMode="numeric"
                      autoComplete="cc-csc"
                      value={cardCvc}
                      onChange={(e) =>
                        setCardCvc(e.target.value.replace(/\D/g, "").slice(0, 4))
                      }
                      maxLength={4}
                    />
                  </div>
                </div>
              </SmoothReveal>
            </div>
          </CollapsibleCard>
        </div>

        <aside className="space-y-4 sm:space-y-6 lg:sticky lg:top-2 lg:self-start">
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="bg-gray-600 px-4 py-3 text-white">
              <h3 className="text-base font-semibold">Summary</h3>
            </div>

            <div className="p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">Service</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(baseServicePrice)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">Add ons</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(extrasTotal)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">Discount</span>
                  <span className="font-medium ">{formatCurrency(0)}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">Adjustment</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(currencyToNumber(adjustmentAmount))}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">Tip</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(currencyToNumber(tip))}
                  </span>
                </div>
              </div>

              {/* promo + tip */}
              <div className="mt-4 space-y-3">
                <div className="grid grid-cols-8 gap-2">
                  <TextInput
                    className={`col-span-6 ${promoApplied ? "bg-gray-100" : ""}`}
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                    placeholder="Enter Promo Code/Gift Card"
                    disabled={promoApplied}
                  />
                  <Button
                    type="button"
                    onClick={togglePromo}
                    onMouseUp={(e) => (e.currentTarget as HTMLButtonElement).blur()}
                    color={promoApplied ? "failure" : "light"}
                    className="col-span-2 h-10 cursor-pointer focus:outline-none focus:ring-0"
                  >
                    {promoApplied ? "Remove" : "Apply"}
                  </Button>
                </div>

                <div className="grid grid-cols-8 gap-2">
                  <div className="relative col-span-6">
                    <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                      $
                    </span>
                    <MoneyInput
                      id="tip"
                      aria-label="Tip"
                      value={tip}
                      onChange={setTip}
                      allowNegative={false}
                      onBlur={applyFinalAsAdjustment}
                      onKeyDown={onFinalKeyDown}
                      placeholder="Enter Tip"
                     className={`${field()} ${tipApplied ? "bg-gray-100" : ""}`}
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={toggleTip}
                    onMouseUp={(e) => (e.currentTarget as HTMLButtonElement).blur()}
                    color={tipApplied ? "failure" : "light"}
                    className="col-span-2 h-10 cursor-pointer focus:outline-none focus:ring-0"
                  >
                    {tipApplied ? "Remove" : "Apply"}
                  </Button>
                </div>
              </div>

              {/* total */}
              <div className="mt-5 border-t border-gray-200 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold text-gray-900">Total</span>
                  <span className="text-2xl font-extrabold text-gray-900">
                    {formatCurrency(computedTotal)}
                  </span>
                </div>
              </div>

              {frequencyDiscountPct > 0 && (
                <div className="mt-2 mb-2 flex items-center justify-between text-sm">
                  <span className="text-gray-700">Next Booking&apos;s Total</span>
                  <span className="font-medium">{formatCurrency(nextBookingTotal)}</span>
                </div>
              )}
              <div>
                <button
                  type="button"
                  onClick={() => setShowPriceAdj((v) => !v)}
                  className="flex w-full items-center justify-between bg-white py-3 text-left"
                >
                  <span className="text-sm font-semibold text-gray-900">Price Adjustments</span>
                  <HiChevronDown
                    className={`h-5 w-5 text-gray-500 transition-transform ${
                      showPriceAdj ? "rotate-180" : ""
                    }`}
                    aria-hidden
                  />
                </button>

                {showPriceAdj && (
                  <div className="space-y-4 border-t border-gray-200">
                    <div>
                      <div className="mb-4"></div>
                      <div className="relative">
                        <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                          $
                        </span>
                        <MoneyInput
                          id="adjustment"
                          aria-label="Price Adjustment"
                          value={adjustmentAmount}
                          onChange={(v) => onChangeAdjustment(v)}
                          allowNegative
                          onBlur={applyFinalAsAdjustment}
                          onKeyDown={onFinalKeyDown}
                           placeholder="Enter adjustment" 
                          className={`${baseInput} ${okInput}`}
                        />
                      </div>
                      <HelperText className="mt-1 text-xs text-gray-500">
                        Enter a +/− amount to adjust the subtotal, or
                      </HelperText>
                    </div>

                    <div>
                      <div className="relative">
                        <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                          $
                        </span>
                        <MoneyInput
                          id="finalPrice"
                          aria-label="Final Price"
                          value={finalPrice}
                          onBlur={applyFinalAsAdjustment}
                          onKeyDown={onFinalKeyDown}
                          onChange={(v) => onChangeFinal(v)}
                          allowNegative={false}
                           placeholder="Enter adjustment" 
                         className={field()}
                        />
                      </div>
                      <HelperText className="mt-1 text-xs text-gray-500">
                        Enter your Final Price
                      </HelperText>
                    </div>

                    <div>
                      <textarea
                        rows={3}
                        className={`${baseInput} ${okInput} resize-y`}
                        value={adjustmentComment}
                        onChange={(e) => setAdjustmentComment(e.target.value)}
                        placeholder="Enter comment"
                      />
                    </div>

                    <label className="flex cursor-pointer items-center gap-2">
                      <Checkbox
                        color="gray"
                        checked={adjustmentAppliesOnlyHere}
                        onChange={(e) => setAdjustmentAppliesOnlyHere(e.target.checked)}
                        className="cursor-pointer"
                      />
                      <span className="text-xs text-gray-700 underline">
                        Price Adjustment only applies to this booking
                      </span>
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions (conditional per mode) */}
          <div className="flex flex-col gap-4">
            {IS_CREATE && (
              <>
                <Button type="submit" color="black" className="h-11 w-full cursor-pointer">
                  Create Booking
                </Button>
                <Button
                  type="button"
                  color="gray"
                  className="h-11 w-full cursor-pointer"
                  onClick={onSaveQuote}
                >
                  Save as Quote
                </Button>
              </>
            )}

        
            {mode === "editBooking" && (
              <Button
                type="button"
                color="green"
                className="h-11 w-full cursor-pointer"
                onClick={() => {
                  const snapshot = buildPrefillFromCurrent();
                  nav("/admin/bookings/new", { state: { prefillBooking: snapshot } });
                }}
              >
                Book Again
              </Button>
            )}

             {mode === "editBooking" && (
              <Button type="submit" color="gray" className="h-11 w-full cursor-pointer">
                Save Changes
              </Button>
            )}
              {mode === "editBooking" && (
            <Button
              type="button"
              color="light"
              className="h-11 w-full cursor-pointer"
              onClick={() => setCancelModalType("plain")}
            >
              Cancel Booking
            </Button>
          )}

          {mode === "editBooking" && (
            <Button
              type="button"
              color="light"
              className="h-11 w-full cursor-pointer"
              onClick={() => setCancelModalType("percent")}
            >
              Cancel Booking with (%)
            </Button>
          )}

            

            {mode === "editQuote" && (
            <Button
            type="button"
            color="gray"
            className="h-11 w-full cursor-pointer"
            onClick={() => {
              const snapshot = buildPrefillFromCurrent();
              nav("/admin/bookings/new", { state: { prefillBooking: snapshot } });
            }}
          >
            Convert to Booking
          </Button>

          )}

          </div>
        </aside>
      </div>
       {mode === "editQuote" && showExpire && (
        <QuoteExpirationModal
          open={mode === "editQuote" && showExpire}
          createdAt={createdAt}           // can be null
          expiresAt={expiresAt}
          onClose={() => setShowExpire(false)}
          onSave={async (ymd) => { await quoteUI?.onChangeExpire?.(ymd); setShowExpire(false); }}
        />
        )}
        {mode === "editQuote" && showHistory && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
            role="dialog"
            aria-modal="true"
            onClick={() => setShowHistory(false)}
          >
            <div
              className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="mb-4 text-lg font-semibold text-gray-800">Quote History</h2>
              {historyItems.length === 0 ? (
                <p className="text-sm text-gray-600">No history yet.</p>
              ) : (
                <ul className="space-y-2">
                  {historyItems.map((h, i) => (
                    <li key={i} className="rounded-lg border border-gray-200 p-3">
                      <div className="text-xs text-gray-500">{h.date}</div>
                      <div className="text-sm font-medium text-gray-900">{h.action}</div>
                      {h.detail && <div className="text-sm text-gray-700">{h.detail}</div>}
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  className="rounded-lg bg-gray-600 px-4 py-2 text-sm text-white"
                  onClick={() => setShowHistory(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

    {mode === "editQuote" && (
      <EmailQuoteModal
        show={showEmail}
        onClose={() => setShowEmail(false)}
        to={emailTo}
        data={emailData}          
        onSend={async ({ to, subject, html }) => {
          await quoteUI?.onSendEmail?.({
            to,
            subject,
            message: html, 
            link: shareUrl,
          });
          toast.success({ title: "Email sent" });
        }}
      />
    )}
      {isCustomerBlocked && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          This customer is currently blocked and cannot schedule a booking.
        </div>
      )}


      {mode === "editBooking" && cancelModalType && (
  <CancelReasonModal
    open={!!cancelModalType}
    title="Cancel Booking"
    message={
      cancelModalType === "percent"
        ? "Are you sure you want to Cancel this Booking and apply the cancellation fee?"
        : "Are you sure you want to Cancel this Booking?"
    }
    confirmLabel="Yes"
    cancelLabel="Cancel"
    requireReason
    loading={cancelSubmitting}
    onClose={() => {
      if (!cancelSubmitting) setCancelModalType(null);
    }}
    onConfirm={async (reason) => {
  const bookingId = (initial as any)?.id;

  if (!bookingId) {
    toast.error({
      title: "Cancellation failed",
      description: "Missing booking id for this booking.",
    });
    return;
  }

  try {
    setCancelSubmitting(true);

    await cancelBooking(bookingId, {
      reason,
      scope: "single", // this modal cancels just this booking
      applyFee: cancelModalType === "percent",
    });

    toast.success({
      title: "Booking cancelled",
      description:
        cancelModalType === "percent"
          ? "Cancellation fee has been applied."
          : "This booking has been cancelled.",
    });

    setCancelModalType(null);

    // optional: go back to bookings list
    // nav("/admin/bookings");
  } catch (err: any) {
    console.error("Cancel booking failed", err);
    toast.error({
      title: "Cancellation failed",
      description:
        err?.message ?? "Something went wrong while cancelling this booking.",
    });
  } finally {
    setCancelSubmitting(false);
  }
}}

  />
)}


          </form>
        );
      }
