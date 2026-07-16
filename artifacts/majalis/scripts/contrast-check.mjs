#!/usr/bin/env node
/**
 * WCAG AA Contrast Check — منصة المجلس العلمي
 * يفحص نسب التباين للألوان الجوهرية ويطبع تقريراً.
 *
 * معايير WCAG AA:
 *  - نص عادي   (< 18px normal / < 14px bold): ≥ 4.5:1
 *  - نص كبير   (≥ 18px normal / ≥ 14px bold): ≥ 3.0:1
 *  - مكونات UI (حدود، أيقونات):               ≥ 3.0:1
 */

// ── تحويل hex → sRGB linear ──────────────────────────────
function hexToLinear(hex) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const toLinear = (v) => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  return { r: toLinear(r), g: toLinear(g), b: toLinear(b) };
}

function relativeLuminance({ r, g, b }) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(hex1, hex2) {
  const L1 = relativeLuminance(hexToLinear(hex1));
  const L2 = relativeLuminance(hexToLinear(hex2));
  const lighter = Math.max(L1, L2);
  const darker  = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

// ── الحالات المُختبَرة ────────────────────────────────────
const PAIRS = [
  // نص أبيض على خلفيات داكنة
  { label: "أبيض على الزمردي الرئيسي (#0E6E52)",   fg: "#FFFFFF", bg: "#0E6E52", type: "normal" },
  { label: "أبيض على الزمردي الداكن (#153025)",    fg: "#FFFFFF", bg: "#153025", type: "normal" },
  { label: "أبيض على #1F4D3A",                     fg: "#FFFFFF", bg: "#1F4D3A", type: "normal" },
  { label: "أبيض على #1a3a28 (gradient end)",       fg: "#FFFFFF", bg: "#1a3a28", type: "normal" },

  // نص على خلفيات فاتحة
  { label: "الزمردي #0E6E52 على أبيض",             fg: "#0E6E52", bg: "#FFFFFF", type: "normal" },
  { label: "الزمردي #153025 على أبيض",             fg: "#153025", bg: "#FFFFFF", type: "normal" },
  { label: "#1F4D3A على #EEF7F2 (بطاقة فاتحة)",    fg: "#1F4D3A", bg: "#EEF7F2", type: "normal" },
  { label: "#1F4D3A على #F0F5F2",                   fg: "#1F4D3A", bg: "#F0F5F2", type: "normal" },
  { label: "#607D6E على أبيض (نص ثانوي)",          fg: "#607D6E", bg: "#FFFFFF", type: "normal" },
  { label: "#4E6658 على #F0F5F2 (نص ثانوي على رمادي — offline.html بعد الإصلاح)", fg: "#4E6658", bg: "#F0F5F2", type: "normal" },

  // نصوص العناوين
  { label: "#111111 على أبيض",                     fg: "#111111", bg: "#FFFFFF", type: "normal" },
  { label: "#333333 على أبيض",                     fg: "#333333", bg: "#FFFFFF", type: "normal" },
  { label: "#444444 على أبيض",                     fg: "#444444", bg: "#FFFFFF", type: "normal" },

  // بطاقة مجلس اليوم (HomeMajlisToday)
  { label: "أبيض على زمردي (بطاقة مجلس اليوم)",   fg: "#FFFFFF", bg: "#0E6E52", type: "large" },
  { label: "rgba-أبيض-0.85 على #153025 (header)", fg: "#D9E8E4", bg: "#153025", type: "normal" },

  // الإشعارات (AdhanNotificationBar)
  { label: "أبيض على #0E6E52 (toast أذان)",        fg: "#FFFFFF", bg: "#0E6E52", type: "normal" },
  { label: "#1F4D3A على rgba-frosted (toast تذكير)", fg: "#1F4D3A", bg: "#EEFAF4", type: "normal" },

  // مكونات UI (أيقونات + حدود)
  { label: "#0E6E52 (icon) على #EEF7F2",           fg: "#0E6E52", bg: "#EEF7F2", type: "ui" },
  // ملاحظة: حد #e5e7eb على أبيض زخرفي بحت (exempt من WCAG 1.4.11) — غير مُختبَر

  // صفحة تفاصيل الأنبياء (.prophet-detail-lux) — خلفية كحلية دائمة بغض النظر عن ثيم
  // الموقع. PROPHET_HUE في ProphetStoriesPage.tsx مصمَّم للنص على بطاقات بيضاء
  // (القائمة)؛ استخدامه خامًا كنص هنا كان يُنتج نصًا وأيقونات شبه غير مرئية
  // (اكتُشف عبر بلاغ مستخدم على /prophets/ibrahim). --prophet-color-on-dark يمزج
  // نحو الأبيض 55% ليضمن ≥4.5:1 حتى مع أغمق قيم PROPHET_HUE. أسوأ حالتين موثقتان هنا.
  { label: "أغمق لون نبي (#123F36 ← ممزوج #7d9590) على خلفية التفاصيل الكحلية", fg: "#7d9590", bg: "#0A1628", type: "normal" },
  { label: "أغمق لون نبي (#153025 ← ممزوج #7e8d87) على خلفية التفاصيل الكحلية", fg: "#7e8d87", bg: "#0A1628", type: "normal" },
];

// ── التشغيل ──────────────────────────────────────────────
const PASS_THRESHOLD = { normal: 4.5, large: 3.0, ui: 3.0 };

let passCount = 0;
let failCount = 0;
const failures = [];

console.log("\n╔══════════════════════════════════════════════════════════╗");
console.log("║      فحص تباين WCAG AA — المجلس العلمي                 ║");
console.log("╚══════════════════════════════════════════════════════════╝\n");

for (const pair of PAIRS) {
  const ratio = contrastRatio(pair.fg, pair.bg);
  const threshold = PASS_THRESHOLD[pair.type];
  const pass = ratio >= threshold;
  const status = pass ? "✅ PASS" : "❌ FAIL";
  const ratioStr = ratio.toFixed(2).padStart(5);

  console.log(`${status}  ${ratioStr}:1  (≥${threshold})  ${pair.label}`);

  if (pass) passCount++;
  else {
    failCount++;
    failures.push({ ...pair, ratio: ratio.toFixed(2) });
  }
}

console.log(`\n────────────────────────────────────────────────────────────`);
console.log(`النتيجة: ${passCount} نجح / ${failCount} فشل من ${PAIRS.length} حالة`);

if (failures.length > 0) {
  console.log("\n⚠️  الحالات الفاشلة:\n");
  for (const f of failures) {
    console.log(`  • ${f.label}`);
    console.log(`    FG: ${f.fg}  BG: ${f.bg}  النسبة: ${f.ratio}:1  المطلوب: ≥${PASS_THRESHOLD[f.type]}:1`);
  }
  console.log();
  process.exit(1);
} else {
  console.log("\n🎉 جميع الألوان تجتاز معيار WCAG AA\n");
  process.exit(0);
}
