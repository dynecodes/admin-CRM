// src/utils/sameDayFee.ts
import type { CutoffDay } from "../components/services/SameDayFeeSection";

/**
 * Returns true if the same-day fee should apply.
 * @param cutoffDay  "dayBefore" | "dayOf"
 * @param cutoffTime "HH:mm" (24h)
 * @param serviceStart ISO string for the scheduled service start
 * @param bookedAt     ISO string when the customer placed the booking
 */
export function isSameDayFeeApplicable(
  cutoffDay: CutoffDay,
  cutoffTime: string,
  serviceStart: string,
  bookedAt: string,
): boolean {
  const start = new Date(serviceStart);
  const placed = new Date(bookedAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(placed.getTime()))
    return false;

  // Build the cutoff Date based on the selected rule.
  const cutoff = new Date(start);
  if (cutoffDay === "dayBefore") {
    cutoff.setDate(cutoff.getDate() - 1);
  }
  const [hh, mm] = (cutoffTime || "00:00")
    .split(":")
    .map((v) => parseInt(v, 10) || 0);
  cutoff.setHours(hh, mm, 0, 0);

  return placed.getTime() > cutoff.getTime();
}
