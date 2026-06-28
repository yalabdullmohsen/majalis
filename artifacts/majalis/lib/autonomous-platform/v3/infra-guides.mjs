/**
 * Detailed infrastructure guides — why, impact, fix, verify.
 */

export const SECRET_GUIDES = {
  DATABASE_URL: {
    whyRequired:
      "اتصال PostgreSQL المباشر لتطبيق ملفات SQL (autonomous_platform_v3.sql) عبر migration runner.",
    stoppedFunctions: [
      "apply-migrations cron",
      "إنشاء جداول v3 (health snapshots, analytics, semantic index, scheduler)",
      "platform-bootstrap → apply_migrations",
      "التحقق من الفهارس والسياسات عبر pg_catalog",
    ],
    howToFix: [
      "Supabase Dashboard → Project Settings → Database → Connection string",
      "اختر Transaction Pooler (port 6543, *.pooler.supabase.com)",
      "Vercel → Project → Settings → Environment Variables → Production",
      "أضف DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-....pooler.supabase.com:6543/postgres",
      "GitHub → Repository → Settings → Secrets → Actions → DATABASE_URL (لـ CI bootstrap)",
      "Redeploy Production",
    ],
    howToVerify: [
      "pnpm --filter @workspace/majalis run audit:infrastructure — Migration 100%",
      "/admin/platform/health → Migration section all tables present",
      "curl -H \"Authorization: Bearer $CRON_SECRET\" \"https://www.majlisilm.com/api/cron/apply-migrations?scope=activation-tables\" → ok:true",
    ],
  },
  SUPABASE_SERVICE_ROLE_KEY: {
    whyRequired:
      "مفتاح الخادم (bypass RLS) لـ Bootstrap، Seed، Cron server-side، وكل Admin APIs التي تكتب في Supabase.",
    stoppedFunctions: [
      "Bootstrap و Seed للمصادر",
      "listManagedSources / createManagedSource",
      "Pipeline runs (fetch → publish)",
      "Health monitoring و Self-healing",
      "Analytics snapshots و Backup",
    ],
    howToFix: [
      "Supabase Dashboard → Project Settings → API → service_role (secret)",
      "Vercel → Environment Variables → SUPABASE_SERVICE_ROLE_KEY (Production only — never expose to client)",
      "GitHub Actions Secrets → SUPABASE_SERVICE_ROLE_KEY",
      "Redeploy",
    ],
    howToVerify: [
      "/admin/platform/health → SUPABASE_SERVICE_ROLE_KEY = موجود",
      "/admin/sources → يعرض مصادر من DB (بعد seed)",
      "Bootstrap precheck passes in Production Health",
    ],
  },
  CRON_SECRET: {
    whyRequired:
      "مصادقة طلبات /api/cron/* خارج Vercel Cron — يمنع تشغيل غير مصرّح للـ pipelines.",
    stoppedFunctions: [
      "تشغيل Cron يدوياً عبر curl/GitHub Actions",
      "Self-bootstrap من CI",
      "Manual pipeline trigger بدون x-vercel-cron header",
    ],
    howToFix: [
      "Generate: openssl rand -hex 32",
      "Vercel → CRON_SECRET (Production)",
      "GitHub Actions Secrets → CRON_SECRET",
      "Redeploy",
    ],
    howToVerify: [
      "curl بدون header → 401 Unauthorized",
      "curl -H \"Authorization: Bearer $CRON_SECRET\" /api/cron/autonomous-platform-v3-health → 200",
      "/admin/platform/health → Cron Auth = configured",
    ],
  },
  OPENAI_API_KEY: {
    whyRequired:
      "Semantic embeddings لـ akp_semantic_index — بدونه يعمل البحث عبر Keyword Fallback فقط.",
    stoppedFunctions: [
      "Vector embeddings في Semantic Index",
      "بحث دلالي متقدم (semantic search)",
    ],
    howToFix: [
      "platform.openai.com → API Keys → Create",
      "Vercel → OPENAI_API_KEY (Production)",
      "Redeploy — اختياري",
    ],
    howToVerify: [
      "/admin/platform/health → AI mode = semantic_embeddings",
      "Checklist → Search = PASS (semantic) أو WARNING (keyword fallback)",
    ],
    optional: true,
  },
};

export function enrichInfrastructureItem(item) {
  const guide = SECRET_GUIDES[item.key];
  if (!guide) return item;
  return {
    ...item,
    whyRequired: guide.whyRequired,
    stoppedFunctions: guide.stoppedFunctions,
    howToFix: guide.howToFix,
    howToVerify: guide.howToVerify,
    optional: guide.optional || item.priority === "optional",
  };
}
