import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Trash2, Loader } from 'lucide-react';
import DraggableModalWrapper from '../ui/DraggableModalWrapper';

interface ChannelSettingsModalSimpleProps {
  isOpen: boolean;
  onClose: () => void;
  channelName: string;
  channelPurpose?: string | null | undefined;
  onSave: (data: { name: string; purpose: string | null }) => Promise<void>;
  onDeleteChannel: () => void;
}

const ChannelSettingsModalSimple: React.FC<ChannelSettingsModalSimpleProps> = ({
  isOpen,
  onClose,
  channelName,
  channelPurpose,
  onSave,
  onDeleteChannel,
}) => {
  const [name, setName] = useState(channelName);
  const [purpose, setPurpose] = useState(channelPurpose || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setName(channelName);
    setPurpose(channelPurpose || '');
  }, [channelName, channelPurpose]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({ 
        name: name.trim(), 
        purpose: purpose.trim() || null 
      });
      onClose();
    } catch (error) {
      console.error('Error saving channel:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40">
      <DraggableModalWrapper isOpen={isOpen} handleSelector=".settings-drag-handle" className="w-[90vw] max-w-md">
        <div className="bg-white  rounded-lg shadow-xl max-h-[85vh] overflow-hidden flex flex-col">
          {/* Header - Draggable */}
          <div className="settings-drag-handle flex items-center justify-between p-4 border-b  cursor-grab active:cursor-grabbing select-none flex-shrink-0">
            <h2 className="text-base font-semibold text-gray-900  pointer-events-none">
              Channel Settings
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600  pointer-events-auto"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Channel Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700  mb-2">
                Channel Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300  rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 bg-white  text-gray-900 "
                placeholder="Enter channel name"
                disabled={isSaving}
              />
            </div>

            {/* Channel Purpose */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700  mb-2">
                Channel Purpose
              </label>
              <textarea
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-300  rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 resize-none bg-white  text-gray-900 "
                placeholder="What is this channel about?"
                disabled={isSaving}
              />
            </div>

            {/* Delete Channel */}
            <button
              onClick={onDeleteChannel}
              disabled={isSaving}
              className="w-full px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete Channel
            </button>
          </div>

          {/* Footer */}
          <div className="flex gap-2 p-4 border-t  bg-gray-50  flex-shrink-0">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700  bg-white  border border-gray-300  rounded-lg hover:bg-gray-50  disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !name.trim()}
              className="flex-1 px-4 py-2 text-sm font-medium bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
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

export default ChannelSettingsModalSimple;