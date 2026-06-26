import { normalizeArabic, parseDateTime, isExpired } from './utils.mjs';

export function validateLessonDraft(draft) {
  const errors = [];
  const warnings = [];

  if (!draft) {
    return { valid: false, errors: ['missing_draft'], warnings: [], completeness_score: 0 };
  }

  if (!draft.title || !String(draft.title).trim()) errors.push('missing_title');
  if (!draft.sheikh || !String(draft.sheikh).trim()) errors.push('missing_sheikh');
  if (!draft.time || !String(draft.time).trim()) errors.push('missing_time');
  if (!draft.location || !String(draft.location).trim()) errors.push('missing_location');
  if (!draft.city || !String(draft.city).trim()) errors.push('missing_city');

  const hasSchedule = Boolean(draft.day || draft.date || draft.starts_at);
  if (!hasSchedule) errors.push('missing_schedule');

  if (draft.source_url && !/^https?:\/\//i.test(String(draft.source_url))) {
    errors.push('invalid_source_url');
  }

  if (draft.date || draft.starts_at) {
    const startsAt = parseDateTime(draft.starts_at ?? draft.date);
    if (!startsAt && draft.date) errors.push('invalid_date');
    else if (isExpired(startsAt, draft.ends_at) && !draft.is_recurring) {
      warnings.push('already_expired');
    }
  }

  if (!draft.external_key) errors.push('missing_external_key');
  if (!draft.source_id) errors.push('missing_source_id');

  const title = normalizeArabic(draft.title);
  if (title && title.length < 4) errors.push('title_too_short');

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    completeness_score: computeCompleteness(draft),
  };
}

function computeCompleteness(draft) {
  const fields = [
    'title',
    'sheikh',
    'date',
    'day',
    'time',
    'location',
    'city',
    'source_url',
    'description',
    'live_url',
    'maps_url',
    'category',
  ];
  const filled = fields.filter((field) => {
    const value = draft[field];
    return value !== undefined && value !== null && String(value).trim() !== '' && value !== '—';
  }).length;
  return Math.round((filled / fields.length) * 100);
}

export function canPublish(draft, validation) {
  if (!validation?.valid) return false;
  if (validation.warnings.includes('already_expired')) return false;
  return validation.completeness_score >= 60;
}
