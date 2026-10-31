let initialized = false;

export function initGA(measurementId: string) {
  if (!measurementId || initialized) return;

  // Create script tag
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  // Init dataLayer
  (window as any).dataLayer = (window as any).dataLayer || [];
  function gtag(...args: any[]) {
    (window as any).dataLayer.push(args);
  }
  (window as any).gtag = gtag;

  gtag("js", new Date());

  // Enable debug mode for localhost
  gtag("config", measurementId, {
    debug_mode: true,
  });

  initialized = true;
}
