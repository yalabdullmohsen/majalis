#!/usr/bin/env node
/**
 * generate-splash.mjs
 *
 * يولّد أصول شاشة الدخول من مصدر واحد دون تمديد الصورة على الشاشة:
 *   public/brand/splash-source.png  → لون حافة + شعار شفاف + مقاسات Apple/Capacitor/PWA
 *
 * تشغيل: pnpm run assets:splash
 */
import { mkdirSync, writeFileSync, readFileSync, existsSync, copyFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SOURCE = join(ROOT, "public/brand/splash-source.png");
const BRAND_DIR = join(ROOT, "public/brand");
const APPLE_DIR = join(BRAND_DIR, "apple-splash");
const ASSETS_DIR = join(ROOT, "assets");

if (!existsSync(SOURCE)) {
  console.error(`❌ المصدر غير موجود: ${SOURCE}`);
  console.error("ضع splash-source.png ثم أعد التشغيل.");
  process.exit(1);
}

mkdirSync(BRAND_DIR, { recursive: true });
mkdirSync(APPLE_DIR, { recursive: true });
mkdirSync(ASSETS_DIR, { recursive: true });

function toHex({ r, g, b }) {
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

function colorDist(a, b) {
  return Math.abs(a.r - b.r) + Math.abs(a.g - b.g) + Math.abs(a.b - b.b);
}

/** متوسط بكسلات إطار الحافة (8px) → لون خلفية صلب */
async function extractEdgeColor(img) {
  const { data, info } = await img
    .clone()
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels: c } = info;
  const border = Math.max(4, Math.min(12, Math.floor(Math.min(w, h) * 0.02)));
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  const sample = (x, y) => {
    const i = (y * w + x) * c;
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
    n += 1;
  };
  for (let x = 0; x < w; x++) {
    for (let t = 0; t < border; t++) {
      sample(x, t);
      sample(x, h - 1 - t);
    }
  }
  for (let y = border; y < h - border; y++) {
    for (let t = 0; t < border; t++) {
      sample(t, y);
      sample(w - 1 - t, y);
    }
  }
  return {
    r: Math.round(r / n),
    g: Math.round(g / n),
    b: Math.round(b / n),
  };
}

/**
 * يستخرج البادج: يجعل بكسلات قريبة من لون الحافة شفافة،
 * ثم يقتصّ المحتوى غير الشفاف مع هامش صغير.
 */
async function extractLogoTransparent(srcPath, bg) {
  const { data, info } = await sharp(srcPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels: c } = info;
  const out = Buffer.from(data);
  const threshold = 42;

  let minX = w;
  let minY = h;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * c;
      const px = { r: out[i], g: out[i + 1], b: out[i + 2] };
      if (colorDist(px, bg) <= threshold) {
        out[i + 3] = 0;
      } else {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  // إن فشل الفصل (صورة ممتلئة بالبادج)، أبقِ المصدر كاملاً بزوايا شفافة خفيفة فقط
  if (maxX <= minX || maxY <= minY) {
    minX = 0;
    minY = 0;
    maxX = w - 1;
    maxY = h - 1;
  }

  const pad = Math.round(Math.min(w, h) * 0.04);
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(w - 1, maxX + pad);
  maxY = Math.min(h - 1, maxY + pad);

  const cropW = maxX - minX + 1;
  const cropH = maxY - minY + 1;

  return sharp(out, { raw: { width: w, height: h, channels: 4 } })
    .extract({ left: minX, top: minY, width: cropW, height: cropH })
    .png()
    .toBuffer();
}

/**
 * لوحة الإطلاق: غطاء كامل من splash-source (خلفية خضراء + زخرفة إسلامية + شعار).
 * لوحة ألوان PNG لتقليل الحجم مع الحفاظ على الزخرفة الهندسية.
 */
async function composeSplash(_logoBuf, bg, width, height) {
  const cover = await sharp(SOURCE)
    .resize(width, height, { fit: "cover", position: "centre" })
    .png()
    .toBuffer();
  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: bg,
    },
  })
    .composite([{ input: cover, left: 0, top: 0 }])
    .png({
      compressionLevel: 9,
      adaptiveFiltering: true,
      palette: true,
      colors: 96,
      dither: 0.5,
    })
    .toBuffer();
}

/** أيقونة التطبيق 1024×1024 — شعار على خلفية صلبة بلا شفافية */
async function composeAppIcon(logoBuf, bg, size = 1024) {
  const meta = await sharp(logoBuf).metadata();
  const max = Math.floor(size * 0.72);
  const scale = Math.min(max / (meta.width || 1), max / (meta.height || 1), 1);
  const lw = Math.max(1, Math.round((meta.width || 1) * scale));
  const lh = Math.max(1, Math.round((meta.height || 1) * scale));
  const resized = await sharp(logoBuf).resize(lw, lh, { fit: "inside" }).png().toBuffer();
  return sharp({
    create: { width: size, height: size, channels: 3, background: bg },
  })
    .composite([
      {
        input: resized,
        left: Math.round((size - lw) / 2),
        top: Math.round((size - lh) / 2),
      },
    ])
    .flatten({ background: bg })
    .removeAlpha()
    .png()
    .toBuffer();
}

const APPLE_SPLASHES = [
  { w: 1290, h: 2796, file: "iPhone_15_Pro_Max__iPhone_15_Plus__iPhone_14_Pro_Max.png", media: "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)" },
  { w: 1179, h: 2556, file: "iPhone_15_Pro__iPhone_15__iPhone_14_Pro.png", media: "(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)" },
  { w: 1170, h: 2532, file: "iPhone_14__iPhone_13_Pro__iPhone_13__iPhone_12_Pro__iPhone_12.png", media: "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)" },
  { w: 1284, h: 2778, file: "iPhone_13_Pro_Max__iPhone_12_Pro_Max.png", media: "(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)" },
  { w: 1125, h: 2436, file: "iPhone_X__iPhone_11_Pro.png", media: "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)" },
  { w: 1242, h: 2688, file: "iPhone_11_Pro_Max__iPhone_XS_Max.png", media: "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)" },
  { w: 828, h: 1792, file: "iPhone_11__iPhone_XR.png", media: "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)" },
  { w: 750, h: 1334, file: "iPhone_8__iPhone_7__iPhone_6s.png", media: "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)" },
  { w: 1242, h: 2208, file: "iPhone_8_Plus__iPhone_7_Plus.png", media: "(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)" },
  { w: 1668, h: 2388, file: "iPad_Pro_11.png", media: "(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2)" },
  { w: 2048, h: 2732, file: "iPad_Pro_12.9.png", media: "(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)" },
];

function patchToken(filePath, token, value) {
  if (!existsSync(filePath)) return false;
  const src = readFileSync(filePath, "utf8");
  if (!src.includes(token)) return false;
  // استبدل كل القيم المجاورة للرمز إن وُجد نمط مألوف، وإلا أبقِ الرمز كقيمة
  const next = src.split(token).join(value);
  writeFileSync(filePath, next);
  return true;
}

function ensureToken(filePath, findRe, replacementWithToken) {
  if (!existsSync(filePath)) return;
  let src = readFileSync(filePath, "utf8");
  if (src.includes("__MJ_SPLASH_BG__")) return;
  if (findRe.test(src)) {
    src = src.replace(findRe, replacementWithToken);
    writeFileSync(filePath, src);
  }
}

async function main() {
  const img = sharp(SOURCE);
  const bg = await extractEdgeColor(img);
  const bgHex = toHex(bg);
  console.log(`✓ لون الحافة المستخرج: ${bgHex}`);

  const logoBuf = await extractLogoTransparent(SOURCE, bg);
  const logoPath = join(BRAND_DIR, "splash-logo.png");
  await sharp(logoBuf).png().toFile(logoPath);
  const logoMeta = await sharp(logoPath).metadata();
  console.log(`✓ splash-logo.png ${logoMeta.width}×${logoMeta.height}`);

  // أيقونات PWA / المتجر — شعار على خلفية صلبة بلا شفافية (لا غطاء كامل)
  for (const size of [192, 512, 1024]) {
    const icon = await composeAppIcon(logoBuf, bg, size);
    if (size === 1024) {
      await sharp(icon).png().toFile(join(BRAND_DIR, "icon-1024.png"));
      await sharp(icon).png().toFile(join(BRAND_DIR, "icon-1024-maskable.png"));
    } else {
      await sharp(icon).png().toFile(join(ROOT, `public/icon-${size}.png`));
    }
  }
  {
    const icon512 = await composeAppIcon(logoBuf, bg, 512);
    await sharp(icon512).png().toFile(join(BRAND_DIR, "icon-512-maskable.png"));
  }
  // iOS AppIcon (1024) — بلا شفافية
  const iosIconDir = join(ROOT, "ios/App/App/Assets.xcassets/AppIcon.appiconset");
  if (existsSync(iosIconDir)) {
    const icon1024 = await composeAppIcon(logoBuf, bg, 1024);
    await sharp(icon1024).png().toFile(join(iosIconDir, "AppIcon-512@2x.png"));
    console.log("✓ iOS AppIcon 1024");
  }
  // Android mipmap launcher — حدّث foreground/background عبر أيقونة صلبة في drawable إن لزم
  console.log("✓ icon-192 / icon-512 / icon-1024");

  // Apple startup images
  const appleLinks = [];
  for (const s of APPLE_SPLASHES) {
    const buf = await composeSplash(logoBuf, bg, s.w, s.h);
    const out = join(APPLE_DIR, s.file);
    await sharp(buf).png().toFile(out);
    appleLinks.push(
      `<link rel="apple-touch-startup-image" media="${s.media}" href="/brand/apple-splash/${s.file}" />`,
    );
  }
  writeFileSync(join(APPLE_DIR, "links.html"), appleLinks.join("\n") + "\n");
  console.log(`✓ ${APPLE_SPLASHES.length} صورة apple-touch-startup-image`);

  // Capacitor @capacitor/assets مدخلات
  const splash2732 = await composeSplash(logoBuf, bg, 2732, 2732);
  await sharp(splash2732).png().toFile(join(ASSETS_DIR, "splash.png"));
  const icon1024Assets = await composeAppIcon(logoBuf, bg, 1024);
  await sharp(icon1024Assets).png().toFile(join(ASSETS_DIR, "logo.png"));
  await sharp(icon1024Assets).png().toFile(join(ASSETS_DIR, "icon-only.png"));
  await sharp(logoBuf).resize(1024, 1024, { fit: "inside" }).png().toFile(join(ASSETS_DIR, "splash-icon.png"));
  console.log("✓ assets/splash.png + logo.png + icon-only.png");

  // Android drawable splash (center-inside composition)
  const androidSizes = [
    { dir: "drawable-port-mdpi", w: 320, h: 480 },
    { dir: "drawable-port-hdpi", w: 480, h: 800 },
    { dir: "drawable-port-xhdpi", w: 720, h: 1280 },
    { dir: "drawable-port-xxhdpi", w: 1080, h: 1920 },
    { dir: "drawable-port-xxxhdpi", w: 1440, h: 2560 },
    { dir: "drawable-land-mdpi", w: 480, h: 320 },
    { dir: "drawable-land-hdpi", w: 800, h: 480 },
    { dir: "drawable-land-xhdpi", w: 1280, h: 720 },
    { dir: "drawable-land-xxhdpi", w: 1920, h: 1080 },
    { dir: "drawable-land-xxxhdpi", w: 2560, h: 1440 },
  ];
  for (const s of androidSizes) {
    const dir = join(ROOT, "android/app/src/main/res", s.dir);
    if (!existsSync(dir)) continue;
    const buf = await composeSplash(logoBuf, bg, s.w, s.h);
    await sharp(buf).png().toFile(join(dir, "splash.png"));
  }
  // drawable/splash.png العام
  {
    const dir = join(ROOT, "android/app/src/main/res/drawable");
    if (existsSync(dir)) {
      await sharp(await composeSplash(logoBuf, bg, 1080, 1920)).png().toFile(join(dir, "splash.png"));
    }
  }
  console.log("✓ Android splash drawables");

  // iOS Splash.imageset — تركيب غير ممتد
  const iosSplashDir = join(ROOT, "ios/App/App/Assets.xcassets/Splash.imageset");
  if (existsSync(iosSplashDir)) {
    // مقاسات أقل تكرارًا: 1x مربّع + 2x/3x مشتركان + نسخ dark مطابقة
    const buf1 = await composeSplash(logoBuf, bg, 1366, 1366);
    const buf2 = await composeSplash(logoBuf, bg, 2048, 2048);
    const named = [
      ["Default@1x~universal~anyany.png", buf1],
      ["Default@2x~universal~anyany.png", buf2],
      ["Default@3x~universal~anyany.png", buf2],
      ["Default@1x~universal~anyany-dark.png", buf1],
      ["Default@2x~universal~anyany-dark.png", buf2],
      ["Default@3x~universal~anyany-dark.png", buf2],
      ["splash-2732x2732.png", buf2],
      ["splash-2732x2732-1.png", buf2],
      ["splash-2732x2732-2.png", buf2],
    ];
    for (const [name, buf] of named) {
      await sharp(buf).png({ compressionLevel: 9, palette: true, colors: 96 }).toFile(join(iosSplashDir, name));
    }
    console.log("✓ iOS Splash.imageset");
  }

  // meta + links snippet
  const meta = {
    backgroundColor: bgHex,
    backgroundRgb: bg,
    source: "public/brand/splash-source.png",
    logo: "public/brand/splash-logo.png",
    logoSize: { width: logoMeta.width, height: logoMeta.height },
    generatedAt: new Date().toISOString(),
  };
  writeFileSync(join(BRAND_DIR, "splash-meta.json"), JSON.stringify(meta, null, 2) + "\n");
  // لون WebView فقط — بلا شاشة ويب وسيطة تكرر الشعار (الإطلاق = أصلي فقط)
  writeFileSync(
    join(BRAND_DIR, "splash-boot.css"),
    `/* مولَّد بواسطة scripts/generate-splash.mjs — لا تعدّل يدوياً */\n` +
      `html, body {\n` +
      `  background-color: ${bgHex};\n` +
      `}\n` +
      `:root {\n` +
      `  --mj-splash-bg: ${bgHex};\n` +
      `}\n`,
  );

  // حقن/تحديث اللون دائماً (رمز أو قيمة سابقة)
  const colorTargets = [
    {
      file: join(ROOT, "capacitor.config.ts"),
      patterns: [
        [/backgroundColor:\s*"[#_][^"]*"/g, `backgroundColor: "${bgHex}"`],
      ],
    },
    {
      file: join(ROOT, "capacitor.config.json"),
      patterns: [
        [/"backgroundColor":\s*"[#_][^"]*"/g, `"backgroundColor": "${bgHex}"`],
      ],
    },
    {
      file: join(ROOT, "public/manifest.json"),
      patterns: [
        [/"background_color":\s*"[#_][^"]*"/g, `"background_color": "${bgHex}"`],
        // theme_color = هوية الواجهة (#1F7A5A) — لا يُستبدل بلون شاشة الدخول
      ],
    },
    {
      file: join(ROOT, "public/manifest.webmanifest"),
      patterns: [
        [/"background_color":\s*"[#_][^"]*"/g, `"background_color": "${bgHex}"`],
      ],
    },
    {
      file: join(ROOT, "public/site.webmanifest"),
      patterns: [
        [/"background_color":\s*"[#_][^"]*"/g, `"background_color": "${bgHex}"`],
      ],
    },
    {
      file: join(ROOT, "index.html"),
      patterns: [
        [/content="__MJ_SPLASH_BG__"/g, `content="${bgHex}"`],
        [/background-color:\s*__MJ_SPLASH_BG__/g, `background-color: ${bgHex}`],
        [/background:\s*__MJ_SPLASH_BG__/g, `background: ${bgHex}`],
        [/content="#[0-9A-Fa-f]{6}"(\s*\/>)/g, (m, rest, offset, str) => {
          // لا تستبدل og/twitter — فقط theme-color سبق معالجته أعلاه
          return m;
        }],
      ],
    },
  ];

  for (const t of colorTargets) {
    if (!existsSync(t.file)) continue;
    let src = readFileSync(t.file, "utf8");
    // أولاً الرمز إن بقي
    src = src.split("__MJ_SPLASH_BG__").join(bgHex);
    for (const [re, rep] of t.patterns) {
      if (typeof rep === "function") continue;
      src = src.replace(re, rep);
    }
    // index.html: لا تستبدل theme-color بلون شاشة الدخول —
    // theme-color للواجهة = هوية --mj-brand؛ لون splash يبقى في CSS الحرج فقط.
    if (t.file.endsWith("index.html")) {
      /* intentionally no theme-color overwrite */
    }
    writeFileSync(t.file, src);
    console.log(`✓ حدّث اللون في ${t.file.replace(ROOT + "/", "")}`);
  }

  // أزل دوال الرمز القديمة غير المستخدمة في هذا المسار
  void patchToken;
  void ensureToken;

  // Android colors
  const valuesDir = join(ROOT, "android/app/src/main/res/values");
  if (existsSync(valuesDir)) {
    const colorsPath = join(valuesDir, "colors.xml");
    let colors = existsSync(colorsPath)
      ? readFileSync(colorsPath, "utf8")
      : `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="colorPrimary">#1F7A5A</color>\n    <color name="colorPrimaryDark">${bgHex}</color>\n    <color name="colorAccent">#B08A3E</color>\n</resources>\n`;
    if (colors.includes("splash_background")) {
      colors = colors.replace(
        /<color name="splash_background">[^<]*<\/color>/,
        `<color name="splash_background">${bgHex}</color>`,
      );
    } else {
      colors = colors.replace(
        "</resources>",
        `    <color name="splash_background">${bgHex}</color>\n</resources>`,
      );
    }
    if (colors.includes("colorPrimaryDark")) {
      colors = colors.replace(
        /<color name="colorPrimaryDark">[^<]*<\/color>/,
        `<color name="colorPrimaryDark">${bgHex}</color>`,
      );
    }
    writeFileSync(colorsPath, colors);

    // أيقونة Android 12+ (ليست الصورة الكاملة)
    const iconDir = join(ROOT, "android/app/src/main/res/drawable");
    if (existsSync(iconDir)) {
      const size = 288;
      const meta = await sharp(logoBuf).metadata();
      const max = Math.floor(size * 0.72);
      const scale = Math.min(max / meta.width, max / meta.height, 1);
      const lw = Math.max(1, Math.round(meta.width * scale));
      const lh = Math.max(1, Math.round(meta.height * scale));
      const resized = await sharp(logoBuf).resize(lw, lh).png().toBuffer();
      await sharp({
        create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
      })
        .composite([{ input: resized, left: Math.round((size - lw) / 2), top: Math.round((size - lh) / 2) }])
        .png()
        .toFile(join(iconDir, "splash_icon.png"));
    }

    const stylesPath = join(valuesDir, "styles.xml");
    if (existsSync(stylesPath)) {
      let styles = readFileSync(stylesPath, "utf8");
      if (!styles.includes("windowSplashScreenBackground")) {
        styles = styles.replace(
          /<style name="AppTheme\.NoActionBarLaunch"[^>]*>[\s\S]*?<\/style>/,
          `<style name="AppTheme.NoActionBarLaunch" parent="Theme.SplashScreen">
        <item name="windowSplashScreenBackground">@color/splash_background</item>
        <item name="windowSplashScreenAnimatedIcon">@drawable/splash_icon</item>
        <item name="postSplashScreenTheme">@style/AppTheme.NoActionBar</item>
        <item name="android:windowSplashScreenBackground">@color/splash_background</item>
    </style>`,
        );
      } else {
        styles = styles.replace(
          /@drawable\/splash"/g,
          '@drawable/splash_icon"',
        );
      }
      writeFileSync(stylesPath, styles);
    }
    console.log("✓ Android colors/styles SplashScreen API");
  }

  console.log("\n✓ assets:splash اكتمل");
  console.log(`  الخلفية: ${bgHex}`);
  console.log(`  الشعار: public/brand/splash-logo.png`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
