import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { majalisApiPlugin } from "./server/vite-plugin-api.mjs";
import { deferEntryCssPlugin } from "./scripts/defer-entry-css.mjs";
import { htmlCharsetPlugin } from "./scripts/html-charset-preview.mjs";

const rawPort = process.env.PORT || "5000";

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH || "/";

const rawCommit = process.env.VERCEL_GIT_COMMIT_SHA || process.env.GIT_COMMIT || "dev";
/** قصير فقط في العميل — لا نسرّب الـ SHA الكامل. */
const commitHash = rawCommit === "dev" ? "dev" : String(rawCommit).slice(0, 7);
const buildId = process.env.VERCEL_DEPLOYMENT_ID || process.env.BUILD_ID || "local";

/**
 * Vendor chunk matcher — must NOT use a bare `includes("react")`.
 * That incorrectly pulls `react-hook-form`, `@radix-ui/react-*`, etc. into the
 * long-lived `vendor` chunk and defeats route-level code splitting.
 *
 * Splitting react / react-dom / wouter yields separate parse tasks (TBT)
 * instead of one ~190KiB vendor eval on boot.
 */
function vendorChunkName(id: string): string | undefined {
  if (
    id.includes("/react-dom/") ||
    id.includes("/react-dom\\") ||
    id.includes("/scheduler/") ||
    id.includes("/scheduler\\")
  ) {
    return "react-dom";
  }
  if (id.includes("/wouter/") || id.includes("/wouter\\")) return "wouter";
  if (id.includes("/react/") || id.includes("/react\\")) return "react";
  return undefined;
}

export default defineConfig({
  base: basePath,
  define: {
    "import.meta.env.VITE_COMMIT_HASH": JSON.stringify(commitHash),
    "import.meta.env.VITE_BUILD_ID": JSON.stringify(buildId),
    "import.meta.env.VITE_VERCEL_GIT_COMMIT_SHA": JSON.stringify(commitHash),
  },
  esbuild: {
    target: "es2022",
    legalComments: "none",
    drop: process.env.NODE_ENV === "production" ? ["console", "debugger"] : [],
  },
  plugins: [
    {
      // Client graph must never resolve the Node fs/path seed reader.
      name: "stub-json-seed-disk-node",
      enforce: "pre",
      resolveId(source) {
        if (
          source === "./json-seed-disk.node" ||
          source.endsWith("/json-seed-disk.node") ||
          source.endsWith("/json-seed-disk.node.ts") ||
          source.includes("json-seed-disk.node")
        ) {
          return path.resolve(import.meta.dirname, "src/lib/json-seed-disk.browser-stub.ts");
        }
        return null;
      },
    },
    react(),
    tailwindcss(),
    majalisApiPlugin(),
    deferEntryCssPlugin(),
    htmlCharsetPlugin(),
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
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "wouter",
      "@tanstack/react-query",
      "@supabase/supabase-js",
    ],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    target: "es2022",
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
    minify: "esbuild",
    sourcemap: "hidden",
    cssMinify: true,
    cssCodeSplit: true,
    assetsInlineLimit: 4096,
    chunkSizeWarningLimit: 600,
    modulePreload: {
      polyfill: true,
      resolveDependencies(_filename, deps) {
        // لا تُحمّل supabase/icons/charts في modulepreload للإقلاع — تُجلب عند الطلب
        // HomePage كسول — لا modulepreload على كل مسار SPA (يُحمَّل عند / فقط عبر lazy)
        return deps.filter(
          (d) =>
            !/\/(supabase|icons|charts|adhan|animation|maps|html-export)-/.test(d) &&
            !/seo-routes/.test(d) &&
            !/HomePage-/.test(d),
        );
      },
    },
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
          if (!id.includes("node_modules")) {
            return;
          }

          if (id.includes("@supabase")) return "supabase";
          if (id.includes("html-to-image")) return "html-export";
          if (id.includes("date-fns")) return "date-fns";
          if (id.includes("lucide-react")) return "icons";
          if (id.includes("@radix-ui")) return "radix";
          if (id.includes("adhan")) return "adhan";
          if (id.includes("@tanstack")) return "query";
          const vendor = vendorChunkName(id);
          if (vendor) return vendor;
          if (id.includes("zod") || id.includes("react-hook-form") || id.includes("@hookform")) return "forms";
          if (id.includes("framer-motion") || id.includes("motion")) return "animation";
          if (id.includes("cmdk") || id.includes("vaul")) return "ui-extra";
          if (id.includes("mapbox") || id.includes("leaflet") || id.includes("maplibre")) return "maps";
        },
      },
    },
  },
  server: {
    port,
    strictPort: true,
    host: process.env.HOST || "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: process.env.HOST || "0.0.0.0",
    allowedHosts: true,
  },
});
