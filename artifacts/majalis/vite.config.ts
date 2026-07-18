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
        /**
         * ⚠️ لا تُضِف قواعد لمسارات `src/` هنا.
         *
         * القواعد القديمة كانت تُجبر ملفات التطبيق على حزم مسمّاة (admin،
         * content-catalog…). حين يُشارك ملفٌ واحد من الحزمة بين مسار كسول
         * (lazy) ونقطة الدخول، تتحوّل الحزمة كلها إلى commons يستوردها ملف
         * الدخول استيرادًا ساكنًا — فصارت حزمة `admin` (٥٠٣KB) تنزل عند كل
         * زائر مجهول. التقسيم التلقائي في Rollup يحترم رسم lazy() (١٦٤ استدعاء)
         * ويولّد الحزم المشتركة بأمان.
         *
         * التقسيم اليدوي هنا مقتصر على node_modules (تخزين مؤقت طويل الأمد).
         */
        manualChunks(id) {
          if (!id.includes("node_modules")) return;

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
