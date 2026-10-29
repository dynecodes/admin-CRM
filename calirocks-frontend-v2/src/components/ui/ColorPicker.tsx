import * as React from "react";

/** ===================== Public default (single source of truth) ===================== */
export const COLOR_PICKER_DEFAULT = "#800080";

/** ===================== Types & helpers (self-contained) ==================== */
type RGB = { r: number; g: number; b: number };
type HSV = { h: number; s: number; v: number };

const clamp01 = (n: number) => Math.min(1, Math.max(0, n)); 
const clamp255 = (n: number) => Math.min(255, Math.max(0, Math.round(n)));

function hexToRgb(hex: string): RGB {
  const h = hex.replace("#", "").trim();
  const v =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const num = parseInt(v || "000000", 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}
function rgbToHex({ r, g, b }: RGB) {
  const s = (x: number) => clamp255(x).toString(16).padStart(2, "0");
  return `#${s(r)}${s(g)}${s(b)}`;
}
function rgbToHsv({ r, g, b }: RGB): HSV {
  const R = r / 255,
    G = g / 255,
    B = b / 255;
  const max = Math.max(R, G, B);
  const min = Math.min(R, G, B);
  const d = max - min;

  let h = 0;
  if (d !== 0) {
    switch (max) {
      case R:
        h = ((G - B) / d) % 6;
        break;
      case G:
        h = (B - R) / d + 2;
        break;
      default:
        h = (R - G) / d + 4;
    }
    h *= 60;
    if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : d / max;
  const v = max;
  return { h, s, v };
}
function hsvToRgb({ h, s, v }: HSV): RGB {
  const C = v * s;
  const X = C * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - C;
  let r = 0,
    g = 0,
    b = 0;

  if (h >= 0 && h < 60) [r, g, b] = [C, X, 0];
  else if (h < 120) [r, g, b] = [X, C, 0];
  else if (h < 180) [r, g, b] = [0, C, X];
  else if (h < 240) [r, g, b] = [0, X, C];
  else if (h < 300) [r, g, b] = [X, 0, C];
  else [r, g, b] = [C, 0, X];

  return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 };
}
function hsvToHex(hsv: HSV) {
  return rgbToHex(hsvToRgb(hsv));
}

export function normalizeHex(hex: string, fallback = COLOR_PICKER_DEFAULT) {
  if (!hex) return fallback;
  let h = hex.trim();
  if (!h.startsWith("#")) h = `#${h}`;
  if (/^#([0-9a-f]{3}){1,2}$/i.test(h)) {
    if (h.length === 4) h = `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}`;
    return h.toLowerCase();
  }
  return fallback;
}

/** =========================== Component props ============================= */
type Mode = "popover" | "inline";
export type ColorPickerProps = {
  value: string;
  onChange: (hex: string) => void;

  mode?: Mode;                 // default: "popover"
  triggerLabel?: string;       // default: "Custom"
  panelWidthClass?: string;    // default: "w-72"
  className?: string;          // wrapper
  renderTrigger?: (args: { open: boolean; toggle: () => void }) => React.ReactNode;
  presets?: string[];          // defaults below
  showPresets?: boolean;       // default: true
  showReset?: boolean;         // default: true
  defaultColor?: string;       // default: COLOR_PICKER_DEFAULT
  enableEyedropper?: boolean;  // default: true
};

/** ============================= Component ================================= */
export default function ColorPicker({
  value,
  onChange,
  mode = "popover",
  triggerLabel = "Custom",
  panelWidthClass = "w-72",
  className = "",
  presets = [
    "#10b981","#22c55e","#16a34a","#3b82f6","#60a5fa",
    "#8b5cf6","#a855f7","#1f2937","#4b5563","#d97706",
    "#f59e0b","#f97316","#ef4444","#dc2626","#93c5fd",
    "#d1d5db","#e5e7eb","#cbd5e1"
  ],
  showPresets = true,
  showReset = true,
  defaultColor = COLOR_PICKER_DEFAULT,
  enableEyedropper = true,
  renderTrigger,
}: ColorPickerProps) {
  const [open, setOpen] = React.useState(false);
  const panelRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    function handler(e: MouseEvent) {
      if (!panelRef.current) return;
      if (!panelRef.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const [hsv, setHsv] = React.useState<HSV>(() =>
    rgbToHsv(hexToRgb(normalizeHex(value, defaultColor))),
  );
  React.useEffect(() => {
    setHsv(rgbToHsv(hexToRgb(normalizeHex(value, defaultColor))));
  }, [value, defaultColor]);

  const current = hsvToHex(hsv);

  const onSBMouse = (clientX: number, clientY: number, rect: DOMRect) => {
    const x = clamp01((clientX - rect.left) / rect.width);
    const y = clamp01((clientY - rect.top) / rect.height);
    const next: HSV = { h: hsv.h, s: x, v: 1 - y };
    setHsv(next);
    onChange(hsvToHex(next));
  };
  const startSBDrag: React.MouseEventHandler<HTMLDivElement> = (e) => {
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    onSBMouse(e.clientX, e.clientY, rect);
    const move = (ev: MouseEvent) => onSBMouse(ev.clientX, ev.clientY, rect);
    const up = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  const normalizedCurrent = normalizeHex(current, defaultColor);
  const effectivePresets = React.useMemo(() => {
    const rest = presets
      .map(c => normalizeHex(c, defaultColor))
      .filter(c => c.toLowerCase() !== normalizedCurrent.toLowerCase());
    return [normalizedCurrent, ...rest];
  }, [presets, normalizedCurrent, defaultColor]);

  const handleHue = (h: number) => {
    const next = { ...hsv, h };
    setHsv(next);
    onChange(hsvToHex(next));
  };

  const setHex = (hex: string) => {
    const clean = normalizeHex(hex, defaultColor);
    onChange(clean);
    setHsv(rgbToHsv(hexToRgb(clean)));
  };

  const EyeDropperCtor =
    enableEyedropper && (window as any).EyeDropper
      ? ((window as any).EyeDropper as {
          new (): { open: () => Promise<{ sRGBHex: string }> };
        })
      : undefined;
  const pickFromScreen = async () => {
    if (!EyeDropperCtor) return;
    try {
      const eye = new EyeDropperCtor();
      const res = await eye.open();
      if (res?.sRGBHex) setHex(res.sRGBHex);
    } catch {
      /* ignore */
    }
  };

  /** -------- Picker UI (used in popover or inline modes) -------- */
  const PickerBody = (
    <div className="space-y-3">
      {/* SV Square */}
      <div className="relative">
        <div
          onMouseDown={startSBDrag}
          className="relative h-44 w-full cursor-crosshair overflow-hidden rounded-xl"
          style={{
            background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${hsv.h},100%,50%))`,
          }}
          aria-label="Saturation and brightness"
        >
          <div
            className="absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-3 border-white shadow-lg ring-1 ring-black/10"
            style={{
              left: `${hsv.s * 100}%`,
              top: `${(1 - hsv.v) * 100}%`,
              backgroundColor: current,
            }}
          />
        </div>
      </div>

      {/* Hue */}
      <div className="relative">
        <div
          className="h-3 w-full overflow-hidden rounded-full"
          style={{
            background:
              "linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)",
          }}
        />
        <input
          type="range"
          min={0}
          max={360}
          value={Math.round(hsv.h)}
          onChange={(e) => handleHue(parseInt(e.target.value, 10))}
          className="absolute top-0 left-0 h-3 w-full cursor-pointer appearance-none bg-transparent"
          style={{ WebkitAppearance: "none" }}
          aria-label="Hue"
        />
        <div
          className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-white shadow-lg ring-1 ring-black/10"
          style={{
            left: `calc(${(hsv.h / 360) * 100}% - 8px)`,
            backgroundColor: `hsl(${hsv.h}, 100%, 50%)`,
          }}
        />
      </div>

      {/* HEX field inside picker */}
      <div className="grid grid-cols-4 gap-2">
        <div className="col-span-4">
          <label className="mb-1 block text-[10px] uppercase tracking-wide text-gray-600 font-semibold">Hex</label>
          <input
            value={current.replace("#", "")}
            onChange={(e) => setHex(`#${e.target.value.replace(/[^0-9a-f]/gi, "").slice(0, 6)}`)}
            className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-xs text-center focus:border-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-500"
            maxLength={6}
          />
        </div>
      </div>

      {/* Presets */}
      {showPresets && (
        <div className="pt-1">
          <div className="flex flex-wrap gap-2">
            {effectivePresets.map((c) => {
              const isSelected = current.toLowerCase() === normalizeHex(c, defaultColor).toLowerCase();
              return (
                <button
                  key={c}
                  type="button"
                  aria-label={`Choose color ${c}`}
                  className={`h-7 w-7 rounded-full ring-1 ring-black/10 transition hover:ring-2 cursor-pointer ${
                    isSelected ? " outline-2 outline-gray-500 outline-offset-2" : ""
                  }`}
                  style={{ backgroundColor: c }}
                  onClick={() => setHex(c)}
                />
              );
            })}
            {showReset && (
              <button
                type="button"
                onClick={() => setHex(defaultColor)}
                className="ml-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-[11px] shadow-sm hover:bg-gray-50 cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      )}

      {/* Optional eyedropper button (hidden by default UI) */}
      {false && enableEyedropper && (
        <button type="button" onClick={pickFromScreen} className="text-xs underline">
          Pick from screen
        </button>
      )}

      <style>{`
        input[type="range"]{-webkit-appearance:none;appearance:none;background:transparent;}
        input[type="range"]::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:0;height:0;}
        input[type="range"]::-moz-range-thumb{width:0;height:0;border:none;background:transparent;}
      `}</style>
    </div>
  );

  if (mode === "inline") {
    return <div className={className}>{PickerBody}</div>;
  }

  const toggle = () => setOpen(s => !s);

  return (
    <div className={`relative ${className}`}>
      {/** Use custom trigger if provided (e.g., a swatch inside an input) */}
      {typeof renderTrigger === "function" ? (
        <span onClick={toggle} role="button" aria-haspopup="dialog" aria-expanded={open}>
          {renderTrigger({ open, toggle })}
        </span>
      ) : (
        <button
          type="button"
          onClick={toggle}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs shadow-sm hover:bg-gray-50 cursor-pointer"
          aria-expanded={open}
          aria-haspopup="dialog"
        >
          <span
            className="inline-block h-4 w-4 rounded-full ring-1 ring-black/10"
            style={{ backgroundColor: value }}
            aria-hidden
          />
          {triggerLabel}
        </button>
      )}

      {open && (
  <div
    ref={panelRef}
    className={`absolute left-1/2 -translate-x-[90%] sm:left-auto sm:right-0 sm:translate-x-0 z-50 mt-2 ${panelWidthClass} rounded-2xl border border-gray-200 bg-white p-4 shadow-xl`}
    role="dialog"
    aria-label="Color picker"
  >
    {PickerBody}
  </div>
)}

    </div>
  );
}
