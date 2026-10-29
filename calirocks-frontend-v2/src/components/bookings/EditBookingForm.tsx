// src/components/bookings/EditBookingForm.tsx
import * as React from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Alert, Button, Spinner } from "flowbite-react";
import BookingForm from "./BookingForm";
import type { BookingFormState } from "../../types/bookings";
import { HiExclamationCircle } from "react-icons/hi";
import usePrivateService from "../../hooks/Auth/usePrivateService";

type BackendBooking = any;

type Props = {
  bookingId?: number;
  basePath?: string;
  booking?: BackendBooking;
  redirectToOnSave?: string;

  // NEW: if provided, use these instead of internal api.put/nav
  onSave?: (id: number, payload: any) => Promise<void> | void;
  onCancel?: () => Promise<void> | void;
};

/** 🔵 helper: format date-ish values to "Nov 19, 2025" */
function formatDateLabel(value: any): string {
  if (!value) return "";
  if (typeof value === "string" && /[a-zA-Z]/.test(value)) {
    // probably already human formatted, just return
    return value;
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * 🔵 Extract UI-friendly recurrence details from whatever
 * your backend sends on the booking record.
 *
 * Adjust the property names here to match your real payload.
 */
function buildRecurrenceDetailsFromBackend(b: BackendBooking | null) {
  if (!b) return undefined;

  // try a few common shapes
  const r =
    b.recurrence ??
    b.recurring ??
    b.recurrenceDetails ??
    b.recurringDetails ??
    null;

  if (!r) return undefined;

  // if backend has status + only show when active
  if (r.status && r.status !== "active") return undefined;

  const repeatsText =
    r.summary ??
    r.humanSummary ??
    r.rule_label ??
    r.ruleLabel ??
    r.repeatsText ??
    "";

  const startTime =
    r.startTime ?? r.window_start ?? r.start_time ?? r.timeStart;
  const endTime = r.endTime ?? r.window_end ?? r.end_time ?? r.timeEnd;

  const timeslotText =
    r.timeslotText ??
    r.timeWindow ??
    r.window ??
    (startTime && endTime ? `${startTime} - ${endTime}` : "");

  const startDateRaw =
    r.startDateFormatted ??
    r.startDatePretty ??
    r.startDate ??
    r.start_date;
  const nextDateRaw =
    r.nextJobDateFormatted ??
    r.nextJobPretty ??
    r.nextJobDate ??
    r.next_date ??
    r.nextDate;

  const startDateText = formatDateLabel(startDateRaw);
  const nextJobText = formatDateLabel(nextDateRaw);

  if (!repeatsText && !timeslotText && !startDateText && !nextJobText) {
    return undefined;
  }

  return {
    repeatsText,
    timeslotText,
    startDateText,
    nextJobText,
    // 🔴 If/when you have a concrete cancel endpoint, you can also
    // pass onCancelRecurring here from EditBookingForm.
  };
}

export default function EditBookingForm({
  bookingId,
  basePath = "/bookings",
  booking: bookingProp,
  redirectToOnSave = "/bookings",
  onSave,
  onCancel,
}: Props) {
  const params = useParams();
  const id = Number(bookingId ?? params.id);
  const api = usePrivateService();
  const nav = useNavigate();
  const location = useLocation();

  const locationState = (location.state || {}) as {
    fromRecurrences?: boolean;
    recurrenceDetails?: {
      repeatsText: string;
      timeslotText: string;
      startDateText: string;
      nextJobText: string;
    };
  };

  const [loading, setLoading] = React.useState<boolean>(!bookingProp);
  const [error, setError] = React.useState<string | null>(null);
  const [initial, setInitial] = React.useState<BookingFormState | null>(null);

  // 🔵 keep a copy of the raw backend booking so we can read recurrence data
  const [rawBooking, setRawBooking] = React.useState<BackendBooking | null>(
    bookingProp ?? null
  );

 function mapBackendToFormState(b0: BackendBooking): BookingFormState {
  const b =
    b0 && b0.success && Array.isArray(b0.data) ? b0.data[0] : b0;

  const safe = <T,>(v: T | undefined, d: T) =>
    v === undefined || v === null ? d : v;

  const customer = b.customer ?? b.user ?? {};
  const addr = b.address ?? b.addr ?? {};
  const service = b.service ?? {};
  const schedule = b.schedule ?? {};
  const pricing = b.pricing ?? b.price ?? {};
  const notes = b.notes ?? {};
  const payments = b.payments ?? {};

  const normArr = (arr: any, idKey = "id", qtyKey = "qty") =>
    Array.isArray(arr)
      ? arr.map((x) => ({
          id: Number(
            x?.[idKey] ??
              x?.variableId ??
              x?.variable_id ??
              x?.addonId ??
              x?.addon_id ??
              0
          ),
          qty: Number(x?.[qtyKey] ?? x?.quantity ?? 0),
          name: x?.name,
        }))
      : [];

  const variables = normArr(
    b.variables ?? service.variables ?? [],
    "id",
    "qty"
  );
  const addons = normArr(
    b.addons ?? service.addons ?? [],
    "id",
    "qty"
  );

  const frequencyId =
    service.frequencyId ??
    service.frequency_id ??
    b.frequencyId ??
    b.frequency_id ??
    "";

  return {
    // ✅ this is the key line
    id: b.id,   // make sure your backend record has `id`

    customer: {
      id: customer.id,
      firstName: safe(
        customer.firstName ?? customer.first_name,
        ""
      ),
      lastName: safe(
        customer.lastName ?? customer.last_name,
        ""
      ),
      email: safe(customer.email, ""),
      phone: safe(customer.phone, ""),
      companyName:
        customer.companyName ?? customer.company ?? null,
    },
    address: {
      address: safe(
        addr.address ?? addr.line1 ?? addr.street,
        ""
      ),
      city: safe(addr.city, ""),
      state: safe(addr.state ?? addr.region, ""),
      zip: safe(
        addr.zip ?? addr.postalCode ?? addr.postal_code,
        ""
      ),
      locationId:
        addr.locationId ?? addr.location_id ?? "",
    },
    service: {
      categoryId:
        service.categoryId ??
        service.category_id ??
        b.categoryId ??
        b.category_id ??
        "",
      serviceId:
        service.serviceId ??
        service.service_id ??
        b.serviceId ??
        b.service_id ??
        "",
      frequencyId: frequencyId || "",
      squareFeet:
        service.squareFeet ?? service.square_feet ?? null,
      variables: variables.map((v: any) => ({
        id: Number(v.id),
        name: v.name,
        qty: Number(v.qty),
      })),
      addons: addons.map((a: any) => ({
        id: Number(a.id),
        name: a.name,
        qty: Number(a.qty || 1),
      })),
    },
    schedule: {
      date: safe(schedule.date ?? b.date, ""),
      time: safe(schedule.time ?? b.time, ""),
      providerId:
        schedule.providerId ??
        schedule.teamId ??
        b.providerId ??
        b.teamId ??
        "",
    },
    notes: {
      staffNotes:
        notes.staffNotes ??
        notes.staff_notes ??
        b.staffNotes ??
        null,
      customerNotes:
        notes.customerNotes ??
        notes.customer_notes ??
        b.customerNotes ??
        null,
    },
    payments: {
      method:
        payments.method ??
        b.paymentMethod ??
        b.payment_method ??
        "",
    },
    pricing: {
      baseServicePrice: Number(
        pricing.baseServicePrice ??
          pricing.base_price ??
          b.baseServicePrice ??
          0
      ),
      extrasTotal: Number(pricing.extrasTotal ?? b.extrasTotal ?? 0),
      subtotal: Number(pricing.subtotal ?? b.subtotal ?? 0),
      adjustmentAmount: Number(
        pricing.adjustmentAmount ?? b.adjustmentAmount ?? 0
      ),
      finalPrice:
        pricing.finalPrice != null
          ? Number(pricing.finalPrice)
          : b.finalPrice != null
          ? Number(b.finalPrice)
          : null,
      tip: Number(pricing.tip ?? b.tip ?? 0),
      coupon: pricing.coupon ?? b.coupon ?? null,
      adjustmentComment:
        pricing.adjustmentComment ?? b.adjustmentComment ?? null,
      adjustmentAppliesOnlyHere: Boolean(
        pricing.adjustmentAppliesOnlyHere ??
          b.adjustmentAppliesOnlyHere ??
          true
      ),
      total: Number(pricing.total ?? b.total ?? 0),
    },
    status: (b.status as BookingFormState["status"]) ?? "scheduled",
    quoteId: b.quoteId,
  };
}


  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      if (bookingProp) {
        // 🔵 if booking is passed in via props, keep it as raw + map
        setRawBooking(bookingProp);
        setInitial(mapBackendToFormState(bookingProp));
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);

        // 1) fetch
        const res = await api.get(`${basePath}/${id}`);

        // 2) unwrap { success, data: [...] } or { data: {...} } or plain object
        const body = res?.data ?? res;
        const record = Array.isArray(body?.data)
          ? body.data[0]
          : body?.data ?? body;

        if (cancelled) return;

        // 🔵 keep raw booking for recurrence bar
        setRawBooking(record);

        // 3) map to form state
        setInitial(mapBackendToFormState(record));
      } catch (e: any) {
        if (!cancelled)
          setError(e?.message ?? "Failed to load booking.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (!Number.isFinite(id)) {
      setError("Invalid booking id.");
      setLoading(false);
      return;
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id, api, basePath, bookingProp]);

  const handleSave = React.useCallback(
    async (payload: any) => {
      if (onSave) {
        await onSave(id, payload); // delegate to parent if provided
      } else {
        await api.put(`${basePath}/${id}`, payload);
        nav(redirectToOnSave);
      }
    },
    [onSave, id, api, basePath, nav, redirectToOnSave]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner aria-label="Loading booking" size="lg" />
        <span className="ml-3 text-sm text-gray-600">
          Loading booking…
        </span>
      </div>
    );
  }
  if (error) {
    return (
      <div className="mx-auto max-w-3xl">
        <Alert color="failure" icon={HiExclamationCircle}>
          <span className="font-medium">Error:</span> {error}
        </Alert>
        <div className="mt-4">
          <Button
            color="light"
            onClick={() =>
              onCancel ? onCancel() : window.history.back()
            }
          >
            Go back
          </Button>
        </div>
      </div>
    );
  }
  if (!initial) {
    return (
      <div className="mx-auto max-w-3xl">
        <Alert color="warning" icon={HiExclamationCircle}>
          Booking not found.
        </Alert>
      </div>
    );
  }

  //  const openedFromRecurrences = !!locationState.fromRecurrences;
  const recurrenceFromState = locationState.recurrenceDetails;

const recurrenceDetails =
    recurrenceFromState ??
    buildRecurrenceDetailsFromBackend(rawBooking);

  return (
    <BookingForm
      mode="editBooking"
      initial={initial}
      onComplete={handleSave}
      onCancel={onCancel}
      // 🔵 this drives the blue "Repeats / Timeslot / Start Date / Next Job" bar
      recurrenceDetails={recurrenceDetails}
    />
  );
}
