import crypto from 'node:crypto';

export const VERIFICATION_STATUS = {
  VERIFIED: 'verified',
  NEEDS_REVIEW: 'needs_review',
  REJECTED: 'rejected',
  DUPLICATE: 'duplicate',
  ARCHIVED: 'archived',
};

export const SOURCE_TYPES = [
  'book',
  'website',
  'rss',
  'official',
  'scholar',
  'institution',
  'manuscript',
  'audio',
  'video',
  'other',
];

export const CONTENT_TYPES = [
  'lesson',
  'fawaid',
  'library_item',
  'qa_question',
  'fatwa',
  'sharia_ruling',
  'fiqh_council_item',
  'auto_imported_content',
  'knowledge_item',
  'sheikh',
  'scientific_miracle',
  'annual_course',
  'platform_update',
  'hadith',
  'adhkar',
  'article',
];

export const MIN_TRUST_TO_PUBLISH = 60;
export const MIN_QUALITY_TO_PUBLISH = 70;
export const MIN_COMPLETENESS_TO_PUBLISH = 75;

export function sha256(input) {
  return crypto.createHash('sha256').update(String(input ?? ''), 'utf8').digest('hex');
}

export function normalizeArabic(value) {
  return String(value ?? '')
    .replace(/\u0640/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function contentKey(contentType, contentId) {
  return `${contentType}:${contentId}`;
}

export function fingerprintContent(item) {
  const basis = [
    item.title,
    item.text ?? item.content ?? item.description ?? item.question,
    item.source_url,
    item.source_name,
  ]
    .map((v) => normalizeArabic(v))
    .join('|');
  return sha256(basis);
}
