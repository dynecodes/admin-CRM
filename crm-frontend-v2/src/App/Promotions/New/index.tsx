//App/Promotions/New/index.tsx
import * as React from "react";
import { useNavigate } from "react-router-dom";
import { usePromotions } from "../../../hooks/Promotions/usePromotions";
import PromotionForm from "../../../components/promotions/PromotionForm";

const NewPromotions: React.FC = () => {
  const navigate = useNavigate();
  const { addPromotions } = usePromotions();

  const handlePromotionsSuccess = async (promotionsData: any) => {
    try {
      await addPromotions(promotionsData);
      navigate("/admin/promotions");
    } catch (error) {
      console.error("Failed to create promotions:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to create promotions. Please try again.",
      );
    }
  };

  const handleCancel = () => {
    navigate("/admin/promotions");
  };

  return (
    <div className="px-5 pb-5">
      <PromotionForm
        onSuccess={handlePromotionsSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
};
export default NewPromotions;
