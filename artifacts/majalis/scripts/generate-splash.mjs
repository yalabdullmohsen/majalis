#!/usr/bin/env node
/**
 * generate-splash.mjs — مقفل على سياسة الإقلاع الموحّدة (لون صامت فقط).
 *
 * الدخولية المعتمدة: #002b21 بلا صور Splash / apple-splash / assets/splash.png.
 * إعادة توليد الصور القديمة ممنوعة جذريًا حتى لا تعود الدخولية القديمة.
 *
 * لضبط لون الإطلاق: عدّل capacitor.config + LaunchScreen + colors.xml + index.html.
 */
console.error(
  [
    "assets:splash معطّل عمدًا.",
    "سياسة المجلس: دخولية لون صامت #002b21 فقط — بلا صورة قديمة.",
    "لا تشغّل مولّدات الصور؛ راجع launch-splash-unified.test.ts.",
  ].join("\n"),
);
process.exit(1);
