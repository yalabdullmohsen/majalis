/**
 * Admin Isolation Guard — لا أدوات إدارة فوق التطبيق العام.
 * تشغيل: node --import tsx src/lib/__tests__/admin-isolation-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { isAdminPath, isAdminSurfaceAllowed } from "../admin-surface.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

console.log("=== admin-surface helpers ===");
assert.equal(isAdminPath("/admin"), true);
assert.equal(isAdminPath("/admin/dashboard"), true);
assert.equal(isAdminPath("/admin?section=lessons"), true);
assert.equal(isAdminPath("/lessons"), false);
assert.equal(isAdminPath("/prophet-stories"), false);
assert.equal(isAdminSurfaceAllowed("/lessons", true), false);
assert.equal(isAdminSurfaceAllowed("/admin", true), true);
assert.equal(isAdminSurfaceAllowed("/admin", false), false);

const app = read("src/App.tsx");
const shell = read("src/views/admin/AdminShell.tsx");
const inline = read("src/components/AdminInlineEdit.tsx");
const quick = read("src/components/AdminQuickEdit.tsx");
const lessons = read("src/pages/lessons/ui/LessonsView.tsx");

console.log("=== App العام بلا AdminSiteEditBar ===");
assert.doesNotMatch(app, /AdminSiteEditBar/);
assert.doesNotMatch(app, /from "@\/components\/AdminSiteEditBar"/);

console.log("=== AdminShell يحمّل شريط التحرير ===");
assert.match(shell, /AdminSiteEditBar/);

console.log("=== Inline/Quick gated بـ isAdminSurfaceAllowed ===");
assert.match(inline, /isAdminSurfaceAllowed/);
assert.match(quick, /isAdminSurfaceAllowed/);

console.log("=== قائمة الدروس بلا شريط حذف/تعديل عام ===");
assert.doesNotMatch(lessons, /lesson-admin-toolbar/);
assert.doesNotMatch(lessons, /handleAdminDelete/);

console.log("admin-isolation-gate.test.ts: ok");
