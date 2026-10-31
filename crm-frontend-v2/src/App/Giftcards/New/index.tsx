// src/App/Giftcards/New/index.tsx
import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useGiftcards } from "../../../hooks/useGiftcards";
import GiftcardForm from "../../../components/giftcards/GiftcardForm";
import { GiftcardFormData } from "../../../types/giftcards";

const NewGiftcard: React.FC = () => {
  const navigate = useNavigate();
  const { purchaseGiftcard } = useGiftcards();

  const handleGiftcardSuccess = async (giftcardData: GiftcardFormData) => {
    try {
      await purchaseGiftcard(giftcardData);
      navigate("/admin/giftcards");
    } catch (error) {
      console.error("Failed to create giftcard:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to issue gift card. Please try again.",
      );
    }
  };

  const handleCancel = () => {
    navigate("/admin/giftcards");
  };

  return (
    <div className="px-5 pb-5">
      <GiftcardForm onSuccess={handleGiftcardSuccess} onCancel={handleCancel} />
    </div>
  );
};

export default NewGiftcard;
