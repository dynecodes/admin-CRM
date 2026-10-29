// /src/App/Providers/Edit/index.tsx
import { useNavigate, useParams } from "react-router-dom";
import { useProviders } from "../../../hooks/Providers/useProviders";
import EditFormProviders from "../../../components/providers/EditProvidersForm";

export default function EditProviderPage() {
  const navigate = useNavigate();
  const pathPrefix = window.location.pathname.split('/')[1];
  const { id } = useParams<{ id: string }>();
  const { providers } = useProviders();

  const provider = providers.find((p) => p.id === Number(id));
  if (!provider) {
    return (
      <div className="px-5 pb-5">
        <div className="py-8 text-center text-gray-500">Provider not found</div>
        <div className="text-center">
          <button
            className="text-gray-600"
            onClick={() => navigate(`/${pathPrefix}/providers`)}
          >
            Back to Providers
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 pb-5">
      <EditFormProviders
        provider={provider}
        onCancel={() => navigate(`/${pathPrefix}/providers`)}
        onSaved={() => navigate(`/${pathPrefix}/providers`)}
      />
    </div>
  );
}
