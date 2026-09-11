/**
 * بوابة: حالة مصادقة صريحة + مسح الكاش عند الخروج.
 * تشغيل: node --import tsx src/lib/__tests__/auth-session-status-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const auth = readFileSync(resolve(root, "src/components/AuthProvider.tsx"), "utf8");

assert.match(auth, /export type AuthStatus/);
assert.match(auth, /"initializing"/);
assert.match(auth, /"authenticated"/);
assert.match(auth, /"unauthenticated"/);
assert.match(auth, /"error"/);
assert.match(auth, /loading:\s*status\s*===\s*"initializing"/);
assert.match(auth, /queryClient\.clear\(\)/);
assert.match(auth, /clearAudioResumeState/);
assert.match(auth, /clearAllLessonAudioResume/);
assert.match(auth, /useQueryClient/);
assert.match(auth, /setStatus\("authenticated"\)/);
assert.match(auth, /setStatus\("unauthenticated"\)/);
assert.match(
  auth,
  /isNativePlatform/,
  "bootstrap فوري على الأصلي يمنع وميض الجلسة",
);
assert.doesNotMatch(
  auth,
  /setLoading\(false\)/,
  "لا loading منفصل — status هو المصدر",
);

const main = readFileSync(resolve(root, "src/main.tsx"), "utf8");
assert.doesNotMatch(main, /bootstrapSupabaseFromServer/, "لا bootstrap مزدوج من main");

const crit = readFileSync(resolve(root, "src/styles/critical-first-paint.css"), "utf8");
assert.match(crit, /\.chrome-boot-ph\.navbar-v3/, "حجز ارتفاع هيكل الكروم");
assert.match(crit, /\.chrome-boot-ph\.bottom-nav|\.chrome-boot-ph\[data-bottom-nav\]/, "حجز ارتفاع الشريط السفلي");

const nav = readFileSync(resolve(root, "src/components/NavBar.tsx"), "utf8");
assert.match(nav, /loading:\s*authLoading|authLoading/);
assert.match(nav, /navbar-auth--pending|authLoading/);

const continueWidget = readFileSync(
  resolve(root, "src/components/home/HomeContinueWidget.tsx"),
  "utf8",
);
assert.match(continueWidget, /loading:\s*authLoading/);
assert.match(continueWidget, /authLoading[\s\S]*\? "loading"/);

const recentProgress = readFileSync(resolve(root, "src/hooks/useRecentProgress.ts"), "utf8");
assert.match(recentProgress, /loading:\s*authLoading/);
assert.match(recentProgress, /if \(authLoading\)/);

const transcribe = readFileSync(resolve(root, "src/views/TranscribePage.tsx"), "utf8");
assert.match(transcribe, /loading:\s*authLoading/);
assert.match(transcribe, /authLoading \?/);
assert.doesNotMatch(
  transcribe,
  /\{!isLoggedIn && \(\s*<div className="trp-login-notice"/,
  "لا إشعار دخول قبل اكتمال تهيئة الجلسة",
);

const studyRoom = readFileSync(resolve(root, "src/views/StudyRoomPage.tsx"), "utf8");
assert.match(studyRoom, /loading:\s*authLoading/);
assert.match(studyRoom, /authLoading \|\| \(isLoggedIn && loadingData\)/);

const readingPlans = readFileSync(resolve(root, "src/pages/library/ui/ReadingPlansView.tsx"), "utf8");
assert.match(readingPlans, /loading:\s*authLoading/);
assert.match(readingPlans, /authLoading \?/);

console.log("auth-session-status-gate.test.ts: ok");
