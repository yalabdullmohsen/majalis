"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { AuthProvider } from "@/components/AuthProvider";
import { FontPreferenceProvider } from "@/components/FontPreferenceProvider";
import { SiteFooter } from "@/components/SiteFooter";
import { ThemePreferenceProvider } from "@/components/ThemePreferenceProvider";
import { UserPreferencesProvider } from "@/components/UserPreferencesProvider";

const NavBar = dynamic(() => import("@/components/NavBar"), {
  ssr: false,
  loading: () => <header className="navbar-v3 navbar-v3-placeholder" aria-hidden="true" />,
});

const AssistantFloatingWidget = dynamic(
  () => import("@/components/assistant/AssistantFloatingWidget"),
  { ssr: false },
);

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <ThemePreferenceProvider>
      <FontPreferenceProvider>
        <UserPreferencesProvider>
          <AuthProvider>
          <div className="app-shell">
            <a href="#main-content" className="skip-link">
              تخطّي إلى المحتوى
            </a>
            <NavBar />
            <main id="main-content" className="app-main" tabIndex={-1}>
              {children}
            </main>
            <SiteFooter />
            <AssistantFloatingWidget />
          </div>
          </AuthProvider>
        </UserPreferencesProvider>
      </FontPreferenceProvider>
    </ThemePreferenceProvider>
  );
}
