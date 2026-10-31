import * as React from "react";
import { Variable, VariableRow } from "../../types/variables";
import usePrivateService from '../Auth/usePrivateService';

type UseVariablesReturn = {
  variables: VariableRow[];
  addVariable: (input: Omit<Variable, "id" | "created_at" | "updated_at">) => Promise<VariableRow>;
  updateVariable: (id: number, patch: Partial<Omit<Variable, "id">>) => Promise<VariableRow | null>; // Changed from string to number
  deleteVariable: (id: number) => Promise<void>; // Changed from string to number
  getVariableById: (id: number) => VariableRow | undefined; // Changed from string to number
  loading: boolean;
  serviceOptions: Array<{ id: number; name: string }>;
};

export function useVariables(): UseVariablesReturn {
  const [data, setData] = React.useState<VariableRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [serviceOptions, setServiceOptions] = React.useState<Array<{ id: number; name: string }>>([]);
  const privateService = usePrivateService();

  const fetchVariables = React.useCallback(async () => {
    setLoading(true);
    try {
      const response = await privateService.get('/variables');
      const variablesData = response.data.data || [];
      console.log('Fetched variables from backend:', variablesData);
      setData(variablesData);
    } catch (error) {
      console.error('Error fetching variables:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [privateService]);

  const fetchServiceOptions = React.useCallback(async () => {
    try {
      const response = await privateService.get('/services');
      const servicesData = response.data.data || [];
      const options = servicesData
        .filter((s: any) => s.status === 'active')
        .map((s: any) => ({ id: s.id, name: s.name }));
      setServiceOptions(options);
    } catch (error) {
      console.error('Error fetching service options:', error);
      setServiceOptions([]);
    }
  }, [privateService]);

  React.useEffect(() => {
    fetchVariables();
    fetchServiceOptions();
  }, [fetchVariables, fetchServiceOptions]);

  const variables = React.useMemo(() => {
    console.log('Variables memo - raw data:', data);
    return data;
  }, [data]);

  const addVariable = React.useCallback(
    async (input: Omit<Variable, "id" | "created_at" | "updated_at">): Promise<VariableRow> => {
      setLoading(true);
      try {
        const response = await privateService.post('/variables', input);
        const newVariable = response.data.data;
        console.log('Added variable response:', newVariable);
        
        await fetchVariables();
        
        return newVariable;
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || error.message || 'Failed to create variable';
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [privateService, fetchVariables],
  );

  const updateVariable = React.useCallback(
    async (id: number, patch: Partial<Omit<Variable, "id">>): Promise<VariableRow | null> => { // Changed from string to number
      setLoading(true);
      try {
        const response = await privateService.put(`/variables/${id}`, patch);
        const updatedVariable = response.data.data;
        console.log('Updated variable response:', updatedVariable);
        
        await fetchVariables();
        
        return updatedVariable;
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || error.message || 'Failed to update variable';
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [privateService, fetchVariables],
  );

  const deleteVariable = React.useCallback(
    async (id: number): Promise<void> => { // Changed from string to number
      setLoading(true);
      try {
        await privateService.delete(`/variables/${id}`);
        setData((prev) => prev.filter((v) => v.id !== id));
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || error.message || 'Failed to delete variable';
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [privateService],
  );

  const getVariableById = React.useCallback(
    (id: number) => { // Changed from string to number
      const found = variables.find((v) => v.id === id);
      console.log(`getVariableById(${id}):`, found);
      return found;
    },
    [variables],
  );

  return { 
    variables, 
    addVariable, 
    updateVariable,
    deleteVariable,
    getVariableById, 
    loading,
    serviceOptions 
  };
}