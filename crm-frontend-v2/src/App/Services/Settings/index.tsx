import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Card, Label } from "flowbite-react";
import { HiExclamationCircle, HiCheckCircle } from "react-icons/hi";
import { Link } from "react-router-dom";
import { useServiceSettings } from "../../../hooks/useServiceSettings";
import NumericInput from "../../../components/ui/NumericInput";
import FormActions from "../../../components/ui/FormActions";

const ServiceSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const pathPrefix = window.location.pathname.split("/")[1];
  const { settings, loading, updateSettings } = useServiceSettings();
  const [sameDayFee, setSameDayFee] = useState(0);
  const [beforeHourFee, setBeforeHourFee] = useState(0);
  const [afterHourFee, setAfterHourFee] = useState(0);
  const [isPending, setIsPending] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (settings) {
      setSameDayFee(parseFloat(settings.same_day_fee) || 0);
      setBeforeHourFee(parseFloat(settings.before_hour_fee) || 0);
      setAfterHourFee(parseFloat(settings.after_hour_fee) || 0);
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await updateSettings({
        same_day_fee: sameDayFee,
        before_hour_fee: beforeHourFee,
        after_hour_fee: afterHourFee,
      });
      setSuccessMessage("Service settings updated successfully!");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to update settings"
      );
    } finally {
      setIsPending(false);
    }
  };

  const handleCancel = () => {
    navigate(`/${pathPrefix}/services`);
  };

  if (loading) {
    return (
      <div className="px-5 pb-5 space-y-4 sm:space-y-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-48"></div>
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-300 rounded-full"></div>
          <div className="space-y-2">
            <div className="h-6 bg-gray-200 rounded w-40"></div>
            <div className="h-4 bg-gray-200 rounded w-56"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* breadcrumb */}
      <nav className="flex items-center text-gray-700" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <Link
              to={`/${pathPrefix}/services`}
              className="inline-flex items-center text-xs font-medium text-gray-700 hover:text-blue-600 sm:text-sm"
            >
              Services
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

      {/* header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="relative inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-blue-700 sm:h-12 sm:w-12">
            <svg
              className="h-6 w-6 text-white"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 sm:text-2xl lg:text-3xl">
              Service Fee Settings
            </h1>
            <p className="text-xs text-gray-500 sm:text-sm">
              Configure default overage fees for services
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {errorMessage && (
          <Alert color="failure" icon={HiExclamationCircle}>
            <span className="text-xs font-medium sm:text-sm">Error!</span>
            <span className="text-xs sm:text-sm">{errorMessage}</span>
          </Alert>
        )}

        {successMessage && (
          <Alert color="success" icon={HiCheckCircle}>
            <span className="text-xs font-medium sm:text-sm">Success!</span>
            <span className="text-xs sm:text-sm">{successMessage}</span>
          </Alert>
        )}

        <Card className="bg-gray-50">
          <div className="mb-3 flex items-center gap-2 sm:mb-4 sm:gap-3">
            <h3 className="text-lg font-semibold text-gray-900">
              Default Overage Fees
            </h3>
          </div>

          <p className="mb-6 text-xs text-gray-600 sm:text-sm">
            Set default fees that will be added to service prices when creating new services.
            These values will be used as defaults when enabling respective features.
          </p>

          <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
            <div>
              <Label
                htmlFor="same_day_fee"
                className="mt-6 mb-1 block text-xs sm:mb-2 sm:text-sm"
              >
                Same Day Fee ($)
              </Label>
              <NumericInput
                value={sameDayFee}
                onValueChange={setSameDayFee}
                decimals={2}
                min={0}
                step={0.01}
                placeholder="0.00"
                prefix={<span>$</span>}
                className="block w-full rounded-lg border border-gray-300 bg-white px-2.5 py-2 pl-8 text-xs text-gray-900 focus:border-blue-500 focus:ring-blue-500 sm:px-3 sm:py-2.5 sm:pl-10 sm:text-sm"
                inputProps={{ id: "same_day_fee", name: "same_day_fee" }}
              />
              <p className="mt-1 text-xs text-gray-500">
                Added to price when same-day fee is enabled
              </p>
            </div>

            <div>
              <Label
                htmlFor="before_hour_fee"
                className="mt-6 mb-1 block text-xs sm:mb-2 sm:text-sm"
              >
                Before-Hour Fee ($)
              </Label>
              <NumericInput
                value={beforeHourFee}
                onValueChange={setBeforeHourFee}
                decimals={2}
                min={0}
                step={0.01}
                placeholder="0.00"
                prefix={<span>$</span>}
                className="block w-full rounded-lg border border-gray-300 bg-white px-2.5 py-2 pl-8 text-xs text-gray-900 focus:border-blue-500 focus:ring-blue-500 sm:px-3 sm:py-2.5 sm:pl-10 sm:text-sm"
                inputProps={{ id: "before_hour_fee", name: "before_hour_fee" }}
              />
              <p className="mt-1 text-xs text-gray-500">
                Added to before-hour shift rates in advanced pricing
              </p>
            </div>

            <div>
              <Label
                htmlFor="after_hour_fee"
                className="mt-6 mb-1 block text-xs sm:mb-2 sm:text-sm"
              >
                After-Hour Fee ($)
              </Label>
              <NumericInput
                value={afterHourFee}
                onValueChange={setAfterHourFee}
                decimals={2}
                min={0}
                step={0.01}
                placeholder="0.00"
                prefix={<span>$</span>}
                className="block w-full rounded-lg border border-gray-300 bg-white px-2.5 py-2 pl-8 text-xs text-gray-900 focus:border-blue-500 focus:ring-blue-500 sm:px-3 sm:py-2.5 sm:pl-10 sm:text-sm"
                inputProps={{ id: "after_hour_fee", name: "after_hour_fee" }}
              />
              <p className="mt-1 text-xs text-gray-500">
                Added to after-hour shift rates in advanced pricing
              </p>
            </div>
          </div>
        </Card>

        <div className="pt-0 sm:pt-1">
          <FormActions
            onCancel={handleCancel}
            isPending={isPending || loading}
            isEditing={true}
            submitText="Save"
            editText="Save"
            showStatusToggle={false}
          />
        </div>
      </form>
    </div>
  );
};

export default ServiceSettingsPage;