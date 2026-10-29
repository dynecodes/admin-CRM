import React, { useState } from 'react';
import { Label, Button } from 'flowbite-react';
import { CategoryRow, CategoryStatus } from '../../types/categories';
import MultiSelectDropdown from '../ui/MultiSelectDropdown';
import { useCategories } from '../../hooks/Categories/useCategories';
import DeleteConfirmationModal from '../ui/DeleteConfirmationModal';

interface CategoryEditFormProps {
  category: CategoryRow;
  onSave: (data: any) => void;
  onCancel: () => void;
  onDelete?: (category: CategoryRow) => void;
}

const CategoryEditForm: React.FC<CategoryEditFormProps> = ({ category, onSave, onCancel, onDelete }) => {
  const { serviceOptions, updateCategory } = useCategories();

  const [name, setName] = useState(category.name);
  const [status, setStatus] = useState<CategoryStatus>(category.status);
  const [selectedServices, setSelectedServices] = useState<number[]>(
    category.services?.map(s => parseInt(s.id)) || []
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('Category name is required');
      return;
    }

    if (name.trim().length < 2) {
      alert('Category name must be at least 2 characters');
      return;
    }

    if (name.trim().length > 50) {
      alert('Category name must not exceed 50 characters');
      return;
    }

    setIsSaving(true);

    try {
      const categoryData = {
        name: name.trim(),
        serviceIds: selectedServices.map(id => id.toString()),
        status,
      };

      await updateCategory(category.id, categoryData);
      onSave(categoryData);
    } catch (error) {
      console.error('Failed to update category:', error);
      alert('Failed to update category. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusToggle = async () => {
    if (!name.trim()) {
      alert('Category name is required');
      return;
    }

    setIsSaving(true);

    try {
      const newStatus: CategoryStatus = status === 'active' ? 'archived' : 'active';
      
      const categoryData = {
        name: name.trim(),
        serviceIds: selectedServices.map(id => id.toString()),
        status: newStatus,
      };

      await updateCategory(category.id, categoryData);
      setStatus(newStatus);
      onSave(categoryData);
    } catch (error) {
      console.error('Failed to toggle status:', error);
      alert('Failed to update status. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      onDelete?.(category);
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Failed to delete category:', error);
      alert('Failed to delete category. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor={`name-${category.id}`} className="mb-1 block text-xs">
            Category Name
          </Label>
          <input
            id={`name-${category.id}`}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={50}
            disabled={isSaving}
            className="block w-full px-2.5 py-2 text-xs text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        <div>
          <Label className="mb-1 block text-xs">
            Services ({selectedServices.length})
          </Label>
          <div className="[&_button]:!bg-white [&_button:hover]:!bg-gray-100">
            <MultiSelectDropdown
              options={serviceOptions}
              selected={selectedServices}
              onChange={setSelectedServices}
              placeholder="Select Services"
              modalTitle='Select Services'
              disabled={isSaving}
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-2 pt-3 border-t border-gray-200">
          {status === 'archived' && onDelete && (
            <Button
              type="button"
              onClick={handleDeleteClick}
              color="red"
              size="xs"
              disabled={isSaving}
              className="cursor-pointer w-full sm:w-20 order-first sm:order-none"
            >
              Delete
            </Button>
          )}
          {category.status && (
            <Button
              type="button"
              onClick={handleStatusToggle}
              size="xs"
              disabled={isSaving}
              className={`cursor-pointer w-full sm:w-20 order-first sm:order-none ${
                status === 'active' 
                  ? 'bg-orange-500 hover:bg-orange-600 focus:ring-orange-300 text-white' 
                  : 'bg-green-500 hover:bg-green-600 focus:ring-green-300 text-white'
              }`}
            >
              {isSaving ? 'Saving...' : (status === 'active' ? 'Archive' : 'Activate')}
            </Button>
          )}
          <Button 
            color="gray" 
            onClick={onCancel} 
            size="xs" 
            disabled={isSaving}
            className='cursor-pointer w-full sm:w-20'
          >
            Cancel
          </Button>
          <Button
            type="submit"
            color="blue"
            size="xs"
            disabled={isSaving || !name.trim()}
            className='cursor-pointer w-full sm:w-20'
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </form>

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        itemName={category.name}
        itemType="category"
        isDeleting={isDeleting}
      />
    </>
  );
};

export default CategoryEditForm;