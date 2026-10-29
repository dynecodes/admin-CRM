// src/components/ui/CheckboxDropdown.tsx
import * as React from "react";
import { createPortal } from "react-dom";
import { Checkbox } from "flowbite-react";
import { HiChevronDown } from "react-icons/hi";

export type CDItem = {
  value: string;
  label: string;
  hint?: string;
  disabled?: boolean;
};

type Props = {
  items: CDItem[];
  values: string[];
  onChange: (next: string[]) => void;
  single?: boolean;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  errorText?: string;
  className?: string;
  menuMaxHeightPx?: number;
  gapPx?: number;
};

export default function CheckboxDropdown({
  items,
  values,
  onChange,
  single = false,
  label,
  placeholder = "Select…",
  disabled,
  errorText,
  className = "",
  menuMaxHeightPx = 260,
  gapPx = 6,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const btnRef = React.useRef<HTMLButtonElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null); // NEW: portal menu ref

  const [menuStyle, setMenuStyle] = React.useState<React.CSSProperties>({});

  // --- Close on outside click / Esc (but ignore clicks inside portal menu) ---
  React.useEffect(() => {
    if (!open) return;

    const onMouseDown = (e: MouseEvent) => {
      const t = e.target as Node;
      const insideRoot = !!rootRef.current?.contains(t);
      const insideMenu = !!menuRef.current?.contains(t);
      if (!insideRoot && !insideMenu) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);

    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggle = (v: string, dis?: boolean) => {
    if (dis) return;
    if (single) {
      const next = values.includes(v) ? [] : [v];
      onChange(next);
      setOpen(false);
      btnRef.current?.focus();
    } else {
      const next = values.includes(v)
        ? values.filter((x) => x !== v)
        : [...values, v];
      onChange(next);
    }
  };

  const selectedLabels = items.filter((i) => values.includes(i.value)).map((i) => i.label);
  const buttonText =
    selectedLabels.length === 0
      ? placeholder
      : single
      ? selectedLabels[0]
      : selectedLabels.length === 1
      ? selectedLabels[0]
      : `${selectedLabels[0]} +${selectedLabels.length - 1}`;

  const positionMenu = React.useCallback(() => {
    const btn = btnRef.current;
    if (!btn) return;

    const r = btn.getBoundingClientRect();
    const spaceBelow = window.innerHeight - r.bottom;
    const spaceAbove = r.top;
    const openUp = spaceBelow < menuMaxHeightPx + gapPx && spaceAbove > spaceBelow;

    const common: React.CSSProperties = {
      position: "fixed",
      left: Math.max(8, Math.min(r.left, window.innerWidth - r.width - 8)),
      width: r.width,
      zIndex: 100000,
    };

    if (!openUp) {
      setMenuStyle({
        ...common,
        top: r.bottom + gapPx,
        maxHeight: Math.min(menuMaxHeightPx, window.innerHeight - (r.bottom + gapPx) - 8),
      });
    } else {
      setMenuStyle({
        ...common,
        bottom: window.innerHeight - r.top + gapPx,
        maxHeight: Math.min(menuMaxHeightPx, r.top - 8 - gapPx),
      });
    }
  }, [gapPx, menuMaxHeightPx]);

  React.useLayoutEffect(() => {
    if (!open) return;
    positionMenu();

    const onScroll = () => positionMenu();
    const onResize = () => positionMenu();

    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open, positionMenu]);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      {label ? <div className="mb-1 text-sm font-medium text-gray-700">{label}</div> : null}

      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-left text-sm
          ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:bg-gray-50"}
          focus:outline-none focus:ring-2 focus:ring-gray-400`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate text-gray-700">{buttonText}</span>
        <HiChevronDown className={`ml-2 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef} // NEW
            role="listbox"
            style={menuStyle}
            className="rounded-xl border border-gray-200 bg-white p-1 shadow-xl overflow-auto"
          >
            {items.length === 0 && (
              <div className="px-3 py-2 text-sm text-gray-500">No options</div>
            )}

            {items.map((it) => {
              const checked = values.includes(it.value);
              return (
                <label
                  key={it.value}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm
                    ${it.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-gray-50"}`}
                >
                  <Checkbox
                    color="gray"
                    checked={checked}
                    onChange={() => toggle(it.value, it.disabled)}
                    disabled={it.disabled}
                    className="cursor-pointer"
                  />
                  <span className="truncate">{it.label}</span>
                  {it.hint ? <span className="ml-auto text-gray-500">{it.hint}</span> : null}
                </label>
              );
            })}
          </div>,
          document.body
        )}

      {errorText ? <p className="mt-1 text-sm text-red-600">{errorText}</p> : null}
    </div>
  );
}
