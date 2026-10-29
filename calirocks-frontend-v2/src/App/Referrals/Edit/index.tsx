// src/App/Referrals/Edit/index.tsx
import * as React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Alert, Card } from "flowbite-react";
import { HiUsers, HiCheckCircle, HiExclamationCircle } from "react-icons/hi";
import { Link } from "react-router-dom";
import ReferralForm, {
  type ReferralFormData,
  type ReferralFormErrors,
} from "../../../components/referrals/ReferralForm";
import { useReferrals } from "../../../hooks/useReferrals";
import DeleteConfirmationModal from "../../../components/ui/DeleteConfirmationModal";

const EditReferral: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const pathPrefix = window.location.pathname.split("/")[1];

  const {
    referrals,
    updateReferral,
    deleteReferral,
    getReferralStats,
    loading,
  } = useReferrals();

  const referralId = Number(id);
  const referral = referrals.find((r) => r.id === referralId);

  // Form state
  const [formData, setFormData] = React.useState<ReferralFormData>({
    startDate: referral?.startDate ?? "",
    endDate: referral?.endDate ?? "",
    discount: referral?.discount ?? null,
    reward: referral?.reward ?? null,
  });

  const [errors, setErrors] = React.useState<ReferralFormErrors>({});
  const [isPending, setIsPending] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [stats, setStats] = React.useState<{ newCustomers: number } | null>(
    null,
  );

  // Load stats for banner
  React.useEffect(() => {
    if (!referralId || !getReferralStats) return;

    let alive = true;
    (async () => {
      try {
        const s = await getReferralStats(referralId);
        if (alive) setStats(s ?? { newCustomers: 0 });
      } catch (e) {
        console.error("Failed to load stats:", e);
        if (alive) setStats({ newCustomers: 0 });
      }
    })();

    return () => {
      alive = false;
    };
  }, [getReferralStats, referralId]);

  // Update form when referral loads
  React.useEffect(() => {
    if (referral) {
      setFormData({
        startDate: referral.startDate ?? "",
        endDate: referral.endDate ?? "",
        discount: referral.discount ?? null,
        reward: referral.reward ?? null,
      });
    }
  }, [referral]);

  // Field change handler
  const onFieldChange = React.useCallback(
    <K extends keyof ReferralFormData>(k: K, v: ReferralFormData[K]) => {
      setFormData((prev) => ({ ...prev, [k]: v }));
      setErrors((prev) => ({ ...prev, [k]: undefined }));
    },
    [],
  );

  // Validation
  const validate = (): boolean => {
    const next: ReferralFormErrors = {};

    if (!formData.startDate) {
      next.startDate = "Start date is required.";
    }

    if (!formData.endDate) {
      next.endDate = "End date is required.";
    }

    if (
      formData.startDate &&
      formData.endDate &&
      formData.endDate < formData.startDate
    ) {
      next.endDate = "End date must be after start date.";
    }

    if (formData.discount == null || formData.discount < 0) {
      next.discount = "Enter a discount (>= 0).";
    }

    if (formData.reward == null || formData.reward < 0) {
      next.reward = "Enter a reward (>= 0).";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  // Submit handler
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
      };

      await updateReferral(referralId, payload);
      setSuccessMessage("Referral program updated successfully!");

      // Navigate after short delay
      setTimeout(() => {
        navigate(`/${pathPrefix}/referrals`);
      }, 1000);
    } catch (err: any) {
      console.error("Failed to update referral:", err);
      setErrorMessage(
        err?.message || "Failed to update referral. Please try again.",
      );
    } finally {
      setIsPending(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      setIsDeleting(true);
      await deleteReferral(referralId);
      setShowDeleteModal(false);
      navigate(`/${pathPrefix}/referrals`);
    } catch (err: any) {
      console.error("Failed to delete referral:", err);
      alert(err?.message || "Failed to delete referral program.");
      setIsDeleting(false);
    }
  };

  const onCancel = () => navigate(`/${pathPrefix}/referrals`);

  // Loading state
  if (loading) {
    return (
      <div className="px-5 pb-10 text-gray-900 antialiased">
        {/* Header skeleton */}
        <div className="mb-4 flex items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-gray-300"></div>
            <div className="space-y-2">
              <div className="h-8 w-48 rounded bg-gray-200"></div>
              <div className="h-4 w-40 rounded bg-gray-200"></div>
            </div>
          </div>
        </div>

        {/* Card skeleton */}
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="space-y-3 p-4">
            <div className="h-10 rounded bg-gray-100"></div>
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 rounded bg-gray-50"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Not found state
  if (!referral) {
    return (
      <div className="px-5 pb-10 text-gray-900 antialiased">
        <div className="py-8 text-center">
          <p className="text-lg text-gray-500">Referral program not found</p>
          <button
            onClick={() => navigate(`/${pathPrefix}/referrals`)}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            Back to Referral Programs
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
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
                className="text-xs font-medium text-gray-700 hover:text-blue-600 sm:text-sm"
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
                Edit Referral
              </span>
            </li>
          </ol>
        </nav>

        {/* Header */}
        <div className="mb-4 flex items-center gap-3 sm:gap-4">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-blue-700 text-white sm:h-12 sm:w-12">
            <HiUsers className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold sm:text-2xl">
              Edit Referral
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
            formData={formData}
            errors={errors}
            isPending={isPending}
            isEditing={true}
            newCustomersCount={stats?.newCustomers ?? 0}
            onFieldChange={onFieldChange}
            onSubmit={onSubmit}
            onCancel={onCancel}
          />
        </Card>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        itemName={`${formData.startDate} - ${formData.endDate}`}
        itemType="referral program"
        isDeleting={isDeleting}
      />
    </>
  );
};

export default EditReferral;
