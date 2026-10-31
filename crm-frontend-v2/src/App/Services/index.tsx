import React, { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import AppDataTable from "../../components/ui/AppDataTable";
import { useServices } from "../../hooks/useServices";
import { useFrequencies } from "../../hooks/useFrequencies";
import { Service } from "../../types/service";
import { Button, Badge } from "flowbite-react";
import { HiCog } from "react-icons/hi";
import usePrivateService from "../../hooks/Auth/usePrivateService";

const Services: React.FC = () => {
  const navigate = useNavigate();
  const { services, loading: servicesLoading } = useServices();
  const { frequencies, loading: frequenciesLoading } = useFrequencies();
  const privateService = usePrivateService();
  const [displayServices, setDisplayServices] = useState<Service[]>([]);
  const [orderLoaded, setOrderLoaded] = useState(false);
  const loadedRef = useRef(false);

  // Load saved order from database only once when services first load
  useEffect(() => {
    if (services.length === 0 || loadedRef.current) return;

    loadedRef.current = true;

    const loadSavedOrder = async () => {
      try {
        console.log("Loading saved order from DB...");
        const res = await privateService.get(`/roworders?entityType=services`);
        const savedOrders = res.data.data || [];
        
        console.log("Saved orders from DB:", savedOrders);

        if (savedOrders.length > 0) {
          // Create map of entityId -> displayOrder
          const orderMap: { [key: number]: number } = {};
          savedOrders.forEach((order: any) => {
            orderMap[order.entityId] = order.displayOrder;
          });

          // Sort services by saved order
          const sortedServices = [...services].sort((a, b) => {
            const orderA = orderMap[a.id] ?? 999999;
            const orderB = orderMap[b.id] ?? 999999;
            return orderA - orderB;
          });

          console.log("Sorted by DB order:", sortedServices.map(s => ({ id: s.id, name: s.name })));
          setDisplayServices(sortedServices);
        } else {
          console.log("No saved orders, using default");
          setDisplayServices(services);
        }
        setOrderLoaded(true);
      } catch (error) {
        console.error("Error loading saved order:", error);
        setDisplayServices(services);
        setOrderLoaded(true);
      }
    };

    loadSavedOrder();
  }, [services.length]); // Only depend on length to avoid infinite loops

  const servicesWithFrequencies = useMemo(() => {
    return displayServices.map((service: Service) => ({
      ...service,
      frequencies: (service.frequencies || [])
        .map((f: any) => typeof f === 'number' ? frequencies.find(freq => freq.id === f && freq.status === 'active') : f)
        .filter((f: any) => f !== undefined && f !== null)
    }));
  }, [displayServices, frequencies]);

  const loading = servicesLoading || frequenciesLoading || !orderLoaded;

  const handleNewService = () => {
    const pathPrefix = window.location.pathname.split('/')[1];
    navigate(`/${pathPrefix}/services/new`);
  };

  const handleEditService = (service: Service) => {
    const pathPrefix = window.location.pathname.split('/')[1];
    navigate(`/${pathPrefix}/services/edit/${service.id}`);
  };

  const handleReorder = (reorderedData: any[]) => {
    console.log("Reordering:", reorderedData.map(d => d.id));
    setDisplayServices([...reorderedData]);

    // Save to backend
    privateService.post(`/roworders/batch`, {
      entityType: "services",
      orders: reorderedData.map((item, index) => ({
        entityId: item.id,
        displayOrder: index,
      })),
    }).then(res => {
      console.log("Saved to backend:", res.data);
    }).catch(err => {
      console.error("Error saving:", err);
    });
  };

  const formatPricing = (service: Service) => {
    if (service.is_advanced_pricing && service.advanced_pricing) {
      const enabledDays = Object.values(service.advanced_pricing).filter(
        (day) => day.enabled,
      );
      if (enabledDays.length > 0) {
        const rates = enabledDays
          .flatMap((day) => [
            day.onShift.rate,
            ...(day.hasOffShift && day.offShift ? [day.offShift.rate] : []),
          ])
          .filter((rate) => rate > 0);

        if (rates.length > 0) {
          const min = Math.min(...rates);
          const max = Math.max(...rates);
          return min === max
            ? `$${min.toFixed(2)}`
            : `$${min.toFixed(2)} - $${max.toFixed(2)}`;
        }
      }
      return "Advanced Pricing";
    } else if (service.pricing_type === "hourly") {
      return `$${service.price_amount.toFixed(2)}/hr`;
    } else {
      return `$${service.price_amount.toFixed(2)}`;
    }
  };

  const columns = useMemo(
  () => [
    {
      name: "Service",
      selector: (row: Service) => row.name,
      sortable: true,
      width: "200px",
      cell: (row: Service) => (
        <div className="flex items-center">
          <div>
            <div className="text-sm font-semibold">
              {row.name}
            </div>
          </div>
        </div>
      ),
    },
    {
      name: "Pricing",
      selector: (row: Service) => row.price_amount,
      sortable: true,
      width: "160px",
      cell: (row: Service) => (
        <div className="text-sm font-medium">
          {formatPricing(row)}
        </div>
      ),
    },
    {
      name: "Details",
      width: "300px",
      cell: (row: Service) => (
        <div className="text-sm">
          <div className="mb-1">
            <span className="font-medium">Type:</span>{" "}
            {row.pricing_type.charAt(0).toUpperCase() +
              row.pricing_type.slice(1)}
            {row.staff_only && (
              <span className="ml-1 text-red-600">• Staff Only</span>
            )}
            {row.duration_minutes && (
              <span className="ml-1 text-blue-600">
                • {Math.floor(row.duration_minutes / 60)}h{" "}
                {row.duration_minutes % 60}m
              </span>
            )}
          </div>

          {row.addons && row.addons.length > 0 && (
            <div className="mb-1">
              <span className="font-medium">Add-ons:</span>{" "}
              {row.addons.map((a) => a.name).join(", ")}
            </div>
          )}

          {row.variables && row.variables.length > 0 && (
            <div className="mb-1">
              <span className="font-medium">Variables:</span>{" "}
              {row.variables.map((v) => v.name).join(", ")}
            </div>
          )}

          {row.categories && row.categories.length > 0 && (
            <div className="mb-1">
              <span className="font-medium">Categories:</span>{" "}
              {row.categories.map((c) => c.name).join(", ")}
            </div>
          )}

          {row.frequencies && row.frequencies.length > 0 && (
            <div className="mb-1">
              <span className="font-medium">Frequencies:</span>{" "}
              {row.frequencies.map((f) => f.name).join(", ")}
            </div>
          )}
        </div>
      ),
    },
    {
      name: "Locations",
      width: "180px",
      cell: (row: Service) => (
        <div className="text-xs">
          {row.locations && row.locations.length > 0 ? (
            <div className="space-y-0.5">
              {row.locations.map((location, idx) => (
                <div key={idx} className="text-sm">
                  {location.name}
                </div>
              ))}
            </div>
          ) : (
            <span style={{ opacity: 0.5 }}>—</span>
          )}
        </div>
      ),
    },
  ],
  [],
);

  const filterOptions = [
    { value: "all", label: "All" },
    { value: "active", label: "Active" },
    { value: "archived", label: "Archived" },
  ];

  const sortOptions = [
    {
      value: "custom",
      label: "Custom",
      sortFn: (_a: Service, _b: Service) => {
        // This will use the order from displayServices (which comes from DB)
        return 0; // Don't sort, keep the order as-is
      },
    },
    {
      value: "name",
      label: "Name",
      sortFn: (a: Service, b: Service) => a.name.localeCompare(b.name),
    },
    {
      value: "price",
      label: "Price",
      sortFn: (a: Service, b: Service) => a.price_amount - b.price_amount,
    },
    {
      value: "newest",
      label: "Newest",
      sortFn: (a: Service, b: Service) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    }
  ];

  if (loading) {
    return (
      <div className="px-4 pb-5 sm:px-5 animate-pulse">
        <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-gray-300 rounded-full"></div>
            <div className="space-y-2">
              <div className="h-8 bg-gray-200 rounded w-48"></div>
              <div className="h-4 bg-gray-200 rounded w-40"></div>
            </div>
          </div>
          <div className="h-10 bg-gray-200 rounded w-32"></div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 space-y-3">
            <div className="h-10 bg-gray-100 rounded"></div>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 bg-gray-50 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pb-5 sm:px-5">
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <div className="relative inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-black">
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
          <div className="font-medium">
            <span className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Services ({servicesWithFrequencies.length})
            </span>
            <div className="text-sm text-gray-500">
              Manage Services
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <Button
            color="gray"
            onClick={() => {
              const pathPrefix = window.location.pathname.split('/')[1];
              navigate(`/${pathPrefix}/services/settings`);
            }}
            className="w-full cursor-pointer sm:w-auto flex items-center justify-center gap-2"
          >
            <HiCog className="w-4 h-4" />
            Settings
          </Button>
          <Button
            color="gray"
            onClick={handleNewService}
            className="w-full cursor-pointer sm:w-auto"
          >
            Add New Service
          </Button>
        </div>
      </div>

      <AppDataTable
        data={servicesWithFrequencies}
        columns={columns}
        enableInlineEdit={false}
        onEditClick={handleEditService}
        showEditButton={true}
        searchPlaceholder="Search Services..."
        searchKeys={["name", "categories.name", "locations"]}
        filterOptions={filterOptions}
        filterKey="status"
        defaultFilter="active"
        sortOptions={sortOptions}
        defaultSort="custom"
        paginationOptions={[10, 20, 50, 100]}
        defaultPerPage={20}
        mobileCard={{
          titleField: "name",
          subtitleRender: (service) => formatPricing(service),
          statusField: "status",
          fields: [
            {
              key: "pricing_type",
              label: "Type",
              render: (value) =>
                value?.charAt(0).toUpperCase() + value?.slice(1),
            },
            {
              key: "staff_only",
              label: "Access",
              type: "badge",
              color: "red",
              render: (value) =>
                value ? (
                  <Badge color="red" size="xs">
                    Staff Only
                  </Badge>
                ) : null,
            },
            { key: "duration_minutes", label: "Duration", type: "duration" },
            {
              key: "categories",
              label: "Categories",
              type: "badges",
              color: "gray",
            },
            {
              key: "locations",
              label: "Locations",
              type: "badges",
              color: "blue",
            },
            {
              key: "addons",
              label: "Add-ons",
              type: "badges",
              color: "purple",
            },
            {
              key: "variables",
              label: "Variables",
              type: "badges",
              color: "yellow",
            },
            {
              key: "frequencies",
              label: "Frequencies",
              type: "badges",
              color: "green",
            },
          ],
          actions: [
            {
              label: "Edit",
              color: "blue",
              onClick: handleEditService,
            },
          ],
        }}
        enableDragDrop={true}
        entityType="services"
        onReorder={handleReorder}
      />
    </div>
  );
};

export default Services;