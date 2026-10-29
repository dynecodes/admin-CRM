// src/types/googleAnalytics.ts
export interface GoogleAnalyticsSettings {
  eventMappings: any;
  mapEventMappings(eventMappings: any): unknown;
  trackingId: string;
}
