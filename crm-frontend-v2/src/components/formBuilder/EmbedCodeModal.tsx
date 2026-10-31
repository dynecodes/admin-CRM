import React, { useState } from 'react';
import { Modal, Button, Badge, Alert } from 'flowbite-react';
import { HiClipboardCopy, HiCheckCircle, HiLink, HiCode, HiExternalLink } from 'react-icons/hi';
import { TextInput } from "../ui/InputsBundle";
interface EmbedCodeModalProps {
  show: boolean;
  onClose: () => void;
  formId: number;
  formName: string;
}

const EmbedCodeModal: React.FC<EmbedCodeModalProps> = ({ show, onClose, formId, formName }) => {
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'link' | 'embed' | 'wordpress'>('link');

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const formUrl = `${baseUrl}/form/${formId}`;

  const iframeCode = `<iframe 
  src="${formUrl}" 
  style="border:none;width:100%;min-height:600px;overflow:hidden" 
  scrolling="no">
</iframe>`;

  const scriptCode = `<script>
  (function() {
    var iframe = document.createElement('iframe');
    iframe.src = '${formUrl}';
    iframe.style.border = 'none';
    iframe.style.width = '100%';
    iframe.style.minHeight = '600px';
    iframe.style.overflow = 'hidden';
    iframe.scrolling = 'no';
    
    window.addEventListener('message', function(event) {
      if (event.origin !== '${baseUrl}') return;
      if (event.data.type === 'resize') {
        iframe.style.height = event.data.height + 'px';
      }
    });
    
    document.getElementById('calirocks-form-${formId}').appendChild(iframe);
  })();
</script>
<div id="calirocks-form-${formId}"></div>`;

  const wordpressShortcode = `[calirocks_form id="${formId}"]`;

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(label);
      setTimeout(() => setCopiedItem(null), 3000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const openPreview = () => {
    window.open(formUrl, '_blank');
  };

  const CopyButton = ({ text, label }: { text: string; label: string }) => (
    <Button
      size="xs"
      color={copiedItem === label ? 'success' : 'gray'}
      onClick={() => copyToClipboard(text, label)}
      className="cursor-pointer flex-shrink-0"
    >
      {copiedItem === label ? (
        <>
          <HiCheckCircle className="w-3 h-3 sm:mr-1" />
          <span className="hidden sm:inline">Copied</span>
        </>
      ) : (
        <>
          <HiClipboardCopy className="w-3 h-3 sm:mr-1" />
          <span className="hidden sm:inline">Copy</span>
        </>
      )}
    </Button>
  );

  return (
    <Modal show={show} onClose={onClose} size="2xl" position="center">
      <div className="p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6 gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">Embed Form</h3>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 truncate">{formName}</p>
          </div>
          <Button
            color="gray"
            size="xs"
            onClick={openPreview}
            className="cursor-pointer flex-shrink-0"
          >
            <HiExternalLink className="w-3 h-3 sm:mr-1" />
            <span className="hidden sm:inline">Preview</span>
          </Button>
        </div>

        {/* tabs */}
        <div className="border-b border-gray-200 mb-4 sm:mb-6 -mx-4 sm:mx-0 overflow-x-auto">
          <nav className="flex px-4 sm:px-0 min-w-max sm:min-w-0">
            <button
              onClick={() => setActiveTab('link')}
              className={`${
                activeTab === 'link'
                  ? 'border-gray-500 text-gray-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              } flex-shrink-0 py-3 sm:py-4 px-3 sm:px-4 border-b-2 font-medium text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer`}
            >
              <HiLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Link</span>
            </button>
            <button
              onClick={() => setActiveTab('embed')}
              className={`${
                activeTab === 'embed'
                  ? 'border-gray-500 text-gray-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              } flex-shrink-0 py-3 sm:py-4 px-3 sm:px-4 border-b-2 font-medium text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer`}
            >
              <HiCode className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Embed</span>
            </button>
            <button
              onClick={() => setActiveTab('wordpress')}
              className={`${
                activeTab === 'wordpress'
                  ? 'border-gray-500 text-gray-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              } flex-shrink-0 py-3 sm:py-4 px-3 sm:px-4 border-b-2 font-medium text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer`}
            >
              <HiCode className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>WordPress</span>
            </button>
          </nav>
        </div>

        {/* tab content */}
        <div className="max-h-[50vh] sm:max-h-[60vh] overflow-y-auto mb-4 sm:mb-6">
          <div className="space-y-4 sm:space-y-6">
            {activeTab === 'link' && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Share Link</h4>
                  <p className="text-xs sm:text-sm text-gray-600 mb-3">
                    Share this direct link to your form
                  </p>
                  
                  <div className="flex gap-2">
                    <div className="flex-1 min-w-0">
                      <TextInput
                        value={formUrl}
                        readOnly
                        className="font-mono text-xs w-full"
                      />
                    </div>
                    <CopyButton text={formUrl} label="Link" />
                  </div>
                </div>

                <Alert color="info" icon={HiLink}>
                  <span className="font-medium text-xs sm:text-sm">How to use:</span>
                  <ul className="mt-2 ml-4 list-disc text-xs sm:text-sm space-y-1">
                    <li>Copy the link above</li>
                    <li>Share via email or social media</li>
                    <li>Users access form on dedicated page</li>
                  </ul>
                </Alert>
              </div>
            )}

            {activeTab === 'embed' && (
              <div className="space-y-4 sm:space-y-6">
                <div className="border border-gray-200 rounded-lg p-3 sm:p-4">
                  <div className="flex items-start justify-between mb-3 gap-2">
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <h4 className="font-semibold text-gray-900 text-sm sm:text-base">Simple iFrame</h4>
                      <Badge color="success" size="sm">Recommended</Badge>
                    </div>
                    <CopyButton text={iframeCode} label="iFrame" />
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 mb-3">
                    Basic iframe embed. Works on most websites.
                  </p>
                  <div className="bg-gray-50 rounded p-2 sm:p-3 border border-gray-200 overflow-x-auto">
                    <pre className="text-[10px] sm:text-xs font-mono text-gray-800 whitespace-pre-wrap break-all">
                      {iframeCode}
                    </pre>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-3 sm:p-4">
                  <div className="flex items-start justify-between mb-3 gap-2">
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <h4 className="font-semibold text-gray-900 text-sm sm:text-base">Smart Embed</h4>
                      <Badge color="warning" size="sm">Auto-resize</Badge>
                    </div>
                    <CopyButton text={scriptCode} label="Script" />
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 mb-3">
                    JavaScript embed with auto-resizing.
                  </p>
                  <div className="bg-gray-50 rounded p-2 sm:p-3 border border-gray-200 overflow-x-auto max-h-48">
                    <pre className="text-[10px] sm:text-xs font-mono text-gray-800 whitespace-pre-wrap break-all">
                      {scriptCode}
                    </pre>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'wordpress' && (
              <div className="space-y-4 sm:space-y-6">
                <div className="border border-gray-200 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center justify-between mb-3 gap-2">
                    <h4 className="font-semibold text-gray-900 text-sm sm:text-base">WordPress Shortcode</h4>
                    <CopyButton text={wordpressShortcode} label="Shortcode" />
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 mb-3">
                    If you have the Calirocks WordPress plugin installed.
                  </p>
                  <div className="bg-gray-50 rounded p-2 sm:p-3 border border-gray-200">
                    <pre className="text-xs sm:text-sm font-mono text-gray-800">
                      {wordpressShortcode}
                    </pre>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center justify-between mb-3 gap-2">
                    <h4 className="font-semibold text-gray-900 text-sm sm:text-base">Manual Embed</h4>
                    <CopyButton text={iframeCode} label="WordPress HTML" />
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 mb-3">
                    Add an HTML block in WordPress editor.
                  </p>
                  <div className="bg-gray-50 rounded p-2 sm:p-3 border border-gray-200 overflow-x-auto">
                    <pre className="text-[10px] sm:text-xs font-mono text-gray-800 whitespace-pre-wrap break-all">
                      {iframeCode}
                    </pre>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4">
              <div className="flex gap-2 sm:gap-3">
                <span className="text-lg sm:text-xl flex-shrink-0">💡</span>
                <div>
                  <h5 className="font-semibold text-gray-900 text-xs sm:text-sm mb-2">Pro Tips</h5>
                  <ul className="text-xs sm:text-sm text-gray-800 space-y-1 ml-4 list-disc">
                    <li>Test before going live</li>
                    <li>Check mobile responsiveness</li>
                    <li>Changes reflect automatically</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* footer */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4 sm:pt-6 border-t border-gray-200 pb-2">
          <Button color="light" onClick={onClose} className="cursor-pointer w-full sm:w-auto">
            Close
          </Button>
          <Button color="gray" onClick={openPreview} className="cursor-pointer w-full sm:w-auto">
            <HiExternalLink className="mr-2 h-4 w-4" />
            Preview Form
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default EmbedCodeModal;