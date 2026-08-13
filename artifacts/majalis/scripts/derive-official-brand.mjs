#!/usr/bin/env node
/**
 * اشتق كل صور الهوية من public/brand/official.png.
 *   node scripts/derive-official-brand.mjs
 *
 * المخرجات + public/brand/assets.json (بصمة محتوى لكسر الكاش).
 */
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const PUBLIC = join(ROOT, "public");
const BRAND = join(PUBLIC, "brand");
const SOURCE = join(BRAND, "official.png");
const SITE_URL = "https://majlisilm.com";
const BG = "#002b21";
const OG_ALT =
  "شعار المجلس العلمي — خط عربي ورمز القلم على الكتاب فوق خلفية خضراء داكنة";

if (!existsSync(SOURCE)) {
  console.error("مفقود: public/brand/official.png — ضع المصدر (≥1024×1024) ثم أعد التشغيل.");
  process.exit(1);
}

const srcBuf = readFileSync(SOURCE);
const hash = createHash("sha256").update(srcBuf).digest("hex").slice(0, 10);

const py = `
from PIL import Image
from pathlib import Path
import struct, zlib

src = Image.open(${JSON.stringify(SOURCE)}).convert("RGBA")
w, h = src.size
if w < 1024 or h < 1024:
    raise SystemExit(f"official.png must be >=1024x1024, got {w}x{h}")
if abs(w - h) > 2:
    # center-crop to square
    side = min(w, h)
    left = (w - side) // 2
    top = (h - side) // 2
    src = src.crop((left, top, left + side, top + side))
    w = h = side

bg = ${JSON.stringify(BG)}

def hex_rgb(hx):
    hx = hx.lstrip("#")
    return tuple(int(hx[i:i+2], 16) for i in (0, 2, 4)) + (255,)

def fit_on_canvas(size, pad_ratio=0.0, letterbox=False, out_size=None):
    canvas_w, canvas_h = out_size or (size, size)
    canvas = Image.new("RGBA", (canvas_w, canvas_h), hex_rgb(bg))
    if letterbox:
        # square logo centered on 1200x630 — no crop of emblem
        max_side = int(min(canvas_w, canvas_h) * (1.0 - pad_ratio * 2))
        logo = src.copy()
        logo.thumbnail((max_side, max_side), Image.Resampling.LANCZOS)
        x = (canvas_w - logo.width) // 2
        y = (canvas_h - logo.height) // 2
        canvas.alpha_composite(logo, (x, y))
        return canvas.convert("RGB")
    # square icon with optional safe-zone padding (maskable ~10%)
    inner = int(size * (1.0 - 2 * pad_ratio))
    logo = src.copy()
    logo.thumbnail((inner, inner), Image.Resampling.LANCZOS)
    x = (size - logo.width) // 2
    y = (size - logo.height) // 2
    canvas = Image.new("RGBA", (size, size), hex_rgb(bg))
    canvas.alpha_composite(logo, (x, y))
    return canvas.convert("RGB")

out = Path(${JSON.stringify(BRAND)})
pub = Path(${JSON.stringify(PUBLIC)})
hash = ${JSON.stringify(hash)}

# purge previous hashed OG
for p in out.glob("og-1200x630.*.png"):
    p.unlink()

og_name = f"og-1200x630.{hash}.png"
fit_on_canvas(630, pad_ratio=0.06, letterbox=True, out_size=(1200, 630)).save(out / og_name, "PNG", optimize=True)

# web icons
fit_on_canvas(180, 0.04).save(pub / "apple-touch-icon.png", "PNG", optimize=True)
fit_on_canvas(192, 0.04).save(pub / "icon-192.png", "PNG", optimize=True)
fit_on_canvas(512, 0.04).save(pub / "icon-512.png", "PNG", optimize=True)
fit_on_canvas(512, 0.10).save(pub / "icon-maskable-512.png", "PNG", optimize=True)
fit_on_canvas(32, 0.02).save(pub / "favicon-32.png", "PNG", optimize=True)
fit_on_canvas(16, 0.02).save(pub / "favicon-16.png", "PNG", optimize=True)
fit_on_canvas(48, 0.02).save(pub / "favicon-48.png", "PNG", optimize=True)
fit_on_canvas(96, 0.03).save(pub / "icon-96.png", "PNG", optimize=True)
# legacy path some caches hit
fit_on_canvas(512, 0.04).save(pub / "favicon.png", "PNG", optimize=True)

# favicon.ico (16+32)
imgs = [fit_on_canvas(16, 0.02), fit_on_canvas(32, 0.02)]
imgs[0].save(pub / "favicon.ico", format="ICO", sizes=[(16, 16), (32, 32)])

# brand copies for any/maskable in /brand
fit_on_canvas(512, 0.04).save(out / "icon-512.png", "PNG", optimize=True)
fit_on_canvas(512, 0.10).save(out / "icon-512-maskable.png", "PNG", optimize=True)
fit_on_canvas(1024, 0.04).save(out / "icon-1024.png", "PNG", optimize=True)
fit_on_canvas(1024, 0.10).save(out / "icon-1024-maskable.png", "PNG", optimize=True)

# iOS AppIcon 1024
ios = Path(${JSON.stringify(join(ROOT, "ios/App/App/Assets.xcassets/AppIcon.appiconset"))})
if ios.is_dir():
    fit_on_canvas(1024, 0.04).save(ios / "AppIcon-512@2x.png", "PNG", optimize=True)

print(og_name)
`;

const ogName = execFileSync("python3", ["-c", py], { encoding: "utf8" }).trim();
const ogPath = `/brand/${ogName}`;
const ogAbs = `${SITE_URL}${ogPath}`;
const logoPath = `/brand/official.png`;
const logoAbs = `${SITE_URL}${logoPath}?v=${hash}`;

const assets = {
  hash,
  bg: BG,
  ogAlt: OG_ALT,
  source: "/brand/official.png",
  ogImage: ogPath,
  ogImageAbsolute: ogAbs,
  ogImageWidth: 1200,
  ogImageHeight: 630,
  logo: logoPath,
  logoAbsolute: logoAbs,
  icons: {
    faviconIco: "/favicon.ico",
    favicon16: "/favicon-16.png",
    favicon32: "/favicon-32.png",
    favicon48: "/favicon-48.png",
    faviconPng: "/favicon.png",
    appleTouch: "/apple-touch-icon.png",
    icon96: "/icon-96.png",
    icon192: "/icon-192.png",
    icon512: "/icon-512.png",
    iconMaskable512: "/icon-maskable-512.png",
    brand512: "/brand/icon-512.png",
    brand512Maskable: "/brand/icon-512-maskable.png",
    brand1024: "/brand/icon-1024.png",
    brand1024Maskable: "/brand/icon-1024-maskable.png",
  },
};

writeFileSync(join(BRAND, "assets.json"), JSON.stringify(assets, null, 2) + "\n");

// sync site.config + seo-routes defaultImage
function patchJson(file, mutator) {
  const p = join(ROOT, file);
  const data = JSON.parse(readFileSync(p, "utf8"));
  mutator(data);
  writeFileSync(p, JSON.stringify(data, null, 2) + "\n");
}

patchJson("site.config.json", (d) => {
  d.defaultImage = ogPath;
  d.ogImageWidth = 1200;
  d.ogImageHeight = 630;
  d.brandImageHash = hash;
});

patchJson("src/lib/seo-routes.json", (d) => {
  d.defaultImage = ogPath;
  d.ogImageWidth = 1200;
  d.ogImageHeight = 630;
});

const manifest = {
  id: "/",
  name: "المجلس العلمي",
  short_name: "المجلس",
  description:
    "تطبيق عربي يجمع الدروس الشرعية والدورات والمحاضرات والقرآن والأذكار والفوائد في مكان واحد لطالب العلم.",
  lang: "ar",
  dir: "rtl",
  start_url: "/",
  scope: "/",
  display: "standalone",
  display_override: ["standalone", "minimal-ui", "window-controls-overlay"],
  background_color: BG,
  theme_color: "#F2F4F3",
  orientation: "portrait-primary",
  categories: ["education", "books", "lifestyle"],
  prefer_related_applications: false,
  icons: [
    { src: `/favicon.ico?v=${hash}`, sizes: "16x16 32x32", type: "image/x-icon", purpose: "any" },
    { src: `/favicon-32.png?v=${hash}`, sizes: "32x32", type: "image/png", purpose: "any" },
    { src: `/favicon-48.png?v=${hash}`, sizes: "48x48", type: "image/png", purpose: "any" },
    { src: `/icon-96.png?v=${hash}`, sizes: "96x96", type: "image/png", purpose: "any" },
    { src: `/apple-touch-icon.png?v=${hash}`, sizes: "180x180", type: "image/png", purpose: "any" },
    { src: `/icon-192.png?v=${hash}`, sizes: "192x192", type: "image/png", purpose: "any" },
    { src: `/icon-512.png?v=${hash}`, sizes: "512x512", type: "image/png", purpose: "any" },
    { src: `/icon-maskable-512.png?v=${hash}`, sizes: "512x512", type: "image/png", purpose: "maskable" },
    { src: `/brand/icon-1024.png?v=${hash}`, sizes: "1024x1024", type: "image/png", purpose: "any" },
    { src: `/brand/icon-1024-maskable.png?v=${hash}`, sizes: "1024x1024", type: "image/png", purpose: "maskable" },
  ],
  shortcuts: [
    {
      name: "القرآن الكريم",
      short_name: "القرآن",
      url: "/quran-hub",
      description: "المصحف الرقمي الاحترافي",
      icons: [{ src: `/icon-192.png?v=${hash}`, sizes: "192x192" }],
    },
    {
      name: "الدروس العلمية",
      short_name: "الدروس",
      url: "/lessons",
      description: "دروس ومحاضرات شرعية",
      icons: [{ src: `/icon-192.png?v=${hash}`, sizes: "192x192" }],
    },
    {
      name: "أوقات الصلاة",
      short_name: "الصلاة",
      url: "/prayer-times",
      description: "مواقيت الصلاة الدقيقة",
      icons: [{ src: `/icon-192.png?v=${hash}`, sizes: "192x192" }],
    },
    {
      name: "الأذكار",
      short_name: "الأذكار",
      url: "/adhkar",
      description: "أذكار الصباح والمساء",
      icons: [{ src: `/icon-192.png?v=${hash}`, sizes: "192x192" }],
    },
  ],
};

const manJson = JSON.stringify(manifest, null, 2) + "\n";
writeFileSync(join(PUBLIC, "manifest.webmanifest"), manJson);
writeFileSync(join(PUBLIC, "manifest.json"), manJson);
writeFileSync(join(PUBLIC, "site.webmanifest"), manJson);
const iosPub = join(ROOT, "ios/App/App/public");
if (existsSync(iosPub)) {
  writeFileSync(join(iosPub, "site.webmanifest"), manJson);
  writeFileSync(join(iosPub, "manifest.webmanifest"), manJson);
}

copyFileSync(SOURCE, join(PUBLIC, "logo.png"));
copyFileSync(SOURCE, join(PUBLIC, "logo-icon.png"));
console.log(`derive-official-brand: hash=${hash} og=${ogPath}`);
