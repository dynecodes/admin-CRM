import React from 'react';
import { Button, Badge } from 'flowbite-react';
import { HiPlus, HiTrash, HiDocumentDuplicate } from 'react-icons/hi';
import { Form } from '../../types/form';

interface FormListProps {
  forms: Form[];
  currentForm: Form | null;
  onLoadForm: (form: Form) => void;
  onDeleteForm: (formId: number) => void;
  onNewForm: () => void;
  loading?: boolean;
}

const FormList: React.FC<FormListProps> = ({
  forms,
  currentForm,
  onLoadForm,
  onDeleteForm,
  onNewForm,
  loading = false,
}) => {
  const getStatusColor = (status: Form['status']) => {
    switch (status) {
      case 'published':
        return 'success';
      case 'draft':
        return 'warning';
      case 'archived':
        return 'gray';
      default:
        return 'info';
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          All Forms
        </h3>
        <Button size="sm" color="gray" onClick={onNewForm} className="cursor-pointer">
          <HiPlus className="mr-2 h-4 w-4" />
          New Form
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 rounded-lg border border-gray-200 bg-white animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
              <div className="flex items-center gap-2 mb-2">
                <div className="h-5 w-16 bg-gray-200 rounded"></div>
                <div className="h-3 w-3 bg-gray-200 rounded-full"></div>
                <div className="h-3 w-12 bg-gray-200 rounded"></div>
              </div>
              <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : forms.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <HiDocumentDuplicate className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No forms yet</h3>
          <p className="mt-1 text-xs text-gray-500">Create your first form to get started</p>
          <div className="mt-4 w-full flex justify-center">
            <Button size="sm" color="gray" onClick={onNewForm} className='cursor-pointer'>
              <HiPlus className="mr-2 h-4 w-4" />
              Create Form
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {forms.map((form) => (
            <div
              key={form.id}
              className={`group relative p-4 rounded-lg border cursor-pointer transition-all ${
                currentForm?.id === form.id
                  ? 'bg-gray-50 border-gray-200 shadow-sm ring-2 ring-gray-500'
                  : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
              }`}
              onClick={() => onLoadForm(form)}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <h4 className="text-sm font-semibold text-gray-900 line-clamp-2">
                  {form.name}
                </h4>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteForm(form.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 transition-all p-1 cursor-pointer"
                >
                  <HiTrash className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                <Badge color={getStatusColor(form.status)} size="xs">
                  {form.status}
                </Badge>
                <span>•</span>
                <span>{form.fields.length} fields</span>
              </div>

              {form.description && (
                <p className="text-xs text-gray-600 line-clamp-2">
                  {form.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FormList;