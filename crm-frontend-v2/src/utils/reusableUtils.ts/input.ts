// src/utils/inputs.ts
export const US_STATES = [
  "AK","AL","AR","AZ","CA","CO","CT","DC","DE","FL",
  "GA","HI","IA","ID","IL","IN","KS","KY","LA","MA",
  "MD","ME","MI","MN","MO","MS","MT","NC","ND","NE",
  "NH","NJ","NM","NV","NY","OH","OK","OR","PA","RI",
  "SC","SD","TN","TX","UT","VA","VT","WA","WI","WV",
  "WY",
] as const;

export type USState = (typeof US_STATES)[number];

export function onlyDigits(s: string): string {
  return s.replace(/\D+/g, "");
}

export function formatUSPhone(digits10orLess: string): string {
  const d = onlyDigits(digits10orLess).slice(0, 10);
  const len = d.length;
  if (len === 0) return "";
  if (len <= 3) return `(${d}`;
  if (len <= 6) return `(${d.slice(0,3)}) ${d.slice(3)}`;
  return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`;
}

export function isValidUSPhone10(s: string): boolean {
  return onlyDigits(s).length === 10;
}

export function isValidUSState(s?: string | null): s is USState {
  return !!s && US_STATES.includes(s.toUpperCase() as USState);
}


export function formatUSZip5(s: string): string {
  return onlyDigits(s).slice(0, 5);
}

export function isValidUSZip5(s: string): boolean {
  return onlyDigits(s).length === 5;
}