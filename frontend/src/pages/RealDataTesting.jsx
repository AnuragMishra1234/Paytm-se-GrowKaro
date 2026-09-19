import React, { useState } from "react";
import {
  previewDataset,
  analyzeDataset,
  queryDatasetCopilot,
  deleteDatasetSession,
} from "../services/api";
import { HourlyChart } from "../components/charts/HourlyChart";
import { WeekdayChart } from "../components/charts/WeekdayChart";
import { CategoryChart } from "../components/charts/CategoryChart";

// Pre-packaged sample CSV datasets for fast testing
const SAMPLE_CAFE_CSV = `transaction_id,timestamp,customer_id,customer_name,product,category,amount,payment_method,payment_status
TX1001,2026-09-01T09:15:00Z,CUST_01,Ananya Das,Cold Brew Coffee,Beverages,220,upi,completed
TX1002,2026-09-01T09:30:00Z,CUST_02,Vikram Patel,Butter Croissant,Bakery,180,upi,completed
TX1003,2026-09-01T14:15:00Z,CUST_01,Ananya Das,Cold Brew Coffee,Beverages,220,upi,completed
TX1004,2026-09-01T14:30:00Z,CUST_03,Rohan Sharma,Paneer Tikka Sandwich,Food,250,card,completed
TX1005,2026-09-02T10:00:00Z,CUST_04,Sneha Rao,Cappuccino,Beverages,190,upi,completed
TX1006,2026-09-02T15:00:00Z,CUST_02,Vikram Patel,Cold Brew Coffee,Beverages,220,upi,completed
TX1007,2026-09-02T15:30:00Z,CUST_05,Pooja Nair,Blueberry Cheesecake,Desserts,350,card,completed
TX1008,2026-09-03T09:45:00Z,CUST_01,Ananya Das,Butter Croissant,Bakery,180,upi,completed
TX1009,2026-09-03T14:45:00Z,CUST_06,Arjun Kapoor,Cold Brew Coffee,Beverages,220,upi,completed
TX1010,2026-09-03T16:00:00Z,CUST_01,Ananya Das,Fudge Brownie,Desserts,240,upi,completed
TX1011,2026-09-04T11:20:00Z,CUST_07,Kiran Kumar,Cafe Mocha,Beverages,250,cash,completed
TX1012,2026-09-04T14:30:00Z,CUST_08,Meera Joshi,Iced Vanilla Latte,Beverages,220,upi,completed
TX1013,2026-09-05T10:10:00Z,CUST_01,Ananya Das,Cold Brew Coffee,Beverages,220,upi,completed
TX1014,2026-09-05T14:00:00Z,CUST_02,Vikram Patel,Chocolate Croissant,Bakery,210,card,completed
TX1015,2026-09-06T15:00:00Z,CUST_09,Aditya Roy,Pasta Arrabiata,Food,380,upi,completed
TX1016,2026-09-07T14:15:00Z,CUST_10,Divya Menon,Cold Brew Coffee,Beverages,220,upi,completed
TX1017,2026-09-08T09:30:00Z,CUST_01,Ananya Das,Cold Brew Coffee,Beverages,220,upi,completed
TX1018,2026-09-08T16:45:00Z,CUST_02,Vikram Patel,Classic Tiramisu,Desserts,360,card,completed
TX1019,2026-09-09T14:30:00Z,CUST_01,Ananya Das,Cold Brew Coffee,Beverages,220,upi,completed
TX1020,2026-09-09T15:15:00Z,CUST_03,Rohan Sharma,Veg Club Sandwich,Food,290,upi,completed`;

const SAMPLE_RETAIL_NO_CUST_CSV = `date,time,sku_name,dept,sales_value,mode
2026-09-01,10:30,Aashirvaad Atta 5kg,Staples,340,cash
2026-09-01,11:15,Amul Taaza Milk 1L,Dairy,68,upi
2026-09-01,14:20,Tata Salt 1kg,Staples,28,upi
2026-09-01,15:45,Fortune Sunlite Oil 1L,Staples,145,card
2026-09-02,09:30,Surf Excel Matic 2kg,Household,420,upi
2026-09-02,14:10,Parle-G Gold Biscuit,Snacks,30,cash
2026-09-02,18:20,Maggi Noodles 4-pack,Snacks,64,upi
2026-09-03,11:00,Amul Butter 500g,Dairy,275,upi
2026-09-03,14:30,Tata Tea Gold 500g,Beverages,310,card
2026-09-04,15:00,Colgate MaxFresh,Personal Care,115,upi
2026-09-04,19:15,Aashirvaad Atta 5kg,Staples,340,upi
2026-09-05,10:45,Dettol Liquid Soap,Personal Care,99,cash
2026-09-05,14:00,Fortune Sunlite Oil 1L,Staples,145,upi
2026-09-05,18:30,Amul Taaza Milk 1L,Dairy,68,upi
2026-09-06,12:00,Cadbury Dairy Milk Silk,Snacks,175,upi`;

const SAMPLE_PAYMENT_ONLY_CSV = `payment_ref,transaction_date,amount,mode,status
PAY_901,2026-09-01T10:15:00Z,450,upi,success
PAY_902,2026-09-01T11:45:00Z,220,upi,success
PAY_903,2026-09-01T14:30:00Z,180,upi,success
PAY_904,2026-09-01T17:15:00Z,650,card,success
PAY_905,2026-09-02T09:45:00Z,340,upi,success
PAY_906,2026-09-02T14:15:00Z,220,upi,success
PAY_907,2026-09-02T15:00:00Z,190,upi,success
PAY_908,2026-09-03T11:00:00Z,580,upi,success
PAY_909,2026-09-03T14:45:00Z,220,upi,success
PAY_910,2026-09-03T18:30:00Z,720,card,success
PAY_911,2026-09-04T10:00:00Z,310,upi,success
PAY_912,2026-09-04T15:30:00Z,250,upi,success
PAY_913,2026-09-05T14:00:00Z,180,upi,success
PAY_914,2026-09-05T17:45:00Z,890,upi,success
PAY_915,2026-09-06T12:30:00Z,420,card,success`;

export default function RealDataTesting() {
  const [step, setStep] = useState("upload"); // 'upload' | 'mapping' | 'dashboard'
  const [rawText, setRawText] = useState("");
  const [fileName, setFileName] = useState("");
  const [previewInfo, setPreviewInfo] = useState(null);
  const [columnMapping, setColumnMapping] = useState({});
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);

  // Active Session Results
  const [sessionData, setSessionData] = useState(null);

  // Copilot in Real Data Mode
  const [copilotQuery, setCopilotQuery] = useState("");
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [copilotHistory, setCopilotHistory] = useState([]);

  // File Upload Handlers
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      setRawText(text);
      processPreview(text, file.name);
    };
    reader.readAsText(file);
  };

  const handleLoadSample = (sampleText, name) => {
    setFileName(name);
    setRawText(sampleText);
    processPreview(sampleText, name);
  };

  const processPreview = async (text, name) => {
    setLoading(true);
    setError(null);
    try {
      const res = await previewDataset({ rawContent: text, fileName: name });
      if (res.success) {
        setPreviewInfo(res.data);
        setColumnMapping(res.data.suggestedMapping || {});
        setStep("mapping");
      }
    } catch (err) {
      setError(err.message || "Failed to parse dataset preview.");
    } finally {
      setLoading(false);
    }
  };

  const handleRunAnalysis = async () => {
    if (!columnMapping.amount || !columnMapping.date) {
      setError("Please map both Amount and Date columns (required for analytics).");
      return;
    }

    setAnalyzing(true);
    setError(null);
    try {
      const res = await analyzeDataset({
        rawContent: rawText,
        fileName,
        columnMapping,
      });

      if (res.success) {
        setSessionData(res.data);
        setStep("dashboard");
      }
    } catch (err) {
      setError(err.message || "Failed to analyze dataset.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleClearSession = async () => {
    if (sessionData?.sessionId) {
      try {
        await deleteDatasetSession(sessionData.sessionId);
      } catch (err) {}
    }
    setSessionData(null);
    setStep("upload");
    setRawText("");
    setFileName("");
    setPreviewInfo(null);
    setCopilotHistory([]);
  };

  const handleSendCopilotQuery = async (e) => {
    e.preventDefault();
    if (!copilotQuery.trim() || !sessionData?.sessionId) return;
    const q = copilotQuery.trim();
    setCopilotQuery("");
    setCopilotLoading(true);

    const userMsg = { role: "user", text: q };
    setCopilotHistory((prev) => [...prev, userMsg]);

    try {
      const res = await queryDatasetCopilot(sessionData.sessionId, q);
      if (res.success) {
        setCopilotHistory((prev) => [
          ...prev,
          { role: "assistant", text: res.data.answer, source: res.data.source },
        ]);
      }
    } catch (err) {
      setCopilotHistory((prev) => [
        ...prev,
        { role: "assistant", text: "Error querying dataset facts: " + err.message },
      ]);
    } finally {
      setCopilotLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* ─── Header & Data Source Mode Indicator ───────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`text-xs font-black px-3 py-0.5 rounded-full uppercase tracking-wider border ${
                step === "dashboard"
                  ? "bg-amber-50 text-amber-800 border-amber-200"
                  : "bg-blue-50 text-[#002970] border-blue-200"
              }`}
            >
              {step === "dashboard" ? `REAL DATA TEST · ${sessionData?.fileName}` : "DATASET TESTING CONSOLE"}
            </span>
            <span className="text-xs font-bold text-gray-400">Isolated Workspace</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-950 tracking-tight">
            Test With Real Data
          </h1>
          <p className="text-sm text-gray-600 mt-0.5 font-medium">
            Upload custom CSV transactions and explore deterministic analytics, AI insights, and customer loyalty.
          </p>
        </div>

        {step === "dashboard" && (
          <button
            onClick={handleClearSession}
            className="px-4 py-2 text-xs sm:text-sm font-bold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-xl transition-all self-start sm:self-auto"
          >
            ✕ Exit Real Data & Clear Session
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs sm:text-sm font-semibold flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-rose-500 font-bold ml-2">✕</button>
        </div>
      )}

      {/* ─── STEP 1: UPLOAD VIEW ───────────────────────────────────────────── */}
      {step === "upload" && (
        <div className="space-y-6 max-w-3xl mx-auto py-4">
          <div className="bg-white rounded-3xl border-2 border-dashed border-gray-300 p-8 sm:p-12 text-center space-y-4 hover:border-[#002970] transition-all group">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 text-[#002970] mx-auto flex items-center justify-center text-2xl shadow-xs group-hover:scale-105 transition-transform">
              📊
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900">
                Upload Your Business Dataset
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
                Drag and drop your transaction CSV file here, or browse from your computer.
              </p>
            </div>

            <label className="inline-block px-5 py-2.5 bg-[#002970] text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-[#001f54] cursor-pointer transition-all shadow-sm">
              <span>Browse CSV File</span>
              <input
                type="file"
                accept=".csv,text/csv,text/plain"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <p className="text-xs text-gray-400 font-medium">
              Supported formats: CSV, TSV, RFC-4180 text. No files stored permanently.
            </p>
          </div>

          {/* Quick Pre-Packaged Datasets for Immediate Evaluation */}
          <div className="bg-gray-50 rounded-2xl border border-gray-200/80 p-6 space-y-3">
            <span className="text-xs font-black uppercase tracking-wider text-gray-500 block">
              Quick Test: Try with Pre-Configured Sample Datasets
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => handleLoadSample(SAMPLE_CAFE_CSV, "cafe_sample_with_customers.csv")}
                className="p-3 bg-white border border-gray-200 rounded-xl text-left hover:border-[#002970] hover:shadow-xs transition-all space-y-1"
              >
                <strong className="text-xs sm:text-sm font-bold text-gray-900 block">
                  ☕ Cafe (Items + Customers)
                </strong>
                <span className="text-xs text-gray-500 block">
                  Full items, customer IDs, and repeat orders. (High Confidence)
                </span>
              </button>

              <button
                onClick={() => handleLoadSample(SAMPLE_RETAIL_NO_CUST_CSV, "retail_grocery_anonymous.csv")}
                className="p-3 bg-white border border-gray-200 rounded-xl text-left hover:border-[#002970] hover:shadow-xs transition-all space-y-1"
              >
                <strong className="text-xs sm:text-sm font-bold text-gray-900 block">
                  🛒 Retail (Items, No Customers)
                </strong>
                <span className="text-xs text-gray-500 block">
                  Tests graceful handling when customer IDs are omitted.
                </span>
              </button>

              <button
                onClick={() => handleLoadSample(SAMPLE_PAYMENT_ONLY_CSV, "paytm_payments_only.csv")}
                className="p-3 bg-white border border-amber-300 rounded-xl text-left hover:border-amber-500 hover:shadow-xs transition-all space-y-1 bg-amber-50/30"
              >
                <strong className="text-xs sm:text-sm font-bold text-amber-950 block">
                  💳 Payment-Only (No Products)
                </strong>
                <span className="text-xs text-amber-800 block">
                  Tests Data Honesty standard &amp; limitation disclaimer. (Low Confidence)
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── STEP 2: COLUMN MAPPING & VALIDATION ───────────────────────────── */}
      {step === "mapping" && previewInfo && (
        <div className="space-y-6 max-w-4xl mx-auto py-2">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-gray-950">
                  Confirm Column Mapping: {fileName}
                </h3>
                <p className="text-xs text-gray-500">
                  GrowKaro auto-detected column mappings based on your headers. Confirm or edit below.
                </p>
              </div>
              <button
                onClick={() => setStep("upload")}
                className="text-xs font-bold text-gray-500 hover:text-gray-800"
              >
                ‹ Choose Different File
              </button>
            </div>

            {/* Mapping Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Transaction Amount <span className="text-rose-500">* Required</span>
                </label>
                <select
                  value={columnMapping.amount || ""}
                  onChange={(e) => setColumnMapping({ ...columnMapping, amount: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl bg-white font-medium"
                >
                  <option value="">-- Select Column --</option>
                  {previewInfo.headers.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Transaction Date / Time <span className="text-rose-500">* Required</span>
                </label>
                <select
                  value={columnMapping.date || ""}
                  onChange={(e) => setColumnMapping({ ...columnMapping, date: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl bg-white font-medium"
                >
                  <option value="">-- Select Column --</option>
                  {previewInfo.headers.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Customer ID / Phone <span className="text-gray-400">(Optional)</span>
                </label>
                <select
                  value={columnMapping.customerId || ""}
                  onChange={(e) => setColumnMapping({ ...columnMapping, customerId: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl bg-white font-medium"
                >
                  <option value="">-- Optional (Not in Dataset) --</option>
                  {previewInfo.headers.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Customer Name <span className="text-gray-400">(Optional)</span>
                </label>
                <select
                  value={columnMapping.customerName || ""}
                  onChange={(e) => setColumnMapping({ ...columnMapping, customerName: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl bg-white font-medium"
                >
                  <option value="">-- Optional (Not in Dataset) --</option>
                  {previewInfo.headers.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Product / Item Name <span className="text-gray-400">(Optional)</span>
                </label>
                <select
                  value={columnMapping.product || ""}
                  onChange={(e) => setColumnMapping({ ...columnMapping, product: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl bg-white font-medium"
                >
                  <option value="">-- Optional (Not in Dataset) --</option>
                  {previewInfo.headers.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Product Category <span className="text-gray-400">(Optional)</span>
                </label>
                <select
                  value={columnMapping.category || ""}
                  onChange={(e) => setColumnMapping({ ...columnMapping, category: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl bg-white font-medium"
                >
                  <option value="">-- Optional (Not in Dataset) --</option>
                  {previewInfo.headers.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Preview Table */}
            <div className="pt-2">
              <span className="text-xs font-black uppercase tracking-wider text-gray-400 block mb-2">
                First 5 Rows Preview:
              </span>
              <div className="overflow-x-auto border border-gray-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold">
                    <tr>
                      {previewInfo.headers.map((h) => (
                        <th key={h} className="px-3 py-2 truncate max-w-[140px]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {previewInfo.previewRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50">
                        {previewInfo.headers.map((h) => (
                          <td key={h} className="px-3 py-2 truncate max-w-[140px] text-gray-700">
                            {row[h]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between border-t border-gray-100">
              <span className="text-xs text-gray-500">
                Total Rows Detected: <strong>{previewInfo.totalRows}</strong>
              </span>
              <button
                onClick={handleRunAnalysis}
                disabled={analyzing}
                className="px-6 py-2.5 bg-[#002970] text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-[#001f54] transition-all shadow-md disabled:opacity-50"
              >
                {analyzing ? "Running Validation & AI Analysis..." : "Validate & Analyze Dataset ›"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── STEP 3: REAL DATA DASHBOARD & COPILOT ─────────────────────────── */}
      {step === "dashboard" && sessionData && (
        <div className="space-y-6">
          {/* Quality Summary Banner */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-gray-400 tracking-wider">
                Data Quality &amp; Completeness Report
              </span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                {sessionData.qualitySummary.validRows} Valid Transactions
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 text-xs sm:text-sm">
              <div className="bg-gray-50 p-3 rounded-xl">
                <span className="text-gray-400 block text-xs uppercase font-bold">Total Rows</span>
                <strong className="text-sm sm:text-base text-gray-900">{sessionData.qualitySummary.totalRows}</strong>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl">
                <span className="text-gray-400 block text-xs uppercase font-bold">Valid Rows</span>
                <strong className="text-sm sm:text-base text-emerald-600">{sessionData.qualitySummary.validRows}</strong>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl">
                <span className="text-gray-400 block text-xs uppercase font-bold">Invalid Rows</span>
                <strong className="text-sm sm:text-base text-gray-900">{sessionData.qualitySummary.invalidRows}</strong>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl">
                <span className="text-gray-400 block text-xs uppercase font-bold">Duplicate Rows</span>
                <strong className="text-sm sm:text-base text-gray-900">{sessionData.qualitySummary.duplicateRows}</strong>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl">
                <span className="text-gray-400 block text-xs uppercase font-bold">Customer IDs</span>
                <strong className={`text-sm sm:text-base ${sessionData.hasCustomerIdentifiers ? "text-[#002970]" : "text-amber-600"}`}>
                  {sessionData.hasCustomerIdentifiers ? "Detected" : "None Provided"}
                </strong>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl">
                <span className="text-gray-400 block text-xs uppercase font-bold">Product Data</span>
                <strong className={`text-sm sm:text-base ${sessionData.hasProductData !== false ? "text-emerald-600" : "text-amber-600"}`}>
                  {sessionData.hasProductData !== false ? "Available" : "Missing / None"}
                </strong>
              </div>
            </div>
          </div>

          {/* Data Honesty & Confidence Banner */}
          {sessionData.hasProductData === false || sessionData.dataConfidence === "LOW" ? (
            <div className="bg-amber-50/90 border-2 border-amber-300 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 text-amber-950 shadow-2xs">
              <span className="text-2xl shrink-0">⚠️</span>
              <div className="space-y-1 text-xs sm:text-sm">
                <div className="flex items-center gap-2 flex-wrap">
                  <strong className="text-sm sm:text-base font-black text-amber-950">
                    Data Limitation Notice · LOW CONFIDENCE
                  </strong>
                  <span className="badge bg-amber-200/80 text-amber-900 border border-amber-300 text-[10px] font-bold px-2 py-0.5 rounded">
                    Payment-Level Data Only
                  </span>
                </div>
                <p className="font-semibold text-amber-900">
                  {sessionData.limitationDisclaimer || "Product-level insights unavailable because the uploaded dataset does not contain item-level order data."}
                </p>
                <p className="text-amber-800 text-xs">
                  Overall revenue, transaction velocity, AOV, and peak/weak hour patterns remain deterministically 100% accurate. Product basket analysis and combo recommendations are honestly withheld to prevent AI hallucinations.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50/90 border border-emerald-300 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-emerald-950 shadow-2xs">
              <div className="flex items-center gap-3">
                <span className="text-xl shrink-0">🛡️</span>
                <div className="text-xs sm:text-sm">
                  <strong className="font-black text-emerald-950 mr-2">
                    Verified Itemized Dataset · HIGH CONFIDENCE
                  </strong>
                  <span className="text-emerald-800 font-medium">
                    Item-level order data detected. Product affinity, combo recommendations, and category turnover are active.
                  </span>
                </div>
              </div>
              <span className="badge bg-emerald-200/70 text-emerald-900 border border-emerald-300 text-xs font-bold px-2.5 py-1 rounded-full shrink-0 self-start sm:self-auto">
                Full AI Reasoning Active
              </span>
            </div>
          )}

          {/* Primary KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-2xs">
              <span className="text-xs sm:text-sm font-bold text-gray-500 block mb-1">Total Revenue</span>
              <span className="text-2xl font-black text-gray-900">
                ₹{sessionData.analyticsSummary.totalRevenue.toLocaleString("en-IN")}
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-2xs">
              <span className="text-xs sm:text-sm font-bold text-gray-500 block mb-1">Transactions</span>
              <span className="text-2xl font-black text-gray-900">
                {sessionData.analyticsSummary.transactionCount.toLocaleString("en-IN")}
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-2xs">
              <span className="text-xs sm:text-sm font-bold text-gray-500 block mb-1">Average Order Value (AOV)</span>
              <span className="text-2xl font-black text-gray-900">
                ₹{sessionData.analyticsSummary.aov}
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-2xs">
              <span className="text-xs sm:text-sm font-bold text-gray-500 block mb-1">Repeat Customer %</span>
              <span className="text-2xl font-black text-gray-900">
                {sessionData.customerIntelligence?.repeatRate ? `${sessionData.customerIntelligence.repeatRate}%` : "N/A"}
              </span>
            </div>
          </div>

          {/* Hourly & Weekday Patterns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-gray-950 text-base">Hourly Sales Distribution</h3>
                <span className="text-xs sm:text-sm text-gray-500">Peak: {sessionData.analyticsSummary.peakHours?.join(", ") || "N/A"}</span>
              </div>
              <HourlyChart data={sessionData.analyticsSummary.hourlyDistribution} />
            </div>

            <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-gray-950 text-base">Weekday Sales Distribution</h3>
                <span className="text-xs sm:text-sm text-gray-500">Day-of-week patterns</span>
              </div>
              <WeekdayChart data={sessionData.analyticsSummary.weekdayDistribution} />
            </div>
          </div>

          {/* AI Insights Grounded on Real Dataset */}
          <div className="space-y-3">
            <h2 className="text-lg font-black text-gray-900">
              AI Insights Discovered From This Dataset
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {sessionData.insights?.map((insight, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-gray-200/80 p-5 space-y-3 shadow-2xs hover:border-[#002970] transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-black px-2.5 py-0.5 rounded-full uppercase border ${
                        insight.category === "ACT_NOW"
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : "bg-blue-50 text-[#002970] border-blue-200"
                      }`}
                    >
                      {insight.category}
                    </span>
                    <span className="text-xs font-bold text-gray-400">{insight.severity}</span>
                  </div>

                  <h4 className="font-black text-gray-900 text-sm sm:text-base">{insight.title}</h4>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-medium">{insight.description}</p>

                  <div className="p-3 bg-gray-50 rounded-xl text-xs sm:text-sm text-gray-600 space-y-1">
                    <strong className="text-gray-800 block">Evidence:</strong>
                    {insight.evidence?.map((ev, eIdx) => (
                      <div key={eIdx}>• {ev}</div>
                    ))}
                  </div>

                  <div className="p-2.5 bg-blue-50/50 rounded-xl text-xs sm:text-sm text-[#002970] font-medium">
                    💡 <strong>Action:</strong> {insight.recommendation}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Customer Intelligence & Loyalty (if Customer IDs present) */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-black text-gray-950">
                  Customer Loyalty Intelligence
                </h3>
                <p className="text-xs sm:text-sm text-gray-500">
                  {sessionData.hasCustomerIdentifiers
                    ? `Identified ${sessionData.customerProfiles?.length} unique patrons with repeat patterns.`
                    : "Customer-level personalization requires a customer identifier in the dataset."}
                </p>
              </div>
            </div>

            {sessionData.hasCustomerIdentifiers ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {sessionData.customerProfiles?.slice(0, 3).map((cust, cIdx) => (
                  <div key={cIdx} className="p-4 bg-gray-50 rounded-xl border border-gray-200/70 space-y-2">
                    <div className="flex items-center justify-between">
                      <strong className="text-sm font-bold text-gray-900">{cust.displayName}</strong>
                      <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                        {cust.segmentTags?.[0] || "LOYAL"}
                      </span>
                    </div>
                    <div className="text-xs sm:text-sm text-gray-500">
                      {cust.totalVisits} visits · ₹{cust.totalSpend.toLocaleString("en-IN")} spend
                    </div>
                    <div className="text-xs sm:text-sm text-gray-700 font-medium">
                      Favorite: <strong className="text-[#002970]">{cust.favoriteProduct}</strong>
                    </div>
                    {cust.opportunity && (
                      <div className="text-xs text-rose-700 bg-rose-50 p-2.5 rounded-lg border border-rose-100 font-semibold">
                        Opportunity: {cust.opportunity}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs sm:text-sm text-amber-800 font-medium">
                Notice: To unlock customer segmentation, repeat patron detection, and personalized offers, include a <code>customer_id</code> or <code>phone</code> column in your CSV.
              </div>
            )}
          </div>

          {/* Scoped Real-Data AI Copilot */}
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-xl">🤖</span>
              <div>
                <h3 className="text-base sm:text-lg font-black text-gray-950">
                  Ask AI Copilot About This Dataset
                </h3>
                <p className="text-xs sm:text-sm text-gray-500">
                  Grounded exclusively in this dataset's calculated facts.
                </p>
              </div>
            </div>

            {copilotHistory.length > 0 && (
              <div className="space-y-3 max-h-60 overflow-y-auto p-4 bg-white rounded-xl border border-gray-200 text-xs sm:text-sm">
                {copilotHistory.map((msg, mIdx) => (
                  <div
                    key={mIdx}
                    className={`p-3.5 rounded-xl ${
                      msg.role === "user"
                        ? "bg-blue-50 text-[#002970] ml-8 font-semibold"
                        : "bg-gray-50 text-gray-800 mr-8"
                    }`}
                  >
                    <span className="text-xs font-black uppercase block mb-1 opacity-60">
                      {msg.role === "user" ? "You" : "GrowKaro Real-Data Copilot"}
                    </span>
                    <div className="whitespace-pre-line leading-relaxed">{msg.text}</div>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleSendCopilotQuery} className="flex gap-2">
              <input
                type="text"
                value={copilotQuery}
                onChange={(e) => setCopilotQuery(e.target.value)}
                placeholder="Ask about weak sales hours, top selling products, or loyal patrons..."
                className="flex-1 px-4 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#002970] outline-hidden font-medium"
              />
              <button
                type="submit"
                disabled={copilotLoading || !copilotQuery.trim()}
                className="px-5 py-2.5 bg-[#002970] text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-[#001f54] transition-all disabled:opacity-50"
              >
                {copilotLoading ? "Analyzing..." : "Ask"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
