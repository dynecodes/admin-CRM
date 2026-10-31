// src/App/Giftcards/Settings/index.tsx
import React from "react";
import { Link } from "react-router-dom";
import { HiCog } from "react-icons/hi";
import GiftcardSettingsForm from "../../../components/giftcards/GiftcardSettingsForm";
import { useGiftcards } from "../../../hooks/useGiftcards";
import { GiftcardSettings } from "../../../types/giftcards";

const GiftcardSettingsPage: React.FC = () => {
  const { settings, updateSettings, loading } = useGiftcards();

  const handleSettingsSuccess = async (data: Partial<GiftcardSettings>) => {
    try {
      await updateSettings(data);
      // Optionally navigate back or show success message
    } catch (error) {
      console.error("Failed to update settings:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to update settings. Please try again.",
      );
    }
  };

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
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 pb-5">
      {/* Breadcrumb */}
      <nav
        className="mb-3 flex items-center text-gray-700"
        aria-label="Breadcrumb"
      >
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <Link
              to="/admin/giftcards"
              className="text-xs font-medium text-gray-700 hover:text-gray-600 sm:text-sm"
            >
              Gift Cards
            </Link>
          </li>
          <li aria-current="page" className="inline-flex items-center">
            <svg
              className="mx-1 h-3 w-3 text-gray-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <span className="ml-1 text-xs font-medium text-gray-500 sm:text-sm md:ml-2">
              Settings
            </span>
          </li>
        </ol>
      </nav>

      {/* Header */}
      <div className="mb-4 flex items-center gap-3 sm:gap-4">
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-black text-white sm:h-12 sm:w-12">
          <HiCog className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden />
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold sm:text-2xl">
            Gift Card Settings
          </h1>
          <p className="text-xs text-gray-500 sm:text-sm">
            Configure gift card options and appearance
          </p>
        </div>
      </div>

      <GiftcardSettingsForm
        settings={settings}
        onSuccess={handleSettingsSuccess}
      />
    </div>
  );
};

export default GiftcardSettingsPage;
