/**
 * Personal learning library — saved items, notes, search history.
 */

import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { localGet, localSet, getLocalUserId } from "./storage.mjs";

export async function saveToLibrary(admin, userId, item) {
  const uid = userId || getLocalUserId();
  const entry = {
    item_type: item.item_type,
    content_id: item.content_id || item.id,
    title: item.title,
    content_url: item.content_url || item.href,
    notes: item.notes,
    saved_at: new Date().toISOString(),
  };

  if (admin && userId && !userId.startsWith("guest-")) {
    try {
      await admin.from("user_learning_library").upsert(
        { user_id: userId, ...entry },
        { onConflict: "user_id,item_type,content_id" },
      );
      return { ok: true, source: "supabase" };
    } catch {
      /* fallback */
    }
  }

  const library = localGet(`library_${uid}`, []);
  const key = `${entry.item_type}:${entry.content_id}`;
  if (!library.find((i) => `${i.item_type}:${i.content_id}` === key)) {
    library.unshift(entry);
    localSet(`library_${uid}`, library.slice(0, 200));
  }
  return { ok: true, source: "local" };
}

export async function getLibrary(admin, userId, itemType) {
  const uid = userId || getLocalUserId();

  if (admin && userId && !userId.startsWith("guest-")) {
    try {
      let q = admin.from("user_learning_library").select("*").eq("user_id", userId).order("saved_at", { ascending: false });
      if (itemType) q = q.eq("item_type", itemType);
      const { data } = await q;
      if (data) return data;
    } catch {
      /* fallback */
    }
  }

  const library = localGet(`library_${uid}`, []);
  return itemType ? library.filter((i) => i.item_type === itemType) : library;
}

export async function saveNote(admin, userId, { pathSlug, moduleId, title, body }) {
  const uid = userId || getLocalUserId();
  const note = { path_slug: pathSlug, module_id: moduleId, title, body, updated_at: new Date().toISOString() };

  if (admin && userId && !userId.startsWith("guest-")) {
    try {
      await admin.from("user_learning_notes").insert({
        user_id: userId,
        path_id: pathSlug,
        module_id: moduleId,
        title,
        body,
      });
      return { ok: true, source: "supabase" };
    } catch {
      /* fallback */
    }
  }

  const notes = localGet(`notes_${uid}`, []);
  notes.unshift(note);
  localSet(`notes_${uid}`, notes.slice(0, 100));
  return { ok: true, source: "local" };
}

export async function getNotes(admin, userId) {
  const uid = userId || getLocalUserId();

  if (admin && userId && !userId.startsWith("guest-")) {
    try {
      const { data } = await admin.from("user_learning_notes").select("*").eq("user_id", userId).order("updated_at", { ascending: false });
      if (data) return data;
    } catch {
      /* fallback */
    }
  }

  return localGet(`notes_${uid}`, []);
}

export function recordSearchHistory(userId, query) {
  const uid = userId || getLocalUserId();
  const history = localGet(`search_history_${uid}`, []);
  if (!history.includes(query)) history.unshift(query);
  localSet(`search_history_${uid}`, history.slice(0, 50));
}

export function getSearchHistory(userId) {
  const uid = userId || getLocalUserId();
  return localGet(`search_history_${uid}`, []);
}
