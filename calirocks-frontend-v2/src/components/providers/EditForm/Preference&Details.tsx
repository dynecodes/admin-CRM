// src/components/Providers/EditForm/Preference&Details.tsx
import * as React from "react";
import { Modal, Badge } from "flowbite-react";
import { ServiceProvider, ProviderEditForm } from "../../../types/providers";
import { useCustomers } from "../../../hooks/Customers/useCustomers";
import { useServices } from "../../../hooks/useServices";
import { useTags } from "../../../hooks/useTags";
import MultiSelectDropdown from "../../ui/MultiSelectDropdown";

/** ========================= Types ========================= */

type PrefForm = Pick<
  ProviderEditForm,
  | "tags"
  | "categoryIds"
  | "locationIds"
  | "notes"
  | "likedCustomerIds"
  | "dislikedCustomerIds"
  | "preferredCustomerIds"
  | "avoidCustomerIds"
>;

type Props = {
  form: PrefForm;
  errors?: Partial<
    Record<
      keyof PrefForm | "preferredCustomerIds" | "avoidCustomerIds" | "preferredTeamIds",
      string
    >
  >;
  onChange: <K extends keyof PrefForm>(k: K, v: PrefForm[K]) => void;
  provider: ServiceProvider; // kept for future use
};

/** ========================= UI primitives ========================= */
function Field({
  label,
  children,
  size = "lg",
  onClick,
}: {
  label: string;
  children: React.ReactNode;
  size?: "lg" | "sm";
  onClick?: () => void;
}) {
  const labelClass =
    size === "lg"
      ? "text-[16px] font-semibold text-gray-900"
      : "text-[13px] font-medium text-gray-800";

  const isClickable = typeof onClick === "function";

  return (
    <div className="min-w-0 space-y-2">
      <div className={labelClass}>{label}</div>
      <div
        className={[
          "min-w-0",
          isClickable
            ? "cursor-pointer rounded-lg outline-none ring-0 focus-visible:ring-2 focus-visible:ring-gray-500"
            : "",
        ].join(" ")}
        role={isClickable ? "button" : undefined}
        tabIndex={isClickable ? 0 : undefined}
        onClick={onClick}
        onKeyDown={(e) => {
          if (!isClickable) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick?.();
          }
        }}
        aria-label={isClickable ? `${label}, open details` : undefined}
      >
        {children}
      </div>
    </div>
  );
}

function FormRow({ children, cols = 2 }: { children: React.ReactNode; cols?: 1 | 2 }) {
  const cls =
    cols === 2
      ? "grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6"
      : "grid grid-cols-1 gap-4";
  return <div className={cls}>{children}</div>;
}

/** ========================= Shared helpers ========================= */
type SimpleCustomer = { id: number; name: string; email?: string };

function toId(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function extractIdListFromForm(v: unknown): (number | string)[] {
  if (!Array.isArray(v)) return [];
  const out: (number | string)[] = [];
  for (const item of v) {
    if (item == null) continue;
    if (typeof item === "number" || typeof item === "string") {
      out.push(item);
      continue;
    }
    if (typeof item === "object") {
      const maybe =
        (item as any).id ??
        (item as any).customerId ??
        (item as any).customer_id ??
        (item as any).value;
      if (maybe != null) {
        const n = Number(maybe);
        out.push(Number.isFinite(n) ? n : String(maybe));
      }
    }
  }
  return out;
}

/** =========================================================
 *  TAGS: mirror list styling (font-size & bg) from Tags page
 *  ========================================================= */
type TagColor = "gray" | "yellow" | "orange" | "red";
type TagType = {
  id: number;
  tag_name: string;
  tag_color: TagColor;
};

const TAG_COLORS: Record<
  TagColor,
  { primary: string; bg: string; label: string; textColor?: string }
> = {
  gray: { primary: "#1976f2", bg: "#e3f2fd", label: "gray" },
  yellow: { primary: "#f5f117", bg: "#ffffe0", label: "Yellow", textColor: "#1a1a1a" },
  orange: { primary: "#ff9800", bg: "#fff3e0", label: "Orange" },
  red: { primary: "#d32f2f", bg: "#ffebee", label: "Red" },
};

/**
 * ProviderTagsPicker
 * - reads tags via useTags()
 * - supports form.tags as string[] (names) OR number[] (IDs)
 * - renders badges exactly like Tags table (text-xs, px-2/py-1, color logic)
 */
function ProviderTagsPicker({
  value,
  onChange,
  placeholder = "Search or pick a tag…",
}: {
  value:
    | Array<number | string | { tag_name: string; tag_color: TagColor }>
    | undefined;
  onChange: (
    next: Array<number | string | { tag_name: string; tag_color: TagColor }>
  ) => void;
  placeholder?: string;
}) {
  const { tags } = useTags(); // Tag[]
  const [q, setQ] = React.useState("");
  const [activeIdx, setActiveIdx] = React.useState<number>(-1);
  const [openPaletteFor, setOpenPaletteFor] = React.useState<string | null>(null);

  // --- color helpers / click-away ---
  const COLOR_ORDER: TagColor[] = ["gray", "yellow", "orange", "red"];
  const nextColor = (c: TagColor) =>
    COLOR_ORDER[(COLOR_ORDER.indexOf(c) + 1) % COLOR_ORDER.length];

  const paletteRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    const onDocDown = (e: MouseEvent) => {
      if (!openPaletteFor) return;
      if (!paletteRef.current) return;
      if (!paletteRef.current.contains(e.target as Node)) {
        setOpenPaletteFor(null);
      }
    };
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, [openPaletteFor]);

  // --- indexes for tags ---
  const byId = React.useMemo(() => {
    const m = new Map<number, TagType>();
    (tags ?? []).forEach((t: any) =>
      m.set(Number(t.id), {
        id: Number(t.id),
        tag_name: String(t.tag_name),
        tag_color: (t.tag_color || "gray") as TagColor,
      })
    );
    return m;
  }, [tags]);

  const byName = React.useMemo(() => {
    const m = new Map<string, TagType>();
    (tags ?? []).forEach((t: any) =>
      m.set(String(t.tag_name).toLowerCase(), {
        id: Number(t.id),
        tag_name: String(t.tag_name),
        tag_color: (t.tag_color || "gray") as TagColor,
      })
    );
    return m;
  }, [tags]);

  // --- normalize current selection into chips with color ---
  const selectedChips = React.useMemo(() => {
    const items = (value ?? []).map((v) => {
      if (typeof v === "number") {
        const found = byId.get(v);
        return found ? found : null;
      }
      if (typeof v === "string") {
        const found = byName.get(v.toLowerCase());
        if (found) return found;
        return {
          id: undefined as unknown as number,
          tag_name: v,
          tag_color: "gray" as TagColor,
        };
      }
      // object (free/overridden color)
      const name = String(v.tag_name);
      const color = (v.tag_color || "gray") as TagColor;
      return { id: undefined as unknown as number, tag_name: name, tag_color: color };
    });
    return items.filter(Boolean) as TagType[];
  }, [value, byId, byName]);

  const selectedIdSet = React.useMemo(() => {
    const s = new Set<number>();
    selectedChips.forEach((t) => typeof t.id === "number" && s.add(t.id));
    return s;
  }, [selectedChips]);

  const selectedNameSet = React.useMemo(() => {
    const s = new Set<string>();
    (value ?? []).forEach((v) => {
      if (typeof v === "string") s.add(v.toLowerCase());
      else if (typeof v === "number") {
        const t = byId.get(v);
        if (t) s.add(t.tag_name.toLowerCase());
      } else if (v && typeof v === "object") {
        s.add(String(v.tag_name).toLowerCase());
      }
    });
    return s;
  }, [value, byId]);

  // --- search/filter + create option ---
  const lcQ = q.trim().toLowerCase();
  const filtered: TagType[] = React.useMemo(() => {
    if (!lcQ) return [];
    return Array.from(byId.values()).filter((t) =>
      t.tag_name.toLowerCase().includes(lcQ)
    );
  }, [byId, lcQ]);

  const exactMatchExists =
    lcQ.length > 0 && (byName.has(lcQ) || selectedNameSet.has(lcQ));
  const canCreate = lcQ.length > 0 && !exactMatchExists;
  const showDrop = lcQ.length > 0 && (filtered.length > 0 || canCreate);

  // --- mutate helpers (preserve primitive form unless color needed) ---
  const pushItem = (item: TagType, forceObject = false) => {
    const first = (value ?? [])[0];
    if (forceObject) {
      onChange([
        ...(value ?? []),
        { tag_name: item.tag_name, tag_color: item.tag_color },
      ]);
      return;
    }
    if (typeof first === "string") {
      onChange([...(value ?? []), item.tag_name]);
    } else if (typeof first === "number" && typeof item.id === "number") {
      onChange([...(value ?? []), item.id]);
    } else if (!first) {
      onChange([item.tag_name]); // default to names if empty
    } else {
      onChange([
        ...(value ?? []),
        { tag_name: item.tag_name, tag_color: item.tag_color },
      ]);
    }
  };

  const addExisting = (t: TagType) => {
    if (selectedIdSet.has(t.id) || selectedNameSet.has(t.tag_name.toLowerCase())) return;
    pushItem(t, false);
    setQ("");
    setActiveIdx(-1);
  };

  const addNewWithColor = (name: string, color: TagColor) => {
    const tag: TagType = {
      id: undefined as unknown as number,
      tag_name: name.trim(),
      tag_color: color,
    };
    if (!tag.tag_name) return;
    if (selectedNameSet.has(tag.tag_name.toLowerCase())) return;
    pushItem(tag, true);
    setQ("");
    setActiveIdx(-1);
  };

  const changeChipColor = (chip: TagType, color: TagColor) => {
    const nameLc = chip.tag_name.toLowerCase();
    const next: Array<
      number | string | { tag_name: string; tag_color: TagColor }
    > = [];
    (value ?? []).forEach((v) => {
      if (typeof v === "number") {
        const t = byId.get(v);
        if (t && t.tag_name.toLowerCase() === nameLc) {
          next.push({ tag_name: chip.tag_name, tag_color: color });
        } else {
          next.push(v);
        }
      } else if (typeof v === "string") {
        if (v.toLowerCase() === nameLc) {
          next.push({ tag_name: chip.tag_name, tag_color: color });
        } else {
          next.push(v);
        }
      } else if (v && typeof v === "object") {
        if (String(v.tag_name).toLowerCase() === nameLc) {
          next.push({ tag_name: chip.tag_name, tag_color: color });
        } else {
          next.push(v);
        }
      }
    });
    onChange(next);
    setOpenPaletteFor(null);
  };

  const remove = (chip: TagType) => {
    const nameLc = chip.tag_name.toLowerCase();
    const next = (value ?? []).filter((v) => {
      if (typeof v === "number") {
        const t = byId.get(v);
        return !(t && t.tag_name.toLowerCase() === nameLc);
      } else if (typeof v === "string") {
        return v.toLowerCase() !== nameLc;
      } else {
        return String(v.tag_name).toLowerCase() !== nameLc;
      }
    });
    onChange(next);
  };

  // --- input keyboard ---
  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (!showDrop) {
      if (e.key === "Enter" && lcQ.length) addNewWithColor(q, "gray");
      return;
    }
    const total = filtered.length + (canCreate ? 1 : 0);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => (i + 1) % total);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => (i - 1 + total) % total);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIdx >= 0 && activeIdx < filtered.length) {
        addExisting(filtered[activeIdx]);
      } else if (canCreate && activeIdx === filtered.length) {
        addNewWithColor(q, "gray");
      }
    } else if (e.key === "Escape") {
      setActiveIdx(-1);
      setQ("");
    }
  };

  return (
    <div
      className="relative w-full rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm focus-within:border-gray-600 focus-within:ring-2 focus-within:ring-gray-100"
      role="group"
      aria-label="Tags"
    >
      {/* Selected chips (click to open palette; Ctrl/Cmd+Click to cycle) */}
      <div className="flex flex-wrap items-center gap-2">
        {selectedChips.map((t) => {
          const cfg = TAG_COLORS[t.tag_color] ?? TAG_COLORS.gray;
          const textColor =
            t.tag_color === "yellow" ? cfg.textColor || "#1a1a1a" : "white";
          const chipKey = `${t.tag_name.toLowerCase()}`;

          return (
            <span key={chipKey} className="relative inline-flex items-center gap-1">
              <button
                type="button"
                title="Click to change color • Ctrl/Cmd+Click to cycle"
                aria-haspopup="true"
                aria-expanded={openPaletteFor === chipKey}
                onClick={(e) => {
                  if (e.metaKey || e.ctrlKey) {
                    changeChipColor(t, nextColor(t.tag_color));
                  } else {
                    setOpenPaletteFor((k) => (k === chipKey ? null : chipKey));
                  }
                }}
                onKeyDown={(e) => {
                  if (!openPaletteFor) return;
                  if (["1", "2", "3", "4"].includes(e.key)) {
                    const idx = Number(e.key) - 1;
                    changeChipColor(t, COLOR_ORDER[idx]);
                  } else if (e.key === "Escape") {
                    setOpenPaletteFor(null);
                  }
                }}
                className="rounded focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                <Badge
                  style={{ backgroundColor: cfg.primary, color: textColor }}
                  className="font-medium text-xs px-2 py-1"
                >
                  {t.tag_name}
                </Badge>
              </button>

              <button
                type="button"
                onClick={() => remove(t)}
                aria-label={`Remove ${t.tag_name}`}
                className="rounded px-1 text-gray-500 hover:bg-gray-100 cursor-pointer text-xs"
              >
                ×
              </button>

              {openPaletteFor === chipKey && (
                <div
                  ref={paletteRef}
                  className="absolute z-30 mt-7 -ml-1 cursor-pointer rounded-md border border-gray-200 bg-white p-2 shadow-lg"
                  onMouseDown={(e) => e.preventDefault()}
                  role="dialog"
                  aria-label={`Choose color for ${t.tag_name}`}
                >
                  <div className="flex items-center gap-2">
                    {COLOR_ORDER.map((c, i) => (
                      <button
                        key={c}
                        type="button"
                        className={`h-5 w-5 cursor-pointer rounded-md ring-1 ring-black/10 ${
                          c === t.tag_color ? " outline-2 outline-gray-400" : ""
                        }`}
                        style={{ backgroundColor: TAG_COLORS[c].primary }}
                        onClick={() => changeChipColor(t, c)}
                        title={`${c} (press ${i + 1})`}
                        aria-label={`Set ${t.tag_name} to ${c}`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </span>
          );
        })}

        {/* Input */}
        <input
          value={q}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setQ(e.target.value);
            setActiveIdx(-1);
            setOpenPaletteFor(null);
          }}
          onKeyDown={onKeyDown}
          placeholder={selectedChips.length ? "" : placeholder}
          className="min-w-[10ch] flex-1 border-0 p-1 text-sm outline-none focus:ring-0"
        />
      </div>

      {/* Single-row dropdown */}
      {showDrop && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-60 overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
          <div role="listbox" className="p-2 flex flex-wrap items-center gap-2">
            {filtered.map((t, i) => {
              const picked =
                selectedIdSet.has(t.id) ||
                selectedNameSet.has(t.tag_name.toLowerCase());
              const cfg = TAG_COLORS[t.tag_color];
              const textColor =
                t.tag_color === "yellow" ? cfg.textColor || "#1a1a1a" : "white";
              const active = i === activeIdx;
              return (
                <button
                  key={t.id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => addExisting(t)}
                  disabled={picked}
                  className={`cursor-pointer rounded-md focus:outline-none focus:ring-2 focus:ring-gray-200 disabled:opacity-60 disabled:cursor-not-allowed ${
                    active ? "ring-2 ring-gray-300" : ""
                  }`}
                >
                  <span
                    className="inline-flex items-center rounded px-2 py-1 text-xs font-medium shadow-sm"
                    style={{ backgroundColor: cfg.primary, color: textColor }}
                  >
                    {t.tag_name}
                  </span>
                </button>
              );
            })}

            {canCreate && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600">Create “{q.trim()}” as:</span>
                {COLOR_ORDER.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => addNewWithColor(q, c)}
                    className="rounded-md"
                    title={`Create as ${c}`}
                  >
                    <span
                      className="inline-flex items-center rounded px-2 py-1 text-xs font-medium shadow-sm"
                      style={{
                        backgroundColor: TAG_COLORS[c].primary,
                        color:
                          c === "yellow"
                            ? TAG_COLORS[c].textColor || "#1a1a1a"
                            : "white",
                      }}
                    >
                      {q.trim()}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


/** ========================= Read-only Modals (Liked/Disliked) ========================= */
function LikedByModal({
  open,
  customers,
  onClose,
}: {
  open: boolean;
  customers: SimpleCustomer[];
  onClose: () => void;
}) {
  const [q, setQ] = React.useState("");
  React.useEffect(() => {
    if (open) setQ("");
  }, [open]);

  const filtered = React.useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(s) ||
        (c.email ? c.email.toLowerCase().includes(s) : false)
    );
  }, [q, customers]);

  return (
    <Modal show={open} size="xl" onClose={onClose}>
      <div className="p-5 space-y-4 min-h-[520px]">
        <div className="text-lg font-semibold text-gray-900">Customers (liked)</div>

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name or email…"
          className="w-full rounded-lg border border-gray-300 bg-white p-2 text-sm outline-none focus:border-gray-600 focus:ring-2 focus:ring-gray-100"
        />

        <div className="h-[45vh] overflow-y-auto rounded-lg border border-gray-200 bg-white">
          {filtered.length === 0 ? (
            <div className="p-4 text-sm text-gray-500">No customers found.</div>
          ) : (
            <ul role="list" className="grid grid-cols-1 md:grid-cols-2 gap-1 md:gap-2 p-1">
              {filtered.map((c) => (
                <li
                  key={c.id}
                  className="flex items-start justify-between rounded-md border border-transparent p-3 hover:bg-gray-50 md:border md:border-gray-200"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium text-sm text-gray-900">{c.name}</div>
                    {c.email && <div className="truncate text-xs text-gray-500">{c.email}</div>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex justify-end pt-3 border-t border-gray-200">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 cursor-pointer bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}

function DislikedByModal({
  open,
  customers,
  onClose,
}: {
  open: boolean;
  customers: SimpleCustomer[];
  onClose: () => void;
}) {
  const [q, setQ] = React.useState("");
  React.useEffect(() => {
    if (open) setQ("");
  }, [open]);

  const filtered = React.useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(s) ||
        (c.email ? c.email.toLowerCase().includes(s) : false)
    );
  }, [q, customers]);

  return (
    <Modal show={open} size="xl" onClose={onClose}>
      <div className="p-5 space-y-4 min-h-[520px]">
        <div className="text-lg font-semibold text-gray-900">Customers (disliked)</div>

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name or email…"
          className="w-full rounded-lg border border-gray-300 bg-white p-2 text-sm outline-none focus:border-gray-600 focus:ring-2 focus:ring-gray-100"
        />

        <div className="h-[45vh] overflow-y-auto rounded-lg border border-gray-200 bg-white">
          {filtered.length === 0 ? (
            <div className="p-4 text-sm text-gray-500">No customers found.</div>
          ) : (
            <ul role="list" className="grid grid-cols-1 md:grid-cols-2 gap-1 md:gap-2 p-1">
              {filtered.map((c) => (
                <li
                  key={c.id}
                  className="flex items-start justify-between rounded-md border border-transparent p-3 hover:bg-gray-50 md:border md:border-gray-200"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium text-sm text-gray-900">{c.name}</div>
                    {c.email && <div className="truncate text-xs text-gray-500">{c.email}</div>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex justify-end pt-3 border-t border-gray-200">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 cursor-pointer bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}

/** ========================= Editable Modal (Preferred/Avoid) ========================= */
function SelectCustomersModal({
  open,
  title,
  customers,
  initialSelectedIds,
  onClose,
  onSave,
}: {
  open: boolean;
  title: string;
  customers: SimpleCustomer[];
  initialSelectedIds: Array<number | string>;
  onClose: () => void;
  onSave: (ids: number[]) => void;
}) {
  const [q, setQ] = React.useState("");
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [activeIdx, setActiveIdx] = React.useState<number>(-1);
  const [hasFocus, setHasFocus] = React.useState(false);
  const blurTimer = React.useRef<number | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setQ("");
    setActiveIdx(-1);
    setHasFocus(false);
    setSelected(new Set(initialSelectedIds.map((x) => String(x))));
    setTimeout(() => inputRef.current?.focus(), 0);
    return () => {
      if (blurTimer.current) {
        window.clearTimeout(blurTimer.current);
        blurTimer.current = null;
      }
    };
  }, [open, initialSelectedIds]);

  const isChecked = (id: number) => selected.has(String(id));
  const toggle = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      const key = String(id);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const handleSave = () => {
    const ids = Array.from(selected).map((x) => Number(x)).filter((n) => Number.isFinite(n));
    onSave(ids as number[]);
    onClose();
  };

  const suggestions = React.useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    return customers
      .filter(
        (c) =>
          c.name.toLowerCase().includes(s) ||
          (c.email ? c.email.toLowerCase().includes(s) : false)
      )
      .slice(0, 8);
  }, [q, customers]);

  const listData = React.useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) {
      const selIds = new Set(Array.from(selected));
      return customers.filter((c) => selIds.has(String(c.id)));
    }
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(s) ||
        (c.email ? c.email.toLowerCase().includes(s) : false)
    );
  }, [q, customers, selected]);

  const showDrop = hasFocus && q.trim().length > 0 && suggestions.length > 0;

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (!showDrop) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => (i - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const pick = suggestions[activeIdx >= 0 ? activeIdx : 0];
      if (pick) {
        toggle(pick.id);
        setQ("");
        setActiveIdx(-1);
        inputRef.current?.focus();
      }
    } else if (e.key === "Escape") {
      setActiveIdx(-1);
      setQ("");
    }
  };

  const onInputBlur: React.FocusEventHandler<HTMLInputElement> = () => {
    blurTimer.current = window.setTimeout(() => setHasFocus(false), 120);
  };
  const onInputFocus: React.FocusEventHandler<HTMLInputElement> = () => {
    if (blurTimer.current) {
      window.clearTimeout(blurTimer.current);
      blurTimer.current = null;
    }
    setHasFocus(true);
  };

  return (
    <Modal show={open} size="xl" onClose={onClose}>
      <div className="p-5 space-y-4 min-h-[520px]">
        <div className="text-lg font-semibold text-gray-900">{title}</div>

        <div className="relative">
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setActiveIdx(-1);
            }}
            onKeyDown={onKeyDown}
            onFocus={onInputFocus}
            onBlur={onInputBlur}
            placeholder="Type a name or email to add…"
            className="w-full rounded-lg border  border-gray-300 bg-white p-2 text-sm outline-none focus:border-gray-600 focus:ring-2 focus:ring-gray-100"
          />
          {showDrop && (
            <div
              onMouseDown={(e) => e.preventDefault()}
              className="absolute left-0 right-0 z-10  mt-1 max-h-64 overflow-auto rounded-lg border border-gray-300 bg-white shadow-lg"
            >
              {suggestions.map((c, i) => {
                const active = i === activeIdx;
                const picked = isChecked(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      toggle(c.id);
                      setQ("");
                      setActiveIdx(-1);
                      inputRef.current?.focus();
                    }}
                    className={`flex w-full cursor-pointer items-start gap-2 px-3 py-2 text-left ${
                      active ? "bg-gray-600 text-white" : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className={`truncate font-medium text-sm ${active ? "text-white" : "text-gray-900"}`}>
                        {c.name}
                      </div>
                      {c.email && (
                        <div className={`truncate text-xs ${active ? "text-white/80" : "text-gray-500"}`}>
                          {c.email}
                        </div>
                      )}
                    </div>
                    {picked && (
                      <span className={`${active ? "text-white" : "text-gray-600"} text-xs font-semibold`}>
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div
          className={`h-[45vh] overflow-y-auto rounded-lg border border-gray-200 bg-white ${showDrop ? "hidden" : ""}`}
          aria-hidden={showDrop}
        >
          {listData.length === 0 ? (
            <div className="p-4 text-sm text-gray-500">
              {q.trim()
                ? "No customers found."
                : "No customers selected yet. Use the search above to add."}
            </div>
          ) : (
            <ul role="list" className="grid grid-cols-1 md:grid-cols-2 gap-1 md:gap-2 p-1">
              {listData.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center gap-3 rounded-md border border-transparent p-3 hover:bg-gray-50 md:border md:border-gray-200"
                >
                  <input
                    id={`pick-${c.id}`}
                    type="checkbox"
                    checked={isChecked(c.id)}
                    onChange={() => toggle(c.id)}
                    className="h-4 w-4 rounded border-gray-300 text-gray-600 focus:ring-gray-500"
                  />
                  <label htmlFor={`pick-${c.id}`} className="min-w-0 flex-1 cursor-pointer">
                    <div className="truncate font-medium text-sm text-gray-900">{c.name}</div>
                    {c.email && <div className="truncate text-xs text-gray-500">{c.email}</div>}
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <div className="text-xs text-gray-500">Selected: {Array.from(selected).length}</div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-lg border border-gray-300 cursor-pointer bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="rounded-lg bg-gray-600 px-6 py-2 text-sm font-semibold cursor-pointer text-white hover:bg-gray-700"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

/** ========================= Main ========================= */
export default function PreferencesDetails({ form, onChange }: Props) {
  const { customers } = useCustomers();
  const { services } = useServices();

  /** ---- Services → categories ---- */
  const categoryOptions = React.useMemo(() => {
    const raw = (services || []).map((s: any, idx: number) => {
      const id = s.categoryId ?? s.category_id ?? s.category?.id ?? idx + 1;
      const name =
        s.categoryName ??
        s.category_name ??
        s.category?.name ??
        s.category ??
        s.name ??
        `Category ${idx + 1}`;
      return { id: Number(id), name: String(name) };
    });
    const map = new Map<string, { id: number; name: string }>();
    raw.forEach((o) => {
      if (!map.has(o.name)) map.set(o.name, o);
    });
    return Array.from(map.values());
  }, [services]);

  /** ---- Normalize all customers ---- */
  const allCustomers: SimpleCustomer[] = React.useMemo(
    () =>
      (customers || []).map((c: any) => ({
        id: c.id,
        name: `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim() || c.name || `Customer ${c.id}`,
        email: c.email ?? undefined,
      })),
    [customers]
  );

  /** ---- Read-only lists (show ALL) ---- */
  const likedList = allCustomers;
  const dislikedList = allCustomers;

  /** ---- Editable lists stored in form ---- */
  const preferredIds = React.useMemo(
    () => extractIdListFromForm((form as any).preferredCustomerIds),
    [form]
  );
  const avoidIds = React.useMemo(
    () => extractIdListFromForm((form as any).avoidCustomerIds),
    [form]
  );

  const nameById = React.useMemo(() => {
    const map = new Map<number, string>();
    allCustomers.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [allCustomers]);

  const preferredPreviewNames = React.useMemo(() => {
    const names = preferredIds
      .map((v) => toId(v))
      .filter((v): v is number => v !== null)
      .map((id) => nameById.get(id))
      .filter(Boolean) as string[];
    return names;
  }, [preferredIds, nameById]);

  const avoidPreviewNames = React.useMemo(() => {
    const names = avoidIds
      .map((v) => toId(v))
      .filter((v): v is number => v !== null)
      .map((id) => nameById.get(id))
      .filter(Boolean) as string[];
    return names;
  }, [avoidIds, nameById]);

  /** ---- Modal visibility ---- */
  const [openLiked, setOpenLiked] = React.useState(false);
  const [openDisliked, setOpenDisliked] = React.useState(false);
  const [openPreferred, setOpenPreferred] = React.useState(false);
  const [openAvoid, setOpenAvoid] = React.useState(false);

  /** ---- Small stat card ---- */
  const StatCard = ({
    names,
    countOverride,
    moreClassName = "text-gray-600",
  }: {
    names?: string[];
    countOverride?: number;
    moreClassName?: string;
  }) => {
    const count = typeof countOverride === "number" ? countOverride : (names?.length ?? 0);
    const shown = (names ?? []).slice(0, 2);
    const remaining = Math.max(0, count - shown.length);

    return (
      <div className="group flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-left text-sm ">
        <span className="truncate text-xs">
          {count === 0 ? (
            "None"
          ) : (
            <>
              {shown.join(", ")}
              {remaining > 0 && (
                <>
                  {" "}
                  <span className={`font-medium ${moreClassName}`}>+{remaining} more</span>
                </>
              )}
            </>
          )}
        </span>

        <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
          {count}
        </span>
      </div>
    );
  };

  return (
    <div className="bg-gray-50 p-4 space-y-6">
      {/* Tags — now backed by useTags + badge styling parity */}
      <FormRow cols={1}>
        <Field label="Tags" size="lg">
          <ProviderTagsPicker
            value={(form.tags as any) ?? []}
            onChange={(next) => onChange("tags", next as any)}
          />
        </Field>
      </FormRow>

      {/* Services */}
      <FormRow cols={1}>
        <Field label="Services" size="lg">
          <MultiSelectDropdown
            options={categoryOptions}
            selected={form.categoryIds}
            onChange={(ids) => onChange("categoryIds", ids)}
            placeholder="Select services"
          />
        </Field>
      </FormRow>

      {/* Preferences */}
      <FormRow cols={1}>
        <Field label="Preferences" size="lg">
          <div className="space-y-4">
            {/* Row 1: Liked / Disliked */}
            <FormRow>
              <Field label="Liked by (Customers)" size="sm" onClick={() => setOpenLiked(true)}>
                <StatCard
                  countOverride={likedList.length}
                  names={likedList.slice(0, 2).map((c) => c.name)}
                />
              </Field>

              <Field label="Disliked by (Customers)" size="sm" onClick={() => setOpenDisliked(true)}>
                <StatCard
                  countOverride={dislikedList.length}
                  names={dislikedList.slice(0, 2).map((c) => c.name)}
                />
              </Field>
            </FormRow>

            {/* Row 2: Team Preferred / Team Avoid */}
            <FormRow>
              <Field
                label="Team Preferred (Customers)"
                size="sm"
                onClick={() => setOpenPreferred(true)}
              >
                <StatCard names={preferredPreviewNames} />
              </Field>

              <Field label="Team Avoid (Customers)" size="sm" onClick={() => setOpenAvoid(true)}>
                <StatCard names={avoidPreviewNames} />
              </Field>
            </FormRow>
          </div>
        </Field>
      </FormRow>

      {/* Read-only Modals */}
      <LikedByModal open={openLiked} customers={likedList} onClose={() => setOpenLiked(false)} />
      <DislikedByModal
        open={openDisliked}
        customers={dislikedList}
        onClose={() => setOpenDisliked(false)}
      />

      {/* Editable Modals */}
      <SelectCustomersModal
        open={openPreferred}
        title="Select preferred customers for this team"
        customers={allCustomers}
        initialSelectedIds={extractIdListFromForm(form.preferredCustomerIds)}
        onClose={() => setOpenPreferred(false)}
        onSave={(ids) => onChange("preferredCustomerIds", ids as any)}
      />

      <SelectCustomersModal
        open={openAvoid}
        title="Select customers this team should avoid"
        customers={allCustomers}
        initialSelectedIds={extractIdListFromForm(form.avoidCustomerIds)}
        onClose={() => setOpenAvoid(false)}
        onSave={(ids) => onChange("avoidCustomerIds", ids as any)}
      />
    </div>
  );
}
