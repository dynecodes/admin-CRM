import { Location } from '../types/location';

export const mockLocations: Location[] = [
  {
    id: 1,
    name: "Downtown",
    postal_codes: ["10001", "10002", "10003", "10004", "10005"],
    status: "active",
    is_default: true,
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-20T14:30:00Z"
  },
  {
    id: 2,
    name: "Suburbs",
    postal_codes: ["10010", "10011", "10012", "10013"],
    status: "active", 
    is_default: false,
    created_at: "2024-01-18T09:15:00Z",
    updated_at: "2024-01-25T11:45:00Z"
  },
  {
    id: 3,
    name: "Business District",
    postal_codes: ["10020", "10021", "10022", "10023", "10024", "10025"],
    status: "active",
    is_default: false,
    created_at: "2024-01-22T16:20:00Z"
  },
  {
    id: 4,
    name: "Uptown",
    postal_codes: ["10030", "10031", "10032"],
    status: "active",
    is_default: false,
    created_at: "2024-01-25T08:45:00Z"
  },
  {
    id: 5,
    name: "Industrial Zone",
    postal_codes: ["10040", "10041", "10042", "10043"],
    status: "active",
    is_default: false,
    created_at: "2024-01-28T13:10:00Z"
  },
  {
    id: 6,
    name: "Old Town",
    postal_codes: ["10050", "10051"],
    status: "archived",
    is_default: false,
    created_at: "2023-12-15T14:30:00Z",
    updated_at: "2024-01-10T09:20:00Z"
  },
  {
    id: 7,
    name: "West End",
    postal_codes: ["10060", "10061", "10062", "10063", "10064"],
    status: "active",
    is_default: false,
    created_at: "2024-02-01T11:25:00Z"
  },
  {
    id: 8,
    name: "East Side",
    postal_codes: ["10070", "10071", "10072"],
    status: "active",
    is_default: false,
    created_at: "2024-02-05T15:40:00Z"
  },
  {
    id: 9,
    name: "North Ridge",
    postal_codes: ["10080", "10081"],
    status: "archived",
    is_default: false,
    created_at: "2023-11-20T10:15:00Z",
    updated_at: "2024-01-15T16:50:00Z"
  },
  {
    id: 10,
    name: "South Bay",
    postal_codes: ["10090", "10091", "10092", "10093"],
    status: "active",
    is_default: false,
    created_at: "2024-02-10T12:30:00Z"
  }
];