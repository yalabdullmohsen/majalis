import type { ResearchRecord } from "./types";

/** صيغ توثيق جاهزة — لا تغيّر بيانات الباحث. */
export function formatCitationApa(r: ResearchRecord): string {
  const authors = r.authors.map((a) => a.name).join("، ");
  const year = r.year ? `(${r.year})` : "(د.ت.)";
  const doi = r.doi ? ` https://doi.org/${r.doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")}` : "";
  const src = !doi && r.sourceUrl ? ` ${r.sourceUrl}` : "";
  return `${authors} ${year}. ${r.title}. ${r.university ? `${r.university}.` : ""}${r.publisher ? ` ${r.publisher}.` : ""}${doi || src}`.replace(/\s+/g, " ").trim();
}

export function formatCitationChicago(r: ResearchRecord): string {
  const authors = r.authors.map((a) => a.name).join("، ");
  const year = r.year ?? "د.ت.";
  const loc = [r.university, r.publisher].filter(Boolean).join("، ");
  const link = r.doi ? `https://doi.org/${r.doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")}` : r.sourceUrl || "";
  return `${authors}. "${r.title}." ${loc}${loc ? ", " : ""}${year}. ${link}`.trim();
}

export function formatCitationMla(r: ResearchRecord): string {
  const authors = r.authors.map((a) => a.name).join("، ");
  const year = r.year ?? "د.ت.";
  const container = r.journalName || r.university || r.publisher || "سُنّة";
  const link = r.sourceUrl || (r.doi ? `https://doi.org/${r.doi}` : "");
  return `${authors}. "${r.title}." ${container}, ${year}${link ? `, ${link}` : ""}.`;
}

/** توثيق عربي أكاديمي مبسّط */
export function formatCitationArabic(r: ResearchRecord): string {
  const authors = r.authors.map((a) => a.name).join("، ");
  const parts = [
    authors,
    r.title,
    r.kind === "masters_thesis" || r.kind === "phd_dissertation"
      ? `رسالة ${r.kind === "phd_dissertation" ? "دكتوراه" : "ماجستير"}`
      : null,
    r.university,
    r.college,
    r.country,
    r.year ? `${r.year}م` : null,
    r.doi ? `DOI: ${r.doi}` : r.sourceUrl || null,
  ].filter(Boolean);
  return parts.join("، ") + ".";
}

export type CitationStyle = "apa" | "chicago" | "mla" | "arabic";

export function formatCitation(r: ResearchRecord, style: CitationStyle): string {
  switch (style) {
    case "apa":
      return formatCitationApa(r);
    case "chicago":
      return formatCitationChicago(r);
    case "mla":
      return formatCitationMla(r);
    default:
      return formatCitationArabic(r);
  }
}
