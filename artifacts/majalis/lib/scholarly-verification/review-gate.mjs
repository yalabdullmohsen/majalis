import {
  MIN_COMPLETENESS_TO_PUBLISH,
  MIN_QUALITY_TO_PUBLISH,
  MIN_TRUST_TO_PUBLISH,
  VERIFICATION_STATUS,
  fingerprintContent,
  normalizeArabic,
} from './utils.mjs';
import {
  validateProvenance,
  extractProvenance,
  checkLanguageQuality,
  checkFormatting,
} from './provenance.mjs';

export async function checkLink(url, timeoutMs = 8000) {
  if (!url || !/^https?:\/\//i.test(url)) {
    return { ok: false, status: 'invalid', http_status: null };
  }
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': 'MajalisScientific/1.0 (+https://majlisilm.com)' },
    });
    clearTimeout(timer);
    const ok = response.status >= 200 && response.status < 400;
    return {
      ok,
      status: ok ? 'ok' : 'broken',
      http_status: response.status,
      final_url: response.url,
    };
  } catch {
    return { ok: false, status: 'broken', http_status: null };
  }
}

export function checkCompleteness(item) {
  const fields = ['title', 'content', 'text', 'description', 'question', 'answer', 'category'];
  const filled = fields.filter((f) => {
    const v = item[f];
    return v !== undefined && v !== null && String(v).trim() !== '';
  }).length;
  const score = Math.round((filled / fields.length) * 100);
  const issues = [];
  if (!item.title?.trim() && !item.question?.trim() && !item.text?.trim()) {
    issues.push({ code: 'missing_title', message: 'العنوان/النص الرئيسي مفقود', severity: 'error' });
  }
  if (!item.category?.trim()) {
    issues.push({ code: 'missing_category', message: 'التصنيف مفقود', severity: 'warning' });
  }
  return { score, issues };
}

export function checkDuplicate(item, seenHashes = new Set()) {
  const hash = fingerprintContent(item);
  if (seenHashes.has(hash)) {
    return {
      duplicate: true,
      hash,
      issue: { code: 'duplicate', message: 'محتوى مكرر', severity: 'error' },
    };
  }
  seenHashes.add(hash);
  return { duplicate: false, hash };
}

export async function runReviewGate(item, context = {}) {
  const checks = [];
  const errors = [];
  const warnings = [];

  const provenance = extractProvenance(item, context.defaults);
  const provResult = validateProvenance(provenance);
  checks.push({ name: 'provenance', passed: provResult.valid, details: provResult });
  errors.push(...provResult.errors);
  warnings.push(...provResult.warnings);

  const completeness = checkCompleteness(item);
  checks.push({
    name: 'completeness',
    passed: completeness.score >= MIN_COMPLETENESS_TO_PUBLISH,
    score: completeness.score,
  });
  errors.push(...completeness.issues.filter((i) => i.severity === 'error'));
  warnings.push(...completeness.issues.filter((i) => i.severity === 'warning'));

  const dup = checkDuplicate(item, context.seenHashes);
  checks.push({ name: 'duplicate', passed: !dup.duplicate });
  if (dup.duplicate) errors.push(dup.issue);

  if (context.checkLinks !== false && provenance.source_url) {
    const link = await checkLink(provenance.source_url);
    checks.push({ name: 'source_link', passed: link.ok, link });
    if (!link.ok) {
      warnings.push({ code: 'broken_link', message: 'رابط المصدر معطل', severity: 'warning' });
    }
  }

  const lang = checkLanguageQuality(item);
  checks.push({ name: 'language', passed: lang.ok });
  warnings.push(...lang.issues);

  const fmt = checkFormatting(item);
  checks.push({ name: 'formatting', passed: fmt.ok });
  errors.push(...fmt.issues.filter((i) => i.severity === 'error'));
  warnings.push(...fmt.issues.filter((i) => i.severity === 'warning'));

  const categoryOk = Boolean(item.category?.trim());
  checks.push({ name: 'category', passed: categoryOk });
  if (!categoryOk) warnings.push({ code: 'category', message: 'التصنيف ناقص', severity: 'warning' });

  let qualityScore = completeness.score;
  if (provResult.valid) qualityScore += 15;
  if (lang.ok) qualityScore += 10;
  if (fmt.ok) qualityScore += 10;
  if (categoryOk) qualityScore += 5;
  qualityScore = Math.min(100, Math.round(qualityScore));

  const trustLevel = provenance.trust_level ?? 50;
  const canPublish =
    errors.length === 0 &&
    qualityScore >= MIN_QUALITY_TO_PUBLISH &&
    provResult.completeness_score >= MIN_COMPLETENESS_TO_PUBLISH &&
    trustLevel >= MIN_TRUST_TO_PUBLISH &&
    !dup.duplicate;

  const verification_status = canPublish
    ? VERIFICATION_STATUS.VERIFIED
    : dup.duplicate
      ? VERIFICATION_STATUS.DUPLICATE
      : errors.length > 0
        ? VERIFICATION_STATUS.REJECTED
        : VERIFICATION_STATUS.NEEDS_REVIEW;

  return {
    passed: canPublish,
    can_publish: canPublish,
    verification_status,
    quality_score: qualityScore,
    completeness_score: provResult.completeness_score,
    trust_level: trustLevel,
    provenance,
    checks,
    errors,
    warnings,
    content_hash: dup.hash ?? fingerprintContent(item),
  };
}

export function diffObjects(before, after, fields) {
  const changes = [];
  for (const field of fields) {
    const b = normalizeArabic(before?.[field] ?? '');
    const a = normalizeArabic(after?.[field] ?? '');
    if (b !== a) changes.push({ field, before: before?.[field], after: after?.[field] });
  }
  return changes;
}
