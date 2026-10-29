// src/components/quotes/EmailQuoteModal.tsx
import * as React from "react";
import { Modal, Button, Label, TextInput, HelperText } from "flowbite-react";
import { HiMail } from "react-icons/hi";
// TODO: point this to your real CaliRocks logo asset
import caliRocksLogo from "../../assets/images/image.png";

export type EmailQuoteData = {
  quoteId: number;
  shareUrl: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  date?: string;
  time?: string;
  /** ===== These power the Quote Details block ===== */
  frequency?: string;
  serviceCategory?: string;
  serviceName?: string;
  variables?: Array<{ name: string; qty: number }>;
  extras?: Array<{ name: string; qty: number }>;
  /** ============================================= */
  discountCode?: string | null;
  total?: number;
  createdBy?: string | null;
};

type Props = {
  show: boolean;
  onClose: () => void;
  to?: string;
  data?: EmailQuoteData;
  onSend?: (payload: { to: string; subject: string; html: string }) => Promise<void> | void;
};

/** ---------- Branding (edit in one place) ---------- */
const BRAND = {
  NAME: "CaliRocks",
  COLOR: "#2563eb",
  EMAIL: "info@calirocks.com",        // <- update if needed
  PHONE: "(888) 000-0000",            // <- update if needed
  URL: "https://www.calirocks.com",   // <- update if needed
  LOGO: caliRocksLogo,
};
const EMAIL_WIDTH = 640;
const DEFAULTS = {
  subject: "Free Quote Inside – Click To Book",
  headline: `${BRAND.NAME.toUpperCase()} SENT A FREE QUOTE BELOW`,
  intro: `Thank you for your interest in ${BRAND.NAME}. Here's your custom quote based on the information you provided. The final price will be determined by the service providers when they arrive. For updates, email ${BRAND.EMAIL} or call ${BRAND.PHONE}.`,
  cta: "CLICK HERE TO BOOK NOW",
  footer: `You are receiving this email because you're an awesome customer of ${BRAND.NAME} <br/> or you requested a Free Quote.`,
  headerHeight: 64, // px
};

export default function EmailQuoteModal({ show, onClose, to, data, onSend }: Props) {
  const safe = data ?? ({} as EmailQuoteData);

  const [toField, setToField] = React.useState<string>(to ?? safe.email ?? "");
  const [subject, setSubject] = React.useState<string>(DEFAULTS.subject);
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const scrollerRef = React.useRef<HTMLDivElement>(null);
  const previewRootRef = React.useRef<HTMLDivElement | null>(null);
  const headerSlotRef = React.useRef<HTMLDivElement | null>(null);

  // Safe display host (no inline regex in template strings)
const BRAND_HOST = React.useMemo(() => {
  try {
    return new URL(BRAND.URL).host; // e.g. "www.calirocks.com"
  } catch {
    // fallback if BRAND.URL isn't absolute
    return BRAND.URL.replace(/^https?:\/\/(www\.)?/i, "");
  }
}, []);


  const canvasHTML = React.useMemo(() => {
    const customerBlockHTML = `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-top:12px">
  <tr><td style="padding:12px 16px;background:#f9fafb;font-weight:700">Customer</td></tr>
  <tr><td style="padding:16px;line-height:1.8">
    <div><strong>Name:</strong> ${safe.firstName ?? ""} ${safe.lastName ?? ""}</div>
    <div><strong>Email:</strong> ${safe.email ?? ""}</div>
    <div><strong>Phone:</strong> ${safe.phone ?? ""}</div>
    <div><strong>Address:</strong> ${safe.address ?? ""}</div>
    <div><strong>City:</strong> ${safe.city ?? ""}</div>
    <div><strong>State:</strong> ${safe.state ?? ""}</div>
    <div><strong>Zip:</strong> ${safe.zip ?? ""}</div>
  </td></tr>
</table>`.trim();

    const variablesList =
      safe.variables?.length
        ? safe.variables.map(v => `${v.qty} × ${v.name}`).join(", ")
        : "—";

    const addonsList =
      safe.extras?.length
        ? safe.extras.map(e => `${e.qty} × ${e.name}`).join(", ")
        : "—";

    const quoteBlockHTML = `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-top:12px">
  <tr><td style="padding:12px 16px;background:#f9fafb;font-weight:700">Quote Details</td></tr>
  <tr><td style="padding:16px;line-height:1.8">
    <div><strong>Frequency:</strong> ${safe.frequency ?? "—"}</div>
    <div><strong>Category:</strong> ${safe.serviceCategory ?? "—"}</div>
    <div><strong>Service:</strong> ${safe.serviceName ?? "—"}</div>
    <div><strong>Variables:</strong> ${variablesList}</div>
    <div><strong>Add-ons:</strong> ${addonsList}</div>
  </td></tr>
</table>`.trim();

    return `
<table
  id="email-canvas"
  role="presentation"
  align="center"
  width="${EMAIL_WIDTH}"
  cellpadding="0"
  cellspacing="0"
  contenteditable="true"
  style="margin:0 auto;display:block;max-width:${EMAIL_WIDTH}px;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;font-family:Inter,Arial,Helvetica,sans-serif;color:#111827;background:#ffffff"
>
  <tr>
    <td style="padding:0;border-bottom:1px solid #e5e7eb;background:#f9fafb">
      <div
        id="header-slot"
        contenteditable="true"
        style="height:${DEFAULTS.headerHeight}px;display:flex;align-items:center;justify-content:center"
        title="Delete and paste/drag an image here to replace the header"
      >
        <img src="${BRAND.LOGO}" alt="${BRAND.NAME} Header" style="max-height:${DEFAULTS.headerHeight}px;width:100%;object-fit:contain;display:block"/>
      </div>
    </td>
  </tr>
  <tr>
    <td style="padding:24px">
      <h1 style="margin:0 0 8px 0;font-size:22px;line-height:28px;font-weight:800;color:#111827">${DEFAULTS.headline}</h1>
      <p style="margin:0 0 12px 0;color:#6b7280">THIS IS NOT A BOOKING.<br/>You need to click below to complete your booking.</p>

      <span id="email-body-start"></span>

      <p style="margin:16px 0 16px 0">Hello ${safe.firstName ?? ""}${safe.firstName || safe.lastName ? "," : ""}</p>
      <p style="margin:0 0 16px 0">${DEFAULTS.intro}</p>

      <p style="margin:12px 0 20px 0">When you're ready to book, click:</p>
      <p style="margin:0 0 24px 0">
        <a href="${safe.shareUrl}" style="display:inline-block;background:${BRAND.COLOR};color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:700">${DEFAULTS.cta}</a>
      </p>

      ${customerBlockHTML}
      ${quoteBlockHTML}

      <p style="margin:20px 0 8px 0">
        <a href="${safe.shareUrl}" style="display:inline-block;background:${BRAND.COLOR};color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:700">${DEFAULTS.cta}</a>
      </p>

     
      <hr style="border:0;border-top:1px solid #e5e7eb;margin:16px 0"/>
      <p style="margin:0;color:#6b7280;font-size:12px;text-align:center">${DEFAULTS.footer}</p>
     <p style="margin:8px 0 0 0;color:#6b7280;font-size:12px;text-align:center">
  ${BRAND.PHONE} · <a href="${BRAND.URL}" style="color:${BRAND.COLOR};text-decoration:none">${BRAND_HOST}</a> · <a href="mailto:${BRAND.EMAIL}" style="color:${BRAND.COLOR};text-decoration:none">${BRAND.EMAIL}</a>
</p>

    </td>
  </tr>
</table>`.trim();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(safe)]);

  const previewMountRef = React.useCallback((node: HTMLDivElement | null) => {
    previewRootRef.current = node;
    if (!node) return;

    // Enable paste/drag-drop images into header
    headerSlotRef.current = node.querySelector("#header-slot");
    const header = headerSlotRef.current;
    if (!header) return;

    const onDragOver = (e: DragEvent) => { e.preventDefault(); e.stopPropagation(); };
    const onDrop = (e: DragEvent) => {
      e.preventDefault(); e.stopPropagation();
      const file = e.dataTransfer?.files?.[0];
      if (!file) return;
      const r = new FileReader();
      r.onload = () => {
        if (typeof r.result === "string") {
          header.innerHTML = `<img src="${r.result}" alt="${BRAND.NAME} Header" style="max-height:${DEFAULTS.headerHeight}px;width:100%;object-fit:contain;display:block" />`;
        }
      };
      r.readAsDataURL(file);
    };
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items; if (!items) return;
      for (const it of items) {
        if (it.type.startsWith("image/")) {
          e.preventDefault();
          const f = it.getAsFile(); if (!f) return;
          const r = new FileReader();
          r.onload = () => {
            if (typeof r.result === "string") {
              header.innerHTML = `<img src="${r.result}" alt="${BRAND.NAME} Header" style="max-height:${DEFAULTS.headerHeight}px;width:100%;object-fit:contain;display:block" />`;
            }
          };
          r.readAsDataURL(f);
          break;
        }
      }
    };

    header.addEventListener("dragover", onDragOver);
    header.addEventListener("drop", onDrop);
    header.addEventListener("paste", onPaste);

    return () => {
      header.removeEventListener("dragover", onDragOver);
      header.removeEventListener("drop", onDrop);
      header.removeEventListener("paste", onPaste);
    };
  }, []);

  React.useEffect(() => {
    if (!show) return;
    requestAnimationFrame(() => {
      const scroller = scrollerRef.current;
      const anchor = scroller?.querySelector<HTMLElement>("#email-body-start");
      if (scroller && anchor) scroller.scrollTo({ top: anchor.offsetTop - 12, behavior: "instant" as ScrollBehavior });
    });
  }, [show]);

  const buildFinalHTML = () => {
    const root = previewRootRef.current;
    const table = root?.querySelector<HTMLTableElement>("#email-canvas");
    const emailTableHTML = table ? table.outerHTML : "";

    return `
<!doctype html>
<meta charset="utf-8">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-family:Inter,Arial,Helvetica,sans-serif;color:#111827;background:#ffffff">
  <tr><td align="center" style="padding:24px 16px">
    ${emailTableHTML}
  </td></tr>
</table>`.trim();
  };

  return (
    <Modal show={show} onClose={onClose} position="center" size="4xl">
      <div className="">
        <div className="max-h-[82vh] flex flex-col">
          <div ref={scrollerRef} className="flex-1 overflow-y-auto p-5 space-y-4">
            <div className="flex items-center gap-2">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white">
                <HiMail className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-gray-800">Send Quote to Customer</h2>
            
              </div>
            </div>

            {error && <HelperText color="failure" className="!mt-0">{error}</HelperText>}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mt-8">
              <div>
                <Label className="mb-1 block text-sm">To</Label>
                <TextInput
                  type="email"
                  value={toField}
                  onChange={(e) => setToField(e.target.value)}
                  placeholder="customer@email.com"
                  required
                />
              </div>
              <div>
                <Label className="mb-1 block text-sm">Subject</Label>
                <TextInput value={subject} onChange={(e) => setSubject(e.target.value)} />
              </div>
            </div>

            <div>
              <Label className="mb-1 block text-sm">Message</Label>
              <div className="rounded-lg border border-gray-200 bg-white overflow-x-auto">
                <div className="w-full flex justify-center px-2 py-2">
                  <div
                    ref={previewMountRef}
                    dangerouslySetInnerHTML={{ __html: canvasHTML }}
                  />
                </div>
              </div>
             
            </div>
          </div>

          <div className="shrink-0 border-t border-gray-200 bg-white px-5 py-3">
            <div className="mx-auto flex items-center justify-between">
              <p className="text-xs text-gray-500">Your live edits are what gets sent.</p>
              <div className="flex items-center gap-2">
                <Button color="light" size="sm" onClick={onClose} className="cursor-pointer">
                  Cancel
                </Button>
                <Button
                  color="blue"
                  size="sm"
                  disabled={sending || !toField.trim() || !safe.shareUrl}
                  onClick={async () => {
                    try {
                      setSending(true);
                      setError(null);
                      const html = buildFinalHTML();
                      await onSend?.({ to: toField.trim(), subject: subject.trim() || DEFAULTS.subject, html });
                      onClose();
                    } catch (e: any) {
                      setError(e?.message || "Failed to send email.");
                    } finally {
                      setSending(false);
                    }
                  }}
                  className="cursor-pointer"
                >
                  Send Email
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}