#!/usr/bin/env node
/** تحقق مخطط عنصر المعرفة الموحّد. */
import fs from "node:fs";
import path from "node:path";
import { KNOWLEDGE, SCHEMAS, walkJson, fail, ok } from "./lib.mjs";

const REQUIRED = ["id", "title", "body", "evidences", "sources", "tags", "related", "review_status", "updated_at"];
const STATUS = new Set(["verified", "needs_review"]);
const EVIDENCE_TYPES = new Set(["ayah", "hadith", "athar", "quote"]);

function validateItem(it, file, issues) {
  for (const k of REQUIRED) {
    if (!(k in it)) issues.push(`${file}: ${it.id || "?"} missing ${k}`);
  }
  if (it.review_status && !STATUS.has(it.review_status)) {
    issues.push(`${file}: ${it.id} invalid review_status`);
  }
  if (!Array.isArray(it.evidences)) issues.push(`${file}: ${it.id} evidences not array`);
  else {
    for (const e of it.evidences) {
      if (!EVIDENCE_TYPES.has(e.type)) issues.push(`${file}: ${it.id} bad evidence type ${e.type}`);
      if (!e.ref) issues.push(`${file}: ${it.id} evidence missing ref`);
      if (!e.text) issues.push(`${file}: ${it.id} evidence missing text`);
      if (e.type === "hadith") {
        if (!e.grade) issues.push(`${file}: ${it.id} hadith missing grade`);
        if (!e.graded_by) issues.push(`${file}: ${it.id} hadith missing graded_by`);
      }
    }
  }
  if (!Array.isArray(it.sources) || it.sources.length === 0) {
    if (it.review_status === "verified") {
      issues.push(`${file}: ${it.id} verified without sources`);
    }
  } else {
    for (const s of it.sources) {
      if (!s || typeof s !== "object") {
        issues.push(`${file}: ${it.id} source not object`);
        continue;
      }
      if (!String(s.book || "").trim()) issues.push(`${file}: ${it.id} source missing book`);
      if (!String(s.author || "").trim()) issues.push(`${file}: ${it.id} source missing author`);
    }
  }
  if (it.review_status === "verified") {
    const hasEv = Array.isArray(it.evidences) && it.evidences.length > 0;
    const hasSrc = Array.isArray(it.sources) && it.sources.length > 0;
    if (!hasEv || !hasSrc) issues.push(`${file}: ${it.id} verified requires evidences+sources`);
  }
  if (it.updated_at && !/^\d{4}-\d{2}-\d{2}/.test(String(it.updated_at))) {
    issues.push(`${file}: ${it.id} updated_at invalid (${it.updated_at})`);
  }
}

const issues = [];
const schemaPath = path.join(SCHEMAS, "knowledge-item.schema.json");
if (!fs.existsSync(schemaPath)) issues.push("missing knowledge-item.schema.json");

const files = walkJson(KNOWLEDGE).filter((f) => !f.endsWith("manifest.json"));
if (files.length === 0) {
  console.warn("لا ملفات معرفة بعد — اجتياز شكلي");
} else {
  for (const f of files) {
    let raw;
    try {
      raw = JSON.parse(fs.readFileSync(f, "utf8"));
    } catch (e) {
      issues.push(`${f}: JSON parse error ${e.message}`);
      continue;
    }
    const arr = Array.isArray(raw) ? raw : raw.items ? raw.items : [raw];
    for (const it of arr) validateItem(it, path.relative(process.cwd(), f), issues);
  }
}

if (issues.length) fail(`test:content-schema — ${issues.length} مخالفة`, issues);
ok(`test:content-schema — ${files.length} ملفًا`);
