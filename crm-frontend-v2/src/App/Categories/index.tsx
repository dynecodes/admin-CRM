import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Badge } from "flowbite-react";
import AppDataTable from "../../components/ui/AppDataTable";
import { useCategories } from "../../hooks/Categories/useCategories";
import { CategoryRow } from "../../types/categories";
import { HiPencil } from "react-icons/hi";
import CategoryEditForm from "../../components/categories/CategoryEditForm";
import ViewListModal from "../../components/ui/ViewListModal";
import { TbCategory } from "react-icons/tb";

const CategoriesPage: React.FC = () => {
  const navigate = useNavigate();
  const { categories, updateCategory, deleteCategory, loading } = useCategories();

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewModalData, setViewModalData] = useState<{ title: string; items: any[] }>({
    title: "",
    items: [],
  });

  const pathPrefix = window.location.pathname.split('/')[1];

  const handleNewCategory = () => {
    navigate(`/${pathPrefix}/categories/new`);
  };

  const handleEditCategory = (category: CategoryRow) => {
    navigate(`/${pathPrefix}/categories/edit/${category.id}`);
  };

  const handleEditSave = async (category: CategoryRow, formData: any) => {
    try {
      await updateCategory(category.id, formData);
    } catch (error) {
      console.error("Failed to update category:", error);
      alert("Failed to update category. Please try again.");
    }
  };

  const handleDeleteCategory = async (category: CategoryRow) => {
    try {
      await deleteCategory(category.id);
    } catch (error) {
      console.error("Failed to delete category:", error);
      alert("Failed to delete category. Please try again.");
    }
  };

  const columns = useMemo(
    () => [
      {
        name: "Category",
        selector: (row: CategoryRow) => row.name,
        sortable: true,
        width: "38%",
        cell: (row: CategoryRow) => (
          <div className="flex items-center">
            <div>
              <div className="text-sm font-semibold text-gray-900">{row.name}</div>
            </div>
          </div>
        ),
      },
      {
        name: "Services",
        selector: (row: CategoryRow) => row.services.length,
        sortable: true,
        width: "43%",
        cell: (row: CategoryRow) => (
          <div className="text-sm text-gray-600">
            {row.services.length > 0 ? (
              <div className="space-y-0.5">
                {row.services.slice(0, 3).map((svc, idx) => (
                  <div key={idx} className="text-sm">
                    {svc.name}
                  </div>
                ))}
                {row.services.length > 3 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewModalData({
                        title: `Services in ${row.name}`,
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
      sortFn: (a: CategoryRow, b: CategoryRow) => a.name.localeCompare(b.name),
    },
    {
      value: "newest",
      label: "Newest",
      sortFn: (a: CategoryRow, b: CategoryRow) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    },
    {
      value: "oldest",
      label: "Oldest",
      sortFn: (a: CategoryRow, b: CategoryRow) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    }
  ];

  const renderEditForm = (
    category: CategoryRow,
    onSave: (data: any) => void,
    onCancel: () => void,
  ) => (
    <CategoryEditForm
      category={category}
      onSave={(data) => {
        handleEditSave(category, data);
        onSave(data);
      }}
      onCancel={onCancel}
      onDelete={handleDeleteCategory}
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
            <TbCategory className="h-6 w-6 text-white"/>
          </div>
          <div className="font-medium">
            <span className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Categories ({categories.length})
            </span>
            <div className="text-sm text-gray-500">Organize Services</div>
          </div>
        </div>
        <Button
          color="gray"
          onClick={handleNewCategory}
          className="w-full cursor-pointer sm:w-auto"
        >
          Add New Category
        </Button>
      </div>

      <AppDataTable
        data={categories}
        columns={columns}
        searchPlaceholder="Search Categories..."
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
          subtitleRender: (row: CategoryRow) =>
            `${row.services.length} service${row.services.length === 1 ? "" : "s"}`,
          statusField: "status",
          enableEdit: true,
          fields: [
            {
              key: "services",
              label: "Services",
              type: "badges",
              color: "purple",
              render: (value: any[], category: CategoryRow) => {
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
                            title: `Services in ${category.name}`,
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
          ],
          actions: [
            {
              label: "Edit",
              color: "blue",
              icon: <HiPencil className="h-3 w-3" />,
              onClick: handleEditCategory,
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

export default CategoriesPage;