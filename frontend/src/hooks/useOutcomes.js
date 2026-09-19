import { useState, useEffect, useCallback } from "react";
import {
  fetchMerchantOutcomes,
  measureActionOutcome,
  fetchMerchantLearned,
  fetchN8nStatus,
} from "../services/api";

export function useOutcomes(merchantId) {
  const [outcomes, setOutcomes] = useState([]);
  const [learnedSummary, setLearnedSummary] = useState(null);
  const [n8nStatus, setN8nStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [measuring, setMeasuring] = useState(false);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    if (!merchantId) return;
    setLoading(true);
    setError(null);
    try {
      const [outcomesRes, summaryRes, n8nRes] = await Promise.all([
        fetchMerchantOutcomes(merchantId).catch(() => ({ data: [] })),
        fetchMerchantLearned(merchantId).catch(() => ({ data: null })),
        fetchN8nStatus().catch(() => ({ data: null })),
      ]);

      setOutcomes(outcomesRes.data || []);
      setLearnedSummary(summaryRes.data || null);
      setN8nStatus(n8nRes.data || null);
    } catch (err) {
      setError(err.message || "Failed to load outcome data");
    } finally {
      setLoading(false);
    }
  }, [merchantId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const measure = async (actionId) => {
    if (!merchantId || !actionId) return;
    setMeasuring(true);
    try {
      const res = await measureActionOutcome(actionId, merchantId);
      await loadData();
      return res.data;
    } catch (err) {
      setError(err.message || "Measurement calculation failed");
      throw err;
    } finally {
      setMeasuring(false);
    }
  };

  return {
    outcomes,
    learnedSummary,
    n8nStatus,
    loading,
    measuring,
    error,
    refetch: loadData,
    measure,
  };
}
