import { useState, useEffect } from 'react';
import { Form } from '../types/form';
import { mockForms } from '../utils/mockFormData';

export const useForms = () => {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // simulate loading from backend
    setLoading(true);
    setTimeout(() => {
      setForms(mockForms);
      setLoading(false);
    }, 500);
  }, []);

  const addForm = async (formData: Omit<Form, 'id' | 'created_at' | 'updated_at'>) => {
    setLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newForm: Form = {
      ...formData,
      id: Math.max(...forms.map(f => f.id), 0) + 1,
      created_at: new Date().toISOString(),
    };
    
    setForms(prev => [...prev, newForm]);
    setLoading(false);
    return newForm;
  };

  const updateForm = async (id: number, formData: Partial<Form>) => {
    setLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    setForms(prev => prev.map(form => 
      form.id === id ? { ...form, ...formData, updated_at: new Date().toISOString() } : form
    ));
    
    setLoading(false);
  };

  const deleteForm = async (id: number) => {
    setLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    setForms(prev => prev.filter(form => form.id !== id));
    setLoading(false);
  };

  const updateFormStatus = async (id: number, status: Form['status']) => {
    setLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    setForms(prev => prev.map(form => 
      form.id === id ? { ...form, status, updated_at: new Date().toISOString() } : form
    ));
    
    setLoading(false);
  };

  const createDefaultForm = (): Omit<Form, 'id' | 'created_at' | 'updated_at'> => {
    return {
      name: 'New Form',
      description: '',
      fields: [],
      settings: {
        backgroundColor: '#ffffff',
        borderColor: '#e5e7eb',
        labelColor: '#6b7280',
        labelFont: 'Inter, sans-serif',
        textColor: '#111827',
        textFont: 'Inter, sans-serif',
        headingColor: '#111827',
        headingFont: 'Inter, sans-serif',
        buttonColor: '#1c64f2',
        buttonTextColor: '#ffffff',
        customCSS: '',
      },
      status: 'draft',
    };
  };

  return {
    forms,
    loading,
    addForm,
    updateForm,
    deleteForm,
    updateFormStatus,
    createDefaultForm,
  };
};