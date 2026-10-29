import * as React from "react";
import {
  Button,
  Label,
  HelperText,
  Card,
  Alert,
  Radio
} from "flowbite-react";
import { Link } from "react-router-dom";
import {
  HiUser,
  HiExclamationCircle,
  HiX,
} from "react-icons/hi";
import { Staff, StaffRole } from "../../types/staffs";
import { useDraggableModal } from "../../hooks/useDraggableModal";
import { createPortal } from "react-dom";
import usePrivateService from "../../hooks/Auth/usePrivateService";
import { isValidUSPhone10, isValidUSState } from "../../utils/reusableUtils.ts/input";
import { PhoneInput, USStateSelect, ZipCodeInput } from "../ui/InputsBundle";
import AlertModal from "../../components/ui/AlertModal";
type FormValue = {
  email: string;
  firstName: string;
  lastName: string;
  role: StaffRole;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
};

type Props = {
  onSubmit: (values: Omit<Staff, "id" | "created_at" | "updated_at">) => void;
  onCancel: () => void;
};

const empty: FormValue = {
  email: "",
  firstName: "",
  lastName: "",
  role: "staff",
  phone: "",
  address: "",
  city: "",
  state: "",
  zip: "",
};

const required = (s: string) => s.trim().length > 0;

const toTitle = (s: string) =>
  s
    .toLowerCase()
    .replace(/\b\w/g, (m) => m.toUpperCase())
    .replace(/\s+/g, " ")
    .trim();

// Same ROLE_CARDS used by EditStaffForm
const ROLE_CARDS: Array<{ value: StaffRole; title: string; desc: string }> = [
  { value: "admin", title: "Admin", desc: "Best for business owners and company managers" },
  { value: "staff", title: "Staff", desc: "Best for employees that manage bookings" },
  { value: "technical", title: "Technical Admin", desc: "For people who help with website/programming" },
];

// Same detailed content for the modal
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

export default function StaffsForm({ onSubmit, onCancel }: Props) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<FormValue>(empty);
  const [errors, setErrors] = React.useState<
    Partial<Record<keyof FormValue, string>>
  >({});

  const [alertModal, setAlertModal] = React.useState<{
    isOpen: boolean;
    type: "success" | "error" | "info";
    title: string;
    message: string;
    actionLabel?: string;
    onAction?: () => void;
  }>({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
  });

  // Role “More info” modal state (and draggable behavior)
  const [infoOpen, setInfoOpen] = React.useState(false);
  const [infoRole, setInfoRole] = React.useState<StaffRole>("staff");
  useDraggableModal(infoOpen);
  const openRoleInfo = (role: StaffRole) => {
    setInfoRole(role);
    setInfoOpen(true);
  };

  const privateService = usePrivateService();
  
  const handleChange = <K extends keyof FormValue>(key: K, val: FormValue[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

function validate(): boolean {
  const next: typeof errors = {};
  if (!required(form.email)) next.email = "Email is required";
  else if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = "Enter a valid email";

  if (!required(form.firstName)) next.firstName = "First name is required";
  if (!required(form.lastName))  next.lastName  = "Last name is required";

  if (!isValidUSPhone10(form.phone)) next.phone = "Enter a valid US phone (10 digits)";

  // optional: require state to be a valid 2-letter US state
  if (form.state && !isValidUSState(form.state)) next.state = "Select a valid state";

  setErrors(next);
  return Object.keys(next).length === 0;
}


  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    if (!validate()) return;

    setIsLoading(true);

    try {
      const response = await privateService.post('/staff', {
        email: form.email,
        firstName: toTitle(form.firstName),
        lastName: toTitle(form.lastName),
        role: form.role,
        phone: form.phone,
        address: form.address,
        city: form.city,
        state: form.state,
        zip: form.zip,
      });

      if (response.data.success) {
        setAlertModal({
          isOpen: true,
          type: "success",
          title: "Invitation Sent!",
          message: `An invitation has been sent to ${form.email}. They will receive an email with a link to set their password.`,
          onAction: () => {
            setAlertModal({ ...alertModal, isOpen: false });
            // Call parent onSubmit to update local state and navigate back
            const now = new Date().toISOString();
            onSubmit({
              email: form.email,
              firstName: toTitle(form.firstName),
              lastName: toTitle(form.lastName),
              role: form.role,
              twoFAEnabled: false,
              confirmed: false,
              phone: form.phone,
              address: form.address,
              city: form.city,
              state: form.state,
              zip: form.zip,
              created_at: now,
              emailPreferences: {
                availabilitySpecificDateChanged: true,
                defaultAvailabilityAdded: true,
                defaultAvailabilityChanged: true,
                requestTimeOffSubmitted: true,
              },
            } as Omit<Staff, "id" | "created_at" | "updated_at">);
          },
          actionLabel: "OK",
        });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to send invitation. Please try again.';
      setAlertModal({
        isOpen: true,
        type: "error",
        title: "Error",
        message: errorMessage,
      });
      console.error('Error creating staff:', error);
    } finally {
      setIsLoading(false);
    }
  }

  
const focusGray =
  "focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-600 focus:ring-offset-0 transition-colors";

const baseInput =
  "block w-full rounded-lg border bg-white px-2.5 py-2 text-xs sm:px-3 sm:py-2.5 sm:text-sm text-gray-900 placeholder:text-gray-400";

const okInput = `border-gray-300 ${focusGray}`;
const errorInput = `border-red-500 ring-1 ring-red-500/20 ${focusGray}`;
const pathPrefix = window.location.pathname.split('/')[1];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center text-gray-700" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <Link
              to={`/${pathPrefix}/staffs`}
              className="inline-flex items-center text-xs font-medium text-gray-700 hover:text-gray-600 sm:text-sm"
            >
              Staff
            </Link>
          </li>
          <li aria-current="page">
            <div className="flex items-center">
              <svg
                className="mx-1 h-3 w-3 text-gray-400 bg-gray"
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
                Add New Staff
              </span>
            </div>
          </li>
        </ol>
      </nav>

      {submitError && (
        <Alert color="failure" icon={HiExclamationCircle}>
          <span className="text-xs sm:text-sm">{submitError}</span>
        </Alert>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-black text-white sm:h-14 sm:w-14">
          <HiUser className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">Add Staff</h1>
          <p className="text-sm text-gray-500">Create a new office staff member</p>
        </div>
      </div>

      <form className="space-y-4 sm:space-y-6" onSubmit={submit} noValidate>
        {/* Staff Details */}
        <Card className="bg-gray-50">
          <div className="mb-3 flex items-center gap-2 sm:gap-3">
            <h3 className=" font-semibold text-gray-900 text-lg">
              Staff Details
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label className="mb-1 block sm:mb-2 text-sm">First Name</Label>
                <input
                  value={form.firstName}
                  onBlur={(e) => handleChange("firstName", toTitle(e.target.value))}
                  onChange={(e) => handleChange("firstName", e.target.value)}
                  placeholder="Enter First Name"
                  className={`${baseInput} ${errors.firstName ? errorInput : okInput}`}
                  aria-invalid={!!errors.firstName}
                  aria-describedby={errors.firstName ? "err-firstName" : undefined}
                />
                {errors.firstName && (
                  <HelperText id="err-firstName" color="failure">
                    {errors.firstName}
                  </HelperText>
                )}

              </div>

              <div>
                <Label className="mb-1 block  sm:mb-2 text-sm">Last Name</Label>
                <input
                  value={form.lastName}
                  onBlur={(e) => handleChange("lastName", toTitle(e.target.value))}
                  onChange={(e) => handleChange("lastName", e.target.value)}
                  placeholder="Enter Last Name"
                  className={`${baseInput} ${errors.lastName ? errorInput : okInput}`}
                  aria-invalid={!!errors.lastName}
                  aria-describedby={errors.lastName ? "err-lastName" : undefined}
                />

              {errors.lastName && (
                <HelperText id="err-lastName" color="failure">
                  {errors.lastName}
                </HelperText>
              )}

              </div>

              <div>
                <Label htmlFor="email" className="mb-1 block  sm:mb-2 text-sm">
                  Email
                </Label>
               <input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="Enter Email"
                required
                className={`${baseInput} ${errors.email ? errorInput : okInput}`}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "err-email" : undefined}
              />
              {errors.email && (
                <HelperText id="err-email" color="failure">
                  {errors.email}
                </HelperText>
              )}

              </div>

              <div>
               <Label className="mb-1 block sm:mb-2 text-sm">Phone</Label>
                <PhoneInput
                  value={form.phone}
                  onChange={(val) => handleChange("phone", val)}
                  error={!!errors.phone}
                />
                {errors.phone && (
                  <HelperText id="err-phone" color="failure">
                    {errors.phone}
                  </HelperText>
                )}


              </div>
            </div>

            {/* Role — compact radio list + modal trigger (same as EditStaffForm) */}
            <div>
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
                      <Radio
                        color="gray"
                        name="role"
                        className="mt-1 h-4 w-4"
                        checked={active}
                        onChange={() => handleChange("role", rc.value)}
                      />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{rc.title}</div>
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
          </div>
        </Card>

       {/* Address */}
<Card className="bg-gray-50">
  <div className="mb-3 flex items-center gap-2 sm:mb-4 sm:gap-3">
    <h3 className="font-semibold text-gray-900 text-lg">Address</h3>
  </div>

  {/* Full-width street address */}
  <div className="grid grid-cols-1 gap-3 sm:gap-4">
    <div>
      <Label className="mb-1 block sm:mb-2 text-sm">Address</Label>
     <input
        value={form.address}
        onChange={(e) => handleChange("address", e.target.value)}
        className={`${baseInput} ${okInput}`}
        placeholder="Enter Address"
      />

    </div>

    {/* City | (State + Zip) */}
    <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2 min-w-0">
      {/* Left half: City */}
      <div className="min-w-0">
        <Label className="mb-1 block sm:mb-2 text-sm">City</Label>
       <input
        value={form.city}
        onChange={(e) => handleChange("city", e.target.value)}
        className={`${baseInput} ${okInput}`}
        placeholder="Enter City"
      />

      </div>

      <div className="min-w-0">
  <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4">
    {/* State */}
    <div className="col-span-1 min-w-0">
      <Label className="mb-1 block sm:mb-2 text-sm">State</Label>
      <USStateSelect
        value={form.state}
        onChange={(abbr) => handleChange("state", abbr)}
        error={!!errors.state}
        className="w-full pr-8 cursor-pointer "   
      />
      {errors.state && <HelperText color="failure">{errors.state}</HelperText>}
    </div>

    {/* Zip */}
    <div className="col-span-2 sm:col-span-3 min-w-0">
      <Label className="mb-1 block sm:mb-2 text-sm">Zip Code</Label>
      <ZipCodeInput
        value={form.zip ?? ""}
        onChange={(zip) => handleChange("zip", zip)}
        error={!!errors.zip}
        className="w-full"
        placeholder="Enter Zip Code"
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
          <div className="flex justify-end gap-3">
            <Button color="light" type="button" onClick={onCancel} className="px-4 cursor-pointer">
              Cancel
            </Button>
            <Button 
              type="submit" 
              color="gray" 
              className="px-6 cursor-pointer"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending Invitation...
                </span>
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </div>
      </form>
      
      {alertModal.isOpen && (
        <AlertModal
          isOpen={alertModal.isOpen}
          type={alertModal.type}
          title={alertModal.title}
          message={alertModal.message}
          onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
          actionLabel={alertModal.actionLabel}
          onAction={alertModal.onAction}
        />
      )}

      {/* Draggable Role Info Modal (no Modal.Header/Body/Footer components) */}
      {infoOpen &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40">
            <div role="dialog" className="bg-white rounded-lg shadow-xl w-full max-w-md relative m-4">
              {/* header (drag handle) */}
              <div className="modal-drag-handle flex items-center justify-between p-4 border-b border-gray-200 cursor-grab active:cursor-grabbing select-none">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 pointer-events-none">
                  {ROLE_DETAILS[infoRole].title}
                </h2>
                <button onClick={() => setInfoOpen(false)} className="text-gray-500 hover:text-gray-700">
                  <HiX className="h-5 w-5 cursor-pointer" />
                </button>
              </div>
              {/* content */}
              <div className="p-4 max-h-[60vh] overflow-y-auto text-sm text-gray-700">
                <ul className="list-disc pl-5 space-y-1">
                  {ROLE_DETAILS[infoRole].bullets.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>
              {/* footer */}
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
