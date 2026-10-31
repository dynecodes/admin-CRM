import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Upload, Loader } from 'lucide-react';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import DraggableModalWrapper from '../ui/DraggableModalWrapper';

interface UpdateChannelAvatarModalProps {
  isOpen: boolean;
  onClose: () => void;
  channelName: string;
  currentAvatar?: string;
  currentEmoji?: string;
  currentEmojiColor?: string;
  onSave: (data: {
    type: 'image' | 'emoji';
    imageFile?: string;
    emoji?: string;
    emojiColor?: string;
  }) => Promise<void>;
}

const EMOJI_COLORS = [
  { name: 'Transparent', value: 'transparent', class: 'bg-transparent' },
  { name: 'Red', value: 'red-500', class: 'bg-red-500' },
  { name: 'Orange', value: 'orange-500', class: 'bg-orange-500' },
  { name: 'Yellow', value: 'yellow-500', class: 'bg-yellow-500' },
  { name: 'Green', value: 'green-500', class: 'bg-green-500' },
  { name: 'Teal', value: 'teal-500', class: 'bg-teal-500' },
  { name: 'Sky', value: 'sky-400', class: 'bg-sky-400' },
  { name: 'Blue', value: 'blue-500', class: 'bg-blue-500' },
  { name: 'Indigo', value: 'indigo-500', class: 'bg-indigo-500' },
  { name: 'Purple', value: 'purple-500', class: 'bg-purple-500' },
  { name: 'Pink', value: 'pink-500', class: 'bg-pink-500' },
];

const UpdateChannelAvatarModal: React.FC<UpdateChannelAvatarModalProps> = ({
  isOpen,
  onClose,
  channelName,
  currentAvatar,
  currentEmoji,
  currentEmojiColor,
  onSave,
}) => {
  const [selectedType, setSelectedType] = useState<'image' | 'emoji'>(currentEmoji ? 'emoji' : 'image');
  const [selectedEmoji, setSelectedEmoji] = useState(currentEmoji || '');
  const [selectedColor, setSelectedColor] = useState(currentEmojiColor || 'transparent');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(currentAvatar || '');
  const [isSaving, setIsSaving] = useState(false);
  const [pickerKey, setPickerKey] = useState(Date.now());
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedType(currentEmoji ? 'emoji' : 'image');
      setSelectedEmoji(currentEmoji || '');
      setSelectedColor(currentEmojiColor || 'transparent');
      setImageFile(null);
      setImagePreview(currentAvatar || '');
      setPickerKey(Date.now());
    }
  }, [isOpen, currentAvatar, currentEmoji, currentEmojiColor]);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setSelectedType('image');
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setSelectedEmoji(emojiData.emoji);
    setSelectedType('emoji');
  };

  const handleSave = async () => {
    if (selectedType === 'image' && imageFile) {
      setIsSaving(true);
      try {
        const reader = new FileReader();
        reader.readAsDataURL(imageFile);

        reader.onload = async () => {
          try {
            await onSave({
              type: 'image',
              imageFile: reader.result as string,
            });
            onClose();
          } catch (error) {
            console.error('Error saving avatar:', error);
          } finally {
            setIsSaving(false);
          }
        };
      } catch (error) {
        console.error('Error reading file:', error);
        setIsSaving(false);
      }
    } else if (selectedType === 'emoji' && selectedEmoji) {
      setIsSaving(true);
      try {
        await onSave({
          type: 'emoji',
          emoji: selectedEmoji,
          emojiColor: selectedColor,
        });
        onClose();
      } catch (error) {
        console.error('Error saving avatar:', error);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const getPreviewBgClass = () => {
    const colorObj = EMOJI_COLORS.find(c => c.value === selectedColor);
    return colorObj ? colorObj.class : 'bg-transparent';
  };

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40">
      <DraggableModalWrapper isOpen={isOpen} handleSelector=".avatar-drag-handle" className="w-[90vw] max-w-3xl">
        <div className="bg-white rounded-lg shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="avatar-drag-handle flex items-center justify-between p-4 border-b cursor-grab active:cursor-grabbing select-none flex-shrink-0">
            <div className="pointer-events-none">
              <h2 className="text-base font-semibold text-gray-900">Update Channel Avatar</h2>
              <p className="text-xs text-gray-500 mt-0.5">'{channelName}'</p>
            </div>
            <button
              onClick={onClose}
              disabled={isSaving}
              className="text-gray-400 hover:text-gray-600 pointer-events-auto disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 group [&::-webkit-scrollbar]:w-0 hover:[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-gray-400">
            <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6">

              {/* LEFT - PREVIEW */}
              <div className="flex flex-col items-center justify-start">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Preview</h3>
                <div className="flex justify-center">
                  {selectedType === 'image' && imagePreview ? (
                    <div className="w-40 h-40 rounded-xl overflow-hidden border-2 border-gray-200 shadow-lg">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : selectedType === 'emoji' && selectedEmoji ? (
                    <div className="relative w-40 h-40 rounded-xl shadow-lg overflow-hidden">
                      {/* Transparent checkerboard background */}
                      {selectedColor === 'transparent' && (
                        <div 
                          className="absolute inset-0"
                          style={{
                            backgroundImage: `
                              linear-gradient(45deg, #e5e7eb 25%, transparent 25%),
                              linear-gradient(-45deg, #e5e7eb 25%, transparent 25%),
                              linear-gradient(45deg, transparent 75%, #e5e7eb 75%),
                              linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)
                            `,
                            backgroundSize: '20px 20px',
                            backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                          }}
                        />
                      )}
                      <div className={`relative w-full h-full ${getPreviewBgClass()} flex items-center justify-center`}>
                        <span className="text-8xl">{selectedEmoji}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-40 h-40 rounded-xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                      <span className="text-gray-400 text-4xl">?</span>
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT - CONTROLS */}
              <div className="space-y-3">
                {/* Upload Image Button */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Upload Image</h3>
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <div className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors" style={{ pointerEvents: isSaving ? 'none' : 'auto', opacity: isSaving ? 0.5 : 1 }}>
                      <Upload className="w-4 h-4" />
                      {imagePreview && selectedType === 'image' ? 'Change Image' : 'Upload Image'}
                    </div>
                    <input
                      id="file-upload"
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={isSaving}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-gray-500 mt-1.5">PNG, JPG, GIF up to 5MB</p>
                </div>

                {/* OR Divider */}
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-2 bg-white text-gray-500">OR</span>
                  </div>
                </div>

                {/* Emoji Section */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Pick an Emoji</h3>
                  
                  {/* Background Colors */}
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                      Background Color
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {EMOJI_COLORS.map((color) => (
                        <button
                          key={color.value}
                          onClick={() => {
                            setSelectedColor(color.value);
                            if (selectedEmoji) setSelectedType('emoji');
                          }}
                          disabled={isSaving}
                          className={`w-7 h-7 rounded relative overflow-hidden ${
                            selectedColor === color.value && selectedType === 'emoji'
                              ? 'ring-2 ring-blue-500 ring-offset-1'
                              : 'ring-1 ring-gray-200'
                          } transition-all hover:scale-110 disabled:opacity-50`}
                          title={color.name}
                        >
                          {/* Checkerboard pattern for transparent */}
                          {color.value === 'transparent' && (
                            <div 
                              className="absolute inset-0"
                              style={{
                                backgroundImage: `
                                  linear-gradient(45deg, #e5e7eb 25%, transparent 25%),
                                  linear-gradient(-45deg, #e5e7eb 25%, transparent 25%),
                                  linear-gradient(45deg, transparent 75%, #e5e7eb 75%),
                                  linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)
                                `,
                                backgroundSize: '8px 8px',
                                backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px'
                              }}
                            />
                          )}
                          {/* Color overlay */}
                          <div className={`absolute inset-0 ${color.class}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Emoji Picker */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <EmojiPicker
                      key={pickerKey}
                      onEmojiClick={handleEmojiClick}
                      width="100%"
                      height={340}
                      previewConfig={{ showPreview: false }}
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 p-4 border-t bg-gray-50 flex-shrink-0">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={(selectedType === 'image' && !imageFile) || (selectedType === 'emoji' && !selectedEmoji) || isSaving}
              className="flex-1 px-4 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isSaving ? <Loader className="w-4 h-4 animate-spin" /> : null}
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </DraggableModalWrapper>
    </div>,
    document.body
  );
};

export default UpdateChannelAvatarModal;