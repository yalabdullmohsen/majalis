"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ADMIN_GOVERNANCE_ROLES, LEGACY_ROLE_MAP } from "@/lib/governance-roles";
import { hasUnrestrictedAdminAccess, isOwnerProfile, isOwnerAuthUser, resolveUserEmail } from "@/lib/owner-config";

type SupabaseAuthModule = typeof import("@/lib/supabase");

export type AuthUser = Awaited<ReturnType<SupabaseAuthModule["getCurrentUser"]>>;

type AuthContextValue = {
  user: AuthUser;
  loading: boolean;
  isLoggedIn: boolean;
  isAdmin: boolean;
  isOwner: boolean;
  isSheikh: boolean;
  login: SupabaseAuthModule["signIn"];
  register: SupabaseAuthModule["signUp"];
  logout: () => Promise<{ error: unknown | null }>;
  refreshUser: () => Promise<AuthUser>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const noopAuth = async () => ({ data: null, error: new Error("Auth not ready") } as never);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser>(null);
  const [loading, setLoading] = useState(true);
  const [authApi, setAuthApi] = useState<SupabaseAuthModule | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.__MAJALIS_USER_ID__ = user?.id ?? null;
    }
  }, [user]);

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;

    import("@/lib/supabase-bootstrap")
      .then(({ bootstrapSupabaseFromServer, resetSupabaseClient }) =>
        bootstrapSupabaseFromServer().then(() => resetSupabaseClient()),
      )
      .then(() => import("@/lib/supabase"))
      .then((mod) => {
        if (!active) return;
        setAuthApi(mod);

        return mod.getCurrentUser().then((next) => {
          if (active) setUser(next);
        });
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    import("@/lib/supabase-bootstrap")
      .then(({ bootstrapSupabaseFromServer, resetSupabaseClient }) =>
        bootstrapSupabaseFromServer().then(() => resetSupabaseClient()),
      )
      .then(() => import("@/lib/supabase"))
      .then((mod) => {
      const { data: sub } = mod.supabase.auth.onAuthStateChange(async () => {
        const next = await mod.getCurrentUser();
        if (active) setUser(next);
      });
      unsubscribe = () => sub.subscription.unsubscribe();
    });

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  const refreshUser = useCallback(async () => {
    if (!authApi) return null;
    const next = await authApi.getCurrentUser();
    setUser(next);
    return next;
  }, [authApi]);

  const logout = useCallback(async () => {
    if (!authApi) return { error: null };
    const result = await authApi.signOut();
    setUser(null);
    return result;
  }, [authApi]);

  const value = useMemo<AuthContextValue>(() => {
    const governanceRole =
      user?.governance_role ||
      LEGACY_ROLE_MAP[user?.profile?.role || "user"] ||
      "read_only";

    const isOwner =
      user?.is_owner === true ||
      isOwnerProfile(user?.profile) ||
      isOwnerAuthUser(user, user?.profile) ||
      hasUnrestrictedAdminAccess({
        email: resolveUserEmail(user),
        profile: user?.profile,
        governanceRole,
      });

    const isAdmin = isOwner || ADMIN_GOVERNANCE_ROLES.includes(governanceRole);

    return {
      user,
      loading,
      isLoggedIn: !!user,
      isAdmin,
      isOwner,
      isSheikh: governanceRole === "scientific_reviewer" || user?.profile?.role === "sheikh",
      login: authApi?.signIn ?? noopAuth,
      register: authApi?.signUp ?? noopAuth,
      logout,
      refreshUser,
    };
  }, [authApi, user, loading, logout, refreshUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
