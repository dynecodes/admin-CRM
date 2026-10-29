import { useRef, useState, useEffect, KeyboardEvent, ClipboardEvent, forwardRef, useImperativeHandle } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  Link as LinkIcon, 
  Smile, 
  Paperclip,
  Plus,
  Type,
  X
} from 'lucide-react';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { HexColorPicker } from 'react-colorful';
import DOMPurify from 'dompurify';

interface RichTextInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (attachment?: { data: string; name: string; type: string } | null) => void;
  disabled?: boolean;
  placeholder?: string;
  hideAttachment?: boolean;
}

export interface RichTextInputRef {
  getEditorElement: () => HTMLDivElement | null;
}

const RichTextInput = forwardRef<RichTextInputRef, RichTextInputProps>(({ 
  value, 
  onChange, 
  onSend, 
  disabled = false,
  placeholder = "Type a message...",
  hideAttachment = false
}, ref) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showFormatting, setShowFormatting] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [currentColor, setCurrentColor] = useState('#000000');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Track active formatting states
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
  });

  // Expose the editor element to parent
  useImperativeHandle(ref, () => ({
    getEditorElement: () => editorRef.current,
  }));

  // Check active formats
  const updateActiveFormats = () => {
    try {
      setActiveFormats({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        strikethrough: document.queryCommandState('strikeThrough'),
      });
    } catch (e) {
      // Ignore errors
    }
  };

  // Sync external value to contentEditable
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      const selection = window.getSelection();
      const range = selection?.rangeCount ? selection.getRangeAt(0).cloneRange() : null;
      
      editorRef.current.innerHTML = value;
      
      // Restore cursor position if possible
      if (range && editorRef.current.contains(range.startContainer)) {
        try {
          selection?.removeAllRanges();
          selection?.addRange(range);
        } catch (e) {
          // Ignore errors if range is invalid
        }
      }
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      onChange(html);
      updateActiveFormats();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleKeyUp = () => {
    updateActiveFormats();
  };

  const handleMouseUp = () => {
    updateActiveFormats();
  };

  const handlePaste = (e: ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  };

  const applyFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
    updateActiveFormats();
  };

  const applyColor = (color: string) => {
    applyFormat('foreColor', color);
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      const sanitizedUrl = DOMPurify.sanitize(url, { 
        ALLOWED_TAGS: [], 
        ALLOWED_ATTR: [] 
      });
      applyFormat('createLink', sanitizedUrl);
    }
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand('insertText', false, emojiData.emoji);
      handleInput();
      setShowEmojiPicker(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      
      // Auto-send the file immediately
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = () => {
        const attachmentData = {
          data: reader.result as string,
          name: file.name,
          type: file.type
        };
        onSend(attachmentData);
        
        // Clear file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      };
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSend = async () => {
    if (value.trim() || selectedFile) {
      let attachmentData = null;
      
      if (selectedFile) {
        // Convert file to base64
        const reader = new FileReader();
        reader.readAsDataURL(selectedFile);
        
        await new Promise<void>((resolve) => {
          reader.onload = () => {
            attachmentData = {
              data: reader.result as string,
              name: selectedFile.name,
              type: selectedFile.type
            };
            resolve();
          };
        });
      }
      
      onSend(attachmentData);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="relative">
      {/* Input Area with conditional buttons on the right */}
      <div className="mb-2">
        <div className="relative flex items-end gap-1 md:gap-2">
          {/* Text input - flex-1 to take remaining space */}
          <div className="flex-1 relative">
            <div
              ref={editorRef}
              contentEditable={!disabled}
              onInput={handleInput}
              onKeyDown={handleKeyDown}
              onKeyUp={handleKeyUp}
              onMouseUp={handleMouseUp}
              onPaste={handlePaste}
              className="min-h-[42px] max-h-[150px] md:max-h-[200px] overflow-y-auto px-2 md:px-3 py-1.5 md:py-2 border border-gray-300  rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white  text-gray-900  text-sm md:text-base disabled:bg-gray-100  outline-none"
              data-placeholder={placeholder}
              style={{
                wordWrap: 'break-word',
                whiteSpace: 'pre-wrap'
              }}
            />
            {!value && (
              <div className="absolute top-1.5 md:top-2 left-2 md:left-3 text-gray-400  pointer-events-none text-sm md:text-base">
                {placeholder}
              </div>
            )}
          </div>

          {/* Buttons on the right - only shown when formatting is HIDDEN */}
          {!showFormatting && (
            <div className="flex items-center gap-0.5 md:gap-1">
              {/* Toggle Formatting Button */}
              <button
                type="button"
                onClick={() => setShowFormatting(!showFormatting)}
                className="p-1.5 md:p-2 hover:bg-gray-100  rounded-md transition-colors"
                title="Show formatting"
                disabled={disabled}
              >
                <Type className="w-4 h-4 md:w-5 md:h-5 text-gray-600 " />
              </button>

              {/* Emoji Picker */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-1.5 md:p-2 hover:bg-gray-100  rounded-md transition-colors"
                  title="Add emoji"
                  disabled={disabled}
                >
                  <Smile className="w-4 h-4 md:w-5 md:h-5 text-gray-600 " />
                </button>

                {showEmojiPicker && (
                  <div className="absolute bottom-full right-0 mb-2 z-50">
                    <div className="scale-75 md:scale-100 origin-bottom-right">
                      <EmojiPicker 
                        onEmojiClick={handleEmojiClick}
                        width={280}
                        height={350}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Attachment */}
              {!hideAttachment && (
              <div className="relative">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-1.5 md:p-2 rounded-md transition-colors ${
                    selectedFile
                      ? 'bg-blue-100  text-blue-600 '
                      : 'hover:bg-gray-100  text-gray-600 '
                  }`}
                  title="Attach file"
                  disabled={disabled}
                >
                  <Paperclip className="w-4 h-4 md:w-5 md:h-5" />
                </button>

                {/* Show selected file preview */}
                {selectedFile && (
                  <div className="absolute bottom-full mb-2 right-0 bg-white  border border-gray-200  rounded-lg p-2 flex items-center gap-2 shadow-lg whitespace-nowrap max-w-[200px] md:max-w-none">
                    <Paperclip className="w-3 h-3 md:w-4 md:h-4 text-gray-600  flex-shrink-0" />
                    <span className="text-xs md:text-sm text-gray-700  max-w-[120px] md:max-w-[200px] truncate">
                      {selectedFile.name}
                    </span>
                    <button
                      onClick={handleRemoveFile}
                      className="ml-1 md:ml-2 p-0.5 md:p-1 hover:bg-gray-200  rounded"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Formatting Toolbar - BELOW THE INPUT - only shown when formatting is visible */}
      {showFormatting && (
        <div className="flex items-center justify-between gap-1 md:gap-2 p-1.5 md:p-2 bg-gray-50  rounded-lg border border-gray-200 ">
          {/* Left side - Formatting buttons */}
          <div className="flex items-center gap-0.5 md:gap-1">
            {/* Plus icon for future additions - Hidden on mobile */}
            <button
              type="button"
              className="hidden md:block p-1.5 hover:bg-gray-200  rounded transition-colors flex-shrink-0"
              title="More options"
              disabled={disabled}
            >
              <Plus className="w-4 h-4 text-gray-600 " />
            </button>

            <div className="hidden md:block w-px h-6 bg-gray-300  mx-1" />

            {/* Bold */}
            <button
              type="button"
              onClick={() => applyFormat('bold')}
              className={`p-1 md:p-1.5 rounded transition-colors flex-shrink-0 ${
                activeFormats.bold
                  ? 'bg-blue-200  text-blue-700 '
                  : 'hover:bg-gray-200  text-gray-600 '
              }`}
              title="Bold (Ctrl+B)"
              disabled={disabled}
            >
              <Bold className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </button>

            {/* Italic */}
            <button
              type="button"
              onClick={() => applyFormat('italic')}
              className={`p-1 md:p-1.5 rounded transition-colors flex-shrink-0 ${
                activeFormats.italic
                  ? 'bg-blue-200  text-blue-700 '
                  : 'hover:bg-gray-200  text-gray-600 '
              }`}
              title="Italic (Ctrl+I)"
              disabled={disabled}
            >
              <Italic className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </button>

            {/* Underline */}
            <button
              type="button"
              onClick={() => applyFormat('underline')}
              className={`p-1 md:p-1.5 rounded transition-colors flex-shrink-0 ${
                activeFormats.underline
                  ? 'bg-blue-200  text-blue-700 '
                  : 'hover:bg-gray-200  text-gray-600 '
              }`}
              title="Underline (Ctrl+U)"
              disabled={disabled}
            >
              <Underline className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </button>

            {/* Strikethrough */}
            <button
              type="button"
              onClick={() => applyFormat('strikeThrough')}
              className={`p-1 md:p-1.5 rounded transition-colors flex-shrink-0 ${
                activeFormats.strikethrough
                  ? 'bg-blue-200  text-blue-700 '
                  : 'hover:bg-gray-200  text-gray-600 '
              }`}
              title="Strikethrough"
              disabled={disabled}
            >
              <Strikethrough className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </button>

            <div className="w-px h-5 md:h-6 bg-gray-300  mx-0.5 md:mx-1" />

            {/* Color Picker */}
            <button
              type="button"
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="p-1 md:p-1.5 hover:bg-gray-200  rounded transition-colors flex-shrink-0"
              title="Text color"
              disabled={disabled}
            >
              <div className="flex items-center gap-1">
                <div className="w-3.5 h-3.5 md:w-4 md:h-4 rounded-full border-2 border-gray-400" 
                    style={{ backgroundColor: currentColor }} 
                />
              </div>
            </button>

            {/* Link - Hidden on very small screens */}
            <button
              type="button"
              onClick={insertLink}
              className="hidden sm:block p-1 md:p-1.5 hover:bg-gray-200  rounded transition-colors flex-shrink-0"
              title="Insert link"
              disabled={disabled}
            >
              <LinkIcon className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-600 " />
            </button>
          </div>

          {/* Right side - Toggle formatting, Emoji, Attach (original order) */}
          <div className="flex items-center gap-0.5 md:gap-1">
            {/* Toggle Formatting Button */}
            <button
              type="button"
              onClick={() => setShowFormatting(!showFormatting)}
              className={`p-1.5 md:p-2 rounded-md transition-colors ${
                showFormatting 
                  ? 'bg-blue-100  text-blue-600 ' 
                  : 'hover:bg-gray-200  text-gray-600 '
              }`}
              title="Hide formatting"
              disabled={disabled}
            >
              <Type className="w-4 h-4 md:w-5 md:h-5" />
            </button>

            {/* Emoji Picker */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-1.5 md:p-2 hover:bg-gray-200  rounded-md transition-colors"
                title="Add emoji"
                disabled={disabled}
              >
                <Smile className="w-4 h-4 md:w-5 md:h-5 text-gray-600 " />
              </button>

              {showEmojiPicker && (
                <div className="absolute bottom-full right-0 mb-2 z-50">
                  <div className="scale-75 md:scale-100 origin-bottom-right">
                    <EmojiPicker 
                      onEmojiClick={handleEmojiClick}
                      width={280}
                      height={350}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Attachment */}
            {!hideAttachment && (
            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`p-1.5 md:p-2 rounded-md transition-colors ${
                  selectedFile
                    ? 'bg-blue-100  text-blue-600 '
                    : 'hover:bg-gray-200  text-gray-600 '
                }`}
                title="Attach file"
                disabled={disabled}
              >
                <Paperclip className="w-4 h-4 md:w-5 md:h-5" />
              </button>

              {/* Show selected file preview */}
              {selectedFile && (
                <div className="absolute bottom-full mb-2 right-0 bg-white  border border-gray-200  rounded-lg p-2 flex items-center gap-2 shadow-lg whitespace-nowrap max-w-[200px] md:max-w-none">
                  <Paperclip className="w-3 h-3 md:w-4 md:h-4 text-gray-600  flex-shrink-0" />
                  <span className="text-xs md:text-sm text-gray-700  max-w-[120px] md:max-w-[200px] truncate">
                    {selectedFile.name}
                  </span>
                  <button
                    onClick={handleRemoveFile}
                    className="ml-1 md:ml-2 p-0.5 md:p-1 hover:bg-gray-200  rounded"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          )}
          </div>
        </div>
      )}
      
      {/* Color Picker Portal - Outside toolbar to avoid overflow issues */}
      {showColorPicker && (
        <div className="fixed inset-0 z-[1000]" onClick={() => setShowColorPicker(false)}>
          <div 
            className="absolute bottom-20 left-1/2 -translate-x-1/2 p-2 md:p-3 bg-white  rounded-lg shadow-xl border border-gray-200 "
            onClick={(e) => e.stopPropagation()}
          >
            <div className="scale-75 md:scale-100 origin-bottom">
              <HexColorPicker color={currentColor} onChange={(color) => {
                setCurrentColor(color);
                applyColor(color);
              }} />
            </div>
            <button
              type="button"
              onClick={() => setShowColorPicker(false)}
              className="mt-2 w-full px-2 md:px-3 py-1 text-xs md:text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

RichTextInput.displayName = 'RichTextInput';

export default RichTextInput;