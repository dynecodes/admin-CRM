import React, { useState, useEffect } from 'react';
import { Button, Alert, Badge } from 'flowbite-react';
import { HiPlus, HiSave, HiLink, HiDocumentDuplicate, HiEye, HiViewList, HiCog } from 'react-icons/hi';
import { useForms } from '../../hooks/useForms';
import { Form, FormField } from '../../types/form';
import FormList from '../../components/formBuilder/FormList';
import FormPreview from '../../components/formBuilder/FormPreview';
import FormSettingsPanel from '../../components/formBuilder/FormSettingsPanel';
import FieldSettingsPanel from '../../components/formBuilder/FieldSettingsPanel';
import FieldTypesPanel from '../../components/formBuilder/FieldTypesPanel';
import NewFormModal from '../../components/formBuilder/NewFormModal';
import EmbedCodeModal from '../../components/formBuilder/EmbedCodeModal';
import MobileFormBuilder from '../../components/formBuilder/MobileFormBuilder';

const FormBuilder: React.FC = () => {
  const { forms, loading, addForm, updateForm, deleteForm, updateFormStatus, createDefaultForm } = useForms();
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [currentForm, setCurrentForm] = useState<Form | null>(null);
  const [selectedField, setSelectedField] = useState<FormField | null>(null);
  const [showNewFormModal, setShowNewFormModal] = useState(false);
  const [showEmbedModal, setShowEmbedModal] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [saveProgress, setSaveProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<'forms' | 'preview' | 'settings'>('forms');
  const [leftPanelTab, setLeftPanelTab] = useState<'quickadd' | 'fieldsettings'>('quickadd');

  useEffect(() => {
    if (forms.length > 0 && !currentForm && isInitialLoad) {
        setCurrentForm(forms[0]);
        setIsInitialLoad(false);
    }
    }, [forms, currentForm, isInitialLoad]);

  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  useEffect(() => {
    if (selectedField) {
      setLeftPanelTab('fieldsettings');
    }
  }, [selectedField]);

  const handleSaveForm = async () => {
    if (!currentForm) return;

    setSaveProgress(0);
    const progressInterval = setInterval(() => {
      setSaveProgress(prev => (prev >= 90 ? prev : prev + 10));
    }, 100);

    try {
      if (currentForm.id) {
        await updateForm(currentForm.id, {
          name: currentForm.name,
          description: currentForm.description,
          settings: currentForm.settings,
          fields: currentForm.fields,
          status: currentForm.status,
        });
      } else {
        const newForm = await addForm({
          name: currentForm.name,
          description: currentForm.description,
          settings: currentForm.settings,
          fields: currentForm.fields,
          status: currentForm.status,
        });
        setCurrentForm(newForm);
      }
      setSaveProgress(100);
      setAlert({ type: 'success', message: 'Form saved successfully!' });
    } catch (error: any) {
      setAlert({ type: 'error', message: error.message || 'Error saving form' });
    } finally {
      clearInterval(progressInterval);
      setTimeout(() => setSaveProgress(0), 1000);
    }
  };

  const handleCreateNewForm = async (name: string) => {
    const defaultForm = createDefaultForm();
    const newForm = await addForm({ ...defaultForm, name });
    setCurrentForm(newForm);
    setSelectedField(null);
    setShowNewFormModal(false);
    setActiveTab('preview');
  };

  const handleLoadForm = (form: Form) => {
    setCurrentForm(form);
    setSelectedField(null);
    setActiveTab('preview');
  };

  const handleDeleteForm = async (formId: number) => {
    if (!confirm('Are you sure you want to delete this form?')) return;
    
    try {
      await deleteForm(formId);
      setAlert({ type: 'success', message: 'Form deleted successfully!' });
      if (currentForm?.id === formId) {
        setCurrentForm(forms.find(f => f.id !== formId) || null);
        setActiveTab('forms');
      }
    } catch (error: any) {
      setAlert({ type: 'error', message: error.message || 'Error deleting form' });
    }
  };

  const handlePublish = async () => {
    if (!currentForm?.id) return;
    
    try {
      await updateFormStatus(currentForm.id, 'published');
      setCurrentForm(prev => prev ? { ...prev, status: 'published' } : null);
      setAlert({ type: 'success', message: 'Form published successfully!' });
    } catch (error: any) {
      setAlert({ type: 'error', message: error.message || 'Error publishing form' });
    }
  };

  const handleAddField = (field: FormField) => {
    if (!currentForm) return;
    setCurrentForm({
      ...currentForm,
      fields: [...currentForm.fields, field],
    });
  };

  const handleUpdateField = (fieldId: string, updatedField: FormField) => {
    if (!currentForm) return;
    setCurrentForm({
      ...currentForm,
      fields: currentForm.fields.map(f => f.id === fieldId ? updatedField : f),
    });
    if (selectedField?.id === fieldId) {
      setSelectedField(updatedField);
    }
  };

  const handleDeleteField = (fieldId: string) => {
    if (!currentForm) return;
    setCurrentForm({
      ...currentForm,
      fields: currentForm.fields.filter(f => f.id !== fieldId),
    });
    if (selectedField?.id === fieldId) {
      setSelectedField(null);
      setLeftPanelTab('quickadd');
    }
  };

  const handleMoveField = (fieldId: string, direction: 'up' | 'down') => {
    if (!currentForm) return;
    const fields = [...currentForm.fields];
    const index = fields.findIndex(f => f.id === fieldId);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= fields.length) return;

    [fields[index], fields[newIndex]] = [fields[newIndex], fields[index]];
    setCurrentForm({ ...currentForm, fields });
  };

  const getStatusBadge = () => {
    if (!currentForm) return null;
    const colors: Record<string, any> = {
      draft: 'warning',
      published: 'success',
      archived: 'gray',
    };
    return (
      <Badge color={colors[currentForm.status] || 'info'} size="xs">
        {currentForm.status}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen">
      {/* mobile header */}
      <div className="lg:hidden px-4 pb-5">
        <div className="flex items-center justify-between mb-4 gap-3">
          <div className="flex items-center gap-3">
            <div className="relative inline-flex items-center justify-center w-10 h-10 overflow-hidden bg-black rounded-full">
              <HiDocumentDuplicate className="w-5 h-5 text-white" />
            </div>
            <div className="font-medium">
              <div className="flex items-center gap-2">
                <span className="text-2xl sm:text-3xl font-bold text-gray-900">
                  Form Builder ({forms.length})
                </span>
              </div>
              <div className="text-xs text-gray-500">
                Create beautiful forms
              </div>
            </div>
          </div>
        </div>

        {/* mobile action buttons */}
        <div className="space-y-2 mb-4">
          <Button
            size="sm"
            color="light"
            onClick={() => setShowNewFormModal(true)}
            className="w-full cursor-pointer"
          >
            <HiPlus className="mr-2 h-4 w-4" />
            New Form
          </Button>
          
          <div className="grid grid-cols-3 gap-2">
            <Button
              size="sm"
              color="gray"
              onClick={handleSaveForm}
              disabled={loading || !currentForm}
              className="cursor-pointer w-full"
            >
              <HiSave className="mr-1 h-3 w-3" />
              <span className="text-xs">Save</span>
            </Button>
            <Button
              size="sm"
              color="success"
              onClick={handlePublish}
              disabled={loading || !currentForm?.id}
              className="cursor-pointer w-full border border-gray-400"
            >
              <HiEye className="mr-1 h-3 w-3" />
              <span className="text-xs">Publish</span>
            </Button>
            <Button
              size="sm"
              color="gray"
              onClick={() => setShowEmbedModal(true)}
              disabled={!currentForm?.id}
              className="cursor-pointer w-full"
            >
              <HiLink className="mr-1 h-3 w-3" />
              <span className="text-xs">Embed</span>
            </Button>
          </div>
        </div>

        {/* mobile alert */}
        {alert && (
          <div className="mb-3">
            <Alert color={alert.type === 'success' ? 'success' : 'failure'} onDismiss={() => setAlert(null)}>
              <span className="text-xs">
                <span className="font-medium">{alert.type === 'success' ? 'Success!' : 'Error!'}</span> {alert.message}
              </span>
            </Alert>
          </div>
        )}

        {/* mobile tabs */}
        <div className="bg-white rounded-lg border border-gray-200 mb-3">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('forms')}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'forms'
                    ? 'border-gray-500 text-gray-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <HiViewList className="w-4 h-4" />
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                disabled={!currentForm}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 text-xs font-medium border-b-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
                  activeTab === 'preview'
                    ? 'border-gray-500 text-gray-600 bg-gray-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <HiEye className="w-4 h-4" />
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                disabled={!currentForm}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 text-xs font-medium border-b-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
                  activeTab === 'settings'
                    ? 'border-gray-500 text-gray-600 bg-gray-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <HiCog className="w-4 h-4" />
              </button>
            </nav>
          </div>

          {currentForm && activeTab !== 'forms' && (
            <div className="flex items-center justify-between gap-2 px-3 py-2 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs text-gray-500">Editing:</span>
                <span className="text-xs font-semibold text-gray-900 truncate">{currentForm.name}</span>
              </div>
              {getStatusBadge()}
            </div>
          )}
        </div>

        {/* mobile content */}
        {activeTab === 'forms' && (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <FormList
              forms={forms}
              currentForm={currentForm}
              onLoadForm={handleLoadForm}
              onDeleteForm={handleDeleteForm}
              onNewForm={() => setShowNewFormModal(true)}
              loading={loading}
            />
          </div>
        )}

        {activeTab === 'preview' && currentForm && (
          <MobileFormBuilder
            currentForm={currentForm}
            selectedField={selectedField}
            loading={loading}
            onSaveForm={handleSaveForm}
            onPublish={handlePublish}
            onShowEmbed={() => setShowEmbedModal(true)}
            onShowNewForm={() => setShowNewFormModal(true)}
            onSelectField={setSelectedField}
            onUpdateField={handleUpdateField}
            onDeleteField={handleDeleteField}
            onMoveField={handleMoveField}
            onAddField={handleAddField}
          />
        )}

        {activeTab === 'settings' && currentForm && (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Form Settings</h3>
                <p className="text-xs text-gray-600 mt-1">
                  Customize <span className="font-semibold text-gray-600">{currentForm.name}</span>
                </p>
              </div>
            </div>
            <FormSettingsPanel
              form={currentForm}
              onUpdate={(updates: Partial<Form>) => setCurrentForm({ ...currentForm, ...updates })}
            />
          </div>
        )}

        {!currentForm && activeTab !== 'forms' && (
          <div className="bg-white rounded-lg border border-gray-200 flex items-center justify-center py-16">
            <div className="text-center px-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-4">
                <HiDocumentDuplicate className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">No form selected</h3>
              <p className="text-xs text-gray-500 mb-4">Create or select a form to get started</p>
              <Button size="sm" color="gray" onClick={() => setActiveTab('forms')} className='cursor-pointer'>
                <HiViewList className="mr-2 h-4 w-4" />
                View Forms
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* desktop header */}
      <div className="hidden lg:block px-4 sm:px-5 pb-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-4">
            <div className="relative inline-flex items-center justify-center w-12 h-12 overflow-hidden bg-black rounded-full">
              <HiDocumentDuplicate className="w-6 h-6 text-white" />
            </div>
            <div className="font-medium">
              <div className="flex items-center gap-2">
                <span className="text-2xl sm:text-3xl font-bold text-gray-900">
                  Form Builder ({forms.length})
                </span>
              </div>
              <div className="text-sm text-gray-500">
                Create beautiful forms with drag-and-drop simplicity
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {loading && saveProgress > 0 && (
              <div className="hidden sm:block w-32">
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="bg-gray-600 h-1.5 rounded-full transition-all" 
                    style={{ width: `${saveProgress}%` }}
                  />
                </div>
              </div>
            )}

            <Button
              size="sm"
              color="light"
              onClick={() => setShowNewFormModal(true)}
              className="cursor-pointer"
            >
              <HiPlus className="mr-2 h-4 w-4" />
              New Form
            </Button>

            <Button
              size="sm"
              color="gray"
              onClick={handleSaveForm}
              disabled={loading || !currentForm}
              className="cursor-pointer"
            >
              <HiSave className="mr-2 h-4 w-4" />
              Save
            </Button>

            <Button
              size="sm"
              color="success"
              onClick={handlePublish}
              disabled={loading || !currentForm?.id}
              className="cursor-pointer border border-gray-400 hidden md:flex" 
            >
              <HiEye className="mr-2 h-4 w-4" />
              Publish
            </Button>

            <Button
              size="sm"
              color="gray"
              onClick={() => setShowEmbedModal(true)}
              disabled={!currentForm?.id}
              className="cursor-pointer"
            >
              <HiLink className="mr-2 h-4 w-4" />
              Embed
            </Button>
          </div>
        </div>

        {/* alert */}
        {alert && (
          <div className="mb-4">
            <Alert color={alert.type === 'success' ? 'success' : 'failure'} onDismiss={() => setAlert(null)}>
              <span className="text-sm">
                <span className="font-medium">{alert.type === 'success' ? 'Success!' : 'Error!'}</span> {alert.message}
              </span>
            </Alert>
          </div>
        )}

        {/* horizontal tabs */}
        <div className="bg-white rounded-lg border border-gray-200 mb-4">
          <div className="border-b border-gray-200">
            <nav className="flex items-center justify-between">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('forms')}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
                    activeTab === 'forms'
                      ? 'border-gray-500 text-gray-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <HiViewList className="w-5 h-5" />
                  Forms
                </button>
                <button
                  onClick={() => setActiveTab('preview')}
                  disabled={!currentForm}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
                    activeTab === 'preview'
                      ? 'border-gray-500 text-gray-600 bg-gray-50'
                      : currentForm && activeTab === 'settings'
                        ? 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300 bg-gray-100'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <HiEye className="w-5 h-5" />
                  Preview
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  disabled={!currentForm}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
                    activeTab === 'settings'
                      ? 'border-gray-500 text-gray-600 bg-gray-50'
                      : currentForm && activeTab === 'preview' 
                        ? 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300 bg-gray-100'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <HiCog className="w-5 h-5" />
                  Settings
                </button>
              </div>

              {/* editing badge on menu bar */}
              {currentForm && activeTab !== 'forms' && (
                <div className="flex items-center gap-2 px-6 py-2">
                  <span className="text-xs text-gray-500">Editing:</span>
                  <span className="text-sm font-semibold text-gray-900">{currentForm.name}</span>
                  {getStatusBadge()}
                </div>
              )}
            </nav>
          </div>
        </div>

        {/* content area - desktop */}
        <div>
          {/* forms tab */}
          {activeTab === 'forms' && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <FormList
                forms={forms}
                currentForm={currentForm}
                onLoadForm={handleLoadForm}
                onDeleteForm={handleDeleteForm}
                onNewForm={() => setShowNewFormModal(true)}
                loading={loading}
              />
            </div>
          )}

          {/* preview tab */}
          {activeTab === 'preview' && currentForm && (
            <div className="grid grid-cols-12 gap-4">
              {/* left panel with tabs */}
              <div className="col-span-12 lg:col-span-4 xl:col-span-3">
                <div className="sticky top-4 space-y-3">
                  <div className="bg-white rounded-lg border border-gray-200">
                    {/* tabs */}
                    <div className="border-b border-gray-200">
                      <nav className="flex">
                        <button
                          onClick={() => setLeftPanelTab('quickadd')}
                          className={`flex-1 px-4 py-3 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
                            leftPanelTab === 'quickadd'
                              ? 'border-gray-500 text-gray-600 bg-gray-50'
                              : 'border-transparent text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          Quick Add
                        </button>
                        <button
                          onClick={() => setLeftPanelTab('fieldsettings')}
                          className={`flex-1 px-4 py-3 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
                            leftPanelTab === 'fieldsettings'
                              ? 'border-gray-500 text-gray-600 bg-gray-50'
                              : 'border-transparent text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          Field Settings
                        </button>
                      </nav>
                    </div>

                    {/* tab content */}
                    <div className="p-4">
                      {leftPanelTab === 'quickadd' && (
                        <div>
                          <h4 className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wide">Add Fields</h4>
                          <FieldTypesPanel 
                            onAddField={handleAddField}
                            compact={true}
                          />
                        </div>
                      )}

                      {leftPanelTab === 'fieldsettings' && (
                        <div>
                          {selectedField ? (
                            <FieldSettingsPanel
                              field={selectedField}
                              onUpdate={handleUpdateField}
                              onDelete={handleDeleteField}
                              onClose={() => {
                                setSelectedField(null);
                                setLeftPanelTab('quickadd');
                              }}
                            />
                          ) : (
                            <div className="text-center py-12">
                              <HiCog className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                              <p className="text-sm text-gray-500">Select a field to edit its settings</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* hint about settings tab */}
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <HiCog className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-gray-900">Customize Form Style</p>
                        <p className="text-xs text-gray-700 mt-0.5">
                          Use the <button 
                            onClick={() => setActiveTab('settings')} 
                            className="font-semibold underline cursor-pointer hover:text-gray-900"
                          >
                            Settings tab
                          </button> to change colors, fonts, and more.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* right panel - form preview */}
              <div className="col-span-12 lg:col-span-8 xl:col-span-9">
                <FormPreview
                  form={currentForm}
                  selectedField={selectedField}
                  onSelectField={setSelectedField}
                  onUpdateField={handleUpdateField}
                  onDeleteField={handleDeleteField}
                  onMoveField={handleMoveField}
                />
              </div>
            </div>
          )}

          {/* settings tab */}
          {activeTab === 'settings' && currentForm && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              {/* header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Form Settings</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Customize colors, fonts, and styling for <span className="font-semibold text-gray-600">{currentForm.name}</span>
                  </p>
                </div>
                <Button
                  size="sm"
                  color="light"
                  onClick={() => setActiveTab('preview')}
                  className="cursor-pointer"
                >
                  <HiEye className="mr-2 h-4 w-4" />
                  Back to Preview
                </Button>
              </div>

              <FormSettingsPanel
                form={currentForm}
                onUpdate={(updates: Partial<Form>) => setCurrentForm({ ...currentForm, ...updates })}
              />
            </div>
          )}

          {/* empty state */}
          {!currentForm && activeTab !== 'forms' && (
            <div className="bg-white rounded-lg border border-gray-200 flex items-center justify-center py-24">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <HiDocumentDuplicate className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No form selected</h3>
                <p className="text-sm text-gray-500 mb-4">Create or select a form to get started</p>
                <Button size="sm" color="gray" onClick={() => setActiveTab('forms')} className='cursor-pointer'>
                  <HiViewList className="mr-2 h-4 w-4" />
                  View Forms
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* modals */}
      <NewFormModal
        show={showNewFormModal}
        onClose={() => setShowNewFormModal(false)}
        onCreate={handleCreateNewForm}
      />

      {currentForm?.id && (
        <EmbedCodeModal
          show={showEmbedModal}
          onClose={() => setShowEmbedModal(false)}
          formId={currentForm.id}
          formName={currentForm.name}
        />
      )}
    </div>
  );
};

export default FormBuilder;