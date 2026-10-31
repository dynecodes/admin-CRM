import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import AppDataTable from "../../components/ui/AppDataTable";
import { useLocations } from "../../hooks/Locations/useLocations";
import { Location } from "../../types/location";
import { Button, Badge } from "flowbite-react";
import { HiPencil, HiOutlineLocationMarker  } from "react-icons/hi";
import LocationEditForm from "../../components/locations/LocationEditForm";

const Locations: React.FC = () => {
  const navigate = useNavigate();
  const { locations, updateLocation, loading } = useLocations();

  const pathPrefix = window.location.pathname.split('/')[1];

  const handleNewLocation = () => {
    navigate(`/${pathPrefix}/locations/new`);
  };

  const handleEditLocation = (location: Location) => {
    navigate(`/${pathPrefix}/locations/edit/${location.id}`);
  };

  const handleEditSave = async (location: Location, formData: any) => {
    try {
      await updateLocation(location.id, formData);
    } catch (error) {
      console.error("Failed to update location:", error);
    }
  };

  const columns = useMemo(
    () => [
      {
        name: "Location Name",
        selector: (row: Location) => row.name,
        sortable: true,
        width: "34%",
        cell: (row: Location) => (
          <div className="flex items-center">
            <div className="">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                {row.name}
                {row.is_default && (
                  <Badge color="blue" size="xs">
                    Default
                  </Badge>
                )}
              </div>
            </div>
          </div>
        ),
      },
      {
        name: "Postal Codes",
        selector: (row: Location) => row.postal_codes.join(", "),
        sortable: false,
        width: "48%",
        cell: (row: Location) => (
          <div className="text-sm text-gray-900">
            <div className="font-mono text-xs">
              {row.postal_codes.length === 0 ? (
                <span className="text-gray-400 italic">No postal codes</span>
              ) : (
                row.postal_codes.join(", ")
              )}
            </div>
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
      sortFn: (a: Location, b: Location) => a.name.localeCompare(b.name),
    },
    {
      value: "newest",
      label: "Newest",
      sortFn: (a: Location, b: Location) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    },
    {
      value: "oldest",
      label: "Oldest",
      sortFn: (a: Location, b: Location) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    }
  ];

  const renderEditForm = (
    location: Location,
    onSave: (data: any) => void,
    onCancel: () => void,
  ) => (
    <LocationEditForm
      location={location}
      onSave={(data) => {
        handleEditSave(location, data);
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
              <HiOutlineLocationMarker  className="h-6 w-6 text-white"/>
          </div>
          <div className="font-medium">
            <span className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Locations ({locations.length})
            </span>
            <div className="text-sm text-gray-500">
              Manage Service Locations
            </div>
          </div>
        </div>
        <Button
          color="gray"
          onClick={handleNewLocation}
          className="w-full cursor-pointer sm:w-auto"
        >
          New Location
        </Button>
      </div>

      <AppDataTable
        data={locations}
        columns={columns}
        searchPlaceholder="Search Locations..."
        searchKeys={["name", "postal_codes"]}
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
          statusField: "status",
          enableEdit: true,
          fields: [
            {
              key: "postal_codes",
              label: "Postcodes",
              render: (value) => (
                <div>
                  <div className="font-mono text-xs leading-relaxed">
                    {value.length === 0 ? "No postal codes" : value.join(", ")}
                  </div>
                </div>
              ),
            },
            {
              key: "is_default",
              label: "Type",
              render: (value) =>
                value ? (
                  <Badge color="blue" size="xs">
                    Default
                  </Badge>
                ) : null,
            },
          ],
          actions: [
            {
              label: "Edit",
              color: "blue",
              icon: <HiPencil className="h-3 w-3" />,
              onClick: handleEditLocation,
            },
          ],
        }}
      />
    </div>
  );
};

export default Locations;