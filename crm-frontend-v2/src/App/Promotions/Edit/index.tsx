//App/Promotions/Edit/index.tsx
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { usePromotions } from "../../../hooks/Promotions/usePromotions";
import PromotionForm from "../../../components/promotions/PromotionForm";

const EditPromotions: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { discounts, updatePromotion, loading } = usePromotions();

  const promoId = Number(id);
  const promotion = discounts.find((p) => p.id === promoId) || null;

  const handlePromotionSuccess = async (data: any) => {
    try {
      await updatePromotion(promoId, data);
      navigate("/admin/promotions");
    } catch (error) {
      console.error("Failed to update promotion:", error);
      throw error; // let the form surface the error UI
    }
  };

  const handleCancel = () => {
    navigate("/admin/promotions");
  };

  // show skeleton loader while fetching
  if (loading) {
    return (
      <div className="animate-pulse space-y-4 px-5 pb-5 sm:space-y-6">
        {/* breadcrumb skeleton */}
        <div className="h-4 w-48 rounded bg-gray-200"></div>

        {/* header skeleton */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="h-10 w-10 rounded-full bg-gray-300 sm:h-12 sm:w-12"></div>
          <div className="space-y-2">
            <div className="h-6 w-40 rounded bg-gray-200"></div>
            <div className="h-4 w-56 rounded bg-gray-200"></div>
          </div>
        </div>

        {/* form skeleton */}
        <div className="space-y-4">
          <div className="space-y-4 rounded-lg bg-white p-6 shadow">
            <div className="h-5 w-32 rounded bg-gray-200"></div>
            <div className="h-10 rounded bg-gray-100"></div>
          </div>

          <div className="space-y-4 rounded-lg bg-white p-6 shadow">
            <div className="h-5 w-32 rounded bg-gray-200"></div>
            <div className="h-32 rounded bg-gray-100"></div>
          </div>

          <div className="space-y-4 rounded-lg bg-white p-6 shadow">
            <div className="h-5 w-32 rounded bg-gray-200"></div>
            <div className="h-10 w-64 rounded bg-gray-100"></div>
          </div>
        </div>
      </div>
    );
  }

  // not found (after loading completes)
  if (!promotion) {
    return (
      <div className="px-5 pb-5">
        <div className="py-8 text-center">
          <p className="text-lg text-gray-500">Promotion not found</p>
          <button
            onClick={() => navigate("/admin/promotions")}
            className="mt-4 text-gray-600 hover:text-gray-800"
          >
            Back to Promotions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 pb-5">
      <PromotionForm
        promotion={promotion}
        onSuccess={async (payload) => {
          await handlePromotionSuccess(payload);
        }}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default EditPromotions;
