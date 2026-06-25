import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
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

  const refreshUser = useCallback(async () => {
    const next = await getCurrentUser();
    setUser(next);
    return next;
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));

    const { data: sub } = supabase.auth.onAuthStateChange(async () => {
      await refreshUser();
    });
    return () => sub.subscription.unsubscribe();
  }, [refreshUser]);

  const logout = useCallback(async () => {
    const result = await signOut();
    setUser(null);
    return result;
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    isLoggedIn: !!user,
    isAdmin: user?.profile?.role === "admin",
    isSheikh: user?.profile?.role === "sheikh",
    login: signIn,
    register: signUp,
    logout,
    refreshUser,
  }), [user, loading, logout, refreshUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
