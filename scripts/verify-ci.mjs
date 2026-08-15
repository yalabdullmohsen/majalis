#!/usr/bin/env node
/**
 * verify:ci — بوابة محلية توازي فحوصات GitHub Actions الحرجة قبل الدفع/الـPR.
 *
 * تغطي ما يُغذّي Verify build: static-checks + build + repo-gates (بدون إضعاف).
 * لا تتخطّى فحوصات ولا تجعلها optional لإخفاء خطأ.
 *
 * الاستعمال (من جذر git فقط):
 *   cd "$(git rev-parse --show-toplevel)"
 *   pnpm run verify:ci
 *   pnpm run verify:ci -- --list
 *   pnpm run verify:ci -- --changed          # تضييق بوابات المصحف حسب diff
 *   pnpm run verify:ci -- --no-mushaf
 *   pnpm run verify:ci -- --ui               # + color contrast / on-brand
 *   pnpm run verify:ci -- --native           # + تأكيد مسارات Capacitor iOS
 *
 * عند الفشل: لا commit ولا push — أصلح السبب وأعد التشغيل.
 */
import { spawn, execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { cpus } from "node:os";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const MAJALIS = resolve(ROOT, "artifacts/majalis");
const IOS_APP = resolve(MAJALIS, "ios/App");
const PBX = resolve(IOS_APP, "App.xcodeproj/project.pbxproj");
const WORKSPACE = resolve(IOS_APP, "App.xcworkspace/contents.xcworkspacedata");

const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const LIST_ONLY = has("--list");
const NO_MUSHAF = has("--no-mushaf");
const FROM_DIFF = has("--changed");
const WITH_UI = has("--ui");
const WITH_NATIVE = has("--native");

const PR_MUSHAF_PAGES = "1,2,3,4,283,600";
const PR_MUSHAF_VIEWPORT = "390x844";

const c = {
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
};

function die(msg, code = 2) {
  console.error(c.red(msg));
  process.exit(code);
}

function preflight() {
  if (!existsSync(resolve(ROOT, "package.json"))) {
    die("package.json مفقود — شغّل من جذر git: cd \"$(git rev-parse --show-toplevel)\"");
  }
  if (!existsSync(resolve(ROOT, "pnpm-workspace.yaml"))) {
    die("pnpm-workspace.yaml مفقود — هذا ليس جذر الـ monorepo.");
  }
  if (!existsSync(MAJALIS)) {
    die(`لم يُعثر على ${MAJALIS}`);
  }
  try {
    const top = execFileSync("git", ["rev-parse", "--show-toplevel"], {
      cwd: ROOT,
      encoding: "utf8",
    }).trim();
    if (resolve(top) !== ROOT) {
      die(`جذر git الفعلي ${top} ≠ مجلد السكربت ${ROOT}`);
    }
  } catch {
    die("git rev-parse فشل — تأكد أنك داخل مستودع.");
  }
}

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
    return null;
  }
}

function needsMushaf(paths) {
  if (!paths) return true;
  const re =
    /(src\/features\/mushaf|src\/components\/quran\/|scripts\/quran-import\/|public\/fonts\/qpc|public\/data\/quran|src\/lib\/quran)/;
  return paths.some((p) => re.test(p));
}

function needsUi(paths) {
  if (WITH_UI) return true;
  if (!paths) return false;
  return paths.some((p) =>
    /\.(css|scss)$|src\/(pages|components|styles)\//.test(p),
  );
}

function needsNative(paths) {
  if (WITH_NATIVE) return true;
  if (!paths) return false;
  return paths.some((p) =>
    /artifacts\/majalis\/(ios|android)\//.test(p) ||
    /capacitor\.config/.test(p),
  );
}

const paths = FROM_DIFF ? changedPaths() : null;
const runMushaf = !NO_MUSHAF && needsMushaf(paths);
const runUi = needsUi(paths);
const runNative = needsNative(paths);

/** موجات متسلسلة؛ داخل الموجة خطوات متوازية. */
const waves = [
  {
    title: "٠/٥ تمهيد مسارات (لا يُضعف الفحص)",
    steps: [
      {
        name: "paths exist",
        cmd: "node",
        args: [
          "-e",
          [
            `const fs=require('fs');`,
            `const ok=p=>fs.existsSync(p);`,
            `if(!ok(${JSON.stringify(resolve(ROOT, "package.json"))})) process.exit(1);`,
            `if(!ok(${JSON.stringify(MAJALIS)})) process.exit(1);`,
            `console.log('ok');`,
          ].join(""),
        ],
      },
    ],
  },
  {
    title: "١/٥ static-checks (متوازية)",
    steps: [
      { name: "typecheck", cmd: "pnpm", args: ["run", "typecheck"] },
      {
        name: "lint",
        cmd: "pnpm",
        args: [
          "--filter",
          "@workspace/majalis",
          "exec",
          "eslint",
          "src",
          "lib",
          "--max-warnings=0",
        ],
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
    title: "٢/٥ repo-gates (متوازية)",
    steps: [
      { name: "auto-merge safety", cmd: "pnpm", args: ["run", "verify:no-unsafe-auto-merge"] },
      { name: "release-train", cmd: "pnpm", args: ["run", "test:release-train"] },
      { name: "safe-auto-merge", cmd: "pnpm", args: ["run", "test:safe-auto-merge"] },
      { name: "no runtime DDL", cmd: "pnpm", args: ["run", "verify:no-runtime-ddl"] },
      { name: "single-response", cmd: "pnpm", args: ["run", "verify:single-response"] },
      {
        name: "platform-hardening-sql",
        cmd: "pnpm",
        args: ["run", "verify:platform-hardening-sql"],
      },
      {
        name: "schema drift",
        cmd: "node",
        args: ["scripts/verify-schema-drift-expectations.mjs"],
      },
      {
        name: "shell/meta gates",
        cmd: "bash",
        args: [
          "-c",
          [
            "verify:head-shell-gate",
            "verify:pageshell-gate",
            "verify:body-meta-gate",
            "verify:orphan-discovery",
            "verify:no-autofocus",
            "verify:methodology-prerender",
            "verify:related-dedupe",
          ]
            .map((s) => `pnpm --filter @workspace/majalis run ${s}`)
            .join(" && "),
        ],
      },
      {
        name: "unit tests (test:ci-unit)",
        cmd: "pnpm",
        args: ["--filter", "@workspace/majalis", "run", "test:ci-unit"],
      },
    ],
  },
  {
    title: "٣/٥ build + نظافة الشجرة",
    steps: [
      {
        name: "build",
        cmd: "pnpm",
        args: ["--filter", "@workspace/majalis", "run", "build"],
        env: { PORT: process.env.PORT || "24216", BASE_PATH: process.env.BASE_PATH || "/" },
      },
    ],
  },
  {
    title: "٤/٥ بعد البناء",
    steps: [
      {
        name: "build must not dirty tree",
        cmd: "node",
        args: [
          "-e",
          `
const { execFileSync } = require('node:child_process');
const before = process.env.VERIFY_CI_PORCELAIN_BEFORE || '';
const after = execFileSync('git', ['status', '--porcelain'], {
  cwd: process.cwd(),
  encoding: 'utf8',
});
const beforeSet = new Set(before.split('\\n').filter(Boolean));
const afterLines = after.split('\\n').filter(Boolean);
const introduced = afterLines.filter((l) => !beforeSet.has(l));
if (introduced.length) {
  console.error('build أضاف تغيّرات غير متوقعة إلى الشجرة:');
  for (const l of introduced) console.error(' ', l);
  process.exit(1);
}
if (!before.trim()) {
  execFileSync('git', ['diff', '--exit-code'], { cwd: process.cwd(), stdio: 'inherit' });
}
console.log('tree clean for build artifacts');
`,
        ],
      },
      {
        name: "verify:deploy",
        cmd: "pnpm",
        args: ["--filter", "@workspace/majalis", "run", "verify:deploy"],
      },
      {
        name: "bundle budget",
        cmd: "pnpm",
        args: ["--filter", "@workspace/majalis", "run", "test:bundle-budget"],
      },
    ],
  },
];

if (runUi) {
  waves.push({
    title: "٥أ/٥ فحوص UI (تباين)",
    steps: [
      {
        name: "on-brand contrast",
        cmd: "pnpm",
        args: ["--filter", "@workspace/majalis", "run", "test:on-brand-contrast"],
      },
      {
        name: "on-dark text tokens",
        cmd: "pnpm",
        args: ["--filter", "@workspace/majalis", "run", "test:on-dark-text-tokens"],
      },
    ],
  });
}

if (runNative) {
  waves.push({
    title: "٥ب/٥ فحوص native (وجود مسارات — بلا xcodebuild)",
    steps: [
      {
        name: "ios project files",
        cmd: "node",
        args: [
          "-e",
          [
            `const fs=require('fs');`,
            `const app=${JSON.stringify(IOS_APP)};`,
            `const pbx=${JSON.stringify(PBX)};`,
            `if(!fs.existsSync(app)) { console.error('missing ios/App'); process.exit(1); }`,
            `if(!fs.existsSync(pbx)) { console.error('missing project.pbxproj'); process.exit(1); }`,
            `const ws=${JSON.stringify(WORKSPACE)};`,
            `if(!fs.existsSync(ws)) console.warn('warn: xcworkspace missing (قد يُنشأ لاحقاً)');`,
            `console.log('ios paths ok');`,
          ].join(""),
        ],
      },
      {
        name: "ios notifications gate",
        cmd: "pnpm",
        args: ["--filter", "@workspace/majalis", "run", "test:ios-notifications"],
      },
      {
        name: "adhan bundle resources",
        cmd: "pnpm",
        args: ["--filter", "@workspace/majalis", "run", "test:adhan-bundle-sounds"],
      },
    ],
  });
}

if (runMushaf) {
  waves.push({
    title: `٥ج/٥ بوابات المصحف — صفحات ${PR_MUSHAF_PAGES}`,
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

preflight();

let porcelainBeforeBuild = "";
try {
  porcelainBeforeBuild = execFileSync("git", ["status", "--porcelain"], {
    cwd: ROOT,
    encoding: "utf8",
  });
} catch {
  porcelainBeforeBuild = "";
}

const t0 = Date.now();
const failures = [];

console.log(c.bold("\nverify:ci — بوابة محلية ≈ GitHub CI (قبل الدفع)"));
console.log(c.dim(`جذر: ${ROOT}`));
console.log(
  c.dim(
    `أنوية: ${cpus().length} · mushaf=${runMushaf ? "نعم" : "لا"} · ui=${runUi ? "نعم" : "لا"} · native=${runNative ? "نعم" : "لا"}`,
  ),
);
if (paths) console.log(c.dim(`ملفات متغيّرة: ${paths.length}`));
console.log(
  c.yellow(
    "قاعدة: لا commit/push عند الفشل · لا تعطيل فحوصات · أصلح السبب الجذري.",
  ),
);

for (const wave of waves) {
  console.log(`\n${c.bold(wave.title)}`);
  if (!wave.steps.length) {
    console.log(c.dim("  (لا خطوات)"));
    continue;
  }
  if (LIST_ONLY) {
    for (const s of wave.steps) {
      console.log(c.dim(`  · ${s.name}: ${s.cmd} ${s.args.join(" ")}`));
    }
    continue;
  }
  // التقط حالة الشجرة قبل البناء لمقارنة «تلوّث البناء»
  if (wave.title.startsWith("٣/٥")) {
    try {
      porcelainBeforeBuild = execFileSync("git", ["status", "--porcelain"], {
        cwd: ROOT,
        encoding: "utf8",
      });
    } catch {
      porcelainBeforeBuild = "";
    }
  }
  const results = await Promise.all(
    wave.steps.map((step) =>
      run({
        ...step,
        env: {
          ...(step.env || {}),
          ...(wave.title.startsWith("٤/٥")
            ? { VERIFY_CI_PORCELAIN_BEFORE: porcelainBeforeBuild }
            : {}),
        },
      }),
    ),
  );
  for (const r of results) {
    const secs = (r.ms / 1000).toFixed(1);
    if (r.code === 0) {
      console.log(`  ${c.green("✓")} ${r.name} ${c.dim(`${secs}s`)}`);
    } else {
      console.log(`  ${c.red("✗")} ${r.name} ${c.dim(`${secs}s (exit ${r.code})`)}`);
      failures.push(r);
    }
  }
  if (failures.length) break;
}

if (LIST_ONLY) {
  console.log(c.green("\n✓ verify:ci --list"));
  process.exit(0);
}

const total = ((Date.now() - t0) / 1000).toFixed(1);
console.log("");
if (failures.length) {
  for (const f of failures) {
    console.log(c.red(`\n──── مخرجات ${f.name} ────`));
    console.log(f.out.trimEnd().split("\n").slice(-80).join("\n"));
  }
  console.log(
    c.red(`\n✗ verify:ci فشلت (${failures.length}) في ${total}s — ممنوع الدفع.`),
  );
  process.exit(1);
}
console.log(
  c.green(
    `✓ verify:ci نجحت في ${total}s — جاهز للدفع ثم مراقبة: gh pr checks --watch --fail-fast`,
  ),
);
