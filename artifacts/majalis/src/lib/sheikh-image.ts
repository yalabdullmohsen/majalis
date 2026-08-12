import { resolveLocalSheikhPhoto } from "@/lib/sheikh-photos";

type SheikhLike = {
  name?: string | null;
  image_url?: string | null;
  photo_url?: string | null;
  avatar_url?: string | null;
  profile_image_url?: string | null;
};

export function resolveSheikhImageUrl(source?: SheikhLike | string | null): string | undefined {
  if (!source) return undefined;
  if (typeof source === "string") {
    const trimmed = source.trim();
    if (trimmed.startsWith("/sheikhs/")) return trimmed;
    if (trimmed.startsWith("/images/teachers/")) {
      return trimmed.replace("/images/teachers/", "/sheikhs/");
    }
    return trimmed || undefined;
  }
  const url =
    source.image_url ||
    source.photo_url ||
    source.avatar_url ||
    source.profile_image_url;
  const trimmed = url?.trim();
  if (trimmed) {
    if (trimmed.startsWith("/images/teachers/")) {
      return trimmed.replace("/images/teachers/", "/sheikhs/");
    }
    return trimmed;
  }
  if (source.name) return resolveLocalSheikhPhoto(source.name);
  return undefined;
}

export function resolveLessonSheikhImage(lesson: {
  sheikh_image_url?: string;
  sheikhImage?: string;
  speaker_name?: string;
  sheikhs?: SheikhLike & { name?: string };
}): string | undefined {
  const fromRow =
    lesson.sheikh_image_url?.trim() ||
    lesson.sheikhImage?.trim() ||
    resolveSheikhImageUrl(lesson.sheikhs);

  if (fromRow) {
    if (fromRow.startsWith("/images/teachers/")) {
      return fromRow.replace("/images/teachers/", "/sheikhs/");
    }
    return fromRow;
  }

  const name = lesson.sheikhs?.name || lesson.speaker_name;
  return resolveLocalSheikhPhoto(name);
}

export function parseLessonSchedule(schedule?: string): { day: string; time: string } {
  if (!schedule?.trim()) return { day: "", time: "" };
  const parts = schedule.trim().split(/\s+/);
  if (parts.length === 1) return { day: parts[0], time: "" };
  return { day: parts[0], time: parts.slice(1).join(" ") };
}
