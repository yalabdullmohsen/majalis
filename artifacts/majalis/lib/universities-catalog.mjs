/**
 * كتالوج الجامعات الشرعية الموثّق — يُستخدم كاحتياط عندما تكون جداول
 * Supabase فارغة أو غير مُنشأة، حتى يظهر الدليل فور النشر.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CATALOG_PATH = join(__dirname, "../src/data/universities-catalog.json");

let _cache = null;

function loadRaw() {
  if (_cache) return _cache;
  _cache = JSON.parse(readFileSync(CATALOG_PATH, "utf8"));
  return _cache;
}

function stableId(prefix, slug, extra = "") {
  const key = `${prefix}:${slug}:${extra}`;
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  const hex = h.toString(16).padStart(8, "0");
  return `${prefix}-${slug.slice(0, 24)}-${hex}`;
}

function toUniversity(raw, { includeInactive = false } = {}) {
  const id = stableId("univ", raw.slug);
  const programs = (raw.programs || []).map((p, i) => {
    const pid = stableId("prog", raw.slug, `${p.program_name}:${i}`);
    return {
      id: pid,
      university_id: id,
      program_name: p.program_name,
      faculty_department: p.faculty_department || "",
      specialization: p.specialization || "",
      degree_level: p.degree_level,
      study_language: p.study_language || "العربية",
      study_mode: p.study_mode || "حضوري",
      duration: p.duration || "",
      tuition_fees: null,
      currency: p.currency || "SAR",
      has_scholarship: !!p.has_scholarship,
      scholarship_details: p.scholarship_details || "",
      is_active: true,
      admission_requirements: [],
    };
  });

  const faqs = (raw.faqs || []).map((f, i) => ({
    id: stableId("faq", raw.slug, `${f.order_index || i}:${f.question}`),
    university_id: id,
    question: f.question,
    answer: f.answer,
    order_index: f.order_index ?? i + 1,
  }));

  return {
    id,
    slug: raw.slug,
    name_ar: raw.name_ar,
    name_en: raw.name_en || "",
    country: raw.country,
    city: raw.city || "",
    logo_url: raw.logo_url || "",
    about: raw.about || "",
    website_url: raw.website_url || "",
    social_links: raw.social_links || {},
    accreditation_status: raw.accreditation_status || "unknown",
    is_verified: !!raw.is_verified,
    is_published: raw.is_published !== false,
    last_updated_at: raw.last_updated_at || "2026-07-27T00:00:00.000Z",
    last_reviewed_by: raw.last_reviewed_by || "تحقق مباشر — 2026-07-27",
    created_at: raw.created_at || "2026-07-27T00:00:00.000Z",
    university_programs: includeInactive ? programs : programs.filter((p) => p.is_active),
    university_faqs: faqs.sort((a, b) => a.order_index - b.order_index),
  };
}

export function getCatalogUniversities() {
  return loadRaw().map((u) => toUniversity(u));
}

export function getCatalogCountries() {
  return [...new Set(loadRaw().map((u) => u.country))].sort((a, b) => a.localeCompare(b, "ar"));
}

export function getCatalogBySlug(slug) {
  const raw = loadRaw().find((u) => u.slug === slug);
  return raw ? toUniversity(raw) : null;
}

export function filterCatalog(q = {}) {
  const {
    country,
    degree_level,
    study_mode,
    has_scholarship,
    study_language,
    is_verified,
    search,
    limit = 50,
    offset = 0,
  } = q;

  let items = getCatalogUniversities();

  if (country) items = items.filter((u) => u.country === country);
  if (is_verified === true || is_verified === "true") {
    items = items.filter((u) => u.is_verified);
  }
  if (search) {
    const s = String(search).trim().toLowerCase();
    items = items.filter((u) => {
      const blob = [
        u.name_ar,
        u.name_en,
        u.country,
        u.city,
        u.about,
        ...(u.university_programs || []).flatMap((p) => [
          p.program_name,
          p.specialization,
          p.faculty_department,
        ]),
      ]
        .join(" ")
        .toLowerCase();
      return blob.includes(s);
    });
  }

  items = items.map((u) => {
    let programs = u.university_programs || [];
    if (degree_level) programs = programs.filter((p) => p.degree_level === degree_level);
    if (study_mode) programs = programs.filter((p) => p.study_mode === study_mode);
    if (study_language) programs = programs.filter((p) => p.study_language === study_language);
    if (has_scholarship === true || has_scholarship === "true") {
      programs = programs.filter((p) => p.has_scholarship);
    }
    return { ...u, university_programs: programs };
  });

  if (degree_level || study_mode || study_language || has_scholarship === true || has_scholarship === "true") {
    items = items.filter((u) => (u.university_programs || []).length > 0);
  }

  items.sort((a, b) => a.name_ar.localeCompare(b.name_ar, "ar"));
  const total = items.length;
  const sliced = items.slice(Number(offset) || 0, (Number(offset) || 0) + (Number(limit) || 50));
  return { items: sliced, total, from_catalog: true };
}
