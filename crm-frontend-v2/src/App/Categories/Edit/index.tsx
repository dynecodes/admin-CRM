import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CategoryForm from '../../../components/categories/CategoryForm';
import { useCategories } from '../../../hooks/Categories/useCategories';
import { CategoryRow } from '../../../types/categories';

const EditCategory: React.FC = () => {
  const navigate = useNavigate();
  const pathPrefix = window.location.pathname.split('/')[1];
  const { id } = useParams<{ id: string }>();
  const { categories, updateCategory, deleteCategory, loading } = useCategories();

  const category = categories.find(c => c.id === id);

  const handleCategorySuccess = async (categoryData: any) => {
    if (category) {
      try {
        await updateCategory(category.id, categoryData);
        navigate(`/${pathPrefix}/categories`);
      } catch (error) {
        console.error('Failed to update category:', error);
        alert('Failed to update category. Please try again.');
      }
    }
  };

  const handleDeleteCategory = async (category: CategoryRow) => {
    try {
      await deleteCategory(category.id);
      navigate(`/${pathPrefix}/categories`);
    } catch (error) {
      console.error('Failed to delete category:', error);
      alert('Failed to delete category. Please try again.');
    }
  };

  const handleCancel = () => {
    navigate(`/${pathPrefix}/categories`);
  };

  // show skeleton loader while fetching
  if (loading) {
    return (
      <div className="px-5 pb-5 space-y-4 sm:space-y-6 animate-pulse">
        {/* breadcrumb skeleton */}
        <div className="h-4 bg-gray-200 rounded w-48"></div>
        
        {/* header skeleton */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-300 rounded-full"></div>
          <div className="space-y-2">
            <div className="h-6 bg-gray-200 rounded w-40"></div>
            <div className="h-4 bg-gray-200 rounded w-56"></div>
          </div>
        </div>

        {/* form skeleton */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <div className="h-5 bg-gray-200 rounded w-32"></div>
            <div className="h-10 bg-gray-100 rounded"></div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <div className="h-5 bg-gray-200 rounded w-32"></div>
            <div className="h-32 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // only show "not found" after loading is complete
  if (!loading && !category) {
    return (
      <div className="px-5 pb-5">
        <div className="text-center py-8">
          <p className="text-lg text-gray-500">Category not found</p>
          <button
            onClick={() => navigate(`/${pathPrefix}/categories`)}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            Back to Categories
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 pb-5">
      <CategoryForm
        category={category}
        onSuccess={handleCategorySuccess}
        onCancel={handleCancel}
        onDelete={handleDeleteCategory}
      />
    </div>
  );
};

export default EditCategory;