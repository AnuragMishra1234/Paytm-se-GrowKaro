import { useState, useEffect, useCallback } from "react";
import { fetchDashboard } from "../services/api";

/**
 * useDashboard — fetches aggregated dashboard data for a merchant
 * Returns { data, loading, error, refetch }
 */
export function useDashboard(merchantId, days = 30) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!merchantId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchDashboard(merchantId, days);
      setData(res.data);
    } catch (err) {
      setError(err.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [merchantId, days]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, refetch: load };
}