import React, { useState } from "react";
import DigitalReceiptModal from "./DigitalReceiptModal";

export function LiveTransactionFeed({ transactions = [], loading = false, onOpenAddModal, merchant = null }) {
  const [selectedReceiptTx, setSelectedReceiptTx] = useState(null);

  const formatTime = (ts) => {
    if (!ts) return "Just now";
    const d = new Date(ts);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);

    if (diffSec < 45) return "Just now";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  };

  return (
    <div className="card p-5 sm:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-black text-base md:text-lg text-gray-950 tracking-tight">
                Live Transaction &amp; Billing Feed
              </h2>
              <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full">
                {transactions.length} orders
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Real-time POS invoice ledger with order bill numbers and itemized receipts
            </p>
          </div>
        </div>

        {onOpenAddModal && (
          <button
            onClick={onOpenAddModal}
            className="text-xs font-bold text-white bg-[#002970] hover:bg-[#001f56] px-3.5 py-2 rounded-xl shadow-2xs transition-all flex items-center gap-1.5 self-start sm:self-auto"
          >
            <span>+ Add Live Transaction</span>
            <span>⚡</span>
          </button>
        )}
      </div>

      {/* Transaction List */}
      {loading && transactions.length === 0 ? (
        <div className="py-12 text-center text-xs text-gray-400 animate-pulse">
          Connecting to live transaction bus...
        </div>
      ) : transactions.length === 0 ? (
        <div className="py-12 text-center text-xs text-gray-400 italic">
          No live transactions recorded yet today. Click "+ Add Live Transaction" or run a simulation.
        </div>
      ) : (
        <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
          {transactions.map((tx) => {
            const isRefund = tx.transactionType === "REFUND" || tx.paymentStatus === "refunded";
            const billNumber = tx.billNumber || ((isRefund ? "REF-#" : "BILL-#") + (tx._id?.toString().slice(-5).toUpperCase() || "10492"));
            const customer = tx.customer || tx.customerName || "Walk-in Customer";
            const segment = tx.customerSegment || "regular";
            const items = tx.items && tx.items.length > 0 ? tx.items : [];
            const totalBill = tx.totalBill || tx.amount || 0;

            return (
              <div
                key={tx._id}
                className={`p-4 rounded-2xl border transition-all space-y-3 ${
                  isRefund
                    ? "bg-rose-50/40 border-rose-200/80 hover:bg-rose-50/70"
                    : "bg-white border-gray-200/90 hover:border-blue-300 hover:shadow-xs"
                }`}
              >
                {/* Top Row: Bill Number, Type, Customer, Time */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100/80 pb-2.5">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono text-xs font-black text-gray-900 bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200">
                      {billNumber}
                    </span>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        isRefund
                          ? "bg-rose-100 text-rose-800 border border-rose-200"
                          : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      }`}
                    >
                      {isRefund ? "↩ REFUND" : "✓ SALE"}
                    </span>
                    <span className="text-xs font-bold text-gray-800 flex items-center gap-1">
                      <span>👤</span>
                      <span>{customer}</span>
                    </span>
                    {segment === "vip" && (
                      <span className="bg-amber-100 text-amber-900 font-extrabold px-1.5 py-0.5 rounded text-[9px] uppercase">
                        VIP
                      </span>
                    )}
                    {segment === "repeat" && (
                      <span className="bg-blue-100 text-blue-900 font-bold px-1.5 py-0.5 rounded text-[9px] uppercase">
                        Repeat
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="text-[11px] font-medium">{formatTime(tx.timestamp)}</span>
                    <span>·</span>
                    <span className="uppercase font-bold text-gray-500 text-[10px]">
                      {tx.paymentMethod || "UPI"}
                    </span>
                  </div>
                </div>

                {/* Middle Row: What was ordered on this bill */}
                <div className="space-y-1.5 bg-gray-50/60 p-2.5 rounded-xl border border-gray-100">
                  <div className="text-[11px] font-extrabold uppercase text-gray-400 tracking-wider flex items-center justify-between">
                    <span>Items Ordered on {billNumber}</span>
                    <span>{items.length} item(s)</span>
                  </div>

                  {items.length > 0 ? (
                    <div className="space-y-1">
                      {items.map((it, idx) => {
                        const q = it.quantity || 1;
                        const p = it.unitPrice || 0;
                        const lineTot = it.totalPrice || (q * p);
                        return (
                          <div key={idx} className="flex items-center justify-between text-xs text-gray-700">
                            <span className="font-semibold text-gray-900 flex items-center gap-1.5">
                              <span className="text-gray-400 text-[11px] font-mono">▸ {q}×</span>
                              <span>{it.name || it.productName || "Product Item"}</span>
                              {it.category && (
                                <span className="text-[10px] text-gray-400 uppercase font-medium">
                                  ({it.category})
                                </span>
                              )}
                            </span>
                            <span className="font-mono text-gray-800 text-[11px]">
                              ₹{lineTot.toLocaleString("en-IN")}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500 italic">
                      {isRefund ? "Order Refund Return Credit" : "Direct POS counter ticket"}
                    </div>
                  )}
                </div>

                {/* Bottom Row: Total Bill & View Receipt CTA */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs text-gray-500 font-bold uppercase">
                      {isRefund ? "Refund Total:" : "Total Bill:"}
                    </span>
                    <span
                      className={`font-mono text-base font-black ${
                        isRefund ? "text-rose-600" : "text-emerald-700"
                      }`}
                    >
                      {isRefund ? "-" : ""}₹{Number(totalBill).toLocaleString("en-IN")}
                    </span>
                    {tx.discount > 0 && (
                      <span className="text-[11px] text-rose-500 font-bold">
                        (₹{tx.discount} off)
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => setSelectedReceiptTx(tx)}
                    className="text-xs font-bold text-[#002970] hover:text-blue-900 bg-blue-50/70 hover:bg-blue-100 border border-blue-200/80 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shadow-2xs"
                  >
                    <span>📄 View Bill Receipt</span>
                    <span>›</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Digital Receipt Modal */}
      <DigitalReceiptModal
        isOpen={Boolean(selectedReceiptTx)}
        onClose={() => setSelectedReceiptTx(null)}
        transaction={selectedReceiptTx}
        merchant={merchant}
      />
    </div>
  );
}
export default LiveTransactionFeed;
