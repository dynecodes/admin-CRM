import React from 'react';
import { Label, Button } from 'flowbite-react';
import { HiRefresh } from 'react-icons/hi';
import { Form, FormStyle } from '../../types/form';
import {
  TextInput,
} from "../ui/InputsBundle";
interface FormSettingsPanelProps {
  form: Form;
  onUpdate: (updates: Partial<Form>) => void;
}

const fontOptions = [
  'Inter, sans-serif',
  'Arial, sans-serif',
  'Helvetica, sans-serif',
  'Georgia, serif',
  'Times New Roman, serif',
  'Verdana, sans-serif',
  'Courier New, monospace',
];
  const textareaCls =
    "block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 " +
    "text-xs sm:text-sm text-gray-900 placeholder-gray-400 " +
    "focus:border-gray-500 focus:ring-gray-500";

const FormSettingsPanel: React.FC<FormSettingsPanelProps> = ({ form, onUpdate }) => {
  const handleSettingChange = (key: keyof FormStyle, value: string) => {
    onUpdate({
      settings: {
        ...form.settings,
        [key]: value,
      },
    });
  };

  const resetToDefaults = () => {
    onUpdate({
      settings: {
        backgroundColor: '#ffffff',
        borderColor: '#e5e7eb',
        labelColor: '#6b7280',
        labelFont: 'Inter, sans-serif',
        textColor: '#111827',
        textFont: 'Inter, sans-serif',
        headingColor: '#111827',
        headingFont: 'Inter, sans-serif',
        buttonColor: '#1c64f2',
        buttonTextColor: '#ffffff',
        customCSS: '',
      },
    });
  };

  const ColorPicker = ({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (value: string) => void }) => (
    <div>
      <Label htmlFor={id} className="mb-1 text-xs">{label}</Label>
      <div className="flex gap-2 items-center">
        <input
          type="color"
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-14 rounded border border-gray-300 cursor-pointer"
        />
        <TextInput
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 font-mono text-xs"
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* basic info */}
      <div>
        <h4 className="text-xs font-semibold text-gray-900 mb-3 uppercase tracking-wide">Basic Info</h4>
        <div className="space-y-3">
          <div>
            <Label htmlFor="formName" className="mb-1 text-xs">Form Name</Label>
            <TextInput
              id="formName"
              value={form.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              placeholder="Enter form name"   
            />
          </div>

          <div>
            <Label htmlFor="formDescription" className="mb-1 text-xs">Description</Label>
            <textarea
              id="formDescription"
              value={form.description}
              onChange={(e) => onUpdate({ description: e.target.value })}
              placeholder="Brief description..."
              rows={2}
              className={textareaCls}
            />
          </div>
        </div>
      </div>

      <hr className="border-gray-200" />

      {/* 2 columns: color and typography (w/ custom css) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* left column - colors */}
        <div>
          <h4 className="text-xs font-semibold text-gray-900 mb-3 uppercase tracking-wide">Colors</h4>
          <div className="space-y-3">
            <ColorPicker
              id="backgroundColor"
              label="Background"
              value={form.settings.backgroundColor}
              onChange={(value) => handleSettingChange('backgroundColor', value)}
            />
            <ColorPicker
              id="borderColor"
              label="Border"
              value={form.settings.borderColor}
              onChange={(value) => handleSettingChange('borderColor', value)}
            />
            <ColorPicker
              id="headingColor"
              label="Heading"
              value={form.settings.headingColor}
              onChange={(value) => handleSettingChange('headingColor', value)}
            />
            <ColorPicker
              id="labelColor"
              label="Labels"
              value={form.settings.labelColor}
              onChange={(value) => handleSettingChange('labelColor', value)}
            />
            <ColorPicker
              id="textColor"
              label="Text"
              value={form.settings.textColor}
              onChange={(value) => handleSettingChange('textColor', value)}
            />
            <ColorPicker
              id="buttonColor"
              label="Button"
              value={form.settings.buttonColor}
              onChange={(value) => handleSettingChange('buttonColor', value)}
            />
          </div>
        </div>

        {/* right column - typography + custom css */}
        <div>
          {/* typography */}
          <div className="mb-6">
            <h4 className="text-xs font-semibold text-gray-900 mb-3 uppercase tracking-wide">Typography</h4>
            <div className="space-y-3">
              <div>
                <Label htmlFor="headingFont" className="mb-1 text-xs">Heading Font</Label>
                <select
                  id="headingFont"
                  value={form.settings.headingFont}
                  onChange={(e) => handleSettingChange('headingFont', e.target.value)}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-xs rounded-lg focus:ring-gray-500 focus:border-gray-500 block w-full h-9 px-2.5 cursor-pointer"
                >
                  {fontOptions.map((font) => (
                    <option key={font} value={font}>
                      {font.split(',')[0]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="labelFont" className="mb-1 text-xs">Label Font</Label>
                <select
                  id="labelFont"
                  value={form.settings.labelFont}
                  onChange={(e) => handleSettingChange('labelFont', e.target.value)}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-xs rounded-lg focus:ring-gray-500 focus:border-gray-500 block w-full h-9 px-2.5 cursor-pointer"
                >
                  {fontOptions.map((font) => (
                    <option key={font} value={font}>
                      {font.split(',')[0]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="textFont" className="mb-1 text-xs">Text Font</Label>
                <select
                  id="textFont"
                  value={form.settings.textFont}
                  onChange={(e) => handleSettingChange('textFont', e.target.value)}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-xs rounded-lg focus:ring-gray-500 focus:border-gray-500 block w-full h-9 px-2.5 cursor-pointer"
                >
                  {fontOptions.map((font) => (
                    <option key={font} value={font}>
                      {font.split(',')[0]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* custom CSS */}
          <div>
            <h4 className="text-xs font-semibold text-gray-900 mb-3 uppercase tracking-wide">Custom CSS</h4>
            <textarea
              value={form.settings.customCSS}
              onChange={(e) => handleSettingChange('customCSS', e.target.value)}
              placeholder="/* Add custom CSS */"
              rows={9}
              className={textareaCls}
            />
          </div>
        </div>
      </div>

      <hr className="border-gray-200" />

      <Button 
        color="warning" 
        size="xs" 
        className="w-full cursor-pointer" 
        onClick={resetToDefaults}
      >
        <HiRefresh className="mr-2 h-3 w-3" />
        Reset to Defaults
      </Button>
    </div>
  );
};

export default FormSettingsPanel;