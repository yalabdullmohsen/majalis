import { KUWAIT_SCHOLAR_REGISTRY, resolveScholarProfile } from "@/lib/kuwait-sheikhs-registry";

export type SheikhInfoSource = {
  source_title: string;
  source_url: string;
  verified: boolean;
};

export type KuwaitSheikhProfile = {
  id: string;
  name: string;
  fullName: string;
  role?: string;
  country: string;
  specialties: string[];
  bio: string;
  needs_verification: boolean;
  sources: SheikhInfoSource[];
  photo_url?: string;
};

/** @deprecated use KUWAIT_SCHOLAR_REGISTRY */
export const KUWAIT_SHEIKH_PROFILES: KuwaitSheikhProfile[] = KUWAIT_SCHOLAR_REGISTRY.map((p) => ({
  id: p.id,
  name: p.name,
  fullName: p.fullName,
  role: p.role,
  country: p.country,
  specialties: p.specialties,
  bio: p.bio,
  needs_verification: p.needs_verification,
  sources: p.links.map((l) => ({ source_title: l.label, source_url: l.url, verified: true })),
  photo_url: p.photo_url,
}));

export function resolveKuwaitSheikhProfile(nameOrId?: string | null): KuwaitSheikhProfile | null {
  const profile = resolveScholarProfile(nameOrId);
  if (!profile) return null;
  return {
    id: profile.id,
    name: profile.name,
    fullName: profile.fullName,
    role: profile.role,
    country: profile.country,
    specialties: profile.specialties,
    bio: profile.bio,
    needs_verification: profile.needs_verification,
    sources: profile.links.map((l) => ({ source_title: l.label, source_url: l.url, verified: true })),
    photo_url: profile.photo_url,
  };
}

export function sheikhProfileHref(profile: KuwaitSheikhProfile): string {
  return `/sheikhs/${profile.id}`;
}
