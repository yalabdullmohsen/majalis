#!/usr/bin/env node
/**
 * بوابة شريط أدوات المصحف عند عروض 320 / 390 / 430:
 * لا تجاوز، لا تراكب بين الأزرار أو مع رأس الجزء/الحزب، بلا نص مكسور.
 *
 *   MUSHAF_GATE_BASE_URL=http://127.0.0.1:24216 node scripts/quran-import/mushaf-toolbar-layout-gate.mjs
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "../..");
const BASE =
  process.env.MUSHAF_GATE_BASE_URL?.replace(/\/$/, "") ||
  "https://www.majlisilm.com";
const WIDTHS = (process.env.MUSHAF_TOOLBAR_WIDTHS || "320,390,430")
  .split(",")
  .map((s) => Number(s.trim()))
  .filter((n) => Number.isFinite(n) && n >= 280);
const OUT_DIR =
  process.env.MUSHAF_TOOLBAR_OUT_DIR ||
  join(ROOT, "../../.cursor/projects/Users-alabdullmohsen-majlis-app/artifacts/mushaf-toolbar-gate");

function overlaps(a, b, pad = 0.5) {
  return !(
    a.right <= b.left + pad ||
    a.left >= b.right - pad ||
    a.bottom <= b.top + pad ||
    a.top >= b.bottom - pad
  );
}

async function measureAtWidth(browser, width) {
  const context = await browser.newContext({
    viewport: { width, height: 844 },
    locale: "ar-SA",
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  const url = `${BASE}/mushaf/page/1`;
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForSelector(".mf2-page, .mpv-ayah-header", { timeout: 45_000 });
  await page.waitForTimeout(700);

  // إظهار الشريط (مخفي افتراضيًا)
  const body = page.locator(".mpv-body--ayah").first();
  if (await body.count()) {
    await body.click({ position: { x: 40, y: 120 } }).catch(() => {});
  }
  await page.waitForSelector(".mpv-toolbar--ayah:not(.mpv-toolbar--hidden)", { timeout: 8_000 });
  await page.waitForTimeout(250);

  const metrics = await page.evaluate(() => {
    const toolbar = document.querySelector(".mpv-toolbar.mpv-toolbar--ayah");
    const header = document.querySelector(".mpv-ayah-header");
    if (!toolbar || !header) return { error: "missing toolbar/header" };

    const tr = toolbar.getBoundingClientRect();
    const hr = header.getBoundingClientRect();
    const vw = window.innerWidth;

    const btnEls = [
      ...toolbar.querySelectorAll(":scope > .mpv-toolbar__btn, :scope > .mpv-toolbar__more > .mpv-toolbar__btn"),
    ];
    const buttons = btnEls.map((el) => {
      const r = el.getBoundingClientRect();
      const label = el.querySelector(".mpv-toolbar__label");
      const labelStyle = label ? getComputedStyle(label) : null;
      const labelHidden =
        !label ||
        labelStyle?.position === "absolute" ||
        (label.getBoundingClientRect().width < 2 && label.getBoundingClientRect().height < 2);
      const wrap =
        !labelHidden && label
          ? label.scrollHeight > label.clientHeight + 1 ||
            getComputedStyle(label).whiteSpace !== "nowrap"
          : false;
      const btnWrap =
        el.scrollHeight > el.clientHeight + 2 ||
        getComputedStyle(el).whiteSpace === "normal" ||
        getComputedStyle(el).whiteSpace === "pre-wrap";
      return {
        aria: el.getAttribute("aria-label") || "",
        left: r.left,
        right: r.right,
        top: r.top,
        bottom: r.bottom,
        width: r.width,
        height: r.height,
        wrap: wrap || btnWrap,
      };
    });

    return {
      vw,
      toolbar: { left: tr.left, right: tr.right, top: tr.top, bottom: tr.bottom, width: tr.width },
      header: { left: hr.left, right: hr.right, top: hr.top, bottom: hr.bottom },
      gapHeaderToolbar: tr.top - hr.bottom,
      overflowLeft: Math.max(0, -tr.left),
      overflowRight: Math.max(0, tr.right - vw),
      buttonCount: buttons.length,
      buttons,
    };
  });

  const shot = join(OUT_DIR, `toolbar-${width}.png`);
  await page.screenshot({ path: shot, fullPage: false });
  await context.close();

  const failures = [];
  if (metrics.error) {
    failures.push(metrics.error);
    return { width, shot, metrics, failures };
  }
  if (metrics.buttonCount > 5) {
    failures.push(`أكثر من 5 أزرار ظاهرة (${metrics.buttonCount})`);
  }
  if (metrics.buttonCount < 5) {
    failures.push(`أقل من 5 أزرار ظاهرة (${metrics.buttonCount}) — متوقع 4 + ⋯`);
  }
  if (metrics.overflowLeft > 1 || metrics.overflowRight > 1) {
    failures.push(
      `تجاوز أفقي L=${metrics.overflowLeft.toFixed(1)} R=${metrics.overflowRight.toFixed(1)}`,
    );
  }
  if (metrics.gapHeaderToolbar < 2) {
    failures.push(`تراكب/التصاق مع الرأس — الفجوة ${metrics.gapHeaderToolbar.toFixed(1)}px`);
  }
  if (overlaps(metrics.toolbar, metrics.header, 0.25)) {
    failures.push("تراكب هندسي بين الشريط ورأس الجزء/الحزب");
  }
  for (let i = 0; i < metrics.buttons.length; i++) {
    const a = metrics.buttons[i];
    if (a.wrap) failures.push(`نص مكسور/ملتّف في زر «${a.aria || i}»`);
    if (a.left < -1 || a.right > metrics.vw + 1) {
      failures.push(`زر «${a.aria || i}» خارج العرض`);
    }
    for (let j = i + 1; j < metrics.buttons.length; j++) {
      const b = metrics.buttons[j];
      if (overlaps(a, b, 0.5)) {
        failures.push(`تراكب أزرار: «${a.aria}» × «${b.aria}»`);
      }
    }
  }

  return { width, shot, metrics, failures };
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  console.log(`[mushaf-toolbar-gate] base=${BASE}`);
  console.log(`[mushaf-toolbar-gate] widths=${WIDTHS.join(",")}`);

  const browser = await chromium.launch({ headless: true });
  const results = [];
  try {
    for (const w of WIDTHS) {
      process.stdout.write(`  ${w}px… `);
      const r = await measureAtWidth(browser, w);
      results.push(r);
      console.log(r.failures.length ? `FAIL: ${r.failures.join("; ")}` : "OK");
    }
  } finally {
    await browser.close();
  }

  const allFail = results.flatMap((r) => r.failures.map((f) => ({ width: r.width, reason: f })));
  const report = {
    base: BASE,
    generatedAt: new Date().toISOString(),
    results,
    failures: allFail,
    ok: allFail.length === 0,
  };
  writeFileSync(join(OUT_DIR, "report.json"), JSON.stringify(report, null, 2), "utf8");

  if (allFail.length) {
    console.error("[mushaf-toolbar-gate] FAIL");
    for (const f of allFail) console.error(`  ${f.width}px: ${f.reason}`);
    process.exit(1);
  }
  console.log("[mushaf-toolbar-gate] OK");
}

main().catch((err) => {
  console.error("[mushaf-toolbar-gate] ERROR:", err?.message || err);
  process.exit(1);
});
