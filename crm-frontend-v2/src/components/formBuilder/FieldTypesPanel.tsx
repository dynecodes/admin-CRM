import React from 'react';
import {
  HiOutlineDocumentText,
  HiOutlineMail,
  HiOutlineAnnotation,
  HiOutlineHashtag,
  HiOutlinePhone,
  HiOutlineLink,
  HiOutlineCalendar,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineClipboardList,
  HiOutlineMenuAlt4,
  HiOutlineShieldCheck,
  HiMinusSm,
  HiOutlineDocumentAdd,
  HiOutlineNewspaper,
} from 'react-icons/hi';
import { FormField, FieldType } from '../../types/form';

interface FieldTypesPanelProps {
  onAddField: (field: FormField) => void;
  compact?: boolean;
}

interface FieldTypeConfig {
  type: FieldType;
  label: string;
  icon: React.ReactNode;
}

const FieldTypesPanel: React.FC<FieldTypesPanelProps> = ({ onAddField, compact = false }) => {
  const allFields: FieldTypeConfig[] = [
    { type: 'text', label: 'Text', icon: <HiOutlineDocumentText className="w-5 h-5" /> },
    { type: 'email', label: 'Email', icon: <HiOutlineMail className="w-5 h-5" /> },
    { type: 'textarea', label: 'Long Text', icon: <HiOutlineAnnotation className="w-5 h-5" /> },
    { type: 'number', label: 'Number', icon: <HiOutlineHashtag className="w-5 h-5" /> },
    { type: 'tel', label: 'Phone', icon: <HiOutlinePhone className="w-5 h-5" /> },
    { type: 'url', label: 'URL', icon: <HiOutlineLink className="w-5 h-5" /> },
    { type: 'date', label: 'Date', icon: <HiOutlineCalendar className="w-5 h-5" /> },
    { type: 'datetime-local', label: 'Date Time', icon: <HiOutlineClock className="w-5 h-5" /> },
    { type: 'radio', label: 'Radio', icon: <HiOutlineCheckCircle className="w-5 h-5" /> },
    { type: 'checkbox', label: 'Checkbox', icon: <HiOutlineClipboardList className="w-5 h-5" /> },
    { type: 'select', label: 'Dropdown', icon: <HiOutlineMenuAlt4 className="w-5 h-5" /> },
    { type: 'heading', label: 'Heading', icon: <HiOutlineDocumentAdd className="w-5 h-5" /> },
    { type: 'paragraph', label: 'Paragraph', icon: <HiOutlineNewspaper className="w-5 h-5" /> },
    { type: 'divider', label: 'Divider', icon: <HiMinusSm className="w-5 h-5" /> },
    { type: 'terms', label: 'Terms', icon: <HiOutlineShieldCheck className="w-5 h-5" /> },
  ];

  const createField = (fieldType: FieldTypeConfig): FormField => {
    const baseField: FormField = {
      id: `field_${Date.now()}`,
      type: fieldType.type,
      name: fieldType.label.toLowerCase().replace(/\s+/g, '_'),
      label: fieldType.label,
      required: false,
      settings: {},
    };

    switch (fieldType.type) {
      case 'text':
      case 'email':
      case 'number':
      case 'tel':
      case 'url':
        baseField.settings = { placeholder: `Enter ${fieldType.label.toLowerCase()}` };
        break;
      case 'textarea':
        baseField.settings = { placeholder: 'Enter your message', rows: 4 };
        break;
      case 'radio':
      case 'checkbox':
      case 'select':
        baseField.options = ['Option 1', 'Option 2', 'Option 3'];
        baseField.settings = { allowOther: false };
        break;
      case 'heading':
        baseField.settings = { content: 'Section Heading', size: 'h3' };
        baseField.label = 'Heading';
        break;
      case 'paragraph':
        baseField.settings = { content: 'Add informational text here. You can include instructions, descriptions, or any other helpful content.' };
        baseField.label = 'Paragraph';
        break;
      case 'divider':
        baseField.settings = { content: '' };
        baseField.label = 'Divider';
        break;
      case 'terms':
        baseField.settings = {
          text: 'I agree to the terms and conditions',
          linkText: 'terms and conditions',
          linkUrl: '#',
        };
        baseField.required = true;
        break;
      default:
        break;
    }

    return baseField;
  };

  const handleAddField = (fieldType: FieldTypeConfig) => {
    const field = createField(fieldType);
    onAddField(field);
  };

  if (compact) {
    return (
      <div className="grid grid-cols-2 gap-2">
        {allFields.map((fieldType) => (
          <button
            key={fieldType.type}
            onClick={() => handleAddField(fieldType)}
            className="flex flex-col items-center justify-center p-2.5 bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors group cursor-pointer"
            title={fieldType.label}
          >
            <div className="text-gray-500 group-hover:text-gray-600 transition-colors mb-1.5">
              {fieldType.icon}
            </div>
            <span className="text-[10px] text-gray-600 group-hover:text-gray-700 text-center leading-tight">
              {fieldType.label}
            </span>
          </button>
        ))}
      </div>
    );
  }

  return null;
};

export default FieldTypesPanel;