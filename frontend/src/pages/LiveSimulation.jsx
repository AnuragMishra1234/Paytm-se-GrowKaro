import React, { useState, useEffect } from "react";
import { useMerchantContext } from "../context/MerchantContext";
import { fetchLiveTransactions, fetchDashboardData } from "../services/api";
import socketService from "../services/socket";
import { Zap, Plus, RotateCcw } from "lucide-react";
import { LiveGrowKaroDemo } from "../components/LiveGrowKaroDemo";
import { LiveTransactionFeed } from "../components/LiveTransactionFeed";
import { LiveTransactionModal } from "../components/LiveTransactionModal";
import { KPICard } from "../components/KPICard";

export default function LiveSimulation() {
  const { merchant } = useMerchantContext();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [initialType, setInitialType] = useState("SALE");
  const [lastLiveEvent, setLastLiveEvent] = useState("Just now");

  const loadInitialData = async () => {
    if (!merchant?._id) return;
    setLoading(true);
    try {
      const [txRes, dashRes] = await Promise.all([
        fetchLiveTransactions(merchant._id, 30),
        fetchDashboard(merchant._id, 30),
      ]);
      if (txRes.data) setTransactions(txRes.data);
      if (dashRes.data?.kpis) setKpis(dashRes.data.kpis);
    } catch (err) {
      console.error("Failed to load live simulation data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();

    if (merchant?._id) {
      socketService.connect(merchant._id);

      const handleTxCreated = (payload) => {
        const tx = payload?.transaction;
        if (tx) {
          setTransactions((prev) => {
            const filtered = prev.filter((item) => item._id !== tx._id);
            return [tx, ...filtered].slice(0, 40);
          });
        }
        if (payload?.kpis) {
          setKpis(payload.kpis);
        }
        setLastLiveEvent("Just now");
      };

      const handleDashboardUpdate = (payload) => {
        if (payload?.kpis) {
          setKpis(payload.kpis);
        }
        setLastLiveEvent("Just now");
      };

      socketService.on("transaction:created", handleTxCreated);
      socketService.on("dashboard:update", handleDashboardUpdate);

      return () => {
        socketService.off("transaction:created", handleTxCreated);
        socketService.off("dashboard:update", handleDashboardUpdate);
      };
    }
  }, [merchant?._id]);

  const handleActionComplete = async () => {
    if (!merchant?._id) return;
    try {
      const [txRes, dashRes] = await Promise.all([
        fetchLiveTransactions(merchant._id, 30),
        fetchDashboard(merchant._id, 30),
      ]);
      if (txRes.data) setTransactions(txRes.data);
      if (dashRes.data?.kpis) setKpis(dashRes.data.kpis);
    } catch (err) {
      console.warn("Simulation refresh warning:", err.message);
    }
  };

  const handleTransactionCreated = (newTx) => {
    if (newTx) {
      setTransactions((prev) => [newTx, ...prev.filter((t) => t._id !== newTx._id)].slice(0, 40));
    }
    setLastLiveEvent("Just now");
    handleActionComplete();
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-950 tracking-tight">
              Live Transactions &amp; Simulation Studio
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-black rounded-full border border-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              SOCKET.IO REAL-TIME BUS
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Real-time billing transactions, order itemization, and one-click judge demonstration controls
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setInitialType("SALE");
              setShowAddModal(true);
            }}
            className="btn-primary text-xs sm:text-sm font-bold py-2.5 px-4 flex items-center gap-1.5 shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Live Sale</span>
          </button>
          <button
            onClick={() => {
              setInitialType("REFUND");
              setShowAddModal(true);
            }}
            className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 shadow-2xs"
          >
            <RotateCcw className="w-4 h-4 text-rose-700" />
            <span>Record Refund</span>
          </button>
        </div>
      </div>

      {/* Top Stat Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Gross Invoiced Sales"
          value={kpis?.today?.grossSales ?? kpis?.today?.revenue}
          change={kpis?.changes?.revenue}
          icon="revenue"
          format="currency"
          loading={loading}
        />
        <KPICard
          title="Refund Deductions"
          value={kpis?.today?.refunds ?? 0}
          icon="refund"
          format="currency"
          changeLabel={(kpis?.today?.refundRate ?? 0) > 0 ? `${kpis.today.refundRate}% return rate` : "Zero returns"}
          loading={loading}
        />
        <KPICard
          title="Net Revenue Paid"
          value={kpis?.today?.netSales ?? kpis?.today?.revenue}
          icon="net"
          format="currency"
          changeLabel="Gross minus returns"
          loading={loading}
        />
        <KPICard
          title="Total Bill Tickets"
          value={kpis?.today?.transactions ?? transactions.length}
          icon="orders"
          format="number"
          loading={loading}
        />
      </div>

      {/* Prominent One-Click Judge Demo Panel */}
      <LiveGrowKaroDemo
        merchantId={merchant?._id}
        onActionComplete={handleActionComplete}
      />

      {/* Full Live Transactions Feed with Billing Details & Receipt Modal */}
      <LiveTransactionFeed
        transactions={transactions}
        loading={loading}
        merchant={merchant}
        onOpenAddModal={() => {
          setInitialType("SALE");
          setShowAddModal(true);
        }}
      />

      {/* Add Transaction Modal */}
      <LiveTransactionModal
        isOpen={showAddModal}
        merchantId={merchant?._id}
        initialType={initialType}
        onClose={() => setShowAddModal(false)}
        onTransactionCreated={handleTransactionCreated}
      />
    </div>
  );
}
