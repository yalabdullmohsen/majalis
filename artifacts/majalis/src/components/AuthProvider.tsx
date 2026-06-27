"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ADMIN_GOVERNANCE_ROLES, LEGACY_ROLE_MAP } from "@/lib/governance-roles";
import { getCurrentUser, signIn, signOut, signUp, supabase } from "@/lib/supabase";

export type AuthUser = Awaited<ReturnType<typeof getCurrentUser>>;

type AuthContextValue = {
  user: AuthUser;
  loading: boolean;
  isLoggedIn: boolean;
  isAdmin: boolean;
  isSheikh: boolean;
  login: typeof signIn;
  register: typeof signUp;
  logout: () => Promise<{ error: unknown | null }>;
  refreshUser: () => Promise<AuthUser>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.__MAJALIS_USER_ID__ = user?.id ?? null;
    }
  }, [user]);

  useEffect(() => {
    let active = true;

    const loadUser = async () => {
      try {
        const next = await getCurrentUser();
        if (active) setUser(next);
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!active) return;
      if (!session?.user) {
        setUser(null);
        return;
      }
      const next = await getCurrentUser();
      if (active) setUser(next);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const refreshUser = useCallback(async () => {
    const next = await getCurrentUser();
    setUser(next);
    return next;
  }, []);

  const logout = useCallback(async () => {
    const result = await signOut();
    setUser(null);
    return result;
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const governanceRole =
      user?.governance_role ||
      LEGACY_ROLE_MAP[user?.profile?.role || "user"] ||
      "read_only";

    return {
      user,
      loading,
      isLoggedIn: !!user,
      isAdmin: ADMIN_GOVERNANCE_ROLES.includes(governanceRole),
      isSheikh: governanceRole === "scientific_reviewer" || user?.profile?.role === "sheikh",
      login: signIn,
      register: signUp,
      logout,
      refreshUser,
    };
  }, [user, loading, logout, refreshUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
