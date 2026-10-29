import React from 'react';
import { useNavigate } from 'react-router-dom';
import LocationForm from '../../../components/locations/LocationForm';

const NewLocation: React.FC = () => {
  const navigate = useNavigate();
  const pathPrefix = window.location.pathname.split('/')[1];

  const handleLocationSuccess = () => {
    navigate(`/${pathPrefix}/locations`);
  };

  const handleCancel = () => {
    navigate(`/${pathPrefix}/locations`);
  };

  return (
    <div className="px-5 pb-5">
      <LocationForm
        onSuccess={handleLocationSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default NewLocation;