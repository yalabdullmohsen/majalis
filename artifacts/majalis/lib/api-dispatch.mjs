import { createRateLimiter } from "./rate-limit.mjs";

const lessonFromImageRateLimit = createRateLimiter({
  windowMs: 60_000,
  max: 10,
  keyPrefix: "lesson-from-image",
});

const lessonFromUrlRateLimit = createRateLimiter({
  windowMs: 60_000,
  max: 12,
  keyPrefix: "lesson-from-url",
});

const assistantRateLimit = createRateLimiter({
  windowMs: 60_000,
  max: 15,
  keyPrefix: "assistant",
});

const transcribeRateLimit = createRateLimiter({
  windowMs: 60_000,
  max: 8,
  keyPrefix: "transcribe",
});

const fiqhResearchRateLimit = createRateLimiter({
  windowMs: 60_000,
  max: 20,
  keyPrefix: "fiqh-research",
});

const ragRateLimit = createRateLimiter({
  windowMs: 60_000,
  max: 20,
  keyPrefix: "rag",
});

// مسارات تستدعي نماذج AI خارجية (OpenAI) وكانت بلا أي حد معدل طلبات —
// كل طلب (حتى GET) يستهلك استدعاء API مدفوعًا خارجيًا بلا سقف.
const digitalLearningRateLimit = createRateLimiter({
  windowMs: 60_000,
  max: 20,
  keyPrefix: "digital-learning",
});

const globalReferenceRateLimit = createRateLimiter({
  windowMs: 60_000,
  max: 20,
  keyPrefix: "global-reference",
});

// نقاط كتابة مصادَق عليها كانت بلا حد معدل صريح — حماية من إساءة الاستخدام
// (حساب مُخترَق أو مستخدم خبيث يستنزف قاعدة البيانات عبر طلبات متكررة).
const citationsRateLimit = createRateLimiter({
  windowMs: 60_000,
  max: 30,
  keyPrefix: "citations",
});

const universitiesWriteRateLimit = createRateLimiter({
  windowMs: 60_000,
  max: 20,
  keyPrefix: "universities-write",
});

const learningAssessmentRateLimit = createRateLimiter({
  windowMs: 60_000,
  max: 15,
  keyPrefix: "learning-assessment",
});

const accountDeleteRateLimit = createRateLimiter({
  windowMs: 60_000,
  max: 5,
  keyPrefix: "account-delete",
});

const recommendationsRateLimit = createRateLimiter({
  windowMs: 60_000,
  max: 40,
  keyPrefix: "recommendations",
});

const knowledgeGraphRateLimit = createRateLimiter({
  windowMs: 60_000,
  max: 30,
  keyPrefix: "knowledge-graph",
});

// نقطتا كتابة عامتان بلا مصادقة إطلاقًا (أي زائر) — الأكثر عرضة لإساءة
// الاستخدام (إغراق قائمة المراجعة/سجل الأخطاء) وكانتا بلا أي حد معدل طلبات.
const submissionsRateLimit = createRateLimiter({
  windowMs: 60_000,
  max: 8,
  keyPrefix: "submissions",
});

const clientErrorLogRateLimit = createRateLimiter({
  windowMs: 60_000,
  max: 15,
  keyPrefix: "client-error-log",
});

const pushSubscribeRateLimit = createRateLimiter({
  windowMs: 60_000,
  max: 12,
  keyPrefix: "push-subscribe",
});

// اختبار التسميع بالذكاء الاصطناعي — مقطع صوتي كل 2-4 ثوانٍ تقريبًا أثناء
// الاستماع الفعلي؛ سقف سخي نسبيًا (يسمح بجلسة تسميع طويلة) لكن يمنع إساءة
// استخدام واضحة (استدعاءات Groq مدفوعة خلف هذا المسار).
const recitationTranscribeRateLimit = createRateLimiter({
  windowMs: 60_000,
  max: 60,
  keyPrefix: "recitation-transcribe",
});

/** Admin surfaces — auth still required inside handlers; this caps abuse of stolen JWTs. */
const adminRateLimit = createRateLimiter({
  windowMs: 60_000,
  max: 60,
  keyPrefix: "admin",
});

const searchRateLimit = createRateLimiter({
  windowMs: 60_000,
  max: 60,
  keyPrefix: "search",
});

const webhookTelegramRateLimit = createRateLimiter({
  windowMs: 60_000,
  max: 120,
  keyPrefix: "webhook-telegram",
});

const learningPathRateLimit = createRateLimiter({
  windowMs: 60_000,
  max: 40,
  keyPrefix: "learning-path",
});

// تطبيق iOS/Android الأصلي (Capacitor) يستدعي هذا المسار برابط مطلق
// (server-provider.ts) لأنه لا يملك خادمًا محليًا خاصًا به — أصله ليس
// https://www.majlisilm.com بل أحد هذه المخططات المحلية، فيحتاج طلب
// POST (Content-Type: application/json، لا "طلب بسيط" حسب CORS) إلى
// preflight ناجح. الفرع العام لـOPTIONS أدناه ينهي الطلب فورًا قبل بلوغ
// الوحدة (recitation-transcribe.js) نفسها — corsPreflightOrigins هنا هو
// الآلية الوحيدة التي تتيح لمسار واحد محدَّد الإفلات من ذلك دون تغيير
// سلوك كل مسار OPTIONS آخر في النظام.
const NATIVE_APP_ORIGINS = new Set(["capacitor://localhost", "https://localhost", "http://localhost"]);

/** Route table uses dynamic imports so Vercel bundles one lightweight function entrypoint. */
export const API_ROUTES = [
  { prefix: "/api/healthz", module: "./api-handlers/healthz.js", allowGet: true, exact: true },
  { prefix: "/api/readyz", module: "./api-handlers/readyz.js", allowGet: true, exact: true },
  { prefix: "/api/public-config", module: "./api-handlers/public-config.js", allowGet: true, exact: true },
  { prefix: "/api/assistant/health", module: "./api-handlers/assistant/health.js", allowGet: true, exact: true },
  { prefix: "/api/prayer-times", module: "./api-handlers/prayer-times.js", allowGet: true, exact: true },
  { prefix: "/api/cron/sync-data", module: "./api-handlers/cron/sync-data.js", allowGet: true, exact: true },
  { prefix: "/api/cron/knowledge-sync", module: "./api-handlers/cron/knowledge-sync.js", allowGet: true, exact: true },
  { prefix: "/api/cron/sync-fiqh-council", module: "./api-handlers/cron/sync-fiqh-council.js", allowGet: true, exact: true },
  { prefix: "/api/cron/check-fiqh-links", module: "./api-handlers/cron/check-fiqh-links.js", allowGet: true, exact: true },
  { prefix: "/api/cron/scholarly-verification", module: "./api-handlers/cron/scholarly-verification.js", allowGet: true, exact: true },
  { prefix: "/api/admin/knowledge-pipeline", module: "./api-handlers/admin/knowledge-pipeline.js", allowGet: true },
  { prefix: "/api/admin/feature-health", module: "./api-handlers/admin/feature-health.js", allowGet: true, exact: true },
  { prefix: "/api/admin/production-activate", module: "./api-handlers/admin/production-activate.js", allowGet: true },
  { prefix: "/api/admin/bootstrap-owner", module: "./api-handlers/admin/bootstrap-owner.js", allowGet: true },
  { prefix: "/api/admin/platform-bootstrap", module: "./api-handlers/admin/platform-bootstrap.js", allowGet: true },
  { prefix: "/api/admin/auth-context", module: "./api-handlers/admin/auth-context.js", allowGet: true },
  { prefix: "/api/admin/check-fiqh-links", module: "./api-handlers/admin/check-fiqh-links.js", allowGet: true },
  { prefix: "/api/admin/sync-fiqh-council", module: "./api-handlers/admin/sync-fiqh-council.js", allowGet: true },
  { prefix: "/api/admin/scholarly-verification", module: "./api-handlers/admin/scholarly-verification.js", allowGet: true },
  { prefix: "/api/knowledge-search", module: "./api-handlers/knowledge-search.js", allowGet: true },
  { prefix: "/api/cron/auto-content-sync", module: "./api-handlers/cron/auto-content-sync.js", allowGet: true, exact: true },
  { prefix: "/api/cron/auto-content-health", module: "./api-handlers/cron/auto-content-health.js", allowGet: true, exact: true },
  { prefix: "/api/cron/daily-benefit-rotation", module: "./api-handlers/cron/daily-benefit-rotation.js", allowGet: true, exact: true },
  { prefix: "/api/cron/system-health", module: "./api-handlers/cron/system-health.js", allowGet: true, exact: true },
  { prefix: "/api/cron/apply-migrations", module: "./api-handlers/cron/apply-migrations.js", allowGet: true, exact: true },
  { prefix: "/api/cron/bootstrap-database", module: "./api-handlers/cron/bootstrap-database.js", allowGet: true, exact: true },
  { prefix: "/api/cron/bootstrap-owner", module: "./api-handlers/cron/bootstrap-owner.js", allowGet: true, exact: true },
  { prefix: "/api/cron/platform-bootstrap", module: "./api-handlers/cron/platform-bootstrap.js", allowGet: true, exact: true },
  { prefix: "/api/cron/auto-knowledge-sync", module: "./api-handlers/cron/auto-knowledge-sync.js", allowGet: true, exact: true },
  { prefix: "/api/cron/connector-health", module: "./api-handlers/cron/connector-health.js", allowGet: true, exact: true },
  { prefix: "/api/auto-content", module: "./api-handlers/auto-content.js", allowGet: true },
  { prefix: "/api/knowledge-recommendations", module: "./api-handlers/knowledge-recommendations.js", allowGet: true },
  { prefix: "/api/intelligent-search", module: "./api-handlers/intelligent-search.js", allowGet: true },
  // محرك البحث العربي الموحد — GET /api/search?q=...&types=...&limit=...&offset=...
  { prefix: "/api/search", module: "./api-handlers/search.js", allowGet: true, exact: true },
  { prefix: "/api/topic-content", module: "./api-handlers/topic-content.js", allowGet: true },
  { prefix: "/api/content-relations", module: "./api-handlers/content-relations.js", allowGet: true },
  { prefix: "/api/scholarly-search", module: "./api-handlers/scholarly-search.js", allowGet: true },
  { prefix: "/api/admin/search-analytics", module: "./api-handlers/admin/search-analytics.js", allowGet: true },
  { prefix: "/api/digital-learning", module: "./api-handlers/digital-learning.js", allowGet: true, rateLimit: digitalLearningRateLimit },
  { prefix: "/api/cron/autonomous-orchestrator", module: "./api-handlers/cron/autonomous-orchestrator.js", allowGet: true, exact: true },
  { prefix: "/api/admin/autonomous-ai", module: "./api-handlers/admin/autonomous-ai.js", allowGet: true },
  { prefix: "/api/admin/autonomous-platform", module: "./api-handlers/admin/autonomous-platform.js", allowGet: true },
  { prefix: "/api/daily-content", module: "./api-handlers/daily-content.js", allowGet: true },
  { prefix: "/api/global-reference", module: "./api-handlers/global-reference.js", allowGet: true, rateLimit: globalReferenceRateLimit },
  { prefix: "/api/admin/global-reference", module: "./api-handlers/admin/global-reference.js", allowGet: true },
  { prefix: "/api/cron/global-reference-review", module: "./api-handlers/cron/global-reference-review.js", allowGet: true, exact: true },
  { prefix: "/api/cron/islamic-intelligence", module: "./api-handlers/cron/islamic-intelligence.js", allowGet: true, exact: true },
  { prefix: "/api/admin/islamic-intelligence", module: "./api-handlers/admin/islamic-intelligence.js", allowGet: true },
  { prefix: "/api/v1", module: "./api-handlers/v1.js", allowGet: true },
  { prefix: "/api/v2", module: "./api-handlers/v2.js", allowGet: true },
  { prefix: "/api/v3", module: "./api-handlers/v3.js", allowGet: true },
  { prefix: "/api/admin/open-platform", module: "./api-handlers/admin/open-platform.js", allowGet: true },
  { prefix: "/api/admin/governance", module: "./api-handlers/admin/governance.js", allowGet: true },
  { prefix: "/api/cron/governance-backup", module: "./api-handlers/cron/governance-backup.js", allowGet: true, exact: true },
  { prefix: "/api/admin/ai-agents", module: "./api-handlers/admin/ai-agents.js", allowGet: true },
  { prefix: "/api/sitemap", module: "./api-handlers/sitemap.js", allowGet: true, exact: true },
  { prefix: "/api/feed", module: "./api-handlers/feed.js", allowGet: true, exact: true },
  // SSR وقت الطلب لدروس Supabase الحيّة (لا مصدر ثابت لها وقت البناء، بخلاف
  // /scholars و/library). راجع /lessons/:id في vercel.json rewrites.
  // نُسجّل أيضاً البادئة العامة /lessons لأن x-vercel-original-path يبقى
  // /lessons/:id بعد إعادة الكتابة إلى /api/index.
  // requireSubpath: قائمة /lessons (و/api/lessons بلا معرّف) تبقى لـ SPA —
  // مطابقة البادئة وحدها كانت تُعيد HTML «هذا الدرس غير متاح» للقائمة.
  { prefix: "/api/lessons", module: "./api-handlers/lesson-page.js", allowGet: true, requireSubpath: true },
  { prefix: "/lessons", module: "./api-handlers/lesson-page.js", allowGet: true, requireSubpath: true },
  { prefix: "/api/admin/smart-cms", module: "./api-handlers/admin/smart-cms.js" },
  { prefix: "/api/admin/lesson-from-image", module: "./api-handlers/admin/lesson-from-image.js", rateLimit: lessonFromImageRateLimit },
  { prefix: "/api/admin/lesson-from-url", module: "./api-handlers/admin/lesson-from-url.js", rateLimit: lessonFromUrlRateLimit },
  { prefix: "/api/admin/lesson-automation", module: "./api-handlers/admin/lesson-automation.js" },
  { prefix: "/api/admin/instagram-integration", module: "./api-handlers/admin/instagram-integration.js" },
  { prefix: "/api/admin/telegram", module: "./api-handlers/admin/telegram.js", allowGet: true },
  { prefix: "/api/webhook/telegram", module: "./api-handlers/webhook/telegram.js", exact: true },
  { prefix: "/api/cron/telegram-processor", module: "./api-handlers/cron/telegram-processor.js", allowGet: true, exact: true },
  { prefix: "/api/admin/majlis-knowledge-engine", module: "./api-handlers/admin/majlis-knowledge-engine.js" },
  { prefix: "/api/admin/source-monitor", module: "./api-handlers/admin/source-monitor.js" },
  { prefix: "/api/cron/monitor-sources", module: "./api-handlers/cron/monitor-sources.js", allowGet: true, exact: true },
  { prefix: "/api/cron/lesson-source-monitor", module: "./api-handlers/cron/lesson-source-monitor.js", allowGet: true, exact: true },
  { prefix: "/api/cron/lesson-intelligence", module: "./api-handlers/cron/lesson-intelligence.js", allowGet: true, exact: true },
  { prefix: "/api/cron/majlis-knowledge-engine", module: "./api-handlers/cron/majlis-knowledge-engine.js", allowGet: true, exact: true },
  { prefix: "/api/cron/autonomous-platform", module: "./api-handlers/cron/autonomous-platform.js", allowGet: true, exact: true },
  { prefix: "/api/cron/autonomous-platform-fetch", module: "./api-handlers/cron/autonomous-platform.js", allowGet: true, exact: true },
  { prefix: "/api/cron/autonomous-platform-validate", module: "./api-handlers/cron/autonomous-platform.js", allowGet: true, exact: true },
  { prefix: "/api/cron/autonomous-platform-questions", module: "./api-handlers/cron/autonomous-platform.js", allowGet: true, exact: true },
  { prefix: "/api/cron/autonomous-platform-benefits", module: "./api-handlers/cron/autonomous-platform.js", allowGet: true, exact: true },
  { prefix: "/api/cron/autonomous-platform-reindex", module: "./api-handlers/cron/autonomous-platform.js", allowGet: true, exact: true },
  { prefix: "/api/cron/autonomous-platform-audit", module: "./api-handlers/cron/autonomous-platform.js", allowGet: true, exact: true },
  { prefix: "/api/cron/autonomous-platform-cleanup", module: "./api-handlers/cron/autonomous-platform.js", allowGet: true, exact: true },
  { prefix: "/api/cron/autonomous-platform-bootstrap", module: "./api-handlers/cron/autonomous-platform.js", allowGet: true, exact: true },
  { prefix: "/api/cron/autonomous-platform-monitor", module: "./api-handlers/cron/autonomous-platform.js", allowGet: true, exact: true },
  { prefix: "/api/cron/autonomous-platform-recovery", module: "./api-handlers/cron/autonomous-platform.js", allowGet: true, exact: true },
  { prefix: "/api/cron/source-monitor", module: "./api-handlers/cron/source-monitor.js", allowGet: true, exact: true },
  { prefix: "/api/cron/job-worker", module: "./api-handlers/cron/job-worker.js", allowGet: true, exact: true },
  { prefix: "/api/admin/content-import", module: "./api-handlers/admin/content-import.js", timeoutMs: 58_000 },
  { prefix: "/api/cron/process-import-jobs", module: "./api-handlers/cron/process-import-jobs.js", allowGet: true, exact: true },
  { prefix: "/api/cron/import-phase2-trial", module: "./api-handlers/cron/import-phase2-trial.js", allowGet: true, exact: true },
  { prefix: "/api/cron/ai-agents", module: "./api-handlers/cron/ai-agents.js", allowGet: true, exact: true },
  { prefix: "/api/cron/verified-knowledge", module: "./api-handlers/cron/verified-knowledge.js", allowGet: true, exact: true },
  { prefix: "/api/admin/verified-knowledge", module: "./api-handlers/admin/verified-knowledge.js", allowGet: true },
  { prefix: "/api/knowledge-reasoning", module: "./api-handlers/knowledge-reasoning.js", allowGet: true },
  { prefix: "/api/admin/knowledge-reasoning", module: "./api-handlers/admin/knowledge-reasoning.js", allowGet: true },
  { prefix: "/api/cron/content-scheduler", module: "./api-handlers/cron/content-scheduler.js", allowGet: true, exact: true },
  { prefix: "/api/admin/content-production", module: "./api-handlers/admin/content-production.js", allowGet: true },
  { prefix: "/api/cron/knowledge-reasoning", module: "./api-handlers/cron/knowledge-reasoning.js", allowGet: true, exact: true },
  { prefix: "/api/admin/auto-content", module: "./api-handlers/admin/auto-content.js", allowGet: true },
  { prefix: "/api/admin/auto-knowledge-engine", module: "./api-handlers/admin/auto-knowledge-engine.js", allowGet: true },
  { prefix: "/api/fiqh-research-assistant", module: "./api-handlers/fiqh-research-assistant.js", rateLimit: fiqhResearchRateLimit, allowGet: true },
  { prefix: "/api/assistant", module: "./api-handlers/assistant.js", rateLimit: assistantRateLimit, allowGet: true },
  { prefix: "/api/client-error-log", module: "./api-handlers/client-error-log.js", allowGet: true, rateLimit: clientErrorLogRateLimit },
  { prefix: "/api/push/subscribe", module: "./api-handlers/push-subscribe.js", allowGet: true, exact: true, rateLimit: pushSubscribeRateLimit },
  { prefix: "/api/test-anthropic", module: "./api-handlers/test-anthropic.js", allowGet: true },
  { prefix: "/api/transcribe", module: "./api-handlers/transcribe.js", rateLimit: transcribeRateLimit },
  { prefix: "/api/recitation-transcribe", module: "./api-handlers/recitation-transcribe.js", rateLimit: recitationTranscribeRateLimit, allowGet: true, exact: true, corsPreflightOrigins: NATIVE_APP_ORIGINS },
  { prefix: "/api/submissions", module: "./api-handlers/submissions.js", exact: true, rateLimit: submissionsRateLimit },
  { prefix: "/api/researches/submit", module: "./api-handlers/researches-submit.js", exact: true, rateLimit: submissionsRateLimit },
  { prefix: "/api/cron/researches-daily-import", module: "./api-handlers/cron/researches-daily-import.js", allowGet: true, exact: true },
  { prefix: "/api/admin/submissions", module: "./api-handlers/admin/submissions.js", allowGet: true },
  { prefix: "/api/account/delete", module: "./api-handlers/account/delete.js", exact: true, rateLimit: accountDeleteRateLimit },
  // ── الباحث الشرعي (RAG) ────────────────────────────────────────────────────
  { prefix: "/api/rag", module: "./api-handlers/rag-research.js", allowGet: true, rateLimit: ragRateLimit },
  // ── نظام الاقتباسات ────────────────────────────────────────────────────────
  { prefix: "/api/user/citations", module: "./api-handlers/citations.js", allowGet: true, rateLimit: citationsRateLimit },
  { prefix: "/api/citations",      module: "./api-handlers/citations.js", allowGet: true, rateLimit: citationsRateLimit },
  { prefix: "/api/learning-assessment", module: "./api-handlers/learning-assessment.js", exact: true, allowGet: true, rateLimit: learningAssessmentRateLimit },
  // ── الرسم البياني المعرفي ──────────────────────────────────────────────────
  { prefix: "/api/knowledge-graph", module: "./api-handlers/knowledge-graph.js", allowGet: true, rateLimit: knowledgeGraphRateLimit },
  // ── التوصيات الذكية ───────────────────────────────────────────────────────
  { prefix: "/api/recommendations", module: "./api-handlers/recommendations.js", allowGet: true, rateLimit: recommendationsRateLimit },
  // ── خارطة طالب العلم ──────────────────────────────────────────────────────
  { prefix: "/api/learning-path", module: "./api-handlers/learning-path.js", allowGet: true },
  // ── دليل الجامعات ─────────────────────────────────────────────────────────
  { prefix: "/api/cron/universities-review", module: "./api-handlers/cron/universities-review.js", allowGet: true, exact: true },
  { prefix: "/api/cron/content-scoring",     module: "./api-handlers/cron/content-scoring.js",     allowGet: true, exact: true },
  { prefix: "/api/admin/reminders",    module: "./api-handlers/universities-vercel.js", allowGet: true, rateLimit: universitiesWriteRateLimit },
  { prefix: "/api/admin/programs",     module: "./api-handlers/universities-vercel.js", allowGet: true, rateLimit: universitiesWriteRateLimit },
  { prefix: "/api/admin/requirements", module: "./api-handlers/universities-vercel.js", allowGet: true, rateLimit: universitiesWriteRateLimit },
  { prefix: "/api/admin/faqs",         module: "./api-handlers/universities-vercel.js", allowGet: true, rateLimit: universitiesWriteRateLimit },
  { prefix: "/api/admin/universities", module: "./api-handlers/universities-vercel.js", allowGet: true, rateLimit: universitiesWriteRateLimit },
  { prefix: "/api/universities",       module: "./api-handlers/universities-vercel.js", allowGet: true },
];

// Attach default limiters without rewriting every route row (auth still enforced in handlers).
const SEARCH_FAMILY_PREFIXES = new Set([
  "/api/search",
  "/api/intelligent-search",
  "/api/scholarly-search",
  "/api/knowledge-search",
  "/api/knowledge-recommendations",
  "/api/topic-content",
  "/api/content-relations",
]);

for (const route of API_ROUTES) {
  if (route.rateLimit) continue;
  if (route.prefix.startsWith("/api/admin/")) {
    route.rateLimit = adminRateLimit;
  } else if (SEARCH_FAMILY_PREFIXES.has(route.prefix)) {
    route.rateLimit = searchRateLimit;
  } else if (route.prefix === "/api/webhook/telegram") {
    route.rateLimit = webhookTelegramRateLimit;
  } else if (route.prefix === "/api/learning-path") {
    route.rateLimit = learningPathRateLimit;
  }
}

const handlerCache = new Map();

async function loadHandler(route) {
  if (handlerCache.has(route.module)) {
    return handlerCache.get(route.module);
  }
  const href = new URL(route.module, import.meta.url).href;
  const mod = await import(href);
  const handler = mod.default;
  handlerCache.set(route.module, handler);
  return handler;
}

export function resolveRequestPath(req) {
  const headerPath =
    req.headers?.["x-vercel-original-path"] ||
    req.headers?.["x-invoke-path"] ||
    req.headers?.["x-forwarded-uri"];
  const raw = headerPath || req.url || "/";
  return String(raw).split("?")[0];
}

function findApiRouteForPath(path) {
  return API_ROUTES.find((route) => {
    if (route.exact) return path === route.prefix;
    // مسارات تحتاج مقطعاً بعد البادئة (مثل /lessons/:id) — لا تطابق القائمة الجذرية.
    if (route.requireSubpath) {
      if (!path.startsWith(`${route.prefix}/`)) return false;
      const rest = path.slice(route.prefix.length + 1).replace(/\/+$/, "");
      return rest.length > 0 && !rest.includes("/");
    }
    return path === route.prefix || path.startsWith(`${route.prefix}/`) || path.startsWith(`${route.prefix}?`);
  });
}

export function matchApiRoute(urlOrReq) {
  if (typeof urlOrReq === "string") {
    return findApiRouteForPath(urlOrReq.split("?")[0]);
  }

  // بعد إعادة كتابة Vercel (/lessons/:id → /api/lessons/:id → /api/index)
  // قد يكون req.url = /api/index بينما x-vercel-original-path = /lessons/:id.
  // نتجاهل /api/index عند المطابقة ونفضّل المسار ذي المعنى.
  const rewritten = String(urlOrReq.url || "").split("?")[0];
  if (rewritten && rewritten !== "/api/index" && rewritten !== "/api") {
    const byRewritten = findApiRouteForPath(rewritten);
    if (byRewritten) return byRewritten;
  }
  return findApiRouteForPath(resolveRequestPath(urlOrReq));
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.on !== "function") return {};

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export { sendJson, endEmpty, isResponseClosed, applyHandlerResult } from "./api/_http.mjs";
import { sendJson } from "./api/_http.mjs";

const DEFAULT_HANDLER_TIMEOUT_MS = 25_000;
/** Cron HTTP path must enqueue quickly — long work belongs to background workers. */
const CRON_HANDLER_TIMEOUT_MS = 12_000;

async function invokeHandler(handler, req, res, routePrefix, routeOpts = {}) {
  const isCron = routePrefix.startsWith("/api/cron/");
  const timeoutMs = routeOpts.timeoutMs ?? (isCron ? CRON_HANDLER_TIMEOUT_MS : DEFAULT_HANDLER_TIMEOUT_MS);

  const { createRequestContext } = await import("./api/request-lifecycle.mjs");
  const ctx = createRequestContext(req, res, { timeoutMs });
  req.abortSignal = ctx.signal;
  req.requestId = ctx.requestId;

  try {
    const result = await handler(req, res);
    // Optional typed result from migrated handlers
    if (result && typeof result === "object" && typeof result.status === "number" && !res.headersSent) {
      const { applyHandlerResult } = await import("./api/_http.mjs");
      applyHandlerResult(res, result);
    }
    ctx.markSettled();
  } finally {
    ctx.dispose();
  }
}

export async function dispatchApiRequest(req, res) {
  const route = matchApiRoute(req);
  if (!route) {
    // متصفح/فحص بصري يتوقع صفحة 404 لا JSON عارياً من 40 حرفاً
    const { wantsHtml, sendNotFoundHtml } = await import("./not-found-html.mjs");
    if (req.method === "GET" && wantsHtml(req)) {
      sendNotFoundHtml(res);
      return;
    }
    sendJson(res, 404, { ok: false, message: "المسار غير موجود." });
    return;
  }

  const handler = await loadHandler(route);

  if (req.method === "OPTIONS") {
    if (route.corsPreflightOrigins) {
      const origin = String(req.headers?.origin || "");
      if (route.corsPreflightOrigins.has(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Vary", "Origin");
      }
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    }
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method === "GET" && route.allowGet) {
    req.body = {};
    const runGet = async () => {
      try {
        await invokeHandler(handler, req, res, route.prefix, route);
      } catch (error) {
        console.error(`${route.prefix} GET handler failed`, error);
        if (!res.headersSent) {
          sendJson(res, 500, { ok: false, message: "تعذر تنفيذ الطلب.", fallback: true });
        }
      }
    };
    if (route.rateLimit) {
      await route.rateLimit(req, res, runGet);
    } else {
      await runGet();
    }
    return;
  }

  const MUTATION_METHODS = ["POST", "PUT", "DELETE", "PATCH"];
  if (!MUTATION_METHODS.includes(req.method)) {
    sendJson(res, 405, { ok: false, message: "الطريقة غير مدعومة." });
    return;
  }

  const runMutation = async () => {
    // DELETE usually has no body; read body for POST/PUT/PATCH only
    if (req.method !== "DELETE") {
      const body = await readJsonBody(req);
      if (body === null && route.prefix !== "/api/test-anthropic") {
        sendJson(res, 400, { ok: false, message: "اكتب سؤالك أولًا." });
        return;
      }
      req.body = body ?? {};
    } else {
      req.body = {};
    }
    try {
      await invokeHandler(handler, req, res, route.prefix, route);
    } catch (error) {
      console.error(`${route.prefix} ${req.method} handler failed`, error);
      if (!res.headersSent) {
        sendJson(res, 500, { ok: false, message: "تعذر تنفيذ الطلب.", fallback: true });
      }
    }
  };

  if (route.rateLimit) {
    await route.rateLimit(req, res, runMutation);
  } else {
    await runMutation();
  }
}

/** Dev server helper: resolve handler for a matched route without caching importers. */
export async function getDevRouteHandler(route) {
  const href = new URL(route.module, import.meta.url).href;
  const mod = await import(href);
  return mod.default;
}

export { assistantRateLimit, transcribeRateLimit, fiqhResearchRateLimit, lessonFromImageRateLimit, lessonFromUrlRateLimit };
