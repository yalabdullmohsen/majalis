#!/usr/bin/env node
/**
 * generate-splash.mjs — مقفل.
 * الدخولية المعتمدة: SVG صامت في index.html + LaunchMark في iOS.
 * لا توليد splash.png / apple-splash.
 */
console.error(
  [
    "assets:splash معطّل عمدًا.",
    "دخولية صامتة: رمز ذهبي على #0E1A15 — راجع launch-splash-unified.test.ts.",
    "لتوليد أصول الرمز: python3 scripts/generate-silent-splash-assets.py",
  ].join("\n"),
);
process.exit(1);
