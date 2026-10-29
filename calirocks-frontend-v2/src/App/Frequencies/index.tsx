import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppDataTable from "../../components/ui/AppDataTable";
import { useFrequencies } from "../../hooks/useFrequencies";
import { Frequency } from "../../types/frequency";
import { Button, Badge } from "flowbite-react";
import FrequencyEditForm from "../../components/frequencies/FrequencyEditForm";
import ViewListModal from "../../components/ui/ViewListModal";

const Frequencies: React.FC = () => {
  const navigate = useNavigate();
  const { frequencies, updateFrequency, frequencyOptions, loading } = useFrequencies();
  const [selectedServiceFilter, setSelectedServiceFilter] = useState<number | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewModalData, setViewModalData] = useState<{ title: string; items: any[] }>({
    title: "",
    items: [],
  });

  const pathPrefix = window.location.pathname.split('/')[1];

  const handleNewFrequency = () => {
    navigate(`/${pathPrefix}/frequencies/new`);
  };

  const handleEditFrequency = (frequency: Frequency) => {
    navigate(`/${pathPrefix}/frequencies/edit/${frequency.id}`);
  };

  const handleEditSave = async (frequency: Frequency, formData: any) => {
    try {
      await updateFrequency(frequency.id, formData);
    } catch (error) {
      console.error("Failed to update frequency:", error);
      alert(error instanceof Error ? error.message : "Failed to update frequency. Please try again.");
    }
  };

  const filteredByService = useMemo(() => {
    if (!selectedServiceFilter) return frequencies;
    return frequencies.filter((freq) =>
      freq.services.some((service) => service.id === selectedServiceFilter),
    );
  }, [frequencies, selectedServiceFilter]);

  const columns = useMemo(
    () => [
      {
        name: "Name",
        selector: (row: Frequency) => row.name,
        sortable: true,
        width: "22%",
        cell: (row: Frequency) => (
          <div className="flex items-center">
            <div className="">
              <div className="text-sm font-semibold text-gray-900">
                {row.name}
              </div>
            </div>
          </div>
        ),
      },
      {
        name: "Frequency",
        selector: (row: Frequency) => row.frequency_label,
        sortable: false,
        width: "25%",
        cell: (row: Frequency) => (
          <div className="text-sm text-gray-600">
            {row.frequency_label}
            {row.staff_only && (
              <span className="ml-1 text-red-600">• Staff Only</span>
            )}
          </div>
        ),
      },
      {
        name: "Discount",
        selector: (row: Frequency) => row.discount_value,
        sortable: true,
        width: "12%",
        cell: (row: Frequency) => (
          <div className="text-sm font-medium text-gray-900">
            {row.discount_type === "percentage"
              ? `${row.discount_percent}%`
              : `$${row.discount_value.toFixed(2)}`}
          </div>
        ),
      },
      {
        name: "Services",
        width: "25%",
        cell: (row: Frequency) => (
          <div className="text-sm text-gray-600">
            {row.services.length > 0 ? (
              <div className="space-y-0.5">
                {row.services.slice(0, 3).map((service, idx) => (
                  <div key={idx} className="text-sm">
                    {service.name}
                  </div>
                ))}
                {row.services.length > 3 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewModalData({
                        title: `Services for ${row.name}`,
                        items: row.services,
                      });
                      setViewModalOpen(true);
                    }}
                    className="cursor-pointer text-xs text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    +{row.services.length - 3} more
                  </button>
                )}
              </div>
            ) : (
              <span className="text-gray-400">No services</span>
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
      value: "name",
      label: "Name",
      sortFn: (a: Frequency, b: Frequency) => a.name.localeCompare(b.name),
    },
    {
      value: "newest",
      label: "Newest",
      sortFn: (a: Frequency, b: Frequency) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    },
    {
      value: "oldest",
      label: "Oldest",
      sortFn: (a: Frequency, b: Frequency) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    },
    {
      value: "discount",
      label: "Discount",
      sortFn: (a: Frequency, b: Frequency) =>
        b.discount_value - a.discount_value,
    },
  ];

  const renderEditForm = (
    frequency: Frequency,
    onSave: (data: any) => void,
    onCancel: () => void,
  ) => (
    <FrequencyEditForm
      frequency={frequency}
      onSave={(data) => {
        handleEditSave(frequency, data);
        onSave(data);
      }}
      onCancel={onCancel}
    />
  );

  if (loading) {
    return (
      <div className="px-4 pb-5 sm:px-5 animate-pulse">
        {/* header skeleton */}
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

        {/* Table skeleton */}
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
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="font-medium">
            <span className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Frequencies ({filteredByService.length})
            </span>
            <div className="text-sm text-gray-500">
              Manage Service Frequencies
            </div>
          </div>
        </div>
        <Button
          color="gray"
          onClick={handleNewFrequency}
          className="w-full cursor-pointer sm:w-auto"
        >
          Add New Frequency
        </Button>
      </div>

      <AppDataTable
        data={filteredByService}
        columns={columns}
        searchPlaceholder="Search Frequencies..."
        searchKeys={["name", "frequency_label", "services.name"]}
        filterOptions={filterOptions}
        filterKey="status"
        defaultFilter="active"
        sortOptions={sortOptions}
        defaultSort="name"
        paginationOptions={[10, 20, 50, 100]}
        defaultPerPage={20}
        enableInlineEdit={true}
        renderEditForm={renderEditForm}
        showEditButton={true}
        additionalFilterOptions={frequencyOptions.services}
        additionalFilterLabel="Service"
        showAdditionalFilter={true}
        additionalFilterValue={selectedServiceFilter}
        onAdditionalFilterChange={setSelectedServiceFilter}
        mobileCard={{
          titleField: "name",
          statusField: "status",
          enableEdit: true,
          fields: [
            {
              key: "frequency_label",
              label: "Frequency",
              render: (value) => {
                if (typeof value === 'string' && value.startsWith("Custom:")) {
                  const match = value.match(/Every (\d+) weeks?/);
                  if (match) {
                    const weeks = match[1];
                    return `Custom (Every ${weeks} week${parseInt(weeks) > 1 ? "s" : ""})`;
                  }
                  return "Custom";
                }
                return String(value);
              },
            },
            {
              key: "discount_value",
              label: "Discount",
              render: (_value, frequency) =>
                frequency.discount_type === "percentage"
                  ? `${frequency.discount_percent}%`
                  : `$${frequency.discount_value.toFixed(2)}`,
            },
            {
              key: "services",
              label: "Services",
              type: "badges",
              color: "purple",
              render: (value: any[], frequency: Frequency) => {
                if (!value || value.length === 0) {
                  return <span className="text-xs text-gray-400">No services</span>;
                }
                const display = value.slice(0, 2);
                const hasMore = value.length > 2;
                return (
                  <div className="flex flex-wrap gap-1">
                    {display.map((svc: any, idx: number) => (
                      <Badge key={idx} color="purple" size="xs">
                        {svc.name}
                      </Badge>
                    ))}
                    {hasMore && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewModalData({
                            title: `Services for ${frequency.name}`,
                            items: value,
                          });
                          setViewModalOpen(true);
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        +{value.length - 2} more
                      </button>
                    )}
                  </div>
                );
              },
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
          ],
          actions: [
            {
              label: "Edit",
              color: "blue",  
              onClick: handleEditFrequency,
            },
          ],
        }}
      />

      <ViewListModal
        show={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title={viewModalData.title}
        items={viewModalData.items}
      />
    </div>
  );
};

export default Frequencies;