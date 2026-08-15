#!/usr/bin/env node
/**
 * verify:pr — بوابة ما قبل الدفع المحلية (مسار سريع).
 * للبوابة الكاملة الموازية لـ CI استخدم: pnpm run verify:ci
 *
 * تشغّل *نفس* فحوص مسار PR السريع في CI على الجهاز، بترتيب يوازي ما يُوازى
 * في CI. القاعدة: لا يُدفع فرع قبل نجاح verify:ci (أو verify:pr كحد أدنى).
 *
 * الاستعمال:
 *   pnpm run verify:pr                # المسار السريع كاملًا
 *   pnpm run verify:pr -- --no-mushaf # بلا بوابات المصحف (تعديل لا يمسّ المصحف)
 *   pnpm run verify:pr -- --changed    # يستنبط ما يلزم من git diff مقابل main
 *   pnpm run verify:pr -- --list       # اطبع الخطوات ولا تشغّل
 */
import { spawn } from "node:child_process";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { cpus } from "node:os";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const MAJALIS = resolve(ROOT, "artifacts/majalis");

const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const LIST_ONLY = has("--list");
const NO_MUSHAF = has("--no-mushaf");
const FROM_DIFF = has("--changed");

/** صفحات مرجعية — يجب أن تطابق PR_MUSHAF_PAGES في .github/workflows/ci.yml */
const PR_MUSHAF_PAGES = "1,2,3,4,283,600";
const PR_MUSHAF_VIEWPORT = "390x844";

const c = {
  dim: (s) => `[2m${s}[0m`,
  red: (s) => `[31m${s}[0m`,
  green: (s) => `[32m${s}[0m`,
  yellow: (s) => `[33m${s}[0m`,
  bold: (s) => `[1m${s}[0m`,
};

function changedPaths() {
  try {
    const base = execFileSync("git", ["merge-base", "HEAD", "origin/main"], {
      cwd: ROOT,
      encoding: "utf8",
    }).trim();
    const out = execFileSync("git", ["diff", "--name-only", `${base}...HEAD`], {
      cwd: ROOT,
      encoding: "utf8",
    });
    const staged = execFileSync("git", ["diff", "--name-only", "HEAD"], {
      cwd: ROOT,
      encoding: "utf8",
    });
    return [...out.split("\n"), ...staged.split("\n")].filter(Boolean);
  } catch {
    return null; // لا معلومات → لا تُضيّق النطاق
  }
}

/** خريطة المسارات ← البوابات. مصدر واحد يوازي .github/scripts/ci/emit-path-lane.mjs */
function needsMushaf(paths) {
  if (!paths) return true;
  const re =
    /(src\/features\/mushaf\/|src\/components\/quran\/|scripts\/quran-import\/|public\/fonts\/qpc|public\/data\/quran|src\/lib\/quran)/;
  return paths.some((p) => re.test(p));
}

const paths = FROM_DIFF ? changedPaths() : null;
const runMushaf = !NO_MUSHAF && needsMushaf(paths);

/**
 * موجة = مجموعة خطوات تعمل بالتوازي. الموجات متسلسلة.
 * cwd افتراضيًا جذر المستودع.
 */
const waves = [
  {
    title: "١/٤ فحوص ثابتة (متوازية)",
    steps: [
      { name: "typecheck", cmd: "pnpm", args: ["run", "typecheck"] },
      {
        name: "lint",
        cmd: "pnpm",
        args: ["--filter", "@workspace/majalis", "exec", "eslint", "src", "lib", "--max-warnings=0"],
      },
      {
        name: "generated --check",
        cmd: "bash",
        args: [
          "-c",
          "pnpm --filter @workspace/majalis exec node --import tsx scripts/generate-content-counts.ts --check && " +
            "pnpm --filter @workspace/majalis exec node scripts/generate-quran-pages-manifest.mjs --check",
        ],
      },
    ],
  },
  {
    title: "٢/٤ بوابات المستودع (متوازية)",
    steps: [
      { name: "auto-merge safety", cmd: "pnpm", args: ["run", "verify:no-unsafe-auto-merge"] },
      { name: "no runtime DDL", cmd: "pnpm", args: ["run", "verify:no-runtime-ddl"] },
      {
        name: "shell/meta gates",
        cmd: "bash",
        args: [
          "-c",
          [
            "verify:head-shell-gate",
            "verify:pageshell-gate",
            "verify:body-meta-gate",
            "verify:no-autofocus",
          ]
            .map((s) => `pnpm --filter @workspace/majalis run ${s}`)
            .join(" && "),
        ],
      },
      { name: "unit tests", cmd: "pnpm", args: ["--filter", "@workspace/majalis", "run", "test:ci-unit"] },
    ],
  },
  {
    title: "٣/٤ بناء واحد (نفس ما يبنيه CI مرة واحدة)",
    steps: [{ name: "build", cmd: "pnpm", args: ["--filter", "@workspace/majalis", "run", "build"] }],
  },
];

if (runMushaf) {
  waves.push({
    title: `٤/٤ بوابات المصحف — صفحات ${PR_MUSHAF_PAGES} × ${PR_MUSHAF_VIEWPORT}`,
    steps: [
      {
        name: "mushaf measure+assert",
        cmd: "bash",
        args: [
          "-c",
          "pnpm run test:mushaf-single-pass:measure && pnpm run test:mushaf-single-pass:assert",
        ],
        cwd: MAJALIS,
        env: {
          MUSHAF_GATE_FULL: "0",
          MUSHAF_GATE_PAGES: PR_MUSHAF_PAGES,
          MUSHAF_GATE_VIEWPORT: PR_MUSHAF_VIEWPORT,
          MUSHAF_GATE_USE_PREVIEW: "1",
          MUSHAF_SINGLE_PASS_OUT: "artifacts/mushaf-single-pass/measurements-local.json",
        },
      },
      {
        name: "mushaf unit gates",
        cmd: "pnpm",
        args: ["--filter", "@workspace/majalis", "run", "test:mushaf-gates:unit"],
      },
    ],
  });
} else {
  waves.push({
    title: "٤/٤ بوابات المصحف — متخطّاة (لا تعديل يمسّ المصحف)",
    steps: [],
  });
}

function run(step) {
  return new Promise((done) => {
    const t0 = Date.now();
    const p = spawn(step.cmd, step.args, {
      cwd: step.cwd || ROOT,
      env: { ...process.env, ...(step.env || {}), FORCE_COLOR: "1" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let out = "";
    p.stdout.on("data", (d) => (out += d));
    p.stderr.on("data", (d) => (out += d));
    p.on("close", (code) => {
      done({ ...step, code, ms: Date.now() - t0, out });
    });
  });
}

const t0 = Date.now();
const failures = [];

console.log(c.bold("\nverify:pr — بوابة ما قبل الدفع"));
console.log(c.dim(`جذر: ${ROOT}`));
console.log(c.dim(`أنوية: ${cpus().length} · بوابات المصحف: ${runMushaf ? "نعم" : "لا"}`));
if (paths) console.log(c.dim(`ملفات متغيّرة: ${paths.length}`));

if (!existsSync(MAJALIS)) {
  console.error(c.red(`لم يُعثر على ${MAJALIS}`));
  process.exit(2);
}

for (const wave of waves) {
  console.log(`\n${c.bold(wave.title)}`);
  if (!wave.steps.length) {
    console.log(c.dim("  (لا خطوات)"));
    continue;
  }
  if (LIST_ONLY) {
    for (const s of wave.steps) console.log(c.dim(`  · ${s.name}: ${s.cmd} ${s.args.join(" ")}`));
    continue;
  }
  const results = await Promise.all(wave.steps.map(run));
  for (const r of results) {
    const secs = (r.ms / 1000).toFixed(1);
    if (r.code === 0) {
      console.log(`  ${c.green("✓")} ${r.name} ${c.dim(`${secs}s`)}`);
    } else {
      console.log(`  ${c.red("✗")} ${r.name} ${c.dim(`${secs}s (exit ${r.code})`)}`);
      failures.push(r);
    }
  }
  // موجة فاشلة تُوقف الموجات التالية — لا معنى لقياس المصحف على بناء فاشل.
  if (failures.length) break;
}

if (LIST_ONLY) process.exit(0);

const total = ((Date.now() - t0) / 1000).toFixed(1);
console.log("");
if (failures.length) {
  for (const f of failures) {
    console.log(c.red(`\n──── مخرجات ${f.name} ────`));
    console.log(f.out.trimEnd().split("\n").slice(-60).join("\n"));
  }
  console.log(c.red(`\n✗ verify:pr فشلت (${failures.length}) في ${total}s — لا تدفع.`));
  process.exit(1);
}
console.log(c.green(`✓ verify:pr نجحت في ${total}s — الفرع جاهز للدفع.`));
