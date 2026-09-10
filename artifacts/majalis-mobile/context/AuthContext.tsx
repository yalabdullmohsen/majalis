import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export type AuthStatus = "initializing" | "ready" | "error";

interface AuthUser {
  id: string;
  email?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAdmin: boolean;
  /** true أثناء استعادة الجلسة لأول مرة — لا تعرض شاشة دخول/حساب نهائية */
  loading: boolean;
  status: AuthStatus;
  signOut: () => Promise<void>;
}

type AuthProfileUser = {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  loading: true,
  status: "initializing",
  signOut: async () => {},
});

async function fetchOrCreateProfile(supabaseUser: AuthProfileUser) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", supabaseUser.id)
    .single();

  if (profile) return profile;

  const fullName =
    typeof supabaseUser.user_metadata?.full_name === "string"
      ? supabaseUser.user_metadata.full_name
      : "";

  const { data: created } = await supabase
    .from("profiles")
    .upsert(
      {
        id: supabaseUser.id,
        full_name: fullName,
        role: "user",
      },
      { onConflict: "id" },
    )
    .select("role")
    .single();

  return created;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [status, setStatus] = useState<AuthStatus>("initializing");
  const aliveRef = useRef(true);
  const bootDoneRef = useRef(false);
  const hydrateGen = useRef(0);

  const hydrateUser = useCallback(async (supabaseUser: AuthProfileUser | null) => {
    const gen = ++hydrateGen.current;
    if (!aliveRef.current) return;

    if (!supabaseUser) {
      setUser(null);
      setIsAdmin(false);
      return;
    }

    // لا نعرض حالة وسيطة خاطئة: حدّث المستخدم والإدارة معًا بعد اكتمال الملف
    const profile = await fetchOrCreateProfile(supabaseUser);
    if (!aliveRef.current || gen !== hydrateGen.current) return;

    setUser({ id: supabaseUser.id, email: supabaseUser.email });
    setIsAdmin(profile?.role === "admin");
  }, []);

  useEffect(() => {
    aliveRef.current = true;

    const finishBoot = (next: AuthStatus = "ready") => {
      if (bootDoneRef.current) return;
      bootDoneRef.current = true;
      if (aliveRef.current) setStatus(next);
    };

    supabase.auth
      .getSession()
      .then(async ({ data: { session } }) => {
        try {
          await hydrateUser(session?.user ?? null);
          finishBoot("ready");
        } catch {
          finishBoot("error");
        }
      })
      .catch(() => {
        finishBoot("error");
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // INITIAL_SESSION يُغطى بـ getSession — تجنب hydrate مزدوج عند الإقلاع
      if (event === "INITIAL_SESSION") return;
      try {
        await hydrateUser(session?.user ?? null);
        if (event === "SIGNED_OUT") {
          queryClient.clear();
        }
      } catch {
        /* تجاهل أخطاء الشبكة أثناء تغيّر الجلسة */
      }
    });

    return () => {
      aliveRef.current = false;
      subscription.unsubscribe();
    };
  }, [hydrateUser, queryClient]);

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
    queryClient.clear();
  }, [queryClient]);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isAdmin,
      loading: status === "initializing",
      status,
      signOut: handleSignOut,
    }),
    [user, isAdmin, status, handleSignOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
