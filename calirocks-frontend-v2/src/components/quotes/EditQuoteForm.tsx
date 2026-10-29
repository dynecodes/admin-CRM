import * as React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Alert, Button, Spinner } from "flowbite-react";
import { HiExclamationCircle } from "react-icons/hi";
import BookingForm from "../bookings/BookingForm";
import type { BookingFormState } from "../../types/bookings";
import usePrivateService from "../../hooks/Auth/usePrivateService";

type BackendQuote = {
  id: number;
  status: string;
  expirationAt?: string | null;
  expiresInDays?: number;
   createdAt?: string;   
  updatedAt?: string;      
  payload?: any;
  [k: string]: any;
};

type Props = {
  /** Optional override for quote id (if you don't use route params) */
  quoteId?: number;
  /** Optional API base path */
  basePath?: string; // default: "/quotes"
  /** Optional: pre-fetched quote to skip GET */
  quote?: BackendQuote;
  /** Optional success redirect; default: "/admin/quotes" */
  redirectToOnSave?: string;
  /** Optional: bookings endpoint for conversion; default: "/bookings" */
  bookingsPath?: string;
  ui?: {
    rootPath?: string;   // e.g. "/admin/quotes"
    rootLabel?: string;  // e.g. "Quotes"
    title?: string;      // e.g. "Quotation"
    subtitle?: string;   // e.g. "Update customer, service, and pricing details"
  };
  onSave?: (quoteId: number, payload: any) => Promise<void> | void;
};


// map quote status -> booking form status
function quoteToBookingStatus(s: string): BookingFormState["status"] {
  switch ((s || "").toLowerCase()) {
    case "accepted":
    case "converted":
      return "scheduled";        // ready to book
    case "declined":
    case "expired":
      return "archived";         // not actionable
    case "sent":
    case "draft":
    default:
      return "draft";
  }
}

export default function EditQuoteForm({
  quoteId,
  basePath = "/quotes",
  quote: quoteProp,
  redirectToOnSave = "/admin/quotes",
  bookingsPath = "/bookings",
}: Props) {
  const params = useParams();
  const id = Number(quoteId ?? params.id);
  const api = usePrivateService();
  const nav = useNavigate();

  const [loading, setLoading] = React.useState<boolean>(!quoteProp);
  const [error, setError] = React.useState<string | null>(null);
  const [initial, setInitial] = React.useState<BookingFormState | null>(null);
  const [rawQuote, setRawQuote] = React.useState<BackendQuote | null>(quoteProp ?? null);

  // ---------- small helpers ----------
  function toNumberOrEmpty(v: any): number | "" {
    if (v === null || v === undefined || v === "") return "";
    const n = Number(v);
    return Number.isFinite(n) ? n : "";
  }

  function normLines(arr: any, idKey = "id", qtyKey = "qty") {
    if (!Array.isArray(arr)) return [];
    return arr.map((x) => ({
      id: Number(
        x?.[idKey] ??
          x?.variableId ??
          x?.variable_id ??
          x?.addonId ??
          x?.addon_id ??
          0
      ),
      name: x?.name,
      qty: Number(x?.[qtyKey] ?? x?.quantity ?? 0),
    }));
  }

  /** Backend Quote -> BookingFormState (prefer snapshot in q.payload) */
  function mapBackendToFormState(q: BackendQuote): BookingFormState {
    const src = q?.payload ?? q;

    const fullName = (src.customerName || "").trim();
    const [firstFromFull = "", ...restLast] = fullName.split(" ");
    const lastFromFull = restLast.join(" ").trim();

    const firstName =
      src.firstName ?? src.first_name ?? src.customer?.firstName ?? firstFromFull ?? "";
    const lastName =
      src.lastName ?? src.last_name ?? src.customer?.lastName ?? lastFromFull ?? "";

    const variables = normLines(src.service?.variables ?? src.variables ?? [], "id", "qty");
    const addons = normLines(src.service?.addons ?? src.addons ?? [], "id", "qty");

    const date = src.schedule?.date ?? src.date ?? "";
    const time = src.schedule?.time ?? src.time ?? "";

    const addr =
      src.address && typeof src.address === "object"
        ? src.address
        : {
            address: src.address ?? src.addr?.line1 ?? src.addressLine1 ?? "",
            city: src.city ?? src.addr?.city ?? "",
            state: src.state ?? src.addr?.state ?? "",
            zip: src.zip ?? src.addr?.zip ?? src.addr?.postalCode ?? "",
            locationId: src.locationId ?? src.location_id ?? src.addr?.locationId ?? "",
          };

    const frequencyId = src.service?.frequencyId ?? src.frequencyId ?? src.frequency_id ?? "";
    const categoryId  = src.service?.categoryId  ?? src.categoryId  ?? src.category_id  ?? "";
    const serviceId   = src.service?.serviceId   ?? src.serviceId   ?? src.service_id   ?? "";

    return {
      customer: {
        id: src.customer?.id ?? src.customerId ?? src.customer_id,
        firstName: String(firstName ?? ""),
        lastName: String(lastName ?? ""),
        email: String(src.customer?.email ?? src.email ?? ""),
        phone: String(src.customer?.phone ?? src.phone ?? ""),
        companyName: src.customer?.companyName ?? src.companyName ?? null,
      },

      address: {
        address: String(addr.address ?? ""),
        city: String(addr.city ?? ""),
        state: String(addr.state ?? ""),
        zip: String(addr.zip ?? ""),
        locationId: toNumberOrEmpty(addr.locationId),
      },

      service: {
        categoryId: toNumberOrEmpty(categoryId) as number | "",
        serviceId: toNumberOrEmpty(serviceId) as number | "",
        frequencyId: toNumberOrEmpty(frequencyId) as number | "",
        squareFeet: src.service?.squareFeet ?? src.squareFeet ?? null,
        variables,
        addons,
      },

      schedule: {
        date: String(date || ""),
        time: String(time || ""),
        providerId: toNumberOrEmpty(
          src.schedule?.providerId ?? src.providerId ?? src.provider_id ?? src.teamId
        ) as number | "",
      },

      notes: {
        staffNotes: src.notes?.staffNotes ?? null,
        customerNotes: src.notes?.customerNotes ?? null,
      },

      payments: {
        method: (src.payments?.method ?? "") as "" | "card" | "cash" | "check",
      },

      pricing: {
        baseServicePrice: Number(src.pricing?.baseServicePrice ?? 0),
        extrasTotal: Number(src.pricing?.extrasTotal ?? 0),
        subtotal: Number(src.pricing?.subtotal ?? 0),
        adjustmentAmount: Number(src.pricing?.adjustmentAmount ?? 0),
        finalPrice: src.pricing?.finalPrice != null ? Number(src.pricing.finalPrice) : null,
        tip: Number(src.pricing?.tip ?? 0),
        coupon: src.pricing?.coupon ?? null,
        adjustmentComment: src.pricing?.adjustmentComment ?? null,
        adjustmentAppliesOnlyHere: Boolean(src.pricing?.adjustmentAppliesOnlyHere ?? true),
        total: Number(src.pricing?.total ?? 0),
      },

      status: quoteToBookingStatus(q.status),
      quoteId: q.id,
    };
  }

  // ---------- Load Quote ----------
  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      if (quoteProp) {
        if (!cancelled) {
          setRawQuote(quoteProp);
          setInitial(mapBackendToFormState(quoteProp));
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const res = await api.get(`${basePath}/${id}`);
        const data = res?.data?.data ?? res?.data ?? res;
        if (cancelled) return;
        setRawQuote(data);
        setInitial(mapBackendToFormState(data));
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message ?? "Failed to load quote.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (!Number.isFinite(id)) {
      setError("Invalid quote id.");
      setLoading(false);
      return;
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id, api, basePath, quoteProp]);

  // ---------- Save Handler ----------
  const handleSave = React.useCallback(
    async (payload: any) => {
      // Persist snapshot as JSON inside quote.payload
      await api.put(`${basePath}/${id}`, { payload });
      nav(redirectToOnSave);
    },
    [api, basePath, id, nav, redirectToOnSave]
  );

  // ---------- Convert to Booking Handler ----------
  const handleConvertToBooking = React.useCallback(
    async (payload: any) => {
      // Reuse the booking API with the same snapshot
      await api.post(`${bookingsPath}`, payload);
      nav("/admin/bookings");
    },
    [api, bookingsPath, nav]
  );

  // ---------- QuoteUI helpers ----------
  const shareUrl = React.useMemo(() => {
    const origin =
      typeof window !== "undefined" && window.location?.origin
        ? window.location.origin
        : "";
    return id ? `${origin}/quote/${id}` : "";
  }, [id]);

  const historyItems = React.useMemo<
    Array<{ date: string; action: string; detail?: string }>
  >(() => {
    const h = (rawQuote as any)?.history ?? (rawQuote as any)?.events ?? (rawQuote as any)?.audit ?? [];
    if (!Array.isArray(h)) return [];
    return h.map((x: any) => ({
      date: String(x.date ?? x.timestamp ?? x.createdAt ?? ""),
      action: String(x.action ?? x.type ?? x.event ?? "Updated"),
      detail: x.detail ?? x.note ?? x.message ?? undefined,
    }));
  }, [rawQuote]);

  const onChangeExpire = React.useCallback(
    async (isoDateOrNull: string | null) => {
      await api.put(`${basePath}/${id}`, { expirationAt: isoDateOrNull });
      try {
        const res = await api.get(`${basePath}/${id}`);
        const data = res?.data?.data ?? res?.data ?? res;
        setRawQuote(data);
      } catch {}
    },
    [api, basePath, id]
  );

  const onSendEmail = React.useCallback(
    async (args: { to: string; subject: string; message: string; link: string }) => {
      await api.post(`${basePath}/${id}/email`, args);
    },
    [api, basePath, id]
  );

  // ---------- Render States ----------
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner aria-label="Loading quote" size="lg" />
        <span className="ml-3 text-sm text-gray-600">Loading quote…</span>
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
          <Button color="light" onClick={() => window.history.back()}>
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
          Quote not found.
        </Alert>
      </div>
    );
  }

  // ---------- Unified Form in "editQuote" mode ----------
  return (
    <BookingForm
      mode="editQuote"
      initial={initial}
      onComplete={handleSave}
      onConvertToBooking={handleConvertToBooking}
      quoteUI={{
        shareUrl,
        history: historyItems,
        onChangeExpire: onChangeExpire,
        onSendEmail: onSendEmail,
          createdAt: rawQuote?.createdAt ?? undefined,       
      expirationAt: rawQuote?.expirationAt ?? null, 
      }}
    />
  );
}
