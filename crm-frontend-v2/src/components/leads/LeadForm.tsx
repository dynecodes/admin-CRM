// src/components/leads/LeadForm.tsx
import * as React from "react";
import { Button, Card, HelperText, Label } from "flowbite-react";
import { PhoneInput } from "../ui/InputsBundle";
import { useLeads } from "../../hooks/Leads/useLeads";
import { useFunnels } from "../../hooks/Leads/useFunnels";
import FunnelFormModal from "./FunnelForm";
import type { Lead, LeadStage } from "../../types/leads";
import { HiChevronDown, HiPlus, HiCheck } from "react-icons/hi";

/* ===== Types ===== */
type Errors = Partial<
  Record<"firstName" | "lastName" | "email" | "phone" | "funnelId", string>
>;

export interface LeadFormProps {
  defaultValues?: Partial<
    Pick<Lead, "firstName" | "lastName" | "email" | "phone" | "notes">
  >;
  onSuccess?: () => void;
  onCancel?: () => void;
  selectedFunnelId?: number;
}

/* ===== Helpers ===== */
const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const required = (v?: string | null) => (v && v.trim().length > 0 ? true : false);
const keyify = (s: string) => s.toLowerCase().trim().replace(/\s+/g, "-");

/** normalize to LeadStage union */
const toLeadStage = (k: string): LeadStage => {
  const key = keyify(k);
  const map: Record<string, LeadStage> = {
    new: "new",
    contacted: "contacted",
    qualified: "qualified",
    quoted: "quoted",
    proposal: "quoted",
    "proposal-sent": "quoted",
    converted: "converted",
    won: "converted",
    lost: "lost",
  };
  return map[key] ?? "new";
};

/* Shared input classes */
const inputBaseWithPlaceholder =
  "block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500";
const ok = "";
const bad = "border-red-500 focus:border-red-600 focus:ring-red-600";

/* ===== Component ===== */
const LeadForm: React.FC<LeadFormProps> = ({
  defaultValues,
  onSuccess,
  onCancel,
  selectedFunnelId,
}) => {
  const { addLead } = useLeads();
  const { funnels = [], add, refresh } = useFunnels();

  const [form, setForm] = React.useState({
    firstName: defaultValues?.firstName ?? "",
    lastName: defaultValues?.lastName ?? "",
    email: defaultValues?.email ?? "",
    phone: defaultValues?.phone ?? "",
    notes: defaultValues?.notes ?? "",
  });
  const [errors, setErrors] = React.useState<Errors>({});

  const [funnelId, setFunnelId] = React.useState<number | "">(
    typeof selectedFunnelId === "number" ? selectedFunnelId : ""
  );

  // Keep state in sync if parent changes it while modal is open
  React.useEffect(() => {
    if (typeof selectedFunnelId === "number") {
      setFunnelId((prev) => (prev === "" ? selectedFunnelId : prev));
    }
  }, [selectedFunnelId]);

  /** Create Funnel modal */
  const [openFunnelModal, setOpenFunnelModal] = React.useState(false);
  const openNewFunnel = () => setOpenFunnelModal(true);
  const closeNewFunnel = () => setOpenFunnelModal(false);

  /** Headless dropdown (look like the screenshot) */
  const [open, setOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState<number>(-1);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const menuRef = React.useRef<HTMLDivElement | null>(null);

  const selectedFunnel = React.useMemo(
    () => funnels.find((f: any) => f.id === funnelId),
    [funnels, funnelId]
  );

  // Close on outside click / key nav
  React.useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (open && !menuRef.current?.contains(t) && !triggerRef.current?.contains(t)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (!open) return;
      const last = funnels.length;
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i: number) => (i + 1 > last ? 0 : i + 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i: number) => (i - 1 < 0 ? last : i - 1));
      }
      if (e.key === "Enter") {
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < funnels.length) {
          const f = funnels[activeIndex];
          if (f?.id != null) {
            setFunnelId(f.id);
            setErrors((prev: Errors) => ({ ...prev, funnelId: undefined }));
          }
          setOpen(false);
        } else if (activeIndex === funnels.length) {
          setOpen(false);
          openNewFunnel();
        }
      }
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, funnels]);

  const handleChange = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validate = (): boolean => {
    const next: Errors = {};
    if (!funnelId) next.funnelId = "Please select a funnel.";
    if (!required(form.firstName)) next.firstName = "First name is required.";
    if (!required(form.lastName)) next.lastName = "Last name is required.";
    if (!required(form.email)) next.email = "Email is required.";
    else if (!emailOk(form.email)) next.email = "Enter a valid email.";
    if (!required(form.phone)) next.phone = "Phone is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const selected = funnels.find((f: any) => f?.id === funnelId);
    const firstStageKey =
      selected?.stages?.length
        ? (selected.stages[0].name ?? selected.stages[0].id ?? "new").toString()
        : "new";

    // slug fallback if slug is missing
    const slugFallback =
      selected?.slug ??
      (selected?.name ? selected.name.toLowerCase().trim().replace(/\s+/g, "-") : null);

    addLead({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      notes: form.notes?.trim() ?? "",
      source: selected?.name ?? "Other",
      stage: toLeadStage(firstStageKey),

      funnelId: selected?.id ?? null,
      funnelSlug: slugFallback,
      sourceId: selected?.sourceId ?? null,
    });

    onSuccess?.();
  };

  // Ensure the payload type matches FunnelStageCfg exactly
  async function handleSaveNewFunnel(payload: {
    name: string;
    sourceId?: string | null;
    stages: Array<{ id: string; name: string; color: string }>;
  }) {
    const created = await add({
      name: payload.name,
      sourceId: payload.sourceId ?? null,
      stages: payload.stages,
    });
    await refresh?.();
    if (created?.id) setFunnelId(created.id);
    else {
      const match =
        (Array.isArray(funnels) ? funnels : []).find(
          (f: any) => f?.name?.trim() === payload.name.trim(),
        ) ?? null;
      if (match?.id) setFunnelId(match.id);
    }
    closeNewFunnel();
  }

  // Modal initial (stages with id+color)
  const modalInitial = React.useMemo(
    () => ({
      name: "",
      sourceId: "",
      stages: [
        { id: "new",        name: "New",           color: "#DBEAFE" },
        { id: "contacted",  name: "Contacted",     color: "#E9D5FF" },
        { id: "qualified",  name: "Qualified",     color: "#DCFCE7" },
        { id: "proposal",   name: "Proposal Sent", color: "#FEF3C7" },
        { id: "won",        name: "Won",           color: "#BBF7D0" },
      ],
    }),
    []
  );

  return (
    <>
      <form onSubmit={onSubmit} className="space-y-4">
        <Card className="bg-gray-50">
          <div className="grid grid-cols-1 gap-3 sm:gap-4">
            {/* ===== Fancy Funnel Dropdown ===== */}
            <div>
              <Label className="mb-1 block text-sm sm:mb-2">Select Funnel</Label>
              <div className="relative">
                <button
                  ref={triggerRef}
                  type="button"
                  onClick={() => {
                    setOpen((v) => !v);
                    setActiveIndex(() => {
                      const idx = Math.max(
                        0,
                        funnels.findIndex((f: any) => f.id === funnelId)
                      );
                      return idx;
                    });
                  }}
                  className={`flex w-full items-center justify-between rounded-lg border bg-white px-3 py-2 text-left text-sm ${
                    errors.funnelId
                      ? "border-red-500 focus:border-red-600 focus:ring-2 focus:ring-red-600"
                      : "border-gray-300 hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  }`}
                  aria-haspopup="listbox"
                  aria-expanded={open}
                >
                  <span className="truncate">
                    {selectedFunnel ? selectedFunnel.name : "Choose a funnel"}
                  </span>
                  <HiChevronDown
                    className={`h-4 w-4 text-gray-500 transition-transform ${open ? "rotate-180" : ""}`}
                  />
                </button>

                {open && (
                  <div
                    ref={menuRef}
                    role="listbox"
                    className="absolute z-50 mt-2 w-full rounded-lg border border-gray-200 bg-white shadow-xl"
                  >
                    <div className="max-h-64 overflow-y-auto py-1">
                      {funnels.map((f: any, i: number) => {
                        const selected = f.id === funnelId;
                        const active = i === activeIndex;
                        return (
                          <button
                            key={f.id ?? f.slug}
                            type="button"
                            role="option"
                            aria-selected={selected}
                            onMouseEnter={() => setActiveIndex(i)}
                            onClick={() => {
                              setFunnelId(f.id);
                              setOpen(false);
                              setErrors((prev: Errors) => ({ ...prev, funnelId: undefined }));
                            }}
                            className={`flex w-full items-center justify-between px-4 py-2 text-left text-sm ${
                              active || selected ? "bg-blue-50 text-blue-700" : "text-gray-800 hover:bg-gray-50"
                            }`}
                          >
                            <span className="truncate">{f.name}</span>
                            {selected && <HiCheck className="ml-3 h-4 w-4" />}
                          </button>
                        );
                      })}

                      <div className="my-1 border-t border-gray-200" />

                      <button
                        type="button"
                        onMouseEnter={() => setActiveIndex(funnels.length)}
                        onClick={() => {
                          setOpen(false);
                          openNewFunnel();
                        }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm font-medium text-blue-600 hover:bg-blue-50"
                      >
                        <HiPlus className="h-4 w-4" />
                        Add New Funnel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {errors.funnelId && (
                <HelperText color="failure" className="mt-1.5">
                  {errors.funnelId}
                </HelperText>
              )}
            </div>

            {/* First / Last */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="firstName" className="mb-1 block text-sm sm:mb-2">
                  First Name
                </Label>
                <input
                  id="firstName"
                  value={form.firstName}
                  onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
                  placeholder="Enter First Name"
                  required
                  autoComplete="off"
                  className={`${inputBaseWithPlaceholder} ${errors.firstName ? bad : ok}`}
                />
                {errors.firstName && <HelperText color="failure">{errors.firstName}</HelperText>}
              </div>

              <div>
                <Label htmlFor="lastName" className="mb-1 block text-sm sm:mb-2">
                  Last Name
                </Label>
                <input
                  id="lastName"
                  value={form.lastName}
                  onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
                  placeholder="Enter Last Name"
                  required
                  autoComplete="off"
                  className={`${inputBaseWithPlaceholder} ${errors.lastName ? bad : ok}`}
                />
                {errors.lastName && <HelperText color="failure">{errors.lastName}</HelperText>}
              </div>
            </div>

            {/* Email / Phone */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="email" className="mb-1 block text-sm sm:mb-2">
                  Email
                </Label>
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  aria-invalid={!!errors.email}
                  autoComplete="email"
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="Enter Email"
                  className={`${inputBaseWithPlaceholder} ${errors.email ? bad : ok}`}
                  required
                />
                {errors.email && <HelperText color="failure">{errors.email}</HelperText>}
              </div>

              <div>
                <Label htmlFor="phone" className="mb-1 block text-sm sm:mb-2">
                  Phone
                </Label>
                <PhoneInput
                  id="phone"
                  value={form.phone}
                  onChange={(v) => handleChange("phone", v)}
                  error={!!errors.phone}
                  placeholder="Enter Phone"
                />
                {errors.phone && <HelperText color="failure">{errors.phone}</HelperText>}
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes" className="mb-1 block text-sm sm:mb-2">
                Notes
              </Label>
              <textarea
                id="notes"
                value={form.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                placeholder="Add any notes for this lead…"
                className={`${inputBaseWithPlaceholder} min-h-[96px]`}
              />
            </div>
          </div>
        </Card>

        {/* ===== Actions moved OUTSIDE the Card ===== */}
        <div className="mt-4 flex flex-col gap-3 sm:mt-6 sm:flex-row sm:justify-end">
          {onCancel && (
            <Button
              color="light"
              type="button"
              onClick={onCancel}
              className="w-full sm:w-auto cursor-pointer px-6"
            >
              Cancel
            </Button>
          )}
          <Button color="gray" type="submit" className="w-full px-8 sm:w-auto cursor-pointer">
            Save 
          </Button>
        </div>
      </form>

      {/* Create Funnel Modal */}
      <FunnelFormModal
        open={openFunnelModal}
        onClose={closeNewFunnel}
        initial={modalInitial}
        onSave={handleSaveNewFunnel}
      />
    </>
  );
};

export default LeadForm;
