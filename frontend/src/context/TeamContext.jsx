import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { fetchMerchantTeam } from "../services/api";
import { useMerchantContext } from "./MerchantContext";

const TeamContext = createContext(null);

/**
 * GrowKaro Personas:
 * 1. MANAGER DASHBOARD: Priya Sharma (Whole Manager Product)
 * 2. EMPLOYEE DASHBOARD (Employee Prototype):
 *    - Rahul Verma (Marketing Lead)
 *    - Ananya Das (Floor Operations & Barista)
 */
export const DEMO_PERSONAS = {
  MANAGER: {
    role: "MANAGER",
    mode: "MANAGER",
    name: "Priya Sharma",
    title: "Store Manager",
    badge: "Manager",
    icon: "Briefcase",
    email: "priya@cafearoma.in",
    avatar: "PS",
    description: "Full store manager product: AI detection, approvals, team tasks, and analytics",
  },
  MARKETING: {
    role: "MARKETING",
    mode: "EMPLOYEE",
    name: "Rahul Verma",
    title: "Marketing Lead",
    badge: "Marketing",
    icon: "Megaphone",
    email: "rahul@cafearoma.in",
    avatar: "RV",
    description: "Employee prototype: WhatsApp campaigns, customer opportunities, and AI loyalty",
  },
  STAFF: {
    role: "STAFF",
    mode: "EMPLOYEE",
    name: "Ananya Das",
    title: "Floor Operations & Barista",
    badge: "Staff",
    icon: "Coffee",
    email: "ananya@cafearoma.in",
    avatar: "AD",
    description: "Employee prototype: Inventory prep, shift checklist, and counter readiness",
  },
};

export const TeamProvider = ({ children, merchantId: propMerchantId }) => {
  const { merchant } = useMerchantContext();
  const merchantId = propMerchantId || merchant?._id;

  const [currentRole, setCurrentRole] = useState(() => {
    const saved = localStorage.getItem("growkaro_demo_role");
    // Automatically migrate legacy OWNER to MANAGER
    if (saved === "OWNER" || !saved || !DEMO_PERSONAS[saved]) {
      return "MANAGER";
    }
    return saved;
  });

  const [teamMembers, setTeamMembers] = useState([]);
  const [loadingTeam, setLoadingTeam] = useState(false);

  const activePersona = DEMO_PERSONAS[currentRole] || DEMO_PERSONAS.MANAGER;
  const activeMode = activePersona.mode; // 'MANAGER' or 'EMPLOYEE'

  const switchRole = useCallback((newRole) => {
    const roleToSet = newRole === "OWNER" ? "MANAGER" : newRole;
    if (DEMO_PERSONAS[roleToSet]) {
      setCurrentRole(roleToSet);
      localStorage.setItem("growkaro_demo_role", roleToSet);
    }
  }, []);

  const switchMode = useCallback((newMode) => {
    if (newMode === "MANAGER") {
      switchRole("MANAGER");
    } else {
      // Switch to employee mode (default to MARKETING if coming from manager)
      const empRole = currentRole === "STAFF" ? "STAFF" : "MARKETING";
      switchRole(empRole);
    }
  }, [currentRole, switchRole]);

  const refreshTeam = useCallback(async (id = merchantId) => {
    if (!id) return;
    try {
      setLoadingTeam(true);
      const res = await fetchMerchantTeam(id);
      if (res?.success) {
        setTeamMembers(res.data);
      }
    } catch (err) {
      console.warn("Failed to fetch team:", err.message);
    } finally {
      setLoadingTeam(false);
    }
  }, [merchantId]);

  useEffect(() => {
    if (merchantId) {
      refreshTeam(merchantId);
    }
  }, [merchantId, refreshTeam]);

  const hasPermission = useCallback((permission) => {
    if (currentRole === "MANAGER" || currentRole === "OWNER") return true;
    return activePersona.permissions?.includes(permission) || false;
  }, [currentRole, activePersona]);

  const value = {
    currentRole,
    activeMode,
    activePersona,
    personas: DEMO_PERSONAS,
    switchRole,
    switchMode,
    teamMembers,
    loadingTeam,
    refreshTeam,
    hasPermission,
    canManageTeam: currentRole === "MANAGER" || currentRole === "OWNER",
  };

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>;
};

export const useTeam = () => {
  const context = useContext(TeamContext);
  if (!context) {
    throw new Error("useTeam must be used within a TeamProvider");
  }
  return context;
};
