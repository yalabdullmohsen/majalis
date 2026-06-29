import type {
  BiographySectionDef,
  LifeStatus,
  ScholarBiographyData,
  ScholarProfile,
  VerifiedField,
} from "./types";
import { BIOGRAPHY_SECTIONS } from "./types";

const UNAVAILABLE = "غير متوفر";

export function isNonEmpty(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

/** Public display: verified + non-empty only. */
export function getVerifiedDisplay<T>(field?: VerifiedField<T> | null): T | null {
  if (!field?.verified || !isNonEmpty(field.value)) return null;
  return field.value;
}

export function getVerifiedList(field?: VerifiedField<string[]> | null): string[] {
  const v = getVerifiedDisplay(field);
  if (!v || !Array.isArray(v)) return [];
  return v.filter((s) => String(s).trim());
}

export function lifeStatusLabel(status?: LifeStatus | null): string | null {
  if (!status || status === "unknown") return null;
  if (status === "alive") return "حي";
  if (status === "deceased") return "متوفى";
  return null;
}

export function mergeScholarProfiles(
  db: Partial<ScholarProfile> | null,
  registry: Partial<ScholarProfile> | null,
): ScholarProfile | null {
  if (!db && !registry) return null;
  const base = { ...(registry || {}), ...(db || {}) } as ScholarProfile;

  if (db?.biography && db.biography_status === "published") {
    base.biography = db.biography;
  } else if (!base.biography && registry?.bio) {
    base.biography = undefined;
  }

  if (db?.bio) base.bio = db.bio;
  else if (!base.bio && registry?.bio) base.bio = registry.bio;

  if (db?.biography_data && Object.keys(db.biography_data).length) {
    base.biography_data = db.biography_data;
  }

  if (!base.photo_url && registry?.photo_url) base.photo_url = registry.photo_url;
  if (!base.links?.length && registry?.links?.length) base.links = registry.links;
  if (!base.subjects?.length && registry?.subjects?.length) base.subjects = registry.subjects;
  if (!base.mutoon?.length && registry?.mutoon?.length) base.mutoon = registry.mutoon;
  if (!base.specialties?.length && registry?.specialties?.length) base.specialties = registry.specialties;

  base.fullName = getVerifiedDisplay(base.biography_data?.full_name) || db?.name || registry?.fullName || base.name;
  base.country = base.country || db?.country || registry?.country;
  base.city = base.city || db?.city || registry?.city;

  return base;
}

export type PublicBiographySection = {
  key: string;
  label: string;
  type: BiographySectionDef["type"];
  items?: string[];
  text?: string;
  accounts?: { platform: string; url: string }[];
};

export function buildPublicBiographySections(profile: ScholarProfile): PublicBiographySection[] {
  const published = !profile.biography_status || profile.biography_status === "published";
  if (!published) return [];

  const data = profile.biography_data || {};
  const sections: PublicBiographySection[] = [];

  for (const def of BIOGRAPHY_SECTIONS) {
    const field = data[def.key as keyof ScholarBiographyData];
    if (def.type === "text") {
      const text = getVerifiedDisplay(field as VerifiedField | undefined);
      if (text && typeof text === "string") {
        sections.push({ key: def.key, label: def.label, type: def.type, text });
      }
    } else if (def.type === "list") {
      const items = getVerifiedList(field as VerifiedField<string[]> | undefined);
      if (items.length) sections.push({ key: def.key, label: def.label, type: def.type, items });
    } else if (def.type === "accounts") {
      const accounts = getVerifiedDisplay(field as VerifiedField<{ platform: string; url: string }[]> | undefined);
      if (accounts?.length) sections.push({ key: def.key, label: def.label, type: def.type, accounts });
    }
  }

  if (profile.biography?.trim() && profile.biography_status === "published" && profile.is_verified) {
    sections.push({
      key: "_legacy_biography",
      label: "السيرة العلمية",
      type: "text",
      text: profile.biography.trim(),
    });
  }

  if (profile.qualifications?.length && profile.is_verified) {
    const existing = sections.find((s) => s.key === "qualifications");
    if (!existing) {
      sections.push({
        key: "_db_qualifications",
        label: "المؤهلات العلمية",
        type: "list",
        items: profile.qualifications,
      });
    }
  }

  return sections;
}

export function hasPublicBiography(profile: ScholarProfile): boolean {
  return buildPublicBiographySections(profile).length > 0 || Boolean(profile.bio?.trim());
}

export function countVerifiedFields(data: ScholarBiographyData = {}): number {
  return BIOGRAPHY_SECTIONS.filter((def) => {
    const field = data[def.key as keyof ScholarBiographyData];
    return field?.verified && isNonEmpty(field.value);
  }).length;
}

export function countTotalBiographyFields(data: ScholarBiographyData = {}): number {
  return BIOGRAPHY_SECTIONS.filter((def) => {
    const field = data[def.key as keyof ScholarBiographyData];
    return isNonEmpty(field?.value);
  }).length;
}

export function biographyCompleteness(profile: ScholarProfile): {
  verified: number;
  total: number;
  max: number;
  missing: string[];
} {
  const data = profile.biography_data || {};
  const verified = countVerifiedFields(data);
  const total = countTotalBiographyFields(data);
  const missing = BIOGRAPHY_SECTIONS.filter((def) => {
    const field = data[def.key as keyof ScholarBiographyData];
    return !field?.verified || !isNonEmpty(field?.value);
  }).map((d) => d.label);

  return { verified, total, max: BIOGRAPHY_SECTIONS.length, missing };
}

export { UNAVAILABLE };

/** Flatten verified + unverified biography_data values for search indexing. */
export function extractBiographySearchTerms(data: ScholarBiographyData = {}): string[] {
  const terms: string[] = [];
  for (const def of BIOGRAPHY_SECTIONS) {
    const field = data[def.key as keyof ScholarBiographyData];
    if (!field?.value) continue;
    if (Array.isArray(field.value)) {
      terms.push(...field.value.map(String));
    } else if (typeof field.value === "string") {
      terms.push(field.value);
    } else if (def.type === "accounts" && Array.isArray(field.value)) {
      for (const acc of field.value as { platform?: string; url?: string }[]) {
        if (acc.platform) terms.push(acc.platform);
        if (acc.url) terms.push(acc.url);
      }
    }
  }
  return terms;
}

/** Sync admin form fields into structured biography_data (verified only when is_verified). */
export function buildBiographyDataFromAdmin(form: {
  name?: string;
  nationality?: string;
  qualifications?: string;
  ijazah?: string;
  biography?: string;
  official_website?: string;
  twitter_url?: string;
  instagram_url?: string;
  youtube_url?: string;
  is_verified?: boolean;
  biography_data?: ScholarBiographyData;
}): ScholarBiographyData {
  const verified = !!form.is_verified;
  const source = "admin";
  const data: ScholarBiographyData = { ...(form.biography_data || {}) };

  const setText = (
    key: "full_name" | "nationality" | "extended_bio",
    value?: string,
  ) => {
    const v = value?.trim();
    if (!v) return;
    data[key] = { value: v, verified, source };
  };

  const setList = (
    key: "qualifications" | "ijazat" | "official_websites",
    values: string[],
  ) => {
    const list = values.map((s) => s.trim()).filter(Boolean);
    if (!list.length) return;
    data[key] = { value: list, verified, source };
  };

  setText("full_name", form.name);
  setText("nationality", form.nationality);
  setText("extended_bio", form.biography);

  if (form.qualifications) {
    setList(
      "qualifications",
      form.qualifications.split(/[،,]/).map((s) => s.trim()).filter(Boolean),
    );
  }
  if (form.ijazah?.trim()) {
    setList("ijazat", [form.ijazah.trim()]);
  }

  const websites = [form.official_website?.trim()].filter(Boolean) as string[];
  if (websites.length) setList("official_websites", websites);

  const accounts: { platform: string; url: string }[] = [];
  if (form.twitter_url?.trim()) accounts.push({ platform: "X", url: form.twitter_url.trim() });
  if (form.instagram_url?.trim()) accounts.push({ platform: "Instagram", url: form.instagram_url.trim() });
  if (form.youtube_url?.trim()) accounts.push({ platform: "YouTube", url: form.youtube_url.trim() });
  if (accounts.length) {
    data.official_accounts = { value: accounts, verified, source };
  }

  return data;
}
