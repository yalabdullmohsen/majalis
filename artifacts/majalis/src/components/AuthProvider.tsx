import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase, getCurrentUser, signIn, signUp, signOut } from "@/lib/supabase";

const AuthContext = createContext<any>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentUser().then((u) => {
      setUser(u);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange(async () => {
      setUser(await getCurrentUser());
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const value = {
    user,
    loading,
    isLoggedIn: !!user,
    isAdmin: user?.profile?.role === "admin",
    isSheikh: user?.profile?.role === "sheikh",
    login: signIn,
    register: signUp,
    logout: signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
