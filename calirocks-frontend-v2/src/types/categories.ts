export type CategoryStatus = "active" | "archived";

export type ServiceLite = {
  id: string;
  name: string;
};

export type Category = {
  id: string;
  name: string;

  serviceIds: string[];
  status: CategoryStatus;
  created_at: string;
  updated_at: string;
};

export type CategoryRow = Category & {
  services: ServiceLite[];
};
