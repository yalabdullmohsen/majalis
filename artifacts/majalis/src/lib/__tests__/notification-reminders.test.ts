/**
 * طبقة التذكيرات الدينية — حساب الثلث الأخير وتنقية التفضيلات والكتالوج.
 * تشغيل: node --import tsx src/lib/__tests__/notification-reminders.test.ts
 */
import assert from "node:assert/strict";
import {
  computeLastThirdFromFajr,
  computeLastThirdNightMs,
  REMINDER_NOTIF_ID_BASE,
  REMINDER_NOTIF_ID_END,
  reminderNotificationId,
} from "../notification-reminders-schedule";
import {
  migratePlaybackModeAwayFromFull,
  sanitizeNotifRemindersPreferences,
  sanitizeReminderSoundId,
} from "../notification-reminders-preferences";
import {
  listApprovedAlertSounds,
  isFullAdhanAllowed,
  ALERT_SOUND_CATALOG,
} from "../notification-alert-catalog";
import {
  normalizeAdhanPlaybackMode,
  isAdhanPlaybackMode,
  ADHAN_PLAYBACK_MODE_LABELS,
  ADHAN_PLAYBACK_MODES,
  resolveAdhanClip,
} from "../adhan-playback-modes";

// ── الثلث الأخير ──────────────────────────────────────────────────────────
{
  const maghrib = Date.UTC(2026, 8, 5, 15, 0, 0); // 18:00 +3
  const fajrNext = Date.UTC(2026, 8, 6, 1, 0, 0); // 04:00 +3
  const night = fajrNext - maghrib;
  const a = computeLastThirdNightMs(maghrib, fajrNext);
  const b = computeLastThirdFromFajr(maghrib, fajrNext);
  assert.ok(Number.isFinite(a));
  assert.ok(Number.isFinite(b));
  assert.ok(Math.abs(a - b) < 1, "الصيغتان متكافئتان");
  assert.equal(a, maghrib + (2 / 3) * night);
  assert.equal(b, fajrNext - night / 3);
  assert.ok(a > maghrib && a < fajrNext);
  assert.ok(Number.isNaN(computeLastThirdNightMs(fajrNext, maghrib)));
}

// ── تنقية التفضيلات — لا full ─────────────────────────────────────────────
{
  assert.equal(migratePlaybackModeAwayFromFull("full"), "short");
  assert.equal(migratePlaybackModeAwayFromFull("takbir"), "takbir");
  assert.equal(normalizeAdhanPlaybackMode("full"), "short");
  assert.equal(isAdhanPlaybackMode("full"), false);
  assert.ok(!ADHAN_PLAYBACK_MODES.includes("full" as never));
  assert.ok(!("full" in ADHAN_PLAYBACK_MODE_LABELS));
  assert.ok(!Object.values(ADHAN_PLAYBACK_MODE_LABELS).some((l) => /أذان كامل/.test(l)));

  const sanitized = sanitizeNotifRemindersPreferences({
    playbackMode: "full",
    shortAdhan: { enabled: true, soundId: "adhan-full-any" },
    lastThirdNight: { enabled: true, soundId: "adhan-seq-makkah-01" },
  } as never);
  assert.notEqual(sanitized.shortAdhan.soundId, "adhan-full-any");
  assert.ok(!sanitized.shortAdhan.soundId.includes("full"));
  assert.ok(!sanitized.lastThirdNight.soundId.includes("seq"));
  assert.equal(sanitizeReminderSoundId("adhan-full-any"), "alert-default-short");
}

// ── resolveAdhanClip: full → short ────────────────────────────────────────
{
  const sources = {
    audioUrl: "https://example.com/general.mp3",
    shortUrl: "https://example.com/short.mp3",
  };
  const clip = resolveAdhanClip(sources, { isFajr: false, mode: "full" })!;
  assert.equal(clip.kind, "short");
  assert.equal(clip.url, sources.shortUrl);
  assert.ok((clip.maxMs ?? 0) > 0);
}

// ── الكتالوج لا يعرض needs_license ولا أذان كامل ─────────────────────────
{
  assert.equal(isFullAdhanAllowed(), false);
  const approved = listApprovedAlertSounds();
  assert.ok(approved.length > 0);
  for (const s of approved) {
    assert.equal(s.status, "approved");
    assert.notEqual(s.kind, "adhan_full");
    assert.notEqual(s.status, "needs_license");
  }
  const fullEntries = ALERT_SOUND_CATALOG.filter((s) => s.kind === "adhan_full");
  assert.ok(fullEntries.every((s) => s.status !== "approved"));
  const licensedOnly = approved.every((s) => s.status === "approved");
  assert.ok(licensedOnly);
}

// ── نطاق المعرّفات ─────────────────────────────────────────────────────────
{
  assert.equal(REMINDER_NOTIF_ID_BASE, 70_000);
  assert.equal(REMINDER_NOTIF_ID_END, 79_999);
  const id = reminderNotificationId(0, 0, 0);
  assert.ok(id >= REMINDER_NOTIF_ID_BASE && id <= REMINDER_NOTIF_ID_END);
}

console.log("notification-reminders.test.ts: ok");
