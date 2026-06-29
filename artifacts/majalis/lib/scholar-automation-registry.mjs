/**
 * Canonical scholar registry for automation — matches kuwait-sheikhs-registry.ts.
 * Used by sheikh-matcher, source monitor, and corpus search (Node/mjs runtime).
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const importSheikhs = JSON.parse(
  readFileSync(resolve(root, "data/import/01-sheikhs.json"), "utf8"),
);
const automationRows = JSON.parse(
  readFileSync(resolve(root, "data/import/scholar-automation-sources.json"), "utf8"),
);

function normalizeName(name) {
  return String(name || "")
    .trim()
    .replace(/^(الشيخ|فضيلة|معالي|د\.|دكتور)\s+/u, "")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function scoreMatch(a, b) {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.85;
  const partsA = na.split(" ");
  const partsB = nb.split(" ");
  const overlap = partsA.filter((p) => partsB.some((q) => q.includes(p) || p.includes(q))).length;
  return overlap / Math.max(partsA.length, partsB.length, 1);
}

function buildRegistry() {
  const bySlug = new Map();
  const byName = new Map();

  for (const row of automationRows) {
    const importRow = importSheikhs.find((s) => scoreMatch(s.name, row.name) >= 0.72) || {};
    const profile = {
      id: row.slug,
      external_key: row.slug,
      name: row.name,
      fullName: row.name,
      country: "الكويت",
      city: importRow.city || undefined,
      bio: importRow.bio || `${row.name} — من مشايخ وعلماء الكويت على منصة المجلس العلمي.`,
      specialties: importRow.specialties || ["علوم شرعية"],
      keywords: [row.name, ...(row.aliases || []), ...(importRow.specialties || [])],
      photo_url: importRow.photo_url || undefined,
      is_verified: importRow.is_verified ?? true,
      status: "published",
      automation_sources: row.sources || [],
      aliases: row.aliases || [],
    };
    bySlug.set(row.slug, profile);
    byName.set(normalizeName(row.name), profile);
    for (const alias of row.aliases || []) {
      byName.set(normalizeName(alias), profile);
    }
  }

  return { bySlug, byName, list: [...bySlug.values()] };
}

const REGISTRY = buildRegistry();

export function getScholarAutomationRegistry() {
  return REGISTRY.list;
}

export function resolveScholarByIdOrSlug(idOrSlug) {
  const raw = String(idOrSlug || "").trim();
  if (!raw) return null;
  return REGISTRY.bySlug.get(raw) || null;
}

export function matchScholarByName(name) {
  const raw = String(name || "").trim();
  if (!raw) return { matched: null, score: 0 };

  const direct = REGISTRY.byName.get(normalizeName(raw));
  if (direct) return { matched: direct, score: 1 };

  let best = null;
  let bestScore = 0;
  for (const profile of REGISTRY.list) {
    const candidates = [profile.name, ...(profile.aliases || [])];
    for (const candidate of candidates) {
      const sc = scoreMatch(raw, candidate);
      if (sc > bestScore) {
        bestScore = sc;
        best = profile;
      }
    }
  }

  if (best && bestScore >= 0.72) {
    return { matched: best, score: bestScore };
  }
  return { matched: null, score: bestScore };
}

export function getAutomationSourcesForScholar(nameOrSlug) {
  const byId = resolveScholarByIdOrSlug(nameOrSlug);
  if (byId) return byId.automation_sources;
  const { matched } = matchScholarByName(nameOrSlug);
  return matched?.automation_sources || [];
}

export function searchRegistryScholars(queryInfo, limit, fuzzyMatch) {
  return REGISTRY.list
    .filter((s) =>
      fuzzyMatch(
        [s.name, s.fullName, s.bio, ...(s.specialties || []), ...(s.keywords || []), ...(s.aliases || [])].join(" "),
        queryInfo,
      ),
    )
    .slice(0, limit);
}
