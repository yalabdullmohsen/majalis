/**
 * Learning calendar — events and user subscriptions.
 */

import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { localGet, localSet, getLocalUserId } from "./storage.mjs";

const DEMO_EVENTS = [
  { id: "ev-1", title: "درس أسبوعي — العقيدة", event_type: "lesson", starts_at: new Date(Date.now() + 86400000).toISOString(), location: "مسجد الصباح" },
  { id: "ev-2", title: "دورة الفقه الميسر", event_type: "course", starts_at: new Date(Date.now() + 172800000).toISOString(), location: "أونلاين" },
  { id: "ev-3", title: "محاضرة — السيرة النبوية", event_type: "lecture", starts_at: new Date(Date.now() + 259200000).toISOString() },
  { id: "ev-4", title: "مؤتمر العلماء", event_type: "conference", starts_at: new Date(Date.now() + 604800000).toISOString() },
  { id: "ev-5", title: "ليلة القدر", event_type: "occasion", starts_at: new Date(Date.now() + 1209600000).toISOString() },
];

export async function getCalendarEvents(admin, { from, to } = {}) {
  if (admin) {
    try {
      let q = admin.from("learning_calendar_events").select("*").eq("is_public", true).order("starts_at");
      if (from) q = q.gte("starts_at", from);
      if (to) q = q.lte("starts_at", to);
      const { data } = await q;
      if (data?.length) return data;
    } catch {
      /* fallback */
    }
  }
  return DEMO_EVENTS;
}

export async function subscribeToEvent(admin, userId, eventId) {
  const uid = userId || getLocalUserId();

  if (admin && userId && !userId.startsWith("guest-")) {
    try {
      await admin.from("user_calendar_subscriptions").upsert(
        { user_id: userId, event_id: eventId },
        { onConflict: "user_id,event_id" },
      );
      return { ok: true, source: "supabase" };
    } catch {
      /* fallback */
    }
  }

  const subs = localGet(`calendar_subs_${uid}`, []);
  if (!subs.includes(eventId)) subs.push(eventId);
  localSet(`calendar_subs_${uid}`, subs);
  return { ok: true, source: "local" };
}

export async function getUserCalendarSubscriptions(admin, userId) {
  const uid = userId || getLocalUserId();
  const allEvents = await getCalendarEvents(admin);
  const subs = localGet(`calendar_subs_${uid}`, []);
  return allEvents.filter((e) => subs.includes(e.id));
}
