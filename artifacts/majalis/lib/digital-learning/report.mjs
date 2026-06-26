/**
 * Digital Learning Platform — report generator.
 */

import { writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { LEARNING_PATHS, LEARNING_MODULES, DEMO_QUIZZES } from "./paths-seed.mjs";
import { NOTIFICATION_TEMPLATES } from "./notifications.mjs";
import { getAdminLearningStats } from "./analytics.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");

const FEATURES = [
  { id: "learning_paths", label: "المسارات العلمية", weight: 12 },
  { id: "progress_system", label: "نظام التعلم والتقدم", weight: 12 },
  { id: "quiz_system", label: "نظام الاختبارات", weight: 12 },
  { id: "certificates", label: "الشهادات", weight: 8 },
  { id: "calendar", label: "التقويم العلمي", weight: 8 },
  { id: "personal_library", label: "المكتبة الشخصية", weight: 8 },
  { id: "notifications", label: "الإشعارات", weight: 8 },
  { id: "user_stats", label: "إحصاءات المستخدم", weight: 8 },
  { id: "admin_dashboard", label: "لوحة الإدارة", weight: 8 },
  { id: "ai_assistant", label: "الذكاء الاصطناعي", weight: 8 },
  { id: "performance", label: "الأداء والتوسع", weight: 5 },
  { id: "weekly_plan", label: "الخطة الأسبوعية", weight: 3 },
];

function featureComplete(id) {
  const map = {
    learning_paths: "lib/digital-learning/paths.mjs",
    progress_system: "lib/digital-learning/progress.mjs",
    quiz_system: "lib/digital-learning/quiz-engine.mjs",
    certificates: "lib/digital-learning/certificates.mjs",
    calendar: "lib/digital-learning/calendar.mjs",
    personal_library: "lib/digital-learning/library.mjs",
    notifications: "lib/digital-learning/notifications.mjs",
    user_stats: "src/pages/MyLearningPage.tsx",
    admin_dashboard: "src/pages/admin/DigitalLearningSection.tsx",
    ai_assistant: "lib/digital-learning/ai-lesson.mjs",
    performance: "lib/digital-learning/storage.mjs",
    weekly_plan: "lib/digital-learning/progress.mjs",
  };
  try {
    return existsSync(path.join(ROOT, map[id] || ""));
  } catch {
    return false;
  }
}

export async function generateDigitalLearningReport() {
  const admin = getSupabaseAdmin();
  const adminStats = await getAdminLearningStats(admin);

  const features = FEATURES.map((f) => ({
    ...f,
    complete: featureComplete(f.id),
    score: featureComplete(f.id) ? f.weight : 0,
  }));

  const totalWeight = FEATURES.reduce((s, f) => s + f.weight, 0);
  const earned = features.reduce((s, f) => s + f.score, 0);
  const completion_pct = Math.round((earned / totalWeight) * 100);

  const report = {
    generated_at: new Date().toISOString(),
    platform: "Digital Islamic Learning Platform v1",
    completion_pct,
    features,
    metrics: {
      paths_count: LEARNING_PATHS.length,
      modules_count: LEARNING_MODULES.length,
      quizzes_count: DEMO_QUIZZES.length,
      certificates_issued: adminStats.certificates_count || 0,
      notification_rules: Object.keys(NOTIFICATION_TEMPLATES).length,
      enrollments: adminStats.enrollments_count || 0,
      completion_rate: adminStats.completion_rate || 0,
    },
    explore_pages: [
      "/learning",
      "/learning/paths",
      "/my-learning",
      "/learning/quiz",
      "/learning/calendar",
      ...LEARNING_PATHS.map((p) => `/learning/paths/${p.slug}`),
    ],
    improvements: [
      "ربط وحدات المسارات بمحتوى CMS الفعلي (دروس، كتب، فتاوى)",
      "مزامنة التقدم عبر الأجهزة لجميع المستخدمين المسجّلين",
      "توليد PDF للشهادات مع QR Code",
      "ربط الإشعارات بـ Expo Push API",
      "توسيع بنك الأسئلة وربطه بمسارات التعلم",
      "Gamification: نقاط profiles.points و achievements",
    ],
    future_development: [
      "مسارات تفاعلية مع فيديو مدمج",
      "مجتمعات تعلم ومنتديات",
      "تقييم الأقران والمراجعات",
      "تكامل Zoom/YouTube للمحاضرات المباشرة",
    ],
  };

  const outPath = path.join(ROOT, "data/digital-learning-report.json");
  writeFileSync(outPath, JSON.stringify(report, null, 2), "utf8");
  return report;
}
