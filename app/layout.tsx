import type { Metadata, Viewport } from "next";
import "./globals.css";

/**
 * Root layout metadata for native Capacitor / standalone shell.
 * Production web shell is Vite (`artifacts/majalis`); native push registration
 * is triggered from `NativeNotificationsBootstrap` in App.tsx (not here),
 * so Web and Native paths never double-register.
 */
export const metadata: Metadata = {
  title: "Majlisilm",
  description:
    "تطبيق عربي يجمع الدروس الشرعية والدورات والمحاضرات والقرآن والأذكار والفوائد في مكان واحد لطالب العلم.",
  applicationName: "Majlisilm",
  appleWebApp: {
    capable: true,
    title: "Majlisilm",
    statusBarStyle: "black-translucent",
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
