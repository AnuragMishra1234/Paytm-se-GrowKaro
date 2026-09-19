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

// Request interceptor: attach active demo role header
client.interceptors.request.use((config) => {
  const currentRole = localStorage.getItem("growkaro_demo_role") || "MANAGER";
  config.headers["x-demo-role"] = currentRole;
  return config;
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

// ─── Phase 6 Team & Task Workflows APIs ───────────────────────────────────

export const fetchMerchantTeam = (merchantId) =>
  client.get(`/api/merchants/${merchantId}/team`);

export const inviteTeamMember = (merchantId, payload) =>
  client.post(`/api/merchants/${merchantId}/team/invite`, payload);

export const updateTeamMember = (memberId, payload) =>
  client.patch(`/api/team/${memberId}`, payload);

export const removeTeamMember = (memberId) =>
  client.delete(`/api/team/${memberId}`);

export const fetchMerchantTasks = (merchantId, params = {}) => {
  const query = new URLSearchParams(params).toString();
  return client.get(`/api/merchants/${merchantId}/tasks?${query}`);
};

export const fetchTaskDetail = (taskId) =>
  client.get(`/api/tasks/${taskId}`);

export const createManualTask = (merchantId, payload) =>
  client.post(`/api/merchants/${merchantId}/tasks`, payload);

export const startTask = (taskId, payload = {}) =>
  client.post(`/api/tasks/${taskId}/start`, payload);

export const completeTask = (taskId, payload = {}) =>
  client.post(`/api/tasks/${taskId}/complete`, payload);

export const updateTask = (taskId, payload) =>
  client.patch(`/api/tasks/${taskId}`, payload);

export const deleteTask = (taskId) =>
  client.delete(`/api/tasks/${taskId}`);

// ─── Employee Workspace APIs (Rahul Verma & Ananya Das) ─────────────────
export const fetchEmployeeDashboard = (merchantId, role) =>
  client.get(`/api/merchants/${merchantId}/employee/dashboard${role ? `?role=${role}` : ""}`);

export const startEmployeeTask = (merchantId, taskId) =>
  client.post(`/api/merchants/${merchantId}/employee/tasks/${taskId}/start`);

export const completeEmployeeTask = (merchantId, taskId, completionNote) =>
  client.post(`/api/merchants/${merchantId}/employee/tasks/${taskId}/complete`, { completionNote });

// ─── AI Customer Loyalty & Personalized Offers APIs ─────────────────────

export const fetchLoyaltyCustomers = (merchantId) =>
  client.get(`/api/merchants/${merchantId}/loyalty/customers`);

export const fetchCustomerLoyaltyDetail = (merchantId, customerId) =>
  client.get(`/api/merchants/${merchantId}/loyalty/customers/${customerId}`);

export const fetchLoyaltyOpportunities = (merchantId) =>
  client.get(`/api/merchants/${merchantId}/loyalty/opportunities`);

export const submitPersonalizedOffer = (merchantId, payload) =>
  client.post(`/api/merchants/${merchantId}/loyalty/offers/create`, payload);

export const recordOfferOutcome = (merchantId, actionId, payload) =>
  client.post(`/api/merchants/${merchantId}/loyalty/offers/${actionId}/outcome`, payload);

// ─── Test With Real Data APIs ───────────────────────────────────────────

export const previewDataset = (payload) =>
  client.post("/api/datasets/preview", payload);

export const analyzeDataset = (payload) =>
  client.post("/api/datasets/analyze", payload);

export const fetchDatasetSession = (sessionId) =>
  client.get(`/api/datasets/${sessionId}`);

export const queryDatasetCopilot = (sessionId, query) =>
  client.post(`/api/datasets/${sessionId}/copilot`, { query });

export const deleteDatasetSession = (sessionId) =>
  client.delete(`/api/datasets/${sessionId}`);

// ─── Proactive Business Intelligence & Data Sources APIs ────────────────

export const fetchAutomatedDailyBrief = (merchantId, forceRefresh = false) =>
  client.get(`/api/merchants/${merchantId}/briefs/daily${forceRefresh ? "?forceRefresh=true" : ""}`);

export const generateAutomatedDailyBrief = (merchantId) =>
  client.post(`/api/merchants/${merchantId}/briefs/daily/generate`);

export const fetchAutomatedWeeklyReview = (merchantId, forceRefresh = false) =>
  client.get(`/api/merchants/${merchantId}/briefs/weekly${forceRefresh ? "?forceRefresh=true" : ""}`);

export const generateAutomatedWeeklyReview = (merchantId) =>
  client.post(`/api/merchants/${merchantId}/briefs/weekly/generate`);

export const fetchDataSourceStatus = (merchantId) =>
  client.get(`/api/merchants/${merchantId}/data-sources/status`);

export const simulateDataSourceLink = (merchantId) =>
  client.post(`/api/merchants/${merchantId}/data-sources/simulate-link`);