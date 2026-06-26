/**
 * Local storage fallback for learning progress (when Supabase unavailable).
 */

const PREFIX = "majalis_learning_";

export function localGet(key, fallback = null) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function localSet(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function localRemove(key) {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    /* ignore */
  }
}

export function getLocalUserId() {
  let id = localGet("guest_user_id");
  if (!id) {
    id = `guest-${crypto.randomUUID()}`;
    localSet("guest_user_id", id);
  }
  return id;
}
