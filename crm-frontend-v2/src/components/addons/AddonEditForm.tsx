import React, { useState } from "react";
import { Label, Checkbox, Button, Radio } from "flowbite-react";
import { Addon, RecurringPolicy } from "../../types/addon";
import { useAddons } from "../../hooks/useAddons";
import MultiSelectDropdown from "../ui/MultiSelectDropdown";
import IconPicker from "../ui/IconPicker";
import { HiX } from "react-icons/hi";
import { iconLibrary } from "../../utils/iconLibrary";
import { useCustomIcons } from "../../hooks/useCustomIcons";

interface AddonEditFormProps {
  addon: Addon;
  editingData?: {
    uploadedIcon?: string;
    libraryIcon?: string;
    iconType?: "library" | "upload";
  };
  onEditingDataChange: (data: {
    uploadedIcon?: string;
    libraryIcon?: string;
    iconType?: "library" | "upload";
  }) => void;
  onSave: (data: any) => void;
  onCancel: () => void;
}

const AddonEditForm: React.FC<AddonEditFormProps> = ({
  addon,
  editingData,
  onEditingDataChange,
  onSave,
  onCancel,
}) => {
  const { addonOptions } = useAddons();
  const { refetchCustomIcons } = useCustomIcons();
  const [name, setName] = useState(addon.name);
  const [description, setDescription] = useState(addon.description || "");
  const [status, setStatus] = useState<"active" | "archived">(addon.status);
  const [price, setPrice] = useState(addon.price);
  const [quantityBased, setQuantityBased] = useState(addon.quantity_based);
  const [durationHours, setDurationHours] = useState(addon.duration_hours || 0);
  const [durationMinutes, setDurationMinutes] = useState(
    addon.duration_minutes || 0,
  );
  const [selectedServices, setSelectedServices] = useState<number[]>(
    addon.services?.map((s) => s.id) || [],
  );
  const [recurringPolicy, setRecurringPolicy] = useState<RecurringPolicy>(
    addon.recurring_policy,
  );
  const [excludeFrequency, setExcludeFrequency] = useState(
    addon.exclude_frequency,
  );
  const [excludeDiscountCode, setExcludeDiscountCode] = useState(
    addon.exclude_discount_code,
  );

  // Get current icon state - prioritize editingData over addon data
  const iconType =
    editingData?.iconType !== undefined
      ? editingData.iconType
      : addon.icon_type;

  // For library icon: use editingData first, but only if iconType is 'library' or undefined
  const libraryIcon =
    editingData?.libraryIcon !== undefined
      ? editingData.libraryIcon
      : iconType === "library"
        ? addon.icon
        : undefined;

  const uploadedIcon =
    editingData?.uploadedIcon !== undefined
      ? editingData.uploadedIcon
      : iconType === "upload"
        ? addon.icon
        : undefined;

  console.log("AddonEditForm render:", {
    iconType,
    libraryIcon,
    uploadedIcon,
    editingData,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.match(/^image\/(png|jpe?g)$/)) {
        alert("Please upload a PNG or JPG file");
        e.target.value = "";
        return;
      }

      if (file.size > 102400) {
        alert("File size must be less than 100KB");
        e.target.value = "";
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        console.log("File uploaded, calling onEditingDataChange with upload");
        onEditingDataChange({
          uploadedIcon: reader.result as string,
          libraryIcon: undefined, // Clear library icon
          iconType: "upload",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveIcon = () => {
    console.log("Removing icon, calling onEditingDataChange with undefined");
    onEditingDataChange({
      uploadedIcon: undefined,
      libraryIcon: undefined,
      iconType: undefined,
    });

    const fileInput = document.getElementById(
      `icon-upload-${addon.id}`,
    ) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  const handleLibraryIconSelect = (iconId: string) => {
    console.log("Library icon selected:", iconId);
    onEditingDataChange({
      libraryIcon: iconId,
      uploadedIcon: undefined,
      iconType: "library",
    });

    const fileInput = document.getElementById(
      `icon-upload-${addon.id}`,
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
    return iconType;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert("Add-on name is required");
      return;
    }

    if (price < 0) {
      alert("Price must be a positive number");
      return;
    }

    const isNewUpload =
      iconType === "upload" && uploadedIcon?.startsWith("data:image");

    await onSave({
      name: name.trim(),
      description: description.trim(),
      icon: getCurrentIcon(),
      icon_type: getCurrentIconType(),
      status,
      price,
      quantity_based: quantityBased,
      duration_hours: durationHours,
      duration_minutes: durationMinutes,
      services: selectedServices,
      recurring_policy: recurringPolicy,
      exclude_frequency: excludeFrequency,
      exclude_discount_code: excludeDiscountCode,
    });

    // Refresh custom icons if a new icon was uploaded
    if (isNewUpload) {
      await refetchCustomIcons();
    }
  };

  const selectedLibraryIconData = libraryIcon
    ? iconLibrary.find((icon) => icon.id === libraryIcon)
    : null;

  const showUploadedIcon = iconType === "upload" && uploadedIcon;
  const showLibraryIcon = iconType === "library" && selectedLibraryIconData;

  console.log("Render state:", {
    showUploadedIcon,
    showLibraryIcon,
    iconType,
    libraryIcon,
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="">
        <Label htmlFor={`name-${addon.id}`} className="mb-1 block text-xs">
          Add-on Name
        </Label>
        <input
          id={`name-${addon.id}`}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="block w-full rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-xs text-gray-900 focus:border-gray-500 focus:ring-gray-500"
        />
      </div>

      <div>
        <Label
          htmlFor={`description-${addon.id}`}
          className="mb-1 block text-xs"
        >
          Description
        </Label>
        <textarea
          id={`description-${addon.id}`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Enter a brief description of this add-on..."
          className="block w-full resize-none rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-xs text-gray-900 focus:border-gray-500 focus:ring-gray-500"
        />
      </div>

      {/* Icon Library Picker - Pass libraryIcon which can be undefined */}
      <IconPicker
        selectedIcon={libraryIcon || undefined}
        onSelect={handleLibraryIconSelect}
        label="Choose from Icon Library"
        className="mb-3"
      />

      {/* OR Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 border-t border-gray-300"></div>
        <span className="text-xs font-medium text-gray-500">OR</span>
        <div className="flex-1 border-t border-gray-300"></div>
      </div>

      {/* Custom Icon Upload */}
      <div>
        <Label className="mb-1 block text-xs">Upload Custom Icon</Label>
        <div className="flex items-center gap-3">
          {(showUploadedIcon || showLibraryIcon) && (
            <div className="relative">
              {showUploadedIcon ? (
                <img
                  src={uploadedIcon}
                  alt="Icon preview"
                  className="h-12 w-12 rounded-lg border-2 border-gray-300 object-cover"
                />
              ) : showLibraryIcon ? (
                <div className="flex h-12 w-12 items-center justify-center rounded-lg border-2 border-gray-300 bg-white text-2xl text-gray-700">
                  {selectedLibraryIconData!.icon}
                </div>
              ) : null}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log("X button clicked");
                  handleRemoveIcon();
                }}
                className="absolute -top-2 -right-2 z-10 cursor-pointer rounded-full bg-red-500 p-1 text-white transition-colors hover:bg-red-600"
              >
                <HiX className="h-3 w-3" />
              </button>
            </div>
          )}
          <div className="flex-1">
            <label
              htmlFor={`icon-upload-${addon.id}`}
              className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-transparent bg-gray-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-gray-700 focus:outline-none"
            >
              Upload New Icon
            </label>
            <input
              id={`icon-upload-${addon.id}`}
              type="file"
              accept=".png,.jpg,.jpeg"
              onChange={handleFileChange}
              className="hidden"
            />
            <p className="mt-1 text-xs text-gray-500">
              Must have a size of less than 100KB and be a PNG or JPG file.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div>
          <Label htmlFor={`price-${addon.id}`} className="mb-1 block text-xs">
            Price ($)
          </Label>
          <input
            id={`price-${addon.id}`}
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => {
              const value = e.target.value;
              if (value === "") {
                setPrice(0);
                return;
              }
              const numValue = parseFloat(value);
              if (!isNaN(numValue)) {
                const decimalPart = value.split(".")[1];
                if (decimalPart && decimalPart.length > 2) {
                  setPrice(Math.floor(numValue * 100) / 100);
                } else {
                  setPrice(numValue);
                }
              }
            }}
            className="block w-full rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-xs text-gray-900 focus:border-gray-500 focus:ring-gray-500"
          />
        </div>

        <div className="flex items-center pt-6">
          <Checkbox
            id={`quantity-based-${addon.id}`}
            checked={quantityBased}
            onChange={(e) => setQuantityBased(e.target.checked)}
            className="h-3 w-3 cursor-pointer bg-white"
          />
          <Label
            htmlFor={`quantity-based-${addon.id}`}
            className="ml-2 cursor-pointer text-xs"
          >
            Quantity-Based Pricing
          </Label>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label
            htmlFor={`duration-hours-${addon.id}`}
            className="mb-1 block text-xs"
          >
            Duration Hours
          </Label>
          <input
            id={`duration-hours-${addon.id}`}
            type="number"
            min="0"
            value={durationHours}
            onChange={(e) => setDurationHours(parseInt(e.target.value) || 0)}
            className="block w-full rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-xs text-gray-900 focus:border-gray-500 focus:ring-gray-500"
          />
        </div>

        <div>
          <Label
            htmlFor={`duration-minutes-${addon.id}`}
            className="mb-1 block text-xs"
          >
            Duration Minutes
          </Label>
          <input
            id={`duration-minutes-${addon.id}`}
            type="number"
            min="0"
            max="59"
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 0)}
            className="block w-full rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-xs text-gray-900 focus:border-gray-500 focus:ring-gray-500"
          />
        </div>
      </div>

      <div>
        <Label className="mb-1 block text-xs">Associated Services</Label>
        <div className="[&_button]:!bg-white [&_button:hover]:!bg-gray-100">
          <MultiSelectDropdown
            options={addonOptions.services}
            selected={selectedServices}
            onChange={setSelectedServices}
            placeholder="Select Services"
            modalTitle="Select Services"
          />
        </div>
      </div>

      <div className="rounded-lg border border-gray-300 bg-white p-3">
        <Label className="mb-2 block text-xs font-medium">
          Recurring Policy
        </Label>
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <Radio
              id={`every-booking-${addon.id}`}
              name={`recurring-policy-${addon.id}`}
              value="every_booking"
              checked={recurringPolicy === "every_booking"}
              onChange={(e) =>
                setRecurringPolicy(e.target.value as RecurringPolicy)
              }
              className="mt-1 cursor-pointer bg-white"
            />
            <div>
              <Label
                htmlFor={`every-booking-${addon.id}`}
                className="cursor-pointer text-xs font-medium text-gray-900"
              >
                Every Booking
              </Label>
              <p className="text-xs text-gray-500">
                Applies to every recurring booking
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Radio
              id={`first-booking-${addon.id}`}
              name={`recurring-policy-${addon.id}`}
              value="first_booking_only"
              checked={recurringPolicy === "first_booking_only"}
              onChange={(e) =>
                setRecurringPolicy(e.target.value as RecurringPolicy)
              }
              className="mt-1 cursor-pointer bg-white"
            />
            <div>
              <Label
                htmlFor={`first-booking-${addon.id}`}
                className="cursor-pointer text-xs font-medium text-gray-900"
              >
                First Booking Only
              </Label>
              <p className="text-xs text-gray-500">
                Applies only to the first booking
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center">
          <Checkbox
            id={`exclude-frequency-${addon.id}`}
            checked={excludeFrequency}
            onChange={(e) => setExcludeFrequency(e.target.checked)}
            className="h-3 w-3 cursor-pointer bg-white"
          />
          <Label
            htmlFor={`exclude-frequency-${addon.id}`}
            className="ml-2 cursor-pointer text-xs"
          >
            Exclude from Frequency Discounts
          </Label>
        </div>

        <div className="flex items-center">
          <Checkbox
            id={`exclude-discount-${addon.id}`}
            checked={excludeDiscountCode}
            onChange={(e) => setExcludeDiscountCode(e.target.checked)}
            className="h-3 w-3 cursor-pointer bg-white"
          />
          <Label
            htmlFor={`exclude-discount-${addon.id}`}
            className="ml-2 cursor-pointer text-xs"
          >
            Exclude from Discount Codes
          </Label>
        </div>
      </div>

      <div className="flex flex-col justify-end gap-2 border-t border-gray-200 pt-3 sm:flex-row">
        {addon.status && (
          <Button
            type="button"
            onClick={() => {
              const newStatus = status === "active" ? "archived" : "active";
              setStatus(newStatus);
              // Immediately save with the new status
              onSave({
                name: name.trim(),
                description: description.trim(),
                icon: getCurrentIcon(),
                icon_type: getCurrentIconType(),
                status: newStatus, // Use the new status
                price,
                quantity_based: quantityBased,
                duration_hours: durationHours,
                duration_minutes: durationMinutes,
                services: selectedServices,
                recurring_policy: recurringPolicy,
                exclude_frequency: excludeFrequency,
                exclude_discount_code: excludeDiscountCode,
              });
            }}
            size="xs"
            className={`order-first w-full cursor-pointer sm:order-none sm:w-20 ${
              status === "active"
                ? "bg-orange-500 text-white hover:bg-orange-600 focus:ring-orange-300"
                : "bg-green-500 text-white hover:bg-green-600 focus:ring-green-300"
            }`}
          >
            {status === "active" ? "Archive" : "Activate"}
          </Button>
        )}
        <Button
          color="light"
          onClick={onCancel}
          size="xs"
          className="w-full cursor-pointer sm:w-20"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          color="gray"
          size="xs"
          className="w-full cursor-pointer sm:w-20"
          disabled={!name.trim() || price < 0}
        >
          Save
        </Button>
      </div>
    </form>
  );
};

export default AddonEditForm;
