// src/utils/mockSalesTaxData.ts
import {
  SalesTax,
  SalesTaxSettings,
  SalesTaxHistoryEntry,
} from "../types/salesTax";

export const mockSalesTaxSettings: SalesTaxSettings = {
  enabled: true,
};

export const mockSalesTaxes: SalesTax[] = [
  {
    id: 1,
    effective_date: "2022-05-01",
    tax_percent: 13.0,
    location_ids: [2],
    created_at: "2022-04-15T10:00:00Z",
    updated_at: "2022-04-20T14:30:00Z",
  },
  {
    id: 2,
    effective_date: "2022-04-01",
    tax_percent: 13.0,
    location_ids: [2],
    created_at: "2022-03-20T09:15:00Z",
    updated_at: "2022-03-25T11:45:00Z",
  },
  {
    id: 3,
    effective_date: "2020-10-02",
    tax_percent: 2.95,
    location_ids: [3],
    created_at: "2020-09-15T16:20:00Z",
  },
  {
    id: 4,
    effective_date: "2020-10-01",
    tax_percent: 2.95,
    location_ids: [4],
    created_at: "2020-09-10T08:45:00Z",
  },
  {
    id: 5,
    effective_date: "2020-09-18",
    tax_percent: 2.95,
    location_ids: [5],
    created_at: "2020-09-05T13:10:00Z",
  },
  {
    id: 6,
    effective_date: "2020-09-17",
    tax_percent: 2.95,
    location_ids: [6],
    created_at: "2020-09-01T14:30:00Z",
  },
  {
    id: 7,
    effective_date: "2020-09-16",
    tax_percent: 2.95,
    location_ids: [7],
    created_at: "2020-08-28T11:25:00Z",
  },
];

export const mockSalesTaxHistory: SalesTaxHistoryEntry[] = [];
