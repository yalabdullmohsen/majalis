import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ADMIN_GOVERNANCE_ROLES, LEGACY_ROLE_MAP } from "@/lib/governance-roles";
import { hasUnrestrictedAdminAccess, isOwnerProfile, isOwnerAuthUser, resolveUserEmail } from "@/lib/owner-config";
import { RequestManager, PAGE_LOAD_TIMEOUT_MS } from "@/lib/request-manager";

type SupabaseAuthModule = typeof import("@/lib/supabase");

export type AuthUser = Awaited<ReturnType<SupabaseAuthModule["getCurrentUser"]>>;

/** حالة جلسة مستقلة — لا تعرض دخول/حساب قبل اكتمال التهيئة */
export type AuthStatus = "initializing" | "authenticated" | "unauthenticated" | "error";

type AuthContextValue = {
  user: AuthUser;
  /** true طالما status === initializing */
  loading: boolean;
  status: AuthStatus;
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
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AuthUser>(null);
  const [status, setStatus] = useState<AuthStatus>("initializing");
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
      if (!activeRef.current) return;
      setStatus((prev) => (prev === "initializing" ? "unauthenticated" : prev));
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
          if (!activeRef.current || signedOutGeneration.current !== generationAtStart) return mod;
          if (next !== null && next !== undefined) {
            setUser(next);
            setStatus("authenticated");
            if (next?.id) {
              void import("@/lib/guest-cloud-merge").then((m) =>
                m.scheduleGuestCloudMerge(next.id),
              );
            }
          } else {
            setUser(null);
            setStatus("unauthenticated");
          }
        } catch {
          if (activeRef.current && signedOutGeneration.current === generationAtStart) {
            setUser(null);
            setStatus("error");
          }
        } finally {
          window.clearTimeout(authTimeout);
        }
      }

      return mod;
    };

    const shouldBootstrapSoon = (() => {
      try {
        // أصلي: التوكن قد يكون في Preferences قبل اكتمال hydrate → localStorage
        // فتح bootstrap فورًا يمنع وميض «زائر» ثم «مسجّل».
        const cap = (
          window as Window & {
            Capacitor?: { isNativePlatform?: () => boolean };
          }
        ).Capacitor;
        if (cap?.isNativePlatform?.()) return true;

        const path = window.location.pathname || "/";
        if (/^\/(login|register|admin|stats|profile|account)(\/|$)/.test(path)) return true;
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.includes("-auth-token") || key.endsWith("auth-token"))) return true;
        }
      } catch {
        /* التخزين أو المسار غير متاح */
      }
      return false;
    })();

    let bootstrapStarted = false;
    const startBootstrap = () => {
      if (bootstrapStarted) return;
      bootstrapStarted = true;
      void bootstrap()
        .then((mod) => {
          if (!mod || !activeRef.current) return;

          const { data: sub } = mod.supabase.auth.onAuthStateChange((event) => {
            // لا عمل ثقيل داخل callback — جدولة دقيقة فقط
            if (event === "SIGNED_OUT") {
              signedOutGeneration.current += 1;
              if (activeRef.current) {
                setUser(null);
                setStatus("unauthenticated");
                queryClient.clear();
              }
              void import("@/lib/quran-audio-resume").then((m) => m.clearAudioResumeState());
              void import("@/lib/lesson-audio-resume").then((m) => m.clearAllLessonAudioResume());
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
                  if (next !== null && next !== undefined) {
                    setUser(next);
                    setStatus("authenticated");
                    if (event === "SIGNED_IN" && next.id) {
                      void import("@/lib/guest-cloud-merge").then((m) =>
                        m.scheduleGuestCloudMerge(next.id),
                      );
                    }
                  }
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
            setStatus("error");
          }
          window.clearTimeout(authTimeout);
        });
    };

    let delayHandle: number | undefined;
    const armInteraction = () => startBootstrap();
    if (shouldBootstrapSoon) {
      startBootstrap();
    } else {
      // زائر بلا جلسة: لا تحمّل supabase في نافذة Lighthouse.
      // مهم: لا تستخدم requestIdleCallback هنا — يُطلق فور الخمول (~ثوانٍ) فيُحسب Unused JS.
      if (activeRef.current) setStatus("unauthenticated");
      delayHandle = window.setTimeout(startBootstrap, 20000);
      window.addEventListener("pointerdown", armInteraction, { once: true, passive: true });
      window.addEventListener("keydown", armInteraction, { once: true });
    }

    return () => {
      activeRef.current = false;
      window.clearTimeout(authTimeout);
      if (delayHandle != null) window.clearTimeout(delayHandle);
      window.removeEventListener("pointerdown", armInteraction);
      window.removeEventListener("keydown", armInteraction);
      unsubscribe?.();
    };
  }, [queryClient]);

  const refreshUser = useCallback(async () => {
    if (!authApi) return null;
    const gen = signedOutGeneration.current;
    const next = await authApi.getCurrentUser();
    if (signedOutGeneration.current !== gen) return null;
    setUser(next);
    setStatus(next ? "authenticated" : "unauthenticated");
    return next;
  }, [authApi]);

  const logout = useCallback(async () => {
    if (!authApi) return { error: null };
    signedOutGeneration.current += 1;
    setUser(null);
    setStatus("unauthenticated");
    queryClient.clear();
    void import("@/lib/quran-audio-resume").then((m) => m.clearAudioResumeState());
    void import("@/lib/lesson-audio-resume").then((m) => m.clearAllLessonAudioResume());
    try {
      return await authApi.signOut();
    } catch (error) {
      return { error };
    }
  }, [authApi, queryClient]);

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
      loading: status === "initializing",
      status,
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
  }, [authApi, user, status, logout, refreshUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
