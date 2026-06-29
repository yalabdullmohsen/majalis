#!/usr/bin/env node
/**
 * Verify About Platform page + navigation recovery.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "src");

let pass = 0;
let fail = 0;

function ok(cond, msg) {
  if (cond) {
    pass++;
    console.log(`✓ ${msg}`);
  } else {
    fail++;
    console.error(`✗ ${msg}`);
  }
}

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

console.log("\n=== About Platform Recovery Verification ===\n");

ok(fs.existsSync(path.join(SRC, "views/AboutPlatformPage.tsx")), "AboutPlatformPage.tsx exists");
ok(fs.existsSync(path.join(SRC, "styles/about-platform.css")), "about-platform.css exists");
ok(fs.existsSync(path.join(SRC, "lib/platform-about-stats.ts")), "platform-about-stats.ts exists");

const app = read("src/App.tsx");
ok(app.includes('path="/about-platform"'), "App route /about-platform");
ok(app.includes("AboutPlatformPage"), "App imports AboutPlatformPage");

const nav = read("src/lib/navigation.ts");
ok(nav.includes("NAVBAR_ABOUT_LINK"), "NAVBAR_ABOUT_LINK defined");
ok(nav.includes('label: "عن المنصة"'), "Arabic label عن المنصة");
ok(nav.includes("/about-platform"), "about-platform in navigation");

const navbar = read("src/components/NavBar.tsx");
ok(navbar.includes("NAVBAR_ABOUT_LINK"), "NavBar uses NAVBAR_ABOUT_LINK");
ok(navbar.includes("navbar-v3__about-link"), "NavBar about link CSS class");

const footer = read("src/components/SiteFooter.tsx");
ok(footer.includes("/about-platform"), "Footer links to about-platform");
ok(footer.includes("/question-answer"), "Footer links to question-answer");

const home = read("src/views/HomePage.tsx");
ok(home.includes("HomeFeatureCards"), "Home page shows feature cards (Q&A card)");
ok(home.includes("HomeMoreSections"), "Home page shows more sections");

const page = read("src/views/AboutPlatformPage.tsx");
ok(page.includes("yalabdullmohsen1@gmail.com"), "Founder email present");
ok(page.includes("نسخ البريد"), "Copy email button");
ok(page.includes("mailto:"), "mailto link");
ok(page.includes("نبذة عن المنصة"), "Section نبذة عن المنصة");
ok(page.includes("لماذا نحتاج المنصة"), "Section لماذا نحتاج المنصة");
ok(page.includes("القائم على المنصة"), "Section القائم على المنصة");
ok(page.includes("تواصل معنا"), "Section تواصل معنا");
ok(page.includes("رؤيتنا") || page.includes("رؤية"), "Vision section");
ok(page.includes("رسالتنا") || page.includes("رسالة"), "Mission section");

const seo = read("src/lib/seo-routes.json");
ok(seo.includes("/about-platform"), "SEO route for about-platform");

console.log(`\n=== Summary: ${pass} passed, ${fail} failed ===\n`);
process.exit(fail > 0 ? 1 : 0);
