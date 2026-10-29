// src/utils/money.ts
export function currencyToNumber(s: string): number {
  if (!s) return 0;
  const v = Number(String(s).replace(/[^\d.-]+/g, ""));
  return Number.isFinite(v) ? v : 0;
}

export function formatCurrency(n: number, currency: string = "USD"): string {
  return n.toLocaleString(undefined, { style: "currency", currency });
}

export const toNum = (v: unknown, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

/** allow digits, a single dot, and an optional leading minus */
export function sanitizeMoney(s: string, allowNegative = true): string {
  if (!s) return "";
  let out = s.replace(/[^\d.\-]/g, "");
  if (!allowNegative) out = out.replace(/-/g, "");
  else out = (out.startsWith("-") ? "-" : "") + out.replace(/-/g, "");
  const i = out.indexOf(".");
  if (i !== -1) out = out.slice(0, i + 1) + out.slice(i + 1).replace(/\./g, "");
  return out;
}
