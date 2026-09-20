#!/usr/bin/env node
/**
 * يبني docs/content-quality/islamic-sects-inventory.json من IslamicSectsPage.tsx
 * + طبقات مراجعة (لا نشر آلي، لا اختراع مصادر).
 *
 * تشغيل: node artifacts/majalis/scripts/build-islamic-sects-inventory.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const majalisRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(majalisRoot, "../..");
const pagePath = path.join(majalisRoot, "src/data/islamic-sects.ts");
const outPath = path.join(
  repoRoot,
  "docs/content-quality/islamic-sects-inventory.json",
);
const taxonomyPath = path.join(
  repoRoot,
  "docs/content-quality/islamic-sects-taxonomy.json",
);

const PUBLICATION_STATES = new Set([
  "DRAFT",
  "NEEDS_SOURCE",
  "SOURCE_VERIFIED",
  "NEEDS_HISTORICAL_REVIEW",
  "NEEDS_SHARIA_REVIEW",
  "NEEDS_LANGUAGE_REVIEW",
  "CONFLICTING_SOURCES",
  "BLOCKED_LICENSE",
  "HUMAN_REVIEWED",
  "PUBLISHED",
  "REJECTED",
]);

/** طبقات مراجعة يدوية لكل id — لا تُنشئ محتوى علميًا جديدًا */
const REVIEW_OVERLAY = {
  "ahl-al-sunna": {
    entityKind: "creedal_school",
    selfDesignation: ["أهل السنة والجماعة", "أهل السنة"],
    externalDesignations: [],
    parentTradition: null,
    inventoryFlags: [
      "pr4_batch1_claim_audit",
      "spread_claim_unverified",
      "founder_field_conflates_prophetic_foundation",
      "beliefs_mix_descriptive_and_normative",
      "quote_needs_hadith_verification_display",
      "no_primary_sources_verified",
      "status_label_undocumented",
    ],
    factualReviewStatus: "NEEDS_SOURCE",
    shariaReviewStatus: "NEEDS_SHARIA_REVIEW",
    languageReviewStatus: "NEEDS_LANGUAGE_REVIEW",
    publicationStatus: "NEEDS_SOURCE",
  },
  ashariyya: {
    entityKind: "creedal_school",
    selfDesignation: ["الأشاعرة", "المدرسة الأشعرية"],
    externalDesignations: [],
    parentTradition: "ahl-al-sunna",
    inventoryFlags: [
      "pr4_batch1_claim_audit",
      "era_needs_source_check",
      "beliefs_oversimplified",
      "spread_claim_unverified",
      "dates_unverified_against_approved_source",
      "no_primary_sources_verified",
      "status_label_undocumented",
    ],
    factualReviewStatus: "NEEDS_HISTORICAL_REVIEW",
    shariaReviewStatus: "NEEDS_SHARIA_REVIEW",
    languageReviewStatus: "NEEDS_LANGUAGE_REVIEW",
    publicationStatus: "NEEDS_HISTORICAL_REVIEW",
  },
  maturidiyya: {
    entityKind: "creedal_school",
    selfDesignation: ["الماتريدية"],
    externalDesignations: [],
    parentTradition: "ahl-al-sunna",
    inventoryFlags: [
      "pr4_batch1_claim_audit",
      "faith_increase_decrease_claim_needs_nuance",
      "spread_claim_unverified",
      "dates_unverified_against_approved_source",
      "no_primary_sources_verified",
      "status_label_undocumented",
    ],
    factualReviewStatus: "NEEDS_HISTORICAL_REVIEW",
    shariaReviewStatus: "NEEDS_SHARIA_REVIEW",
    languageReviewStatus: "NEEDS_LANGUAGE_REVIEW",
    publicationStatus: "NEEDS_HISTORICAL_REVIEW",
  },
  "shia-ithna": {
    entityKind: "shi_i_branch",
    selfDesignation: ["الإمامية", "الاثنا عشرية"],
    externalDesignations: ["الرافضة (تسمية خارجية خلافية)"],
    parentTradition: null,
    inventoryFlags: [
      "pr5_batch2_claim_audit",

      "emergence_reduction_needs_source",
      "fiqh_items_mixed_with_creed",
      "spread_percent_style_claims_absent_but_broad",
    ],
    factualReviewStatus: "NEEDS_SOURCE",
    shariaReviewStatus: "NEEDS_SHARIA_REVIEW",
    languageReviewStatus: "NEEDS_LANGUAGE_REVIEW",
    publicationStatus: "NEEDS_SOURCE",
  },
  zaidiyya: {
    entityKind: "shi_i_branch",
    selfDesignation: ["الزيدية"],
    externalDesignations: [],
    parentTradition: null,
    inventoryFlags: [
      "pr5_batch2_claim_audit",

      "comparative_claim_aqrab_needs_attribution",
      "contemporary_political_link_needs_care",
    ],
    factualReviewStatus: "NEEDS_HISTORICAL_REVIEW",
    shariaReviewStatus: "NEEDS_SHARIA_REVIEW",
    languageReviewStatus: "NEEDS_LANGUAGE_REVIEW",
    publicationStatus: "NEEDS_HISTORICAL_REVIEW",
  },
  ismaeliyya: {
    entityKind: "shi_i_branch",
    selfDesignation: ["الإسماعيلية"],
    externalDesignations: ["السبعية (وصف تاريخي)"],
    parentTradition: null,
    inventoryFlags: [
      "pr5_batch2_claim_audit",
"branches_listed_without_tree", "founder_field_needs_split"],
    factualReviewStatus: "NEEDS_HISTORICAL_REVIEW",
    shariaReviewStatus: "NEEDS_SHARIA_REVIEW",
    languageReviewStatus: "NEEDS_LANGUAGE_REVIEW",
    publicationStatus: "NEEDS_HISTORICAL_REVIEW",
  },
  khawarij: {
    entityKind: "historical_sect",
    selfDesignation: [],
    externalDesignations: ["الخوارج", "أهل الوعيد (تسمية خارجية)"],
    parentTradition: null,
    inventoryFlags: [
      "pr4_batch1_claim_audit",
      "external_pejorative_label_separated",
      "extinction_claim_unverified",
      "ibadiyya_linkage_oversimplified",
      "app_voice_normative_language_softened",
      "no_primary_sources_verified",
      "status_label_undocumented",
    ],
    factualReviewStatus: "NEEDS_SOURCE",
    shariaReviewStatus: "NEEDS_SHARIA_REVIEW",
    languageReviewStatus: "NEEDS_LANGUAGE_REVIEW",
    publicationStatus: "NEEDS_SHARIA_REVIEW",
  },
  ibadiyya: {
    entityKind: "independent_community",
    selfDesignation: ["الإباضية"],
    externalDesignations: ["الخوارج (تسمية يرفضها كثير من الإباضية)"],
    parentTradition: null,
    inventoryFlags: [
      "pr4_batch1_claim_audit",
      "origin_from_khawarij_needs_nuanced_sources",
      "founder_dual_attribution_split",
      "official_madhhab_claim_needs_modern_source",
      "no_primary_sources_verified",
      "status_label_undocumented",
    ],
    factualReviewStatus: "NEEDS_HISTORICAL_REVIEW",
    shariaReviewStatus: "NEEDS_SHARIA_REVIEW",
    languageReviewStatus: "NEEDS_LANGUAGE_REVIEW",
    publicationStatus: "NEEDS_HISTORICAL_REVIEW",
  },
  mutazila: {
    entityKind: "kalam_school",
    selfDesignation: ["المعتزلة", "أصحاب العدل والتوحيد"],
    externalDesignations: [],
    parentTradition: null,
    inventoryFlags: [
      "pr4_batch1_claim_audit",
      "extinction_date_claim_unverified",
      "quote_attribution_removed_pending_source",
      "founder_dual_attribution_split",
      "no_primary_sources_verified",
      "status_label_undocumented",
    ],
    factualReviewStatus: "NEEDS_SOURCE",
    shariaReviewStatus: "NEEDS_SHARIA_REVIEW",
    languageReviewStatus: "NEEDS_LANGUAGE_REVIEW",
    publicationStatus: "NEEDS_SOURCE",
  },
  murjia: {
    entityKind: "historical_sect",
    selfDesignation: [],
    externalDesignations: ["المرجئة"],
    parentTradition: null,
    inventoryFlags: [
      "pr5_batch2_claim_audit",

      "umbrella_label_multiple_streams",
      "jahm_listed_as_scholar_needs_split",
      "no_primary_books",
    ],
    factualReviewStatus: "NEEDS_SOURCE",
    shariaReviewStatus: "NEEDS_SHARIA_REVIEW",
    languageReviewStatus: "NEEDS_LANGUAGE_REVIEW",
    publicationStatus: "NEEDS_SOURCE",
  },
  jahmiyya: {
    entityKind: "historical_sect",
    selfDesignation: [],
    externalDesignations: ["الجهمية"],
    parentTradition: null,
    inventoryFlags: [
      "pr5_batch2_claim_audit",
"no_primary_books", "beliefs_from_critics_only"],
    factualReviewStatus: "NEEDS_SOURCE",
    shariaReviewStatus: "NEEDS_SHARIA_REVIEW",
    languageReviewStatus: "NEEDS_LANGUAGE_REVIEW",
    publicationStatus: "NEEDS_SOURCE",
  },
  sufiyya: {
    entityKind: "sufi_current",
    selfDesignation: ["التصوف", "أهل التصوف"],
    externalDesignations: [],
    parentTradition: "ahl-al-sunna",
    inventoryFlags: [
      "pr5_batch2_claim_audit",

      "not_a_single_sect",
      "taxonomy_mismatch_legacy_sunni_school",
      "normative_accept_reject_in_beliefs",
    ],
    factualReviewStatus: "NEEDS_HISTORICAL_REVIEW",
    shariaReviewStatus: "NEEDS_SHARIA_REVIEW",
    languageReviewStatus: "NEEDS_LANGUAGE_REVIEW",
    publicationStatus: "NEEDS_HISTORICAL_REVIEW",
  },
  athariyya: {
    entityKind: "creedal_school",
    selfDesignation: ["أهل الحديث", "الأثرية", "أهل الأثر"],
    externalDesignations: [],
    parentTradition: "ahl-al-sunna",
    inventoryFlags: [
      "pr5_batch2_claim_audit",
"founder_as_nisba_not_founder", "spread_gulf_claim_unverified"],
    factualReviewStatus: "NEEDS_HISTORICAL_REVIEW",
    shariaReviewStatus: "NEEDS_SHARIA_REVIEW",
    languageReviewStatus: "NEEDS_LANGUAGE_REVIEW",
    publicationStatus: "NEEDS_HISTORICAL_REVIEW",
  },
  deobandiyya: {
    entityKind: "reform_trend",
    selfDesignation: ["الديوبندية"],
    externalDesignations: [],
    parentTradition: "ahl-al-sunna",
    inventoryFlags: [
      "pr5_batch2_claim_audit",
"largest_network_claim_unverified"],
    factualReviewStatus: "NEEDS_SOURCE",
    shariaReviewStatus: "NEEDS_LANGUAGE_REVIEW",
    languageReviewStatus: "NEEDS_LANGUAGE_REVIEW",
    publicationStatus: "NEEDS_SOURCE",
  },
  barelwiyya: {
    entityKind: "sufi_current",
    selfDesignation: ["أهل السنة والجماعة (عند أتباعها في جنوب آسيا)"],
    externalDesignations: ["البريلوية"],
    parentTradition: "ahl-al-sunna",
    inventoryFlags: [
      "pr5_batch2_claim_audit",

      "duplicate_scholar_name",
      "majority_claim_unverified",
      "self_vs_external_name",
    ],
    factualReviewStatus: "NEEDS_SOURCE",
    shariaReviewStatus: "NEEDS_SHARIA_REVIEW",
    languageReviewStatus: "NEEDS_LANGUAGE_REVIEW",
    publicationStatus: "NEEDS_SOURCE",
  },
  "tabligh-jamaat": {
    entityKind: "political_creedal_movement",
    selfDesignation: ["جماعة التبليغ"],
    externalDesignations: [],
    parentTradition: "deobandiyya",
    inventoryFlags: [
      "pr5_batch2_claim_audit",

      "not_a_sect",
      "largest_in_world_claim_unverified",
      "legacy_category_sunni_school_mismatch",
    ],
    factualReviewStatus: "NEEDS_SOURCE",
    shariaReviewStatus: "NEEDS_LANGUAGE_REVIEW",
    languageReviewStatus: "NEEDS_LANGUAGE_REVIEW",
    publicationStatus: "NEEDS_SOURCE",
  },
  "ikhwan-muslimoon": {
    entityKind: "political_creedal_movement",
    selfDesignation: ["الإخوان المسلمون"],
    externalDesignations: [],
    parentTradition: null,
    inventoryFlags: [
      "pr5_batch2_claim_audit",

      "not_a_sect",
      "political_islam_label_needs_care",
      "legacy_category_mismatch",
    ],
    factualReviewStatus: "NEEDS_HISTORICAL_REVIEW",
    shariaReviewStatus: "NEEDS_SHARIA_REVIEW",
    languageReviewStatus: "NEEDS_LANGUAGE_REVIEW",
    publicationStatus: "NEEDS_HISTORICAL_REVIEW",
  },
  qadariyya: {
    entityKind: "historical_sect",
    selfDesignation: [],
    externalDesignations: ["القدرية"],
    parentTradition: null,
    inventoryFlags: [
      "pr5_batch2_claim_audit",

      "hadith_in_beliefs_needs_verification_display",
      "no_books",
      "umbrella_label",
    ],
    factualReviewStatus: "NEEDS_SOURCE",
    shariaReviewStatus: "NEEDS_SHARIA_REVIEW",
    languageReviewStatus: "NEEDS_LANGUAGE_REVIEW",
    publicationStatus: "NEEDS_SOURCE",
  },
  jabriyya: {
    entityKind: "historical_sect",
    selfDesignation: [],
    externalDesignations: ["الجبرية"],
    parentTradition: null,
    inventoryFlags: [
      "pr5_batch2_claim_audit",

      "overlap_with_jahmiyya",
      "normative_implication_in_beliefs",
      "books_are_refutations_not_primary",
    ],
    factualReviewStatus: "NEEDS_SOURCE",
    shariaReviewStatus: "NEEDS_SHARIA_REVIEW",
    languageReviewStatus: "NEEDS_LANGUAGE_REVIEW",
    publicationStatus: "NEEDS_SOURCE",
  },
  karramiyya: {
    entityKind: "historical_sect",
    selfDesignation: ["الكرامية"],
    externalDesignations: [],
    parentTradition: null,
    inventoryFlags: [
      "pr5_batch2_claim_audit",
"extinction_century_unverified", "no_books"],
    factualReviewStatus: "NEEDS_SOURCE",
    shariaReviewStatus: "NEEDS_SHARIA_REVIEW",
    languageReviewStatus: "NEEDS_LANGUAGE_REVIEW",
    publicationStatus: "NEEDS_SOURCE",
  },
  nusayriyya: {
    entityKind: "independent_community",
    selfDesignation: ["العلويون (تسمية معاصرة شائعة)"],
    externalDesignations: ["النصيريون"],
    parentTradition: null,
    inventoryFlags: [
      "pr5_batch2_claim_audit",

      "collective_takfir_in_app_voice",
      "needs_sharia_specialist",
      "no_primary_sources_listed",
    ],
    factualReviewStatus: "NEEDS_SOURCE",
    shariaReviewStatus: "NEEDS_SHARIA_REVIEW",
    languageReviewStatus: "NEEDS_LANGUAGE_REVIEW",
    publicationStatus: "NEEDS_SHARIA_REVIEW",
  },
  shaykhi: {
    entityKind: "shi_i_branch",
    selfDesignation: ["الشيخية"],
    externalDesignations: [],
    parentTradition: "shia-ithna",
    inventoryFlags: [
      "pr5_batch2_claim_audit",
"internal_branch_vs_independent"],
    factualReviewStatus: "NEEDS_HISTORICAL_REVIEW",
    shariaReviewStatus: "NEEDS_SHARIA_REVIEW",
    languageReviewStatus: "NEEDS_LANGUAGE_REVIEW",
    publicationStatus: "NEEDS_HISTORICAL_REVIEW",
  },
  duruz: {
    entityKind: "independent_community",
    selfDesignation: ["الموحّدون الدروز"],
    externalDesignations: ["الدروز"],
    parentTradition: "ismaeliyya",
    inventoryFlags: [
      "pr5_batch2_claim_audit",

      "collective_takfir_in_app_voice",
      "percent_spread_unverified",
      "needs_sharia_specialist",
    ],
    factualReviewStatus: "NEEDS_SOURCE",
    shariaReviewStatus: "NEEDS_SHARIA_REVIEW",
    languageReviewStatus: "NEEDS_LANGUAGE_REVIEW",
    publicationStatus: "NEEDS_SHARIA_REVIEW",
  },
  ahmadiyya: {
    entityKind: "independent_community",
    selfDesignation: ["الأحمدية"],
    externalDesignations: ["القاديانية"],
    parentTradition: null,
    inventoryFlags: [
      "pr5_batch2_claim_audit",

      "collective_takfir_in_app_voice",
      "books_are_refutations_not_self_sources",
      "needs_sharia_specialist",
      "hostile_icon_ui",
    ],
    factualReviewStatus: "NEEDS_SOURCE",
    shariaReviewStatus: "NEEDS_SHARIA_REVIEW",
    languageReviewStatus: "NEEDS_LANGUAGE_REVIEW",
    publicationStatus: "NEEDS_SHARIA_REVIEW",
  },
  sabaiyya: {
    entityKind: "historical_sect",
    selfDesignation: [],
    externalDesignations: ["السبئية"],
    parentTradition: null,
    inventoryFlags: [
      "pr5_batch2_claim_audit",

      "founder_historicity_disputed",
      "conflicting_sources_flag",
      "hadith_in_beliefs",
    ],
    factualReviewStatus: "CONFLICTING_SOURCES",
    shariaReviewStatus: "NEEDS_SHARIA_REVIEW",
    languageReviewStatus: "NEEDS_LANGUAGE_REVIEW",
    publicationStatus: "CONFLICTING_SOURCES",
  },
  kullabiyya: {
    entityKind: "kalam_school",
    selfDesignation: ["الكلابية"],
    externalDesignations: [],
    parentTradition: null,
    inventoryFlags: [
      "pr5_batch2_claim_audit",
"lost_works", "bridge_to_ashari_claim_needs_source"],
    factualReviewStatus: "NEEDS_SOURCE",
    shariaReviewStatus: "NEEDS_SHARIA_REVIEW",
    languageReviewStatus: "NEEDS_LANGUAGE_REVIEW",
    publicationStatus: "NEEDS_SOURCE",
  },
  "islah-hadith": {
    entityKind: "reform_trend",
    selfDesignation: ["الإصلاح الإسلامي", "التجديد"],
    externalDesignations: [],
    parentTradition: null,
    inventoryFlags: [
      "pr5_batch2_claim_audit",
"not_a_sect", "umbrella_modern_trend", "legacy_category_mismatch"],
    factualReviewStatus: "NEEDS_HISTORICAL_REVIEW",
    shariaReviewStatus: "NEEDS_LANGUAGE_REVIEW",
    languageReviewStatus: "NEEDS_LANGUAGE_REVIEW",
    publicationStatus: "NEEDS_HISTORICAL_REVIEW",
  },
  "falsafa-islamiyya": {
    entityKind: "philosophical_school",
    selfDesignation: [],
    externalDesignations: ["الفلاسفة"],
    parentTradition: null,
    inventoryFlags: [
      "pr5_batch2_claim_audit",

      "not_a_sect",
      "multi_century_umbrella",
      "normative_rejection_in_beliefs",
    ],
    factualReviewStatus: "NEEDS_HISTORICAL_REVIEW",
    shariaReviewStatus: "NEEDS_SHARIA_REVIEW",
    languageReviewStatus: "NEEDS_LANGUAGE_REVIEW",
    publicationStatus: "NEEDS_HISTORICAL_REVIEW",
  },
  babiyya: {
    entityKind: "independent_community",
    selfDesignation: ["البابية"],
    externalDesignations: [],
    parentTradition: "shaykhi",
    inventoryFlags: [
      "pr5_batch2_claim_audit",

      "collective_takfir_in_app_voice",
      "needs_sharia_specialist",
      "hostile_icon_ui",
    ],
    factualReviewStatus: "NEEDS_SOURCE",
    shariaReviewStatus: "NEEDS_SHARIA_REVIEW",
    languageReviewStatus: "NEEDS_LANGUAGE_REVIEW",
    publicationStatus: "NEEDS_SHARIA_REVIEW",
  },
  "mahdiyya-sudaniyya": {
    entityKind: "political_creedal_movement",
    selfDesignation: ["الأنصار (لاحقاً)"],
    externalDesignations: ["المهدية"],
    parentTradition: null,
    inventoryFlags: [
      "pr5_batch2_claim_audit",

      "movement_vs_sect",
      "normative_rejection_in_beliefs",
      "quote_needs_source_context",
    ],
    factualReviewStatus: "NEEDS_HISTORICAL_REVIEW",
    shariaReviewStatus: "NEEDS_SHARIA_REVIEW",
    languageReviewStatus: "NEEDS_LANGUAGE_REVIEW",
    publicationStatus: "NEEDS_HISTORICAL_REVIEW",
  },
  "baha-i": {
    entityKind: "independent_community",
    selfDesignation: ["البهائية"],
    externalDesignations: [],
    parentTradition: "babiyya",
    inventoryFlags: [
      "pr5_batch2_claim_audit",

      "religion_vs_islamic_sect_taxonomy",
      "collective_takfir_in_app_voice",
      "needs_sharia_specialist",
      "hostile_icon_ui",
    ],
    factualReviewStatus: "NEEDS_SOURCE",
    shariaReviewStatus: "NEEDS_SHARIA_REVIEW",
    languageReviewStatus: "NEEDS_LANGUAGE_REVIEW",
    publicationStatus: "NEEDS_SHARIA_REVIEW",
  },
  "ansar-sunna": {
    entityKind: "reform_trend",
    selfDesignation: ["أنصار السنة المحمدية"],
    externalDesignations: [],
    parentTradition: "ahl-al-sunna",
    inventoryFlags: [
      "pr5_batch2_claim_audit",
"organization_not_sect", "wahhabi_cooperation_label_needs_care"],
    factualReviewStatus: "NEEDS_HISTORICAL_REVIEW",
    shariaReviewStatus: "NEEDS_LANGUAGE_REVIEW",
    languageReviewStatus: "NEEDS_LANGUAGE_REVIEW",
    publicationStatus: "NEEDS_HISTORICAL_REVIEW",
  },
  "maqasid-school": {
    entityKind: "fiqh_methodology",
    selfDesignation: ["المقاصديون (وصف معاصر)"],
    externalDesignations: [],
    parentTradition: null,
    inventoryFlags: [
      "pr5_batch2_claim_audit",

      "not_a_sect",
      "legacy_category_sunni_school_mismatch",
      "classical_vs_modern_conflation",
    ],
    factualReviewStatus: "NEEDS_HISTORICAL_REVIEW",
    shariaReviewStatus: "NEEDS_LANGUAGE_REVIEW",
    languageReviewStatus: "NEEDS_LANGUAGE_REVIEW",
    publicationStatus: "NEEDS_HISTORICAL_REVIEW",
  },
  ishraqiyya: {
    entityKind: "philosophical_school",
    selfDesignation: ["الإشراقية"],
    externalDesignations: [],
    parentTradition: null,
    inventoryFlags: [
      "pr5_batch2_claim_audit",
"not_a_sect", "influence_alive_vs_status_historical"],
    factualReviewStatus: "NEEDS_HISTORICAL_REVIEW",
    shariaReviewStatus: "NEEDS_SHARIA_REVIEW",
    languageReviewStatus: "NEEDS_LANGUAGE_REVIEW",
    publicationStatus: "NEEDS_HISTORICAL_REVIEW",
  },
  wasatiyya: {
    entityKind: "contemporary_trend",
    selfDesignation: ["الوسطية"],
    externalDesignations: [],
    parentTradition: null,
    inventoryFlags: [
      "pr5_batch2_claim_audit",

      "not_a_sect",
      "political_figure_as_key_scholar",
      "umbrella_slogan",
    ],
    factualReviewStatus: "NEEDS_SOURCE",
    shariaReviewStatus: "NEEDS_SHARIA_REVIEW",
    languageReviewStatus: "NEEDS_LANGUAGE_REVIEW",
    publicationStatus: "NEEDS_SOURCE",
  },
};

function extractStringArray(block, key) {
  const re = new RegExp(`${key}:\\s*\\[([\\s\\S]*?)\\]`, "m");
  const m = block.match(re);
  if (!m) return [];
  return [...m[1].matchAll(/"((?:\\.|[^"\\])*)"/g)].map((x) =>
    x[1].replace(/\\"/g, '"'),
  );
}

function extractField(block, key) {
  const re = new RegExp(`${key}:\\s*"((?:\\\\.|[^"\\\\])*)"`, "m");
  const m = block.match(re);
  return m ? m[1].replace(/\\"/g, '"') : "";
}

function extractOptionalQuote(block) {
  const m = block.match(/quote:\s*"((?:\\.|[^"\\])*)"/m);
  return m ? m[1].replace(/\\"/g, '"') : null;
}

function parseSects(src) {
  const start = src.indexOf("export const ISLAMIC_SECTS: IslamicSect[] = [");
  if (start < 0) throw new Error("ISLAMIC_SECTS array not found");
  const end = src.indexOf("\n];\n", start);
  if (end < 0) throw new Error("ISLAMIC_SECTS array end not found");
  const body = src.slice(start, end);
  const blocks = body.split(/\n  \{\n/).slice(1);
  const sects = [];
  for (const raw of blocks) {
    const block = raw.includes("\n  },") ? raw : raw;
    const id = extractField(block, "id");
    if (!id) continue;
    sects.push({
      id,
      name: extractField(block, "name"),
      fullName: extractField(block, "fullName"),
      category: extractField(block, "category"),
      era: extractField(block, "era"),
      origin: extractField(block, "origin"),
      founder: extractField(block, "founder"),
      foundingCause: extractField(block, "foundingCause"),
      keyBeliefs: extractStringArray(block, "keyBeliefs"),
      keyBooks: extractStringArray(block, "keyBooks"),
      keyScholars: extractStringArray(block, "keyScholars"),
      status: extractField(block, "status"),
      spread: extractField(block, "spread"),
      quote: extractOptionalQuote(block),
    });
  }
  return sects;
}

function mapUiStatus(label) {
  if (label === "تاريخية") return "undocumented";
  if (label === "قائمة") return "undocumented";
  return "undocumented";
}

function buildRecord(sect) {
  const overlay = REVIEW_OVERLAY[sect.id];
  if (!overlay) {
    throw new Error(`Missing REVIEW_OVERLAY for ${sect.id}`);
  }
  for (const st of [
    overlay.factualReviewStatus,
    overlay.shariaReviewStatus,
    overlay.languageReviewStatus,
    overlay.publicationStatus,
  ]) {
    if (!PUBLICATION_STATES.has(st)) {
      throw new Error(`Invalid status ${st} for ${sect.id}`);
    }
  }
  if (overlay.publicationStatus === "PUBLISHED") {
    throw new Error(
      `AI/script must not set PUBLISHED for ${sect.id} — human review required`,
    );
  }

  const alternateNames = [
    ...new Set(
      [sect.fullName, sect.name, ...overlay.selfDesignation, ...overlay.externalDesignations]
        .filter(Boolean)
        .filter((n) => n !== sect.name),
    ),
  ];

  return {
    id: sect.id,
    slug: sect.id,
    canonicalName: sect.name,
    alternateNames,
    selfDesignation: overlay.selfDesignation,
    externalDesignations: overlay.externalDesignations,
    parentTradition: overlay.parentTradition,
    entityKind: overlay.entityKind,
    legacyUiCategory: sect.category,
    classification: overlay.entityKind,
    historicalStatus: mapUiStatus(sect.status),
    contemporaryStatus: null,
    emergencePeriod: sect.era || null,
    emergencePlace: sect.origin || null,
    attributedFounder: sect.founder || null,
    keyHistoricalFigures: sect.keyScholars,
    summary: sect.foundingCause || null,
    historicalContext: null,
    coreDoctrines: sect.keyBeliefs,
    internalBranches: [],
    geographicSpreadHistorical: null,
    geographicSpreadCurrent: sect.spread || null,
    primarySources: [],
    secondarySources: sect.keyBooks,
    attributedCritiques: [],
    quotations: sect.quote ? [sect.quote] : [],
    sourceReferences: [],
    sourceUrls: [],
    licenseStatus: "unknown",
    factualReviewStatus: overlay.factualReviewStatus,
    shariaReviewStatus: overlay.shariaReviewStatus,
    languageReviewStatus: overlay.languageReviewStatus,
    reviewer: null,
    reviewedAt: null,
    publicationStatus: overlay.publicationStatus,
    uiSource: {
      file: "artifacts/majalis/src/data/islamic-sects.ts",
      era: sect.era,
      origin: sect.origin,
      founder: sect.founder,
      statusLabel: sect.status,
      spread: sect.spread,
      keyBeliefsCount: sect.keyBeliefs.length,
      keyBooksCount: sect.keyBooks.length,
      hasQuote: Boolean(sect.quote),
    },
    inventoryFlags: overlay.inventoryFlags,
  };
}

function deriveEraBucket(era) {
  if (!era) return "غير محدد";
  if (/القرن الأول|من القرن الأول|1\s*هـ|الفتنة الأولى|صفين/.test(era))
    return "القرن الأول الهجري";
  if (/القرن الثاني|2\s*هـ|اعتزال واصل/.test(era)) return "القرن الثاني الهجري";
  if (/القرن الثالث|3\s*هـ/.test(era)) return "القرن الثالث الهجري";
  if (/القرن الرابع|4\s*هـ/.test(era)) return "القرن الرابع الهجري";
  if (/القرن الخامس|5\s*هـ/.test(era)) return "القرن الخامس الهجري";
  if (/القرن السادس|6\s*هـ/.test(era)) return "القرن السادس الهجري";
  if (
    /القرن التاسع|القرن الثالث عشر|القرن الرابع عشر|القرن التاسع عشر|القرن العشرون|الحادي والعشرون|ميلاد|م —|م\)/.test(
      era,
    )
  ) {
    return "حديث / معاصر";
  }
  return "فترات أخرى";
}

function main() {
  const taxonomy = JSON.parse(fs.readFileSync(taxonomyPath, "utf8"));
  const pageSrc = fs.readFileSync(pagePath, "utf8");
  const sects = parseSects(pageSrc);
  if (sects.length < 1) throw new Error("No sects parsed");

  const records = sects.map(buildRecord);
  const slugs = new Set();
  for (const r of records) {
    if (slugs.has(r.slug)) throw new Error(`Duplicate slug ${r.slug}`);
    slugs.add(r.slug);
    if (!taxonomy.entityKinds.some((k) => k.id === r.entityKind)) {
      throw new Error(`Unknown entityKind ${r.entityKind} for ${r.id}`);
    }
    if (r.publicationStatus === "PUBLISHED") {
      throw new Error(`PUBLISHED forbidden in automated build for ${r.id}`);
    }
  }

  const publishedCount = records.filter(
    (r) => r.publicationStatus === "PUBLISHED",
  ).length;
  const doc = {
    version: 1,
    generatedAt: new Date().toISOString(),
    policy:
      "no_ai_invention_no_memory_completion_no_auto_publish_human_review_required",
    sourceOfTruthUi: "artifacts/majalis/src/data/islamic-sects.ts",
    route: "/islamic-sects",
    recordCount: records.length,
    publishedCount,
    hiddenCount: records.length - publishedCount,
    taxonomyRef: "docs/content-quality/islamic-sects-taxonomy.json",
    records,
  };

  fs.writeFileSync(outPath, `${JSON.stringify(doc, null, 2)}\n`, "utf8");

  /** ملخص عام للقائمة — بلا معتقدات/اقتباسات/كتب كاملة (حجم الحزمة). */
  const publicMeta = {
    version: 1,
    generatedAt: doc.generatedAt,
    policy: doc.policy,
    records: records.map((r) => ({
      id: r.id,
      publicationStatus: r.publicationStatus,
      entityKind: r.entityKind,
      historicalStatus: r.historicalStatus,
      alternateNames: r.alternateNames,
      selfDesignation: r.selfDesignation,
      externalDesignations: r.externalDesignations,
      eraBucket: deriveEraBucket(r.emergencePeriod),
      searchKeywords: [
        r.canonicalName,
        ...r.alternateNames,
        ...r.selfDesignation,
        ...r.externalDesignations,
        r.summary || "",
      ].filter(Boolean),
    })),
  };
  const publicMetaPath = path.join(
    majalisRoot,
    "src/data/islamic-sects-public-meta.json",
  );
  fs.writeFileSync(
    publicMetaPath,
    `${JSON.stringify(publicMeta, null, 2)}\n`,
    "utf8",
  );

  console.log(
    `islamic-sects-inventory: records=${doc.recordCount} published=${doc.publishedCount} hidden=${doc.hiddenCount}`,
  );
  console.log(
    `islamic-sects-public-meta: ${publicMeta.records.length} summary rows → ${path.relative(repoRoot, publicMetaPath)}`,
  );
}

main();
