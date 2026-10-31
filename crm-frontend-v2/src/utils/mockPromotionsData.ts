// src/utils/mockPromotionsData.ts
import { Promotion } from "../types/promotions";

export const mockPromotions: Promotion[] = [
  {
    id: 1,
    code: "WELCOME10",
    discount: "10% off",
    type: "Booking",
    // sample booking lists to feed the modal
    activeBookings: [
      { customer: "Nina Tepper", serviceDate: "2025-11-22" },
      { customer: "Alice Maltin", serviceDate: "2025-11-11" },
      { customer: "Xionghua Wilson Wu", serviceDate: "2025-10-17" },
      { customer: "Gerald Shenk", serviceDate: "2025-12-07" },
      { customer: "Dawnart Properties", serviceDate: "2025-12-01" },
      { customer: "Mia Hays", serviceDate: "2025-12-01" },
      { customer: "Lance Roberts", serviceDate: "2025-11-24" },
      { customer: "Kristie Cummings", serviceDate: "2025-11-22" },
      { customer: "Martina White", serviceDate: "2025-11-17" },
      { customer: "Theresa A", serviceDate: "2025-11-15" },
      { customer: "Meredith Childers", serviceDate: "2025-11-10" },
      { customer: "Eddie Delgadillo", serviceDate: "2025-11-08" },
    ],
    cancelledBookings: [
      { customer: "Jane K.", serviceDate: "2025-10-08" },
      { customer: "Paul S.", serviceDate: "2025-09-29" },
      { customer: "Rita G.", serviceDate: "2025-09-17" },
    ],
    // keep this for the table, but we’ll also recompute in the hook
    usageCount: 12,
    limit: { newCustomerAfter: "2025-01-01" }, //perCustomer: 1, perCode: 100,
    daysOfWeek: {
      sun: true,
      mon: true,
      tue: true,
      wed: true,
      thu: true,
      fri: true,
      sat: true,
    },
    serviceDateStart: "2025-01-01",
    serviceDateEnd: "2025-12-31",
    expirationDate: "2025-12-23",
    status: "active",
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-10T00:00:00Z",
  },
  {
    id: 2,
    code: "FALL25",
    discount: "$25 off",
    type: "Booking",
    activeBookings: [
      { customer: "Kristin O.", serviceDate: "2025-09-13" },
      { customer: "Hector L.", serviceDate: "2025-10-01" },
      { customer: "Bruce T.", serviceDate: "2025-10-12" },
      { customer: "Pam V.", serviceDate: "2025-11-05" },
    ],
    cancelledBookings: [{ customer: "Ian D.", serviceDate: "2025-09-20" }],
    usageCount: 4,
    limit: { newCustomerAfter: "2016-09-01" },
    daysOfWeek: {
      sun: false,
      mon: true,
      tue: true,
      wed: true,
      thu: true,
      fri: true,
      sat: false,
    },
    serviceDateStart: "2025-09-01",
    serviceDateEnd: "2025-11-30",
    expirationDate: "2025-12-20",
    status: "active",
    created_at: "2025-08-15T00:00:00Z",
    updated_at: "2025-09-01T00:00:00Z",
  },
];

// Back-compat alias so older imports (`mockDiscounts`) don’t crash
export const mockDiscounts = mockPromotions;
