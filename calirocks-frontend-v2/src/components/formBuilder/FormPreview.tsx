import React, { useState } from 'react';
import { Button, Label, Textarea, Radio, Checkbox } from 'flowbite-react';
import { HiArrowUp, HiArrowDown, HiPencil, HiTrash } from 'react-icons/hi';
import { Form, FormField } from '../../types/form';
import {
  TextInput,
} from "../ui/InputsBundle";
interface FormPreviewProps {
  form: Form;
  selectedField: FormField | null;
  onSelectField: (field: FormField | null) => void;
  onUpdateField: (fieldId: string, field: FormField) => void;
  onDeleteField: (fieldId: string) => void;
  onMoveField: (fieldId: string, direction: 'up' | 'down') => void;
}

const FormPreview: React.FC<FormPreviewProps> = ({
  form,
  selectedField,
  onSelectField,
  onDeleteField,
  onMoveField,
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({});

  const handleInputChange = (fieldName: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
  };

  const renderFieldActions = (field: FormField, index: number) => {
    const isSelected = selectedField?.id === field.id;
    if (!isSelected) return null;

    return (
      <div className="absolute -top-2 -right-2 flex gap-0.5 bg-white rounded-lg border border-gray-200 z-10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMoveField(field.id, 'up');
          }}
          disabled={index === 0}
          className="p-1.5 text-gray-600 hover:text-gray-600 hover:bg-gray-50 rounded-l disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          title="Move up"
        >
          <HiArrowUp className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMoveField(field.id, 'down');
          }}
          disabled={index === form.fields.length - 1}
          className="p-1.5 text-gray-600 hover:text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          title="Move down"
        >
          <HiArrowDown className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelectField(field);
          }}
          className="p-1.5 text-gray-600 hover:text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
          title="Edit settings"
        >
          <HiPencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDeleteField(field.id);
          }}
          className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-r transition-colors cursor-pointer"
          title="Delete field"
        >
          <HiTrash className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  };

  const renderField = (field: FormField, index: number) => {
    const isSelected = selectedField?.id === field.id;
    const isHidden = field.settings?.hidden;

    if (isHidden) {
      return (
        <div
          key={field.id}
          className="relative p-3 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 cursor-pointer hover:border-gray-400 transition-colors"
          onClick={() => onSelectField(field)}
        >
          <p className="text-xs text-gray-500 italic">Hidden Field: {field.label}</p>
          {renderFieldActions(field, index)}
        </div>
      );
    }

    const fieldElement = (() => {
      switch (field.type) {
        case 'text':
        case 'email':
        case 'number':
        case 'tel':
        case 'url':
          return (
            <div>
              <Label htmlFor={field.id} style={{ color: form.settings.labelColor, fontFamily: form.settings.labelFont }} className="text-sm mb-1 block">
                {field.label} {field.required}
              </Label>
              <TextInput
                id={field.id}
                type={field.type}
                placeholder={field.settings?.placeholder}
                required={field.required}
                value={formData[field.name] || ''}
                onChange={(e) => handleInputChange(field.name, e.target.value)}
                style={{ color: form.settings.textColor, fontFamily: form.settings.textFont }}            
              />
            </div>
          );

        case 'textarea':
          return (
            <div>
              <Label htmlFor={field.id} style={{ color: form.settings.labelColor, fontFamily: form.settings.labelFont }} className="text-sm mb-1 block">
                {field.label} {field.required}
              </Label>
              <Textarea
                id={field.id}
                placeholder={field.settings?.placeholder}
                required={field.required}
                rows={field.settings?.rows || 4}
                value={formData[field.name] || ''}
                onChange={(e) => handleInputChange(field.name, e.target.value)}
                style={{ color: form.settings.textColor, fontFamily: form.settings.textFont }}
                className="text-sm"
              />
            </div>
          );

        case 'date':
        case 'datetime-local':
          return (
            <div>
              <Label htmlFor={field.id} style={{ color: form.settings.labelColor, fontFamily: form.settings.labelFont }} className="text-sm mb-1 block">
                {field.label} {field.required}
              </Label>
              <TextInput
                id={field.id}
                type={field.type}
                required={field.required}
                value={formData[field.name] || ''}
                onChange={(e) => handleInputChange(field.name, e.target.value)}                
              />
            </div>
          );

        case 'radio':
          return (
            <fieldset>
              <legend className="mb-2 text-sm block" style={{ color: form.settings.labelColor, fontFamily: form.settings.labelFont }}>
                {field.label} {field.required}
              </legend>
              <div className="space-y-2">
                {field.options?.map((option, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Radio
                      color="gray"
                      id={`${field.id}-${idx}`}
                      name={field.name}
                      value={option}
                      checked={formData[field.name] === option}
                      onChange={(e) => handleInputChange(field.name, e.target.value)}
                    />
                    <Label htmlFor={`${field.id}-${idx}`} style={{ color: form.settings.textColor, fontFamily: form.settings.textFont }} className="text-sm">
                      {option}
                    </Label>
                  </div>
                ))}
                {field.settings?.allowOther && (
                  <div className="flex items-center gap-2">
                    <Radio
                      color="gray"
                      id={`${field.id}-other`}
                      name={field.name}
                      value="other"
                      checked={formData[field.name] === 'other'}
                      onChange={(e) => handleInputChange(field.name, e.target.value)}
                    />
                    <Label htmlFor={`${field.id}-other`} style={{ color: form.settings.textColor, fontFamily: form.settings.textFont }} className="text-sm">
                      Other
                    </Label>
                  </div>
                )}
              </div>
            </fieldset>
          );

        case 'checkbox':
          return (
            <fieldset>
              <legend className="mb-2 text-sm block" style={{ color: form.settings.labelColor, fontFamily: form.settings.labelFont }}>
                {field.label} {field.required}
              </legend>
              <div className="space-y-2">
                {field.options?.map((option, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Checkbox
                     color="gray"
                      id={`${field.id}-${idx}`}
                      checked={formData[field.name]?.includes(option) || false}
                      onChange={(e) => {
                        const currentValues = formData[field.name] || [];
                        const newValues = e.target.checked
                          ? [...currentValues, option]
                          : currentValues.filter((v: string) => v !== option);
                        handleInputChange(field.name, newValues);
                      }}
                    />
                    <Label htmlFor={`${field.id}-${idx}`} style={{ color: form.settings.textColor, fontFamily: form.settings.textFont }} className="text-sm">
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            </fieldset>
          );

        case 'select':
          return (
            <div>
              <Label htmlFor={field.id} style={{ color: form.settings.labelColor, fontFamily: form.settings.labelFont }} className="text-sm mb-1 block">
                {field.label} {field.required}
              </Label>
              <select
                id={field.id}
                required={field.required}
                value={formData[field.name] || ''}
                onChange={(e) => handleInputChange(field.name, e.target.value)}
                className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-gray-500 focus:border-gray-500 block w-full p-2.5 cursor-pointer"
                style={{ color: form.settings.textColor, fontFamily: form.settings.textFont }}
              >
                <option value="">Select an option</option>
                {field.options?.map((option, idx) => (
                  <option key={idx} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          );

        case 'heading':
          const headingSize = field.settings?.size || 'h3';
          const headingStyles = {
            color: form.settings.headingColor,
            fontFamily: form.settings.headingFont,
            fontSize: headingSize === 'h1' ? '2rem' : headingSize === 'h2' ? '1.5rem' : '1.25rem',
          };
          
          return (
            <div>
              {headingSize === 'h1' && (
                <h1 className="font-bold" style={headingStyles}>
                  {field.settings?.content || 'Section Heading'}
                </h1>
              )}
              {headingSize === 'h2' && (
                <h2 className="font-bold" style={headingStyles}>
                  {field.settings?.content || 'Section Heading'}
                </h2>
              )}
              {headingSize === 'h3' && (
                <h3 className="font-bold" style={headingStyles}>
                  {field.settings?.content || 'Section Heading'}
                </h3>
              )}
            </div>
          );

        case 'paragraph':
          return (
            <div 
              className="text-sm leading-relaxed"
              style={{ 
                color: form.settings.textColor, 
                fontFamily: form.settings.textFont 
              }}
            >
              {field.settings?.content || 'Add informational text here.'}
            </div>
          );

        case 'divider':
          return (
            <div className="py-2">
              <hr className="border-gray-300" />
            </div>
          );

        case 'terms':
          return (
            <div className="flex items-start gap-2">
              <Checkbox
                color="gray"
                id={field.id}
                required={field.required}
                checked={formData[field.name] || false}
                onChange={(e) => handleInputChange(field.name, e.target.checked)}
                className="mt-1 cursor-pointer"
              />
              <Label htmlFor={field.id} style={{ color: form.settings.textColor, fontFamily: form.settings.textFont }} className="text-sm">
                {field.settings?.text || 'I agree to the terms and conditions'}
                {field.settings?.linkText && field.settings?.linkUrl && (
                  <>
                    {' '}
                    <a href={field.settings.linkUrl} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:underline">
                      {field.settings.linkText}
                    </a>
                  </>
                )}
              </Label>
            </div>
          );

        default:
          return null;
      }
    })();

    // non-input fields (heading, paragraph, divider)
    const isContentField = ['heading', 'paragraph', 'divider'].includes(field.type);

    return (
      <div
        key={field.id}
        className={`relative rounded-lg transition-all cursor-pointer ${
          isContentField ? 'py-2' : 'p-4'
        } ${
          isSelected 
            ? 'ring-2 ring-gray-500 bg-gray-50' 
            : 'hover:bg-gray-50 hover:ring-1 hover:ring-gray-300'
        }`}
        onClick={() => onSelectField(field)}
      >
        {fieldElement}
        {isSelected && !isContentField && (
          <div className="absolute bottom-1 left-1 bg-gray-600 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
            {field.type.toUpperCase()}
          </div>
        )}
        {isSelected && isContentField && (
          <div className="absolute top-1 left-1 bg-purple-600 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
            {field.type.toUpperCase()}
          </div>
        )}
        {renderFieldActions(field, index)}
      </div>
    );
  };

  return (
    <div className="w-full">
      <div
        className="rounded-lg p-6 border border-gray-200"
        style={{
          backgroundColor: form.settings.backgroundColor,
          borderColor: form.settings.borderColor,
          borderWidth: '1px',
        }}
      >
        {/* form header */}
        <div className="mb-6 text-center">
          <h2
            className="text-2xl font-bold mb-2"
            style={{
              color: form.settings.headingColor,
              fontFamily: form.settings.headingFont,
            }}
          >
            {form.name}
          </h2>
          {form.description && (
            <p
              className="text-sm"
              style={{
                color: form.settings.textColor,
                fontFamily: form.settings.textFont,
              }}
            >
              {form.description}
            </p>
          )}
        </div>

        {/* form fields */}
        <div className="space-y-4 mb-6">
          {form.fields.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No fields yet</h3>
              <p className="mt-1 text-xs text-gray-500">Add fields using the Quick Add panel</p>
            </div>
          ) : (
            form.fields.map((field, index) => renderField(field, index))
          )}
        </div>

        {/* submit button */}
        <div className="flex justify-end pt-2">
         <Button
            size="md"
            color="gray"
            className="cursor-pointer px-8"
          >
            Submit Form
          </Button>
        </div>
        {/* custom css */}
        {form.settings.customCSS && (
          <style dangerouslySetInnerHTML={{ __html: form.settings.customCSS }} />
        )}
      </div>
    </div>
  );
};

export default FormPreview;