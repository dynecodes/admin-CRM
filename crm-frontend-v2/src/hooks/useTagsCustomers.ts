import * as React from "react";
import usePrivateService from "./Auth/usePrivateService";
import type { Customer } from "../types/customers";

export function useTagCustomers(tagId: number | null) {
  const api = usePrivateService();
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!tagId) return;
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/tags/${tagId}/customers`);
        const raw = res.data?.data ?? res.data ?? [];
        if (!cancelled) setCustomers(raw);
      } catch (e: any) {
        if (!cancelled) {
          const msg =
            e?.response?.data?.error ||
            e?.message ||
            "Failed to fetch customers for tag";
          setError(msg);
          setCustomers([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [api, tagId]);

  return { customers, loading, error };
}
