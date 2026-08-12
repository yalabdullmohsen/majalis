import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface AuthUser {
  id: string;
  email?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAdmin: boolean;
  loading: boolean;
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
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    const hydrateUser = async (supabaseUser: AuthProfileUser | null) => {
      if (!alive) return;
      if (!supabaseUser) {
        setUser(null);
        setIsAdmin(false);
        return;
      }
      setUser({ id: supabaseUser.id, email: supabaseUser.email });
      const profile = await fetchOrCreateProfile(supabaseUser);
      if (!alive) return;
      setIsAdmin(profile?.role === "admin");
    };

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      await hydrateUser(session?.user ?? null);
      if (alive) setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      await hydrateUser(session?.user ?? null);
    });

    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, signOut: handleSignOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
