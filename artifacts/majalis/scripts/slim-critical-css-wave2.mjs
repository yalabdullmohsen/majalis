#!/usr/bin/env node
/**
 * موجة 2 — تخفيف CSS المسار الحرج:
 * نقل كتل صفحات يتيمة/stubs من index/DS/modern/v2/final إلى styles/pages/*
 * مع إضافة import على الصفحات الكسولة فقط.
 *
 * النطاقات 1-based inclusive ومُتحقَّق منها قبل التشغيل.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(resolve(root, rel), "utf8");
}
function write(rel, text) {
  writeFileSync(resolve(root, rel), text);
}
function removeRanges(text, ranges) {
  const lines = text.split("\n");
  const drop = new Set();
  for (const [a, b] of ranges) {
    for (let i = a; i <= b; i++) drop.add(i);
  }
  return lines.filter((_, idx) => !drop.has(idx + 1)).join("\n");
}
function ensureImport(rel, cssImport) {
  if (!existsSync(resolve(root, rel))) {
    console.warn("  ! لا ملف صفحة:", rel);
    return;
  }
  let src = read(rel);
  if (src.includes(cssImport)) {
    console.log("  · موجود مسبقًا:", rel, cssImport);
    return;
  }
  const lines = src.split("\n");
  let last = 0;
  let inMulti = false;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (/^import\s+/.test(l) && l.includes("{") && !l.includes("}")) {
      inMulti = true;
      continue;
    }
    if (inMulti) {
      if (l.includes("}")) {
        inMulti = false;
        last = i;
      }
      continue;
    }
    if (/^import\s+/.test(l)) last = i;
  }
  lines.splice(last + 1, 0, `import "${cssImport}";`);
  write(rel, lines.join("\n"));
  console.log("  + import", rel, "←", cssImport);
}

function extractFrom(sourceRel, jobs, markerNote) {
  let src = read(sourceRel);
  const lines = src.split("\n");
  const ranges = [];

  for (const job of jobs) {
    const headWindow = lines
      .slice(job.start - 1, Math.min(job.start + 3, lines.length))
      .join("\n");
    const tailWindow = lines
      .slice(Math.max(job.end - 3, 0), job.end)
      .join("\n");
    const head = (lines[job.start - 1] ?? "").trim();
    const tail = (lines[job.end - 1] ?? "").trim();
    if (job.expectHead && !headWindow.includes(job.expectHead)) {
      throw new Error(
        `${sourceRel}:${job.start} head mismatch\n  got: ${headWindow.slice(0, 120)}\n  want: ${job.expectHead}`,
      );
    }
    if (job.expectTail && !tailWindow.includes(job.expectTail)) {
      throw new Error(
        `${sourceRel}:${job.end} tail mismatch\n  got: ${tailWindow.slice(0, 120)}\n  want: ${job.expectTail}`,
      );
    }
    console.log(`extract ${job.dest}: ${sourceRel} ${job.start}-${job.end}`);
    const block = lines.slice(job.start - 1, job.end).join("\n") + "\n";
    const header = `\n\n/* ── نُقل من ${sourceRel} (موجة 2 — تخفيف المسار الحرج) ── */\n`;
    if (existsSync(resolve(root, job.dest))) {
      write(job.dest, read(job.dest).replace(/\s*$/, "") + header + block);
    } else {
      write(job.dest, "/* مُستخرج لتأجيل التحميل مع الصفحة */\n" + block);
    }
    ranges.push([job.start, job.end]);
    if (job.view) {
      const cssPath = job.dest.replace(/^src/, "@");
      ensureImport(job.view, cssPath);
    }
    for (const v of job.views || []) {
      const cssPath = job.dest.replace(/^src/, "@");
      ensureImport(v, cssPath);
    }
  }

  src = removeRanges(src, ranges);
  if (markerNote && !src.includes(markerNote.slice(0, 40))) {
    src = src.replace(/\s*$/, "") + "\n\n" + markerNote + "\n";
  }
  write(sourceRel, src);
  console.log(`✓ ${sourceRel} trimmed →`, src.length, "chars");
}

// ── index.css ──
extractFrom(
  "src/index.css",
  [
    {
      start: 5467,
      end: 5612,
      dest: "src/styles/pages/tasbih.css",
      view: "src/views/TasbihPage.tsx",
      expectHead: "Professional tasbih",
      expectTail: "}",
    },
    {
      start: 5723,
      end: 5776,
      dest: "src/styles/pages/prayer-ranks.css",
      view: "src/views/PrayerRanksPage.tsx",
      expectHead: "Prayer ranks page",
      expectTail: "}",
    },
    {
      start: 7004,
      end: 7496,
      dest: "src/styles/pages/hadith.css",
      view: "src/views/HadithPage.tsx",
      expectHead: "HADITH PAGE",
      expectTail: "}",
    },
    {
      start: 7663,
      end: 7895,
      dest: "src/styles/pages/calendar.css",
      view: "src/views/CalendarPage.tsx",
      expectHead: "Calendar page",
      expectTail: "}",
    },
    {
      start: 13291,
      end: 13376,
      dest: "src/styles/pages/kuwait-lessons.css",
      view: "src/views/KuwaitLessonsPage.tsx",
      expectHead: "Kuwait Lessons Page",
      expectTail: "kuwait-lessons-footer-note",
    },
    {
      start: 15017,
      end: 15206,
      dest: "src/styles/pages/admin-shell.css",
      view: "src/views/AdminPage.tsx",
      expectHead: "Admin Shell",
      expectTail: "admin-flash__close:hover",
    },
    {
      start: 15228,
      end: 15359,
      dest: "src/styles/pages/features-in-progress.css",
      views: ["src/views/FeaturesInProgressPage.tsx", "src/views/MethodologyPage.tsx"],
      expectHead: "جاري التعديل",
      expectTail: "}",
    },
    {
      start: 15718,
      end: 15862,
      dest: "src/styles/pages/auth.css",
      views: ["src/views/LoginPage.tsx", "src/views/RegisterPage.tsx"],
      expectHead: "Auth Pages",
      expectTail: "}",
    },
    {
      start: 17151,
      end: 17206,
      dest: "src/styles/pages/reading-plans.css",
      view: "src/views/ReadingPlansPage.tsx",
      expectHead: "خطط القراءة",
      expectTail: "rp-suggestions",
    },
  ],
  "/* ── موجة 2: نُقلت كتل hadith/calendar/tasbih/prayer-ranks/kuwait/admin/auth/rp ── */",
);

// ── design-system.css ──
extractFrom(
  "src/styles/design-system.css",
  [
    {
      // SVG ring + wird pills فقط — لا نلمس Push Prompt / User Stats / شريط الصلاة في الرئيسية
      start: 1772,
      end: 1970,
      dest: "src/styles/pages/tasbih.css",
      view: "src/views/TasbihPage.tsx",
      expectHead: "Tasbih — SVG",
      expectTail: "}",
    },
    {
      start: 2564,
      end: 2803,
      dest: "src/styles/pages/learning-plan.css",
      view: "src/views/LearningPlanPage.tsx",
      expectHead: "خطة التعلّم",
      expectTail: "lp-plan__action-btn--primary:hover",
    },
    {
      start: 2958,
      end: 3069,
      dest: "src/styles/pages/notifications.css",
      view: "src/views/NotificationSettingsPage.tsx",
      expectHead: "إعدادات الإشعارات",
      expectTail: "}",
    },
    {
      start: 3107,
      end: 3269,
      dest: "src/styles/pages/study-room.css",
      view: "src/views/StudyRoomPage.tsx",
      expectHead: "غرفة الدراسة",
      expectTail: "sr-login-hint",
    },
    {
      start: 3271,
      end: 3391,
      dest: "src/styles/pages/family-mode.css",
      view: "src/views/FamilyModePage.tsx",
      expectHead: "الوضع العائلي",
      expectTail: "}",
    },
    {
      start: 3393,
      end: 3658,
      dest: "src/styles/pages/vault.css",
      view: "src/views/VaultPage.tsx",
      expectHead: "المحفظة العلمية",
      expectTail: "}",
    },
    {
      start: 3660,
      end: 3785,
      dest: "src/styles/pages/researcher-profile.css",
      view: "src/views/ResearcherProfilePage.tsx",
      expectHead: "ملف الباحث",
      expectTail: "rp-saved-msg",
    },
    {
      start: 4079,
      end: 4178,
      dest: "src/styles/pages/tawhid.css",
      view: "src/views/TawhidPage.tsx",
      expectHead: "صفحة التوحيد",
      expectTail: "}",
    },
  ],
  "/* ── موجة 2: نُقلت vault/study/family/learning-plan/tasbih/notif/researcher/tawhid ── */",
);

// ── modern-2026.css ──
extractFrom(
  "src/styles/modern-2026.css",
  [
    {
      start: 468,
      end: 625,
      dest: "src/styles/pages/prayer-times.css",
      view: "src/views/PrayerTimesPage.tsx",
      expectHead: "Prayer Times Page",
      expectTail: "}",
    },
    {
      start: 1163,
      end: 1279,
      dest: "src/styles/pages/calendar.css",
      view: "src/views/CalendarPage.tsx",
      expectHead: "Calendar Improvements",
      expectTail: "}",
    },
  ],
  "/* ── موجة 2: نُقلت prayer-times + calendar improvements ── */",
);

// ── majalis-v2.css ──
extractFrom(
  "src/styles/majalis-v2.css",
  [
    {
      start: 1780,
      end: 1978,
      dest: "src/styles/pages/admin-shell.css",
      view: "src/views/AdminPage.tsx",
      expectHead: "AdminInlineEdit",
      expectTail: "}",
    },
    {
      start: 2815,
      end: 2915,
      dest: "src/styles/pages/scholars.css",
      view: "src/views/ScholarProfilePage.tsx",
      expectHead: "ScholarProfilePage",
      expectTail: "نهاية صفحة بروفايل",
    },
    {
      start: 2917,
      end: 2964,
      dest: "src/styles/pages/account-deletion.css",
      view: "src/views/AccountDeletionPage.tsx",
      expectHead: "AccountDeletionPage",
      expectTail: "نهاية صفحة حذف الحساب",
    },
  ],
  "/* ── موجة 2: نُقلت AdminInlineEdit / ScholarProfile / AccountDeletion ── */",
);

// ── final-release.css — kids hub only ──
extractFrom(
  "src/styles/final-release.css",
  [
    {
      start: 198,
      end: 278,
      dest: "src/styles/pages/kids.css",
      view: "src/views/KidsPage.tsx",
      expectHead: "قسم الأطفال",
      expectTail: "kids-hub-card__icon",
    },
  ],
  "/* ── موجة 2: نُقل kids-hub إلى pages/kids.css ── */",
);

// elite — نطاقات ثابتة فقط (الكشف الدينامي السابق وسّع الكتل بالخطأ)
{
  const elite = read("src/styles/elite-2026.css");
  if (elite.includes("20. Prayer Times Page") && elite.includes("38. Hadith Page")) {
    extractFrom(
      "src/styles/elite-2026.css",
      [
        {
          start: 900,
          end: 956,
          dest: "src/styles/pages/prayer-times.css",
          view: "src/views/PrayerTimesPage.tsx",
          expectHead: "Prayer Times Page",
          expectTail: "}",
        },
        {
          start: 1330,
          end: 1393,
          dest: "src/styles/pages/hadith.css",
          view: "src/views/HadithPage.tsx",
          expectHead: "Hadith Page",
          expectTail: "}",
        },
      ],
      "/* ── موجة 2: نُقلت elite prayer-times + hadith ── */",
    );
  } else {
    console.log("· elite prayer/hadith مُستخرجان مسبقًا — تخطٍ");
  }
}

console.log("✓ slim-critical-css-wave2 اكتمل");
