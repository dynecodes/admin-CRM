import { useState, useCallback, useEffect, useRef } from "react";
import { Addon, AddonOptions } from "../types/addon";
import usePrivateService from "./Auth/usePrivateService";

export const useAddons = () => {
  const [addons, setAddons] = useState<Addon[]>([]);
  const [loading, setLoading] = useState(true); // Start as true for initial load
  const [serviceOptions, setServiceOptions] = useState<Array<{ id: number; name: string }>>([]);
  const privateService = usePrivateService();
  const hasFetchedRef = useRef(false);

  const addonOptions: AddonOptions = {
    services: serviceOptions
  };

  const fetchAddons = useCallback(async (services: Array<{ id: number; name: string }>) => {
    try {
      const response = await privateService.get('/addons');
      const addonsData = response.data.data || [];
      
      // Map serviceIds to service objects from serviceOptions
      const addonsWithServices = addonsData.map((addon: any) => {
        const serviceIds = addon.serviceIds || [];
        const mappedServices = serviceIds
          .map((id: number) => services.find(s => s.id === id))
          .filter((s: any) => s !== undefined);
        
        return {
          ...addon,
          services: mappedServices
        };
      });
      
      setAddons(addonsWithServices);
    } catch (error) {
      console.error('Error fetching addons:', error);
      setAddons([]);
    }
  }, [privateService]);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch services first
        const response = await privateService.get('/services');
        const servicesData = response.data.data || [];
        const options = servicesData
          .filter((s: any) => s.status === 'active')
          .map((s: any) => ({ id: s.id, name: s.name }));
        setServiceOptions(options);
        
        // Then fetch addons with the services
        await fetchAddons(options);
      } catch (error) {
        console.error('Error fetching data:', error);
        setServiceOptions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [privateService, fetchAddons]);

  const validateAddon = useCallback((data: any) => {
    if (!data.name || data.name.trim().length < 2) {
      throw new Error("Addon name must be at least 2 characters");
    }
    if (!data.price || parseFloat(data.price) <= 0) {
      throw new Error("Price must be greater than 0");
    }
  }, []);

  const addAddon = useCallback(async (addonData: any) => {
    setLoading(true); // Re-added this
    try {
      validateAddon(addonData);

      const response = await privateService.post('/addons', addonData);
      const newAddon = response.data.data;
      
      // Map serviceIds to service objects
      const serviceIds = newAddon.serviceIds || [];
      const services = serviceIds
        .map((id: number) => serviceOptions.find(s => s.id === id))
        .filter((s: any) => s !== undefined);
      
      const addonWithServices = {
        ...newAddon,
        services: services
      };
      
      setAddons(prev => [addonWithServices, ...prev]);
      return addonWithServices;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to create addon';
      throw new Error(errorMessage);
    } finally {
      setLoading(false); // Re-added this
    }
  }, [privateService, validateAddon, serviceOptions]);

  const updateAddon = useCallback(async (id: number, addonData: any) => {
    setLoading(true); // Re-added this
    try {
      validateAddon(addonData);

      const response = await privateService.put(`/addons/${id}`, addonData);
      const updatedAddon = response.data.data;
      
      // Map serviceIds to service objects
      const serviceIds = updatedAddon.serviceIds || [];
      const services = serviceIds
        .map((id: number) => serviceOptions.find(s => s.id === id))
        .filter((s: any) => s !== undefined);
      
      const addonWithServices = {
        ...updatedAddon,
        services: services
      };
      
      setAddons(prev => prev.map(addon => 
        addon.id === id ? addonWithServices : addon
      ));
      return addonWithServices;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to update addon';
      throw new Error(errorMessage);
    } finally {
      setLoading(false); // Re-added this
    }
  }, [privateService, validateAddon, serviceOptions]);

  const toggleAddonStatus = useCallback((id: number) => {
    setAddons(prev =>
      prev.map(addon =>
        addon.id === id
          ? {
              ...addon,
              status: addon.status === "active" ? "archived" : "active",
            }
          : addon
      )
    );
  }, []);

  return {
    addons,
    loading,
    addAddon,
    updateAddon,
    toggleAddonStatus,
    addonOptions,
  };
};