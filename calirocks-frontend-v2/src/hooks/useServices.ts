// src/hooks/useServices.ts
import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { Service } from "../types/service";
import usePrivateService from "./Auth/usePrivateService";
import { useFrequencies } from "./useFrequencies";

export const useServices = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [variables, setVariables] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [addons, setAddons] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [optionsLoaded, setOptionsLoaded] = useState(false);
  const privateService = usePrivateService();
  const { frequencies } = useFrequencies();

  // Prevent multiple simultaneous fetches
  const isFetchingRef = useRef(false);
  const hasInitialized = useRef(false); 

  const mockProviders = useMemo(
    () => [
      { id: 1, name: "John's Cleaning Service" },
      { id: 2, name: "SparkleClean Co." },
      { id: 3, name: "Premium Home Care" },
      { id: 4, name: "FastClean Solutions" },
      { id: 5, name: "Elite Maintenance Group" },
      { id: 6, name: "Green Clean Team" },
      { id: 7, name: "Pro Service Partners" },
      { id: 8, name: "Quality Care Services" },
    ],
    [],
  );

  // Create lookup maps for better performance
  const lookupMaps = useMemo(() => {
    const variableMap: Record<number, any> = {};
    variables.forEach((v) => {
      variableMap[v.id] = v;
    });

    const categoryMap: Record<string, any> = {};
    categories.forEach((c) => {
      categoryMap[c.id] = c;
    });

    const locationMap: Record<number, any> = {};
    locations.forEach((l) => {
      locationMap[l.id] = l;
    });

    const addonMap: Record<number, any> = {};
    addons.forEach((a) => {
      addonMap[a.id] = a;
    });

    const frequencyMap: Record<number, any> = {};
    frequencies.forEach((f) => {
      frequencyMap[f.id] = f;
    });

    const providerMap: Record<number, any> = {};
    mockProviders.forEach((p) => {
      providerMap[p.id] = p;
    });

    return {
      variableMap,
      categoryMap,
      locationMap,
      addonMap,
      frequencyMap,
      providerMap,
    };
  }, [variables, categories, locations, addons, frequencies, mockProviders]);

  const serviceOptions = useMemo(
    () => ({
      categories: categories
        .filter((cat) => cat.status === "active")
        .map((cat) => ({ id: parseInt(cat.id), name: cat.name })),
      locations: locations
        .filter((loc) => loc.status === "active")
        .map((loc) => ({ id: loc.id, name: loc.name })),
      addons: addons
        .filter((a) => a.status === "active")
        .map((a) => ({ id: a.id, name: a.name, price: a.price })),
      variables: variables
        .filter((v) => v.status === "active")
        .map((v) => ({
          id: v.id,
          name: v.name,
          price: v.price_amount,
        })),
      providers: mockProviders,
      frequencies: frequencies.filter((f) => f.status === "active"),
    }),
    [categories, variables, frequencies, locations, addons, mockProviders],
  );

  // Fetch all options in parallel - only once
  const fetchAllOptions = useCallback(async () => {
    if (isFetchingRef.current || optionsLoaded) return;
    isFetchingRef.current = true;

    try {
      const [categoriesRes, variablesRes, locationsRes, addonsRes] =
        await Promise.all([
          privateService
            .get("/categories")
            .catch(() => ({ data: { data: [] } })),
          privateService
            .get("/variables")
            .catch(() => ({ data: { data: [] } })),
          privateService
            .get("/locations")
            .catch(() => ({ data: { data: [] } })),
          privateService.get("/addons").catch(() => ({ data: { data: [] } })),
        ]);

      setCategories(categoriesRes.data.data || []);
      setVariables(variablesRes.data.data || []);
      setLocations(locationsRes.data.data || []);
      setAddons(addonsRes.data.data || []);
      setOptionsLoaded(true);
    } catch (error) {
      console.error("Error fetching options:", error);
    } finally {
      isFetchingRef.current = false;
    }
  }, [privateService, optionsLoaded]);

  // Helper to parse service relationships using lookup maps
  const parseServiceRelationships = useCallback(
    (svc: any) => {
      const {
        variableMap,
        categoryMap,
        locationMap,
        addonMap,
        frequencyMap,
        providerMap,
      } = lookupMaps;

      // Parse JSON fields
      const categoryIds = svc.categoryIds
        ? typeof svc.categoryIds === "string"
          ? JSON.parse(svc.categoryIds)
          : svc.categoryIds
        : [];
      const locationIds = svc.locationIds
        ? typeof svc.locationIds === "string"
          ? JSON.parse(svc.locationIds)
          : svc.locationIds
        : [];
      const variableIds = svc.variableIds
        ? typeof svc.variableIds === "string"
          ? JSON.parse(svc.variableIds)
          : svc.variableIds
        : [];
      const addonIds = svc.addonIds
        ? typeof svc.addonIds === "string"
          ? JSON.parse(svc.addonIds)
          : svc.addonIds
        : [];
      const frequencyIds = svc.frequencyIds
        ? typeof svc.frequencyIds === "string"
          ? JSON.parse(svc.frequencyIds)
          : svc.frequencyIds
        : [];
      const providerIds = svc.providerIds
        ? typeof svc.providerIds === "string"
          ? JSON.parse(svc.providerIds)
          : svc.providerIds
        : [];
      const advancedPricing = svc.advanced_pricing
        ? typeof svc.advanced_pricing === "string"
          ? JSON.parse(svc.advanced_pricing)
          : svc.advanced_pricing
        : undefined;

      // Map to objects using lookup maps (O(1) lookups)
      const cats = categoryIds
        .map((id: any) => {
          const catId = typeof id === "string" ? id : id.toString();
          const cat = categoryMap[catId];
          return cat ? { id: parseInt(cat.id), name: cat.name } : null;
        })
        .filter(Boolean);

      const locs = locationIds
        .map((id: number) => {
          const loc = locationMap[id];
          return loc ? { id: loc.id, name: loc.name } : null;
        })
        .filter(Boolean);

      const vars = variableIds
        .map((id: any) => {
          const varId = typeof id === "string" ? parseInt(id) : id;
          const variable = variableMap[varId];
          return variable
            ? {
                id: variable.id,
                name: variable.name,
                price: variable.price_amount,
              }
            : null;
        })
        .filter(Boolean);

      const addonsForService = addonIds
        .map((id: number) => {
          const addon = addonMap[id];
          return addon
            ? { id: addon.id, name: addon.name, price: addon.price }
            : null;
        })
        .filter(Boolean);

      const freqs = frequencyIds
        .map((id: number) => frequencyMap[id])
        .filter(Boolean);
      const providers = providerIds
        .map((id: number) => providerMap[id])
        .filter(Boolean);

      return {
        ...svc,
        price_amount: parseFloat(svc.price_amount) || 0,
        staff_only: Boolean(svc.staff_only),
        exclude_frequency: Boolean(svc.exclude_frequency),
        exclude_discount_code: Boolean(svc.exclude_discount_code),
        is_advanced_pricing: Boolean(svc.is_advanced_pricing),
        advanced_pricing: advancedPricing,
        allow_30min_increments: Boolean(svc.allow_30min_increments),
        allow_15min_increments: Boolean(svc.allow_15min_increments),
        has_same_day_fee: Boolean(svc.has_same_day_fee),
        same_day_fee_amount: svc.same_day_fee_amount
          ? parseFloat(svc.same_day_fee_amount)
          : 0,
        duration_minutes: svc.duration_minutes
          ? parseInt(svc.duration_minutes)
          : undefined,
        min_service_providers: svc.min_service_providers
          ? parseInt(svc.min_service_providers)
          : undefined,
        max_service_providers: svc.max_service_providers
          ? parseInt(svc.max_service_providers)
          : undefined,
        categories: cats,
        locations: locs,
        addons: addonsForService,
        variables: vars,
        frequencies: freqs,
        providers,
      };
    },
    [lookupMaps],
  );

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const response = await privateService.get("/services");
      const servicesData = response.data.data || [];
      const servicesWithData = servicesData.map(parseServiceRelationships);
      setServices(servicesWithData);
    } catch (error) {
      console.error("Error fetching services:", error);
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, [privateService, parseServiceRelationships]);

  // Initial load - fetch options first, then services - ONLY ONCE
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      fetchAllOptions();
    }
  }, []); // Empty dependency array

  // Fetch services only after options are loaded - ONLY ONCE
  useEffect(() => {
    if (optionsLoaded && frequencies.length > 0 && services.length === 0) {
      fetchServices();
    }
  }, [optionsLoaded, frequencies.length]); // Removed fetchServices from dependencies

  const validateService = useCallback((data: any) => {
    if (!data.name || data.name.trim().length < 2) {
      throw new Error("Service name must be at least 2 characters");
    }
    if (data.name.trim().length > 100) {
      throw new Error("Service name must not exceed 100 characters");
    }
    if (
      !data.is_advanced_pricing &&
      (!data.price_amount || parseFloat(data.price_amount) <= 0)
    ) {
      throw new Error("Price must be greater than 0");
    }
  }, []);

  const addService = useCallback(
    async (serviceData: any) => {
      setLoading(true);
      try {
        validateService(serviceData);
        const response = await privateService.post("/services", serviceData);
        const newService = parseServiceRelationships(response.data.data);
        setServices((prev) => [newService, ...prev]);
        return newService;
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.error ||
          error.message ||
          "Failed to create service";
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [privateService, validateService, parseServiceRelationships],
  );

  const updateService = useCallback(
    async (id: number, serviceData: any) => {
      setLoading(true);
      try {
        validateService(serviceData);
        const response = await privateService.put(
          `/services/${id}`,
          serviceData,
        );
        const updatedService = parseServiceRelationships(response.data.data);
        setServices((prev) =>
          prev.map((service) => (service.id === id ? updatedService : service)),
        );
        return updatedService;
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.error ||
          error.message ||
          "Failed to update service";
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [privateService, validateService, parseServiceRelationships],
  );

  const deleteService = useCallback(
    async (id: number): Promise<void> => {
      setLoading(true);
      try {
        await privateService.delete(`/services/${id}`);
        setServices((prev) => prev.filter((svc) => svc.id !== id));
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.error ||
          error.message ||
          "Failed to delete service";
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [privateService],
  );

  return {
    services,
    loading,
    addService,
    updateService,
    deleteService,
    serviceOptions,
  };
};
