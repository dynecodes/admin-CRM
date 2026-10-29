import { useState, useCallback, useEffect } from "react";
import usePrivateService from "./Auth/usePrivateService";

export interface CustomIcon {
  id: number;
  companyId: number;
  icon_url: string;
  icon_name: string;
  created_at: string;
}

export const useCustomIcons = () => {
  const [customIcons, setCustomIcons] = useState<CustomIcon[]>([]);
  const [loading, setLoading] = useState(false);
  const privateService = usePrivateService();

  const fetchCustomIcons = useCallback(async () => {
    setLoading(true);
    try {
      const response = await privateService.get('/custom-icons');
      setCustomIcons(response.data.data || []);
    } catch (error) {
      console.error('Error fetching custom icons:', error);
      setCustomIcons([]);
    } finally {
      setLoading(false);
    }
  }, [privateService]);

  useEffect(() => {
    fetchCustomIcons();
  }, [fetchCustomIcons]);

  const deleteCustomIcon = useCallback(async (id: number) => {
    setLoading(true);
    try {
      await privateService.delete(`/custom-icons/${id}`);
      setCustomIcons(prev => prev.filter(icon => icon.id !== id));
      return true;
    } catch (error) {
      console.error('Error deleting custom icon:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [privateService]);

  return {
    customIcons,
    loading,
    deleteCustomIcon,
    refetchCustomIcons: fetchCustomIcons,
  };
};