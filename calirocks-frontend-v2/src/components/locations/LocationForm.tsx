// src/components/locations/LocationForm.tsx
import React, { useActionState, useRef, useEffect, useState } from "react";
import { Alert, Label, Checkbox, Card, Button } from "flowbite-react";
import { HiExclamationCircle, HiCheckCircle, HiUpload, HiOutlineLocationMarker} from "react-icons/hi";
import { Link } from "react-router-dom";
import { Location, LocationStatus } from "../../types/location";
import { useLocations } from "../../hooks/Locations/useLocations";
import { usePostalCodeValidation } from "../../hooks/Locations/usePostalCodeValidation";
import {
  TextInput,
} from "../ui/InputsBundle";

interface LocationFormProps {
  location?: Location;
  onSuccess: (locationData: any) => void;
  onCancel: () => void;
}

interface ActionState {
  success: boolean;
  message: string | null;
  data: any;
  error: string | null;
}

const LocationForm: React.FC<LocationFormProps> = ({
  location,
  onSuccess,
  onCancel,
}) => {
  const formRef = useRef<HTMLFormElement>(null);
  const hasCalledOnSuccess = useRef(false);
  const isEditing = !!location;
  const { addLocation, updateLocation, loading } = useLocations();

  // ===== Match Frequency input styling =====
  const textareaBase =
    "block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 " +
    "font-mono text-xs sm:text-sm text-gray-900 " +
    "focus:border-gray-500 focus:ring-gray-500";

  // form states
  const [locationStatus, setLocationStatus] = useState<LocationStatus>(
    location?.status || "active",
  );
  const [isDefault, setIsDefault] = useState<boolean>(
    location?.is_default || false,
  );
  const [processingFile, setProcessingFile] = useState(false);

  // postal code validation from hook
  const {
    postalCodesInput,
    hasDuplicates,
    duplicateError,
    validCodesCount,
    setPostalCodesInput,
    handlePostalCodeChange,
    handleKeyDown,
    getValidCodes,
    resetValidation,
  } = usePostalCodeValidation(
    location?.postal_codes?.join(", ") || "",
    location?.id,
  );

  const locationAction = async (
    _prevState: ActionState,
    formData: FormData,
  ): Promise<ActionState> => {
    try {
      if (hasDuplicates) {
        throw new Error("Please remove duplicate postal codes before saving");
      }

      const data = Object.fromEntries(formData);
      const postalCodes = getValidCodes();

      if (postalCodes.length === 0) {
        throw new Error("At least one valid postal code is required");
      }

      const locationData = {
        name: data.name,
        postal_codes: postalCodes,
        status: locationStatus,
        is_default: (data as any).is_default === "on",
      };

      const result = isEditing
        ? await updateLocation(location!.id, locationData)
        : await addLocation(locationData);

      return {
        success: true,
        message: `Location ${isEditing ? "updated" : "created"} successfully!`,
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

  const [state, dispatch, isPending] = useActionState(locationAction, {
    success: false,
    message: null,
    data: null,
    error: null,
  });

  useEffect(() => {
    if (state.success && state.data && !hasCalledOnSuccess.current) {
      hasCalledOnSuccess.current = true;
      onSuccess(state.data);
      if (!isEditing) {
        formRef.current?.reset();
        resetValidation();
        setLocationStatus("active");
        setIsDefault(false);
      }
    }
  }, [state.success, state.data]); // eslint-disable-line

  // handle immediate status toggle
  const handleStatusToggle = async () => {
    if (!isEditing || !location) return;

    try {
      const postalCodes = getValidCodes();
      if (postalCodes.length === 0) {
        alert("At least one valid postal code is required");
        return;
      }

      const nameValue = formRef.current?.elements.namedItem(
        "name",
      ) as HTMLInputElement;
      if (!nameValue?.value.trim()) {
        alert("Location name is required");
        return;
      }

      const newStatus = locationStatus === "active" ? "archived" : "active";

      const result = await updateLocation(location.id, {
        name: nameValue.value.trim(),
        postal_codes: postalCodes,
        status: newStatus,
        is_default: isDefault,
      });

      setLocationStatus(newStatus);
      onSuccess(result);
    } catch (error) {
      console.error("Failed to toggle status:", error);
      alert("Failed to update status. Please try again.");
    }
  };

  // handles file import
  const handleFileImport = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    const isValidType = fileName.endsWith(".txt") || fileName.endsWith(".csv");

    if (!isValidType) {
      alert("Please select a .txt or .csv file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }

    setProcessingFile(true);

    try {
      const content = await file.text();
      let extractedCodes: string[] = [];

      if (fileName.endsWith(".csv")) {
        const lines = content.split(/\n|\r\n?/);
        lines.forEach((line) => {
          const cells = line
            .split(",")
            .map((cell) => cell.trim().replace(/"/g, ""));
          extractedCodes.push(...cells.filter((cell) => /^\d{5}$/.test(cell)));
        });
      } else {
        extractedCodes = content
          .split(/[\n\r,;\t\s]+/)
          .map((code) => code.trim())
          .filter((code) => /^\d{5}$/.test(code));
      }

      const uniqueCodes = [...new Set(extractedCodes)].sort();

      if (uniqueCodes.length === 0) {
        alert("No valid 5-digit postal codes found in the file");
      } else {
        const currentCodes = getValidCodes();
        const allCodes = [...new Set([...currentCodes, ...uniqueCodes])].sort();
        setPostalCodesInput(allCodes.join(", "));
        alert(`Successfully imported ${uniqueCodes.length} postal codes`);
      }
    } catch (error) {
      console.error("Error reading file:", error);
      alert("Error reading file. Please check the file format and try again.");
    }

    setProcessingFile(false);
    event.target.value = "";
  };

  const pathPrefix = window.location.pathname.split("/")[1];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* breadcrumb */}
      <nav className="flex items-center text-gray-700" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <Link
              to={`/${pathPrefix}/locations`}
              className="inline-flex items-center text-xs font-medium text-gray-700 hover:text-gray-600 sm:text-sm"
            >
              Locations
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
                {isEditing ? "Edit Location" : "New Location"}
              </span>
            </div>
          </li>
        </ol>
      </nav>

      {/* header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="relative inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-black sm:h-12 sm:w-12">
              <HiOutlineLocationMarker  className="h-6 w-6 text-white"/>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 sm:text-2xl lg:text-3xl">
              {isEditing ? "Edit Location" : "New Location"}
            </h1>
            <p className="text-xs text-gray-500 sm:text-sm">
              {isEditing
                ? "Update location details and postal codes"
                : "Create a new service location"}
            </p>
          </div>
        </div>
      </div>

      <form
        ref={formRef}
        action={dispatch}
        className="space-y-4 sm:space-y-6"
        onSubmit={(e) => {
          if (isPending || loading) {
            e.preventDefault();
          }
        }}
      >
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

        {hasDuplicates && (
          <Alert color="failure" icon={HiExclamationCircle}>
            <span className="text-xs font-medium sm:text-sm">
              Duplicate postal codes!{" "}
            </span>
            <span className="text-xs sm:text-sm">{duplicateError}</span>
          </Alert>
        )}

        {/* basic info */}
        <Card className="bg-gray-50">
          <div className="mb-3 flex items-center gap-2 sm:mb-4 sm:gap-3">
            <h3 className="text-base font-semibold text-gray-900 sm:text-lg">
              Basic Information
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
            <div className="lg:col-span-2">
              <Label
                htmlFor="name"
                className="mb-1 block text-xs sm:mb-2 sm:text-sm"
              >
                Location Name
              </Label>
              <TextInput
                id="name"
                name="name"
                type="text"
                placeholder="e.g., Downtown, North Side, Business District"
                defaultValue={location?.name || ""}
                required
                maxLength={40}
              />
            </div>
          </div>
        </Card>

        {/* postal codes */}
        <Card className="bg-gray-50">
          <div className="mb-3 flex items-center gap-2 sm:mb-4 sm:gap-3">
            <h3 className="text-base font-semibold text-gray-900 sm:text-lg">
              Postal Codes ({validCodesCount})
            </h3>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <div>
              <Label
                htmlFor="postal_codes"
                className="mb-1 block text-xs sm:mb-2 sm:text-sm"
              >
                Postal Codes
              </Label>
              <textarea
                id="postal_codes"
                name="postal_codes"
                rows={6}
                placeholder="Enter 5-digit postal codes (e.g., 12345, 12346, 12347)"
                value={postalCodesInput}
                onChange={handlePostalCodeChange}
                onKeyDown={handleKeyDown}
                required
                className={
                  textareaBase +
                  (hasDuplicates
                    ? " border-red-300 focus:border-red-500 focus:ring-red-500"
                    : "")
                }
              />
              <p className="mt-1 text-xs text-gray-500">
                Type 5-digit postal codes separated by commas or press Enter.
                Spaces are not allowed.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div className="text-xs text-gray-600">
                <span className="font-medium">Valid codes:</span>{" "}
                {validCodesCount}
                {hasDuplicates && (
                  <span className="ml-2 font-medium text-red-600">
                    ⚠ Duplicates detected
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Label
                  htmlFor="file-upload"
                  className="inline-flex cursor-pointer items-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-center text-xs font-medium text-gray-900 hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 focus:outline-none"
                >
                  <HiUpload className="mr-1 h-3 w-3" />
                  {processingFile ? "Processing..." : "Import File"}
                </Label>
                <TextInput
                  id="file-upload"
                  type="file"
                  accept=".txt,.csv"
                  onChange={handleFileImport}
                  disabled={processingFile}
                  className="hidden"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* settings */}
        <Card className="bg-gray-50">
          <div className="mb-3 flex items-center gap-2 sm:mb-4 sm:gap-3">
            <h3 className="text-base font-semibold text-gray-900 sm:text-lg">
              Location Settings
            </h3>
          </div>

          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-start gap-2 rounded-lg border border-gray-300 bg-white p-2 sm:gap-3 sm:p-3">
              <Checkbox
                color="gray"
                id="is_default"
                name="is_default"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="mt-1 h-3 w-3 cursor-pointer sm:h-4 sm:w-4"
              />
              <div>
                <Label
                  htmlFor="is_default"
                  className="cursor-pointer text-xs font-medium sm:text-sm"
                >
                  Set as Default Location
                </Label>
                <p className="mt-1 text-xs text-gray-500">
                  This will be the primary service location for new bookings
                </p>
              </div>
            </div>
          </div>
        </Card>

        <div className="flex flex-col gap-3 pt-0 sm:flex-row sm:justify-end sm:gap-4 sm:pt-1">
          {isEditing && (
            <Button
              type="button"
              onClick={handleStatusToggle}
              disabled={isPending || loading || processingFile}
              className={`order-first w-full cursor-pointer sm:order-none sm:w-32 ${
                locationStatus === "active"
                  ? "bg-orange-500 text-white hover:bg-orange-600 focus:ring-orange-300"
                  : "bg-green-500 text-white hover:bg-green-600 focus:ring-green-300"
              }`}
            >
              {locationStatus === "active" ? "Archive" : "Activate"}
            </Button>
          )}
          <Button
            className="cursor-pointer"
            type="button"
            color="light"
            onClick={onCancel}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button className="cursor-pointer" type="submit" color="gray" disabled={isPending}>
            {isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default LocationForm;
