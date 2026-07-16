import { FIQH_COUNCIL_PUBLISHED_SEED } from "./fiqh-council-seed";
import { isVerifiedPublicItem } from "./fiqh-council-trust";
import {
  FIQH_SESSIONS_PUBLISHED_SEED,
  findFiqhSessionBySlug,
  getLastCompletedSessionSeed,
  getUpcomingSessionSeed,
} from "./fiqh-sessions-seed";
import type { FiqhCouncilItem, FiqhCouncilSession, FiqhLiveData } from "./fiqh-council-types";
import { supabase, isSupabaseConfigured } from "./supabase";

const isConfigured = isSupabaseConfigured();

function isMissingTableError(err: unknown) {
  const msg = String((err as { message?: string })?.message || err || "");
  return msg.includes("does not exist") || msg.includes("42P01");
}

function enrichSessionItems(session: FiqhCouncilSession): FiqhCouncilSession {
  const items = FIQH_COUNCIL_PUBLISHED_SEED.filter(
    (item) =>
      isVerifiedPublicItem(item) &&
      item.session_number === session.session_number,
  );
  return { ...session, items };
}

function buildLiveFromSeed(): FiqhLiveData {
  const last = getLastCompletedSessionSeed();
  const upcoming = getUpcomingSessionSeed();
  const verified = FIQH_COUNCIL_PUBLISHED_SEED.filter(isVerifiedPublicItem);

  return {
    last_session: last ? enrichSessionItems(last) : null,
    upcoming_session: upcoming,
    latest_resolutions: verified
      .filter((i) => i.type === "resolution")
      .slice(0, 5)
      .map((i) => ({ slug: i.slug, title: i.title, category: i.category, session_date: i.session_date })),
    latest_recommendations: verified
      .filter((i) => i.type === "recommendation")
      .slice(0, 5)
      .map((i) => ({ slug: i.slug, title: i.title, category: i.category, session_date: i.session_date })),
    latest_fatwas: verified
      .filter((i) => i.type === "fatwa")
      .slice(0, 5)
      .map((i) => ({ slug: i.slug, title: i.title, category: i.category, session_date: i.session_date })),
  };
}

export async function getFiqhLiveData(): Promise<{ data: FiqhLiveData; usingSeed: boolean }> {
  // ملاحظة: كانت هذه الدالة تستدعي RPC باسم "fiqh_council_live_data" غير
  // الموجود إطلاقًا في قاعدة بيانات الإنتاج (تحقُّق مباشر عبر pg_proc،
  // 2026-07-16) — فكانت تُعيد بيانات seed دومًا على أي حال بعد جولة شبكة
  // فاشلة مهدورة في كل مرة. أُزيل الاستدعاء الميت مباشرةً.
  return { data: buildLiveFromSeed(), usingSeed: true };
}

export async function getFiqhSessions(opts?: { status?: string; limit?: number }) {
  let sessions = FIQH_SESSIONS_PUBLISHED_SEED.filter(
    (s) => s.publish_status === "published" && s.verification_status === "verified",
  );

  if (opts?.status) sessions = sessions.filter((s) => s.status === opts.status);
  sessions.sort((a, b) => (b.start_date || "").localeCompare(a.start_date || ""));
  if (opts?.limit) sessions = sessions.slice(0, opts.limit);

  if (!isConfigured) return { data: sessions, usingSeed: true };

  try {
    let query = supabase
      .from("fiqh_council_sessions")
      .select("*")
      .eq("publish_status", "published")
      .eq("verification_status", "verified")
      .order("start_date", { ascending: false });

    if (opts?.status) query = query.eq("status", opts.status);
    if (opts?.limit) query = query.limit(opts.limit);

    const { data, error } = await query;
    if (error) {
      if (isMissingTableError(error)) return { data: sessions, usingSeed: true };
      return { data: sessions, usingSeed: true, error };
    }
    if (!data?.length) return { data: sessions, usingSeed: true };
    return { data: data as FiqhCouncilSession[], usingSeed: false };
  } catch {
    return { data: sessions, usingSeed: true };
  }
}

export async function getFiqhSessionBySlug(slug: string) {
  const seedSession = findFiqhSessionBySlug(slug);
  const seedEnriched = seedSession ? enrichSessionItems(seedSession) : null;

  if (!isConfigured) return { data: seedEnriched, usingSeed: true };

  try {
    const { data: session, error } = await supabase
      .from("fiqh_council_sessions")
      .select("*")
      .eq("slug", slug)
      .eq("publish_status", "published")
      .eq("verification_status", "verified")
      .maybeSingle();

    if (error) {
      if (isMissingTableError(error)) return { data: seedEnriched, usingSeed: true };
      return { data: seedEnriched, usingSeed: true, error };
    }
    if (!session) return { data: seedEnriched, usingSeed: !seedEnriched };

    const { data: items } = await supabase
      .from("fiqh_council_items")
      .select("*")
      .eq("session_id", session.id)
      .eq("status", "published");

    const sessionItems = (items || []) as FiqhCouncilItem[];
    const enriched = {
      ...session,
      items: sessionItems.length
        ? sessionItems
        : FIQH_COUNCIL_PUBLISHED_SEED.filter(
            (i) => isVerifiedPublicItem(i) && i.session_number === session.session_number,
          ),
    } as FiqhCouncilSession;

    return { data: enriched, usingSeed: false };
  } catch {
    return { data: seedEnriched, usingSeed: true };
  }
}

export function unavailableLabel(value?: string | null) {
  if (!value || value.trim() === "" || value === "غير متوفر") {
    return "لم تُنشر بيانات موثقة بعد.";
  }
  return value;
}

export function groupSessionItems(items: FiqhCouncilItem[] = []) {
  return {
    resolutions: items.filter((i) => i.type === "resolution"),
    fatwas: items.filter((i) => i.type === "fatwa"),
    recommendations: items.filter((i) => i.type === "recommendation"),
    research: items.filter((i) => i.type === "research"),
    other: items.filter((i) => !["resolution", "fatwa", "recommendation", "research"].includes(i.type)),
  };
}
