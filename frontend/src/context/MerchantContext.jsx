import React, { createContext, useContext, useState, useEffect } from "react";

const MerchantContext = createContext(null);

const STORAGE_KEY = "growkaro_merchant";

export function MerchantProvider({ children }) {
  const [merchant, setMerchantState] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const setMerchant = (m) => {
    setMerchantState(m);
    if (m) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(m));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const clearMerchant = () => setMerchant(null);

  return (
    <MerchantContext.Provider value={{ merchant, setMerchant, clearMerchant }}>
      {children}
    </MerchantContext.Provider>
  );
}

export function useMerchantContext() {
  const ctx = useContext(MerchantContext);
  if (!ctx) throw new Error("useMerchantContext must be used inside MerchantProvider");
  return ctx;
}