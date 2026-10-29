import * as React from "react";
import { Button, Label, HelperText, Card } from "flowbite-react";
import { Link } from "react-router-dom";
import { HiUser,HiX } from "react-icons/hi";
import { Staff, StaffRole } from "../../types/staffs";
import { useDraggableModal } from "../../hooks/useDraggableModal";
import { createPortal } from "react-dom";
import SendEmailModal from "./SendEmailModal";
import { PhoneInput,USStateSelect,ZipCodeInput } from "../ui/InputsBundle";
import {
  isValidUSPhone10,
  isValidUSState,
  isValidUSZip5,
} from "../../utils/reusableUtils.ts/input";
import usePrivateService from "../../hooks/Auth/usePrivateService";

type Props = {
  staff: Staff;
  onSubmit: (patch: Partial<Staff>) => void;
  onCancel: () => void;
};

const required = (s: string) => s.trim().length > 0;

const toTitle = (s: string) =>
  s
    .toLowerCase()
    .replace(/\b\w/g, (m) => m.toUpperCase())
    .replace(/\s+/g, " ")
    .trim();

const initials = (f?: string, l?: string) =>
  [f || "", l || ""]
    .map((s) => s?.trim()?.[0]?.toUpperCase() || "")
    .join("")
    .slice(0, 2) || "??";

const ROLE_CARDS: Array<{ value: StaffRole; title: string; desc: string }> = [
  { value: "admin", title: "Admin", desc: "Best for business owners and company managers" },
  { value: "staff", title: "Staff", desc: "Best for employees that manage bookings" },
  { value: "technical", title: "Technical Admin", desc: "For people who help with website/programming" },
];

const ROLE_DETAILS: Record<StaffRole, { title: string; bullets: string[] }> = {
  admin: {
    title: "Role: Administrator",
    bullets: [
      "View Dashboard and revenue related reports",
      "Manage Customer Payments/Charges",
      "Manage Team Payments",
      "Manage Site Settings",
      "Manage Gift Card Settings and Refunds",
      "Manage Bookings",
      "Manage Customers",
      "Manage Services",
      "Manage Extras",
      "Manage Booking Spots",
      "Manage Frequencies",
      "Manage Discount Codes",
      "Manage Teams",
      "Manage Email Templates",
      "Gift Cards",
      "Manage Staff",
    ],
  },
  staff: {
    title: "Role: Staff",
    bullets: [
      "Manage Bookings",
      "Manage Customers",
      "View Reports (excluding Dashboard and revenue related reports)",
      "Manage Services",
      "Manage Extras",
      "Manage Booking Spots",
      "Manage Frequencies",
      "Manage Discount Codes",
      "Manage Teams",
      "Manage Email Templates",
      "Gift Cards",
    ],
  },
  technical: {
    title: "Role: Technical Admin",
    bullets: [
      "Manage Staff",
      "Manage Bookings",
      "Manage Customers",
      "View Reports (excluding Dashboard and revenue related reports)",
      "Manage Services",
      "Manage Extras",
      "Manage Booking Spots",
      "Manage Frequencies",
      "Manage Discount Codes",
      "Manage Teams",
      "Manage Email Templates",
      "Gift Cards",
    ],
  },
};

// shared input styles
const focusBlue =
  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-600 focus:ring-offset-0 transition-colors";
const baseInput =
  "block w-full rounded-lg border bg-white px-2.5 py-2 text-xs sm:px-3 sm:py-2.5 sm:text-sm text-gray-900 placeholder:text-gray-400";
const okInput = `border-gray-300 ${focusBlue}`;
const errorInput = `border-red-500 ring-1 ring-red-500/20 ${focusBlue}`;

export default function EditStaffForm({ staff, onSubmit, onCancel }: Props) {
  const [form, setForm] = React.useState<Staff>({ ...staff });
  const [errors, setErrors] = React.useState<Partial<Record<keyof Staff, string>>>({});

  // file picker
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const triggerPick = () => fileInputRef.current?.click();
  const onPickImage = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => handleChange("profilePicUrl", String(reader.result || ""));
    reader.readAsDataURL(file);
  };

  const [emailModalOpen, setEmailModalOpen] = React.useState(false);
  const [resendLoading, setResendLoading] = React.useState(false);
  const privateService = usePrivateService();

  // role modal
  const [infoOpen, setInfoOpen] = React.useState(false);
  const [infoRole, setInfoRole] = React.useState<StaffRole>("staff");
  useDraggableModal(infoOpen);
  const openRoleInfo = (role: StaffRole) => {
    setInfoRole(role);
    setInfoOpen(true);
  };

  const handleChange = <K extends keyof Staff>(key: K, val: Staff[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  function validate(): boolean {
    const next: typeof errors = {};

    if (!required(form.firstName || "")) next.firstName = "First name is required";
    if (!required(form.lastName || "")) next.lastName = "Last name is required";

    if (!isValidUSPhone10(form.phone || "")) {
      next.phone = "Enter a valid US phone (10 digits)";
    }

    if (form.state && !isValidUSState(form.state)) {
      next.state = "Select a valid state";
    }

    if (form.zip && !isValidUSZip5(form.zip)) {
      next.zip = "ZIP must be 5 digits";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      ...form,
      firstName: toTitle(form.firstName || ""),
      lastName: toTitle(form.lastName || ""),
    });
  }

  const toggleConfirmed = () => onSubmit({ id: form.id, confirmed: !form.confirmed } as any);

  const handleResendInvitation = async () => {
    setResendLoading(true);
    try {
      const response = await privateService.post(`/staff/${form.id}/resend-invitation`);
      if (response.data.success) {
        alert("Invitation email sent successfully!");
      }
    } catch (err: any) {
      console.error("Error resending invitation:", err);
      alert(err.response?.data?.message || "Failed to send invitation email");
    } finally {
      setResendLoading(false);
    }
  };

  const pathPrefix = window.location.pathname.split('/')[1];
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center text-gray-700" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li>
            <Link
              to={`/${pathPrefix}/staffs`}
              className="inline-flex items-center text-xs font-medium text-gray-700 hover:text-blue-600 sm:text-sm"
            >
              Staff
            </Link>
          </li>
          <li>
            <span className="text-gray-400 text-sm">/</span>
          </li>
          <li>
            <span className="text-gray-500 text-sm">Edit Staff</span>
          </li>
        </ol>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-700 text-white sm:h-14 sm:w-14">
            <HiUser className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold sm:text-2xl">Edit Staff</h1>
            <p className="text-sm text-gray-500">Update contact info and security</p>
          </div>
        </div>
      </div>

      <form className="space-y-4 sm:space-y-6" onSubmit={submit} noValidate>
        {/* Staff Details */}
        <Card className="bg-gray-50">
          <div className="mb-3 flex items-center gap-2 sm:gap-3">
            <h3 className=" font-semibold text-gray-900 text-lg">Staff Details</h3>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[160px_1fr]">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-3 self-start lg:items-start">
              <button
                type="button"
                onClick={triggerPick}
                className="relative rounded-full outline-none focus:ring-2 focus:ring-blue-300 group"
                title="Change photo"
              >
                <div
                  className={`flex h-35 w-35 cursor-pointer items-center justify-center overflow-hidden rounded-full text-5xl font-bold text-white shadow ${
                    !form.profilePicUrl ? "bg-blue-700" : ""
                  }`}
                >
                  {form.profilePicUrl ? (
                    <img src={form.profilePicUrl} className="h-full w-full object-cover" />
                  ) : (
                    initials(form.firstName, form.lastName)
                  )}
                </div>
                <span className="cursor-pointer absolute -top-1 right-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-700 text-white shadow ring-2 ring-white opacity-0 group-hover:opacity-100 transition-opacity">
                  ✎
                </span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onPickImage(e.target.files?.[0] ?? null)}
              />

              {form.profilePicUrl && (
                <button
                  type="button"
                  onClick={() => handleChange("profilePicUrl", "")}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Remove photo
                </button>
              )}
            </div>

            {/* Fields */}
            <div className="grid grid-cols-1 gap-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <Label className="mb-1 block text-sm">First Name</Label>
                  <input
                    value={form.firstName || ""}
                    onBlur={(e) => handleChange("firstName", toTitle(e.target.value))}
                    onChange={(e) => handleChange("firstName", e.target.value)}
                    placeholder="e.g., Alysa"
                    className={`${baseInput} ${errors.firstName ? errorInput : okInput}`}
                    aria-invalid={!!errors.firstName}
                  />
                  {errors.firstName && <HelperText color="failure">{errors.firstName}</HelperText>}
                </div>

                <div>
                  <Label className="mb-1 block text-sm">Last Name</Label>
                  <input
                    value={form.lastName || ""}
                    onBlur={(e) => handleChange("lastName", toTitle(e.target.value))}
                    onChange={(e) => handleChange("lastName", e.target.value)}
                    placeholder="e.g., Evans"
                    className={`${baseInput} ${errors.lastName ? errorInput : okInput}`}
                    aria-invalid={!!errors.lastName}
                  />
                  {errors.lastName && <HelperText color="failure">{errors.lastName}</HelperText>}
                </div>

                <div>
                  <Label className="mb-1 block text-sm">Email</Label>
                  <input value={form.email} readOnly className={`${baseInput} ${okInput}`} />
                </div>

                <div>
                  <Label className="mb-1 block text-xs sm:text-sm">Phone</Label>
                  <PhoneInput
                    value={form.phone || ""}
                    onChange={(val) => handleChange("phone", val)}
                    error={!!errors.phone}
                  />
                  {errors.phone && <HelperText color="failure">{errors.phone}</HelperText>}
                </div>
              </div>
            </div>
          </div>

          {/* Role list + info modal trigger */}
          <div className="mt-4">
            <Label className="mb-2 block text-sm">Role</Label>
            <div className="overflow-hidden rounded-md border border-gray-200 bg-white">
              {ROLE_CARDS.map((rc, i) => {
                const active = form.role === rc.value;
                return (
                  <label
                    key={rc.value}
                    className={`flex items-start gap-3 px-3 py-2 sm:px-4 sm:py-3 cursor-pointer ${
                      i !== ROLE_CARDS.length - 1 ? "border-b border-gray-200" : ""
                    } ${active ? "bg-gray-50" : "hover:bg-gray-50"}`}
                  >
                    <input
                      type="radio"
                      name="role"
                      className="mt-1 h-4 w-4"
                      checked={active}
                      onChange={() => handleChange("role", rc.value)}
                    />
                    <div className="flex-1">
                      <div className="font-medium text-xs sm:text-sm">{rc.title}</div>
                      <div className="text-xs text-gray-600">{rc.desc}</div>
                    </div>
                    <button
                      type="button"
                      className="text-xs font-medium text-gray-500 hover:text-blue-600 cursor-pointer"
                      onClick={() => openRoleInfo(rc.value)}
                    >
                      More info…
                    </button>
                  </label>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Address */}
        <Card className="bg-gray-50">
          <div className="mb-3 flex items-center gap-2 sm:gap-3">
            <h3 className="font-semibold text-gray-900 text-lg">Address</h3>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:gap-4">
            {/* Street address full width */}
            <div>
              <Label className="mb-1 block text-sm">Address</Label>
              <input
                value={form.address || ""}
                onChange={(e) => handleChange("address", e.target.value)}
                className={`${baseInput} ${okInput}`}
                placeholder="Enter Address"
              />
            </div>

            {/* City | (State + Zip) */}
            <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2 min-w-0">
              {/* City */}
              <div className="min-w-0">
                <Label className="mb-1 block text-sm">City</Label>
                <input
                  value={form.city || ""}
                  onChange={(e) => handleChange("city", e.target.value)}
                  className={`${baseInput} ${okInput}`}
                  placeholder="Enter City"
                />
              </div>

              {/* State + Zip */}
              <div className="min-w-0">
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4">
                  {/* State */}
                  <div className="col-span-1 min-w-0">
                    <Label className="mb-1 block sm:mb-2 text-sm">State</Label>
                    <USStateSelect
                      value={form.state || ""}
                      onChange={(abbr) => handleChange("state", abbr)}
                      error={!!errors.state}
                      className="w-full cursor-pointer"
                    />
                    {errors.state && <HelperText color="failure">{errors.state}</HelperText>}
                  </div>

                  {/* Zip */}
                  <div className="col-span-2 sm:col-span-3 min-w-0">
                    <Label className="mb-1 block sm:mb-2 text-sm">Zip Code</Label>
                    <ZipCodeInput
                      value={form.zip || ""}
                      onChange={(zip) => handleChange("zip", zip)}
                      error={!!errors.zip}
                      className="w-full"
                      placeholder="Enter Address"
                    />
                    {errors.zip && <HelperText color="failure">{errors.zip}</HelperText>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="pt-0 sm:pt-1">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button 
                color="green" 
                type="button" 
                className="cursor-pointer w-full sm:w-auto"
                onClick={() => setEmailModalOpen(true)}
              >
                Send Message
              </Button>

              {form.confirmed ? (
                <Button
                  type="button"
                  onClick={toggleConfirmed}
                  color="failure"
                  className="bg-red-700 hover:bg-red-800 text-white cursor-pointer w-full sm:w-auto"
                >
                  Make Unconfirmed
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleResendInvitation}
                  color="blue"
                  className="cursor-pointer w-full sm:w-auto"
                  disabled={resendLoading}
                >
                  {resendLoading ? "Sending..." : "Send Confirm Account Email"}
                </Button>
              )}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button color="light" type="button" onClick={onCancel} className="cursor-pointer w-full sm:w-auto">
                Cancel
              </Button>
              <Button type="submit" color="blue" className="cursor-pointer px-6 w-full sm:w-auto">
                Save
              </Button>
            </div>
          </div>
        </div>
      </form>
      
      {/* email modal */}
      {emailModalOpen && (
        <SendEmailModal
          staff={staff}
          isOpen={emailModalOpen}
          onClose={() => setEmailModalOpen(false)}
        />
      )}

      {/* Role details modal */}
      {infoOpen &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40">
            <div role="dialog" className="bg-white rounded-lg shadow-xl w-full max-w-md relative m-4">
              <div className="modal-drag-handle flex items-center justify-between p-4 border-b border-gray-200 cursor-grab active:cursor-grabbing select-none">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 pointer-events-none">
                  {ROLE_DETAILS[infoRole].title}
                </h2>
                <button onClick={() => setInfoOpen(false)} className="text-gray-500 hover:text-gray-700">
                  <HiX className="h-5 w-5 cursor-pointer" />
                </button>
              </div>

              <div className="p-4 max-h-[60vh] overflow-y-auto text-sm text-gray-700">
                <ul className="list-disc pl-5 space-y-1">
                  {ROLE_DETAILS[infoRole].bullets.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200">
                <Button color="light" onClick={() => setInfoOpen(false)} className="cursor-pointer">
                  Close
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
