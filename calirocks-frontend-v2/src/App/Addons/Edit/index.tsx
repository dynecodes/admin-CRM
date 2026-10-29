import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AddonForm from '../../../components/addons/AddonForm';
import { useAddons } from '../../../hooks/useAddons';

const EditAddon: React.FC = () => {
  const navigate = useNavigate();
  const pathPrefix = window.location.pathname.split('/')[1];
  const { id } = useParams<{ id: string }>();
  const { addons, updateAddon, loading } = useAddons();

  const addon = addons.find(a => a.id === Number(id));

  const handleAddonSuccess = (addonData: any) => {
    if (addon) {
      updateAddon(addon.id, addonData);
      navigate(`/${pathPrefix}/addons`);
    }
  };

  const handleCancel = () => {
    navigate(`/${pathPrefix}/addons`);
  };

  if (loading) {
    return (
      <div className="px-5 pb-5 animate-pulse">
        {/* Breadcrumb skeleton */}
        <div className="flex items-center space-x-2 mb-6">
          <div className="h-4 bg-gray-200 rounded w-20"></div>
          <div className="h-4 bg-gray-200 rounded w-4"></div>
          <div className="h-4 bg-gray-200 rounded w-24"></div>
        </div>

        {/* Header skeleton */}
        <div className="flex items-center gap-4 mb-6">
          <div className="h-12 w-12 bg-gray-300 rounded-full"></div>
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded w-40"></div>
            <div className="h-4 bg-gray-200 rounded w-56"></div>
          </div>
        </div>

        {/* Cards skeleton */}
        <div className="space-y-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-gray-50 rounded-lg shadow p-6">
              <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
              <div className="space-y-3">
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Action buttons skeleton */}
        <div className="flex justify-end gap-3 mt-6">
          <div className="h-10 bg-gray-200 rounded w-24"></div>
          <div className="h-10 bg-gray-200 rounded w-24"></div>
        </div>
      </div>
    );
  }

  if (!addon) {
    return (
      <div className="px-5 pb-5">
        <div className="text-center py-8">
          <p className="text-lg text-gray-500">Add-on not found</p>
          <button
            onClick={() => navigate(`/${pathPrefix}/addons`)}
            className="mt-4 text-gray-600 hover:text-gray-800"
          >
            Back to Add-ons
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 pb-5">
      <AddonForm
        addon={addon}
        onSuccess={handleAddonSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default EditAddon;