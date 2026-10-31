import React, { useMemo, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppDataTable from "../../components/ui/AppDataTable";
import { useAddons } from "../../hooks/useAddons";
import { Addon } from "../../types/addon";
import { Button, Badge } from "flowbite-react";
import { HiPencil } from "react-icons/hi";
import AddonEditForm from "../../components/addons/AddonEditForm";
import ViewListModal from "../../components/ui/ViewListModal";
import { MdLibraryAddCheck } from "react-icons/md";

const Addons: React.FC = () => {
  const navigate = useNavigate();
  const { addons, updateAddon, loading } = useAddons();
  const [editingData, setEditingData] = useState<{
    [key: number]: {
      uploadedIcon?: string;
      libraryIcon?: string;
      iconType?: 'library' | 'upload';
    };
  }>({});
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewModalData, setViewModalData] = useState<{
    title: string;
    items: any[];
  }>({ title: "", items: [] });

  const handleNewAddon = () => {
    const pathPrefix = window.location.pathname.split('/')[1]; // gets 'admin', 'staff', or 'technical'
    navigate(`/${pathPrefix}/addons/new`);
  };

  const handleEditAddon = (addon: Addon) => {
    const pathPrefix = window.location.pathname.split('/')[1];
    navigate(`/${pathPrefix}/addons/edit/${addon.id}`);
  };

  const formatDuration = (addon: Addon) => {
    const hours = addon.duration_hours || 0;
    const minutes = addon.duration_minutes || 0;

    if (hours === 0 && minutes === 0) return "—";

    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);

    return parts.join(" ");
  };

  const columns = useMemo(
    () => [
      {
        name: "Add-on",
        selector: (row: Addon) => row.name,
        sortable: true,
        width: "18%",
        cell: (row: Addon) => (
          <div className="flex items-center gap-2">
            <div className="">
              <div className="text-sm font-semibold text-gray-900">
                {row.name}
              </div>
            </div>
          </div>
        ),
      },
      {
        name: "Price",
        selector: (row: Addon) => row.price,
        sortable: true,
        width: "10%",
        cell: (row: Addon) => (
          <div className="text-sm font-medium text-gray-900">
            ${row.price.toFixed(2)}
          </div>
        ),
      },
      {
        name: "Quantity",
        width: "13%",
        cell: (row: Addon) => (
          <div className="flex justify-center">
            {row.quantity_based && (
               <div className="ps-4">
              <svg
                className="h-5 w-5 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              </div>
            )}
          </div>
        ),
      },
      {
        name: "Details",
        width: "19%",
        cell: (row: Addon) => (
          <div className="text-sm text-gray-600">
            {formatDuration(row) !== "—" && (
              <div className="mb-1">
                <span className="font-medium">Duration:</span>{" "}
                <span className="text-gray-600">{formatDuration(row)}</span>
              </div>
            )}

            <div className="mb-1">
              <span className="font-medium">Policy:</span>{" "}
              {row.recurring_policy === "every_booking"
                ? "Every booking"
                : "First booking only"}
            </div>

            {(row.exclude_frequency || row.exclude_discount_code) && (
              <div className="mb-1">
                <span className="font-medium">Excludes:</span>{" "}
                {[
                  row.exclude_frequency && "Frequency",
                  row.exclude_discount_code && "Discount codes",
                ]
                  .filter(Boolean)
                  .join(", ")}
              </div>
            )}
          </div>
        ),
      },
      {
        name: "Services",
        width: "24%",
        cell: (row: Addon) => (
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
                    className="cursor-pointer text-xs text-gray-600 hover:text-gray-800 hover:underline"
                  >
                    +{row.services.length - 3} more
                  </button>
                )}
              </div>
            ) : (
              <span className="text-gray-400"></span>
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
      sortFn: (a: Addon, b: Addon) => a.name.localeCompare(b.name),
    },
    {
      value: "price",
      label: "Price",
      sortFn: (a: Addon, b: Addon) => a.price - b.price,
    },
    {
      value: "newest",
      label: "Newest",
      sortFn: (a: Addon, b: Addon) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    },
  ];

  const renderEditForm = useCallback(
    (addon: Addon, onSave: (data: any) => void, onCancel: () => void) => (
      <AddonEditForm
        addon={addon}
        editingData={editingData[addon.id]}
        onEditingDataChange={(data) =>
          setEditingData((prev) => ({ ...prev, [addon.id]: data }))
        }
        onSave={async (data) => {
          try {
            await updateAddon(addon.id, data);
            setEditingData((prev) => {
              const newState = { ...prev };
              delete newState[addon.id];
              return newState;
            });
            onSave(data);
          } catch (error) {
            console.error("Failed to update addon:", error);
            alert(error instanceof Error ? error.message : 'Failed to update addon');
          }
        }}
        onCancel={() => {
          setEditingData((prev) => {
            const newState = { ...prev };
            delete newState[addon.id];
            return newState;
          });
          onCancel();
        }}
      />
    ),
    [updateAddon, editingData],
  );

  if (loading) {
    return (
      <div className="px-4 pb-5 sm:px-5 animate-pulse">
        {/* Header skeleton */}
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
            <MdLibraryAddCheck className="h-6 w-6 text-white" />
          </div>
          <div className="font-medium">
            <span className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Add-ons ({addons.length})
            </span>
            <div className="text-sm text-gray-500">Manage Add-ons</div>
          </div>
        </div>
        <Button
          color="gray"
          onClick={handleNewAddon}
          className="w-full cursor-pointer sm:w-auto"
        >
          New Add-on
        </Button>
      </div>

      <AppDataTable
        data={addons}
        columns={columns}
        searchPlaceholder="Search Add-ons..."
        searchKeys={["name", "services.name"]}
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
        mobileCard={{
          titleField: "name",
          subtitleRender: (addon: Addon) => `$${addon.price.toFixed(2)}`,
          statusField: "status",
          enableEdit: true,
          fields: [
            {
              key: "quantity_based",
              label: "Type",
              type: "badge",
              color: "gray",
              render: (value) =>
                value ? (
                  <Badge color="gray" size="xs">
                    Quantity-based
                  </Badge>
                ) : (
                  <span className="text-xs text-gray-600">Fixed</span>
                ),
            },
            {
              key: "duration",
              label: "Duration",
              render: (_: any, addon: Addon) => formatDuration(addon),
            },
            {
              key: "recurring_policy",
              label: "Policy",
              render: (value) =>
                value === "every_booking"
                  ? "Every booking"
                  : "First booking only",
            },
            {
              key: "services",
              label: "Services",
              type: "badges",
              color: "purple",
              render: (value, addon: Addon) => {
                if (!value || value.length === 0) return null;

                const displayServices = value.slice(0, 2);
                const hasMore = value.length > 2;

                return (
                  <div className="flex flex-wrap gap-1">
                    {displayServices.map((service: any, idx: number) => (
                      <Badge key={idx} color="purple" size="xs">
                        {service.name}
                      </Badge>
                    ))}
                    {hasMore && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewModalData({
                            title: `Services for ${addon.name}`,
                            items: value,
                          });
                          setViewModalOpen(true);
                        }}
                        className="text-xs text-gray-600 hover:text-gray-800 hover:underline"
                      >
                        +{value.length - 2} more
                      </button>
                    )}
                  </div>
                );
              },
            },
            {
              key: "exclude_frequency",
              label: "Excludes Frequency",
              type: "badge",
              color: "red",
              render: (value) =>
                value ? (
                  <Badge color="red" size="xs">
                    Excluded
                  </Badge>
                ) : null,
            },
            {
              key: "exclude_discount_code",
              label: "Excludes Discounts",
              type: "badge",
              color: "red",
              render: (value) =>
                value ? (
                  <Badge color="red" size="xs">
                    Excluded
                  </Badge>
                ) : null,
            },
          ],
          actions: [
            {
              label: "Edit",
              color: "gray",
              icon: <HiPencil className="h-3 w-3" />,
              onClick: handleEditAddon,
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

export default Addons;