"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { AuthProvider } from "@/components/AuthProvider";
import { FontPreferenceProvider } from "@/components/FontPreferenceProvider";
import { SiteFooter } from "@/components/SiteFooter";
import { ThemePreferenceProvider } from "@/components/ThemePreferenceProvider";

const NavBar = dynamic(() => import("@/components/NavBar"), {
  ssr: false,
  loading: () => <header className="navbar-v3" style={{ minHeight: "4rem" }} aria-hidden="true" />,
});

const AssistantFloatingWidget = dynamic(
  () => import("@/components/assistant/AssistantFloatingWidget"),
  { ssr: false },
);

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <ThemePreferenceProvider>
      <FontPreferenceProvider>
        <AuthProvider>
          <div className="app-shell" style={{ minHeight: "100vh", direction: "rtl" }}>
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
      </FontPreferenceProvider>
    </ThemePreferenceProvider>
  );
}
