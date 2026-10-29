import * as React from "react";
import { Button } from "flowbite-react";
import {
  HiUser,
  HiClipboardList,
  HiCash,
  HiCalendar,
  HiDocumentText,
  HiPaperClip,
  HiMail,
} from "react-icons/hi";
import { ServiceProvider } from "../../types/providers";
import { useProviders } from "../../hooks/Providers/useProviders";
import { Link } from "react-router-dom";
import TeamInfo from "./EditForm/TeamInfo";
import PreferencesDetails from "./EditForm/Preference&Details";
import Compensation from "./EditForm/Compensation";
import Bookings from "./EditForm/Bookings";
import ProviderNotes from "./EditForm/Notes";
import ProviderFiles from "./EditForm/Files";
import EmailTab from "./EditForm/EmailPreferences";
import { ProviderEditForm, toProviderEditForm } from "../../types/providers";

type Props = {
  provider: ServiceProvider;
  onCancel: () => void;
  onSaved?: () => void;
};

type Tab =
  | "team"
  | "preferences"
  | "compensation"
  | "bookings"
  | "notes"
  | "files"
  | "email";

export default function EditFormProviders({
  provider,
  onCancel,
  onSaved,
}: Props) {
  const { updateProvider, deleteProvider } = useProviders() as any;

  const [activeTab, setActiveTab] = React.useState<Tab>("team");
  const [form, setForm] = React.useState<ProviderEditForm>(() =>
    toProviderEditForm(provider),
  );
  const [errors, setErrors] = React.useState<
    Partial<Record<keyof ProviderEditForm, string>>
  >({});

  const handleChange = <K extends keyof ProviderEditForm>(
    k: K,
    v: ProviderEditForm[K],
  ) => setForm((f) => ({ ...f, [k]: v }));

  // Scoped adapters
  const changeComp = <
    K extends keyof Pick<
      ProviderEditForm,
      "paymentDistribution" | "teamPayments"
    >,
  >(
    k: K,
    v: Pick<ProviderEditForm, "paymentDistribution" | "teamPayments">[K],
  ) => handleChange(k as keyof ProviderEditForm, v as any);

  const changePrefs = <
    K extends keyof Pick<
      ProviderEditForm,
      | "tags"
      | "categoryIds"
      | "locationIds"
      | "notes"
      | "likedCustomerIds"
      | "dislikedCustomerIds"
      | "preferredCustomerIds"
      | "avoidCustomerIds"
    >,
  >(
    k: K,
    v: Pick<
      ProviderEditForm,
      | "tags"
      | "categoryIds"
      | "locationIds"
      | "notes"
      | "likedCustomerIds"
      | "dislikedCustomerIds"
      | "preferredCustomerIds"
      | "avoidCustomerIds"
    >[K],
  ) => handleChange(k as keyof ProviderEditForm, v as any);

  const validate = () => {
    const next: typeof errors = {};
    if (!form.teamTitle.trim()) next.teamTitle = "Team Title is required";
    if ((form.memberIds || []).length === 0)
      next.memberIds = "Select at least one member";
    if (!form.firstName.trim()) next.firstName = "First name is required";
    if (!form.lastName.trim()) next.lastName = "Last name is required";
    if (!form.email.trim()) next.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(form.email))
      next.email = "Enter a valid email";
    if (!form.phone.trim()) next.phone = "Phone is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      setActiveTab("team");
      return;
    }
    const payload = {
      teamTitle: form.teamTitle,
      teamColor: form.teamColor,
      memberIds: form.memberIds,
      email: form.email,
      phone: form.phone,
      status: form.status,
      firstName: form.firstName,
      lastName: form.lastName,
      address: form.address,
      city: form.city,
      state: form.state,
      zip: form.zip,
      tags: form.tags,
      categoryIds: form.categoryIds,
      locationIds: form.locationIds,
      notes: form.notes,
      likedCustomerIds: form.likedCustomerIds,
      dislikedCustomerIds: form.dislikedCustomerIds,
      paymentDistribution: form.paymentDistribution,
      teamPayments: form.teamPayments,
    };
    updateProvider(provider.id, payload as any);
    onSaved?.();
  };

  const tabs: Array<{
    id: Tab;
    label: string;
    icon: React.ComponentType<any>;
  }> = [
    { id: "team", label: "Info", icon: HiUser },
    { id: "preferences", label: "Details", icon: HiClipboardList },
    { id: "notes", label: "Notes", icon: HiDocumentText },
    { id: "files", label: "Files", icon: HiPaperClip },
    { id: "compensation", label: "Wages", icon: HiCash },
    { id: "bookings", label: "Bookings", icon: HiCalendar },
    { id: "email", label: "Email", icon: HiMail },
  ];

  const handleDelete = async () => {
    const ok = window.confirm(
      "Delete this team provider permanently? This cannot be undone.",
    );
    if (!ok) return;
    if (typeof deleteProvider === "function") {
      await deleteProvider(provider.id);
    } else {
      console.warn(
        "deleteProvider() not available; implement delete in useProviders to enable this.",
      );
    }
  };

  const pathPrefix = window.location.pathname.split('/')[1];
  
  return (
    <form className="space-y-4 sm:space-y-6" onSubmit={onSubmit} noValidate>
      {/* Breadcrumb */}
      <nav className="flex items-center text-gray-700" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <Link
              to={`/${pathPrefix}/providers`}
              className="inline-flex items-center text-xs font-medium text-gray-700 hover:text-gray-600 sm:text-sm"
            >
              Teams
            </Link>
          </li>
          <li aria-current="page">
            <div className="flex items-center">
              <svg
                className="mx-1 h-3 w-3 text-gray-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="ml-1 text-xs font-medium text-gray-500 sm:text-sm md:ml-2">
                Edit Team Provider
              </span>
            </div>
          </li>
        </ol>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-gray-700 text-white sm:h-12 sm:w-12">
            <HiUser className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold sm:text-2xl">
              Edit Team Provider
            </h1>
            <p className="text-xs text-gray-500 sm:text-sm">
              Update team information and preferences
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="-mb-[2px]">
        <nav
          className="scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-300 flex overflow-x-auto"
          aria-label="Tabs"
        >
          <div className="flex min-w-max gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={[
                    "relative flex cursor-pointer items-center rounded-t-lg px-2 py-2 text-sm font-medium transition-all sm:px-4 sm:py-3",
                    isActive
                      ? "z-10 border border-gray-300 border-b-gray-50 bg-gray-50 text-gray-600"
                      : "border border-transparent text-gray-500 hover:text-gray-700",
                  ].join(" ")}
                  aria-label={tab.label}
                  title={tab.label}
                >
                  {/* ICON: mobile only */}
                  <Icon className="h-6 w-6 sm:hidden" />
                  {/* LABEL: desktop only */}
                  <span className="hidden sm:ml-0 sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Tab content */}
      <div
        className={[
          "border border-gray-300 bg-gray-50 p-4 shadow-sm sm:p-6",
          "rounded-br-lg rounded-bl-lg",
          activeTab === "team"
            ? "rounded-tr-lg"
            : "rounded-tl-lg rounded-tr-lg",
        ].join(" ")}
      >
        {activeTab === "team" && (
          <TeamInfo
            form={form}
            errors={errors}
            onChange={handleChange}
            provider={provider}
          />
        )}
        {activeTab === "preferences" && (
          <PreferencesDetails
            form={form}
            errors={errors}
            onChange={changePrefs}
            provider={provider}
          />
        )}
        {activeTab === "compensation" && (
          <Compensation form={form} onChange={changeComp} />
        )}
        {activeTab === "bookings" && <Bookings providerId={provider.id} />}
        {activeTab === "notes" && <ProviderNotes providerId={provider.id} />}
        {activeTab === "files" && <ProviderFiles providerId={provider.id} />}
        {activeTab === "email" && (
          <EmailTab
            initial={{
              bookingInviteEmail:
                (provider as any)?.notificationPrefs?.bookingInviteEmail ??
                true,
              bookingInviteSms:
                (provider as any)?.notificationPrefs?.bookingInviteSms ?? true,
              dailyScheduleSms:
                (provider as any)?.notificationPrefs?.dailyScheduleSms ?? true,
              bookingCancelledEmail:
                (provider as any)?.notificationPrefs?.bookingCancelledEmail ??
                true,
            }}
            onSave={(vals) =>
              updateProvider(provider.id, {
                notificationPrefs: vals,
              } as any)
            }
          />
        )}
      </div>

      {/* Actions */}
      <div className="mt-6 flex w-full flex-col gap-3 sm:flex-row sm:items-center">
        {/* LEFT group: Active/Archive + (Delete when archived) */}
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:gap-2">
          <Button
            type="button"
            onClick={async () => {
              const newStatus =
                form.status === "archived" ? "active" : "archived";
              await updateProvider(provider.id, { status: newStatus } as any);
              setForm({ ...form, status: newStatus });
            }}
            className={`relative flex h-10 cursor-pointer items-center justify-center rounded-lg bg-red-600 px-8 text-center text-sm font-medium text-white hover:bg-red-700 focus:ring-4 focus:ring-red-300 focus:outline-none ${
              form.status === "archived"
                ? "bg-green-600 hover:bg-green-700 focus:ring-green-300" // shows "Active"
                : "bg-purple-600 hover:bg-purple-700 focus:ring-purple-300" // shows "Archive"
            }`}
          >
            {form.status === "archived" ? "Active" : "Archive"}
          </Button>

          {form.status === "archived" && (
            <Button
              type="button"
              onClick={handleDelete}
              className="relative flex h-10 cursor-pointer items-center justify-center rounded-lg bg-red-600 px-8 text-center text-sm font-medium text-white hover:bg-red-700 focus:ring-4 focus:ring-red-300 focus:outline-none"
            >
              Delete
            </Button>
          )}
        </div>

        {/* Spacer forces right group to the far right on ≥sm */}
        <div className="hidden sm:block sm:flex-1" />
        {/* RIGHT group: Cancel + Save */}
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:gap-2">
          <Button
            color="light"
            className="relative flex h-10 cursor-pointer items-center justify-center rounded-lg px-8 text-center text-sm font-medium text-black focus:ring-4 focus:outline-none"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            color="gray"
            className="relative flex h-10 cursor-pointer items-center justify-center rounded-lg px-8 text-center text-sm font-medium text-white focus:ring-4 focus:outline-none"
            onClick={onSaved}
          >
            Save
          </Button>
        </div>
      </div>
    </form>
  );
}
