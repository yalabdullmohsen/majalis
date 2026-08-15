#!/usr/bin/env node
/**
 * بوابة أدلة صارمة — تفشل عند مخالفات فهرسة/اكتمال مثبتة في الكود أو dist.
 * لا تعتمد على Google Search Console كمصدر حقيقة.
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
  const { LIBRARY_CATALOG, libraryHasReadableSource } = await import(
    pathToFileURL(path.join(root, "src/lib/library-catalog.ts")).href
  ) as {
    LIBRARY_CATALOG: Array<{ id: string; external_url?: string }>;
    libraryHasReadableSource: (b: { external_url?: string }) => boolean;
  };

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

  const { isPubliclyPublishedRuling } = await import(
    pathToFileURL(path.join(root, "src/lib/rulings-publication-gate.ts")).href
  ) as { isPubliclyPublishedRuling: (r: unknown) => boolean };

  const sitemapPath = path.join(root, "public/sitemap.xml");
  if (!fs.existsSync(sitemapPath)) {
    fail("sitemap_missing", "public/sitemap.xml غير موجود — شغّل generate:seo أو build");
  } else {
    const sitemap = fs.readFileSync(sitemapPath, "utf8");

    for (const r of RULINGS_ENCYCLOPEDIA_SEED) {
      if (isPubliclyPublishedRuling(r)) continue;
      const pathId = r.external_key || r.slug || r.id;
      if (sitemap.includes(`/rulings/${pathId}`)) {
        fail("pending_ruling_in_sitemap", `/rulings/${pathId}`);
      }
    }

    for (const b of LIBRARY_CATALOG) {
      if (libraryHasReadableSource(b)) continue;
      if (sitemap.includes(`/library/${b.id}`)) {
        fail("sourceless_book_in_sitemap", `/library/${b.id}`);
      }
      const prerender = path.join(root, "seo-prerender/library", b.id, "index.html");
      if (fs.existsSync(prerender)) {
        const html = fs.readFileSync(prerender, "utf8");
        if (/name="robots" content="index/.test(html)) {
          fail("sourceless_book_index", b.id);
        }
      }
    }

    const updates = fs.readFileSync(path.join(root, "src/lib/updates-seed.ts"), "utf8");
    if (/950\s*سؤال/.test(updates)) {
      fail("stale_950_quiz_claim", "updates-seed.ts ما زال يذكر 950 سؤالاً");
    }

    const publicRulings = RULINGS_ENCYCLOPEDIA_SEED.filter((r) => isPubliclyPublishedRuling(r));
    if (publicRulings.length === 0) {
      if (sitemap.includes("<loc>https://majlisilm.com/rulings</loc>")) {
        fail("empty_rulings_hub_in_sitemap", "/rulings");
      }
      const hub = path.join(root, "seo-prerender/rulings/index.html");
      if (fs.existsSync(hub) && /name="robots" content="index/.test(fs.readFileSync(hub, "utf8"))) {
        fail("empty_rulings_hub_indexable", "/rulings");
      }
    }

    if (sitemap.includes("<loc>https://majlisilm.com/knowledge-graph</loc>")) {
      fail("knowledge_graph_in_sitemap", "/knowledge-graph");
    }
  }

  const kg = path.join(root, "seo-prerender/knowledge-graph/index.html");
  if (fs.existsSync(kg) && /name="robots" content="index/.test(fs.readFileSync(kg, "utf8"))) {
    fail("knowledge_graph_indexable", "/knowledge-graph");
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

  console.log("Strict evidence audit");
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
