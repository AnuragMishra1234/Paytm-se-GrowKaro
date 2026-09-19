import axios from "axios";

/**
 * api.js — Frontend API service layer
 *
 * All backend calls go through this module.
 * Never call fetch/axios directly from pages/components.
 * This makes it easy to swap base URL, add auth headers, or mock for tests.
 */
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
  headers: { "Content-Type": "application/json" },
});

// Response interceptor: normalize errors
client.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const message =
      err.response?.data?.message ||
      err.message ||
      "An unexpected error occurred";
    return Promise.reject(new Error(message));
  }
);

// ─── Phase 1 Merchant APIs ───────────────────────────────────────────────

export const fetchMerchants = () => client.get("/api/merchants");

export const fetchMerchant = (id) => client.get(`/api/merchants/${id}`);

export const fetchDashboard = (id, days = 30) =>
  client.get(`/api/merchants/${id}/dashboard?days=${days}`);

export const fetchTransactions = (id, params = {}) => {
  const query = new URLSearchParams(params).toString();
  return client.get(`/api/merchants/${id}/transactions?${query}`);
};

export const fetchProducts = (id, days = 30) =>
  client.get(`/api/merchants/${id}/products?days=${days}`);

export const fetchCustomers = (id) =>
  client.get(`/api/merchants/${id}/customers`);

export const fetchAnalytics = (id, days = 30) =>
  client.get(`/api/merchants/${id}/analytics?days=${days}`);

// ─── Phase 2 AI & Intelligence APIs ───────────────────────────────────────

export const fetchInsights = (id, category = "") => {
  const query = category && category !== "ALL" ? `?category=${category}` : "";
  return client.get(`/api/merchants/${id}/insights${query}`);
};

export const fetchInsightDetail = (id, insightId) =>
  client.get(`/api/merchants/${id}/insights/${insightId}`);

export const dismissInsight = (id, insightId) =>
  client.post(`/api/merchants/${id}/insights/${insightId}/dismiss`);

export const fetchRecommendations = (id) =>
  client.get(`/api/merchants/${id}/recommendations`);

export const fetchMemory = (id) =>
  client.get(`/api/merchants/${id}/memory`);

export const fetchContext = (id) =>
  client.get(`/api/merchants/${id}/context`);

export const fetchDailyBrief = (id) =>
  client.get(`/api/ai/brief/${id}`);

export const chatCopilot = (payload) =>
  client.post("/api/ai/chat", payload);

export const triggerAnalysis = (id) =>
  client.post(`/api/ai/analyze/${id}`, {}, { timeout: 60000 });

// ─── Phase 3 Agentic Actions & Campaigns APIs ─────────────────────────────

export const createActionDraft = (payload) =>
  client.post("/api/actions", payload);

export const fetchMerchantActions = (merchantId, status = "") => {
  const query = status && status !== "ALL" ? `?status=${status}` : "";
  return client.get(`/api/merchants/${merchantId}/actions${query}`);
};

export const fetchActionDetail = (actionId, merchantId) =>
  client.get(`/api/actions/${actionId}?merchantId=${merchantId}`);

export const updateActionDraft = (actionId, payload) =>
  client.patch(`/api/actions/${actionId}`, payload);

export const approveAction = (actionId, payload) =>
  client.post(`/api/actions/${actionId}/approve`, payload);

export const rejectAction = (actionId, payload) =>
  client.post(`/api/actions/${actionId}/reject`, payload);

export const retryAction = (actionId, payload) =>
  client.post(`/api/actions/${actionId}/retry`, payload);

export const fetchMerchantCampaigns = (merchantId) =>
  client.get(`/api/merchants/${merchantId}/campaigns`);

// ─── Phase 4 Outcomes, Learning Loop & System Status APIs ──────────────────

export const fetchMerchantOutcomes = (merchantId) =>
  client.get(`/api/merchants/${merchantId}/outcomes`);

export const fetchActionOutcome = (actionId) =>
  client.get(`/api/actions/${actionId}/outcome`);

export const measureActionOutcome = (actionId, merchantId) =>
  client.post(`/api/actions/${actionId}/measure`, { merchantId });

export const fetchMerchantLearned = (merchantId) =>
  client.get(`/api/merchants/${merchantId}/learned`);

export const fetchN8nStatus = () =>
  client.get("/api/n8n/status");

// ─── Phase 4 Notifications, Activity & Simulator APIs ─────────────────────

export const fetchMerchantNotifications = (merchantId, params = {}) => {
  const query = new URLSearchParams(params).toString();
  return client.get(`/api/merchants/${merchantId}/notifications?${query}`);
};

export const markNotificationRead = (notificationId) =>
  client.patch(`/api/notifications/${notificationId}/read`);

export const markAllNotificationsRead = (merchantId) =>
  client.patch(`/api/merchants/${merchantId}/notifications/read-all`);

export const fetchMerchantActivity = (merchantId, limit = 30) =>
  client.get(`/api/merchants/${merchantId}/activity?limit=${limit}`);

export const triggerSimulationScenario = (merchantId, scenario, payload = {}) =>
  client.post(`/api/merchants/${merchantId}/simulate/${scenario}`, payload);

// ─── Demo Control & Reset APIs ───────────────────────────────────────────

export const resetDemoEnvironment = () =>
  client.post("/api/demo/reset");

export const fetchDemoStatus = () =>
  client.get("/api/demo/status");

// ─── Paytm Connection Telemetry API ───────────────────────────────────────

export const fetchPaytmStatus = () =>
  client.get("/api/paytm/status");

// ─── Personalized Customer Win-Back Offers APIs ──────────────────────────

export const fetchCustomerOpportunities = (merchantId) =>
  client.get(`/api/merchants/${merchantId}/customer-opportunities`);

export const triggerCustomerOpportunityDetect = (merchantId) =>
  client.post("/api/customer-offers/detect", { merchantId });

export const approveCustomerOffer = (offerId, merchantId) =>
  client.post(`/api/customer-offers/${offerId}/approve`, { merchantId });

export const rejectCustomerOffer = (offerId, merchantId, reason) =>
  client.post(`/api/customer-offers/${offerId}/reject`, { merchantId, reason });

export const editCustomerOffer = (offerId, merchantId, payload) =>
  client.post(`/api/customer-offers/${offerId}/edit`, { merchantId, ...payload });

export const recordCustomerOfferOutcome = (offerId, payload) =>
  client.post(`/api/customer-offers/${offerId}/outcome`, payload);