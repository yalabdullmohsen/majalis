import { normalizeArabic } from './utils.mjs';

const URL_PATTERN = /^https?:\/\/.+/i;

export function extractProvenance(item, defaults = {}) {
  return {
    source_name: item.source_name ?? item.sourceName ?? item.organizer ?? item.mufti_name ?? defaults.source_name ?? '',
    source_title: item.source_title ?? item.bookTitle ?? item.title ?? '',
    source_author: item.source_author ?? item.author_name ?? item.speaker_name ?? item.sheikh ?? item.mufti_name ?? '',
    source_type: item.source_type ?? defaults.source_type ?? inferSourceType(item),
    source_url: item.source_url ?? item.sourceUrl ?? item.book_url ?? item.external_url ?? item.url ?? '',
    published_at_source: item.published_at_source ?? item.published_at ?? item.session_date ?? null,
    trust_level: item.trust_level ?? item.trustLevel ?? defaults.trust_level ?? 50,
  };
}

function inferSourceType(item) {
  const url = String(item.source_url ?? item.url ?? '');
  if (/\.pdf/i.test(url)) return 'book';
  if (/rss|feed|xml/i.test(url)) return 'rss';
  if (/islamweb|alifta|dorar|sunna/i.test(url)) return 'official';
  if (item.type === 'كتاب' || item.bookTitle) return 'book';
  return 'website';
}

export function validateProvenance(provenance) {
  const errors = [];
  const warnings = [];

  if (!provenance.source_name?.trim()) {
    errors.push({ code: 'missing_source_name', message: 'اسم المصدر مطلوب', severity: 'error' });
  }
  if (!provenance.source_url?.trim()) {
    errors.push({ code: 'missing_source_url', message: 'رابط المصدر مطلوب', severity: 'error' });
  } else if (!URL_PATTERN.test(provenance.source_url)) {
    errors.push({ code: 'invalid_source_url', message: 'رابط المصدر غير صالح', severity: 'error' });
  }
  if (!provenance.source_type?.trim()) {
    warnings.push({ code: 'missing_source_type', message: 'نوع المصدر غير محدد', severity: 'warning' });
  }

  let score = 0;
  if (provenance.source_name?.trim()) score += 25;
  if (provenance.source_url?.trim() && URL_PATTERN.test(provenance.source_url)) score += 35;
  if (provenance.source_author?.trim()) score += 15;
  if (provenance.source_title?.trim()) score += 10;
  if (provenance.source_type) score += 10;
  if (provenance.published_at_source) score += 5;

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    completeness_score: Math.min(100, score),
  };
}

export function buildProvenanceRow(contentType, contentId, item, defaults = {}) {
  const prov = extractProvenance(item, defaults);
  const validation = validateProvenance(prov);
  return {
    content_type: contentType,
    content_id: String(contentId),
    external_key: item.external_key ?? item.id ?? null,
    ...prov,
    source_name: prov.source_name || 'غير محدد',
    source_url: prov.source_url || '',
    verification_status: validation.valid ? 'needs_review' : 'rejected',
    completeness_score: validation.completeness_score,
    metadata: {
      title: item.title ?? item.question ?? item.text?.slice?.(0, 120) ?? null,
      category: item.category ?? null,
    },
    updated_at: new Date().toISOString(),
  };
}

export function mergeProvenance(existing, incoming) {
  const merged = { ...existing, ...incoming };
  const changed = [];
  for (const field of ['source_name', 'source_url', 'source_author', 'source_type', 'trust_level']) {
    if (String(existing[field] ?? '') !== String(incoming[field] ?? '')) {
      changed.push({ field, before: existing[field], after: incoming[field] });
    }
  }
  return { merged, changed };
}

export function arabicRatio(text) {
  const t = String(text ?? '');
  if (!t) return 0;
  const arabic = (t.match(/[\u0600-\u06FF]/g) ?? []).length;
  return arabic / t.length;
}

export function checkLanguageQuality(item) {
  const text = item.content ?? item.text ?? item.description ?? item.answer ?? item.title ?? '';
  const ratio = arabicRatio(text);
  const issues = [];
  if (text.length > 20 && ratio < 0.3) {
    issues.push({ code: 'low_arabic_ratio', message: 'نسبة العربية منخفضة في النص', severity: 'warning' });
  }
  if (text.length > 0 && text.length < 12) {
    issues.push({ code: 'text_too_short', message: 'النص قصير جداً', severity: 'warning' });
  }
  return { ok: issues.filter((i) => i.severity === 'error').length === 0, issues, arabic_ratio: ratio };
}

export function checkFormatting(item) {
  const text = String(item.content ?? item.text ?? item.description ?? item.answer ?? '');
  const issues = [];
  if (/<script|javascript:/i.test(text)) {
    issues.push({ code: 'unsafe_html', message: 'محتوى HTML غير آمن', severity: 'error' });
  }
  if (/\{\{|\}\}|lorem ipsum/i.test(text)) {
    issues.push({ code: 'placeholder_text', message: 'نص placeholder', severity: 'error' });
  }
  if (/\s{10,}/.test(text)) {
    issues.push({ code: 'formatting_whitespace', message: 'تنسيق غير سليم (مسافات زائدة)', severity: 'warning' });
  }
  return { ok: issues.filter((i) => i.severity === 'error').length === 0, issues };
}
