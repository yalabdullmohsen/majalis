#!/usr/bin/env node
/**
 * generate-splash.mjs — مقفل.
 * الدخولية المعتمدة: #mj-launch-splash في index.html فقط («رفيقك في العلم والعمل»).
 * لا توليد splash.png / apple-splash / LaunchMark / silent-splash.
 */
console.error(
  [
    "assets:splash معطّل عمدًا.",
    "دخولية واحدة: index.html #mj-launch-splash — راجع launch-splash-unified.test.ts.",
  ].join("\n"),
);
process.exit(1);
