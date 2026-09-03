#!/usr/bin/env node
/**
 * فحص جودة الدروس — سُنّة / ssunnah.com
 * المخرجات: reports/lessons-quality-audit.{md,json}
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = resolve(root, "../..");
const reportsDir = resolve(repoRoot, "reports");

const { mapLessonRow, dedupeKuwaitLessons, isLessonComplete, filterKuwaitLessons, DEFAULT_KUWAIT_FILTERS } =
  await import(pathToFileURL(resolve(root, "src/lib/kuwait-lessons.ts")).href);
const { buildLessonDedupeKey, findDuplicateClusters } = await import(
  pathToFileURL(resolve(root, "src/lib/lessons/lessonDeduper.ts")).href,
);
const { groupLessonsForSchedule, findCoursesNeedingGrouping } = await import(
  pathToFileURL(resolve(root, "src/lib/lessons/lessonGrouping.ts")).href,
);
const { applyLessonQuickFilters, DEFAULT_LESSON_QUICK_FILTERS } = await import(
  pathToFileURL(resolve(root, "src/components/lessons/LessonFilters.tsx")).href,
);
const { lessonMatchesSearch } = await import(
  pathToFileURL(resolve(root, "src/lib/lessons/lessonSearch.ts")).href,
);
const { classifyWomenAttendance } = await import(
  pathToFileURL(resolve(root, "lib/lesson-women-attendance.mjs")).href,
);

function readJson(rel) {
  return JSON.parse(readFileSync(resolve(root, rel), "utf8"));
}

function readText(rel) {
  return readFileSync(resolve(root, rel), "utf8");
}

const chunkPath = "public/data/lessons/chunk-000.json";
const rawRows = readJson(chunkPath);
const allLessons = dedupeKuwaitLessons(rawRows.map((row) => mapLessonRow({ ...row, source: "seed" })));

const rows = [];
const blockers = [];
const warnings = [];

function addRow(entry) {
  rows.push(entry);
  if (entry.blocksDeploy) blockers.push(entry);
  else if (entry.severity === "high" || entry.severity === "medium") warnings.push(entry);
}

for (const lesson of allLessons) {
  const dupKey = buildLessonDedupeKey(lesson);
  const cluster = findDuplicateClusters(allLessons).find((c) => c.key === dupKey);
  const isDup = cluster && cluster.lessons.length > 1;
  const isCourse = Boolean(lesson.courseId && (lesson.sessionCount || 0) > 1);
  const complete = isLessonComplete(lesson);
  const missing = [];
  if (!lesson.title?.trim()) missing.push("title");
  if (!lesson.sheikhName?.trim()) missing.push("sheikh");
  if (!lesson.time?.trim()) missing.push("time");
  if (!lesson.mosque?.trim()) missing.push("place");

  let fix = "لا إجراء";
  let severity = "info";
  let blocksDeploy = false;

  if (!lesson.title?.trim()) {
    fix = "أضف عنوانًا صريحًا";
    severity = "high";
    blocksDeploy = true;
  } else if (!lesson.sheikhName?.trim()) {
    fix = "أضف اسم الشيخ";
    severity = "high";
  } else if (complete && !lesson.mosque?.trim() && !lesson.time?.trim()) {
    fix = "بيانات الجدول ناقصة رغم اكتمال العرض";
    severity = "medium";
  } else if (isDup) {
    fix = "دمج عرضي — الإبقاء على السجل الأكمل";
    severity = "medium";
  } else if (isCourse) {
    fix = "مجمّع ضمن دورة";
    severity = "info";
  }

  const women = classifyWomenAttendance({
    title: lesson.title,
    description: lesson.description,
    mosque: lesson.mosque,
    keywords: lesson.keywords,
  });
  if (lesson.womenAttendance === "متاح" && women.womenAttendance !== "متاح") {
    addRow({
      id: lesson.id,
      title: lesson.title,
      sheikh: lesson.sheikhName,
      date: lesson.day || lesson.gregorianDate || "",
      place: lesson.mosque,
      isDuplicate: false,
      isMultiSessionCourse: isCourse,
      status: "women_mismatch",
      suggestedFix: "إزالة شارة النساء — لا ذكر صريح",
      blocksDeploy: false,
      severity: "high",
    });
  }

  addRow({
    id: lesson.id,
    title: lesson.title || "(بلا عنوان)",
    sheikh: lesson.sheikhName || "(بلا شيخ)",
    date: lesson.day || lesson.gregorianDate || "",
    place: lesson.mosque || "",
    isDuplicate: Boolean(isDup),
    isMultiSessionCourse: isCourse,
    status: complete ? "complete" : "incomplete",
    suggestedFix: fix,
    blocksDeploy,
    severity,
    missingFields: missing,
  });
}

// فلاتر تعمل
const filterChecks = [
  { id: "in_person", filters: { ...DEFAULT_LESSON_QUICK_FILTERS, schedule: "in_person" } },
  { id: "remote", filters: { ...DEFAULT_LESSON_QUICK_FILTERS, schedule: "remote" } },
  { id: "today", filters: { ...DEFAULT_LESSON_QUICK_FILTERS, schedule: "today" } },
  { id: "this_week", filters: { ...DEFAULT_LESSON_QUICK_FILTERS, schedule: "this_week" } },
];
for (const check of filterChecks) {
  const before = allLessons.length;
  const after = applyLessonQuickFilters(allLessons, check.filters).length;
  if (before > 0 && after === before && check.id !== "all") {
    addRow({
      id: `filter-${check.id}`,
      title: `فلتر ${check.id}`,
      sheikh: "",
      date: "",
      place: "",
      isDuplicate: false,
      isMultiSessionCourse: false,
      status: "filter_noop",
      suggestedFix: "الفلتر لا يغيّر النتائج — راجع المنطق أو أخفِ الفلتر",
      blocksDeploy: false,
      severity: "medium",
    });
  }
}

// بحث
if (!lessonMatchesSearch(allLessons[0], allLessons[0]?.title?.split(" ")[0] || "")) {
  addRow({
    id: "search-broken",
    title: "البحث الداخلي",
    sheikh: "",
    date: "",
    place: "",
    isDuplicate: false,
    isMultiSessionCourse: false,
    status: "search_broken",
    suggestedFix: "إصلاح lessonSearch",
    blocksDeploy: true,
    severity: "critical",
  });
}

// /more و Majlisilm
const scanFiles = [
  "src/pages/lessons/ui/LessonsView.tsx",
  "src/components/lessons/LessonCard.tsx",
  "src/components/lessons/LessonFilters.tsx",
  "src/lib/lessons/lessonGrouping.ts",
];
for (const file of scanFiles) {
  const text = readText(file);
  if (/\/more\b/.test(text)) {
    addRow({
      id: `more-${file}`,
      title: file,
      sheikh: "",
      date: "",
      place: "",
      isDuplicate: false,
      isMultiSessionCourse: false,
      status: "more_link",
      suggestedFix: "إزالة /more",
      blocksDeploy: true,
      severity: "critical",
    });
  }
  if (/Majlisilm|المجلس العلمي/i.test(text)) {
    addRow({
      id: `brand-${file}`,
      title: file,
      sheikh: "",
      date: "",
      place: "",
      isDuplicate: false,
      isMultiSessionCourse: false,
      status: "legacy_brand",
      suggestedFix: "إزالة الاسم القديم",
      blocksDeploy: true,
      severity: "critical",
    });
  }
}

// مصحف/تفسير
const mushafCss = existsSync(resolve(root, "src/styles/pages/mushaf.css"))
  ? readText("src/styles/pages/mushaf.css")
  : "";
if (/font-size|line-height/u.test(mushafCss) && /lessons-quality/.test("")) {
  /* لا تغيير في هذه المهمة */
}

const routeFiles = ["src/AppRoutes.tsx", "vercel.json"];
for (const file of routeFiles) {
  if (!existsSync(resolve(root, file))) continue;
  const text = readText(file);
  for (const bad of ["/internal", "/review", "/admin"]) {
    if (new RegExp(`["']${bad}["']`).test(text) && file === "src/AppRoutes.tsx") {
      /* admin routes may exist gated — flag only if enabled without gate */
    }
  }
}

const duplicateClusters = findDuplicateClusters(allLessons);
const coursesGrouped = findCoursesNeedingGrouping(allLessons);
const schedulePreview = groupLessonsForSchedule(allLessons);
const courseCards = schedulePreview.filter((e) => e.kind === "course").length;

const summary = {
  generatedAt: new Date().toISOString(),
  totalLessons: allLessons.length,
  duplicateClusters: duplicateClusters.length,
  coursesWithSessions: coursesGrouped.length,
  courseCardsInSchedule: courseCards,
  incompleteLessons: rows.filter((r) => r.status === "incomplete").length,
  blockers: blockers.length,
  warnings: warnings.length,
};

const report = {
  summary,
  duplicateClusters: duplicateClusters.map((c) => ({
    key: c.key,
    count: c.lessons.length,
    ids: c.lessons.map((l) => l.id),
    titles: c.lessons.map((l) => l.title),
  })),
  coursesGrouped,
  entries: rows,
};

writeFileSync(resolve(reportsDir, "lessons-quality-audit.json"), JSON.stringify(report, null, 2), "utf8");

const md = [
  "# تقرير جودة الدروس — سُنّة",
  "",
  `تاريخ التوليد: ${summary.generatedAt}`,
  "",
  "## الملخص",
  "",
  `| المؤشر | القيمة |`,
  `|---|---|`,
  `| إجمالي الدروس | ${summary.totalLessons} |`,
  `| مجموعات تكرار فعلي | ${summary.duplicateClusters} |`,
  `| دورات متعددة المجالس | ${summary.coursesWithSessions} |`,
  `| بطاقات دورات في العرض | ${summary.courseCardsInSchedule} |`,
  `| دروس ناقصة | ${summary.incompleteLessons} |`,
  `| معوقات النشر | ${summary.blockers} |`,
  `| تحذيرات | ${summary.warnings} |`,
  "",
  "## التكرارات الفعلية",
  "",
  ...(duplicateClusters.length
    ? duplicateClusters.map(
        (c) =>
          `- **${c.lessons[0]?.title || c.key}** (${c.lessons.length}): ${c.lessons.map((l) => l.id).join(", ")}`,
      )
    : ["- لا تكرار فعلي مزعج."]),
  "",
  "## الدورات المجمّعة",
  "",
  ...(coursesGrouped.length
    ? coursesGrouped.map((c) => `- ${c.title} (\`${c.courseId}\`) — ${c.sessionIds.length} مجلس`)
    : ["- لا دورات متعددة المجالس."]),
  "",
  "## عيوب تمنع النشر",
  "",
  ...(blockers.length
    ? blockers.map((b) => `- \`${b.id}\`: ${b.suggestedFix}`)
    : ["- لا معوقات."]),
  "",
  "## عينة من السجلات",
  "",
  "| العنوان | الشيخ | التاريخ | المكان | مكرر | دورة | الحالة | الإصلاح |",
  "|---|---|---|---|---|---|---|---|",
  ...rows.slice(0, 40).map(
    (r) =>
      `| ${r.title} | ${r.sheikh} | ${r.date} | ${r.place} | ${r.isDuplicate ? "نعم" : "لا"} | ${r.isMultiSessionCourse ? "نعم" : "لا"} | ${r.status} | ${r.suggestedFix} |`,
  ),
  "",
].join("\n");

writeFileSync(resolve(reportsDir, "lessons-quality-audit.md"), md, "utf8");

console.log(`lessons-quality-audit: ${summary.totalLessons} درس، ${summary.duplicateClusters} تكرار، ${summary.blockers} معوقات`);
if (blockers.length > 0) {
  console.error("معوقات النشر:", blockers.map((b) => b.id).join(", "));
  process.exit(1);
}
process.exit(0);
