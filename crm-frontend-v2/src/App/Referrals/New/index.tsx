// src/App/Referrals/New/index.tsx
import * as React from "react";
import { useNavigate, Link } from "react-router-dom";
import { Alert, Card, Button } from "flowbite-react";
import { HiOutlineUsers, HiCheckCircle, HiExclamationCircle } from "react-icons/hi";
import { useReferrals } from "../../../hooks/useReferrals";
import ReferralForm, {
  type ReferralFormData,
  type ReferralFormErrors,
} from "../../../components/referrals/ReferralForm";

const NewReferral: React.FC = () => {
  const navigate = useNavigate();
  const { addReferral } = useReferrals();
  const pathPrefix = window.location.pathname.split("/")[1];

  const FORM_ID = "new-referral-form"; // <-- matches ReferralForm formId

  const [formData, setFormData] = React.useState<ReferralFormData>({
    startDate: "",
    endDate: "",
    discount: null,
    reward: null,
  });

  const [errors, setErrors] = React.useState<ReferralFormErrors>({});
  const [isPending, setIsPending] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const onFieldChange = React.useCallback(
    <K extends keyof ReferralFormData>(k: K, v: ReferralFormData[K]) => {
      setFormData((prev) => ({ ...prev, [k]: v }));
      setErrors((prev) => ({ ...prev, [k]: undefined }));
    },
    [],
  );

  const validate = (): boolean => {
    const next: ReferralFormErrors = {};
    if (!formData.startDate) next.startDate = "Start date is required.";
    if (!formData.endDate) next.endDate = "End date is required.";
    if (
      formData.startDate &&
      formData.endDate &&
      formData.endDate < formData.startDate
    ) {
      next.endDate = "End date must be after start date.";
    }
    if (formData.discount == null || formData.discount < 0)
      next.discount = "Enter a discount (>= 0).";
    if (formData.reward == null || formData.reward < 0)
      next.reward = "Enter a reward (>= 0).";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsPending(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const payload = {
        startDate: formData.startDate,
        endDate: formData.endDate,
        discount: Number(formData.discount ?? 0),
        reward: Number(formData.reward ?? 0),
        status: "active" as const,
      };

      await addReferral(payload);
      setSuccessMessage("Referral program created successfully!");

      setTimeout(() => navigate(`/${pathPrefix}/referrals`), 1000);
    } catch (err: any) {
      console.error("Failed to create referral:", err);
      setErrorMessage(
        err?.message || "Failed to create referral. Please try again.",
      );
    } finally {
      setIsPending(false);
    }
  };

  const onCancel = () => navigate(`/${pathPrefix}/referrals`);

  return (
    <div className="px-5 pb-10 text-gray-900 antialiased">
      {/* Breadcrumb */}
      <nav
        className="mb-3 flex items-center text-gray-700"
        aria-label="Breadcrumb"
      >
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <Link
              to={`/${pathPrefix}/referrals`}
              className="text-xs font-medium text-gray-700 hover:text-gray-600 sm:text-sm"
            >
              Referral Programs
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
              New Referral
            </span>
          </li>
        </ol>
      </nav>

      {/* Header */}
      <div className="mb-4 flex items-center gap-3 sm:gap-4">
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-black text-white sm:h-12 sm:w-12">
          <HiOutlineUsers className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden />
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold sm:text-2xl">
            New Referral Program
          </h1>
          <p className="text-xs text-gray-500 sm:text-sm">
            Configure referral program dates, discount, and reward
          </p>
        </div>
      </div>

      {/* Alerts */}
      {errorMessage && (
        <Alert color="failure" icon={HiExclamationCircle} className="mb-3">
          <span className="text-xs font-medium sm:text-sm">Error!</span>
          <span className="text-xs sm:text-sm">{errorMessage}</span>
        </Alert>
      )}
      {successMessage && (
        <Alert color="success" icon={HiCheckCircle} className="mb-3">
          <span className="text-xs font-medium sm:text-sm">Success!</span>
          <span className="text-xs sm:text-sm">{successMessage}</span>
        </Alert>
      )}

      {/* Form Card */}
      <Card className="bg-gray-50">
        <ReferralForm
          formId={FORM_ID}
          formData={formData}
          errors={errors}
          isPending={isPending}
          isEditing={false}
          onFieldChange={onFieldChange}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      </Card>

      {/* Action bar OUTSIDE the form */}
      <div className="mt-4 flex items-center justify-end gap-2">
        <Button
          type="button"
          color="light"
          onClick={onCancel}
          disabled={isPending}
          className="cursor-pointer"
        >
          Cancel
        </Button>
        {/* This submits the form above by ID */}
        <Button
          type="submit"
          color="gray"
          form={FORM_ID}
          disabled={isPending}
          className="cursor-pointer"
        >
          {isPending ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
};

export default NewReferral;
