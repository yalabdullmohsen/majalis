/**
 * بوابة: كل مصدر مستعمل له مدخل في content-sources + registries.
 */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

const contentSources = JSON.parse(
  await readFile(resolve(root, "public/data/content-sources.json"), "utf8"),
);
const tafsirRegistry = JSON.parse(
  await readFile(resolve(root, "public/data/tafsir/tafsir-registry.json"), "utf8"),
);
const audioRegistry = JSON.parse(
  await readFile(resolve(root, "public/data/audio/audio-registry.json"), "utf8"),
);
const audioSourcesMd = await readFile(resolve(root, "docs/AUDIO_SOURCES.md"), "utf8");
const contentSourcesMd = await readFile(resolve(root, "docs/CONTENT_SOURCES.md"), "utf8");

assert.ok(Array.isArray(contentSources.sections), "content-sources.json sections");
assert.match(contentSourcesMd, /مصادر المحتوى/, "docs/CONTENT_SOURCES.md exists");

for (const t of tafsirRegistry.tafsirs ?? []) {
  assert.ok(t.source?.name, `${t.id} بلا source.name`);
  assert.ok(t.source?.url, `${t.id} بلا source.url`);
  assert.ok(t.source?.accessedAt, `${t.id} بلا accessedAt`);
  assert.ok(t.source?.permission, `${t.id} بلا permission`);
  assert.match(contentSourcesMd, new RegExp(t.id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `${t.id} في CONTENT_SOURCES.md`);
}

const tafsirSection = contentSources.sections.find((s: { id: string }) => s.id === "tafsir-text");
assert.ok(tafsirSection?.registryRef, "قسم tafsir-text يشير للسجل");

const recitationsSection = contentSources.sections.find((s: { id: string }) => s.id === "recitations");
assert.ok(recitationsSection?.registryRef, "قسم recitations يشير لسجل الصوت");

assert.match(contentSourcesMd, /everyayah/i, "everyayah في CONTENT_SOURCES");
assert.match(contentSourcesMd, /mohsalvi\/adhan-audio/, "adhan CDN في CONTENT_SOURCES");
assert.match(audioSourcesMd, /mohsalvi\/adhan-audio/, "adhan في AUDIO_SOURCES");

const lastAudit = JSON.parse(
  await readFile(resolve(root, "docs/AUDIO_QA.last-audit.json"), "utf8").catch(() => "{}"),
);
const fullGate = JSON.parse(
  await readFile(resolve(root, "docs/AUDIO_QA.full-audit-gate.json"), "utf8").catch(() => "{}"),
);

for (const r of audioRegistry.reciters ?? []) {
  if (r.verified) {
    assert.ok(r.source, `reciter ${r.id} بلا source`);
    assert.ok(r.folder, `reciter ${r.id} بلا folder`);
    assert.equal(r.filesPresent, 6236, `reciter ${r.id} filesPresent`);
    assert.match(audioSourcesMd, new RegExp(r.id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `${r.id} في AUDIO_SOURCES`);
    const qa = (lastAudit.results ?? []).find((x: { reciterId: string }) => x.reciterId === r.id);
    assert.ok(qa?.okCompleteness, `${r.id} verified لكن QA لم ينجح`);
    assert.ok((fullGate.passedReciterIds ?? []).includes(r.id), `${r.id} ليس في full-audit-gate`);
  }
}

console.log("sources-completeness-gate.test.ts: ok");
