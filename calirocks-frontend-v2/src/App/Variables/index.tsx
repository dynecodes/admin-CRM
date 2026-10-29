import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppDataTable from "../../components/ui/AppDataTable";
import { useVariables } from "../../hooks/Variables/useVariables";
import { VariableRow } from "../../types/variables";
import { Button, Badge } from "flowbite-react";
import { HiPencil } from "react-icons/hi";
import VariableEditForm from "../../components/variables/VariableEditForm";
import ViewListModal from "../../components/ui/ViewListModal";
import { TbCodeVariablePlus } from "react-icons/tb";

function formatVariablePrice(row: VariableRow): string {
  if (
    row.pricing_type === "ranges" &&
    row.price_ranges &&
    row.price_ranges.length > 0
  ) {
    const prices = row.price_ranges.map((r) => r.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return min === max
      ? `$${min.toFixed(2)}`
      : `$${min.toFixed(2)} - $${max.toFixed(2)}`;
  }
  return `$${(row.price_amount || 0).toFixed(2)}`;
}

const VariablesPage: React.FC = () => {
  const navigate = useNavigate();
  const { variables, updateVariable, loading } = useVariables();

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewModalData, setViewModalData] = useState<{ title: string; items: any[] }>({
    title: "",
    items: [],
  });

  const pathPrefix = window.location.pathname.split('/')[1];

  const handleNewVariable = () => {
    navigate(`/${pathPrefix}/variables/new`);
  };

  const handleEditVariable = (variable: VariableRow) => {
    navigate(`/${pathPrefix}/variables/edit/${variable.id}`);
  };

  const handleEditSave = async (variable: VariableRow, formData: any) => {
    try {
      await updateVariable(variable.id, formData);
    } catch (error) {
      console.error("Failed to update variable:", error);
      alert(error instanceof Error ? error.message : "Failed to update variable. Please try again.");
    }
  };

  const columns = useMemo(
    () => [
      {
        name: "Variable",
        selector: (row: VariableRow) => row.name,
        sortable: true,
        width: "32%",
        cell: (row: VariableRow) => (
          <div className="flex items-center">
            <div>
              <div className="text-sm font-semibold text-gray-900">{row.name}</div>
            </div>
          </div>
        ),
      },
      {
        name: "Price",
        selector: (row: VariableRow) => row.price_amount,
        sortable: true,
        width: "25%",
        cell: (row: VariableRow) => (
          <div className="text-sm text-gray-900">{formatVariablePrice(row)}</div>
        ),
      },
      {
        name: "Services",
        selector: (row: VariableRow) => row.services?.length || 0,
        sortable: false,
        width: "26%",
        cell: (row: VariableRow) => (
          <div className="text-xs text-gray-600">
            {row.services && row.services.length > 0 ? (
              <div className="space-y-0.5">
                {row.services.slice(0, 3).map((service: any, idx: number) => (
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
              <span className="text-gray-400 italic">No services</span>
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
      sortFn: (a: VariableRow, b: VariableRow) => a.name.localeCompare(b.name),
    },
    {
      value: "newest",
      label: "Newest",
      sortFn: (a: VariableRow, b: VariableRow) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    },
    {
      value: "oldest",
      label: "Oldest",
      sortFn: (a: VariableRow, b: VariableRow) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    }
  ];

  const renderEditForm = (
    variable: VariableRow,
    onSave: (data: any) => void,
    onCancel: () => void,
  ) => (
    <VariableEditForm
      variable={variable}
      onSave={(data) => {
        handleEditSave(variable, data);
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
              <TbCodeVariablePlus className="h-6 w-6 text-white" />
          </div>
          <div className="font-medium">
            <span className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Variables ({variables.length})
            </span>
            <div className="text-sm text-gray-500">Manage Pricing Variables</div>
          </div>
        </div>
        <Button
          color="gray"
          onClick={handleNewVariable}
          className="w-full cursor-pointer sm:w-auto"
        >
          Add New Variable
        </Button>
      </div>

      <AppDataTable
        data={variables}
        columns={columns}
        searchPlaceholder="Search Variables..."
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
          subtitleRender: (row: VariableRow) => formatVariablePrice(row),
          statusField: "status",
          enableEdit: true,
          fields: [
            {
              key: "services",
              label: "Services",
              type: "badges",
              color: "purple",
              render: (value: any[], variable: VariableRow) => {
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
                            title: `Services for ${variable.name}`,
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
          ],
          actions: [
            {
              label: "Edit",
              color: "gray",
              icon: <HiPencil className="h-3 w-3" />,
              onClick: handleEditVariable,
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

export default VariablesPage;