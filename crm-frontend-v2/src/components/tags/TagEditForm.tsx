import React, { useState } from 'react';
import { Label, Button } from 'flowbite-react';
import { TagColor } from '../../types/tag';
import { HiTrash } from 'react-icons/hi';

interface TagEditFormProps {
  tag: any;
  onSave: (data: any) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

const TAG_COLORS: Record<TagColor, { primary: string; bg: string; label: string; textColor?: string }> = {
  blue: { primary: '#1976f2', bg: '#e3f2fd', label: 'Blue' },
  yellow: { primary: '#f5f117', bg: '#ffffe0', label: 'Yellow', textColor: '#1a1a1a' },
  orange: { primary: '#ff9800', bg: '#fff3e0', label: 'Orange' },
  purple: { primary: '#9c27b0', bg: '#f3e5f5', label: 'Purple' },
};

const COLOR_ORDER: TagColor[] = ['blue', 'yellow', 'orange', 'purple'];

const TagEditForm: React.FC<TagEditFormProps> = ({ tag, onSave, onCancel, onDelete }) => {
  const [tagName, setTagName] = useState(tag.tag_name);
  const [tagColor, setTagColor] = useState<TagColor>(tag.tag_color);
  const [nameError, setNameError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tagName.trim()) {
      setNameError('Tag name is required');
      return;
    }

    if (nameError) return;

    setSubmitting(true);
    try {
      await onSave({
        tag_name: tagName.trim(),
        tag_color: tagColor
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className='lg:col-span-2'>
          <Label htmlFor={`tag-name-${tag.id}`} className="mb-1 block text-xs">
            Tag Name
          </Label>
          <input
            id={`tag-name-${tag.id}`}
            type="text"
            value={tagName}
            onChange={(e) => {
              setTagName(e.target.value);
              if (nameError) setNameError('');
            }}
            required
            maxLength={40}
            className="block w-full px-2.5 py-2 text-xs text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          />
          {nameError && <p className="mt-1 text-xs text-red-500">{nameError}</p>}
        </div>
      </div>

      <div>
        <Label className="mb-2 block text-xs">Choose Color</Label>
        <div className="flex gap-2">
          {COLOR_ORDER.map((color) => {
            const config = TAG_COLORS[color];
            const isSelected = tagColor === color;
            
            return (
              <div 
                key={color}
                className="flex flex-col items-center gap-1 cursor-pointer"
                onClick={() => setTagColor(color)}
              >
                <div
                  className={`w-6 h-6 rounded transition-all duration-200 hover:scale-110 shadow-sm ${
                    isSelected ? 'ring-2 ring-gray-900 ring-offset-1' : ''
                  }`}
                  style={{ backgroundColor: config.primary }}
                />
                <span className="text-xs text-gray-600">{config.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
        {onDelete && (
          <Button
            type="button"
            color="red"
            size="xs"
            onClick={onDelete}
            className="cursor-pointer lg:hidden w-20"
          >
            <HiTrash className="mr-1 h-3 w-3" />
            Delete
          </Button>
        )}
        <Button color="gray" onClick={onCancel} size="xs" className='cursor-pointer w-20'>
          Cancel
        </Button>
        <Button 
          type="submit" 
          color="blue" 
          size="xs"
          className='cursor-pointer w-20'
          disabled={submitting || !tagName.trim() || !!nameError}
        >
          {submitting ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </form>
  );
};

export default TagEditForm;