import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ServiceForm from '../../../components/services/ServiceForm';
import { useServices } from '../../../hooks/useServices';

const EditService: React.FC = () => {
  const navigate = useNavigate();
  const pathPrefix = window.location.pathname.split('/')[1];
  const { id } = useParams<{ id: string }>();
  const { services, updateService, loading } = useServices();

  const service = services.find(s => s.id === Number(id));

  const handleServiceSuccess = async (serviceData: any) => {
    try {
      // Navigate immediately, don't wait for the API call
      navigate(`/${pathPrefix}/services`);
      // Update in background
      await updateService(Number(id), serviceData);
    } catch (error) {
      console.error('Failed to update service:', error);
    }
  };

  const handleCancel = () => {
    navigate(`/${pathPrefix}/services`);
  };

  // Show loading if data is still being fetched OR services array is empty
  if (loading || services.length === 0) {
    return (
      <div className="px-5 pb-5 space-y-4 sm:space-y-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-48"></div>
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-300 rounded-full"></div>
          <div className="space-y-2">
            <div className="h-6 bg-gray-200 rounded w-40"></div>
            <div className="h-4 bg-gray-200 rounded w-56"></div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <div className="h-5 bg-gray-200 rounded w-32"></div>
            <div className="h-10 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Only show "not found" after loading is complete and service doesn't exist
  if (!service) {
    return (
      <div className="px-5 pb-5">
        <div className="text-center py-8">
          <p className="text-lg text-gray-500">Service not found</p>
          <button
            onClick={() => navigate(`/${pathPrefix}/services`)}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            Back to Services
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 pb-5">
      <ServiceForm
        service={service}
        onSuccess={handleServiceSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default EditService;