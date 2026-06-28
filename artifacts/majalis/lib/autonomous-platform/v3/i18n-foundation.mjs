/**
 * AKP v3 — Multi-Language Foundation.
 */
export const SUPPORTED_LANGUAGES = [
  { code: "ar", label: "العربية", rtl: true, default: true },
  { code: "en", label: "English", rtl: false },
  { code: "fr", label: "Français", rtl: false },
  { code: "es", label: "Español", rtl: false },
  { code: "ur", label: "اردو", rtl: true },
  { code: "id", label: "Bahasa Indonesia", rtl: false },
];

export function normalizeLanguageCode(code) {
  const c = String(code || "ar").trim().toLowerCase().slice(0, 2);
  return SUPPORTED_LANGUAGES.some((l) => l.code === c) ? c : "ar";
}

export function getLanguageMeta(code) {
  return SUPPORTED_LANGUAGES.find((l) => l.code === normalizeLanguageCode(code)) || SUPPORTED_LANGUAGES[0];
}

export function resolveContentLanguages(record, fallback = "ar") {
  if (Array.isArray(record.supported_languages) && record.supported_languages.length) {
    return record.supported_languages.map(normalizeLanguageCode);
  }
  if (record.language) return [normalizeLanguageCode(record.language)];
  return [normalizeLanguageCode(fallback)];
}

export function buildI18nPayload(baseRecord, translations = {}) {
  const out = { ...baseRecord, i18n: {} };
  for (const [lang, fields] of Object.entries(translations)) {
    const code = normalizeLanguageCode(lang);
    out.i18n[code] = fields;
  }
  out.supported_languages = Object.keys(out.i18n).length
    ? Object.keys(out.i18n)
    : resolveContentLanguages(baseRecord);
  return out;
}

export function pickLocalizedField(record, field, locale = "ar") {
  const code = normalizeLanguageCode(locale);
  if (code === "ar") return record[field];
  return record.i18n?.[code]?.[field] || record[field];
}
