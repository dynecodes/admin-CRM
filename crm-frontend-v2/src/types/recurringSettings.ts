export type RecurringDiscountMode = "all_bookings" | "exclude_first";

export interface RecurringSettings {
  mode: RecurringDiscountMode;
  blockCount: number;
}
