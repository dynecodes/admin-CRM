import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useEmailConfig } from "../../hooks/Emails/useEmailConfig";
import { emailsApi } from "../../api/emails";
import { Label, Button, HelperText, ToggleSwitch, Alert } from "flowbite-react";
import { HiMail, HiCheckCircle, HiExclamationCircle, HiInformationCircle } from "react-icons/hi";

export default function Emails() {
  const navigate = useNavigate();
  const pathPrefix = window.location.pathname.split('/')[1];
  const { config, loading, error, updateConfig } = useEmailConfig();
  
  // Email config state
  const [replyToEmail, setReplyToEmail] = useState("");
  const [emailSubdomain, setEmailSubdomain] = useState("");
  const [emailEnabled, setEmailEnabled] = useState(false);
  
  // Custom email state
  const [customToEmail, setCustomToEmail] = useState("");
  const [customSubject, setCustomSubject] = useState("");
  const [customContent, setCustomContent] = useState("");
  
  // UI state
  const [saveLoading, setSaveLoading] = useState(false);
  const [customLoading, setCustomLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Update form when config loads
  useEffect(() => {
    if (config) {
      setReplyToEmail(config.replyToEmail || "");
      setEmailSubdomain(config.emailSubdomain || "");
      setEmailEnabled(config.emailEnabled || false);
    }
  }, [config]);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");
    setSaveLoading(true);

    const result = await updateConfig({
      replyToEmail,
      emailSubdomain,
      emailEnabled,
    });

    setSaveLoading(false);

    if (result.success) {
      setSuccessMessage(result.message);
    } else {
      setErrorMessage(result.message);
    }
  };

  const handleSendCustomEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setCustomLoading(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const result = await emailsApi.sendCustomEmail({
        toEmail: customToEmail,
        subject: customSubject,
        htmlContent: customContent,
      });

      if (result.success) {
        setSuccessMessage("Email sent successfully!");
        setCustomToEmail("");
        setCustomSubject("");
        setCustomContent("");
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || "Failed to send email");
    } finally {
      setCustomLoading(false);
    }
  };

  if (loading && !config) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-12 w-12 border-4 border-gray-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-5 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-4">
          <div className="relative inline-flex items-center justify-center w-12 h-12 overflow-hidden bg-black rounded-full">
            <HiMail className="w-6 h-6 text-white" />
          </div>
          <div className="font-medium">
            <span className="text-2xl sm:text-3xl font-bold text-gray-900">Email Integration</span>
            <div className="text-sm text-gray-500">Configure email settings and send messages to customers</div>
          </div>
        </div>
        <Button
          color="gray"
          onClick={() => navigate(`/${pathPrefix}/emails/logs`)}
          className="w-full cursor-pointer sm:w-auto"
        >
          Email Logs
        </Button>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <Alert color="failure" icon={HiExclamationCircle} className="mb-4">
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert color="success" icon={HiCheckCircle} className="mb-4" onDismiss={() => setSuccessMessage("")}>
          {successMessage}
        </Alert>
      )}

      {errorMessage && (
        <Alert color="failure" icon={HiExclamationCircle} className="mb-4" onDismiss={() => setErrorMessage("")}>
          {errorMessage}
        </Alert>
      )}

      {/* Email Configuration Section */}
      <div className="p-4 sm:p-6 bg-white border border-gray-200 rounded-md mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
          Email Configuration
        </h3>
        
        <form onSubmit={handleSaveConfig} className="space-y-4">
          <div>
            <Label htmlFor="emailEnabled">Enable Email Integration</Label>
            <div className="mt-2">
              <ToggleSwitch
               color="gray"
                id="emailEnabled"
                checked={emailEnabled}
                onChange={setEmailEnabled}
                label={emailEnabled ? "Enabled" : "Disabled"}
              />
            </div>
            <HelperText className="mt-1.5 text-xs text-gray-500">
              Enable this to allow your company to send emails through CaliRocks
            </HelperText>
          </div>

          <div>
            <Label htmlFor="replyToEmail">Reply-To Email Address</Label>
            <div className="relative mt-1">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <HiMail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="replyToEmail"
                type="email"
                className="w-full pl-10 px-4 py-2.5 border border-gray-300 rounded-lg 
                         focus:ring-2 focus:ring-gray-500 focus:border-gray-500
                         disabled:bg-gray-100 disabled:cursor-not-allowed
                         transition-colors"
                placeholder="support@yourcompany.com"
                value={replyToEmail}
                onChange={(e) => setReplyToEmail(e.target.value)}
                required
                disabled={!emailEnabled}
              />
            </div>
            <HelperText className="mt-1.5 text-xs text-gray-500">
              When customers reply to emails, their responses will be sent to this address
            </HelperText>
          </div>

          <div>
            <Label htmlFor="emailSubdomain">Email Subdomain</Label>
            <input
              id="emailSubdomain"
              type="text"
              className="mt-1 w-full px-4 py-2.5 border border-gray-300 rounded-lg 
                       focus:ring-2 focus:ring-gray-500 focus:border-gray-500
                       disabled:bg-gray-100 disabled:cursor-not-allowed
                       transition-colors"
              placeholder="yourcompany"
              value={emailSubdomain}
              onChange={(e) => setEmailSubdomain(e.target.value.toLowerCase())}
              required
              disabled={!emailEnabled}
            />
            <HelperText className="mt-1.5 text-xs text-gray-500">
              {emailSubdomain
                ? `Emails will be sent from: support+${emailSubdomain}@calirocks.com`
                : "Use lowercase letters, numbers, and hyphens only"}
            </HelperText>
          </div>

          <div className="flex justify-end">
            <Button color="gray" className="cursor-pointer" type="submit" disabled={saveLoading || !emailEnabled}>
              {saveLoading ? "Saving..." : "Save Configuration"}
            </Button>
          </div>
        </form>
      </div>

      {/* How It Works Info */}
      <div className="p-4 sm:p-6 bg-white border border-gray-200 rounded-md mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
          How Email Integration Works
        </h3>
        <Alert color="info" className="mb-3">
          <div className="flex items-center">
            <HiInformationCircle className="h-5 w-5" />
            <span className="ml-2">
              Your customers see professional branded emails while you maintain control of replies
            </span>
          </div>
        </Alert>
        <ul className="list-disc ml-5 text-sm text-gray-700 space-y-1">
          <li>Emails are sent from your custom CaliRocks address (e.g., support+yourcompany@calirocks.com)</li>
          <li>When customers reply, responses go directly to YOUR company email (not CaliRocks)</li>
          <li>Your customers see a professional branded email experience</li>
          <li>All email delivery is handled automatically by CaliRocks</li>
        </ul>
      </div>

      {/* Custom Email Composer */}
      {emailEnabled && config?.replyToEmail && config?.emailSubdomain && (
        <div className="p-4 sm:p-6 bg-white border border-gray-200 rounded-md mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
            Send Custom Email
          </h3>
          
          <form onSubmit={handleSendCustomEmail} className="space-y-4">
            <div>
              <Label htmlFor="customToEmail">To (Email Address)</Label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <HiMail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="customToEmail"
                  type="email"
                  className="w-full pl-10 px-4 py-2.5 border border-gray-300 rounded-lg 
                           focus:ring-2 focus:ring-gray-500 focus:border-gray-500
                           transition-colors"
                  placeholder="customer@example.com"
                  value={customToEmail}
                  onChange={(e) => setCustomToEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="customSubject">Subject</Label>
              <input
                id="customSubject"
                type="text"
                className="mt-1 w-full px-4 py-2.5 border border-gray-300 rounded-lg 
                         focus:ring-2 focus:ring-gray-500 focus:border-gray-500
                         transition-colors"
                placeholder="Your email subject"
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="customContent">Email Content</Label>
              <textarea
                id="customContent"
                rows={10}
                className="mt-1 w-full px-4 py-2.5 border border-gray-300 rounded-lg 
                         focus:ring-2 focus:ring-gray-500 focus:border-gray-500 
                         font-mono text-sm
                         transition-colors"
                placeholder="Write your email content here... You can use HTML tags."
                value={customContent}
                onChange={(e) => setCustomContent(e.target.value)}
                required
              />
              <HelperText className="mt-1.5 text-xs text-gray-500">
                You can use HTML tags for formatting (e.g., &lt;b&gt;bold&lt;/b&gt;, &lt;p&gt;paragraph&lt;/p&gt;)
              </HelperText>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={customLoading}>
                {customLoading ? "Sending..." : "Send Email"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}