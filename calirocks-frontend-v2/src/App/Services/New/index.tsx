import React from 'react';
import { useNavigate } from 'react-router-dom';
import ServiceForm from '../../../components/services/ServiceForm';
import { useServices } from '../../../hooks/useServices';

const NewService: React.FC = () => {
  const navigate = useNavigate();
  const pathPrefix = window.location.pathname.split('/')[1];
  const { addService } = useServices();

  const handleServiceSuccess = async (serviceData: any) => {
    try {
      // Navigate immediately, don't wait for the API call
      navigate(`/${pathPrefix}/services`);
      // Add service in background
      await addService(serviceData);
    } catch (error) {
      console.error('Failed to create service:', error);
      alert(error instanceof Error ? error.message : 'Failed to create service. Please try again.');
    }
  };

  const handleCancel = () => {
    navigate(`/${pathPrefix}/services`);
  };

  return (
    <div className="px-5 pb-5">
      <ServiceForm
        onSuccess={handleServiceSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default NewService;