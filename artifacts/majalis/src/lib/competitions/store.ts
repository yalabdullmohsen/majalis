import { canPublishCompetition } from "./publish";
import type { CompetitionFilterId, ExternalCompetition } from "./types";

/** يُملأ لاحقًا من الأتمتة (`automation` / `importedSources`). */
const IMPORTED_FROM_AUTOMATION: ExternalCompetition[] = [];

/** عينات تطوير فقط — لا تُعرض في الإنتاج. */
const DEV_DEMO_ONLY: ExternalCompetition[] = [
  {
    id: "demo-mahir-quran",
    title: "مسابقة الماهر بالقرآن (عرض تجريبي)",
    organizerName: "جهة موثوقة — تجريبي",
    sourceName: "importedSources",
    sourceUrl: "https://example.com/demo-mahir",
    description: "عينة تطوير فقط — لا تظهر في الإنتاج.",
    competitionType: "quran_memorization",
    category: "quran",
    genderTarget: "الكل",
    prizeText: "جوائز عينية ومعنوية",
    registrationStatus: "مفتوح",
    registrationUrl: "https://example.com/demo-mahir/register",
    isRemote: true,
    tags: ["قرآن", "حفظ", "الماهر", "demo"],
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
    sourcePlatform: "demo",
  },
];

function isDevRuntime(): boolean {
  try {
    return Boolean(import.meta.env?.DEV);
  } catch {
    return false;
  }
}

export function listPublishedCompetitions(): ExternalCompetition[] {
  const imported = IMPORTED_FROM_AUTOMATION.filter(canPublishCompetition);
  if (imported.length > 0) return imported;
  if (isDevRuntime()) return DEV_DEMO_ONLY.filter(canPublishCompetition);
  return [];
}

export function countPublishedCompetitions(): number {
  return listPublishedCompetitions().length;
}

export function getCompetitionById(id: string): ExternalCompetition | undefined {
  return listPublishedCompetitions().find((c) => c.id === id);
}

export function filterCompetitions(
  items: ExternalCompetition[],
  filter: CompetitionFilterId,
): ExternalCompetition[] {
  switch (filter) {
    case "quran":
      return items.filter((c) => c.category === "quran");
    case "hadith":
      return items.filter((c) => c.category === "hadith");
    case "tajweed":
      return items.filter((c) => c.category === "tajweed" || c.competitionType === "tajweed");
    case "prizes":
      return items.filter((c) => Boolean((c.prizeText || "").trim()));
    case "open":
      return items.filter((c) => c.registrationStatus === "مفتوح");
    case "men":
      return items.filter((c) => c.genderTarget === "رجال" || c.genderTarget === "الكل");
    case "women":
      return items.filter(
        (c) =>
          c.genderTarget === "نساء" ||
          c.competitionType === "women_competition" ||
          c.category === "women",
      );
    case "remote":
      return items.filter((c) => c.isRemote);
    case "all":
    default:
      return items;
  }
}

export function formatCompetitionDate(iso?: string): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return undefined;
  try {
    return new Intl.DateTimeFormat("ar", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(d);
  } catch {
    return iso.slice(0, 10);
  }
}

export function buildCompetitionShareText(c: ExternalCompetition): string {
  const lines = [c.title, `المنظّم: ${c.organizerName}`];
  if (c.prizeText) lines.push(`الجوائز: ${c.prizeText}`);
  if (c.registrationDeadline) {
    const dl = formatCompetitionDate(c.registrationDeadline);
    if (dl) lines.push(`آخر موعد للتسجيل: ${dl}`);
  }
  if (c.registrationUrl) lines.push(c.registrationUrl);
  else if (c.sourceUrl) lines.push(c.sourceUrl);
  lines.push("", "سُنّة");
  return lines.join("\n");
}
