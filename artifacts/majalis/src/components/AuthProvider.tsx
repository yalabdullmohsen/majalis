import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { ADMIN_GOVERNANCE_ROLES, LEGACY_ROLE_MAP } from "@/lib/governance-roles";
import { hasUnrestrictedAdminAccess, isOwnerProfile, isOwnerAuthUser, resolveUserEmail } from "@/lib/owner-config";
import { RequestManager, PAGE_LOAD_TIMEOUT_MS } from "@/lib/request-manager";

type SupabaseAuthModule = typeof import("@/lib/supabase");

export type AuthUser = Awaited<ReturnType<SupabaseAuthModule["getCurrentUser"]>>;

type AuthContextValue = {
  user: AuthUser;
  loading: boolean;
  isLoggedIn: boolean;
  isAdmin: boolean;
  isOwner: boolean;
  isSuperAdmin: boolean;
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
  const activeRef = useRef(true);
  const signedOutGeneration = useRef(0);
  const bootstrapDone = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.__MAJALIS_USER_ID__ = user?.id ?? null;
    }
  }, [user]);

  useEffect(() => {
    activeRef.current = true;
    let unsubscribe: (() => void) | undefined;
    const authTimeout = window.setTimeout(() => {
      if (activeRef.current) setLoading(false);
    }, PAGE_LOAD_TIMEOUT_MS);

    const generationAtStart = signedOutGeneration.current;

    const bootstrap = async () => {
      const { bootstrapSupabaseFromServer, resetSupabaseClient } = await import("@/lib/supabase-bootstrap");
      await RequestManager.run("auth:bootstrap", () =>
        bootstrapSupabaseFromServer().then(() => resetSupabaseClient()),
      );
      const mod = await import("@/lib/supabase");
      if (!activeRef.current) return mod;

      setAuthApi(mod);

      // استعادة الجلسة مرة واحدة فقط — لا مسار bootstrap مزدوج يتسابق مع المستمع
      if (!bootstrapDone.current) {
        bootstrapDone.current = true;
        try {
          const next = await RequestManager.run("auth:getCurrentUser", () => mod.getCurrentUser());
          if (
            activeRef.current &&
            signedOutGeneration.current === generationAtStart &&
            next !== null &&
            next !== undefined
          ) {
            setUser(next);
          }
        } catch {
          if (activeRef.current && signedOutGeneration.current === generationAtStart) {
            setUser(null);
          }
        } finally {
          if (activeRef.current) setLoading(false);
          window.clearTimeout(authTimeout);
        }
      }

      return mod;
    };

    void bootstrap()
      .then((mod) => {
        if (!mod || !activeRef.current) return;

        const { data: sub } = mod.supabase.auth.onAuthStateChange((event) => {
          // لا عمل ثقيل داخل callback — جدولة دقيقة فقط
          if (event === "SIGNED_OUT") {
            signedOutGeneration.current += 1;
            if (activeRef.current) setUser(null);
            return;
          }

          // INITIAL_SESSION وTOKEN_REFRESHED: لا إعادة جلب للملف الشخصي
          // (الاستعادة تتم عبر bootstrap أعلاه؛ التجديد لا يغيّر الهوية)
          if (event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") {
            return;
          }

          const gen = signedOutGeneration.current;
          queueMicrotask(() => {
            void RequestManager.run(`auth:onAuthStateChange:${event}`, () => mod.getCurrentUser())
              .then((next) => {
                if (!activeRef.current) return;
                if (signedOutGeneration.current !== gen) return; // سباق sign-out
                if (next !== null && next !== undefined) setUser(next);
              })
              .catch(() => {
                /* شبكة مؤقتة — لا تمسح الجلسة */
              });
          });
        });
        unsubscribe = () => sub.subscription.unsubscribe();
      })
      .catch(() => {
        if (activeRef.current) {
          setUser(null);
          setLoading(false);
        }
        window.clearTimeout(authTimeout);
      });

    return () => {
      activeRef.current = false;
      window.clearTimeout(authTimeout);
      unsubscribe?.();
    };
  }, []);

  const refreshUser = useCallback(async () => {
    if (!authApi) return null;
    const gen = signedOutGeneration.current;
    const next = await authApi.getCurrentUser();
    if (signedOutGeneration.current !== gen) return null;
    setUser(next);
    return next;
  }, [authApi]);

  const logout = useCallback(async () => {
    if (!authApi) return { error: null };
    signedOutGeneration.current += 1;
    setUser(null);
    try {
      return await authApi.signOut();
    } catch (error) {
      return { error };
    }
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

    const isSuperAdmin =
      isOwner ||
      governanceRole === "super_admin" ||
      user?.profile?.is_super_admin === true ||
      user?.profile?.role === "super_admin";

    const isAdmin = isSuperAdmin || ADMIN_GOVERNANCE_ROLES.includes(governanceRole);

    return {
      user,
      loading,
      isLoggedIn: !!user,
      isAdmin,
      isOwner,
      isSuperAdmin,
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
