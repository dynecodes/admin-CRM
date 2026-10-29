import React from 'react';
import { useNavigate } from 'react-router-dom';
import FrequencyForm from '../../../components/frequencies/FrequencyForm';
import { useFrequencies } from '../../../hooks/useFrequencies';

const NewFrequency: React.FC = () => {
  const navigate = useNavigate();
  const pathPrefix = window.location.pathname.split('/')[1];
  const { addFrequency } = useFrequencies();

  const handleFrequencySuccess = async (frequencyData: any) => {
    try {
      await addFrequency(frequencyData);
      navigate(`/${pathPrefix}/frequencies`);
    } catch (error) {
      console.error('Failed to create frequency:', error);
      alert(error instanceof Error ? error.message : 'Failed to create frequency. Please try again.');
    }
  };

  const handleCancel = () => {
    navigate(`/${pathPrefix}/frequencies`);
  };

  return (
    <div className="px-5 pb-5">
      <FrequencyForm
        onSuccess={handleFrequencySuccess}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default NewFrequency;