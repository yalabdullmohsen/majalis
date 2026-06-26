import crypto from 'node:crypto';

export function sha256(input) {
  return crypto.createHash('sha256').update(String(input ?? ''), 'utf8').digest('hex');
}

export function slugify(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

export function normalizeArabic(value) {
  return String(value ?? '')
    .replace(/\u0640/g, '')
    .replace(/[\u0622\u0623\u0625\u0671]/g, '\u0627')
    .replace(/\u0629/g, '\u0647')
    .replace(/\u0649/g, '\u064A')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeCity(value) {
  const raw = normalizeArabic(value);
  if (!raw) return 'الكويت';
  if (/العاص|capital/i.test(raw)) return 'العاصمة';
  if (/حول|hawall/i.test(raw)) return 'حولي';
  if (/الفرو|farwan/i.test(raw)) return 'الفروانية';
  if (/الاحمد|ahmad|أحمد/i.test(raw)) return 'الاحمدي';
  if (/الجهر|jahra/i.test(raw)) return 'الجهراء';
  if (/مبارك|mubarak/i.test(raw)) return 'مبارك الكبير';
  if (/غير محدد|unknown/i.test(raw)) return 'الكويت';
  return raw;
}

export function parseDateTime(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export function toIsoDate(date) {
  if (!date) return null;
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

export function toIsoDateTime(date) {
  if (!date) return null;
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function buildExternalKey(sourceId, payload) {
  if (payload.external_key) return String(payload.external_key);
  if (payload.id) return `${sourceId}:${payload.id}`;
  if (payload.source_url) return sha256(`${sourceId}:${payload.source_url}`);
  const basis = [
    sourceId,
    payload.title,
    payload.sheikh ?? payload.sheikh_name ?? payload.speaker_name,
    payload.date,
    payload.time ?? payload.lesson_time,
    payload.location ?? payload.mosque,
    payload.city,
  ]
    .map((part) => normalizeArabic(part))
    .join('|');
  return sha256(basis);
}

export function isExpired(startsAt, endsAt) {
  const end = parseDateTime(endsAt);
  const start = parseDateTime(startsAt);
  const cutoff = end ?? start;
  if (!cutoff) return false;
  return cutoff.getTime() < Date.now();
}

export function safeJsonParse(text, fallback = null) {
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

export function truncate(value, max = 500) {
  const text = String(value ?? '');
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
}
