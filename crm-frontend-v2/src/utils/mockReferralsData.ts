// src/utils/mockReferralsData.ts

import {
  ReferralProgram,
  ReferralSettings,
  ReferralChangeLog,
} from "../types/referrals";

export const mockReferralPrograms: ReferralProgram[] = [
  {
    id: 1,
    startDate: "2025-02-02",
    endDate: "2025-12-20",
    discount: 40.0,
    reward: 40.0,
    status: "active",
    created_at: "2025-02-02T14:42:00Z",
    updated_at: "2025-02-02T14:42:00Z",
    created_by: "Maggy Maid",
    metrics: { newCustomers: 7 },
  },
  {
    id: 2,
    startDate: "2023-06-27",
    endDate: "2024-12-31",
    discount: 20.0,
    reward: 20.0,
    status: "active",
    created_at: "2023-06-27T10:00:00Z",
    updated_at: "2023-06-27T10:00:00Z",
    created_by: "Maggy Maid",
    metrics: { newCustomers: 1 },
  },
  {
    id: 3,
    startDate: "2021-04-01",
    endDate: "2022-12-31",
    discount: 20.0,
    reward: 20.0,
    status: "active",
    created_at: "2021-04-01T08:00:00Z",
    updated_at: "2021-04-01T08:00:00Z",
    created_by: "Maggy Maid",
    metrics: { newCustomers: 7 },
  },
  {
    id: 4,
    startDate: "2019-09-01",
    endDate: "2019-12-21",
    discount: 25.0,
    reward: 25.0,
    status: "active",
    created_at: "2019-09-01T12:00:00Z",
    updated_at: "2019-09-01T12:00:00Z",
    created_by: "Maggy Maid",
    metrics: { newCustomers: 7 },
  },
  {
    id: 5,
    startDate: "2017-12-01",
    endDate: "2018-01-31",
    discount: 20.0,
    reward: 20.0,
    status: "active",
    created_at: "2017-12-01T09:00:00Z",
    updated_at: "2017-12-01T09:00:00Z",
    created_by: "Maggy Maid",
    metrics: { newCustomers: 7 },
  },
  {
    id: 6,
    startDate: "2017-09-29",
    endDate: "2017-10-31",
    discount: 10.0,
    reward: 20.0,
    status: "active",
    created_at: "2017-09-29T11:00:00Z",
    updated_at: "2017-09-29T11:00:00Z",
    created_by: "Maggy Maid",
    metrics: { newCustomers: 5 },
  },
];

export const mockReferralSettings: ReferralSettings = {
  isEnabled: true,
  updated_at: "2025-01-15T10:00:00Z",
  updated_by: "Admin User",
};

export const mockReferralChangeLogs: ReferralChangeLog[] = [
  {
    id: 1,
    who: "Maggy Maid",
    what: "Created Referral program",
    when: "2025-02-02T14:42:00Z",
    referralId: 1,
  },
  {
    id: 2,
    who: "Maggy Maid",
    what: "Created Referral program",
    when: "2023-06-27T10:00:00Z",
    referralId: 2,
  },
];
