import React from "react";

export function DigitalReceiptModal({ isOpen, onClose, transaction, merchant }) {
  if (!isOpen || !transaction) return null;

  const isRefund = transaction.transactionType === "REFUND" || transaction.paymentStatus === "refunded";
  const billNo = transaction.billNumber || `BILL-#${transaction._id?.toString().slice(-5).toUpperCase() || "10482"}`;
  const dateStr = transaction.timestamp
    ? new Date(transaction.timestamp).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : "Just now";

  const customerName = transaction.customer || transaction.customerName || "Walk-in Customer";
  const customerPhone = transaction.customerPhone || "N/A";
  const customerSegment = transaction.customerSegment || "Regular";

  const items = transaction.items && transaction.items.length > 0
    ? transaction.items
    : [
        {
          name: isRefund ? "Order Refund Return" : "Counter Sale Item",
          quantity: 1,
          unitPrice: transaction.amount || 0,
          totalPrice: transaction.amount || 0,
        },
      ];

  const subtotal = items.reduce((sum, it) => sum + (it.totalPrice || (it.quantity * it.unitPrice) || 0), 0);
  const discount = transaction.discount || 0;
  const taxableAmount = Math.max(0, subtotal - discount);
  const cgst = isRefund ? 0 : Math.round(taxableAmount * 0.025);
  const sgst = isRefund ? 0 : Math.round(taxableAmount * 0.025);
  const totalBill = transaction.amount || (taxableAmount + cgst + sgst);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Receipt Top Header */}
        <div className="bg-gradient-to-r from-gray-900 via-[#002970] to-blue-950 p-6 text-white text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white text-xl w-8 h-8 rounded-full bg-white/10 flex items-center justify-center transition-all"
          >
            ✕
          </button>
          <div className="w-12 h-12 mx-auto mb-2 rounded-2xl bg-white/10 flex items-center justify-center text-2xl border border-white/20">
            ☕
          </div>
          <h3 className="text-xl font-black tracking-tight">{merchant?.businessName || "Cafe Aroma"}</h3>
          <p className="text-xs text-blue-200 mt-0.5">{merchant?.location || "Indiranagar, Bangalore · Karnataka"}</p>
          <div className="inline-flex items-center gap-2 mt-2 px-3 py-1 rounded-full bg-white/10 text-[11px] font-mono tracking-wider border border-white/15">
            <span>GSTIN: 29ABCDE1234F1Z5</span>
            <span>·</span>
            <span>FSSAI: 11223344005566</span>
          </div>
        </div>

        {/* Bill Meta Strip */}
        <div className="p-6 space-y-5 bg-white text-gray-800 text-sm">
          {/* Bill Number & Type Banner */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">
                Bill / Tax Invoice No.
              </span>
              <span className="text-base font-black text-gray-950 font-mono tracking-wide">
                {billNo}
              </span>
            </div>
            <div className="text-right">
              <span
                className={`text-xs font-black uppercase px-2.5 py-1 rounded-full border ${
                  isRefund
                    ? "bg-rose-50 text-rose-800 border-rose-200"
                    : "bg-emerald-50 text-emerald-800 border-emerald-200"
                }`}
              >
                {isRefund ? "↩ REFUND MEMO" : "✓ TAX INVOICE"}
              </span>
              <span className="text-[11px] text-gray-400 block mt-1">{dateStr}</span>
            </div>
          </div>

          {/* Customer & Server Details */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100 text-xs">
            <div>
              <span className="text-gray-400 font-bold block">Customer:</span>
              <strong className="text-gray-950 block truncate">{customerName}</strong>
              <span className="text-gray-500 font-mono text-[11px]">{customerPhone}</span>
            </div>
            <div>
              <span className="text-gray-400 font-bold block">Terminal / Cashier:</span>
              <strong className="text-gray-950 block">POS Counter #01</strong>
              <span className="text-purple-700 font-bold text-[11px] uppercase tracking-wide">
                {customerSegment} Patron
              </span>
            </div>
          </div>

          {/* Items Ordered Table */}
          <div className="space-y-2">
            <div className="text-xs font-black uppercase tracking-wider text-gray-400 flex items-center justify-between pb-1 border-b border-gray-100">
              <span>Items Ordered</span>
              <span>Amount</span>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {items.map((item, idx) => {
                const qty = item.quantity || 1;
                const price = item.unitPrice || 0;
                const total = item.totalPrice || (qty * price);

                return (
                  <div key={idx} className="flex items-start justify-between text-xs py-1 border-b border-gray-50 last:border-0">
                    <div className="flex-1 pr-2">
                      <div className="font-bold text-gray-900 leading-snug">
                        {item.name || item.productName || "Counter Item"}
                      </div>
                      <div className="text-[11px] text-gray-500 font-medium">
                        {qty} × ₹{price.toLocaleString("en-IN")}
                        {item.category && <span className="ml-2 text-gray-400">({item.category})</span>}
                      </div>
                    </div>
                    <div className="font-mono font-black text-gray-950 text-right">
                      ₹{total.toLocaleString("en-IN")}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bill Total Calculations */}
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-1.5 text-xs font-medium">
            <div className="flex items-center justify-between text-gray-600">
              <span>Item Subtotal:</span>
              <span className="font-mono">₹{subtotal.toLocaleString("en-IN")}</span>
            </div>

            {discount > 0 && (
              <div className="flex items-center justify-between text-rose-600 font-bold">
                <span>Discount / Promo:</span>
                <span className="font-mono">-₹{discount.toLocaleString("en-IN")}</span>
              </div>
            )}

            {!isRefund && (
              <>
                <div className="flex items-center justify-between text-gray-500">
                  <span>CGST (2.5%):</span>
                  <span className="font-mono">₹{cgst.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex items-center justify-between text-gray-500">
                  <span>SGST (2.5%):</span>
                  <span className="font-mono">₹{sgst.toLocaleString("en-IN")}</span>
                </div>
              </>
            )}

            <div className="pt-2 border-t border-gray-200 flex items-center justify-between text-sm sm:text-base font-black text-gray-950">
              <span>{isRefund ? "Total Refunded:" : "Total Bill Paid:"}</span>
              <span className={`font-mono text-lg ${isRefund ? "text-rose-700" : "text-emerald-700"}`}>
                {isRefund ? "-" : ""}₹{Number(totalBill).toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          {/* Payment Mode Strip */}
          <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Paid via: <strong className="uppercase text-gray-800">{transaction.paymentMethod || "Paytm UPI"}</strong></span>
            </span>
            <span className="font-mono text-[11px] text-gray-400">
              Ref: TXN-{transaction._id?.toString().slice(-8).toUpperCase()}
            </span>
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-3">
            <button
              onClick={() => window.print()}
              className="btn-secondary text-xs py-2.5 px-4 font-bold flex-1 flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <span>🖨️ Print Receipt</span>
            </button>
            <button
              onClick={onClose}
              className="btn-primary text-xs py-2.5 px-4 font-bold flex-1 shadow-2xs"
            >
              Done / Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
export default DigitalReceiptModal;
