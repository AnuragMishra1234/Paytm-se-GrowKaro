import { useState, useEffect, useCallback } from "react";
import { fetchAnalytics } from "../services/api";

export function useAnalytics(merchantId, days = 30) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!merchantId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAnalytics(merchantId, days);
      setData(res.data);
    } catch (err) {
      setError(err.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [merchantId, days]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, refetch: load };
}