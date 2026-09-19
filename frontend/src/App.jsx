import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MerchantProvider } from "./context/MerchantContext";
import { TeamProvider } from "./context/TeamContext";
import AppLayout from "./layouts/AppLayout";
import Landing from "./pages/Landing";
import MerchantSelect from "./pages/MerchantSelect";
import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";
import Products from "./pages/Products";
import Customers from "./pages/Customers";
import AICopilot from "./pages/AICopilot";
import Insights from "./pages/Insights";
import Campaigns from "./pages/Campaigns";
import Performance from "./pages/Performance";
import Activity from "./pages/Activity";
import DemoControl from "./pages/DemoControl";
import Team from "./pages/Team";
import Tasks from "./pages/Tasks";
import EmployeeWorkspace from "./pages/EmployeeWorkspace";
import RealDataTesting from "./pages/RealDataTesting";

import { ErrorBoundary } from "./components/ErrorBoundary";

/**
 * App.jsx — Root router
 * - / : High-impact Paytm for Business-style Landing Page
 * - /select-merchant : Merchant Selector
 * - /demo-control, /admin/demo : Developer / Presentation Demo Control Room
 * - /dashboard, /campaigns, /performance, etc. : App Console with Sidebar Layout
 * - /team, /tasks : Phase 6 Employee & Team Workflow Integration
 */
function App() {
  return (
    <ErrorBoundary>
      <MerchantProvider>
        <TeamProvider>
          <BrowserRouter>
            <Routes>
            {/* Landing Page (Paytm for Business template) */}
            <Route path="/" element={<Landing />} />

            {/* Standalone merchant selection */}
            <Route path="/select-merchant" element={<MerchantSelect />} />

            {/* Dedicated Demo Control Room (unlinked from merchant UI) */}
            <Route path="/demo-control" element={<DemoControl />} />
            <Route path="/admin/demo" element={<DemoControl />} />

            {/* Main app with sidebar layout */}
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/ai-copilot" element={<AICopilot />} />
              <Route path="/insights" element={<Insights />} />
              <Route path="/campaigns" element={<Campaigns />} />
              <Route path="/performance" element={<Performance />} />
              <Route path="/activity" element={<Activity />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/team" element={<Team />} />
              <Route path="/employee" element={<EmployeeWorkspace />} />
              <Route path="/test-real-data" element={<RealDataTesting />} />
              <Route path="/real-data" element={<Navigate to="/test-real-data" replace />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/products" element={<Products />} />
              <Route path="/customers" element={<Customers />} />

              {/* Direct aliases for activity & notification deep links */}
              <Route path="/actions" element={<Navigate to="/campaigns" replace />} />
              <Route path="/recommendations" element={<Navigate to="/insights" replace />} />
              <Route path="/outcomes" element={<Navigate to="/performance" replace />} />
              <Route path="/memory" element={<Navigate to="/performance" replace />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </TeamProvider>
    </MerchantProvider>
  </ErrorBoundary>
  );
}

export default App;