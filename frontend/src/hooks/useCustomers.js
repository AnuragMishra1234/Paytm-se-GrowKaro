import { useState, useEffect, useCallback } from "react";
import { fetchCustomers } from "../services/api";

export function useCustomers(merchantId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!merchantId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchCustomers(merchantId);
      setData(res.data);
    } catch (err) {
      setError(err.message || "Failed to load customers");
    } finally {
      setLoading(false);
    }
  }, [merchantId]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, refetch: load };
}