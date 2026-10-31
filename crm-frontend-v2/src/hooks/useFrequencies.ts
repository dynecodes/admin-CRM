import { useState, useCallback, useMemo, useEffect } from 'react';
import { Frequency, FrequencyFormData, FrequencyOptions } from '../types/frequency';
import usePrivateService from './Auth/usePrivateService';

const FREQUENCY_TYPE_INTERVALS: Record<string, number> = {
  'One Time': 0,
  'Every Week': 7,
  'Every 2 Weeks': 14,
  'Every 3 Weeks': 21,
  'Every 4 Weeks': 28,
};

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const useFrequencies = () => {
  const [frequencies, setFrequencies] = useState<Frequency[]>([]);
  const [loading, setLoading] = useState(false);
  const [allServices, setAllServices] = useState<any[]>([]);
  const privateService = usePrivateService();

  const frequencyOptions: FrequencyOptions = useMemo(() => {
    // Return all active services from the database
    return {
      services: allServices.filter(s => s.status === 'active').map(s => ({ 
        id: s.id, 
        name: s.name 
      })).sort((a, b) => a.name.localeCompare(b.name)),
    };
  }, [allServices]);

  const fetchFrequencies = useCallback(async () => {
    setLoading(true);
    try {
      const response = await privateService.get('/frequencies');
      const frequenciesData = response.data.data || [];
      
      // Fetch all services to map IDs to names
      const servicesResponse = await privateService.get('/services');
      const servicesData = servicesResponse.data.data || [];
      
      // Store all services for the options
      setAllServices(servicesData);
      
      // Create a map of service IDs to service objects
      const serviceMap = new Map(
        servicesData.map((s: any) => [s.id, { id: s.id, name: s.name }])
      );
      
      // Map serviceIds to actual service objects
      const enrichedFrequencies = frequenciesData.map((freq: any) => {
        let serviceIds = [];
        if (freq.serviceIds) {
          try {
            serviceIds = typeof freq.serviceIds === 'string' 
              ? JSON.parse(freq.serviceIds) 
              : freq.serviceIds;
          } catch (e) {
            console.error('Error parsing serviceIds:', e);
            serviceIds = [];
          }
        }
        
        const services = serviceIds
          .map((id: number) => serviceMap.get(id))
          .filter((s: any) => s !== undefined);
        
        return {
          ...freq,
          services,
        };
      });
      
      setFrequencies(enrichedFrequencies);
    } catch (error) {
      console.error('Error fetching frequencies:', error);
      setFrequencies([]);
    } finally {
      setLoading(false);
    }
  }, [privateService]);

  useEffect(() => {
    fetchFrequencies();
  }, [fetchFrequencies]);

  const validateFrequency = useCallback((data: FrequencyFormData) => {
    if (!data.name || data.name.trim().length < 2) {
      throw new Error('Frequency name must be at least 2 characters');
    }
    if (data.name.trim().length > 50) {
      throw new Error('Frequency name must not exceed 50 characters');
    }

    if (data.frequency_type === 'Custom') {
      if (data.custom_every < 1) {
        throw new Error('Custom frequency interval must be at least 1 week');
      }
    }

    if (data.discount_value < 0) {
      throw new Error('Discount value cannot be negative');
    }

    if (data.discount_type === 'percentage' && data.discount_value > 100) {
      throw new Error('Percentage discount cannot exceed 100%');
    }

    if (data.discount_apply_mode === 'after' && data.discount_after_n < 1) {
      throw new Error('Discount after number must be at least 1');
    }
  }, []);

  const addFrequency = useCallback(async (frequencyData: FrequencyFormData) => {
    setLoading(true);
    try {
      validateFrequency(frequencyData);
      
      const dataToSend = {
        name: frequencyData.name,
        frequency_type: frequencyData.frequency_type,
        custom_every: frequencyData.custom_every,
        custom_days: frequencyData.custom_days,
        discount_type: frequencyData.discount_type,
        discount_value: frequencyData.discount_value,
        discount_apply_mode: frequencyData.discount_apply_mode,
        discount_after_n: frequencyData.discount_after_n,
        status: frequencyData.status,
        is_default: frequencyData.is_default,
        staff_only: frequencyData.staff_only,
        services: frequencyData.services,
      };
      
      const response = await privateService.post('/frequencies', dataToSend);
      const newFrequency = response.data.data;
      
      // Refresh to get updated data with service names
      await fetchFrequencies();
      
      return newFrequency;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to create frequency';
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [privateService, validateFrequency, fetchFrequencies]);

  const updateFrequency = useCallback(async (id: number, frequencyData: FrequencyFormData) => {
    setLoading(true);
    try {
      validateFrequency(frequencyData);
      
      const dataToSend = {
        name: frequencyData.name,
        frequency_type: frequencyData.frequency_type,
        custom_every: frequencyData.custom_every,
        custom_days: frequencyData.custom_days,
        discount_type: frequencyData.discount_type,
        discount_value: frequencyData.discount_value,
        discount_apply_mode: frequencyData.discount_apply_mode,
        discount_after_n: frequencyData.discount_after_n,
        status: frequencyData.status,
        is_default: frequencyData.is_default,
        staff_only: frequencyData.staff_only,
        services: frequencyData.services,
      };
      
      const response = await privateService.put(`/frequencies/${id}`, dataToSend);
      const updatedFrequency = response.data.data;
      
      // Refresh to get updated data with service names
      await fetchFrequencies();
      
      return updatedFrequency;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to update frequency';
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [privateService, validateFrequency, fetchFrequencies]);

  const deleteFrequency = useCallback(async (id: number): Promise<void> => {
    setLoading(true);
    try {
      await privateService.delete(`/frequencies/${id}`);
      setFrequencies(prev => prev.filter(freq => freq.id !== id));
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to delete frequency';
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [privateService]);

  const frequencyUtils = useMemo(() => ({
    parseCustomFrequency: (frequency_label: string): { every: number; days: number[] } => {
      let every = 1;
      let days: number[] = [];
      
      if (frequency_label.startsWith('Custom: Every ')) {
        // Try to match both formats: with and without "on"
        const matchWithDays = frequency_label.match(/Custom: Every (\d+) weeks? on (.+)$/);
        const matchWithoutDays = frequency_label.match(/Custom: Every (\d+) weeks?$/);
        
        if (matchWithDays) {
          every = parseInt(matchWithDays[1], 10) || 1;
          const daysStr = matchWithDays[2];
          const dayNames = daysStr.split('/');
          days = dayNames.map(name => {
            const fullName = WEEKDAYS.find(day => day.startsWith(name));
            return fullName ? WEEKDAYS.indexOf(fullName) : -1;
          }).filter(idx => idx !== -1);
        } else if (matchWithoutDays) {
          every = parseInt(matchWithoutDays[1], 10) || 1;
          days = [];
        }
      }
      
      return { every, days };
    },

    getFrequencyTypeFromLabel: (frequency_label: string): string => {
      if (frequency_label.startsWith('Custom:')) return 'Custom';
      return Object.keys(FREQUENCY_TYPE_INTERVALS).find(key => key === frequency_label) || 'Every Week';
    }
  }), []);

  return {
    frequencies,
    loading,
    addFrequency,
    updateFrequency,
    deleteFrequency,
    frequencyUtils,
    frequencyOptions
  };
};