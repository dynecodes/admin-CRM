import React from 'react';
import { Form, FormField } from '../../types/form';
import FormPreview from './FormPreview';
import FieldSettingsPanel from './FieldSettingsPanel';
import FieldTypesPanel from './FieldTypesPanel';

interface MobileFormBuilderProps {
  currentForm: Form;
  selectedField: FormField | null;
  loading: boolean;
  onSaveForm: () => void;
  onPublish: () => void;
  onShowEmbed: () => void;
  onShowNewForm: () => void;
  onSelectField: (field: FormField | null) => void;
  onUpdateField: (fieldId: string, field: FormField) => void;
  onDeleteField: (fieldId: string) => void;
  onMoveField: (fieldId: string, direction: 'up' | 'down') => void;
  onAddField: (field: FormField) => void;
}

const MobileFormBuilder: React.FC<MobileFormBuilderProps> = ({
  currentForm,
  selectedField,
  onSelectField,
  onUpdateField,
  onDeleteField,
  onMoveField,
  onAddField,
}) => {
  const [mobileTab, setMobileTab] = React.useState<'preview' | 'quickadd' | 'settings'>('preview');

  const handleAddFieldMobile = (field: FormField) => {
    onAddField(field);
    setMobileTab('preview');
  };

  const handleSelectFieldMobile = (field: FormField | null) => {
    onSelectField(field);
    if (field) {
      setMobileTab('settings');
    }
  };

  const handleCloseSettings = () => {
    onSelectField(null);
    setMobileTab('preview');
  };

  return (
    <div>
      {/* tabs */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => setMobileTab('preview')}
              className={`flex-1 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
                mobileTab === 'preview'
                  ? 'border-gray-500 text-gray-600 bg-gray-50'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Preview
            </button>
            <button
              onClick={() => setMobileTab('quickadd')}
              className={`flex-1 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
                mobileTab === 'quickadd'
                  ? 'border-gray-500 text-gray-600 bg-gray-50'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Quick Add
            </button>
            <button
              onClick={() => setMobileTab('settings')}
              className={`flex-1 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
                mobileTab === 'settings'
                  ? 'border-gray-500 text-gray-600 bg-gray-50'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Field Settings
            </button>
          </nav>
        </div>

        <div className="p-3">
          {mobileTab === 'preview' && (
            <FormPreview
              form={currentForm}
              selectedField={selectedField}
              onSelectField={handleSelectFieldMobile}
              onUpdateField={onUpdateField}
              onDeleteField={onDeleteField}
              onMoveField={onMoveField}
            />
          )}

          {mobileTab === 'quickadd' && (
            <div>
              <h4 className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wide">Add Fields</h4>
              <FieldTypesPanel 
                onAddField={handleAddFieldMobile}
                compact={true}
              />
            </div>
          )}

          {mobileTab === 'settings' && (
            <div>
              {selectedField ? (
                <FieldSettingsPanel
                  field={selectedField}
                  onUpdate={onUpdateField}
                  onDelete={onDeleteField}
                  onClose={handleCloseSettings}
                />
              ) : (
                <div className="text-center py-12">
                  <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.591 1.066c1.53-.879 3.408.999 2.529 2.529a1.724 1.724 0 001.066 2.591c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.591c.879 1.53-.999 3.408-2.529 2.529a1.724 1.724 0 00-2.591 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.591-1.066c-1.53.879-3.408-.999-2.529-2.529a1.724 1.724 0 00-1.066-2.591c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.591c-.879-1.53.999-3.408 2.529-2.529.895.514 2.165.127 2.591-1.066z" />
                  </svg>
                  <p className="text-xs text-gray-500">Select a field to edit its settings</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileFormBuilder;