import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import VariableForm from '../../../components/variables/VariableForm';
import { useVariables } from '../../../hooks/Variables/useVariables';

const EditVariable: React.FC = () => {
  const navigate = useNavigate();
  const pathPrefix = window.location.pathname.split('/')[1];
  const { id } = useParams<{ id: string }>();
  const { variables, updateVariable, loading } = useVariables();

  const variable = variables.find(v => v.id === Number(id));

  const handleVariableSuccess = async (variableData: any) => {
    try {
      if (variable) {
        await updateVariable(variable.id, variableData);
        navigate(`/${pathPrefix}/variables`);
      }
    } catch (error) {
      console.error('Failed to update variable:', error);
      throw error; // Re-throw to let the form handle it
    }
  };

  const handleCancel = () => {
    navigate(`/${pathPrefix}/variables`);
  };

  // Show skeleton loader while fetching
  if (loading) {
    return (
      <div className="px-5 pb-5 space-y-4 sm:space-y-6 animate-pulse">
        {/* breadcrumb skeleton */}
        <div className="h-4 bg-gray-200 rounded w-48"></div>
        
        {/* header skeleton */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-300 rounded-full"></div>
          <div className="space-y-2">
            <div className="h-6 bg-gray-200 rounded w-40"></div>
            <div className="h-4 bg-gray-200 rounded w-56"></div>
          </div>
        </div>

        {/* form skeleton */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <div className="h-5 bg-gray-200 rounded w-32"></div>
            <div className="h-10 bg-gray-100 rounded"></div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <div className="h-5 bg-gray-200 rounded w-32"></div>
            <div className="h-32 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Only show "not found" after loading is complete
  if (!loading && !variable) {
    return (
      <div className="px-5 pb-5">
        <div className="text-center py-8">
          <p className="text-lg text-gray-500">Variable not found</p>
          <button
            onClick={() => navigate(`/${pathPrefix}/variables`)}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            Back to Variables
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 pb-5">
      <VariableForm
        variable={variable}
        onSuccess={handleVariableSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default EditVariable;