// src/components/customers/EditForm/Details.tsx
import * as React from "react";
import { Modal, ToggleSwitch } from "flowbite-react";
import { useTags } from "../../../hooks/useTags";
import { useProviders } from "../../../hooks/Providers/useProviders";
import type { TagColor } from "../../../types/tag";

/** ========================= Props / Form shape ========================= */
export type CustomerDetailsForm = {
  // Tags can be: string names, numeric ids, or { tag_name, tag_color }
  tags?: Array<number | string | { tag_name: string; tag_color: TagColor }>;
  // Preferences (teams)
  preferredTeamIds?: Array<number | string>;
  avoidTeamIds?: Array<number | string>;
  // Special tax (moved here from Info tab)
  specialSalesTaxEnabled?: boolean;
  specialSalesTaxPercent?: number | null;
};

type Props = {
  form: CustomerDetailsForm;
  onChange: <K extends keyof CustomerDetailsForm>(k: K, v: CustomerDetailsForm[K]) => void;
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
  const clickable = typeof onClick === "function";
  return (
    <div className="min-w-0 space-y-2">
      <div className={labelClass}>{label}</div>
      <div
        className={[
          "min-w-0",
          clickable
            ? "cursor-pointer rounded-lg outline-none ring-0 focus-visible:ring-2 focus-visible:ring-blue-500"
            : "",
        ].join(" ")}
        role={clickable ? "button" : undefined}
        tabIndex={clickable ? 0 : undefined}
        onClick={onClick}
        onKeyDown={(e) => {
          if (!clickable) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick?.();
          }
        }}
        aria-label={clickable ? `${label}, open details` : undefined}
      >
        {children}
      </div>
    </div>
  );
}

function FormRow({ children, cols = 1 }: { children: React.ReactNode; cols?: 1 | 2 }) {
  const cls =
    cols === 2
      ? "grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6"
      : "grid grid-cols-1 gap-4";
  return <div className={cls}>{children}</div>;
}

/** ========================= Helpers ========================= */
type TagType = { id: number; tag_name: string; tag_color: TagColor };

const TAG_COLORS: Record<
  TagColor,
  { primary: string; bg: string; label: string; textColor?: string }
> = {
  blue: { primary: "#1976f2", bg: "#e3f2fd", label: "Blue" },
  yellow: { primary: "#f5f117", bg: "#ffffe0", label: "Yellow", textColor: "#1a1a1a" },
  orange: { primary: "#ff9800", bg: "#fff3e0", label: "Orange" },
  purple: { primary: "#9c27b0", bg: "#f3e5f5", label: "Purple" },
};

type SimpleTeam = { id: number; name: string; email?: string };

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
        (item as any).teamId ??
        (item as any).team_id ??
        (item as any).value;
      if (maybe != null) {
        const n = Number(maybe);
        out.push(Number.isFinite(n) ? n : String(maybe));
      }
    }
  }
  return out;
}

/** ========================= Tags Picker (customer) ========================= */
function CustomerTagsPicker({
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
  const { tags, updateTag, addTag, loading } = useTags() as any;

  const [q, setQ] = React.useState("");
  const [activeIdx, setActiveIdx] = React.useState(-1);
  const [openPaletteFor, setOpenPaletteFor] =
    React.useState<string | null>(null);

  const COLOR_ORDER: TagColor[] = ["blue", "yellow", "orange", "purple"];
  const nextColor = (c: TagColor) =>
    COLOR_ORDER[(COLOR_ORDER.indexOf(c) + 1) % COLOR_ORDER.length];

  const tagsReady = !loading && (tags?.length ?? 0) > 0;
  const showLoadingSkeleton = !tagsReady && (value?.length ?? 0) > 0;

  /* ----------------- lookups ----------------- */

  const byId = React.useMemo(() => {
    const m = new Map<number, TagType>();
    (tags ?? []).forEach((t: any) =>
      m.set(Number(t.id), {
        id: Number(t.id),
        tag_name: String(t.tag_name),
        tag_color: (t.tag_color || "blue") as TagColor,
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
        tag_color: (t.tag_color || "blue") as TagColor,
      })
    );
    return m;
  }, [tags]);

  /* ----------------- selected chips ----------------- */

  const selectedChips = React.useMemo(() => {
    const items = (value ?? []).map((v) => {
      if (typeof v === "number") {
        const found = byId.get(v);
        if (found) return found;
        return { id: v, tag_name: String(v), tag_color: "blue" as TagColor };
      }

      if (typeof v === "string") {
        const maybeId = Number(v);
        if (Number.isFinite(maybeId)) {
          const byIdMatch = byId.get(maybeId);
          if (byIdMatch) return byIdMatch;
        }
        const found = byName.get(v.toLowerCase());
        if (found) return found;
        return {
          id: undefined as unknown as number,
          tag_name: v,
          tag_color: "blue" as TagColor,
        };
      }

      const name = String((v as any).tag_name);
      const color = ((v as any).tag_color || "blue") as TagColor;
      return {
        id:
          (v as any).id ??
          (v as any).tag_id ??
          (v as any).value ??
          (undefined as any),
        tag_name: name,
        tag_color: color,
      };
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
        s.add(String((v as any).tag_name).toLowerCase());
      }
    });
    return s;
  }, [value, byId]);

  /* ----------------- search / dropdown ----------------- */

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
  const showDrop =
    !showLoadingSkeleton && lcQ.length > 0 && (filtered.length > 0 || canCreate);

  /* ----------------- helpers (add / remove / recolor) ----------------- */

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
      onChange([item.tag_name]);
    } else {
      onChange([
        ...(value ?? []),
        { tag_name: item.tag_name, tag_color: item.tag_color },
      ]);
    }
  };

  const addExisting = (t: TagType) => {
  // prevent duplicates
  if (
    selectedIdSet.has(t.id) ||
    selectedNameSet.has(t.tag_name.toLowerCase())
  ) {
    return;
  }

  // Always add by name (string). pushItem will respect the current form shape.
  pushItem(t, false);

  setQ("");
  setActiveIdx(-1);
};


  const addNewWithColor = async (name: string, color: TagColor) => {
    const finalName = name.trim();
    if (!finalName) return;
    if (selectedNameSet.has(finalName.toLowerCase())) return;

      try {
    if (typeof addTag === "function") {
      const created = await addTag({
        tag_name: finalName,
        tag_color: color,
      });

      const tag: TagType = {
        id: created?.id ?? (undefined as any),
        tag_name: created?.tag_name ?? finalName,
        tag_color: (created?.tag_color ?? color) as TagColor,
      };

      // Always add by *name* (string) into the form
      pushItem(tag, false);
    } else {
      const tag: TagType = {
        id: undefined as unknown as number,
        tag_name: finalName,
        tag_color: color,
      };
      pushItem(tag, false);
    }

    setQ("");
    setActiveIdx(-1);
  } catch (e) {
    console.error("Failed to create tag", e);
  }

  };

  const changeChipColor = async (chip: TagType, color: TagColor) => {
    if (
      typeof chip.id === "number" &&
      Number.isFinite(chip.id) &&
      typeof updateTag === "function"
    ) {
      try {
        await updateTag(chip.id, {
          tag_name: chip.tag_name,
          tag_color: color,
        });
      } catch (err) {
        console.error("Failed to update tag color", err);
      } finally {
        setOpenPaletteFor(null);
      }
      return;
    }

    const nameLc = chip.tag_name.toLowerCase();
    const next: Array<
      number | string | { tag_name: string; tag_color: TagColor }
    > = [];

    (value ?? []).forEach((v) => {
      if (typeof v === "number") {
        const t = byId.get(v);
        if (t && t.tag_name.toLowerCase() === nameLc) {
          next.push({ tag_name: chip.tag_name, tag_color: color });
        } else next.push(v);
      } else if (typeof v === "string") {
        const maybeId = Number(v);
        const tById = Number.isFinite(maybeId) ? byId.get(maybeId) : undefined;
        if (tById && tById.tag_name.toLowerCase() === nameLc) {
          next.push({ tag_name: chip.tag_name, tag_color: color });
        } else if (v.toLowerCase() === nameLc) {
          next.push({ tag_name: chip.tag_name, tag_color: color });
        } else {
          next.push(v);
        }
      } else if (v && typeof v === "object") {
        if (String((v as any).tag_name).toLowerCase() === nameLc) {
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
        if (typeof chip.id === "number" && v === chip.id) return false;
        const t = byId.get(v);
        if (t && t.tag_name.toLowerCase() === nameLc) return false;
        return true;
      } else if (typeof v === "string") {
        const maybeId = Number(v);
        if (
          typeof chip.id === "number" &&
          Number.isFinite(maybeId) &&
          maybeId === chip.id
        )
          return false;
        return v.toLowerCase() !== nameLc;
      } else {
        return String((v as any).tag_name).toLowerCase() !== nameLc;
      }
    });
    onChange(next);
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = async (e) => {
    if (!showDrop) {
      if (e.key === "Enter" && lcQ.length) {
        e.preventDefault();
        await addNewWithColor(q, "blue");
      }
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
        await addNewWithColor(q, "blue");
      }
    } else if (e.key === "Escape") {
      setActiveIdx(-1);
      setQ("");
    }
  };

  /* ----------------- render ----------------- */

  return (
    <div
      className="relative w-full rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100"
      role="group"
      aria-label="Tags"
    >
      <div className="flex flex-wrap items-center gap-2">
        {showLoadingSkeleton ? (
          Array.from({ length: value?.length ?? 0 }).map((_, i) => (
            <span
              key={i}
              className="h-7 w-14 rounded-sm bg-gray-100 animate-pulse"
            />
          ))
        ) : (
          <>
            {selectedChips.map((t) => {
              const cfg = TAG_COLORS[t.tag_color] ?? TAG_COLORS.blue;
              const textColor =
                t.tag_color === "yellow"
                  ? cfg.textColor || "#1a1a1a"
                  : "white";
              const chipKey = `${t.tag_name.toLowerCase()}`;

              return (
                <span
                  key={chipKey}
                  className="relative inline-flex items-center"
                >
                  <button
                    type="button"
                    title="Click to change color • Ctrl/Cmd+Click to cycle"
                    aria-haspopup="true"
                    aria-expanded={openPaletteFor === chipKey}
                    onClick={(e) => {
                      if (e.metaKey || e.ctrlKey) {
                        changeChipColor(t, nextColor(t.tag_color));
                      } else {
                        setOpenPaletteFor((k) =>
                          k === chipKey ? null : chipKey
                        );
                      }
                    }}
                    className="inline-flex items-center gap-1 rounded-sm px-2 py-1 text-xs font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    style={{ backgroundColor: cfg.primary, color: textColor }}
                  >
                    <span>{t.tag_name}</span>
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        remove(t);
                      }}
                      aria-label={`Remove ${t.tag_name}`}
                      className="ml-1 text-[11px] leading-none opacity-80 hover:opacity-100 cursor-pointer"
                    >
                      ×
                    </span>
                  </button>

                  {openPaletteFor === chipKey && (
                    <div
                      className="absolute z-30 mt-7 -ml-1 cursor-pointer rounded-md border border-gray-200 bg-white p-2 shadow-lg"
                      role="dialog"
                      aria-label={`Choose color for ${t.tag_name}`}
                    >
                      <div className="flex items-center gap-2">
                        {(["blue", "yellow", "orange", "purple"] as TagColor[])
                          .map((c, i) => (
                            <button
                              key={c}
                              type="button"
                              className="h-5 w-5 cursor-pointer rounded-md ring-1 ring-black/10"
                              style={{
                                backgroundColor: TAG_COLORS[c].primary,
                              }}
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
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setActiveIdx(-1);
                setOpenPaletteFor(null);
              }}
              onKeyDown={onKeyDown}
              placeholder={selectedChips.length ? "" : placeholder}
              className="min-w-[10ch] flex-1 border-0 p-1 text-sm outline-none focus:ring-0"
            />
          </>
        )}
      </div>

      {!showLoadingSkeleton && showDrop && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 max-height-60 overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
          <div role="listbox" className="p-2 flex flex-wrap items-center gap-2">
            {filtered.map((t, i) => {
              const picked =
                selectedIdSet.has(t.id) ||
                selectedNameSet.has(t.tag_name.toLowerCase());
              const cfg = TAG_COLORS[t.tag_color];
              const textColor =
                t.tag_color === "yellow"
                  ? cfg.textColor || "#1a1a1a"
                  : "white";
              const active = i === activeIdx;
              return (
                <button
                  key={t.id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => addExisting(t)}
                  disabled={picked}
                  className={`cursor-pointer rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:opacity-60 disabled:cursor-not-allowed ${
                    active ? "ring-2 ring-blue-300" : ""
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
                <span className="text-xs text-gray-600">
                  Create “{q.trim()}” as:
                </span>
                {["blue", "yellow", "orange", "purple"].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => addNewWithColor(q, c as TagColor)}
                    className="rounded-md"
                    title={`Create as ${c}`}
                  >
                    <span
                      className="inline-flex items-center rounded px-2 py-1 text-xs font-medium shadow-sm"
                      style={{
                        backgroundColor: TAG_COLORS[c as TagColor].primary,
                        color:
                          c === "yellow"
                            ? TAG_COLORS.yellow.textColor || "#1a1a1a"
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


/** ========================= Small stat card ========================= */
function StatCard({
  names,
  countOverride,
  moreClassName = "text-blue-600",
}: {
  names?: string[];
  countOverride?: number;
  moreClassName?: string;
}) {
  const count = typeof countOverride === "number" ? countOverride : (names?.length ?? 0);
  const shown = (names ?? []).slice(0, 2);
  const remaining = Math.max(0, count - shown.length);
  return (
    <div className="group flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-left text-sm">
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
}

/** ========================= Select Teams Modal (with dropdown-like flow) ========================= */
function SelectTeamsModal({
  open,
  title,
  teams,
  initialSelectedIds,
  onClose,
  onSave,
  blockedIds = [],
}: {
  open: boolean;
  title: string;
  teams: SimpleTeam[];
  initialSelectedIds: Array<number | string>;
  onClose: () => void;
  onSave: (ids: number[]) => void;
  blockedIds?: Array<number | string>;
}) {
  const [q, setQ] = React.useState("");
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  // Dropdown state
  const [activeIdx, setActiveIdx] = React.useState<number>(-1);
  const [hasFocus, setHasFocus] = React.useState(false);
  const blurTimer = React.useRef<number | null>(null);

  // Normalize blocked
  const blockedSet = React.useMemo(() => {
    const s = new Set<string>();
    (blockedIds ?? []).forEach((v) => s.add(String(v)));
    return s;
  }, [blockedIds]);

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
  const isBlocked = (id: number) => blockedSet.has(String(id));

  const toggle = (id: number) => {
    if (isBlocked(id)) return;
    setSelected((prev) => {
      const next = new Set(prev);
      const key = String(id);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const handleSave = () => {
    const ids = Array.from(selected)
      .filter((x) => !blockedSet.has(x))
      .map((x) => Number(x))
      .filter((n) => Number.isFinite(n));
    onSave(ids as number[]);
    onClose();
  };

  const s = q.trim().toLowerCase();
  const hasSearch = s.length > 0;

  // Suggestions for dropdown (only when searching)
  const suggestions = React.useMemo(() => {
    if (!hasSearch) return [];
    return teams
      .filter(
        (t) =>
          !isBlocked(t.id) &&
          (t.name.toLowerCase().includes(s) ||
            (t.email ? t.email.toLowerCase().includes(s) : false))
      )
      .slice(0, 50);
  }, [hasSearch, s, teams, blockedSet]);

  const showDrop = hasFocus && suggestions.length > 0;

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
      if (pick && !isBlocked(pick.id)) {
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

  // “Show only selected unless searching” list below the input
  const listData = React.useMemo(() => {
    if (!hasSearch) {
      const selIds = new Set<string>(Array.from(selected));
      return teams.filter((t) => selIds.has(String(t.id)));
    }
    return teams.filter(
      (t) =>
        !isBlocked(t.id) &&
        (t.name.toLowerCase().includes(s) ||
          (t.email ? t.email.toLowerCase().includes(s) : false))
    );
  }, [hasSearch, s, teams, selected, blockedSet]);

  const emptyState = (!hasSearch
    ? selected.size === 0
      ? "Type to search teams…"
      : ""
    : "No teams found.");

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
            placeholder="Search teams…"
            className="w-full rounded-lg border border-gray-300 bg-white p-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />

          {showDrop && (
            <div
              onMouseDown={(e) => e.preventDefault()}
              className="absolute left-0 right-0 z-20 mt-1 max-h-72 overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg"
              role="listbox"
            >
              <ul className="divide-y divide-gray-100">
                {suggestions.map((t, i) => {
                  const active = i === activeIdx;
                  const blocked = isBlocked(t.id);
                  return (
                    <li key={t.id}>
                      <button
                        type="button"
                        disabled={blocked}
                        onClick={() => {
                          if (blocked) return;
                          toggle(t.id);
                          setQ("");
                          setActiveIdx(-1);
                          inputRef.current?.focus();
                        }}
                        className={[
                          "w-full text-left px-4 py-3 transition",
                          active ? "bg-gray-100" : "hover:bg-gray-50",
                          blocked ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
                        ].join(" ")}
                        aria-selected={active}
                        role="option"
                      >
                        <div className="truncate font-medium text-sm text-gray-900">
                          {t.name}
                        </div>
                        {t.email && (
                          <div className="truncate text-xs text-gray-500">{t.email}</div>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        <div
          className={`h-[45vh] overflow-y-auto rounded-lg border border-gray-200 bg-white ${showDrop ? "hidden" : ""}`}
        >
          {listData.length === 0 ? (
            <div className="p-4 text-sm text-gray-500">{emptyState}</div>
          ) : (
            <ul role="list" className="grid grid-cols-1 md:grid-cols-2 gap-1 md:gap-2 p-1">
              {listData.map((t) => {
                const checked = isChecked(t.id);
                const blocked = isBlocked(t.id);
                return (
                  <li
                    key={t.id}
                    className={`flex items-center gap-3 rounded-md border border-transparent p-3 ${
                      blocked
                        ? "opacity-60 cursor-not-allowed bg-gray-50"
                        : "hover:bg-gray-50 md:border md:border-gray-200"
                    }`}
                    title={blocked ? "Already selected in the other list" : undefined}
                  >
                    <input
                      id={`team-${t.id}`}
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(t.id)}
                      disabled={blocked}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label
                      htmlFor={`team-${t.id}`}
                      className={`min-w-0 flex-1 ${blocked ? "cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      <div className="truncate font-medium text-sm text-gray-900">{t.name}</div>
                      {t.email && (
                        <div className="truncate text-xs text-gray-500">{t.email}</div>
                      )}
                    </label>
                  </li>
                );
              })}
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
              className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold cursor-pointer text-white hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

/** ========================= Main (Customer Details) ========================= */
export default function CustomerDetails({ form, onChange }: Props) {
  const { providers } = useProviders();

  /** ---- Teams from providers ---- */
  const allTeams: SimpleTeam[] = React.useMemo(
    () =>
      (providers || []).map((p: any) => {
        const first = p.firstName ?? "";
        const last = p.lastName ?? "";
        const fullName = `${first} ${last}`.trim();
        const baseName = p.teamTitle ?? fullName; // nullish-only
        const name = baseName || p.name || `Team ${p.id}`; // logical OR-only
        return { id: Number(p.id), name, email: p.email ?? undefined };
      }),
    [providers]
  );

  const nameById = React.useMemo(() => {
    const map = new Map<number, string>();
    allTeams.forEach((t) => map.set(t.id, t.name));
    return map;
  }, [allTeams]);

  const preferredIds = React.useMemo(
    () => extractIdListFromForm((form as any).preferredTeamIds),
    [form]
  );
  const avoidIds = React.useMemo(
    () => extractIdListFromForm((form as any).avoidTeamIds),
    [form]
  );

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

  const [openPreferred, setOpenPreferred] = React.useState(false);
  const [openAvoid, setOpenAvoid] = React.useState(false);


    // 🔹 Normalized tags value (fallback to legacy locations)
  const tagsValue = React.useMemo(() => {
    const raw =
      (form as any).tags ??
      (form as any).details?.tags ??
      (form as any).preferences?.tags ??
      (form as any).meta?.tags ??
      [];

    if (Array.isArray(raw)) return raw;

    if (typeof raw === "string") {
      return raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }

    if (raw && typeof raw === "object") {
      return [raw];
    }

    return [];
  }, [form]);
  
  return (
    <div className="bg-gray-50 p-4 space-y-6">
      {/* Tags */}
     <FormRow cols={1}>
        <Field label="Tags" size="lg">
          <CustomerTagsPicker
            value={tagsValue as any}
            onChange={(next) => onChange("tags", next as any)}
          />
        </Field>
      </FormRow>

      {/* Special Sales Tax (moved here from Info tab) */}
      <FormRow cols={1}>
        <Field label="Special Sales Tax" size="lg">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-gray-300 bg-white px-3 py-3">
            <div>
              <div className="text-sm font-medium text-gray-900">Special Sales Tax</div>
              <div className="text-xs text-gray-500">
                Override default tax for this customer when enabled.
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ToggleSwitch
                checked={!!form.specialSalesTaxEnabled}
                label={form.specialSalesTaxEnabled ? "Enabled" : "Disabled"}
                onChange={(v) => onChange("specialSalesTaxEnabled", v)}
              />
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100"
                  placeholder="0.00"
                  value={form.specialSalesTaxPercent ?? ""}
                  onChange={(e) =>
                    onChange(
                      "specialSalesTaxPercent",
                      e.target.value === "" ? null : Number(e.target.value),
                    )
                  }
                  disabled={!form.specialSalesTaxEnabled}
                />
                <span className="text-sm text-gray-600">%</span>
              </div>
            </div>
          </div>
        </Field>
      </FormRow>

      {/* Preferences (Customer-facing: ONLY preferred / do-not-serve) */}
      <FormRow cols={1}>
        <Field label="Preferences" size="lg">
          <div className="space-y-4">
            <FormRow cols={2}>
              <Field label="Preferred Teams" size="sm" onClick={() => setOpenPreferred(true)}>
                <StatCard names={preferredPreviewNames} />
              </Field>
              <Field label="Do-Not-Serve Teams" size="sm" onClick={() => setOpenAvoid(true)}>
                <StatCard names={avoidPreviewNames} moreClassName="text-red-600" />
              </Field>
            </FormRow>
          </div>
        </Field>
      </FormRow>

      {/* Modals */}
      <SelectTeamsModal
        open={openPreferred}
        title="Select preferred teams for this customer"
        teams={allTeams}
        blockedIds={avoidIds}
        initialSelectedIds={preferredIds}
        onClose={() => setOpenPreferred(false)}
        onSave={(ids) => onChange("preferredTeamIds", ids as any)}
      />
      <SelectTeamsModal
        open={openAvoid}
        title="Select teams this customer wants to avoid"
        teams={allTeams}
        blockedIds={preferredIds}
        initialSelectedIds={avoidIds}
        onClose={() => setOpenAvoid(false)}
        onSave={(ids) => onChange("avoidTeamIds", ids as any)}
      />
    </div>
  );
}
