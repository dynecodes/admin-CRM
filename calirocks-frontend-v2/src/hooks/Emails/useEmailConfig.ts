import { useState, useCallback, useEffect } from "react";
import { EmailConfig, UpdateEmailConfigInput } from "../../types/emails";
import { emailsApi } from "../../api/emails";

export function useEmailConfig() {
  const [config, setConfig] = useState<EmailConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await emailsApi.getConfig();
      if (response.success) {
        setConfig(response.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to fetch email config");
    } finally {
      setLoading(false);
    }
  }, []);

  const updateConfig = useCallback(async (data: UpdateEmailConfigInput) => {
    setLoading(true);
    setError(null);
    try {
      const response = await emailsApi.updateConfig(data);
      if (response.success) {
        await fetchConfig(); // Refresh config after update
        return { success: true, message: response.message };
      }
      return { success: false, message: "Failed to update config" };
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || "Failed to update email config";
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [fetchConfig]);

  const sendTestEmail = useCallback(async (toEmail: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await emailsApi.sendTest({ toEmail });
      if (response.success) {
        return { success: true, message: response.message, data: response.data };
      }
      return { success: false, message: "Failed to send test email" };
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || "Failed to send test email";
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  return {
    config,
    loading,
    error,
    fetchConfig,
    updateConfig,
    sendTestEmail,
  };
}