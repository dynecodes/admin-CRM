import React, { useActionState, useRef, useEffect, useState } from "react";
import { Alert, Label, Card } from "flowbite-react";
import { HiExclamationCircle, HiCheckCircle } from "react-icons/hi";
import { Link } from "react-router-dom";
import { CategoryRow, CategoryStatus } from "../../types/categories";
import { useCategories } from "../../hooks/Categories/useCategories";
import FormActions from "../ui/FormActions";
import MultiSelectDropdown from "../ui/MultiSelectDropdown";
import DeleteConfirmationModal from "../ui/DeleteConfirmationModal";
import { BiCategory } from "react-icons/bi";

interface CategoryFormProps {
  category?: CategoryRow;
  onSuccess: (categoryData: any) => void;
  onCancel: () => void;
  onDelete?: (category: CategoryRow) => void;
}

interface ActionState {
  success: boolean;
  message: string | null;
  data: any;
  error: string | null;
}

const CategoryForm: React.FC<CategoryFormProps> = ({
  category,
  onSuccess,
  onCancel,
  onDelete,
}) => {
  const formRef = useRef<HTMLFormElement>(null);
  const hasCalledOnSuccess = useRef(false);
  const isEditing = !!category;
  const { serviceOptions } = useCategories();

  // form states
  const [categoryStatus, setCategoryStatus] = useState<CategoryStatus>(
    category?.status || "active",
  );
  const [selectedServices, setSelectedServices] = useState<number[]>(
    category?.services?.map((s) => parseInt(s.id)) || [],
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const categoryAction = async (
    _prevState: ActionState,
    formData: FormData,
  ): Promise<ActionState> => {
    try {
      const data = Object.fromEntries(formData);

      if (!data.name || (data.name as string).trim().length < 2) {
        throw new Error("Category name must be at least 2 characters");
      }

      if ((data.name as string).trim().length > 50) {
        throw new Error("Category name must not exceed 50 characters");
      }

      const categoryData = {
        name: (data.name as string).trim(),
        serviceIds: selectedServices.map((id) => id.toString()),
        status: categoryStatus,
      };

      // Call the onSuccess handler which will handle the API call
      await onSuccess(categoryData);

      return {
        success: true,
        message: `Category ${isEditing ? "updated" : "created"} successfully!`,
        data: categoryData,
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

  const [state, _dispatch] = useActionState(categoryAction, {
    success: false,
    message: null,
    data: null,
    error: null,
  });

  useEffect(() => {
    if (state.success && state.data && !hasCalledOnSuccess.current) {
      hasCalledOnSuccess.current = true;
      if (!isEditing) {
        formRef.current?.reset();
        setSelectedServices([]);
        setCategoryStatus("active");
      }
    }
  }, [state.success, state.data, isEditing]);

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!category) return;

    setIsDeleting(true);
    try {
      onDelete?.(category);
      setShowDeleteModal(false);
    } catch (error) {
      console.error("Failed to delete category:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);

    try {
      const formData = new FormData(formRef.current!);
      const result = await categoryAction(state, formData);

      if (!result.success) {
        alert(result.error);
      }
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setIsPending(false);
    }
  };

  // handle immediate status toggle
  const handleStatusToggle = async () => {
    if (!isEditing || !category) return;

    try {
      const nameValue = formRef.current?.elements.namedItem(
        "name",
      ) as HTMLInputElement;
      if (!nameValue?.value.trim()) {
        alert("Category name is required");
        return;
      }

      const newStatus = categoryStatus === "active" ? "archived" : "active";

      setIsPending(true);

      // Call onSuccess which will handle the API call
      await onSuccess({
        name: nameValue.value.trim(),
        serviceIds: selectedServices.map((id) => id.toString()),
        status: newStatus,
      });

      // Update local state
      setCategoryStatus(newStatus);
    } catch (error) {
      console.error("Failed to toggle status:", error);
      alert("Failed to update status. Please try again.");
    } finally {
      setIsPending(false);
    }
  };

  const pathPrefix = window.location.pathname.split('/')[1];
  return (
    <>
      <div className="space-y-4 sm:space-y-6">
        {/* breadcrumb */}
        <nav
          className="flex items-center text-gray-700"
          aria-label="Breadcrumb"
        >
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <Link
                to={`/${pathPrefix}/categories`}
                className="inline-flex items-center text-xs font-medium text-gray-700 hover:text-gray-600 sm:text-sm"
              >
                Categories
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
                  {isEditing ? "Edit Category" : "New Category"}
                </span>
              </div>
            </li>
          </ol>
        </nav>

        {/* header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="relative inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-black sm:h-12 sm:w-12">
              <BiCategory className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 sm:text-2xl lg:text-3xl">
                {isEditing ? "Edit Category" : "New Category"}
              </h1>
              <p className="text-xs text-gray-500 sm:text-sm">
                {isEditing
                  ? "Update category details and services"
                  : "Create a new category to organize services"}
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

          {/* basic info */}
          <Card className="bg-gray-50">
            <div className="mb-3 flex items-center gap-2 sm:mb-4 sm:gap-3">
              {/* <HiInformationCircle className="h-7 w-7 text-gray-600 sm:h-6 sm:w-6" /> */}
              <h3 className="text-base font-semibold text-gray-900 sm:text-lg">
                Category Information
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
              <div className="lg:col-span-2">
                <Label htmlFor="name" className="mb-1 block text-sm sm:mb-2">
                  Category Name
                </Label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Enter Category Name"
                  defaultValue={category?.name || ""}
                  required
                  maxLength={50}
                  className="block w-full rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-sm text-gray-900 focus:border-gray-500 focus:ring-gray-500 sm:px-3 sm:py-2.5"
                />
              </div>
            </div>

            <div>
              <Label
                htmlFor="name"
                className="mb-1 block text-xs text-gray-900 sm:text-sm"
              >
                Choose Services
              </Label>
              <MultiSelectDropdown
                options={serviceOptions}
                selected={selectedServices}
                onChange={setSelectedServices}
                placeholder="Select Services"
                modalTitle="Select Services"
                className="bg-white"
              />
            </div>
          </Card>

          {/* services */}
          {/* <Card className='bg-gray-50'>
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <HiTag className="w-7 h-7 sm:w-6 sm:h-6 text-purple-600" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Associated Services</h3>
            </div>

            <div>
              <MultiSelectDropdown
                options={serviceOptions}
                selected={selectedServices}
                onChange={setSelectedServices}
                placeholder="Select Services"
                modalTitle='Select Services'
                className='bg-white'
              />
            </div>
          </Card> */}

          <div className="pt-0 sm:pt-1">
            <FormActions
              onCancel={onCancel}
              isPending={isPending}
              isEditing={isEditing}
              submitText="Save"
              editText="Save"
              showStatusToggle={isEditing}
              status={categoryStatus}
              onStatusToggle={handleStatusToggle}
              showDelete={isEditing && categoryStatus === "archived"}
              onDelete={handleDeleteClick}
            />
          </div>
        </form>
      </div>

      {category && (
        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteConfirm}
          itemName={category.name}
          itemType="category"
          isDeleting={isDeleting}
        />
      )}
    </>
  );
};

export default CategoryForm;
