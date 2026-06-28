/**
 * Parse CSV/JSON question imports for Sin Jeem admin.
 */

function parseCsvLine(line) {
  const out = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQ = !inQ;
      continue;
    }
    if (ch === "," && !inQ) {
      out.push(cur.trim());
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur.trim());
  return out;
}

export function parseCsvQuestions(text) {
  const lines = String(text || "")
    .trim()
    .split(/\r?\n/)
    .filter(Boolean);
  if (lines.length < 2) return [];

  const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  const idx = (name) => header.indexOf(name);

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const question = cols[idx("question")] || cols[idx("سؤال")] || cols[0];
    if (!question) continue;

    const optionsRaw = cols[idx("options")] || cols[idx("خيارات")] || "";
    const options = optionsRaw
      ? optionsRaw.split("|").map((x) => x.trim()).filter(Boolean)
      : [cols[idx("option1")], cols[idx("option2")], cols[idx("option3")], cols[idx("option4")]].filter(Boolean);

    rows.push({
      question,
      options: options.length ? options : undefined,
      correct_index: Number(cols[idx("correct_index")] ?? cols[idx("إجابة")] ?? 0) || 0,
      category_slug: cols[idx("category_slug")] || cols[idx("تصنيف")] || "fiqh",
      subcategory_slug: cols[idx("subcategory_slug")] || cols[idx("تصنيف_فرعي")] || undefined,
      question_type: cols[idx("question_type")] || cols[idx("نوع")] || "multiple_choice",
      difficulty: cols[idx("difficulty")] || cols[idx("مستوى")] || "متوسط",
      source: cols[idx("source")] || cols[idx("مصدر")] || undefined,
      explanation: cols[idx("explanation")] || cols[idx("شرح")] || undefined,
      keywords: (cols[idx("keywords")] || cols[idx("كلمات")] || "")
        .split("|")
        .map((x) => x.trim())
        .filter(Boolean),
    });
  }
  return rows;
}

export function parseJsonQuestions(payload) {
  const data = typeof payload === "string" ? JSON.parse(payload) : payload;
  const rows = Array.isArray(data) ? data : data?.questions || [];
  return rows.filter((r) => r?.question);
}

export function questionsToCsv(questions) {
  const header = "question,options,correct_index,category_slug,subcategory_slug,question_type,difficulty,source,explanation,keywords";
  const lines = [header];
  for (const q of questions) {
    const opts = (q.options || []).join("|");
    const kws = (q.keywords || []).join("|");
    const esc = (s) => `"${String(s ?? "").replace(/"/g, '""')}"`;
    lines.push(
      [
        esc(q.question),
        esc(opts),
        q.correct_index ?? 0,
        esc(q.category_slug || ""),
        esc(q.subcategory_slug || ""),
        esc(q.question_type || "multiple_choice"),
        esc(q.difficulty || "متوسط"),
        esc(q.source || ""),
        esc(q.explanation || ""),
        esc(kws),
      ].join(","),
    );
  }
  return lines.join("\n");
}

export function contentHash(text) {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
  return String(h);
}
