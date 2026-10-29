// src/App/Giftcards/FormWidget/index.tsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button, Card, Alert } from "flowbite-react";
import { HiCheckCircle, HiClipboard } from "react-icons/hi";
import { useGiftcards } from "../../../hooks/useGiftcards";
import { TbShoppingCart } from "react-icons/tb";
const GiftcardFormWidget: React.FC = () => {
  const { settings } = useGiftcards();
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Generate embed code from settings
  const embedCode =
    settings.embedCode ||
    `<script src="https://yourdomain.com/jsbundle"></script>
<iframe id="booking-widget-iframe" 
src="https://yourdomain.com/giftcards/new?w" 
style="border:none;width:100%;min-height:1260px;overflow:hidden" 
scrolling="no"></iframe>`;

  // Get shareable link from settings
  const shareableLink =
    settings.shareableLink || "https://alohamaids.launch27.com/giftcards/new";

  const handleCopyEmbed = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopiedEmbed(true);
      setTimeout(() => setCopiedEmbed(false), 3000);
    } catch (err) {
      console.error("Failed to copy embed code:", err);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareableLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  return (
    <div className="px-4 pb-10 sm:px-5">
      {/* Breadcrumb */}
      <nav
        className="mb-3 flex items-center text-gray-700"
        aria-label="Breadcrumb"
      >
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <Link
              to="/admin/giftcards"
              className="text-xs font-medium text-gray-700 hover:text-gray-600 sm:text-sm"
            >
              Gift Cards
            </Link>
          </li>
          <li aria-current="page" className="inline-flex items-center">
            <svg
              className="mx-1 h-3 w-3 text-gray-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <span className="ml-1 text-xs font-medium text-gray-500 sm:text-sm md:ml-2">
              Gift Card Form Widget
            </span>
          </li>
        </ol>
      </nav>

      {/* Header */}
      <div className="mb-6 flex items-center gap-3 sm:gap-4">
         <div className="relative inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-black">
            <TbShoppingCart className="h-6 w-6 text-white"/>
          </div>                
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold text-gray-900 sm:text-2xl">
            Add your Gift Card Form to your Site
          </h1>
          <p className="text-xs text-gray-500 sm:text-sm">
            Embed the form or share a direct link with customers
          </p>
        </div>
      </div>

      {/* Success Alerts */}
      {copiedEmbed && (
        <Alert color="success" icon={HiCheckCircle} className="mb-4">
          <span className="font-medium">Embed code copied!</span> You can now
          paste it into your website.
        </Alert>
      )}

      {copiedLink && (
        <Alert color="success" icon={HiCheckCircle} className="mb-4">
          <span className="font-medium">Link copied!</span> You can now share it
          with customers.
        </Alert>
      )}

      {/* Content */}
      <div className="space-y-6">
        {/* Instructions Card */}

        {/* Embed Code Section */}
        <Card className="bg-gray-50">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Embed this gift card form code onto your website
            </h3>
          </div>

          <p className="mb-3 text-sm text-gray-600">
            Copy the code below and paste it into your website where you want
            the gift card form to appear.
          </p>

          <div className="relative">
            <div className="overflow-hidden rounded-lg border border-gray-300 bg-gray-50">
              <div className="flex items-center justify-between border-b border-gray-300 bg-gray-100 px-4 py-2">
                <span className="text-xs font-medium text-gray-600">
                  Embed Code
                </span>
                <Button
                  size="xs"
                  color="light"
                  onClick={handleCopyEmbed}
                  className="cursor-pointer"
                >
                  <HiClipboard className="mr-1.5 h-4 w-4" />
                  {copiedEmbed ? "Copied!" : "Copy Code"}
                </Button>
              </div>
              <div className="p-4">
                <pre className="overflow-x-auto text-xs text-gray-800">
                  <code>{embedCode}</code>
                </pre>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-lg bg-gray-50 p-4">
            <p className="text-sm text-gray-800">
              <strong>Tip:</strong> Make sure to paste this code in the HTML
              editor of your website, not the visual editor.
            </p>
          </div>

          {/* Shareable Link Section */}

          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              or, Share a Link to it
            </h3>
          </div>

          <p className="mb-3 text-sm text-gray-600">
            You can also share this direct link with customers via email, social
            media, or anywhere else.
          </p>

          <div className="relative">
            <div className="overflow-hidden rounded-lg border border-gray-300">
              <div className="flex items-center justify-between border-b border-gray-300 bg-gray-100 px-4 py-2">
                <span className="text-xs font-medium text-gray-600">
                  Shareable Link
                </span>
                <Button
                  size="xs"
                  color="light"
                  onClick={handleCopyLink}
                  className="cursor-pointer"
                >
                  <HiClipboard className="mr-1.5 h-4 w-4" />
                  {copiedLink ? "Copied!" : "Copy Link"}
                </Button>
              </div>
              <div className="bg-white p-4">
                <a
                  href={shareableLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm break-all text-gray-600 hover:text-gray-800 hover:underline"
                >
                  {shareableLink}
                </a>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-lg bg-green-50 p-4">
            <p className="text-sm text-green-800">
              <strong>Note:</strong> Any active customer that creates a portal
              will also be able to purchase gift cards there.
            </p>
          </div>

          {/* Preview Section */}

          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Preview Your Gift Card Form
          </h3>
          <p className="mb-4 text-sm text-gray-600">
            Click the button below to see how your gift card form will look to
            customers.
          </p>
          <div className="flex gap-3">
            <Button
              color="gray"
              onClick={() => window.open(shareableLink, "_blank")}
              className="cursor-pointer"
            >
              Open Preview
            </Button>
            <Link to="/admin/giftcards/settings">
              <Button color="light" className="cursor-pointer">
                Edit Form Settings
              </Button>
            </Link>
          </div>
        </Card>

      </div>
    </div>
  );
};

export default GiftcardFormWidget;
