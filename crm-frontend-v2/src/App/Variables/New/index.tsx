import React from 'react';
import { useNavigate } from 'react-router-dom';
import VariableForm from '../../../components/variables/VariableForm';
import { useVariables } from '../../../hooks/Variables/useVariables';

const NewVariable: React.FC = () => {
  const navigate = useNavigate();
  const pathPrefix = window.location.pathname.split('/')[1];
  const { addVariable } = useVariables();

  const handleVariableSuccess = async (variableData: any) => {
    try {
      await addVariable(variableData);
      navigate(`/${pathPrefix}/variables`);
    } catch (error) {
      console.error('Failed to create variable:', error);
      throw error; // Re-throw to let the form handle it
    }
  };

  const handleCancel = () => {
    navigate(`/${pathPrefix}/variables`);
  };

  return (
    <div className="px-5 pb-5">
      <VariableForm
        onSuccess={handleVariableSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default NewVariable;