// src/constants/phoneCountries.ts
export type CountryMeta = {
  code: string; // 'US', 'CA', 'GB', ...
  name: string; // Human name (not shown in UI if you don't want)
  dial: string; // '+1', '+44', ...
  example: string; // Example number format for placeholders
};

export const COUNTRY_LIST: CountryMeta[] = [
  { code: "US", name: "United States", dial: "+1", example: "+1 212-555-0198" },
  { code: "CA", name: "Canada", dial: "+1", example: "+1 416-555-0123" },
  {
    code: "GB",
    name: "United Kingdom",
    dial: "+44",
    example: "+44 20 7946 0958",
  },
  { code: "IE", name: "Ireland", dial: "+353", example: "+353 1 234 5678" },
  { code: "AU", name: "Australia", dial: "+61", example: "+61 2 9876 5432" },
  { code: "NZ", name: "New Zealand", dial: "+64", example: "+64 9 123 4567" },
  { code: "DE", name: "Germany", dial: "+49", example: "+49 30 123456" },
  { code: "FR", name: "France", dial: "+33", example: "+33 1 23 45 67 89" },
  { code: "ES", name: "Spain", dial: "+34", example: "+34 912 34 56 78" },
  { code: "IT", name: "Italy", dial: "+39", example: "+39 06 6982" },
  { code: "NL", name: "Netherlands", dial: "+31", example: "+31 20 123 4567" },
  { code: "SE", name: "Sweden", dial: "+46", example: "+46 8 123 456" },
  { code: "NO", name: "Norway", dial: "+47", example: "+47 406 12 345" },
  { code: "DK", name: "Denmark", dial: "+45", example: "+45 12 34 56 78" },
  { code: "FI", name: "Finland", dial: "+358", example: "+358 9 123 4567" },
  { code: "CH", name: "Switzerland", dial: "+41", example: "+41 22 123 45 67" },
  { code: "AT", name: "Austria", dial: "+43", example: "+43 1 234567" },
  { code: "BE", name: "Belgium", dial: "+32", example: "+32 2 123 45 67" },
  { code: "PT", name: "Portugal", dial: "+351", example: "+351 21 123 4567" },
  { code: "BR", name: "Brazil", dial: "+55", example: "+55 11 91234-5678" },
  { code: "MX", name: "Mexico", dial: "+52", example: "+52 55 1234 5678" },
];

const byCode = new Map(COUNTRY_LIST.map((c) => [c.code, c]));

export function getCountryMeta(code: string): CountryMeta {
  return byCode.get(code) ?? COUNTRY_LIST[0];
}

export function dialOf(code: string): string {
  return getCountryMeta(code).dial;
}

export function exampleOf(code: string): string {
  return getCountryMeta(code).example;
}
