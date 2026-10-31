import React, { useActionState, useRef, useEffect, useState } from "react";
import { Alert, Label, Checkbox, Card } from "flowbite-react";
import { HiExclamationCircle, HiCheckCircle } from "react-icons/hi";
import { Link } from "react-router-dom";
import {
  Service,
  PricingType,
  AdvancedPricing,
  DayPricing,
  ServiceStatus,
} from "../../types/service";
import { useServices } from "../../hooks/useServices";
import FormActions from "../ui/FormActions";
import MultiSelectDropdown from "../ui/MultiSelectDropdown";
import PricingSection from "./PricingSection";
import { useServiceSettings } from "../../hooks/useServiceSettings";

interface ServiceFormProps {
  service?: Service;
  onSuccess: (serviceData: any) => void;
  onCancel: () => void;
}

interface ActionState {
  success: boolean;
  message: string | null;
  data: any;
  error: string | null;
}

const WEEKDAYS = [
  { key: "sunday", label: "Sun" },
  { key: "monday", label: "Mon" },
  { key: "tuesday", label: "Tue" },
  { key: "wednesday", label: "Wed" },
  { key: "thursday", label: "Thu" },
  { key: "friday", label: "Fri" },
  { key: "saturday", label: "Sat" },
];

const DEFAULT_DAY_PRICING: DayPricing = {
  enabled: false,
  hasBeforeShift: false,
  hasOffShift: false,
  beforeShift: {
    startTime: "06:00",
    endTime: "08:00",
    rate: 0,
  },
  onShift: {
    startTime: "08:00",
    endTime: "17:00",
    rate: 0,
  },
  offShift: {
    startTime: "17:00",
    endTime: "22:00",
    rate: 0,
  },
};

const ServiceForm: React.FC<ServiceFormProps> = ({
  service,
  onSuccess,
  onCancel,
}) => {
  const formRef = useRef<HTMLFormElement>(null);
  const isEditing = !!service;
  const { addService, updateService, serviceOptions, loading } = useServices();
  const { settings: serviceSettings } = useServiceSettings();

  // form state
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus>(
    service?.status || "active",
  );
  const [selectedCategories, setSelectedCategories] = useState<number[]>(
    service?.categories?.map((c) => c.id) || [],
  );
  const [selectedLocations, setSelectedLocations] = useState<number[]>(
    service?.locations?.map((l) => l.id) || [],
  );
  const [selectedProviders, setSelectedProviders] = useState<number[]>(
    service?.providers?.map((p) => p.id) || [],
  );
  const [selectedAddons, setSelectedAddons] = useState<number[]>(
    service?.addons?.map((a) => a.id) || [],
  );
  const [selectedVariables, setSelectedVariables] = useState<number[]>(() => {
    const ids =
      service?.variables?.map((v) => {
        const id = typeof v.id === "string" ? parseInt(v.id) : v.id;
        return id;
      }) || [];
    console.log("Initial selectedVariables:", ids);
    return ids;
  });
  const [selectedFrequencies, setSelectedFrequencies] = useState<number[]>(
    () => {
      if (service?.frequencies && Array.isArray(service.frequencies)) {
        const freqIds = service.frequencies.map((f: any) => {
          const id = typeof f.id === "string" ? parseInt(f.id) : f.id;
          return id;
        });
        console.log(
          "Initial selectedFrequencies:",
          freqIds,
          "from service:",
          service.frequencies,
        );
        return freqIds;
      }
      return [];
    },
  );

  // pricing state
  const [pricingType, setPricingType] = useState<PricingType>(
    service?.pricing_type || "flat",
  );
  const [isAdvancedPricing, setIsAdvancedPricing] = useState<boolean>(
    service?.is_advanced_pricing || false,
  );
  const [mainPrice, setMainPrice] = useState<number>(
    service?.price_amount || 0,
  );
  const [advancedPricing, setAdvancedPricing] = useState<AdvancedPricing>(
    () => {
      if (service?.advanced_pricing) {
        return service.advanced_pricing;
      }
      const initialPricing: AdvancedPricing = {};
      WEEKDAYS.forEach((day) => {
        initialPricing[day.key] = { ...DEFAULT_DAY_PRICING };
      });
      return initialPricing;
    },
  );

  // New state for flat rate duration
  const [durationHours, setDurationHours] = useState<number>(
    service?.duration_minutes ? Math.floor(service.duration_minutes / 60) : 0,
  );
  const [durationMinutes, setDurationMinutes] = useState<number>(
    service?.duration_minutes ? service.duration_minutes % 60 : 0,
  );

  // New state for hourly rate
  const [minServiceProviders, setMinServiceProviders] = useState<number>(
    service?.min_service_providers || 1,
  );
  const [maxServiceProviders, setMaxServiceProviders] = useState<number>(
    service?.max_service_providers || 1,
  );
  const [allow30MinIncrements, setAllow30MinIncrements] = useState<boolean>(
    service?.allow_30min_increments || false,
  );
  const [allow15MinIncrements, setAllow15MinIncrements] = useState<boolean>(
    service?.allow_15min_increments || false,
  );
  const [hourlyMinDuration, setHourlyMinDuration] = useState<string>(
    service?.hourly_min_duration || "1 hr",
  );
  const [hourlyMaxDuration, setHourlyMaxDuration] = useState<string>(
    service?.hourly_max_duration || "1 hr",
  );

  // Same Day Fee state
  const [hasSameDayFee, setHasSameDayFee] = useState<boolean>(
    service?.has_same_day_fee ?? false,
  );

  const [sameDayFeeAmount, setSameDayFeeAmount] = useState<number>(() => {
    if (isEditing) {
      return service?.same_day_fee_amount ?? 0;
    }
    // NEW service - start at 0, will be set by useEffect
    return 0;
  });

  const [cutoffTime, _setCutoffTime] = useState<string>(
    service?.same_day_cutoff_time ?? "17:00",
  );

  const [cutoffDay, _setCutoffDay] = useState<"dayBefore" | "dayOf">(
    service?.same_day_cutoff_day ?? "dayBefore",
  );

  const [isPending, setIsPending] = useState(false);

  const serviceAction = async (
    _prevState: ActionState,
    formData: FormData,
  ): Promise<ActionState> => {
    try {
      const data = Object.fromEntries(formData);

      // Calculate total duration in minutes for flat rate
      const totalDurationMinutes =
        pricingType === "flat"
          ? durationHours * 60 + durationMinutes
          : undefined;

      const serviceData = {
        name: data.name,
        pricing_type: pricingType,
        is_advanced_pricing: isAdvancedPricing,
        price_amount: mainPrice,
        duration_minutes: totalDurationMinutes,
        categories: selectedCategories,
        locations: selectedLocations,
        providers: selectedProviders,
        addons: selectedAddons,
        variables: selectedVariables,
        frequencies: selectedFrequencies,
        advanced_pricing: isAdvancedPricing ? advancedPricing : undefined,
        staff_only: data.staff_only === "on",
        exclude_frequency: data.exclude_frequency === "on",
        exclude_discount_code: data.exclude_discount_code === "on",
        min_service_providers:
          pricingType === "hourly" ? minServiceProviders : undefined,
        max_service_providers:
          pricingType === "hourly" ? maxServiceProviders : undefined,
        allow_30min_increments:
          pricingType === "hourly" ? allow30MinIncrements : undefined,
        allow_15min_increments:
          pricingType === "hourly" ? allow15MinIncrements : undefined,
        hourly_min_duration:
          pricingType === "hourly" ? hourlyMinDuration : undefined,
        hourly_max_duration:
          pricingType === "hourly" ? hourlyMaxDuration : undefined,
        has_same_day_fee: hasSameDayFee,
        same_day_fee_amount: hasSameDayFee ? sameDayFeeAmount : undefined,
        same_day_cutoff_day: hasSameDayFee ? cutoffDay : undefined,
        same_day_cutoff_time: hasSameDayFee ? cutoffTime : undefined,
        status: serviceStatus,
      };

      const result = isEditing
        ? await updateService(service!.id, serviceData)
        : await addService(serviceData);

      return {
        success: true,
        message: `Service ${isEditing ? "updated" : "created"} successfully!`,
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

  const [state, _dispatch] = useActionState(serviceAction, {
    success: false,
    message: null,
    data: null,
    error: null,
  });

  useEffect(() => {
    if (service?.frequencies && Array.isArray(service.frequencies)) {
      const freqIds = service.frequencies.map((f: any) => {
        const id = typeof f.id === "string" ? parseInt(f.id) : f.id;
        return id;
      });
      console.log("Updated selectedFrequencies from service:", freqIds);
      setSelectedFrequencies(freqIds);
    }
  }, [service?.id]);

  // Initialize sameDayFeeAmount with settings when NOT editing
  useEffect(() => {
    if (!isEditing && serviceSettings && hasSameDayFee) {
      // Calculate: mainPrice + settings fee
      const newAmount =
        mainPrice + parseFloat(serviceSettings.same_day_fee || 0);
      setSameDayFeeAmount(newAmount);
    }
  }, [isEditing, serviceSettings?.same_day_fee, mainPrice, hasSameDayFee]); // Add mainPrice to dependencies

  // Handle immediate status toggle
  const handleStatusToggle = async () => {
    if (!isEditing || !service) return;

    try {
      const nameValue = formRef.current?.elements.namedItem(
        "name",
      ) as HTMLInputElement;
      if (!nameValue?.value.trim()) {
        alert("Service name is required");
        return;
      }

      const newStatus: ServiceStatus =
        serviceStatus === "active" ? "archived" : "active";

      setIsPending(true);

      const totalDurationMinutes =
        pricingType === "flat"
          ? durationHours * 60 + durationMinutes
          : undefined;

      const serviceData = {
        name: nameValue.value.trim(),
        pricing_type: pricingType,
        is_advanced_pricing: isAdvancedPricing,
        price_amount: mainPrice,
        duration_minutes: totalDurationMinutes,
        categories: selectedCategories,
        locations: selectedLocations,
        providers: selectedProviders,
        addons: selectedAddons,
        variables: selectedVariables,
        frequencies: selectedFrequencies,
        advanced_pricing: isAdvancedPricing ? advancedPricing : undefined,
        staff_only:
          (
            formRef.current?.elements.namedItem(
              "staff_only",
            ) as HTMLInputElement
          )?.checked || false,
        exclude_frequency:
          (
            formRef.current?.elements.namedItem(
              "exclude_frequency",
            ) as HTMLInputElement
          )?.checked || false,
        exclude_discount_code:
          (
            formRef.current?.elements.namedItem(
              "exclude_discount_code",
            ) as HTMLInputElement
          )?.checked || false,
        min_service_providers:
          pricingType === "hourly" ? minServiceProviders : undefined,
        max_service_providers:
          pricingType === "hourly" ? maxServiceProviders : undefined,
        allow_30min_increments:
          pricingType === "hourly" ? allow30MinIncrements : undefined,
        allow_15min_increments:
          pricingType === "hourly" ? allow15MinIncrements : undefined,
        hourly_min_duration:
          pricingType === "hourly" ? hourlyMinDuration : undefined,
        hourly_max_duration:
          pricingType === "hourly" ? hourlyMaxDuration : undefined,
        has_same_day_fee: hasSameDayFee,
        same_day_fee_amount: hasSameDayFee ? sameDayFeeAmount : undefined,
        same_day_cutoff_day: hasSameDayFee ? cutoffDay : undefined,
        same_day_cutoff_time: hasSameDayFee ? cutoffTime : undefined,
        status: newStatus,
      };

      console.log("Toggling status with data:", serviceData);

      // Call onSuccess which will handle the API call
      await onSuccess(serviceData);

      // Update local state only after successful API call
      setServiceStatus(newStatus);
    } catch (error) {
      console.error("Failed to toggle status:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to update status. Please try again.",
      );
    } finally {
      setIsPending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);

    try {
      const formData = new FormData(formRef.current!);
      const data = Object.fromEntries(formData);

      // Calculate total duration in minutes for flat rate
      const totalDurationMinutes =
        pricingType === "flat"
          ? durationHours * 60 + durationMinutes
          : undefined;

      const serviceData = {
        name: data.name,
        pricing_type: pricingType,
        is_advanced_pricing: isAdvancedPricing,
        price_amount: mainPrice,
        duration_minutes: totalDurationMinutes,
        categories: selectedCategories,
        locations: selectedLocations,
        providers: selectedProviders,
        addons: selectedAddons,
        variables: selectedVariables,
        frequencies: selectedFrequencies,
        advanced_pricing: isAdvancedPricing ? advancedPricing : undefined,
        staff_only: data.staff_only === "on",
        exclude_frequency: data.exclude_frequency === "on",
        exclude_discount_code: data.exclude_discount_code === "on",
        min_service_providers:
          pricingType === "hourly" ? minServiceProviders : undefined,
        max_service_providers:
          pricingType === "hourly" ? maxServiceProviders : undefined,
        allow_30min_increments:
          pricingType === "hourly" ? allow30MinIncrements : undefined,
        allow_15min_increments:
          pricingType === "hourly" ? allow15MinIncrements : undefined,
        hourly_min_duration:
          pricingType === "hourly" ? hourlyMinDuration : undefined,
        hourly_max_duration:
          pricingType === "hourly" ? hourlyMaxDuration : undefined,
        has_same_day_fee: hasSameDayFee,
        same_day_fee_amount: hasSameDayFee ? sameDayFeeAmount : undefined,
        same_day_cutoff_day: hasSameDayFee ? cutoffDay : undefined,
        same_day_cutoff_time: hasSameDayFee ? cutoffTime : undefined,
        status: serviceStatus,
      };

      // Call onSuccess which will handle the API call and navigation
      await onSuccess(serviceData);

      // Reset form only for new service
      if (!isEditing) {
        formRef.current?.reset();
        setSelectedCategories([]);
        setSelectedLocations([]);
        setSelectedProviders([]);
        setSelectedAddons([]);
        setSelectedVariables([]);
        setSelectedFrequencies([]);
        setAdvancedPricing({});
        setPricingType("flat");
        setIsAdvancedPricing(false);
        setMainPrice(0);
        setDurationHours(0);
        setDurationMinutes(0);
        setMinServiceProviders(1);
        setMaxServiceProviders(1);
        setAllow30MinIncrements(false);
        setAllow15MinIncrements(false);
        setHourlyMinDuration("1 hr");
        setHourlyMaxDuration("1 hr");
        setHasSameDayFee(false);
        setSameDayFeeAmount(0);
      }
    } catch (error) {
      console.error("Form submission error:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to save service. Please try again.",
      );
    } finally {
      setIsPending(false);
    }
  };

  const pathPrefix = window.location.pathname.split("/")[1];
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
                {isEditing ? "Edit Service" : "New Service"}
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
                strokeLinejoin="round"
                strokeWidth="2"
                d="M7.58209 8.96025 9.8136 11.1917l-1.61782 1.6178c-1.08305-.1811-2.23623.1454-3.07364.9828-1.1208 1.1208-1.32697 2.8069-.62368 4.1363.14842.2806.42122.474.73509.5213.06726.0101.1347.0133.20136.0098-.00351.0666-.00036.1341.00977.2013.04724.3139.24069.5867.52125.7351 1.32944.7033 3.01552.4971 4.13627-.6237.8375-.8374 1.1639-1.9906.9829-3.0736l4.8107-4.8108c1.0831.1811 2.2363-.1454 3.0737-.9828 1.1208-1.1208 1.3269-2.80688.6237-4.13632-.1485-.28056-.4213-.474-.7351-.52125-.0673-.01012-.1347-.01327-.2014-.00977.0035-.06666.0004-.13409-.0098-.20136-.0472-.31386-.2406-.58666-.5212-.73508-1.3294-.70329-3.0155-.49713-4.1363.62367-.8374.83741-1.1639 1.9906-.9828 3.07365l-1.7788 1.77875-2.23152-2.23148-1.41419 1.41424Zm1.31056-3.1394c-.04235-.32684-.24303-.61183-.53647-.76186l-1.98183-1.0133c-.38619-.19746-.85564-.12345-1.16234.18326l-.86321.8632c-.3067.3067-.38072.77616-.18326 1.16235l1.0133 1.98182c.15004.29345.43503.49412.76187.53647l1.1127.14418c.3076.03985.61628-.06528.8356-.28461l.86321-.8632c.21932-.21932.32446-.52801.2846-.83561l-.14417-1.1127ZM19.4448 16.4052l-3.1186-3.1187c-.7811-.781-2.0474-.781-2.8285 0l-.1719.172c-.7811.781-.7811 2.0474 0 2.8284l3.1186 3.1187c.7811.781 2.0474.781 2.8285 0l.1719-.172c.7811-.781.7811-2.0474 0-2.8284Z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 sm:text-2xl lg:text-3xl">
              {isEditing ? "Edit Service" : "New Service"}
            </h1>
            <p className="text-xs text-gray-500 sm:text-sm">
              {isEditing
                ? "Update service details and configuration"
                : "Create a new service offering"}
            </p>
          </div>
        </div>
      </div>

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="space-y-4 sm:space-y-6"
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

        {/* basic info card */}
        <Card className="bg-gray-50">
          <div className="mb-3 flex items-center gap-2 sm:mb-2 sm:gap-3">
            <h3 className="text-lg font-semibold text-gray-900">
              Service Information
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
            <div className="lg:col-span-2">
              <Label
                htmlFor="name"
                className="mt-6 mb-1 block text-xs sm:mb-2 sm:text-sm"
              >
                Service Name
              </Label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Enter Service Name"
                defaultValue={service?.name || ""}
                required
                className="block w-full rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-xs text-gray-900 focus:border-blue-500 focus:ring-blue-500 sm:px-3 sm:py-2.5 sm:text-sm"
              />
            </div>
          </div>
          {/* pricing card */}
          <PricingSection
            pricingType={pricingType}
            setPricingType={setPricingType}
            mainPrice={mainPrice}
            setMainPrice={setMainPrice}
            isAdvancedPricing={isAdvancedPricing}
            setIsAdvancedPricing={setIsAdvancedPricing}
            advancedPricing={advancedPricing}
            setAdvancedPricing={setAdvancedPricing}
            service={service}
            serviceSettings={isEditing ? null : serviceSettings}
            durationHours={durationHours}
            setDurationHours={setDurationHours}
            durationMinutes={durationMinutes}
            setDurationMinutes={setDurationMinutes}
            minServiceProviders={minServiceProviders}
            setMinServiceProviders={setMinServiceProviders}
            maxServiceProviders={maxServiceProviders}
            setMaxServiceProviders={setMaxServiceProviders}
            allow30MinIncrements={allow30MinIncrements}
            setAllow30MinIncrements={setAllow30MinIncrements}
            allow15MinIncrements={allow15MinIncrements}
            setAllow15MinIncrements={setAllow15MinIncrements}
            hourlyMinDuration={hourlyMinDuration}
            setHourlyMinDuration={setHourlyMinDuration}
            hourlyMaxDuration={hourlyMaxDuration}
            setHourlyMaxDuration={setHourlyMaxDuration}
            hasSameDayFee={hasSameDayFee}
            setHasSameDayFee={setHasSameDayFee}
            sameDayFeeAmount={sameDayFeeAmount}
            setSameDayFeeAmount={setSameDayFeeAmount}
          />

          {/* service details card */}
          {/* <div className="mb-3 flex items-center gap-2 p-1 sm:mb-2 sm:gap-3"> */}
          <Label className="p-1 text-lg font-semibold text-gray-900">
            Service Details
          </Label>
          {/* </div> */}

          <div className="grid-cols mb-3 grid gap-3 p-1 sm:gap-4 lg:grid-cols-2">
            <div>
              <Label className="mb-1 block text-xs sm:mb-2 sm:text-sm">
                Categories
              </Label>
              <MultiSelectDropdown
                options={serviceOptions.categories}
                selected={selectedCategories}
                onChange={setSelectedCategories}
                placeholder="Select Categories"
                modalTitle="Select Categories"
                className="cursor-pointer"
              />
            </div>

            <div>
              <Label className="mb-1 block text-xs sm:mb-2 sm:text-sm">
                Locations
              </Label>
              <MultiSelectDropdown
                options={serviceOptions.locations}
                selected={selectedLocations}
                onChange={setSelectedLocations}
                placeholder="Select Locations"
                modalTitle="Select Locations"
              />
            </div>

            <div>
              <Label className="mt-3 mb-1 block text-xs sm:mb-2 sm:text-sm">
                Variables
              </Label>
              <MultiSelectDropdown
                options={serviceOptions.variables}
                selected={selectedVariables}
                onChange={setSelectedVariables}
                placeholder="Select Variables"
                modalTitle="Select Variables"
                formatDisplay={(item) => `$${item.price?.toFixed(2)}`}
              />
            </div>

            <div>
              <Label className="mt-3 mb-1 block text-xs sm:mb-2 sm:text-sm">
                Add-ons
              </Label>
              <MultiSelectDropdown
                options={serviceOptions.addons}
                selected={selectedAddons}
                onChange={setSelectedAddons}
                placeholder="Select Add-ons"
                modalTitle="Select Add-ons"
                formatDisplay={(item) => `$${item.price?.toFixed(2)}`}
              />
            </div>

            <div>
              <Label className="mt-3 mb-1 block text-xs sm:mb-2 sm:text-sm">
                Frequencies
              </Label>
              <MultiSelectDropdown
                options={serviceOptions.frequencies}
                selected={selectedFrequencies}
                onChange={setSelectedFrequencies}
                placeholder="Select Frequencies"
                modalTitle="Select Frequencies"
              />
            </div>

            <div>
              <Label className="mt-3 mb-1 block text-xs sm:mb-2 sm:text-sm">
                Service Providers
              </Label>
              <MultiSelectDropdown
                options={serviceOptions.providers}
                selected={selectedProviders}
                onChange={setSelectedProviders}
                placeholder="Select Providers"
                modalTitle="Select Providers"
                selectAllByDefault={true}
                maxDisplayedBadges={8}
              />
            </div>
          </div>

          {/* settings card */}
          {/* <div className="mb-3 flex items-center gap-2 p-1 sm:mb-1 sm:gap-3"> */}
          <Label className="p-1 text-lg font-semibold text-gray-900">
            Service Settings
          </Label>
          {/* </div> */}

          <div className="space-y-2 p-1 sm:space-y-3">
            <div className="flex w-full items-start gap-2 rounded-lg border border-gray-300 bg-white p-2 sm:gap-3 sm:p-3">
              <Checkbox
                id="staff_only"
                name="staff_only"
                defaultChecked={service?.staff_only || false}
                className="mt-1 h-3 w-3 cursor-pointer sm:h-4 sm:w-4"
              />
              <div>
                <Label
                  htmlFor="staff_only"
                  className="cursor-pointer text-xs font-medium sm:text-sm"
                >
                  Staff Only
                </Label>
                <p className="mt-1 text-xs text-gray-500">
                  Only staff members can book this service
                </p>
              </div>
            </div>

            <div className="flex w-full items-start gap-2 rounded-lg border border-gray-300 bg-white p-2 sm:gap-3 sm:p-3">
              <Checkbox
                id="exclude_frequency"
                name="exclude_frequency"
                defaultChecked={service?.exclude_frequency || false}
                className="mt-1 h-3 w-3 cursor-pointer sm:h-4 sm:w-4"
              />
              <div>
                <Label
                  htmlFor="exclude_frequency"
                  className="cursor-pointer text-xs font-medium sm:text-sm"
                >
                  Exclude from Frequency Discounts
                </Label>
                <p className="mt-1 text-xs text-gray-500">
                  This service won't be eligible for frequency-based discounts
                </p>
              </div>
            </div>

            <div className="flex w-full items-start gap-2 rounded-lg border border-gray-300 bg-white p-2 sm:gap-3 sm:p-3">
              <Checkbox
                id="exclude_discount_code"
                name="exclude_discount_code"
                defaultChecked={service?.exclude_discount_code || false}
                className="mt-1 h-3 w-3 cursor-pointer sm:h-4 sm:w-4"
              />
              <div>
                <Label
                  htmlFor="exclude_discount_code"
                  className="cursor-pointer text-xs font-medium sm:text-sm"
                >
                  Exclude from Discount Codes
                </Label>
                <p className="mt-1 text-xs text-gray-500">
                  Discount codes cannot be applied to this service
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* cancel & save buttons */}
        <div className="pt-0 sm:pt-1">
          <input type="hidden" name="status" value={serviceStatus} />
          <FormActions
            onCancel={onCancel}
            isPending={isPending || loading}
            isEditing={isEditing}
            submitText="Save"
            editText="Save"
            showStatusToggle={isEditing}
            status={serviceStatus}
            onStatusToggle={handleStatusToggle}
          />
        </div>
      </form>
    </div>
  );
};

export default ServiceForm;
