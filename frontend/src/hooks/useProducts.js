import { useState, useEffect, useCallback } from "react";
import { fetchProducts } from "../services/api";

export function useProducts(merchantId, days = 30) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!merchantId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchProducts(merchantId, days);
      setData(res.data);
    } catch (err) {
      setError(err.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [merchantId, days]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, refetch: load };
}