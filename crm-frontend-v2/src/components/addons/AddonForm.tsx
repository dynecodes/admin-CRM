import React, { useActionState, useRef, useEffect, useState } from "react";
import { Alert, Label, Checkbox, Card, Radio } from "flowbite-react";
import { HiExclamationCircle, HiCheckCircle, HiX } from "react-icons/hi";
import { Link } from "react-router-dom";
import { Addon, RecurringPolicy } from "../../types/addon";
import { useAddons } from "../../hooks/useAddons";
import FormActions from "../ui/FormActions";
import MultiSelectDropdown from "../ui/MultiSelectDropdown";
import IconPicker from "../ui/IconPicker";
import { MdLibraryAddCheck } from "react-icons/md";
import { iconLibrary } from "../../utils/iconLibrary";
import { useCustomIcons } from "../../hooks/useCustomIcons";

interface AddonFormProps {
  addon?: Addon;
  onSuccess: (addonData: any) => void;
  onCancel: () => void;
}

interface ActionState {
  success: boolean;
  message: string | null;
  data: any;
  error: string | null;
}

const AddonForm: React.FC<AddonFormProps> = ({
  addon,
  onSuccess,
  onCancel,
}) => {
  const formRef = useRef<HTMLFormElement>(null);
  const isEditing = !!addon;
  const { addAddon, updateAddon, addonOptions, loading } = useAddons();
  const { refetchCustomIcons } = useCustomIcons();

  // form state
  const [addonStatus, setAddonStatus] = useState<"active" | "archived">(
    addon?.status || "active",
  );
  const [selectedServices, setSelectedServices] = useState<number[]>(
    addon?.services?.map((s) => s.id) || [],
  );
  const [quantityBased, setQuantityBased] = useState<boolean>(
    addon?.quantity_based || false,
  );
  const [recurringPolicy, setRecurringPolicy] = useState<RecurringPolicy>(
    addon?.recurring_policy || "every_booking",
  );
  const [iconType, setIconType] = useState<"library" | "upload">(
    addon?.icon_type || "library",
  );
  const [libraryIcon, setLibraryIcon] = useState<string | undefined>(
    addon?.icon_type === "library" ? addon?.icon : undefined,
  );
  const [uploadedIcon, setUploadedIcon] = useState<string | undefined>(
    addon?.icon_type === "upload" ? addon?.icon : undefined,
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.match(/^image\/(png|jpe?g)$/)) {
        alert("Please upload a PNG or JPG file");
        e.target.value = "";
        return;
      }

      // Validate file size (100KB = 102400 bytes)
      if (file.size > 102400) {
        alert("File size must be less than 100KB");
        e.target.value = "";
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedIcon(reader.result as string);
        setIconType("upload");
        setLibraryIcon(undefined); // Clear library icon when uploading
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveIcon = () => {
    setUploadedIcon(undefined);
    setLibraryIcon(undefined);
    const fileInput = document.getElementById(
      "icon-upload",
    ) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  const handleLibraryIconSelect = (iconId: string) => {
    setLibraryIcon(iconId);
    setIconType("library");
    setUploadedIcon(undefined); // Clear uploaded icon when selecting from library
    const fileInput = document.getElementById(
      "icon-upload",
    ) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  const getCurrentIcon = () => {
    if (iconType === "library" && libraryIcon) {
      return libraryIcon;
    } else if (iconType === "upload" && uploadedIcon) {
      return uploadedIcon;
    }
    return undefined;
  };

  const getCurrentIconType = () => {
    if (libraryIcon && iconType === "library") return "library";
    if (uploadedIcon && iconType === "upload") return "upload";
    return undefined;
  };

  const addonAction = async (
    _prevState: ActionState,
    formData: FormData,
  ): Promise<ActionState> => {
    try {
      const data = Object.fromEntries(formData);

      const addonData = {
        ...data,
        icon: getCurrentIcon(),
        icon_type: getCurrentIconType(),
        quantity_based: quantityBased,
        recurring_policy: recurringPolicy,
        services: selectedServices,
        exclude_frequency: data.exclude_frequency === "on",
        exclude_discount_code: data.exclude_discount_code === "on",
        status: addonStatus, // THIS WAS MISSING
      };

      const result = isEditing
        ? await updateAddon(addon!.id, addonData)
        : await addAddon(addonData);

      return {
        success: true,
        message: `Add-on ${isEditing ? "updated" : "created"} successfully!`,
        data: result,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        message: null,
        data: null,
        error: (error as Error).message,
      };
    }
  };

  const [state, dispatch, isPending] = useActionState(addonAction, {
    success: false,
    message: null,
    data: null,
    error: null,
  });

  useEffect(() => {
    if (state.success && state.data) {
      onSuccess(state.data);

      // Refresh custom icons if a new icon was uploaded
      if (iconType === "upload" && uploadedIcon?.startsWith("data:image")) {
        refetchCustomIcons();
      }

      if (!isEditing) {
        formRef.current?.reset();
        setSelectedServices([]);
        setQuantityBased(false);
        setRecurringPolicy("every_booking");
        setLibraryIcon(undefined);
        setUploadedIcon(undefined);
        setIconType("library");
      }
    }
  }, [
    state.success,
    state.data,
    isEditing,
    onSuccess,
    iconType,
    uploadedIcon,
    refetchCustomIcons,
  ]);

  const selectedLibraryIconData = libraryIcon
    ? iconLibrary.find((icon) => icon.id === libraryIcon)
    : null;

  const showUploadedIcon = iconType === "upload" && uploadedIcon;
  const showLibraryIcon = iconType === "library" && selectedLibraryIconData;

  const pathPrefix = window.location.pathname.split('/')[1];
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* breadcrumb */}
      <nav className="flex items-center text-gray-700" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <Link
              to={`/${pathPrefix}/addons`}
              className="inline-flex items-center text-xs font-medium text-gray-700 hover:text-gray-600 sm:text-sm"
            >
              Add-ons
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
                {isEditing ? "Edit Add-on" : "New Add-on"}
              </span>
            </div>
          </li>
        </ol>
      </nav>

      {/* header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="relative inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-black sm:h-12 sm:w-12">
            <MdLibraryAddCheck className="h-5 w-5 text-white sm:h-6 sm:w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 sm:text-2xl lg:text-3xl">
              {isEditing ? "Edit Add-on" : "New Add-on"}
            </h1>
            <p className="text-xs text-gray-500 sm:text-sm">
              {isEditing
                ? "Update add-on details and configuration"
                : "Create a new add-on offering"}
            </p>
          </div>
        </div>
      </div>

      <form ref={formRef} action={dispatch} className="space-y-4 sm:space-y-6">
        {/* alerts */}
        {state.error && (
          <Alert color="failure" icon={HiExclamationCircle}>
            <span className="text-xs font-medium sm:text-sm">Error!</span>
            <span className="text-xs sm:text-sm">{state.error}</span>
          </Alert>
        )}

        {state.success && state.message && (
          <Alert color="success" icon={HiCheckCircle}>
            <span className="text-xs font-medium sm:text-sm">Success!</span>
            <span className="text-xs sm:text-sm">{state.message}</span>
          </Alert>
        )}

        {/* basic info card */}
        <Card className="bg-gray-50">
          <div className="mb-3 flex items-center gap-2 sm:mb-4 sm:gap-3">
            {/* <HiInformationCircle className="h-6 w-6 text-gray-600 sm:h-5 sm:w-5" /> */}
            <h3 className="text-lg font-semibold text-gray-900 sm:text-lg">
              Add-on Information
            </h3>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
              <div className="lg:col-span-2">
                <Label
                  htmlFor="name"
                  className="mb-1 block text-xs sm:mb-2 sm:text-sm"
                >
                  Add-on Name
                </Label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Enter Add-ons"
                  defaultValue={addon?.name || ""}
                  required
                  className="block w-full rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-xs text-gray-900 focus:border-gray-500 focus:ring-gray-500 sm:px-3 sm:py-2.5 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <Label
                htmlFor="description"
                className="mb-1 block text-xs sm:mb-2 sm:text-sm"
              >
                Description
              </Label>
              <textarea
                id="description"
                name="description"
                rows={3}
                placeholder="Enter a brief description of this add-on..."
                defaultValue={addon?.description || ""}
                className="block w-full resize-none rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-xs text-gray-900 focus:border-gray-500 focus:ring-gray-500 sm:px-3 sm:py-2.5 sm:text-sm"
              />
            </div>

            {/* Icon Library Picker */}
            <IconPicker
              selectedIcon={libraryIcon || undefined}
              onSelect={handleLibraryIconSelect}
              label="Choose from Icon Library"
            />

            {/* OR Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="text-xs font-medium text-gray-500">OR</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>

            {/* Custom Icon Upload */}
            <div>
              <Label className="mb-1 block text-xs sm:mb-2 sm:text-sm">
                Upload Custom Icon
              </Label>
              <div className="flex items-center gap-3">
                {(showUploadedIcon || showLibraryIcon) && (
                  <div className="relative">
                    {showUploadedIcon ? (
                      <img
                        src={uploadedIcon}
                        alt="Icon preview"
                        className="h-12 w-12 rounded-lg border-2 border-gray-300 object-cover sm:h-14 sm:w-14"
                      />
                    ) : showLibraryIcon ? (
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg border-2 border-gray-300 bg-white text-2xl text-gray-700 sm:h-14 sm:w-14">
                        {selectedLibraryIconData!.icon}
                      </div>
                    ) : null}
                    <button
                      type="button"
                      onClick={handleRemoveIcon}
                      className="absolute -top-2 -right-2 z-10 rounded-full bg-red-500 p-1 text-white shadow-md transition-colors hover:bg-red-600"
                    >
                      <HiX className="h-3 w-3" />
                    </button>
                  </div>
                )}
                <div className="flex-1">
                  <label
                    htmlFor="icon-upload"
                    className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-transparent bg-gray-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:outline-none"
                  >
                    Upload New Icon
                  </label>
                  <input
                    id="icon-upload"
                    type="file"
                    accept=".png,.jpg,.jpeg"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <p className="mt-3 text-xs text-gray-500">
                    Must have a size of less than 100KB and be a PNG or JPG
                    file.
                  </p>
                </div>
              </div>
            </div>
          </div>
          {/* </Card> */}

          <div className="space-y-4 sm:space-y-4">
            {/* quantity-based checkbox */}
            <div className="flex cursor-pointer items-start gap-2 rounded-lg border border-gray-200 bg-white p-2 transition-colors hover:border-gray-300 sm:gap-3 sm:p-3">
              <Checkbox
                color="gray"
                id="quantity_based"
                checked={quantityBased}
                onChange={(e) => setQuantityBased(e.target.checked)}
                className="mt-1 h-3 w-3 cursor-pointer bg-white sm:h-4 sm:w-4"
              />
              <div>
                <Label
                  htmlFor="quantity_based"
                  className="cursor-pointer text-xs font-medium sm:text-sm"
                >
                  Quantity-Based Pricing
                </Label>
                <p className="mt-1 text-xs text-gray-500">
                  Price applies per unit/quantity selected
                </p>
              </div>
            </div>
            <div>
              <Label
                htmlFor="price"
                className="mb-1 block text-xs sm:mb-2 sm:text-sm"
              >
                Price ($)
              </Label>

              <div className="relative">
                {/* simple $ prefix, no circle */}
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-gray-500 sm:text-base">
                  $
                </span>
                <input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  defaultValue={addon?.price || ""}
                  required
                  onInput={(e) => {
                    const input = e.target as HTMLInputElement;
                    const value = input.value;
                    const decimalPart = value.split(".")[1];
                    if (decimalPart && decimalPart.length > 2) {
                      const numValue = parseFloat(value);
                      input.value = (
                        Math.floor(numValue * 100) / 100
                      ).toString();
                    }
                  }}
                  className="block w-full rounded-lg border border-gray-300 bg-white py-2 pr-2 pl-9 text-xs text-gray-900 focus:border-gray-500 focus:ring-gray-500 sm:py-2.5 sm:pl-10 sm:text-sm"
                />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            <div>
              <Label
                htmlFor="duration_hours"
                className="mb-1 block text-xs sm:mb-2 sm:text-sm"
              >
                Hours
              </Label>
              <input
                id="duration_hours"
                name="duration_hours"
                type="number"
                min="0"
                placeholder="0"
                defaultValue={addon?.duration_hours || ""}
                className="block w-full rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-xs text-gray-900 focus:border-gray-500 focus:ring-gray-500 sm:px-3 sm:py-2.5 sm:text-sm"
              />
            </div>
            <div>
              <Label
                htmlFor="duration_minutes"
                className="mb-1 block text-xs sm:mb-2 sm:text-sm"
              >
                Minutes
              </Label>
              <input
                id="duration_minutes"
                name="duration_minutes"
                type="number"
                min="0"
                max="59"
                placeholder="0"
                defaultValue={addon?.duration_minutes || ""}
                className="block w-full rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-xs text-gray-900 focus:border-gray-500 focus:ring-gray-500 sm:px-3 sm:py-2.5 sm:text-sm"
              />
            </div>
          </div>
          <div>
            <Label className="mb-2 block text-xs text-gray-900 sm:text-sm">
              Choose Services
            </Label>
            <MultiSelectDropdown
              options={addonOptions.services}
              selected={selectedServices}
              onChange={setSelectedServices}
              placeholder="Select Services"
              modalTitle="Select Services"
            />
          </div>

          <div className="space-y-4">
            {/* recurring policy */}
            <div className="rounded-lg bg-gray-50 ">
              <Label className="mb-2 block text-sm">
                Recurring Policy
              </Label>
              <div className="grid sm:grid-cols-2 grid-cols-1 gap-3">
                <div className="flex cursor-pointer items-start gap-2 rounded-lg border border-gray-300 bg-white p-2 transition-colors hover:border-gray-300 sm:gap-3 sm:p-3">
                  <Radio
                    color="gray"
                    id="every_booking"
                    name="recurring_policy_radio"
                    value="every_booking"
                    checked={recurringPolicy === "every_booking"}
                    onChange={(e) =>
                      setRecurringPolicy(e.target.value as RecurringPolicy)
                    }
                    className="mt-1 cursor-pointer"
                  />
                  <div>
                    <Label
                      htmlFor="every_booking"
                      className="mb-1 block cursor-pointer text-sm"
                    >
                      Every Booking
                    </Label>
                    <p className="mt-1 text-xs text-gray-500">
                      Add-on applies to every recurring booking
                    </p>
                  </div>
                </div>
                <div className="flex cursor-pointer items-start gap-2 rounded-lg border border-gray-300 bg-white p-2 transition-colors hover:border-gray-300 sm:gap-3 sm:p-3">
                  <Radio
                    color="gray"
                    id="first_booking_only"
                    name="recurring_policy_radio"
                    value="first_booking_only"
                    checked={recurringPolicy === "first_booking_only"}
                    onChange={(e) =>
                      setRecurringPolicy(e.target.value as RecurringPolicy)
                    }
                    className="mt-1 cursor-pointer"
                  />
                  <div>
                    <Label
                      htmlFor="first_booking_only"
                      className="mb-1 block cursor-pointer text-sm"
                    >
                      First Booking Only
                    </Label>
                    <p className="mt-1 text-xs text-gray-500">
                      Add-on applies only to the first booking in a series
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* exclude from checkboxes */}
            <div className="-mt-1 space-y-3">
              <div className="flex items-start gap-2 rounded-lg border border-gray-300 bg-white p-2 sm:gap-3 sm:p-3">
                <Checkbox
                  color="gray"
                  id="exclude_frequency"
                  name="exclude_frequency"
                  defaultChecked={addon?.exclude_frequency || false}
                  className="mt-1 h-3 w-3 cursor-pointer bg-gray-50 sm:h-4 sm:w-4"
                />
                <div className="">
                  <Label
                    htmlFor="exclude_frequency"
                    className="cursor-pointer text-xs font-medium sm:text-sm"
                  >
                    Exclude from Frequency Discounts
                  </Label>
                  <p className="mt-1 text-xs text-gray-500">
                    This add-on won't be eligible for frequency-based discounts
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2 rounded-lg border border-gray-300 bg-white p-2 sm:gap-3 sm:p-3">
                <Checkbox
                  color="gray"
                  id="exclude_discount_code"
                  name="exclude_discount_code"
                  defaultChecked={addon?.exclude_discount_code || false}
                  className="mt-1 h-3 w-3 cursor-pointer bg-gray-50 sm:h-4 sm:w-4"
                />
                <div>
                  <Label
                    htmlFor="exclude_discount_code"
                    className="cursor-pointer text-xs font-medium sm:text-sm"
                  >
                    Exclude from Discount Codes
                  </Label>
                  <p className="mt-1 text-xs text-gray-500">
                    Discount codes cannot be applied to this add-on
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* cancel & save buttons */}
        <FormActions
          onCancel={onCancel}
          isPending={isPending || loading}
          isEditing={isEditing}
          submitText="Save"
          editText="Save"
          showStatusToggle={isEditing}
          status={addonStatus}
          onStatusToggle={() => {
            const newStatus = addonStatus === "active" ? "archived" : "active";
            setAddonStatus(newStatus);
            // Trigger form submission after status change
            setTimeout(() => {
              formRef.current?.requestSubmit();
            }, 0);
          }}
        />
      </form>
    </div>
  );
};

export default AddonForm;
