import {
  buildExternalKey,
  normalizeArabic,
  normalizeCity,
  parseDateTime,
  slugify,
  toIsoDate,
  toIsoDateTime,
} from './utils.mjs';

export function normalizeRawItem(source, raw) {
  const title = normalizeArabic(raw.title ?? raw.lessonTitle ?? raw.name ?? '');
  const sheikh = normalizeArabic(
    raw.sheikh ?? raw.sheikh_name ?? raw.speaker_name ?? raw.speaker ?? raw.teacher ?? '',
  );
  const location = normalizeArabic(raw.location ?? raw.venue ?? raw.mosque ?? '');
  const region = normalizeArabic(raw.region ?? '');
  const city = normalizeCity(raw.city ?? raw.governorate ?? 'الكويت');
  const day = raw.day ?? raw.day_of_week ?? raw.recurrenceDay ?? null;
  const date = raw.date ?? raw.event_date ?? raw.start_date ?? (raw.starts_at ? toIsoDate(raw.starts_at) : null);
  const time = raw.time ?? raw.lesson_time ?? raw.event_time ?? extractTimeFromIso(raw.starts_at) ?? '—';
  const startsAt = buildStartsAt(date, time, raw.starts_at);
  const endsAt = raw.end_date ?? raw.ends_at ?? null;
  const description = normalizeArabic(
    [raw.description, ...(Array.isArray(raw.notes) ? raw.notes : [])].filter(Boolean).join(' · '),
  );
  const isRecurring = raw.is_recurring ?? (raw.kind === 'weekly' || Boolean(day && !date));

  const draft = {
    source_id: source.id,
    source_name: source.name,
    external_key: buildExternalKey(source.id, raw),
    title,
    sheikh,
    day,
    date: toIsoDate(startsAt) ?? date,
    time,
    location,
    region,
    city,
    description,
    category: raw.category ?? inferCategory(title, source, raw),
    source_url:
      raw.source_url ??
      raw.url ??
      raw.websiteUrl ??
      raw.registrationUrl ??
      raw.official_url ??
      source.official_url ??
      null,
    live_url: raw.live_url ?? raw.stream_url ?? raw.liveUrl ?? null,
    maps_url: raw.maps_url ?? raw.map_url ?? raw.mapUrl ?? null,
    starts_at: startsAt,
    ends_at: endsAt ? toIsoDateTime(parseDateTime(endsAt)) : null,
    end_date: endsAt ? toIsoDate(parseDateTime(endsAt)) : null,
    is_recurring: isRecurring,
    is_course: Boolean(raw.is_course ?? (raw.kind === 'online_course' || /دورة/.test(title))),
    activity_type: inferActivityType(raw, title),
    status: 'approved',
    language: raw.language ?? 'ar',
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    raw_payload: raw,
  };

  draft.slug = slugify(`${draft.title}-${draft.city}-${draft.day || draft.date || 'lesson'}`);
  if (!draft.schedule) {
    draft.schedule = day && time ? `${day} — ${time}` : time !== '—' ? time : day || '';
  }

  return draft;
}

function extractTimeFromIso(value) {
  if (!value) return null;
  const date = parseDateTime(value);
  if (!date) return null;
  return date.toLocaleTimeString('ar-KW', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kuwait',
  });
}

function buildStartsAt(date, time, startsAtIso) {
  if (startsAtIso) {
    const parsed = parseDateTime(startsAtIso);
    if (parsed) return toIsoDateTime(parsed);
  }
  if (!date) return null;

  if (time && time !== '—') {
    const combined = `${date} ${normalizeTimeForParse(time)}`;
    const parsed = parseDateTime(combined);
    if (parsed) return toIsoDateTime(parsed);
  }

  const parsedDate = parseDateTime(`${date}T00:00:00+03:00`);
  return parsedDate ? toIsoDateTime(parsedDate) : null;
}

function normalizeTimeForParse(time) {
  return String(time)
    .replace(/[\u0640\u061F\u061B\u060C]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function inferCategory(title, source, raw) {
  const text = `${title} ${source.name} ${(raw.tags ?? []).join(' ')}`.toLowerCase();
  if (/محاض|lecture|ندو/.test(text)) return 'محاضرة';
  if (/دور|course|برنام/.test(text)) return 'دورة';
  if (/فعال|event|مؤتم/.test(text)) return 'فعالية';
  if (/علم|scientific|kfas|kfep/.test(text)) return 'تأصيل';
  if (/تفس/.test(text)) return 'تفسير';
  if (/فق/.test(text)) return 'فقه';
  if (/حد/.test(text)) return 'حديث';
  if (/عق/.test(text)) return 'عقيدة';
  return raw.category || 'أخرى';
}

function inferActivityType(raw, title) {
  if (raw.activity_type) return raw.activity_type;
  if (raw.kind === 'online_course' || /دورة/.test(title)) return 'دورة';
  if (/محاض/.test(title)) return 'محاضرة';
  return 'درس';
}
