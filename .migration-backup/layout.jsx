// =====================================================================
//  app/layout.jsx — الهيكل العام لكل الصفحات (RTL + الخطوط + المصادقة)
// =====================================================================

import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import NavBar from "@/components/NavBar";

export const metadata = {
  title: "مجالس العلم — المنصة العلمية الشرعية",
  description: "الدروس والدورات والمشايخ والمكتبة العلمية والإعجاز العلمي في مكان واحد",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Almarai:wght@300;400;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>
          <NavBar />
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
