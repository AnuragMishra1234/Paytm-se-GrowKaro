import React, { useState } from "react";
import { createLiveTransaction } from "../services/api";

const PRESET_PRODUCTS = [
  { name: "Cold Brew Coffee", category: "beverages", unitPrice: 160, unitCost: 55 },
  { name: "Fresh Butter Croissant", category: "food", unitPrice: 90, unitCost: 30 },
  { name: "Cappuccino Special", category: "beverages", unitPrice: 140, unitCost: 45 },
  { name: "Veg Club Sandwich", category: "food", unitPrice: 150, unitCost: 50 },
  { name: "Belgian Chocolate Cake (1kg)", category: "bakery", unitPrice: 1200, unitCost: 450 },
  { name: "Masala Chai Pot", category: "beverages", unitPrice: 60, unitCost: 18 },
];

export function LiveTransactionModal({ merchantId, isOpen, onClose, onTransactionCreated }) {
  const [transactionType, setTransactionType] = useState("SALE");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [productName, setProductName] = useState("Cold Brew Coffee");
  const [category, setCategory] = useState("beverages");
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(160);
  const [unitCost, setUnitCost] = useState(55);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const totalAmount = Math.max(0, quantity * unitPrice - discount);

  const handleSelectPreset = (p) => {
    setProductName(p.name);
    setCategory(p.category);
    setUnitPrice(p.unitPrice);
    setUnitCost(p.unitCost);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!merchantId) return;

    setLoading(true);
    setError(null);

    try {
      const payload = {
        transactionType,
        amount: totalAmount,
        discount: Number(discount) || 0,
        paymentMethod,
        paymentStatus: transactionType === "REFUND" ? "refunded" : "completed",
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        items: [
          {
            name: productName,
            category,
            quantity: Number(quantity) || 1,
            unitPrice: Number(unitPrice) || 0,
            unitCost: Number(unitCost) || null,
            totalPrice: totalAmount,
          },
        ],
        isLiveSimulated: true,
      };

      const res = await createLiveTransaction(merchantId, payload);
      if (onTransactionCreated) {
        onTransactionCreated(res.data);
      }
      onClose();
    } catch (err) {
      console.error("Transaction creation failed:", err);
      setError(err.message || "Failed to process transaction.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-gray-100 space-y-5 animate-in fade-in zoom-in-95 duration-150 my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3.5">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-blue-50 text-[#002970] flex items-center justify-center text-lg font-black shrink-0">
              ⚡
            </span>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-gray-950 leading-tight">
                Live Transaction Entry
              </h3>
              <p className="text-xs text-gray-500">Real-time ledger recording &amp; AI pulse trigger</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-lg p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs font-semibold">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          {/* Type Selector Tabs (SALE vs REFUND) */}
          <div className="flex rounded-xl bg-gray-100 p-1 font-bold">
            <button
              type="button"
              onClick={() => setTransactionType("SALE")}
              className={`flex-1 py-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                transactionType === "SALE"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <span>+ NEW SALE</span>
              <span>💰</span>
            </button>
            <button
              type="button"
              onClick={() => setTransactionType("REFUND")}
              className={`flex-1 py-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                transactionType === "REFUND"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <span>- ISSUE REFUND</span>
              <span>↩️</span>
            </button>
          </div>

          {/* Quick Item Presets */}
          <div>
            <label className="block font-bold text-gray-700 text-[11px] uppercase tracking-wider mb-1.5">
              Quick Item Presets:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_PRODUCTS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => handleSelectPreset(p)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                    productName === p.name
                      ? "bg-blue-50 border-[#002970] text-[#002970]"
                      : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {p.name} (₹{p.unitPrice})
                </button>
              ))}
            </div>
          </div>

          {/* Customer Fields */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-700 text-[11px] uppercase tracking-wider mb-1">
                Customer Name
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Rahul Verma"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#002970]"
              />
            </div>
            <div>
              <label className="block font-bold text-gray-700 text-[11px] uppercase tracking-wider mb-1">
                Phone (Optional)
              </label>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="e.g. 9876543210"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#002970]"
              />
            </div>
          </div>

          {/* Product & Quantity */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block font-bold text-gray-700 text-[11px] uppercase tracking-wider mb-1">
                Product / Item
              </label>
              <input
                type="text"
                required
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#002970]"
              />
            </div>
            <div>
              <label className="block font-bold text-gray-700 text-[11px] uppercase tracking-wider mb-1">
                Quantity
              </label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#002970]"
              />
            </div>
          </div>

          {/* Pricing & Unit Cost */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-gray-700 text-[11px] uppercase tracking-wider mb-1">
                Unit Price (₹)
              </label>
              <input
                type="number"
                min="0"
                required
                value={unitPrice}
                onChange={(e) => setUnitPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#002970]"
              />
            </div>
            <div>
              <label className="block font-bold text-gray-700 text-[11px] uppercase tracking-wider mb-1" title="Cost of goods for gross profit calculation">
                Unit Cost (₹ COGS)
              </label>
              <input
                type="number"
                min="0"
                value={unitCost}
                onChange={(e) => setUnitCost(Math.max(0, parseFloat(e.target.value) || 0))}
                placeholder="Opt. cost"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#002970]"
              />
            </div>
            <div>
              <label className="block font-bold text-gray-700 text-[11px] uppercase tracking-wider mb-1">
                Discount (₹)
              </label>
              <input
                type="number"
                min="0"
                value={discount}
                onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#002970]"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-700 text-[11px] uppercase tracking-wider mb-1">
                Payment Channel
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#002970]"
              >
                <option value="upi">Paytm UPI / QR</option>
                <option value="card">Debit / Credit Card</option>
                <option value="cash">Cash Counter</option>
                <option value="netbanking">Net Banking</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-gray-700 text-[11px] uppercase tracking-wider mb-1">
                Net Transaction Total
              </label>
              <div className="px-3.5 py-2 bg-blue-50/80 border border-blue-200 rounded-xl font-black text-gray-950 text-base">
                {transactionType === "REFUND" ? "-" : "+"}₹{totalAmount.toLocaleString("en-IN")}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary text-xs px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`text-xs px-5 py-2.5 rounded-xl font-black text-white transition-all shadow-sm flex items-center gap-1.5 ${
                transactionType === "REFUND"
                  ? "bg-rose-600 hover:bg-rose-700"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              <span>{loading ? "Recording..." : transactionType === "REFUND" ? "Issue Refund" : "Post Live Sale"}</span>
              <span>⚡</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
