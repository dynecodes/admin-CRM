import React, { useRef, useEffect, useState } from "react";

interface ColorPickerSimpleProps {
  value: string;
  onChange: (hex: string) => void;
}

const ColorPickerSimple: React.FC<ColorPickerSimpleProps> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <div className="relative" ref={pickerRef}>
      <button
        onClick={() => setOpen(!open)}
        className="w-12 h-10 rounded-lg border-2 border-gray-300 cursor-pointer hover:border-gray-400 transition-colors"
        style={{ backgroundColor: value }}
        title={value}
      />
      {open && (
        <div className="absolute top-12 left-0 z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-3 w-56">
          <input
            type="color"
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
            }}
            className="w-full h-32 cursor-pointer rounded"
          />
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full mt-2 px-2 py-1 border border-gray-300 rounded text-sm font-mono text-center"
            placeholder="#000000"
          />
        </div>
      )}
    </div>
  );
};

export default ColorPickerSimple;