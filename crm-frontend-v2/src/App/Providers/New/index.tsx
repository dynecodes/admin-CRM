import React from "react";
import { useNavigate } from "react-router-dom";
import ProviderForm from "../../../components/providers/ProvidersForm";
import { useProviders } from "../../../hooks/Providers/useProviders";
import { ServiceProvider } from "../../../types/providers";

const NewProviders: React.FC = () => {
  const navigate = useNavigate();
  const pathPrefix = window.location.pathname.split('/')[1];
  const { addProvider } = useProviders();

  const handleSuccess = (
    values: Omit<ServiceProvider, "id" | "created_at" | "updated_at">,
  ) => {
    addProvider(values);
    navigate(`/${pathPrefix}/providers`);
  };

  return (
    <div className="px-5 pb-5">
      <ProviderForm
        onSubmit={handleSuccess}
        onCancel={() => navigate(`/${pathPrefix}/providers`)}
      />
    </div>
  );
};

export default NewProviders;
