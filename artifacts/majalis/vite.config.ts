import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { majalisApiPlugin } from "./server/vite-plugin-api.mjs";

const rawPort = process.env.PORT || "5000";

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH || "/";

const commitHash = process.env.VERCEL_GIT_COMMIT_SHA || process.env.GIT_COMMIT || "dev";
const buildId = process.env.VERCEL_DEPLOYMENT_ID || process.env.BUILD_ID || "local";

export default defineConfig({
  base: basePath,
  define: {
    "import.meta.env.VITE_COMMIT_HASH": JSON.stringify(commitHash),
    "import.meta.env.VITE_BUILD_ID": JSON.stringify(buildId),
    "import.meta.env.VITE_VERCEL_GIT_COMMIT_SHA": JSON.stringify(process.env.VERCEL_GIT_COMMIT_SHA || ""),
  },
  plugins: [
    react(),
    tailwindcss(),
    majalisApiPlugin(),
    runtimeErrorOverlay(),
    ...(process.env.ANALYZE === "1" ? [visualizer({ open: false, filename: "dist/bundle-stats.html", gzipSize: true, brotliSize: true })] : []),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, ".."),
            }),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
    cssMinify: true,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("@supabase")) return "supabase";
            if (id.includes("html2canvas") || id.includes("html-to-image")) return "html2canvas";
            if (id.includes("date-fns")) return "date-fns";
            if (id.includes("lucide-react")) return "icons";
            if (id.includes("@radix-ui")) return "radix";
            if (id.includes("recharts") || id.includes("d3-") || id.includes("victory")) return "charts";
            if (id.includes("adhan")) return "adhan";
            if (id.includes("@tanstack")) return "query";
            if (id.includes("react") || id.includes("wouter") || id.includes("scheduler")) return "vendor";
            if (id.includes("zod") || id.includes("react-hook-form") || id.includes("@hookform")) return "forms";
            if (id.includes("framer-motion") || id.includes("motion")) return "animation";
            if (id.includes("cmdk") || id.includes("vaul") || id.includes("sonner")) return "ui-extra";
            if (id.includes("mapbox") || id.includes("leaflet") || id.includes("maplibre")) return "maps";
          }
          // admin — فقط لصفحات الإدارة
          if (id.includes("src/views/AdminPage") || id.includes("src/views/admin/")) return "admin";
          // واجهات المنزل
          if (id.includes("src/components/home/")) return "home-sections";
          // صفحات القرآن
          if (id.includes("src/views/QuranCirclesPage") || id.includes("src/views/QuranPage") || id.includes("src/views/QuranRadioPage")) return "quran-pages";
          // البحث العلمي
          if (id.includes("src/views/Scholarly") || id.includes("scholarly-research") || id.includes("src/lib/scholars-data")) return "scholarly";
          // بيانات المسابقات والمعجم والخرائط الذهنية
          if (id.includes("src/lib/mind-maps-data") || id.includes("src/lib/quiz-seed") || id.includes("src/lib/islamic-glossary")) return "content-data";
          // بيانات الأسئلة والأجوبة — chunk مستقل (203 kB)
          if (id.includes("src/lib/qa-seed") || id.includes("src/lib/rulings-relations") || id.includes("src/lib/search-suggestions")) return "qa-data";
          // بيانات الموسوعة الفقهية المُولَّدة — chunk مستقل (286 kB)
          if (id.includes("src/lib/rulings-encyclopedia-seed") || id.includes("src/lib/rulings-data-loader")) return "rulings-encyclopedia";
          // الأذكار والفوائد
          if (id.includes("src/lib/adhkar-seed") || id.includes("src/lib/fawaid-seed") || id.includes("src/lib/fawaid-curated-seed") || id.includes("src/lib/content-quality")) return "adhkar-fawaid-seed";
          // الفتاوى والأحكام
          if (id.includes("src/lib/fatwa-seed") || id.includes("src/lib/rulings-seed")) return "fatwa-rulings-seed";
          // مجلس الفقه — البيانات + الخدمات
          if (id.includes("src/lib/fiqh-council-seed") || id.includes("src/lib/fiqh-council-nawazil") || id.includes("src/lib/fiqh-council-categories") || id.includes("src/lib/fiqh-council-trust") || id.includes("src/lib/fiqh-issues-seed") || id.includes("src/lib/fiqh-council-service") || id.includes("src/lib/fiqh-council-issues-service") || id.includes("src/lib/fiqh-research-assistant") || id.includes("src/lib/fiqh-global-search")) return "fiqh-council-data";
          // صفحات مجلس الفقه
          if (id.includes("src/views/FiqhCouncil")) return "fiqh-council";
          // بيانات الدروس والشيوخ والإعلانات
          if (id.includes("src/lib/lessons-seed") || id.includes("src/lib/lesson-ads") || id.includes("src/lib/lessons-catalog") || id.includes("src/lib/sheikhs-seed") || id.includes("src/lib/scientific-announcements")) return "lessons-seed-data";
          // الدورات السنوية والتحديثات
          if (id.includes("src/lib/annual-courses-seed") || id.includes("src/lib/updates-seed")) return "courses-updates-seed";
          // العلوم والطب النبوي والمعجزات
          if (id.includes("src/lib/prophetic-medicine-seed") || id.includes("src/views/PropheticMedicine") || id.includes("src/views/Miracles")) return "science-pages";
          // المعجزات وقصص الأنبياء — البيانات
          if (id.includes("src/lib/miracles-seed") || id.includes("src/lib/prophets-seed") || id.includes("src/lib/islamic-stories-seed")) return "content-seed";
          // مسارات التعلم
          if (id.includes("src/views/Learning") || id.includes("src/views/learning/")) return "learning-pages";
          // خدمات المنصة + المحتوى التجريبي
          if (id.includes("src/lib/platform-content-service") || id.includes("src/lib/demo-content") || id.includes("src/lib/auto-content-service") || id.includes("src/lib/platform-search")) return "platform-services";
        },
      },
    },
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
