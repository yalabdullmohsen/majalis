#!/usr/bin/env node
/**
 * تطبيق حقول التوثيق (trust_level وغيرها) على الملفات المملوكة — مراحل 3–5، 7.
 * لا يلمس الواجهة ولا documentation_level (بوابة العرض).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TODAY = "2026-07-25"; // تاريخ جلسة التوثيق (من بيئة المهمة)

function inferTrust(text) {
  const t = (text ?? "").trim();
  if (!t) return "unsourced";
  const hasQuranPin = /(?:سورة|﴿)/.test(t) && /:\s*\d+|:\d+/.test(t);
  const hasHadithPin =
    /(?:صحيح|سنن|مسند|موطأ|الترمذي|النسائي|أبو داود|ابن ماجه|البخاري|مسلم)/.test(
      t,
    ) && /(?:رقم|حديث)\s*\d+|\(\s*\d+\s*\)/.test(t);
  if (hasQuranPin) return "primary_text";
  if (hasHadithPin) {
    const hasGrade =
      /(?:صححه|حسّنه|ضعّفه|صحيح|حسن|ضعيف|موضوع)/.test(t) &&
      /(?:الألباني|الذهبي|ابن حجر|النووي|الحاكم|الترمذي)/.test(t);
    return hasGrade ? "primary_text" : "scholarly_source";
  }
  if (
    /(?:قرار|مجمع|هيئة|اللجنة الدائمة|مجمع الفقه)/.test(t) &&
    /(?:رقم|بتاريخ)/.test(t)
  )
    return "institutional_ruling";
  if (
    /(?:جزء|ج\s*\d+|ص\s*\d+|صفحة\s*\d+|المغني|المجموع|الأم|نيل الأوطار|زاد المعاد|فتح الباري)/.test(
      t,
    )
  )
    return "scholarly_source";
  if (
    /(?:قاعدة|مقاصد|الضرورات|الغرر|أكل المال بالباطل|لا ضرر|اليقين لا يزول|المشقة تجلب|الاستدلال|قياس|مبدأ)/.test(
      t,
    )
  )
    return "general_reasoning";
  if (t.length < 20) return "unsourced";
  if (
    /(?:البخاري|مسلم|القرآن|سورة|ابن|الشافعي|أبو حنيفة|مالك|أحمد|الألباني|﴿|فتاوى|المجامع)/.test(
      t,
    )
  )
    return "general_reasoning";
  return "general_reasoning";
}

const downgradeLog = [];

// ── Fiqh issues ──────────────────────────────────────────────
{
  const file = path.join(ROOT, "src/lib/fiqh-issues-seed.ts");
  let src = fs.readFileSync(file, "utf8");
  if (!src.includes("CitationTrustFields")) {
    src = src.replace(
      `import type { FiqhCouncilIssue, FiqhTimelineEvent } from "./fiqh-council-types";`,
      `import type { FiqhCouncilIssue, FiqhTimelineEvent } from "./fiqh-council-types";\nimport type { CitationTrustFields } from "./citation-schema";`,
    );
    src = src.replace(
      `export const FIQH_ISSUES_PUBLISHED_SEED: FiqhCouncilIssue[] = [`,
      `export const FIQH_ISSUES_PUBLISHED_SEED: Array<FiqhCouncilIssue & CitationTrustFields> = [`,
    );
  }

  // Insert trust fields after documentation_level line if missing
  src = src.replace(
    /(id:\s*"([^"]+)"[\s\S]*?documentation_level:\s*"([^"]+)",)(\n)(?!\s*trust_level:)/g,
    (full, head, id, docLevel, nl) => {
      // extract evidence_summary from the matched block
      const evidM = full.match(/evidence_summary:\s*"((?:\\.|[^"\\])*)"/);
      const evid = evidM ? evidM[1].replace(/\\"/g, '"') : "";
      const trust = inferTrust(evid);
      const updatedM = full.match(/updated_at:\s*"([^"]+)"/);
      const lastUp = updatedM ? updatedM[1] : `${TODAY}T00:00:00.000Z`;
      downgradeLog.push({
        id,
        before_claim: docLevel,
        after_trust_level: trust,
        reason:
          trust === "unsourced"
            ? "لا دليل في evidence_summary"
            : trust === "general_reasoning"
              ? "قاعدة عامة / استدلال بلا نص مسمّى يطابق مخطط Citation"
              : trust === "institutional_ruling"
                ? "إشارة قرار مؤسسي دون رفع فوق ما يدعمه النص"
                : "يسمّي مصدراً جزئياً — أُبقي عند أدنى درجة صادقة",
        verified_from: "NEEDS_HUMAN",
        note: "documentation_level لم يُمسّ (بوابة عرض الواجهة)",
      });
      return (
        head +
        nl +
        `    trust_level: "${trust}",` +
        nl +
        `    editorial_review_status: "unreviewed",` +
        nl +
        `    last_updated_at: "${lastUp}",` +
        nl
      );
    },
  );

  fs.writeFileSync(file, src);
  console.log("patched fiqh-issues-seed.ts", downgradeLog.length);
}

// ── Asma ─────────────────────────────────────────────────────
{
  const file = path.join(ROOT, "src/lib/asma-husna-data.ts");
  let src = fs.readFileSync(file, "utf8");
  if (!src.includes("trust_level")) {
    src = src.replace(
      `export type AsmaEntry = {
  num: number;
  arabic: string;
  meaning: string;
  reference: string;
  benefit: string;
  /** ثابت: له شاهد من القرآن أو السنة الصحيحة. مشهور: من سرد الترمذي الضعيف بلا شاهد مستقل. */
  status: AsmaStatus;
  category: string;
};`,
      `export type AsmaEntry = {
  num: number;
  arabic: string;
  meaning: string;
  reference: string;
  benefit: string;
  /** ثابت: له شاهد من القرآن أو السنة الصحيحة. مشهور: من سرد الترمذي الضعيف بلا شاهد مستقل. */
  status: AsmaStatus;
  category: string;
  /** درجة التوثيق الصادقة — حديث الـ99 وحده لا يخرّج معنى كل اسم */
  trust_level?: "primary_text" | "scholarly_source" | "institutional_ruling" | "general_reasoning" | "unsourced";
  editorial_review_status?: "unreviewed" | "reviewed" | "needs_rereview";
  last_updated_at?: string;
};`,
    );
  }

  // Add trust fields to each one-line entry before closing }
  // Pattern: status:"...", category:"..." }
  src = src.replace(
    /\{ num:(\d+),\s*arabic:"([^"]+)",\s*meaning:"((?:\\.|[^"\\])*)",\s*reference:"((?:\\.|[^"\\])*)",\s*benefit:"((?:\\.|[^"\\])*)",\s*status:"([^"]+)",\s*category:"([^"]+)"\s*\}/g,
    (full, num, arabic, meaning, reference, benefit, status, category) => {
      if (full.includes("trust_level")) return full;
      const is99 = reference === "الحديث: تسعة وتسعون اسماً";
      const trust = is99
        ? "unsourced"
        : /﴿/.test(reference) && /:\d+/.test(reference)
          ? "primary_text"
          : inferTrust(reference);
      if (is99) {
        downgradeLog.push({
          id: `asma-${num}`,
          before_claim: "reference=الحديث: تسعة وتسعون اسماً",
          after_trust_level: "unsourced",
          reason:
            "مرجع حديث الأسماء التسعة والتسعين لا يكفي لتخريج معنى الاسم المعيَّن",
          verified_from: `repo:src/lib/asma-husna-data.ts:entry-${num}`,
        });
      }
      return `{ num:${num},  arabic:"${arabic}", meaning:"${meaning}", reference:"${reference}", benefit:"${benefit}", status:"${status}", category:"${category}", trust_level:"${trust}", editorial_review_status:"unreviewed", last_updated_at:"${TODAY}T00:00:00.000Z" }`;
    },
  );

  fs.writeFileSync(file, src);
  console.log("patched asma-husna-data.ts");
}

// ── Curriculum JSON ──────────────────────────────────────────
{
  const file = path.join(
    ROOT,
    "data/rulings-encyclopedia/curriculum-topics.json",
  );
  const items = JSON.parse(fs.readFileSync(file, "utf8"));
  const watched = new Set([
    "curriculum-1",
    "curriculum-4",
    "curriculum-5",
    "curriculum-10",
  ]);
  const watchReport = [];

  for (const it of items) {
    const key = it.external_key;
    // Fix truncated summary from complete body in same record (repo-sourced)
    if (
      typeof it.summary === "string" &&
      typeof it.body === "string" &&
      it.body.startsWith(it.summary.slice(0, Math.min(40, it.summary.length))) &&
      it.summary.length < it.body.length &&
      !/[.؟!。」]$/.test(it.summary.trim())
    ) {
      it.summary = it.body;
    }

    // Infer trust from evidences present
    const sunnah = Array.isArray(it.sunnah_evidence) ? it.sunnah_evidence : [];
    const quran = Array.isArray(it.quran_evidence) ? it.quran_evidence : [];
    let trust = "unsourced";
    if (quran.length && sunnah.some((s) => /\d+/.test(s.source || ""))) {
      trust = "primary_text";
    } else if (quran.length) {
      trust = "primary_text";
    } else if (sunnah.some((s) => /صححه|حسّنه|الألباني/.test(s.source || ""))) {
      trust = "primary_text";
    } else if (sunnah.length) {
      // مصنَّف مذكور بلا رقم/حكم كامل في كثير من المواضع
      trust = sunnah.some((s) => /\d+/.test(s.source || ""))
        ? "scholarly_source"
        : "general_reasoning";
    } else if ((it.references || []).length) {
      trust = "scholarly_source";
    }

    it.trust_level = trust;
    it.editorial_review_status = "unreviewed";
    it.last_updated_at = `${TODAY}T00:00:00.000Z`;
    it.publication_gate = it.publication_gate || "open";
    it.text_flags = it.text_flags || [];

    if (watched.has(key)) {
      // Confirm prior cleanup: no Latin in prophetic text, no obvious corruption markers
      const blob = JSON.stringify(it);
      const hasLatinInHadith =
        /[A-Za-z]{3,}/.test(blob) &&
        /(?:قال النبي|ﷺ|حديث)/.test(blob) &&
        /sunnah_evidence/.test(blob);
      // Latin in source citations like "fiqh-curriculum-registry" is metadata — ignore source_origin
      const sunnahText = JSON.stringify(sunnah);
      const latinInMatn = /[A-Za-z]{4,}/.test(sunnahText);
      const suspect = latinInMatn;
      watchReport.push({
        id: key,
        previously_flagged: true,
        isolated_already: !suspect,
        latin_in_sunnah_matn: latinInMatn,
        publication_gate: it.publication_gate,
        trust_level: trust,
        note: suspect
          ? "ما زال فيه لاتيني في متن/مصدر حديث — راجع بشرياً"
          : "عُزل النص اللاتيني/المحرف سابقاً؛ لا إعادة تصحيح متن",
      });
      if (suspect) {
        it.text_flags = ["SUSPECT_TEXT"];
        it.publication_gate = "blocked";
      }
    }

    // Incomplete hadith pin → do not claim primary without number+grade
    for (const s of sunnah) {
      const src = s.source || "";
      if (/ضعيف|موضوع/.test(src) && /الاستدلال|دليله|وقال/.test(it.body || "")) {
        it.publication_gate = "blocked";
        if (!it.text_flags.includes("WEAK_AS_PROOF")) {
          /* reserved */
        }
      }
    }
  }

  fs.writeFileSync(file, JSON.stringify(items));
  fs.writeFileSync(
    "/tmp/curriculum-watch-report.json",
    JSON.stringify(watchReport, null, 2),
  );
  console.log("patched curriculum-topics.json", items.length, watchReport);
}

// ── Fawaid curated trust_level ───────────────────────────────
{
  const file = path.join(ROOT, "src/lib/fawaid-curated-seed.ts");
  let src = fs.readFileSync(file, "utf8");
  if (!src.includes("trust_level?:")) {
    src = src.replace(
      `export type FawaidCuratedItem = {
  id: string;
  text: string;
  category: string;
  source: string | null;
  author_name: string | null;
  status: "approved";
  verification_status: "verified" | "needs_review";
};`,
      `export type FawaidCuratedItem = {
  id: string;
  text: string;
  category: string;
  source: string | null;
  author_name: string | null;
  status: "approved";
  verification_status: "verified" | "needs_review";
  trust_level?: "primary_text" | "scholarly_source" | "institutional_ruling" | "general_reasoning" | "unsourced";
  editorial_review_status?: "unreviewed" | "reviewed" | "needs_rereview";
  last_updated_at?: string;
};`,
    );
  }
  // Enrich mapped export
  if (!src.includes("trust_level:")) {
    src = src.replace(
      /export const FAWAID_CURATED_SEED: FawaidCuratedItem\[\] = curated\.map\(\(item, i\) => \(\{([\s\S]*?)\}\)\);/,
      (full, body) => {
        if (body.includes("trust_level")) return full;
        return `export const FAWAID_CURATED_SEED: FawaidCuratedItem[] = curated.map((item, i) => ({
  id: \`fawaid-curated-\${i + 1}\`,
  ...item,
  trust_level: item.source
    ? (/﴿|: \\d+|رقم|صححه|حسّنه/.test(item.source)
        ? "primary_text"
        : /تفسير|ابن|صحيح|سنن|رواه/.test(item.source)
          ? "scholarly_source"
          : "general_reasoning")
    : "unsourced",
  editorial_review_status: "unreviewed",
  last_updated_at: "${TODAY}T00:00:00.000Z",
}));`;
      },
    );
  }
  fs.writeFileSync(file, src);
  console.log("patched fawaid-curated-seed.ts");
}

fs.writeFileSync(
  "/tmp/trust-downgrade-log.json",
  JSON.stringify(downgradeLog, null, 2),
);
console.log("downgrade log entries", downgradeLog.length);
