import { useState, useCallback, useEffect } from "react";
import usePrivateService from "./Auth/usePrivateService";

export const useServiceSettings = () => {
  const [settings, setSettings] = useState<any>({
    same_day_fee: 0,
    before_hour_fee: 0,
    after_hour_fee: 0,
  });
  const [loading, setLoading] = useState(false);
  const privateService = usePrivateService();

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await privateService.get("/services-settings");
      const data = response.data.data;
      // PARSE ALL AS NUMBERS
      setSettings({
        same_day_fee: parseFloat(data.same_day_fee) || 0,
        before_hour_fee: parseFloat(data.before_hour_fee) || 0,
        after_hour_fee: parseFloat(data.after_hour_fee) || 0,
      });
    } catch (error) {
      console.error("Error fetching service settings:", error);
      setSettings({
        same_day_fee: 0,
        before_hour_fee: 0,
        after_hour_fee: 0,
      });
    } finally {
      setLoading(false);
    }
  }, [privateService]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = useCallback(
    async (data: any) => {
      setLoading(true);
      try {
        const response = await privateService.put("/services-settings", data);
        const responseData = response.data.data;
        // PARSE ALL AS NUMBERS
        setSettings({
          same_day_fee: parseFloat(responseData.same_day_fee) || 0,
          before_hour_fee: parseFloat(responseData.before_hour_fee) || 0,
          after_hour_fee: parseFloat(responseData.after_hour_fee) || 0,
        });
        return responseData;
      } catch (error: any) {
        throw new Error(
          error.response?.data?.error ||
            error.message ||
            "Failed to update settings"
        );
      } finally {
        setLoading(false);
      }
    },
    [privateService]
  );

  return {
    settings,
    loading,
    updateSettings,
    refetch: fetchSettings,
  };
};