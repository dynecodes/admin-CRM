// src/App/Giftcards/Edit/index.tsx
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useGiftcards } from "../../../hooks/useGiftcards";
import GiftcardForm from "../../../components/giftcards/GiftcardForm";
import { GiftcardFormData } from "../../../types/giftcards";

const EditGiftcard: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { giftcards, updateGiftcard, loading } = useGiftcards();

  const giftcardId = Number(id);
  const giftcard = giftcards.find((g) => g.id === giftcardId) || null;

  const handleGiftcardSuccess = async (data: GiftcardFormData) => {
    try {
      await updateGiftcard(giftcardId, {
        sender: data.sender,
        senderEmail: data.senderEmail,
        recipient: data.recipient,
        recipientEmail: data.recipientEmail,
        message: data.message,
        amount: data.amount,
      });
      navigate("/admin/giftcards");
    } catch (error) {
      console.error("Failed to update giftcard:", error);
      throw error;
    }
  };

  const handleCancel = () => {
    navigate("/admin/giftcards");
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
        </div>
      </div>
    );
  }

  // not found (after loading completes)
  if (!giftcard) {
    return (
      <div className="px-5 pb-5">
        <div className="py-8 text-center">
          <p className="text-lg text-gray-500">Gift card not found</p>
          <button
            onClick={() => navigate("/admin/giftcards")}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            Back to Gift Cards
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 pb-5">
      <GiftcardForm
        giftcard={giftcard}
        onSuccess={async (payload) => {
          await handleGiftcardSuccess(payload);
        }}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default EditGiftcard;
