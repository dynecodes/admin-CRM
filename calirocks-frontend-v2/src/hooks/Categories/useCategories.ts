import { useState, useCallback, useEffect } from 'react';
import { Category, CategoryRow } from '../../types/categories';
import usePrivateService from '../Auth/usePrivateService';

type UseCategoriesReturn = {
  categories: CategoryRow[];
  addCategory: (input: Omit<Category, "id" | "created_at" | "updated_at">) => Promise<CategoryRow>;
  updateCategory: (id: string, patch: Partial<Omit<Category, "id">>) => Promise<CategoryRow | null>;
  deleteCategory: (id: string) => Promise<void>;
  getCategoryById: (id: string) => CategoryRow | undefined;
  loading: boolean;
  serviceOptions: Array<{ id: number; name: string }>;
};

export function useCategories(): UseCategoriesReturn {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [serviceOptions, setServiceOptions] = useState<Array<{ id: number; name: string }>>([]);
  const privateService = usePrivateService();

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const response = await privateService.get('/categories');
      const categoriesData = response.data.data || [];
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [privateService]);

  const fetchServiceOptions = useCallback(async () => {
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

  useEffect(() => {
    fetchCategories();
    fetchServiceOptions();
  }, [fetchCategories, fetchServiceOptions]);

  const addCategory = useCallback(async (input: Omit<Category, "id" | "created_at" | "updated_at">): Promise<CategoryRow> => {
    setLoading(true);
    try {
      if (!input.name || input.name.trim().length < 2) {
        throw new Error('Category name must be at least 2 characters');
      }
      if (input.name.trim().length > 50) {
        throw new Error('Category name must not exceed 50 characters');
      }

      const categoryData = {
        name: input.name.trim(),
        serviceIds: input.serviceIds || [],
        status: input.status || 'active'
      };

      const response = await privateService.post('/categories', categoryData);
      const newCategory = response.data.data;
      
      setCategories(prev => [newCategory, ...prev]);
      return newCategory;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to create category';
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [privateService]);

  const updateCategory = useCallback(async (id: string, patch: Partial<Omit<Category, "id">>): Promise<CategoryRow | null> => {
    setLoading(true);
    try {
      const category = categories.find(c => c.id === id);
      if (!category) {
        throw new Error('Category not found');
      }

      const updateData = {
        name: patch.name !== undefined ? patch.name.trim() : category.name,
        serviceIds: patch.serviceIds !== undefined ? patch.serviceIds : category.serviceIds,
        status: patch.status !== undefined ? patch.status : category.status
      };

      if (updateData.name.length < 2) {
        throw new Error('Category name must be at least 2 characters');
      }
      if (updateData.name.length > 50) {
        throw new Error('Category name must not exceed 50 characters');
      }

      const response = await privateService.put(`/categories/${id}`, updateData);
      const updatedCategory = response.data.data;
      
      setCategories(prev => prev.map(cat => 
        cat.id === id ? updatedCategory : cat
      ));
      
      return updatedCategory;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to update category';
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [privateService, categories]);

  const deleteCategory = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    try {
      await privateService.delete(`/categories/${id}`);
      setCategories(prev => prev.filter(cat => cat.id !== id));
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to delete category';
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [privateService]);

  const getCategoryById = useCallback(
    (id: string) => categories.find((c) => c.id === id),
    [categories],
  );

  return {
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategoryById,
    loading,
    serviceOptions
  };
}