import type { RulingImportRow } from "./rulings-types";
import { validateImportBatch } from "./rulings-validator";

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

function splitList(value?: string): string[] {
  if (!value?.trim()) return [];
  return value.split(/[|;،]/).map((s) => s.trim()).filter(Boolean);
}

function parseEvidenceField(value?: string) {
  if (!value?.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [{ text: value.trim(), source: "مرجع مستورد" }];
  }
}

export function parseRulingsCsv(text: string): RulingImportRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  const idx = (name: string) => headers.indexOf(name);

  const rows: RulingImportRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    if (cols.every((c) => !c)) continue;

    const get = (name: string) => cols[idx(name)] ?? "";

    rows.push({
      external_key: get("external_key") || undefined,
      title: get("title"),
      summary: get("summary") || undefined,
      body: get("body"),
      category: get("category"),
      subcategory: get("subcategory") || undefined,
      prevailing_view: get("prevailing_view") || undefined,
      hadith_grade: get("hadith_grade") || undefined,
      keywords: splitList(get("keywords")),
      subcategories: splitList(get("subcategories")),
      benefits: splitList(get("benefits")),
      importance_score: Number(get("importance_score")) || 50,
      quran_evidence: parseEvidenceField(get("quran_evidence")),
      sunnah_evidence: parseEvidenceField(get("sunnah_evidence")),
      references: parseEvidenceField(get("references")),
      evidence: parseEvidenceField(get("evidence")),
      source_origin: get("source_origin") || undefined,
      status: (get("status") as RulingImportRow["status"]) || "approved",
      verification_status: (get("verification_status") as RulingImportRow["verification_status"]) || "approved",
    });
  }
  return rows;
}

export function parseRulingsJson(text: string): RulingImportRow[] {
  const parsed = JSON.parse(text);
  const rows = Array.isArray(parsed) ? parsed : parsed.items ?? parsed.rulings ?? [];
  return rows as RulingImportRow[];
}

export function parseRulingsMarkdown(text: string): RulingImportRow[] {
  const blocks = text.split(/^---\s*$/m).map((b) => b.trim()).filter(Boolean);
  const rows: RulingImportRow[] = [];

  for (const block of blocks) {
    const meta: Record<string, string> = {};
    let body = block;
    const fmMatch = block.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (fmMatch) {
      for (const line of fmMatch[1].split("\n")) {
        const m = line.match(/^([a-z_]+):\s*(.+)$/i);
        if (m) meta[m[1]] = m[2].trim();
      }
      body = fmMatch[2].trim();
    }

    if (!meta.title && !body.startsWith("#")) continue;
    const title = meta.title || body.match(/^#\s+(.+)/)?.[1]?.trim() || "";
    const cleanBody = body.replace(/^#\s+.+\n?/, "").trim();

    rows.push({
      external_key: meta.external_key,
      title,
      summary: meta.summary,
      body: cleanBody,
      category: meta.category || "طلب العلم والدعوة",
      subcategory: meta.subcategory,
      keywords: splitList(meta.keywords),
      references: parseEvidenceField(meta.references),
      quran_evidence: parseEvidenceField(meta.quran_evidence),
      sunnah_evidence: parseEvidenceField(meta.sunnah_evidence),
      prevailing_view: meta.prevailing_view,
      hadith_grade: meta.hadith_grade,
      source_origin: meta.source_origin,
      importance_score: Number(meta.importance_score) || 50,
      status: (meta.status as RulingImportRow["status"]) || "approved",
      verification_status: (meta.verification_status as RulingImportRow["verification_status"]) || "approved",
    });
  }
  return rows;
}

export function importRulingsFromText(
  text: string,
  format: "csv" | "json" | "markdown",
): ReturnType<typeof validateImportBatch> {
  const rows =
    format === "csv"
      ? parseRulingsCsv(text)
      : format === "json"
        ? parseRulingsJson(text)
        : parseRulingsMarkdown(text);
  return validateImportBatch(rows);
}

export const RULINGS_CSV_TEMPLATE = `external_key,title,summary,body,category,subcategory,prevailing_view,hadith_grade,keywords,importance_score,quran_evidence,sunnah_evidence,references,source_origin,status
example-wudu,حكم الوضوء,وجوب الوضوء للصلاة,"الوضوء واجب لمن أراد الصلاة؛ دليله قوله تعالى: يا أيها الذين آمنوا إذا قمتم إلى الصلاة فاغسلوا...",الطهارة,الوضوء,الواجب,,وضوء;طهارة;صلاة,80,"[{""type"":""قرآن"",""text"":""إذا قمتم إلى الصلاة فاغسلوا"",""source"":""سورة المائدة: 6""}]","[{""type"":""حديث"",""text"":""لا صلاة لمن لا وضوء له"",""source"":""رواه مسلم""}]","[{""text"":""المغني"",""source"":""ابن قدامة — كتاب الطهارة""}]","ابن قدامة — المغني",approved
`;
