import type { Metadata } from "next";
import { Amiri, Almarai } from "next/font/google";
import { AppShell } from "@/components/AppShell";
import "./globals.css";

const amiri = Amiri({
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
  variable: "--font-amiri",
  display: "swap",
});

const almarai = Almarai({
  subsets: ["arabic"],
  weight: ["300", "400", "700", "800"],
  variable: "--font-almarai",
  display: "swap",
});

const siteDescription =
  "منصة علمية عربية تجمع الدروس الشرعية والدورات والقرآن والأذكار والفوائد في مكان واحد لطالب العلم.";

export const metadata: Metadata = {
  metadataBase: new URL("https://majlisilm.com"),
  title: {
    default: "المجلس العلمي — دروس شرعية ودورات علمية",
    template: "%s | مجالس العلم",
  },
  description: siteDescription,
  keywords: [
    "المجلس العلمي",
    "مجالس العلم",
    "دروس شرعية",
    "دورات علمية",
    "طلب العلم",
    "القرآن الكريم",
    "الأذكار",
    "الفوائد الدينية",
  ],
  authors: [{ name: "المجلس العلمي" }],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "ar_AR",
    url: "https://majlisilm.com",
    siteName: "المجلس العلمي",
    title: "المجلس العلمي — دروس شرعية ودورات علمية",
    description: siteDescription,
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "المجلس العلمي",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "المجلس العلمي — دروس شرعية ودورات علمية",
    description: siteDescription,
    images: ["/logo.png"],
  },
  alternates: {
    canonical: "https://majlisilm.com",
  },
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${amiri.variable} ${almarai.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var k="majalis-theme-preference";var p=localStorage.getItem(k)||"system";var d=p==="dark"||(p==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.dataset.theme=d?"dark":"light";if(d)document.documentElement.classList.add("dark");document.documentElement.style.colorScheme=d?"dark":"light";}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
