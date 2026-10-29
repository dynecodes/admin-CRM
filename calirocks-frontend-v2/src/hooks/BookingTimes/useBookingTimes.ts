import { useState, useCallback, useEffect } from "react";
import usePrivateService from "../Auth/usePrivateService";

export const useBookingTimes = () => {
  const [serviceGroups, setServiceGroups] = useState<any[]>([]);
  const [maxSettings, setMaxSettings] = useState<any[]>([]);
  const [dailyAdjustments, setDailyAdjustments] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const privateService = usePrivateService();

  // ============ SERVICE GROUPS ============
  const fetchServiceGroups = useCallback(
    async (locationId: number) => {
      setLoading(true);
      try {
        const response = await privateService.get(
          `/booking-times/service-groups?locationId=${locationId}`
        );
        setServiceGroups(response.data.data || []);
      } catch (error) {
        console.error("Error fetching service groups:", error);
        setServiceGroups([]);
      } finally {
        setLoading(false);
      }
    },
    [privateService]
  );

  const createServiceGroup = useCallback(
    async (data: any) => {
      setLoading(true);
      try {
        const response = await privateService.post(
          "/booking-times/service-groups",
          data
        );
        setServiceGroups((prev) => [...prev, response.data.data]);
        return response.data.data;
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.error ||
          error.message ||
          "Failed to create service group";
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [privateService]
  );

  const updateServiceGroup = useCallback(
    async (id: number, data: any) => {
      setLoading(true);
      try {
        const response = await privateService.put(
          `/booking-times/service-groups/${id}`,
          data
        );
        setServiceGroups((prev) =>
          prev.map((group) =>
            group.id === id ? response.data.data : group
          )
        );
        return response.data.data;
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.error ||
          error.message ||
          "Failed to update service group";
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [privateService]
  );

  const deleteServiceGroup = useCallback(
    async (id: number) => {
      setLoading(true);
      try {
        await privateService.delete(`/booking-times/service-groups/${id}`);
        setServiceGroups((prev) => prev.filter((group) => group.id !== id));
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.error ||
          error.message ||
          "Failed to delete service group";
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [privateService]
  );

  // ============ MAXIMUM SETTINGS ============
  const fetchMaxSettings = useCallback(
    async (locationId: number) => {
      setLoading(true);
      try {
        const response = await privateService.get(
          `/booking-times/max-settings?locationId=${locationId}`
        );
        setMaxSettings(response.data.data || []);
      } catch (error) {
        console.error("Error fetching max settings:", error);
        setMaxSettings([]);
      } finally {
        setLoading(false);
      }
    },
    [privateService]
  );

  const saveMaxSettings = useCallback(
    async (locationId: number, settings: any[]) => {
      setLoading(true);
      try {
        await privateService.post("/booking-times/max-settings", {
          locationId,
          settings,
        });
        setMaxSettings(settings);
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.error ||
          error.message ||
          "Failed to save maximum settings";
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [privateService]
  );

  // ============ DAILY ADJUSTMENTS ============
  const fetchDailyAdjustments = useCallback(
    async (locationId: number, startDate: string, endDate: string) => {
      setLoading(true);
      try {
        const response = await privateService.get(
          `/booking-times/daily-adjustments?locationId=${locationId}&startDate=${startDate}&endDate=${endDate}`
        );
        setDailyAdjustments(response.data.data || []);
      } catch (error) {
        console.error("Error fetching daily adjustments:", error);
        setDailyAdjustments([]);
      } finally {
        setLoading(false);
      }
    },
    [privateService]
  );

  const saveDailyAdjustments = useCallback(
    async (locationId: number, adjustments: any[]) => {
      setLoading(true);
      try {
        await privateService.post("/booking-times/daily-adjustments", {
          locationId,
          adjustments,
        });
        setDailyAdjustments(adjustments);
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.error ||
          error.message ||
          "Failed to save daily adjustments";
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [privateService]
  );

  // ============ HOLIDAYS ============
  const fetchHolidays = useCallback(async () => {
    setLoading(true);
    try {
      const response = await privateService.get("/booking-times/holidays");
      setHolidays(response.data.data || []);
    } catch (error) {
      console.error("Error fetching holidays:", error);
      setHolidays([]);
    } finally {
      setLoading(false);
    }
  }, [privateService]);

  const createHoliday = useCallback(
    async (data: any) => {
      setLoading(true);
      try {
        const response = await privateService.post(
          "/booking-times/holidays",
          data
        );
        setHolidays((prev) => [...prev, response.data.data]);
        return response.data.data;
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.error ||
          error.message ||
          "Failed to create holiday";
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [privateService]
  );

  const updateHoliday = useCallback(
    async (id: number, data: any) => {
      setLoading(true);
      try {
        const response = await privateService.put(
          `/booking-times/holidays/${id}`,
          data
        );
        setHolidays((prev) =>
          prev.map((holiday) =>
            holiday.id === id ? response.data.data : holiday
          )
        );
        return response.data.data;
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.error ||
          error.message ||
          "Failed to update holiday";
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [privateService]
  );

  const deleteHoliday = useCallback(
    async (id: number) => {
      setLoading(true);
      try {
        await privateService.delete(`/booking-times/holidays/${id}`);
        setHolidays((prev) => prev.filter((holiday) => holiday.id !== id));
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.error ||
          error.message ||
          "Failed to delete holiday";
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [privateService]
  );

  const fetchAdvancedGroupsSetting = useCallback(
    async (locationId: number) => {
      setLoading(true);
      try {
        const response = await privateService.get(
          `/booking-times/max-settings/advanced-groups/setting?locationId=${locationId}`
        );
        return response.data.data.enabled ?? false;
      } catch (error) {
        console.error("Error fetching advanced groups setting:", error);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [privateService]
  );

  const saveAdvancedGroupsSetting = useCallback(
    async (locationId: number, enabled: boolean) => {
      setLoading(true);
      try {
        const response = await privateService.post(
          "/booking-times/max-settings/advanced-groups/setting",
          { locationId, enabled }
        );
        return response.data.data.enabled ?? false;
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.error ||
          error.message ||
          "Failed to save advanced groups setting";
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [privateService]
  );

  useEffect(() => {
    fetchHolidays();
  }, [fetchHolidays]);

  return {
    // State
    serviceGroups,
    maxSettings,
    dailyAdjustments,
    holidays,
    loading,

    // Service Groups
    fetchServiceGroups,
    createServiceGroup,
    updateServiceGroup,
    deleteServiceGroup,

    // Max Settings
    fetchMaxSettings,
    saveMaxSettings,

    // Daily Adjustments
    fetchDailyAdjustments,
    saveDailyAdjustments,

    // Holidays
    fetchHolidays,
    createHoliday,
    updateHoliday,
    deleteHoliday,

    fetchAdvancedGroupsSetting,
    saveAdvancedGroupsSetting,

  };
};