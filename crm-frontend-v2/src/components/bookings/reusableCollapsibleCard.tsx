import * as React from "react";
import { HiChevronDown } from "react-icons/hi";

type Props = {
  title: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
};

export default function CollapsibleCard({
  title,
  children,
  defaultOpen = true,
  className = "",
}: Props) {
  const [open, setOpen] = React.useState(defaultOpen);
  const [height, setHeight] = React.useState<string | number>(
    defaultOpen ? "auto" : 0,
  );
  const contentRef = React.useRef<HTMLDivElement>(null);
  const id = React.useId();

  const toggle = () => {
    const el = contentRef.current;
    if (!el) return;

    if (open) {
      // Close: lock current height, then shrink to 0
      setHeight(el.scrollHeight);
      requestAnimationFrame(() => setHeight(0));
      setOpen(false);
    } else {
      // Open: grow from 0 to measured height; switch to 'auto' after transition
      setHeight(el.scrollHeight || "auto");
      setOpen(true);
    }
  };

  const handleTransitionEnd = () => {
    // After opening finishes, switch to 'auto' so content can reflow naturally
    if (open) setHeight("auto");
  };

  return (
    <div className={`rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={toggle}
        className="flex w-full cursor-pointer items-center justify-between rounded-lg bg-gray-50 p-4 text-left hover:bg-gray-100"
      >
        <span className="text-base font-semibold text-gray-900">{title}</span>
        <HiChevronDown
          className={`h-5 w-5 text-gray-600 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {/* Animated body */}
    <div
  id={id}
  ref={contentRef}
  style={{ height, overflow: open ? "visible" : "hidden" }}
  onTransitionEnd={handleTransitionEnd}
  className={`
    transition-[height,opacity] duration-300 ease-out
    ${open ? "opacity-100" : "opacity-0"}
    motion-reduce:transition-none
  `}
>

        {/* Inner padding/skin */}
        <div className="bg-gray-50 px-4 pt-5 pb-5 sm:px-5">{children}</div>
      </div>
    </div>
  );
}
