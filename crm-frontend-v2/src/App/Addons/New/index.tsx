import React from 'react';
import { useNavigate } from 'react-router-dom';
import AddonForm from '../../../components/addons/AddonForm';
import { useAddons } from '../../../hooks/useAddons';

const NewAddon: React.FC = () => {
  const navigate = useNavigate();
  const pathPrefix = window.location.pathname.split('/')[1];
  const { addAddon } = useAddons();

  const handleAddonSuccess = (addonData: any) => {
    addAddon(addonData);
    navigate(`/${pathPrefix}/addons`);
  };

  const handleCancel = () => {
    navigate(`/${pathPrefix}/addons`);
  };

  return (
    <div className="px-5 pb-5">
      <AddonForm
        onSuccess={handleAddonSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default NewAddon;