import { useState, useCallback, useMemo, useEffect } from 'react';
import { Location, LocationStatus } from '../../types/location';
import usePrivateService from '../Auth/usePrivateService';

export const useLocations = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const privateService = usePrivateService();

  const fetchLocations = useCallback(async () => {
    setLoading(true);
    try {
      const response = await privateService.get('/locations');
      setLocations(response.data.data || []);
    } catch (error) {
      console.error('Error fetching locations:', error);
      setLocations([]);
    } finally {
      setLoading(false);
    }
  }, [privateService]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const getOtherLocationsCodes = useMemo(() => {
    return (excludeLocationId?: number) => 
      locations
        .filter(loc => loc.id !== excludeLocationId)
        .flatMap(loc => loc.postal_codes);
  }, [locations]);

  const validateLocation = useCallback((data: any) => {
    if (!data.name || data.name.trim().length < 2) {
      throw new Error('Location name must be at least 2 characters');
    }
    if (data.name.trim().length > 40) {
      throw new Error('Location name must not exceed 40 characters');
    }
    if (!data.postal_codes || data.postal_codes.length === 0) {
      throw new Error('At least one postal code is required');
    }
    
    const invalidCodes = data.postal_codes.filter((code: string) => !/^\d{5}$/.test(code));
    if (invalidCodes.length > 0) {
      throw new Error(`Invalid postal codes: ${invalidCodes.join(', ')}. Must be exactly 5 digits.`);
    }

    const otherCodes = getOtherLocationsCodes(data.id);
    const duplicateCodes = data.postal_codes.filter((code: string) => otherCodes.includes(code));
    
    if (duplicateCodes.length > 0) {
      throw new Error(`Postal codes already exist in other locations: ${duplicateCodes.join(', ')}`);
    }

    const existingNames = locations
      .filter(loc => loc.id !== data.id)
      .map(loc => loc.name.toLowerCase());
    
    if (existingNames.includes(data.name.trim().toLowerCase())) {
      throw new Error('Location name already exists');
    }
  }, [locations, getOtherLocationsCodes]);

  const transformLocationData = useCallback((data: any) => {
    return {
      name: data.name.trim(),
      postal_codes: data.postal_codes.map((code: string) => code.trim()).sort(),
      status: data.status as LocationStatus,
      is_default: Boolean(data.is_default)
    };
  }, []);

  const addLocation = useCallback(async (locationData: any) => {
    setLoading(true);
    try {
      validateLocation(locationData);
      
      const response = await privateService.post('/locations', transformLocationData(locationData));
      const newLocation = response.data.data;
      
      setLocations(prev => [...prev, newLocation]);
      return newLocation;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to create location';
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [privateService, validateLocation, transformLocationData]);

  const updateLocation = useCallback(async (id: number, locationData: any) => {
    setLoading(true);
    try {
      validateLocation({ ...locationData, id });
      
      const response = await privateService.put(`/locations/${id}`, transformLocationData(locationData));
      const updatedLocation = response.data.data;
      
      setLocations(prev => prev.map(location => 
        location.id === id ? updatedLocation : location
      ));
      return updatedLocation;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to update location';
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [privateService, validateLocation, transformLocationData]);

  const deleteLocation = useCallback(async (id: number) => {
    setLoading(true);
    try {
      await privateService.delete(`/locations/${id}`);
      setLocations(prev => prev.filter(location => location.id !== id));
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to delete location';
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [privateService]);

  const toggleLocationStatus = useCallback(async (id: number) => {
    const location = locations.find(l => l.id === id);
    if (!location) return;

    const newStatus = location.status === 'active' ? 'archived' : 'active';
    await updateLocation(id, {
      ...location,
      status: newStatus
    });
  }, [locations, updateLocation]);

  const setDefaultLocation = useCallback(async (id: number) => {
    const location = locations.find(l => l.id === id);
    if (!location) return;

    await updateLocation(id, {
      ...location,
      is_default: true
    });
  }, [locations, updateLocation]);

  const postalCodeUtils = useMemo(() => ({
    checkForDuplicates: (value: string, currentLocationId?: number) => {
      const codes = value
        .split(',')
        .map(code => code.trim())
        .filter(code => /^\d{5}$/.test(code));
      
      const internalDuplicates = codes.filter((code, index) => codes.indexOf(code) !== index);
      const uniqueInternalDuplicates = [...new Set(internalDuplicates)];
      
      const otherCodes = getOtherLocationsCodes(currentLocationId);
      const crossLocationDuplicates = codes.filter(code => otherCodes.includes(code));
      
      const hasDuplicates = uniqueInternalDuplicates.length > 0 || crossLocationDuplicates.length > 0;
      
      let errorMessage = '';
      if (hasDuplicates) {
        const internalPart = uniqueInternalDuplicates.length > 0 ? `Duplicate codes: ${uniqueInternalDuplicates.join(', ')}` : '';
        const crossPart = crossLocationDuplicates.length > 0 ? `Already exist in other locations: ${crossLocationDuplicates.join(', ')}` : '';
        const errorParts = [internalPart, crossPart].filter(part => part.length > 0);
        errorMessage = errorParts.join('. ');
      }
      
      return { hasDuplicates, errorMessage };
    },

    formatInput: (value: string) => {
      const cleaned = value.replace(/[^\d,]/g, '');
      const parts = cleaned.split(',').map(part => 
        part.length > 5 ? part.substring(0, 5) : part
      );
      return parts.join(',').replace(/(\d{5}),/g, '$1, ');
    },

    getValidCodes: (input: string): string[] => {
      return input
        .split(',')
        .map(code => code.trim())
        .filter(code => /^\d{5}$/.test(code))
        .filter((code, index, arr) => arr.indexOf(code) === index)
        .sort();
    },

    getValidCodesCount: (input: string): number => {
      return input
        .split(',')
        .map(code => code.trim())
        .filter(code => /^\d{5}$/.test(code))
        .length;
    }
  }), [getOtherLocationsCodes]);

  return {
    locations,
    loading,
    addLocation,
    updateLocation,
    deleteLocation,
    toggleLocationStatus,
    setDefaultLocation,
    postalCodeUtils,
    refreshLocations: fetchLocations
  };
};