const BASE = "/api/admin/telegram";

async function post(body: Record<string, unknown>) {
  const res = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || "request failed");
  return data;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type TelegramChannel = {
  id: string;
  name: string;
  telegram_username: string;
  category: string;
  description: string | null;
  is_active: boolean;
  last_scraped_message_id: number | null;
  last_scraped_at: string | null;
  created_at: string;
};

export type TelegramImportedLesson = {
  id: string;
  title: string;
  speaker_name: string | null;
  category: string | null;
  description: string | null;
  status: string;
  created_at: string;
  auto_imported_at: string | null;
  telegram_message_url: string | null;
  telegram_channel_id: string | null;
  keywords: string[];
};

export type ExtractionLog = {
  id: string;
  channel_id: string;
  extraction_start: string | null;
  extraction_end: string | null;
  messages_fetched: number;
  lessons_created: number;
  lessons_skipped: number;
  errors: number;
  status: string;
  error_message: string | null;
  created_at: string;
  telegram_channels?: { name: string; telegram_username: string } | null;
};

// ── Channel actions ───────────────────────────────────────────────────────────

export async function listTelegramChannels(): Promise<TelegramChannel[]> {
  const d = await post({ action: "list-channels" });
  return d.channels;
}

export async function addTelegramChannel(params: {
  name: string;
  telegram_username: string;
  category?: string;
  description?: string;
}): Promise<TelegramChannel> {
  const d = await post({ action: "add-channel", ...params });
  return d.channel;
}

export async function updateTelegramChannel(id: string, patch: Partial<TelegramChannel>): Promise<TelegramChannel> {
  const d = await post({ action: "update-channel", id, ...patch });
  return d.channel;
}

export async function deleteTelegramChannel(id: string): Promise<void> {
  await post({ action: "delete-channel", id });
}

// ── Lesson actions ────────────────────────────────────────────────────────────

export async function listTelegramLessons(params?: {
  page?: number;
  channelId?: string;
}): Promise<{ lessons: TelegramImportedLesson[]; total: number; page: number; pages: number }> {
  return post({ action: "list-lessons", ...params });
}

export async function updateTelegramLesson(
  id: string,
  patch: { title?: string; description?: string; category?: string; status?: string; speaker_name?: string },
): Promise<TelegramImportedLesson> {
  const d = await post({ action: "update-lesson", id, ...patch });
  return d.lesson;
}

export async function deleteTelegramLesson(id: string): Promise<void> {
  await post({ action: "delete-lesson", id });
}

// ── Logs ─────────────────────────────────────────────────────────────────────

export async function listExtractionLogs(page = 1): Promise<{ logs: ExtractionLog[]; total: number; page: number }> {
  return post({ action: "list-logs", page });
}

// ── Manual trigger ────────────────────────────────────────────────────────────

export async function triggerExtraction(channelId?: string, dryRun = false) {
  return post({ action: "trigger-extraction", channelId, dryRun });
}
