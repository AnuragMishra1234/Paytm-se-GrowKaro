/**
 * formatters.js — Shared formatting utilities
 * All currency, date, and percentage formatting lives here.
 * Import from here; never inline formatting logic in components.
 */

/**
 * Format a number as Indian Rupees (INR)
 * e.g. 18420 → "₹18,420"
 */
export const formatINR = (value, decimals = 0) => {
  if (value == null || isNaN(value)) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

/**
 * Format a number with Indian comma notation
 * e.g. 150000 → "1,50,000"
 */
export const formatNumber = (value) => {
  if (value == null || isNaN(value)) return "0";
  return new Intl.NumberFormat("en-IN").format(Math.round(value));
};

/**
 * Format percentage with sign
 * e.g. 12.4 → "+12.4%", -5.2 → "-5.2%"
 */
export const formatPercent = (value, showSign = true) => {
  if (value == null || isNaN(value)) return "0%";
  const sign = showSign && value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
};

/**
 * Format date string to readable form
 * e.g. "2026-09-18" → "18 Sep"
 */
export const formatDate = (dateStr, format = "short") => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";
  if (format === "short") {
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
  }
  if (format === "long") {
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  }
  if (format === "time") {
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("en-IN");
};

/**
 * Format a Date object to relative time
 * e.g. "2 days ago", "just now"
 */
export const formatRelativeTime = (date) => {
  if (!date) return "-";
  const d = new Date(date);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 30 * 86400) return `${Math.floor(diff / 86400)}d ago`;
  return formatDate(date, "long");
};

/**
 * Merchant brand logos mapped to merchant type or name
 * 1) Cafe -> /merchants/cafe-logo.png
 * 2) Kirana -> /merchants/kirana-logo.png
 * 3) Style Studio -> /merchants/style-studio-logo.png
 */
export const getMerchantLogo = (merchantOrType) => {
  if (!merchantOrType) return "/merchants/cafe-logo.png";
  const type = (typeof merchantOrType === "string" ? merchantOrType : merchantOrType.businessType || "").toLowerCase();
  const name = (typeof merchantOrType === "object" ? merchantOrType.businessName || "" : "").toLowerCase();

  if (type === "cafe" || name.includes("cafe") || name.includes("aroma")) {
    return "/merchants/cafe-logo.png";
  }
  if (type === "kirana" || name.includes("kirana") || name.includes("grocery")) {
    return "/merchants/kirana-logo.png";
  }
  if (type === "salon" || name.includes("style") || name.includes("studio")) {
    return "/merchants/style-studio-logo.png";
  }
  return "/merchants/cafe-logo.png";
};

/**
 * Get business type display info
 */
export const getBusinessTypeInfo = (type, businessName = "") => {
  const logo = getMerchantLogo({ businessType: type, businessName });
  const map = {
    cafe: { label: "Cafe", logo, icon: "" },
    kirana: { label: "Kirana Store", logo, icon: "" },
    salon: { label: "Style Studio", logo, icon: "" },
    restaurant: { label: "Restaurant", logo, icon: "" },
    retail: { label: "Retail", logo, icon: "" },
    pharmacy: { label: "Pharmacy", logo, icon: "" },
    other: { label: "Business", logo, icon: "" },
  };
  return map[type] || { label: "Business", logo, icon: "" };
};

/**
 * Compute color class for a change value
 */
export const changeColor = (value) => {
  if (value > 0) return "text-green-600";
  if (value < 0) return "text-red-600";
  return "text-gray-500";
};

/**
 * Segment badge styles
 */
export const segmentStyle = (segment) => {
  const map = {
    vip: "bg-purple-100 text-purple-800",
    repeat: "bg-blue-100 text-blue-800",
    new: "bg-green-100 text-green-800",
    inactive: "bg-gray-100 text-gray-600",
  };
  return map[segment] || map.new;
};