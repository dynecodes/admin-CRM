import React from 'react';
import { useNavigate } from 'react-router-dom';
import CategoryForm from '../../../components/categories/CategoryForm';
import { useCategories } from '../../../hooks/Categories/useCategories';

const NewCategory: React.FC = () => {
  const navigate = useNavigate();
  const pathPrefix = window.location.pathname.split('/')[1];
  const { addCategory } = useCategories();

  const handleCategorySuccess = async (categoryData: any) => {
    try {
      await addCategory(categoryData);
      navigate(`/${pathPrefix}/categories`);
    } catch (error) {
      console.error('Failed to create category:', error);
      alert('Failed to create category. Please try again.');
    }
  };

  const handleCancel = () => {
    navigate(`/${pathPrefix}/categories`);
  };

  return (
    <div className="px-5 pb-5">
      <CategoryForm
        onSuccess={handleCategorySuccess}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default NewCategory;