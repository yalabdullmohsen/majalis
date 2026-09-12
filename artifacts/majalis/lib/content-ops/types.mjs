/**
 * Sunnah Content Ops — shared types / constants (P0).
 * Brand: سُنّة — never use legacy public product names in reports/UI strings.
 */

export const BRAND = "سُنّة";
export const SYSTEM_NAME = "Sunnah Autonomous Content Operations System";

/** @typedef {"A"|"B"|"C"} RiskLevel */

/** @typedef {"proposed"|"validated"|"quarantined"|"staging"|"published"|"rolled_back"|"blocked"|"needs_specialist_review"|"needs_source"} ChangeStatus */

export const RISK_LEVELS = Object.freeze({
  A: "A",
  B: "B",
  C: "C",
});

export const CHANGE_KINDS_A = Object.freeze([
  "trim_whitespace",
  "unify_punctuation_editorial",
  "clear_spelling_non_sacred",
  "unify_dates_numbers",
  "remove_empty_display_fields",
  "fix_internal_link_deterministic",
  "http_to_https_same_host",
  "exact_duplicate_merge_after_relations",
  "rebuild_search_index_delta",
  "cache_temp_cleanup",
  "mark_dead_link_status",
  "tech_metadata_fix",
  "ui_label_non_semantic",
  "time_data_from_official_api_exact",
  "archive_event_with_clear_end_date",
]);

export const CHANGE_KINDS_B = Object.freeze([
  "broad_editorial_rewrite",
  "long_description_rewrite",
  "fuzzy_record_merge",
  "content_reclassification",
  "institution_blurb_update",
  "historical_date_change",
  "alternate_source_suggestion",
  "inferred_relation",
  "non_exact_factual_correction",
]);

export const CHANGE_KINDS_C = Object.freeze([
  "quran_text",
  "uthmani",
  "tashkeel",
  "ayah_numbers",
  "surah_order",
  "mushaf_pages",
  "hadith_matn",
  "narrator",
  "takhrij",
  "hadith_grade",
  "fatwa",
  "fiqh_ruling",
  "aqeedah",
  "scholar_attribution",
  "disputed_history",
  "fadaail",
  "adhkar_reference",
  "dua_reference",
  "tafsir",
]);
