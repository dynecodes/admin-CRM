// src/App/SalesTaxes/Settings/index.tsx

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Card,
  Button,
  Label,
  Checkbox,
  Alert,
  Spinner,
  ToggleSwitch,
} from "flowbite-react";
import { HiExclamationCircle, HiCheckCircle } from "react-icons/hi";
import { useSalesTax } from "../../../hooks/SalesTax/useSalesTax";

const SalesTaxSettings: React.FC = () => {
  const navigate = useNavigate();
  const pathPrefix = window.location.pathname.split("/")[1];

  const { settings, settingsLoading, updateSettings } = useSalesTax();

  const [isEnabled, setIsEnabled] = useState<boolean>(
    settings?.enabled ?? false,
  );
  const [understood, setUnderstood] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setIsEnabled(settings.enabled);
      setUnderstood(false);
    }
  }, [settings]);

  const handleSaveChanges = async () => {
    if (isEnabled !== settings?.enabled && !understood) {
      setError("Please confirm that you understand the changes");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await updateSettings({ enabled: isEnabled });

      setSuccess("Settings saved successfully!");
      setUnderstood(false);

      setTimeout(() => {
        navigate(`/${pathPrefix}/sales-tax`);
      }, 1200);
    } catch (err) {
      setError((err as Error).message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (settingsLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center text-gray-700" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <Link
              to={`/${pathPrefix}/sales-tax`}
              className="inline-flex items-center text-xs font-medium text-gray-700 hover:text-blue-600 sm:text-sm"
            >
              Sales Taxes
            </Link>
          </li>
          <li aria-current="page">
            <div className="flex items-center">
              <svg
                className="mx-1 h-3 w-3 text-gray-400"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                ></path>
              </svg>
              <span className="ml-1 text-xs font-medium text-gray-500 sm:text-sm md:ml-2">
                Settings
              </span>
            </div>
          </li>
        </ol>
      </nav>

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="relative inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-blue-700 sm:h-12 sm:w-12">
            <svg
              className="h-5 w-5 text-white sm:h-6 sm:w-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.591 1.066c1.53-.879 3.408.999 2.529 2.529a1.724 1.724 0 001.066 2.591c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.591c.879 1.53-.999 3.408-2.529 2.529a1.724 1.724 0 00-2.591 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.591-1.066c-1.53.879-3.408-.999-2.529-2.529a1.724 1.724 0 00-1.066-2.591c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.591c-.879-1.53.999-3.408 2.529-2.529.895.514 2.165.127 2.591-1.066z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 sm:text-2xl lg:text-3xl">
              Sales Tax Settings
            </h1>
            <p className="text-xs text-gray-500 sm:text-sm">
              Configure global sales tax settings
            </p>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert color="failure" icon={HiExclamationCircle}>
          <span className="text-xs font-medium sm:text-sm">Error!</span>
          <span className="text-xs sm:text-sm">{error}</span>
        </Alert>
      )}

      {success && (
        <Alert color="success" icon={HiCheckCircle}>
          <span className="text-xs font-medium sm:text-sm">Success!</span>
          <span className="text-xs sm:text-sm">{success}</span>
        </Alert>
      )}

      {/* Settings Card */}
      <Card className="bg-gray-50">
        <div className="space-y-6">
          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Feature Status
            </h3>
            <p className="mb-4 text-sm text-gray-600">
              When enabled, this feature adds a sales tax to the final amount of
              your bookings.
            </p>
            <p className="mb-6 text-sm text-gray-600">
              After discounts and price adjustments are applied to the booking,
              a sales tax is calculated based on the sales tax rate and the
              final price of the booking.
            </p>

            <div className="flex items-center gap-4">
              <Label htmlFor="sales-tax-toggle" className="text-sm font-medium">
                Sales Tax is
              </Label>
              <ToggleSwitch
                id="sales-tax-toggle"
                checked={isEnabled}
                onChange={(checked) => {
                  setIsEnabled(checked);
                  setUnderstood(false);
                  setError(null);
                }}
              />
              <span
                className={`text-sm font-semibold ${
                  isEnabled ? "text-green-600" : "text-gray-500"
                }`}
              >
                {isEnabled ? "On" : "Off"}
              </span>
            </div>
          </div>

          {/* Confirmation Checkbox (only when changing state) */}
          {isEnabled !== settings?.enabled && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="understand-changes"
                  checked={understood}
                  onChange={(e) => setUnderstood(e.target.checked)}
                  className="mt-1"
                />
                <Label htmlFor="understand-changes" className="text-sm">
                  {isEnabled
                    ? "I understand that by turning Sales Tax on, a sales tax will be added to all bookings that have not been paid yet."
                    : "I understand that by turning Sales Tax off, sales taxes will be removed from all active bookings (i.e. upcoming and completed bookings) that have not been paid yet."}
                </Label>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end sm:gap-4">
        <Button
          color="light"
          onClick={() => navigate(`/${pathPrefix}/sales-tax`)}
        >
          Cancel
        </Button>
        <Button
          color="gray"
          onClick={handleSaveChanges}
          disabled={saving || (isEnabled !== settings?.enabled && !understood)}
        >
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
};

export default SalesTaxSettings;
