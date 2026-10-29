import * as React from "react";

export default function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia(`(max-width:${breakpoint - 1}px)`);
    const handler = () => setIsMobile(mq.matches);
    handler();
    mq.addEventListener?.("change", handler);
    window.addEventListener("resize", handler);
    return () => {
      mq.removeEventListener?.("change", handler);
      window.removeEventListener("resize", handler);
    };
  }, [breakpoint]);
  return isMobile;
}
