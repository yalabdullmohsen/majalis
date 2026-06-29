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
  "src/lib/personal-learning/types.ts",
  "src/lib/personal-learning/service.ts",
  "src/views/MyLibraryPage.tsx",
  "src/views/MyAcademicProfilePage.tsx",
  "src/views/MyLearningPlanPage.tsx",
  "src/components/personal/SaveToLibraryButton.tsx",
  "src/components/personal/PersonalNotesPanel.tsx",
  "src/components/personal/ContentReportFab.tsx",
  "src/views/admin/PersonalLearningAdminSection.tsx",
];

for (const f of files) ok(existsSync(resolve(root, f)), `${f} exists`);

const app = read("src/App.tsx");
ok(app.includes('path="/my-library"'), "Route /my-library");
ok(app.includes('path="/my-academic-profile"'), "Route /my-academic-profile");
ok(app.includes('path="/my-learning-plan"'), "Route /my-learning-plan");
ok(app.includes("ContentReportFab"), "Global report FAB wired");

const migrationPaths = read("lib/migration-paths.mjs");
ok(migrationPaths.includes("user_experience_v1.sql"), "Migration registered");

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

const notes = read("src/components/personal/PersonalNotesPanel.tsx");
ok(notes.includes("ملاحظاتي"), "Notes UI label");
ok(!notes.match(/lorem|placeholder text/i), "No placeholder in notes UI");

console.log(`\nResult: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
