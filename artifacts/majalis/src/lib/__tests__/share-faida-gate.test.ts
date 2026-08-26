/**
 * بوابة مشاركة «فائدة من المجلس العلمي».
 * node --import tsx src/lib/__tests__/share-faida-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildFaidaShareText, whatsappShareUrl } from "../share-faida";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const text = buildFaidaShareText("كتاب الصلاة", "https://majlisilm.com/fiqh/books/salah");
assert.match(text, /فائدة من المجلس العلمي/);
assert.match(text, /كتاب الصلاة/);
assert.match(text, /https:\/\/majlisilm\.com/);
assert.doesNotMatch(text, /www\.majlisilm/);

const wa = whatsappShareUrl(text);
assert.match(wa, /^https:\/\/wa\.me\/\?text=/);

const shareFaida = read("src/components/ShareFaida.tsx");
assert.match(shareFaida, /Share2/);
assert.match(shareFaida, /واتساب/);
assert.match(shareFaida, /نسخ الرابط/);

const contentActions = read("src/components/ContentActions.tsx");
assert.match(contentActions, /ShareFaida/);
assert.match(contentActions, /فائدة من المجلس العلمي/);

const contact = read("src/views/ContactPage.tsx");
assert.doesNotMatch(contact, /ShareFaida/, "صفحة التواصل بلا ShareFaida");

console.log("share-faida-gate.test.ts: ok");
