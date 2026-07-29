#!/usr/bin/env node
/**
 * يمنع تكرار النبذة في صفحات العلماء المُصيَّرة مسبقًا،
 * وتكرار وصف الكتاب حرفيًا مرتين، وعنوان «كتاب شرعي» العام.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name === "index.html") out.push(full);
  }
  return out;
}

function normalize(s) {
  return String(s || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/[ً-ْٰـ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const scholarsDir = resolve(appRoot, "seo-prerender/scholars");
const libraryDir = resolve(appRoot, "seo-prerender/library");

if (existsSync(scholarsDir)) {
  for (const file of walk(scholarsDir)) {
    const html = readFileSync(file, "utf8");
    const main = (html.match(/<main[\s\S]*?<\/main>/i) || [""])[0];
    const paras = [...main.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map((m) => normalize(m[1]));
    for (let i = 0; i < paras.length; i++) {
      for (let j = i + 1; j < paras.length; j++) {
        if (!paras[i] || paras[i].length < 60) continue;
        if (paras[i] === paras[j]) {
          failures.push(`${file.slice(appRoot.length + 1)}: فقرة مكررة حرفيًا في صفحة عالم`);
        } else if (paras[j].startsWith(paras[i].slice(0, Math.min(80, paras[i].length))) && paras[i].length >= 80) {
          failures.push(`${file.slice(appRoot.length + 1)}: بداية نبذة مكررة في صفحة عالم`);
        }
      }
    }
  }
}

if (existsSync(libraryDir)) {
  const titles = new Map();
  const descs = new Map();
  for (const file of walk(libraryDir)) {
    const html = readFileSync(file, "utf8");
    const title = ((html.match(/<title>([^<]*)<\/title>/i) || [])[1] || "").trim();
    if (/كتاب شرعي/u.test(title)) {
      failures.push(`${file.slice(appRoot.length + 1)}: عنوان عام «كتاب شرعي»`);
    }
    const desc = ((html.match(/name="description" content="([^"]*)"/i) || [])[1] || "").trim();
    const main = (html.match(/<main[\s\S]*?<\/main>/i) || [""])[0];
    const paras = [...main.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map((m) => normalize(m[1]));
    for (let i = 0; i < paras.length; i++) {
      for (let j = i + 1; j < paras.length; j++) {
        if (paras[i] && paras[i].length >= 40 && paras[i] === paras[j]) {
          failures.push(`${file.slice(appRoot.length + 1)}: وصف كتاب مكرر حرفيًا مرتين`);
        }
      }
    }
    if (title) {
      if (titles.has(title)) failures.push(`تكرار title بين كتب: ${title}`);
      else titles.set(title, file);
    }
    if (desc && desc.length >= 40) {
      if (descs.has(desc)) failures.push(`تكرار meta description بين كتب: ${desc.slice(0, 60)}…`);
      else descs.set(desc, file);
    }
  }
}

// لا واجهة عامة مفهرسة لـ /qa
const qaPrerender = resolve(appRoot, "seo-prerender/qa/index.html");
if (existsSync(qaPrerender)) {
  const qa = readFileSync(qaPrerender, "utf8");
  if (!/noindex/i.test(qa) && !/سين جيم|\/quiz/u.test(qa)) {
    failures.push("seo-prerender/qa ما زال يعرض واجهة أسئلة مستقلة بلا توجيه للعبة");
  }
}

if (failures.length) {
  console.error(`❌ فشل تدقيق التكرار (${failures.length}):`);
  for (const f of failures.slice(0, 50)) console.error(`  - ${f}`);
  process.exit(1);
}

console.log("✓ لا تكرار نبذات علماء/أوصاف كتب، ولا عنوان «كتاب شرعي» العام.");
