// src/utils/mockProvidersData.ts - SINGLE SOURCE OF TRUTH

import { ProviderPerson, ServiceProvider, WageEntry } from "../types/providers";

/* ========================= INDIVIDUAL PEOPLE ========================= */
export const mockProviderPeople: ProviderPerson[] = [
  { 
    id: 1,  
    firstName: "Sarah",  
    lastName: "Johnson",  
    email: "sarah.johnson@email.com",
    phone: "+1 212-555-0111", 
    address: "123 Broadway St",
    city: "New York",
    state: "NY",
    zip: "10001",
    status: "active",   
    created_at: "2024-01-01T00:00:00Z" 
  },
  { 
    id: 2,  
    firstName: "Mark",   
    lastName: "Lewis",    
    email: "mark.lewis@email.com",
    phone: "+1 212-555-0112", 
    address: "456 Madison Ave",
    city: "New York",
    state: "NY",
    zip: "10022",
    status: "active",   
    created_at: "2024-01-01T00:00:00Z" 
  },
  { 
    id: 3,  
    firstName: "Olivia", 
    lastName: "Miller",   
    email: "olivia.miller@email.com",
    phone: "+1 310-555-0101", 
    address: "789 Sunset Blvd",
    city: "Los Angeles",
    state: "CA",
    zip: "90028",
    status: "active",   
    created_at: "2024-01-01T00:00:00Z" 
  },
  { 
    id: 4,  
    firstName: "Ethan",  
    lastName: "Davis",    
    email: "ethan.davis@email.com",
    phone: "+1 310-555-0102", 
    address: "321 Venice Beach Way",
    city: "Los Angeles",
    state: "CA",
    zip: "90291",
    status: "active",   
    created_at: "2024-01-01T00:00:00Z" 
  },
  { 
    id: 5,  
    firstName: "Sophia", 
    lastName: "Brown",    
    email: "sophia.brown@email.com",
    phone: "+1 310-555-0103", 
    address: "654 Hollywood Blvd",
    city: "Los Angeles",
    state: "CA",
    zip: "90028",
    status: "active",   
    created_at: "2024-01-01T00:00:00Z" 
  },
  { 
    id: 6,  
    firstName: "Emma",   
    lastName: "Garcia",   
    email: "emma.garcia@email.com",
    phone: "+1 415-555-0101", 
    address: "987 Market St",
    city: "San Francisco",
    state: "CA",
    zip: "94103",
    status: "archived", 
    created_at: "2024-01-01T00:00:00Z" 
  },
  { 
    id: 7,  
    firstName: "Noah",   
    lastName: "Martinez", 
    email: "noah.martinez@email.com",
    phone: "+1 415-555-0102", 
    address: "147 Mission St",
    city: "San Francisco",
    state: "CA",
    zip: "94105",
    status: "archived", 
    created_at: "2024-01-01T00:00:00Z" 
  },
  { 
    id: 8,  
    firstName: "Lucas",  
    lastName: "Wilson",   
    email: "lucas.wilson@email.com",
    phone: "+1 305-555-0101", 
    address: "258 Ocean Drive",
    city: "Miami",
    state: "FL",
    zip: "33139",
    status: "active",   
    created_at: "2024-01-01T00:00:00Z" 
  },
  { 
    id: 9,  
    firstName: "Amelia", 
    lastName: "Taylor",   
    email: "amelia.taylor@email.com",
    phone: "+1 305-555-0102", 
    address: "369 Collins Ave",
    city: "Miami",
    state: "FL",
    zip: "33140",
    status: "active",   
    created_at: "2024-01-01T00:00:00Z" 
  },
  { 
    id: 10,  
    firstName: "James",  
    lastName: "Hernandez",
    email: "james.hernandez@email.com",
    phone: "+1 305-555-0103", 
    address: "741 Biscayne Blvd",
    city: "Miami",
    state: "FL",
    zip: "33132",
    status: "active",   
    created_at: "2024-01-01T00:00:00Z" 
  },
  { 
    id: 11,  
    firstName: "Mia",    
    lastName: "Robinson", 
    email: "mia.robinson@email.com",
    phone: "+1 702-555-0101", 
    address: "852 Las Vegas Blvd",
    city: "Las Vegas",
    state: "NV",
    zip: "89101",
    status: "active",   
    created_at: "2024-01-01T00:00:00Z" 
  },
  { 
    id: 12,  
    firstName: "Liam",   
    lastName: "Walker",   
    email: "liam.walker@email.com",
    phone: "+1 702-555-0102", 
    address: "963 Fremont St",
    city: "Las Vegas",
    state: "NV",
    zip: "89104",
    status: "active",   
    created_at: "2024-01-01T00:00:00Z" 
  },
];

/* ========================= HELPER FUNCTIONS ========================= */

/** Helper to get person ID by name */
const getPersonIdByName = (first: string, last: string): number | undefined => {
  const person = mockProviderPeople.find(
    p => p.firstName === first && p.lastName === last
  );
  return person?.id;
};

/** Helper to get person details by ID */
export const getPersonById = (id: number): ProviderPerson | undefined => {
  return mockProviderPeople.find(p => p.id === id);
};

/* ========================= SERVICE PROVIDERS (TEAMS) ========================= */

export const mockServiceProviders: ServiceProvider[] = [
  {
    id: 1,
    teamTitle: "Downtown Clean",
    // Sarah Johnson is the team leader (first in array)
    memberIds: [
      getPersonIdByName("Sarah", "Johnson")!,
      getPersonIdByName("Mark", "Lewis")!,
    ],
    teamMembers: [
      { id: 1, firstName: "Sarah", lastName: "Johnson" },
      { id: 2, firstName: "Mark", lastName: "Lewis" },
    ],
    // Contact info matches Sarah Johnson (team leader)
    email: "sarah.johnson@email.com",
    phone: "+1 212-555-0111",
    status: "archived",
    created_at: "2024-02-10T09:00:00Z",
    updated_at: "2024-02-12T11:30:00Z",
    locations: ["Downtown", "Business District"],
    locationIds: [1, 3],
    wages: [
      { method: "hourly", pay: 25, effectiveDate: "2024-01-01T00:00:00Z" },
      { method: "hourly", pay: 27.5, effectiveDate: "2024-06-01T00:00:00Z", notes: "Annual raise" },
    ] as WageEntry[],
  },
  {
    id: 2,
    teamTitle: "Sparkle Pros",
    // Olivia Miller is the team leader
    memberIds: [
      getPersonIdByName("Olivia", "Miller")!,
      getPersonIdByName("Ethan", "Davis")!,
      getPersonIdByName("Sophia", "Brown")!,
    ],
    teamMembers: [
      { id: 3, firstName: "Olivia", lastName: "Miller" },
      { id: 4, firstName: "Ethan", lastName: "Davis" },
      { id: 5, firstName: "Sophia", lastName: "Brown" },
    ],
    email: "olivia.miller@email.com",
    phone: "+1 310-555-0101",
    status: "active",
    created_at: "2024-03-01T10:45:00Z",
    updated_at: "2024-03-05T15:20:00Z",
    locations: ["Suburbs"],
    locationIds: [2],
    wages: [
      { method: "percentage", pay: 35, effectiveDate: "2024-02-01T00:00:00Z" }
    ] as WageEntry[],
  },
  {
    id: 3,
    teamTitle: "Green Maid Squad",
    memberIds: [
      getPersonIdByName("Emma", "Garcia")!,
      getPersonIdByName("Noah", "Martinez")!,
    ],
    teamMembers: [
      { id: 6, firstName: "Emma", lastName: "Garcia" },
      { id: 7, firstName: "Noah", lastName: "Martinez" },
    ],
    email: "emma.garcia@email.com",
    phone: "+1 415-555-0101",
    status: "archived",
    created_at: "2024-01-22T08:30:00Z",
    updated_at: "2024-02-01T09:15:00Z",
    locations: ["Uptown", "Industrial Zone"],
    locationIds: [4, 5],
    wages: [
      { method: "flat", pay: 120, effectiveDate: "2023-11-01T00:00:00Z" },
      { method: "flat", pay: 130, effectiveDate: "2024-03-15T00:00:00Z" },
    ] as WageEntry[],
  },
  {
    id: 4,
    teamTitle: "Elite Home Service",
    memberIds: [
      getPersonIdByName("Lucas", "Wilson")!,
      getPersonIdByName("Amelia", "Taylor")!,
      getPersonIdByName("James", "Hernandez")!,
    ],
    teamMembers: [
      { id: 8, firstName: "Lucas", lastName: "Wilson" },
      { id: 9, firstName: "Amelia", lastName: "Taylor" },
      { id: 10, firstName: "James", lastName: "Hernandez" },
    ],
    email: "lucas.wilson@email.com",
    phone: "+1 305-555-0101",
    status: "active",
    created_at: "2024-02-14T12:10:00Z",
    updated_at: "2024-02-20T13:40:00Z",
    locations: ["Austin"],
    locationIds: [6],
    wages: [
      { method: "hourly", pay: 30, effectiveDate: "2024-04-01T00:00:00Z" }
    ] as WageEntry[],
  },
  {
    id: 5,
    teamTitle: "Sunshine Cleaners",
    memberIds: [
      getPersonIdByName("Mia", "Robinson")!,
      getPersonIdByName("Liam", "Walker")!,
    ],
    teamMembers: [
      { id: 11, firstName: "Mia", lastName: "Robinson" },
      { id: 12, firstName: "Liam", lastName: "Walker" },
    ],
    email: "mia.robinson@email.com",
    phone: "+1 702-555-0101",
    status: "archived",
    created_at: "2024-03-05T07:25:00Z",
    updated_at: "2024-03-08T10:00:00Z",
    locations: ["Suburbs", "Business District"],
    locationIds: [2, 3],
    wages: [
      { method: "flat", pay: 140, effectiveDate: "2024-05-01T00:00:00Z" }
    ] as WageEntry[],
  },
];

export const getTeamById = (id: number) =>
  mockServiceProviders.find((t) => t.id === id);

export const getProviderById = (id: number) =>
  mockServiceProviders.find((p) => p.id === id);

export const getProviderIdByLeaderEmail = (email: string): number | undefined =>
  mockServiceProviders.find((p) => p.email === email)?.id;