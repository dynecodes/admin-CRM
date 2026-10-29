// src/components/availability/ChangeAvailabilityMenu.tsx
import * as React from "react";
import { Button } from "flowbite-react";

/* ---------- types ---------- */
type Props = {
  onDefault: () => void;
  onSpecific: () => void;
  onTimeOff: () => void;
  onHistory: () => void;
};

type MenuItem = [label: string, cb: () => void];

/* ---------- component ---------- */
function ChangeAvailabilityMenu({
  onDefault,
  onSpecific,
  onTimeOff,
  onHistory,
}: Props) {
  const [open, setOpen] = React.useState(false);

  const items: MenuItem[] = [
    ["Default Availability", onDefault],
    ["Specific Date", onSpecific],
    ["Request Time Off", onTimeOff],
    ["View History", onHistory],
  ];

  // Close when clicking outside
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".availability-menu-wrapper")) setOpen(false);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  return (
    <div className="availability-menu-wrapper relative inline-block">
      <Button
        color="gray"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        className="cursor-pointer md:whitespace-nowrap"
      >
        Change Availability
      </Button>

      {open && (
        <div className="absolute top-full left-1/2 z-50 mt-2 w-56 -translate-x-1/2 rounded-md border border-gray-200 bg-white shadow-lg">
          {items.map(([label, cb]) => (
            <button
              key={label}
              onClick={() => {
                setOpen(false);
                cb();
              }}
              className="block w-full cursor-pointer px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- export ---------- */
export default ChangeAvailabilityMenu;
