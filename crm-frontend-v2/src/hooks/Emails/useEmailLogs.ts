import { useState, useCallback } from "react";
import { emailsApi } from "../../api/emails";
import type { EmailLog, EmailLogsPagination } from "../../types/emails";

export function useEmailLogs() {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [pagination, setPagination] = useState<EmailLogsPagination | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async (params: { page?: number; limit?: number; sort?: string; search?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await emailsApi.getEmailLogs(params);
      if (response.success) {
        setLogs(response.data);
        setPagination(response.pagination);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to fetch email logs");
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    logs,
    pagination,
    loading,
    error,
    fetchLogs,
  };
}