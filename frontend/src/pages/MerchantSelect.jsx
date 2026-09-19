import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMerchantContext } from "../context/MerchantContext";
import { fetchMerchants } from "../services/api";
import { getBusinessTypeInfo } from "../utils/formatters";
import { LoadingSpinner, ErrorState } from "../components/LoadingSpinner";

export default function MerchantSelect() {
  const { setMerchant, merchant } = useMerchantContext();
  const navigate = useNavigate();
  const [merchants, setMerchants] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // If already logged in, redirect
  useEffect(() => {
    if (merchant) navigate("/dashboard", { replace: true });
  }, [merchant, navigate]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchMerchants();
        setMerchants(res.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleContinue = () => {
    if (!selected) return;
    setMerchant(selected);
    navigate("/dashboard");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
        <LoadingSpinner message="Loading merchants..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
        <div className="text-center">
          <ErrorState message={error} onRetry={() => window.location.reload()} />
          <p className="text-xs text-gray-400 mt-4">
            Make sure the backend is running on port 5000
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <img 
            src="/logo-transparent.png" 
            alt="GrowKaro" 
            className="h-20 sm:h-24 w-auto mx-auto mb-3 object-contain" 
          />
          <p className="text-gray-500 font-medium">Your Autonomous AI Business Partner</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-1">Welcome</h2>
          <p className="text-sm text-gray-500 mb-5">Select your business to continue</p>

          <div className="space-y-3 mb-6">
            {merchants.map((m) => {
              const { label, logo } = getBusinessTypeInfo(m.businessType, m.businessName);
              const isSelected = selected?._id === m._id;
              return (
                <button
                  key={m._id}
                  onClick={() => setSelected(m)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                    isSelected
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center p-1.5 border shadow-2xs overflow-hidden transition-all shrink-0 ${
                    isSelected ? "bg-white border-blue-400 shadow-sm" : "bg-white border-gray-200"
                  }`}>
                    <img
                      src={logo}
                      alt={m.businessName}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold truncate ${isSelected ? "text-blue-900" : "text-gray-900"}`}>
                      {m.businessName}
                    </p>
                    <p className={`text-sm ${isSelected ? "text-blue-600" : "text-gray-500"}`}>
                      {label} · {m.location?.city || "India"}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center shrink-0">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <button
            onClick={handleContinue}
            disabled={!selected}
            className="btn-primary w-full py-3 text-base"
          >
            Continue to Dashboard →
          </button>

          {merchants.length === 0 && (
            <p className="text-center text-sm text-gray-400 mt-4">
              No merchants found. Run <code className="bg-gray-100 px-1 rounded">npm run seed</code> in the backend.
            </p>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          GrowKaro · Phase 1 Demo · Hackathon Prototype
        </p>
      </div>
    </div>
  );
}