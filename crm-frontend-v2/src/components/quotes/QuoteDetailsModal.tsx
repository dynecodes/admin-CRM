import * as React from "react";
import { Modal, Button, Badge } from "flowbite-react";

/* ---------- helpers ---------- */
const money = (n: any) =>
  Number(n ?? 0).toLocaleString(undefined, { style: "currency", currency: "USD" });

const fmtDateTime = (iso?: string | Date | null) => {
  if (!iso) return "—";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (!Number.isFinite(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

type QuoteQuickViewProps = {
  open: boolean;
  onClose: () => void;

  titleName?: string;
  titleEmail?: string;

  createdAt?: string | Date | null;
  expiresAt?: string | Date | null;

  payload: {
    customer?: {
      firstName?: string; lastName?: string; email?: string; phone?: string; companyName?: string;
    };
    address?: {
      address?: string; city?: string; state?: string; zip?: string;
    };
    schedule?: { date?: string; time?: string; providerId?: number | string | "" };
    payments?: { method?: "card" | "cash" | "check" | string };
    service?: {
      categoryId?: number; serviceId?: number; frequencyId?: number;
      variables?: Array<{ id: number | string; qty: number }>;
      addons?: Array<{ id: number | string; qty?: number }>;
    };
    pricing?: {
      baseServicePrice?: number;
      extrasTotal?: number;
      subtotal?: number;
      adjustmentAmount?: number;
      tip?: number;
      finalPrice?: number | null;
      total?: number;
      coupon?: string | null;
      adjustmentComment?: string | null;
      adjustmentAppliesOnlyHere?: boolean;
    };
    notes?: { staffNotes?: string; customerNotes?: string };
  };

  lookups?: {
    categoryNameById?: Map<number, string>;
    serviceNameById?: Map<number, string>;
    frequencyNameById?: Map<number, string>;
    variableNameById?: Map<number, string>;
    variablePriceById?: Map<number, number>;
    addonNameById?: Map<number, string>;
    addonPriceById?: Map<number, number>;
  };
};

const Line = ({ label, value }: { label: string; value?: React.ReactNode }) => (
  <div className="text-sm">
    <span className="text-gray-600">{label}</span>{" "}
    <span className="text-gray-900 font-medium">{value ?? "—"}</span>
  </div>
);

const RowLine = ({ left, right }: { left: React.ReactNode; right: React.ReactNode }) => (
  <div className="flex items-center justify-between text-sm py-0.5">
    <span className="text-gray-700">{left}</span>
    <span className="text-gray-900 font-medium">{right}</span>
  </div>
);

const Card = ({ title, children }: { title: React.ReactNode; children: React.ReactNode }) => (
  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
    <div className="mb-3 text-sm font-semibold text-gray-900">{title}</div>
    {children}
  </div>
);

export default function QuoteQuickView({
  open,
  onClose,
  createdAt,
  expiresAt,
  payload,
  lookups,
}: QuoteQuickViewProps) {
  const c = payload.customer ?? {};
  const a = payload.address ?? {};
  const sch = payload.schedule ?? {};
  const svc = payload.service ?? {};
  const p = payload.pricing ?? {};
  const notes = payload.notes ?? {};

  const catName =
    (svc.categoryId && lookups?.categoryNameById?.get(Number(svc.categoryId))) ??
    (svc.categoryId ? `#${svc.categoryId}` : "—");
  const serviceName =
    (svc.serviceId && lookups?.serviceNameById?.get(Number(svc.serviceId))) ??
    (svc.serviceId ? `#${svc.serviceId}` : "—");
  const freqName =
    (svc.frequencyId && lookups?.frequencyNameById?.get(Number(svc.frequencyId))) ??
    (svc.frequencyId ? `#${svc.frequencyId}` : "—");

  // Next booking's total: exclude one-time adjustment if it applies only here
//   const nextTotalRaw =
//     (p.total ?? 0) - (p.adjustmentAppliesOnlyHere ? (p.adjustmentAmount ?? 0) : 0);
//   const nextTotal = Math.max(0, Number.isFinite(nextTotalRaw) ? nextTotalRaw : 0);

  return (
    <Modal show={open} onClose={onClose} size="4xl">
      {/* Header */}
      <div className="px-6 pt-5">
        <h2 className="text-lg font-semibold text-gray-900">Quote Preview Details</h2>
      </div>

      {/* Body */}
      <div className="px-6 pb-4 pt-3 max-h-[75vh] overflow-y-auto space-y-4">
        {/* Meta */}
        <Card title="Quote Info">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Line label="Created:" value={fmtDateTime(createdAt)} />
            <Line label="Expires:" value={fmtDateTime(expiresAt)} />
          </div>
        </Card>

        {/* Customer & Schedule */}
        <Card title="Customer">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Line label="Name:" value={`${c.firstName ?? ""} ${c.lastName ?? ""}`.trim() || "—"} />
            <Line label="Company:" value={c.companyName || "—"} />
            <Line label="Email:" value={c.email || "—"} />
            <Line label="Phone:" value={c.phone || "—"} />
            <Line
              label="Address:"
              value={[a.address, a.city, a.state, a.zip].filter(Boolean).join(", ") || "—"}
            />
            <Line
              label="Date / Time:"
              value={[sch.date || "", sch.time ? `@ ${sch.time}` : ""].filter(Boolean).join(" ") || "—"}
            />
            <Line label="Payment Method:" value={payload.payments?.method || "—"} />
          </div>
        </Card>

        {/* Service Details */}
        <Card title="Service Details">
          {/* Chips */}
          <div className="mb-3 flex flex-wrap gap-2">
            <Badge color="info" className="px-2 py-1 text-xs">
              Frequency:<span className="ml-1 font-semibold">{freqName}</span>
            </Badge>
            <Badge color="gray" className="px-2 py-1 text-xs">
              Category:<span className="ml-1 font-semibold">{catName}</span>
            </Badge>
            <Badge color="indigo" className="px-2 py-1 text-xs">
              Service:<span className="ml-1 font-semibold">{serviceName}</span>
            </Badge>
          </div>

          <div className="">
            {/* Variables: plain rows (no bullets) */}
            <div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Variables
              </div>
              {(svc.variables?.length ?? 0) > 0 ? (
                <div className="space-y-1">
                  {svc.variables!.map((v) => {
                    const name = lookups?.variableNameById?.get(Number(v.id)) ?? `#${v.id}`;
                    const unit = lookups?.variablePriceById?.get(Number(v.id));
                    const qty = Number(v.qty ?? 0);
                    const priceBit = unit != null ? `${money(unit)}` : "$0.00";
                    return (
                      <RowLine
                        key={`var-${String(v.id)}`}
                        left={name}
                        right={`${priceBit}, ${qty}`}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="text-sm text-gray-500">None</div>
              )}
            </div>
       {/* Add-ons */}
            <div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Add-ons
              </div>
              {(svc.addons?.length ?? 0) > 0 ? (
                <div className="space-y-1">
                  {svc.addons!.map((ad) => {
                    const name = lookups?.addonNameById?.get(Number(ad.id)) ?? `#${ad.id}`;
                    const unit = lookups?.addonPriceById?.get(Number(ad.id));
                    const qty = Math.max(1, Number(ad.qty ?? 1));
                    const unitTxt = unit != null ? `${money(unit)}` : "";
                    const rightTxt =
                      unitTxt && qty ? `${unitTxt}, ${qty}` : qty ? `${qty}` : unitTxt || "—";
                    return <RowLine key={`ad-${String(ad.id)}`} left={name} right={rightTxt} />;
                  })}
                </div>
              ) : (
                <div className="text-sm text-gray-500">None</div>
              )}
            </div>
     
          </div>
        </Card>

        {/* Notes */}
        <Card title="Notes">
          <div className="">
            <div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Staff Notes:
              </div>
              <div className="text-sm text-gray-900 whitespace-pre-wrap">
                {notes.staffNotes?.trim() || ""}
              </div>
            </div>
            <div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Customer Notes:
              </div>
              <div className="text-sm text-gray-900 whitespace-pre-wrap">
                {notes.customerNotes?.trim() || ""}
              </div>
            </div>
          </div>
        </Card>

        {/* Pricing Summary (exact fields requested) */}
        <Card title="Pricing Summary">
          <div className="space-y-1">
            <RowLine left="Service" right={money(p.baseServicePrice)} />
            <RowLine left="Add-ons" right={money(p.extrasTotal)} />
            <RowLine left="Discount" right={p.coupon ? String(p.coupon) : "$0.00"} />
            <RowLine left="Adjustment" right={money(p.adjustmentAmount)} />
            <RowLine left="Tip" right={money(p.tip)} />
            <RowLine left="Total" right={money(p.total ?? p.finalPrice)} />
            {/* <RowLine left="Next Booking’s Total" right={money(nextTotal)} /> */}
          </div>
        </Card>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-2 px-6 pb-5">
        <Button color="light" onClick={onClose} className="cursor-pointer">
          Cancel
        </Button>
      </div>
    </Modal>
  );
}
