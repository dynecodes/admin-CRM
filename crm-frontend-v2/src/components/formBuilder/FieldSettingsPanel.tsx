import React from 'react';
import { Label, Textarea, Button, Checkbox, Badge } from 'flowbite-react';
import { HiTrash, HiX, HiPlus, HiMinus } from 'react-icons/hi';
import { FormField } from '../../types/form';
import {
  TextInput,
} from "../ui/InputsBundle";

interface FieldSettingsPanelProps {
  field: FormField;
  onUpdate: (fieldId: string, field: FormField) => void;
  onDelete: (fieldId: string) => void;
  onClose: () => void;
}

const FieldSettingsPanel: React.FC<FieldSettingsPanelProps> = ({
  field,
  onUpdate,
  onDelete,
  onClose,
}) => {
  const handleChange = (property: keyof FormField, value: any) => {
    onUpdate(field.id, { ...field, [property]: value });
  };

  const handleSettingsChange = (setting: string, value: any) => {
    onUpdate(field.id, {
      ...field,
      settings: { ...field.settings, [setting]: value },
    });
  };

  const handleOptionsChange = (index: number, value: string) => {
    const newOptions = [...(field.options || [])];
    newOptions[index] = value;
    onUpdate(field.id, { ...field, options: newOptions });
  };

  const addOption = () => {
    const newOptions = [...(field.options || []), `Option ${(field.options?.length || 0) + 1}`];
    onUpdate(field.id, { ...field, options: newOptions });
  };

  const removeOption = (index: number) => {
    const newOptions = field.options?.filter((_, i) => i !== index) || [];
    onUpdate(field.id, { ...field, options: newOptions });
  };

  const hasOptions = ['radio', 'checkbox', 'select'].includes(field.type);
  const isHeading = field.type === 'heading';
  const isParagraph = field.type === 'paragraph';
  const isDivider = field.type === 'divider';
  const isTermsField = field.type === 'terms';
  const isContentField = isHeading || isParagraph || isDivider;

  return (
    <div className="space-y-4">
      {/* header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-200">
        <div>
          <h4 className="text-sm font-semibold text-gray-900">Field Settings</h4>
          <Badge color={isContentField ? 'purple' : 'info'} size="xs" className="mt-1">
            {field.type.toUpperCase()}
          </Badge>
        </div>
        <div className="flex gap-1">
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors cursor-pointer"
          >
            <HiX className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(field.id)}
            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
          >
            <HiTrash className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* heading settings */}
      {isHeading && (
        <div className="space-y-3">
          <div>
            <Label htmlFor="headingContent" className="mb-1 text-xs">Heading Text</Label>
            <TextInput
              id="headingContent"
              value={field.settings?.content || ''}
              onChange={(e) => handleSettingsChange('content', e.target.value)}
              placeholder="Section Heading"
            />
          </div>

          <div>
            <Label htmlFor="headingSize" className="mb-1 text-xs">Heading Size</Label>
            <select
              id="headingSize"
              value={field.settings?.size || 'h3'}
              onChange={(e) => handleSettingsChange('size', e.target.value)}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-xs rounded-lg focus:ring-gray-500 focus:border-gray-500 block w-full p-2 cursor-pointer"
            >
              <option value="h1">Large (H1)</option>
              <option value="h2">Medium (H2)</option>
              <option value="h3">Small (H3)</option>
            </select>
          </div>
        </div>
      )}

      {/* paragraph settings */}
      {isParagraph && (
        <div>
          <Label htmlFor="paragraphContent" className="mb-1 text-xs">Paragraph Text</Label>
          <Textarea
            id="paragraphContent"
            value={field.settings?.content || ''}
            onChange={(e) => handleSettingsChange('content', e.target.value)}
            placeholder="Add informational text here..."
            rows={4}
            className="text-xs"
          />
          <p className="text-[10px] text-gray-500 mt-1">Use this for instructions or descriptions</p>
        </div>
      )}

      {/* divider settings */}
      {isDivider && (
        <div className="text-center py-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-2">
            <HiMinus className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-xs text-gray-600">Visual separator</p>
          <p className="text-[10px] text-gray-500 mt-1">No settings available</p>
        </div>
      )}

      {/* regular field settings */}
      {!isContentField && !isTermsField && (
        <>
          <div className="space-y-3">
            <div>
              <Label htmlFor="fieldLabel" className="mb-1 text-xs">
                Field Label {field.required}
              </Label>
              <TextInput
                id="fieldLabel"
                value={field.label}
                onChange={(e) => handleChange('label', e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="fieldName" className="mb-1 text-xs">Field Name</Label>
              <TextInput
                id="fieldName"
                value={field.name}
                onChange={(e) => handleChange('name', e.target.value)}
                required
              />
              <p className="text-[10px] text-gray-500 mt-1">Used for form data</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Checkbox
                  color="gray"
                  id="required"
                  checked={field.required}
                  onChange={(e) => handleChange('required', e.target.checked)}
                  className="w-3.5 h-3.5 cursor-pointer"
                />
                <Label htmlFor="required" className="text-xs">Required</Label>
              </div>

              <div className="flex items-center gap-1.5">
                <Checkbox
                  color="gray"
                  id="hidden"
                  checked={field.settings?.hidden || false}
                  onChange={(e) => handleSettingsChange('hidden', e.target.checked)}
                  className="w-3.5 h-3.5 cursor-pointer"
                />
                <Label htmlFor="hidden" className="text-xs">Hidden</Label>
              </div>
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* input settings */}
          <div className="space-y-3">
            {['text', 'email', 'number', 'tel', 'url', 'textarea'].includes(field.type) && (
              <div>
                <Label htmlFor="placeholder" className="mb-1 text-xs">Placeholder</Label>
                <TextInput
                  id="placeholder"
                  value={field.settings?.placeholder || ''}
                  onChange={(e) => handleSettingsChange('placeholder', e.target.value)}
  
                />
              </div>
            )}

            {field.type === 'textarea' && (
              <div>
                <Label htmlFor="rows" className="mb-1 text-xs">Rows</Label>
                <TextInput
                  id="rows"
                  type="number"
                  value={field.settings?.rows || 4}
                  onChange={(e) => handleSettingsChange('rows', parseInt(e.target.value))}
                  min={2}
                  max={10}
  
                />
              </div>
            )}

            {field.type === 'number' && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="min" className="mb-1 text-xs">Min</Label>
                  <TextInput
                    id="min"
                    type="number"
                    value={field.settings?.min || ''}
                    onChange={(e) => handleSettingsChange('min', e.target.value)}
    
                  />
                </div>
                <div>
                  <Label htmlFor="max" className="mb-1 text-xs">Max</Label>
                  <TextInput
                    id="max"
                    type="number"
                    value={field.settings?.max || ''}
                    onChange={(e) => handleSettingsChange('max', e.target.value)}
    
                  />
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* terms settings */}
      {isTermsField && (
        <>
          <div className="space-y-3">
            <div>
              <Label htmlFor="termsText" className="mb-1 text-xs">Terms Text</Label>
              <Textarea
                id="termsText"
                value={field.settings?.text || ''}
                onChange={(e) => handleSettingsChange('text', e.target.value)}
                rows={2}
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="termsLinkText" className="mb-1 text-xs">Link Text</Label>
                <TextInput
                  id="termsLinkText"
                  value={field.settings?.linkText || ''}
                  onChange={(e) => handleSettingsChange('linkText', e.target.value)}
  
                />
              </div>
              <div>
                <Label htmlFor="termsLinkUrl" className="mb-1 text-xs">Link URL</Label>
                <TextInput
                  id="termsLinkUrl"
                  value={field.settings?.linkUrl || ''}
                  onChange={(e) => handleSettingsChange('linkUrl', e.target.value)}
  
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 mt-3">
            <Checkbox
              id="required"
              checked={field.required}
              onChange={(e) => handleChange('required', e.target.checked)}
              className="w-3.5 h-3.5 cursor-pointer"
            />
            <Label htmlFor="required" className="text-xs">Required</Label>
          </div>
        </>
      )}

      {/* options */}
      {hasOptions && (
        <>
          <hr className="border-gray-200" />
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Options</Label>
            {field.options?.map((option, index) => (
              <div key={index} className="flex gap-1.5 items-center">
                <span className="text-[10px] font-medium text-gray-500 w-4 text-center">{index + 1}</span>
                <TextInput
                  value={option}
                  onChange={(e) => handleOptionsChange(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
  
                  className="flex-1"
                />
                {(field.options?.length || 0) > 1 && (
                  <button
                    onClick={() => removeOption(index)}
                    className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors cursor-pointer"
                  >
                    <HiMinus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}

            <Button
              color="light"
              size="xs"
              className="w-full cursor-pointer mt-2"
              onClick={addOption}
            >
              <HiPlus className="mr-1.5 h-3 w-3" />
              Add Option
            </Button>

            {(field.type === 'radio' || field.type === 'checkbox') && (
              <div className="flex items-center gap-1.5 mt-3">
                <Checkbox
                  id="allowOther"
                  checked={field.settings?.allowOther || false}
                  onChange={(e) => handleSettingsChange('allowOther', e.target.checked)}
                  className="w-3.5 h-3.5 cursor-pointer"
                />
                <Label htmlFor="allowOther" className="text-xs">Allow "Other" option</Label>
              </div>
            )}
          </div>
        </>
      )}

      {/* validation */}
      {!isContentField && (
        <>
          <hr className="border-gray-200" />
          <div className="space-y-3">
            <Label className="text-xs font-semibold">Validation</Label>
            <div>
              <Label htmlFor="errorMessage" className="mb-1 text-xs">Error Message</Label>
              <TextInput
                id="errorMessage"
                value={field.settings?.errorMessage || ''}
                onChange={(e) => handleSettingsChange('errorMessage', e.target.value)}
                placeholder="Custom error message"

              />
            </div>

            {(field.type === 'text' || field.type === 'textarea') && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="minLength" className="mb-1 text-xs">Min Length</Label>
                  <TextInput
                    id="minLength"
                    type="number"
                    value={field.settings?.minLength || ''}
                    onChange={(e) => handleSettingsChange('minLength', e.target.value)}
    
                  />
                </div>
                <div>
                  <Label htmlFor="maxLength" className="mb-1 text-xs">Max Length</Label>
                  <TextInput
                    id="maxLength"
                    type="number"
                    value={field.settings?.maxLength || ''}
                    onChange={(e) => handleSettingsChange('maxLength', e.target.value)}
    
                  />
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default FieldSettingsPanel;