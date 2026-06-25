type SheikhLike = {
  image_url?: string | null;
  photo_url?: string | null;
  avatar_url?: string | null;
  profile_image_url?: string | null;
};

export function resolveSheikhImageUrl(source?: SheikhLike | string | null): string | undefined {
  if (!source) return undefined;
  if (typeof source === "string") {
    const trimmed = source.trim();
    return trimmed || undefined;
  }
  const url =
    source.image_url ||
    source.photo_url ||
    source.avatar_url ||
    source.profile_image_url;
  return url?.trim() || undefined;
}

export function resolveLessonSheikhImage(lesson: {
  sheikh_image_url?: string;
  sheikhImage?: string;
  sheikhs?: SheikhLike & { name?: string };
}): string | undefined {
  return (
    lesson.sheikh_image_url?.trim() ||
    lesson.sheikhImage?.trim() ||
    resolveSheikhImageUrl(lesson.sheikhs)
  );
}

export function parseLessonSchedule(schedule?: string): { day: string; time: string } {
  if (!schedule?.trim()) return { day: "", time: "" };
  const parts = schedule.trim().split(/\s+/);
  if (parts.length === 1) return { day: parts[0], time: "" };
  return { day: parts[0], time: parts.slice(1).join(" ") };
}
