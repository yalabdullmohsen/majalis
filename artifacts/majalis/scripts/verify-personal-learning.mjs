#!/usr/bin/env node
/**
 * Personal Learning UX — static verification
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
let passed = 0;
let failed = 0;

function ok(cond, msg) {
  if (cond) { passed++; console.log(`  ✓ ${msg}`); }
  else { failed++; console.error(`  ✗ ${msg}`); }
}

function read(rel) {
  return readFileSync(resolve(root, rel), "utf8");
}

console.log("Personal Learning UX verification\n");

const files = [
  "supabase/user_experience_v1.sql",
  "supabase/user_experience_v2.sql",
  "src/lib/personal-learning/types.ts",
  "src/lib/personal-learning/service.ts",
  "src/lib/personal-learning/achievements.ts",
  "src/lib/personal-learning/recommendations.ts",
  "src/lib/personal-learning/sheikh-follow.ts",
  "src/views/MyLibraryPage.tsx",
  "src/views/MyAcademicProfilePage.tsx",
  "src/views/MyProfilePage.tsx",
  "src/views/MyDashboardPage.tsx",
  "src/views/MyUpdatesPage.tsx",
  "src/views/MyLearningPlanPage.tsx",
  "src/components/personal/SaveToLibraryButton.tsx",
  "src/components/personal/PersonalNotesPanel.tsx",
  "src/components/personal/ContentReportFab.tsx",
  "src/components/personal/FollowSheikhButton.tsx",
  "src/components/personal/SmartRecommendations.tsx",
  "src/components/home/HomeFollowedUpdates.tsx",
  "src/views/admin/PersonalLearningAdminSection.tsx",
];

for (const f of files) ok(existsSync(resolve(root, f)), `${f} exists`);

const app = read("src/App.tsx");
ok(app.includes('path="/my-library"'), "Route /my-library");
ok(app.includes('path="/my-profile"'), "Route /my-profile");
ok(app.includes('path="/my-dashboard"'), "Route /my-dashboard");
ok(app.includes('path="/my-updates"'), "Route /my-updates");
ok(app.includes('path="/my-learning-plan"'), "Route /my-learning-plan");
ok(app.includes("ContentReportFab"), "Global report FAB wired");
const home = read("src/views/HomePage.tsx");
ok(home.includes("SmartRecommendations"), "Home smart recommendations");
ok(home.includes("HomeFollowedUpdates"), "Home followed sheikh updates");

const migrationPaths = read("lib/migration-paths.mjs");
ok(migrationPaths.includes("user_experience_v1.sql"), "Migration v1 registered");
ok(migrationPaths.includes("user_experience_v2.sql"), "Migration v2 registered");

const applyMigrations = read("lib/api-handlers/cron/apply-migrations.js");
ok(applyMigrations.includes("user-experience"), "apply-migrations scope user-experience");

const adminNav = read("src/lib/admin-navigation.ts");
ok(adminNav.includes("personal-learning"), "Admin personal-learning section");

const css = read("src/styles/design-system.css");
ok(css.includes(".personal-library-layout"), "Personal library styles");
ok(css.includes(".content-report-fab"), "Report FAB styles");

const service = read("src/lib/personal-learning/service.ts");
ok(service.includes("ensureDefaultFolders"), "Default folders seed");
ok(service.includes("user_learning_audit"), "Audit log");
ok(service.includes("user_streaks"), "Streak tracking");
ok(service.includes("checkAndAwardAchievements"), "Achievements integration");

const achievements = read("src/lib/personal-learning/achievements.ts");
ok(achievements.includes("first_lesson"), "Achievement definitions");

const follow = read("src/lib/personal-learning/sheikh-follow.ts");
ok(follow.includes("user_sheikh_follows"), "Sheikh follow table usage");

const notes = read("src/components/personal/PersonalNotesPanel.tsx");
ok(notes.includes("ملاحظاتي"), "Notes UI label");
ok(!notes.match(/lorem|placeholder text/i), "No placeholder in notes UI");

console.log(`\nResult: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
