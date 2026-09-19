import { useState, useEffect, useCallback } from "react";
import {
  fetchMerchantActions,
  fetchMerchantCampaigns,
  createActionDraft,
  updateActionDraft,
  approveAction,
  rejectAction,
  retryAction,
} from "../services/api";

export function useActions(merchantId, initialStatus = "ALL") {
  const [actions, setActions] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState(initialStatus);

  const loadData = useCallback(async () => {
    if (!merchantId) return;
    setLoading(true);
    setError(null);
    try {
      const [actionsRes, campaignsRes] = await Promise.all([
        fetchMerchantActions(merchantId, statusFilter),
        fetchMerchantCampaigns(merchantId),
      ]);
      setActions(actionsRes.data || []);
      setCampaigns(campaignsRes.data || []);
    } catch (err) {
      setError(err.message || "Failed to load actions and campaigns");
    } finally {
      setLoading(false);
    }
  }, [merchantId, statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const draftAction = async (insightId, overrides = {}) => {
    if (!merchantId || !insightId) return null;
    setActionLoading(true);
    setError(null);
    try {
      const res = await createActionDraft({ merchantId, insightId, overrides });
      await loadData();
      return res.data;
    } catch (err) {
      setError(err.message || "Failed to create action draft");
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const updateDraft = async (actionId, updates) => {
    if (!merchantId || !actionId) return null;
    setActionLoading(true);
    setError(null);
    try {
      const res = await updateActionDraft(actionId, { merchantId, ...updates });
      await loadData();
      return res.data;
    } catch (err) {
      setError(err.message || "Failed to update action draft");
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const approve = async (actionId, approvedPayload = {}) => {
    if (!merchantId || !actionId) return null;
    setActionLoading(true);
    setError(null);
    try {
      const res = await approveAction(actionId, { merchantId, ...approvedPayload });
      await loadData();
      return res.data;
    } catch (err) {
      setError(err.message || "Failed to execute approved action");
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const reject = async (actionId, reason) => {
    if (!merchantId || !actionId) return null;
    setActionLoading(true);
    setError(null);
    try {
      const res = await rejectAction(actionId, { merchantId, reason });
      await loadData();
      return res.data;
    } catch (err) {
      setError(err.message || "Failed to reject action");
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const retry = async (actionId) => {
    if (!merchantId || !actionId) return null;
    setActionLoading(true);
    setError(null);
    try {
      const res = await retryAction(actionId, { merchantId });
      await loadData();
      return res.data;
    } catch (err) {
      setError(err.message || "Failed to retry action");
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const pendingCount = actions.filter((a) => a.approvalStatus === "PENDING").length;
  const runningCount = actions.filter((a) => a.executionStatus === "RUNNING").length;
  const completedCount = actions.filter((a) => a.executionStatus === "SUCCESS").length;

  return {
    actions,
    campaigns,
    loading,
    actionLoading,
    error,
    statusFilter,
    setStatusFilter,
    refetch: loadData,
    draftAction,
    updateDraft,
    approve,
    reject,
    retry,
    stats: {
      pending: pendingCount,
      running: runningCount,
      completed: completedCount,
      total: actions.length,
    },
  };
}