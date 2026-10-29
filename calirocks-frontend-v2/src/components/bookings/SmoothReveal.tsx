// src/components/ui/SmoothReveal.tsx
import * as React from "react";

export default function SmoothReveal({
  show,
  children,
  duration = 300,
}: {
  show: boolean;
  children: React.ReactNode;
  duration?: number; // ms
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [maxH, setMaxH] = React.useState(0);

  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setMaxH(show ? el.scrollHeight : 0);
  }, [show, children]);

  return (
    <div
      style={{
        maxHeight: maxH,
        opacity: show ? 1 : 0,
        transition: `max-height ${duration}ms ease, opacity ${Math.min(
          duration - 100,
          250
        )}ms ease`,
        overflow: "hidden",
      }}
      aria-hidden={!show}
    >
      <div ref={ref}>{children}</div>
    </div>
  );
}
