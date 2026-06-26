import { getSupabaseAdmin, isMissingTableError } from '../supabase-admin.mjs';
import { isExpired, toIsoDate } from './utils.mjs';

function mapDraftToRow(draft) {
  const startDate = draft.date ? toIsoDate(draft.date) : null;
  const endDate = draft.end_date ? toIsoDate(draft.end_date) : null;

  return {
    external_key: draft.external_key,
    title: draft.title,
    speaker_name: draft.sheikh,
    mosque: draft.location,
    region: draft.region ?? null,
    city: draft.city,
    category: draft.category ?? 'أخرى',
    schedule: draft.schedule ?? `${draft.day || draft.date || ''} — ${draft.time || ''}`.trim(),
    lesson_time: draft.time,
    day_of_week: draft.day ?? null,
    day: draft.day ?? null,
    description: draft.description ?? '',
    live_url: draft.live_url ?? null,
    maps_url: draft.maps_url ?? null,
    book_url: draft.source_url ?? null,
    source_url: draft.source_url ?? null,
    start_date: startDate,
    end_date: endDate,
    is_recurring: draft.is_recurring !== false,
    is_course: Boolean(draft.is_course),
    activity_type: draft.activity_type ?? 'درس',
    keywords: draft.tags ?? [],
    status: 'approved',
    audience: 'الكل',
    delivery: draft.live_url ? 'كلاهما' : 'حضور فقط',
    updated_at: new Date().toISOString(),
  };
}

export async function loadExistingExternalKeys(admin = getSupabaseAdmin()) {
  if (!admin) return new Set();

  const { data, error } = await admin
    .from('lessons')
    .select('external_key')
    .not('external_key', 'is', null);

  if (error) {
    if (isMissingTableError(error)) return new Set();
    console.warn('[lesson-sync] failed to load existing keys:', error.message);
    return new Set();
  }

  return new Set((data ?? []).map((row) => row.external_key).filter(Boolean));
}

export async function loadExistingLessonsMap(admin = getSupabaseAdmin()) {
  if (!admin) return new Map();

  const { data, error } = await admin
    .from('lessons')
    .select('id, external_key, title, speaker_name, schedule, lesson_time, mosque, city, description, updated_at')
    .not('external_key', 'is', null);

  if (error) {
    if (isMissingTableError(error)) return new Map();
    return new Map();
  }

  return new Map((data ?? []).map((row) => [row.external_key, row]));
}

export async function upsertLesson(draft, admin = getSupabaseAdmin()) {
  if (!admin) {
    return { ok: true, mode: 'local_only', action: 'skipped' };
  }

  const row = mapDraftToRow(draft);
  if (isExpired(row.start_date, row.end_date) && !row.is_recurring) {
    row.archived_at = new Date().toISOString();
  }

  const { data: existing } = await admin
    .from('lessons')
    .select('id')
    .eq('external_key', row.external_key)
    .maybeSingle();

  if (existing?.id) {
    const { data, error } = await admin
      .from('lessons')
      .update(row)
      .eq('id', existing.id)
      .select('id, external_key, updated_at')
      .single();
    if (error) return { ok: false, error: error.message };
    return { ok: true, data, action: 'updated' };
  }

  const { data, error } = await admin
    .from('lessons')
    .insert(row)
    .select('id, external_key, updated_at')
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data, action: 'created' };
}

export async function archiveExpiredLessons(admin = getSupabaseAdmin()) {
  if (!admin) {
    return { ok: false, archived: 0, error: 'missing_supabase_config' };
  }

  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kuwait' }).format(new Date());
  const now = new Date().toISOString();

  const { data, error } = await admin
    .from('lessons')
    .select('id, external_key, end_date')
    .eq('status', 'approved')
    .not('end_date', 'is', null)
    .lt('end_date', today)
    .is('archived_at', null);

  if (error) {
    if (isMissingTableError(error)) {
      return { ok: false, archived: 0, error: 'lessons_missing' };
    }
    return { ok: false, archived: 0, error: error.message };
  }

  const ids = (data ?? []).map((row) => row.id);
  if (ids.length === 0) return { ok: true, archived: 0 };

  const { error: updateError } = await admin
    .from('lessons')
    .update({ archived_at: now, is_recurring: false })
    .in('id', ids);

  if (updateError) return { ok: false, archived: 0, error: updateError.message };
  return { ok: true, archived: ids.length };
}

export async function recordSyncRun(run, admin = getSupabaseAdmin()) {
  if (!admin) return { ok: false, error: 'missing_supabase_config' };

  const { data, error } = await admin
    .from('lesson_sync_runs')
    .insert({
      started_at: run.started_at,
      finished_at: run.finished_at,
      status: run.status,
      new_count: run.stats.new,
      updated_count: run.stats.updated,
      duplicate_count: run.stats.duplicates,
      error_count: run.stats.errors,
      review_count: run.stats.review ?? 0,
      archived_count: run.stats.archived ?? 0,
      ai_used_count: run.stats.ai_used ?? 0,
      sources: run.sources,
      errors: run.errors,
      summary: run.summary,
    })
    .select('id')
    .single();

  if (error) {
    if (isMissingTableError(error)) return { ok: false, error: 'lesson_sync_runs_missing' };
    return { ok: false, error: error.message };
  }
  return { ok: true, id: data.id };
}

export async function upsertSourceHealth(entries, admin = getSupabaseAdmin()) {
  if (!admin) return { ok: false, error: 'missing_supabase_config' };

  const rows = entries.map((entry) => ({
    source_id: entry.source_id,
    source_name: entry.source_name,
    source_type: entry.source_type,
    status: entry.status,
    last_sync_at: entry.last_sync_at,
    last_success_at: entry.last_success_at,
    items_fetched: entry.items_fetched,
    items_published: entry.items_published,
    items_review: entry.items_review ?? 0,
    last_error: entry.last_error,
    meta: entry.meta ?? {},
    updated_at: new Date().toISOString(),
  }));

  const { error } = await admin.from('lesson_sync_sources').upsert(rows, { onConflict: 'source_id' });
  if (error) {
    if (isMissingTableError(error)) return { ok: false, error: 'lesson_sync_sources_missing' };
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function getLatestSyncRun(admin = getSupabaseAdmin()) {
  if (!admin) return null;

  const { data, error } = await admin
    .from('lesson_sync_runs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error && isMissingTableError(error)) return null;
  return data;
}

export async function getSourceHealth(admin = getSupabaseAdmin()) {
  if (!admin) return [];

  const { data, error } = await admin
    .from('lesson_sync_sources')
    .select('*')
    .order('source_name', { ascending: true });

  if (error && isMissingTableError(error)) return [];
  return data ?? [];
}

export async function getRecentSyncRuns(limit = 10, admin = getSupabaseAdmin()) {
  if (!admin) return [];

  const { data, error } = await admin
    .from('lesson_sync_runs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(limit);

  if (error && isMissingTableError(error)) return [];
  return data ?? [];
}
