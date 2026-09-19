import { useState, useEffect, useCallback } from "react";
import { fetchInsights, triggerAnalysis, dismissInsight } from "../services/api";

export function useInsights(merchantId, category = "ALL") {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!merchantId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchInsights(merchantId, category);
      setInsights(res.data || []);
    } catch (err) {
      setError(err.message || "Failed to load proactive insights");
    } finally {
      setLoading(false);
    }
  }, [merchantId, category]);

  useEffect(() => {
    load();
  }, [load]);

  const runAnalysis = async () => {
    if (!merchantId) return;
    setAnalyzing(true);
    setError(null);
    try {
      const res = await triggerAnalysis(merchantId);
      if (res.data && res.data.length > 0) {
        setInsights(res.data);
      } else {
        await load();
      }
    } catch (err) {
      console.warn("Diagnosis trigger error, reloading fresh insights:", err);
      try {
        await load();
      } catch (loadErr) {
        setError(err.message || "Analysis failed");
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const dismiss = async (insightId) => {
    try {
      await dismissInsight(merchantId, insightId);
      setInsights((prev) => prev.filter((i) => i._id !== insightId));
    } catch (err) {
      console.error("Failed to dismiss insight:", err);
    }
  };

  return { insights, loading, analyzing, error, refetch: load, runAnalysis, dismiss };
}