#!/usr/bin/env node
/**
 * حارس الهوية — يمنع رجوع الاسم التجاري القديم أو البريد الشخصي إلى نصوص المستخدم.
 * المصدر: site.config.json. يفشل بخروج غير صفري.
 */
import { readFile, readdir } from "node:fs/promises";
import { resolve, dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "..");
const config = JSON.parse(await readFile(resolve(appRoot, "site.config.json"), "utf8"));

/** أسماء عربية مشروعة لا علاقة لها بالعلامة: «مجالس العلم» بمعنى حِلَق العلم. */
const LEGITIMATE_ARABIC = [
  /مجالس العلم(?!ي)/, // «مجالس العلم» كمعنى لغوي — يُسمح بها في المحتوى الديني
  /المجالس العلمية/,
  /مجلس العلم /,
];

/** ملفات لا تُعرض للمستخدم: تعليقات CSS، بذور محتوى ديني، سكربتات خادمية. */
const SKIP_PATHS = [
  "/src/styles/",
  "/src/index.css",
  "/node_modules/",
  "/dist/",
  "/seo-prerender/",
  "/android/",
  "/ios/",
];

/** بذور المحتوى الديني: نصوص شرعية قد تحوي «مجالس العلم» بمعناها اللغوي. */
const CONTENT_SEEDS = /\/(src\/lib\/[a-z-]*seed|src\/data|src\/views\/(AdabTalabIlm|DuasQuran))/;

const UI_EXTENSIONS = new Set([".ts", ".tsx", ".json", ".html", ".plist", ".xml"]);

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (SKIP_PATHS.some((p) => full.includes(p))) continue;
    if (entry.isDirectory()) yield* walk(full);
    else if (UI_EXTENSIONS.has(extname(entry.name))) yield full;
  }
}

const failures = [];

for await (const file of walk(resolve(appRoot, "src"))) {
  const text = await readFile(file, "utf8");
  const rel = file.replace(appRoot + "/", "");
  const isContentSeed = CONTENT_SEEDS.test(file);

  text.split("\n").forEach((line, i) => {
    const at = `${rel}:${i + 1}`;

    // ١) بريد خارج النطاق الرسمي
    for (const domain of config.forbiddenEmailDomains) {
      if (line.includes(`@${domain}`)) {
        failures.push(`${at} — بريد شخصي/خارجي: @${domain}`);
      }
    }

    // ٢) اسم تجاري قديم — مع استثناء المعنى اللغوي في بذور المحتوى الديني
    for (const bad of config.forbiddenBrandNames) {
      if (!line.includes(bad)) continue;
      if (isContentSeed && LEGITIMATE_ARABIC.some((re) => re.test(line))) continue;
      failures.push(`${at} — اسم تجاري قديم: «${bad}»`);
    }
  });
}

// ٣) ملفات الجوال الأصلية — اسم التطبيق المعروض
const nativeChecks = [
  ["capacitor.config.ts", /appName:\s*"([^"]+)"/],
  ["android/app/src/main/res/values/strings.xml", /<string name="app_name">([^<]+)<\/string>/],
  ["ios/App/App/Info.plist", /<key>CFBundleDisplayName<\/key>\s*<string>([^<]+)<\/string>/],
];

for (const [rel, re] of nativeChecks) {
  let text;
  try {
    text = await readFile(resolve(appRoot, rel), "utf8");
  } catch {
    continue; // مجلدات الجوال قد لا تكون مولَّدة بعد
  }
  const found = text.match(re)?.[1];
  if (found && found !== config.siteName) {
    failures.push(`${rel} — اسم التطبيق «${found}» ولا يطابق «${config.siteName}»`);
  }
}

if (failures.length) {
  console.error(`✗ حارس الهوية: ${failures.length} مخالفة\n`);
  failures.forEach((f) => console.error("  " + f));
  process.exit(1);
}

console.log(`✓ حارس الهوية: الاسم «${config.siteName}» موحّد، ولا بريد شخصي في نصوص المستخدم.`);
