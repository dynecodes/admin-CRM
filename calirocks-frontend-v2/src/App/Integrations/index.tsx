// src/pages/integrations/Twilio/index.tsx
import * as React from "react";
import { Alert } from "flowbite-react";
import { HiChatAlt2, HiInformationCircle } from "react-icons/hi";
import TwilioSettingsForm from "../../components/Integrations/TwilioSettingsForm";

const TwilioIntegrationPage: React.FC = () => {
  return (
    <div className="px-4 sm:px-5 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-4">
          <div className="relative inline-flex items-center justify-center w-12 h-12 overflow-hidden bg-black rounded-full">
            <HiChatAlt2 className="w-6 h-6 text-white" />
          </div>
          <div className="font-medium">
            <span className="text-2xl sm:text-3xl font-bold text-gray-900">Twilio Integration</span>
            <div className="text-sm text-gray-500">Use your own Twilio number to send SMS reminders</div>
          </div>
        </div>
      </div>

      {/* Step helper (UI text only) */}
      <div className="p-4 sm:p-6 bg-white border border-gray-200 rounded-md mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
          Step 1: Copy the Account SID, Auth Token and Phone Number from your Twilio account
        </h3>
        <Alert color="info" className="mb-3">
          <div className="flex items-center">
            <HiInformationCircle className="h-5 w-5" />
            <span className="ml-2">
              If you do not already have a Twilio number, purchase one first in your Twilio console.
            </span>
          </div>
        </Alert>
        <ol className="list-decimal ml-5 text-sm text-gray-700 space-y-1">
          <li>Log in to your Twilio account.</li>
          <li>Open your Account/SMS dashboard and copy the <b>Account SID</b> and <b>Auth Token</b>.</li>
          <li>Open the <b>Phone Numbers</b> list, click your number, and copy it in E.164 format.</li>
        </ol>
      </div>

      {/* Step 2 form (component) */}
      <TwilioSettingsForm />

      <p className="text-xs text-gray-500 mt-3">© {new Date().getFullYear()} Maggy Maid</p>
    </div>
  );
};

export default TwilioIntegrationPage;
