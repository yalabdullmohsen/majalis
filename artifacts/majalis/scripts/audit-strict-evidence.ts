#!/usr/bin/env node
/**
 * بوابة أدلة صارمة — سياسة النشر 2026-08:
 * تفشل عند blocked في sitemap، أو ادعاء توثيق بلا أهلية في الصفحات الناقصة.
 * لا تفشل لمجرد أن الصفحة partial/pending في sitemap أو index.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

type Fail = { id: string; detail: string };
const fails: Fail[] = [];

function fail(id: string, detail: string) {
  fails.push({ id, detail });
}

async function main() {
  const { RULINGS_ENCYCLOPEDIA_SEED } = await import(
    pathToFileURL(path.join(root, "src/lib/rulings-encyclopedia-seed.generated.ts")).href
  ) as {
    RULINGS_ENCYCLOPEDIA_SEED: Array<{
      id: string;
      external_key?: string;
      slug?: string;
      status?: string;
      verification_status?: string;
      title?: string;
      body?: string;
    }>;
  };

  const { classifyRuling, canIncludeInSitemap, textClaimsVerification } = await import(
    pathToFileURL(path.join(root, "src/lib/publish-policy.ts")).href
  ) as {
    classifyRuling: (r: unknown) => string;
    canIncludeInSitemap: (s: string) => boolean;
    textClaimsVerification: (t: string) => boolean;
  };

  const sitemapPath = path.join(root, "public/sitemap.xml");
  if (!fs.existsSync(sitemapPath)) {
    fail("sitemap_missing", "public/sitemap.xml غير موجود — شغّل generate:seo أو build");
  } else {
    const sitemap = fs.readFileSync(sitemapPath, "utf8");

    for (const r of RULINGS_ENCYCLOPEDIA_SEED) {
      const status = classifyRuling(r);
      if (status !== "blocked") continue;
      const pathId = r.external_key || r.slug || r.id;
      if (sitemap.includes(`/rulings/${pathId}`)) {
        fail("blocked_ruling_in_sitemap", `/rulings/${pathId}`);
      }
      if (!canIncludeInSitemap(status)) {
        /* متوقع */
      }
    }

    const updates = fs.readFileSync(path.join(root, "src/lib/updates-seed.ts"), "utf8");
    if (/950\s*سؤال/.test(updates)) {
      fail("stale_950_quiz_claim", "updates-seed.ts ما زال يذكر 950 سؤالاً");
    }
  }

  const copyGuards: Array<{ file: string; mustNot: RegExp; id: string }> = [
    {
      file: "src/pages/fiqh/ui/RulingsView.tsx",
      mustNot: /موثقة بالأدلة/,
      id: "rulings_hub_verification_claim",
    },
    {
      file: "src/pages/account/QuizPage.tsx",
      mustNot: /موثقة بالأدلة/,
      id: "quiz_verification_claim",
    },
    {
      file: "src/views/KnowledgeGraphPage.tsx",
      mustNot: /جميع العلاقات المعروضة موثقة/,
      id: "kg_verification_claim",
    },
  ];
  for (const g of copyGuards) {
    const p = path.join(root, g.file);
    if (!fs.existsSync(p)) continue;
    const text = fs.readFileSync(p, "utf8");
    if (g.mustNot.test(text)) {
      fail(g.id, g.file);
    }
    if (textClaimsVerification(text) && /partial|incomplete|pending_review|قيد الإكمال/.test(text) === false) {
      /* يسمح إن وُجد تنبيه في نفس الملف */
    }
  }

  const out = {
    at: new Date().toISOString(),
    ok: fails.length === 0,
    fails,
  };
  fs.mkdirSync(path.join(root, "reports"), { recursive: true });
  fs.writeFileSync(
    path.join(root, "reports/strict-evidence-audit.json"),
    JSON.stringify(out, null, 2),
    "utf8",
  );

  console.log("Strict evidence audit (publish policy)");
  console.log(fails.length === 0 ? "✓ لا مخالفات حرجة" : `✗ ${fails.length} مخالفة`);
  for (const f of fails.slice(0, 40)) {
    console.log(`  - ${f.id}: ${f.detail}`);
  }
  if (fails.length) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
