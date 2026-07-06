"use client";

import { useCallback, useEffect, useState } from "react";
import { useAdminShell } from "@/views/admin/AdminShell";
import { C } from "@/lib/theme";

// ── Types ─────────────────────────────────────────────────────────────────────

type TgTab = "status" | "channels" | "review" | "stats";

type BotStatus = {
  bot: { first_name: string; username: string; id: number } | null;
  webhook: { url: string; pending_update_count: number; last_error_message?: string } | null;
  subscribers: number;
  channels: { total: number; active: number };
  tokenConfigured: boolean;
  anthropicConfigured: boolean;
};

type TgChannel = {
  id: string;
  channel_username: string;
  channel_title: string | null;
  channel_id: string | null;
  is_active: boolean;
  total_messages: number;
  total_lessons: number;
  total_duplicates: number;
  last_message_at: string | null;
};

type TgLesson = {
  id: string;
  title: string | null;
  sheikh_name: string | null;
  category: string | null;
  event_date: string | null;
  event_day: string | null;
  event_time: string | null;
  mosque: string | null;
  area: string | null;
  city: string | null;
  description: string | null;
  image_url: string | null;
  quality_score: number;
  quality_status: string;
  quality_reason: string | null;
  review_status: string;
  created_at: string;
  tg_raw_messages?: {
    raw_text: string | null;
    raw_caption: string | null;
    channel_username: string | null;
    message_date: string | null;
  } | null;
};

type TgStats = {
  channels: { total: number; active: number; list: TgChannel[] };
  rawMessages: { total: number; byStatus: Record<string, number> };
  extractedLessons: {
    total: number;
    byQuality: Record<string, number>;
    byReview: Record<string, number>;
    byCategory: Record<string, number>;
    topSheikhs: { name: string; count: number }[];
  };
  successRate: number;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const API = "/api/admin/telegram";

async function tgPost(action: string, extra: Record<string, unknown> = {}) {
  const res = await fetch(API, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...extra }),
  });
  return res.json() as Promise<Record<string, unknown> & { ok: boolean; error?: string }>;
}

async function tgGet(action: string, params: Record<string, string> = {}) {
  const qs = new URLSearchParams({ action, ...params }).toString();
  const res = await fetch(`${API}?${qs}`, { credentials: "include" });
  return res.json() as Promise<Record<string, unknown> & { ok: boolean; error?: string }>;
}

const QUALITY_COLORS: Record<string, string> = {
  complete: "#16a34a",
  needs_review: "#97A59F",
  incomplete: "#dc2626",
  duplicate: "#7c3aed",
  rejected: "#9ca3af",
};

const QUALITY_AR: Record<string, string> = {
  complete: "مكتمل",
  needs_review: "يحتاج مراجعة",
  incomplete: "ناقص",
  duplicate: "مكرر",
  rejected: "مرفوض",
};

// ── Status Tab ────────────────────────────────────────────────────────────────

function StatusTab() {
  const { showSuccess, showError } = useAdminShell();
  const [data, setData] = useState<BotStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState("https://majlisilm.com/api/webhook/telegram");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const json = await tgPost("status");
      if (json.ok) setData(json as unknown as BotStatus);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const act = async (action: string, body: Record<string, unknown> = {}) => {
    setActing(action);
    try {
      const json = await tgPost(action, body);
      if (json.ok) { showSuccess("تمت العملية بنجاح."); await load(); }
      else showError(String(json.error || "فشلت العملية."));
    } catch { showError("خطأ في الاتصال."); }
    finally { setActing(null); }
  };

  if (loading) return <Spinner />;
  if (!data) return <EmptyState text="تعذّر تحميل حالة البوت." />;

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      {/* Config indicators */}
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        <Badge ok={data.tokenConfigured} label="Telegram Token" />
        <Badge ok={data.anthropicConfigured} label="Anthropic API" />
        <Badge ok={!!data.bot} label="Bot Connected" />
        <Badge ok={!!data.webhook?.url} label="Webhook Active" />
      </div>

      {/* Bot info */}
      {data.bot && (
        <InfoCard title="معلومات البوت">
          <Row label="الاسم" value={data.bot.first_name} />
          <Row label="المعرف" value={`@${data.bot.username}`} />
          <Row label="المشتركون" value={String(data.subscribers)} />
          <Row label="القنوات المُراقَبة" value={`${data.channels.active} نشطة من ${data.channels.total}`} />
        </InfoCard>
      )}

      {/* Webhook info */}
      <InfoCard title="Webhook">
        <Row label="الرابط" value={data.webhook?.url || "غير مُعيَّن"} mono />
        {data.webhook?.pending_update_count !== undefined && (
          <Row label="طلبات معلقة" value={String(data.webhook.pending_update_count)} />
        )}
        {data.webhook?.last_error_message && (
          <Row label="آخر خطأ" value={data.webhook.last_error_message} error />
        )}
      </InfoCard>

      {/* Webhook control */}
      <InfoCard title="ضبط الـ Webhook">
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
          <input
            value={webhookUrl}
            onChange={e => setWebhookUrl(e.target.value)}
            style={{ flex: 1, padding: "0.4rem 0.6rem", fontSize: "0.8rem", border: `1px solid ${C.line}`, borderRadius: "0.375rem", background: C.parchment, color: C.ink, fontFamily: "monospace" }}
          />
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Btn loading={acting === "set-webhook"} onClick={() => act("set-webhook", { webhookUrl })}>
            تعيين Webhook
          </Btn>
          <Btn loading={acting === "delete-webhook"} variant="danger" onClick={() => act("delete-webhook")}>
            حذف Webhook
          </Btn>
          <Btn loading={acting === "sync-now"} variant="secondary" onClick={() => act("sync-now", { batchSize: 10 })}>
            تشغيل المعالجة الآن
          </Btn>
        </div>
      </InfoCard>
    </div>
  );
}

// ── Channels Tab ──────────────────────────────────────────────────────────────

function ChannelsTab() {
  const { showSuccess, showError } = useAdminShell();
  const [channels, setChannels] = useState<TgChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUsername, setNewUsername] = useState("");
  const [adding, setAdding] = useState(false);
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const json = await tgPost("channels");
      if (json.ok) setChannels((json.channels as TgChannel[]) || []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const addChannel = async () => {
    const username = newUsername.trim().replace(/^@/, "");
    if (!username) return;
    setAdding(true);
    try {
      const json = await tgPost("add-channel", { channelUsername: username });
      if (json.ok) { showSuccess(`تمت إضافة @${username}`); setNewUsername(""); await load(); }
      else showError(String(json.error || "فشل الإضافة."));
    } catch { showError("خطأ في الاتصال."); }
    finally { setAdding(false); }
  };

  const toggle = async (username: string, current: boolean) => {
    setActing(username);
    try {
      const json = await tgPost("toggle-channel", { channelUsername: username, isActive: !current });
      if (json.ok) { showSuccess("تم التحديث."); await load(); }
      else showError(String(json.error || "فشل."));
    } catch { showError("خطأ."); }
    finally { setActing(null); }
  };

  const remove = async (username: string) => {
    if (!confirm(`حذف قناة @${username}؟`)) return;
    setActing(`del-${username}`);
    try {
      const json = await tgPost("delete-channel", { channelUsername: username });
      if (json.ok) { showSuccess("تم الحذف."); await load(); }
      else showError(String(json.error || "فشل."));
    } catch { showError("خطأ."); }
    finally { setActing(null); }
  };

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      {/* Add channel */}
      <InfoCard title="إضافة قناة جديدة">
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input
            placeholder="@channel_username"
            value={newUsername}
            onChange={e => setNewUsername(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addChannel()}
            style={{ flex: 1, padding: "0.4rem 0.6rem", fontSize: "0.875rem", border: `1px solid ${C.line}`, borderRadius: "0.375rem", background: C.parchment, color: C.ink }}
          />
          <Btn loading={adding} onClick={addChannel}>إضافة</Btn>
        </div>
      </InfoCard>

      {/* Channels list */}
      {loading ? <Spinner /> : channels.length === 0 ? (
        <EmptyState text="لا توجد قنوات مُراقَبة." />
      ) : (
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {channels.map(ch => (
            <div key={ch.id} style={{
              background: C.panel,
              border: `1px solid ${C.line}`,
              borderRadius: "0.625rem",
              padding: "0.875rem 1rem",
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              flexWrap: "wrap",
            }}>
              {/* Status dot */}
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: ch.is_active ? "#16a34a" : "#9ca3af", flexShrink: 0 }} />

              {/* Channel info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>
                  @{ch.channel_username}
                  {ch.channel_title && <span style={{ fontWeight: 400, color: C.inkSoft, marginRight: "0.5rem" }}>{ch.channel_title}</span>}
                </div>
                <div style={{ fontSize: "0.75rem", color: C.inkSoft, marginTop: "0.2rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                  <span>رسائل: {ch.total_messages || 0}</span>
                  <span>دروس: {ch.total_lessons || 0}</span>
                  <span>مكررة: {ch.total_duplicates || 0}</span>
                  {ch.last_message_at && <span>آخر رسالة: {new Date(ch.last_message_at).toLocaleDateString("ar-KW")}</span>}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <Btn
                  loading={acting === ch.channel_username}
                  variant={ch.is_active ? "secondary" : "primary"}
                  small
                  onClick={() => toggle(ch.channel_username, ch.is_active)}
                >
                  {ch.is_active ? "إيقاف" : "تفعيل"}
                </Btn>
                <Btn loading={acting === `del-${ch.channel_username}`} variant="danger" small onClick={() => remove(ch.channel_username)}>
                  حذف
                </Btn>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Review Tab ────────────────────────────────────────────────────────────────

function ReviewTab() {
  const { showSuccess, showError } = useAdminShell();
  const [lessons, setLessons] = useState<TgLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [qualityFilter, setQualityFilter] = useState<string>("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setSelected(new Set());
    try {
      const params: Record<string, string> = { limit: "30" };
      if (qualityFilter !== "all") params.qualityStatus = qualityFilter;
      const json = await tgGet("pending-lessons", params);
      if (json.ok) setLessons((json.lessons as TgLesson[]) || []);
    } finally { setLoading(false); }
  }, [qualityFilter]);

  useEffect(() => { void load(); }, [load]);

  const approve = async (id: string) => {
    setActing(id);
    try {
      const json = await tgPost("approve-lesson", { lessonId: id });
      if (json.ok) { showSuccess("تمت الموافقة."); await load(); }
      else showError(String(json.error || "فشل."));
    } finally { setActing(null); }
  };

  const reject = async (id: string) => {
    const reason = prompt("سبب الرفض (اختياري):");
    setActing(`reject-${id}`);
    try {
      const json = await tgPost("reject-lesson", { lessonId: id, reason: reason || undefined });
      if (json.ok) { showSuccess("تم الرفض."); await load(); }
      else showError(String(json.error || "فشل."));
    } finally { setActing(null); }
  };

  const bulkApprove = async () => {
    if (!selected.size) return;
    setActing("bulk");
    try {
      const json = await tgPost("bulk-approve", { lessonIds: [...selected] });
      if (json.ok) { showSuccess(`تمت الموافقة على ${json.approved as number} دروس.`); await load(); }
      else showError(String(json.error || "فشل."));
    } finally { setActing(null); }
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      {/* Filters + bulk actions */}
      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
        {["all", "complete", "needs_review", "incomplete"].map(q => (
          <button key={q} onClick={() => setQualityFilter(q)}
            style={{ padding: "0.3rem 0.75rem", borderRadius: "999px", border: "none", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600,
              background: qualityFilter === q ? C.emeraldDeep : C.line, color: qualityFilter === q ? "#fff" : C.ink }}>
            {q === "all" ? "الكل" : QUALITY_AR[q] || q}
          </button>
        ))}
        {selected.size > 0 && (
          <Btn loading={acting === "bulk"} small onClick={bulkApprove} style={{ marginRight: "auto" }}>
            ✓ موافقة جماعية ({selected.size})
          </Btn>
        )}
        <Btn small variant="secondary" onClick={load}>↻ تحديث</Btn>
      </div>

      {loading ? <Spinner /> : lessons.length === 0 ? (
        <EmptyState text="لا توجد دروس معلقة." />
      ) : (
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {lessons.map(lesson => {
            const isExpanded = expanded === lesson.id;
            const raw = lesson.tg_raw_messages;
            return (
              <div key={lesson.id} style={{
                background: C.panel,
                border: `1px solid ${selected.has(lesson.id) ? C.emerald : C.line}`,
                borderRadius: "0.625rem",
                padding: "0.875rem 1rem",
                display: "grid",
                gap: "0.5rem",
              }}>
                {/* Header row */}
                <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                  <input type="checkbox" checked={selected.has(lesson.id)} onChange={() => toggleSelect(lesson.id)}
                    style={{ marginTop: 3, flexShrink: 0, accentColor: C.emerald }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: "0.2rem" }}>
                      {lesson.title || <span style={{ color: C.inkSoft }}>بدون عنوان</span>}
                    </div>
                    <div style={{ fontSize: "0.78rem", color: C.inkSoft, display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                      {lesson.sheikh_name && <span>👤 {lesson.sheikh_name}</span>}
                      {lesson.mosque && <span>🕌 {lesson.mosque}</span>}
                      {lesson.area && <span>📍 {lesson.area}</span>}
                      {lesson.event_date && <span>📅 {lesson.event_date}</span>}
                      {lesson.event_time && <span>🕐 {lesson.event_time}</span>}
                      {lesson.category && <span>📂 {lesson.category}</span>}
                    </div>
                  </div>
                  {/* Quality badge */}
                  <span style={{
                    padding: "0.15rem 0.5rem", borderRadius: "999px", fontSize: "0.72rem", fontWeight: 700, flexShrink: 0,
                    background: `${QUALITY_COLORS[lesson.quality_status] ?? "#999999"}20`,
                    color: QUALITY_COLORS[lesson.quality_status] || C.inkSoft,
                  }}>
                    {QUALITY_AR[lesson.quality_status] || lesson.quality_status}
                    {lesson.quality_score > 0 && ` (${Math.round(lesson.quality_score * 100)}%)`}
                  </span>
                </div>

                {/* Channel + source info */}
                {raw && (
                  <div style={{ fontSize: "0.75rem", color: C.inkSoft, paddingRight: "1.5rem" }}>
                    {raw.channel_username && <span>📢 @{raw.channel_username}</span>}
                    {raw.message_date && <span style={{ marginRight: "0.75rem" }}>🗓 {new Date(raw.message_date).toLocaleDateString("ar-KW")}</span>}
                  </div>
                )}

                {/* Expand/collapse raw text */}
                {(raw?.raw_text || raw?.raw_caption || lesson.description) && (
                  <button onClick={() => setExpanded(isExpanded ? null : lesson.id)}
                    style={{ textAlign: "right", background: "none", border: "none", cursor: "pointer", color: C.emerald, fontSize: "0.78rem", padding: "0 1.5rem" }}>
                    {isExpanded ? "▲ إخفاء النص الأصلي" : "▼ عرض النص الأصلي"}
                  </button>
                )}
                {isExpanded && (
                  <pre style={{ fontSize: "0.75rem", background: C.parchmentDeep, padding: "0.625rem", borderRadius: "0.375rem", whiteSpace: "pre-wrap", wordBreak: "break-word", margin: "0 0 0 1.5rem", maxHeight: "12rem", overflow: "auto", direction: "rtl", textAlign: "right" }}>
                    {raw?.raw_caption || raw?.raw_text || lesson.description}
                  </pre>
                )}

                {/* Actions */}
                <div style={{ display: "flex", gap: "0.5rem", paddingRight: "1.5rem" }}>
                  <Btn loading={acting === lesson.id} small onClick={() => approve(lesson.id)}>✓ قبول</Btn>
                  <Btn loading={acting === `reject-${lesson.id}`} small variant="danger" onClick={() => reject(lesson.id)}>✗ رفض</Btn>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Stats Tab ─────────────────────────────────────────────────────────────────

function StatsTab() {
  const [data, setData] = useState<TgStats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const json = await tgPost("stats");
      if (json.ok) setData(json as unknown as TgStats);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  if (loading) return <Spinner />;
  if (!data) return <EmptyState text="تعذّر تحميل الإحصائيات." />;

  const raw = data?.rawMessages ?? ({} as TgStats["rawMessages"]);
  const lessons = data?.extractedLessons ?? ({} as TgStats["extractedLessons"]);

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.75rem" }}>
        <StatCard label="إجمالي الرسائل" value={raw.total ?? 0} color={C.emerald} />
        <StatCard label="دروس مُستخرجة" value={lessons.total ?? 0} color="#2563eb" />
        <StatCard label="بانتظار المراجعة" value={lessons.byReview?.pending ?? 0} color="#97A59F" />
        <StatCard label="مُعتمدة" value={lessons.byReview?.approved ?? 0} color="#16a34a" />
        <StatCard label="معدل النجاح" value={`${data.successRate}%`} color="#7c3aed" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
        {/* Raw message breakdown */}
        <InfoCard title="حالة استخراج الرسائل">
          {Object.entries(raw.byStatus ?? {}).map(([status, count]) => (
            <ProgressRow key={status} label={status} value={count as number} total={raw.total ?? 0} />
          ))}
        </InfoCard>

        {/* Review breakdown */}
        <InfoCard title="حالة المراجعة">
          {Object.entries(lessons.byReview ?? {}).map(([status, count]) => (
            <ProgressRow key={status} label={status} value={count as number} total={lessons.total ?? 0} />
          ))}
        </InfoCard>

        {/* Quality breakdown */}
        <InfoCard title="جودة الدروس">
          {Object.entries(lessons.byQuality ?? {}).map(([q, count]) => (
            <ProgressRow key={q} label={QUALITY_AR[q] || q} value={count as number} total={lessons.total ?? 0} color={QUALITY_COLORS[q]} />
          ))}
        </InfoCard>

        {/* Top sheikhs */}
        <InfoCard title="أكثر المشايخ حضوراً">
          {(lessons.topSheikhs ?? []).length === 0 ? (
            <span style={{ color: C.inkSoft, fontSize: "0.8rem" }}>لا توجد بيانات.</span>
          ) : (lessons.topSheikhs ?? []).map((s, i) => (
            <div key={s.name} style={{ display: "flex", justifyContent: "space-between", padding: "0.2rem 0", fontSize: "0.82rem", borderBottom: i < (lessons.topSheikhs ?? []).length - 1 ? `1px solid ${C.line}` : "none" }}>
              <span>{s.name}</span>
              <span style={{ fontWeight: 700, color: C.emerald }}>{s.count}</span>
            </div>
          ))}
        </InfoCard>
      </div>

      {/* Channels table */}
      {data.channels.list.length > 0 && (
        <InfoCard title="القنوات">
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${C.line}`, color: C.inkSoft }}>
                  <th style={{ padding: "0.4rem 0.5rem", textAlign: "right" }}>القناة</th>
                  <th style={{ padding: "0.4rem 0.5rem", textAlign: "center" }}>رسائل</th>
                  <th style={{ padding: "0.4rem 0.5rem", textAlign: "center" }}>دروس</th>
                  <th style={{ padding: "0.4rem 0.5rem", textAlign: "center" }}>مكررة</th>
                  <th style={{ padding: "0.4rem 0.5rem", textAlign: "center" }}>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {data.channels.list.map(ch => (
                  <tr key={ch.channel_username} style={{ borderBottom: `1px solid ${C.line}` }}>
                    <td style={{ padding: "0.4rem 0.5rem" }}>@{ch.channel_username}</td>
                    <td style={{ padding: "0.4rem 0.5rem", textAlign: "center" }}>{ch.total_messages || 0}</td>
                    <td style={{ padding: "0.4rem 0.5rem", textAlign: "center" }}>{ch.total_lessons || 0}</td>
                    <td style={{ padding: "0.4rem 0.5rem", textAlign: "center" }}>{ch.total_duplicates || 0}</td>
                    <td style={{ padding: "0.4rem 0.5rem", textAlign: "center" }}>
                      <span style={{ fontSize: "0.72rem", padding: "0.1rem 0.4rem", borderRadius: "999px", background: ch.is_active ? "#dcfce7" : "#f3f4f6", color: ch.is_active ? "#166534" : "#6b7280" }}>
                        {ch.is_active ? "نشطة" : "متوقفة"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </InfoCard>
      )}
    </div>
  );
}

// ── Main Section ──────────────────────────────────────────────────────────────

export function TelegramSection() {
  const [tab, setTab] = useState<TgTab>("status");

  const TABS: { key: TgTab; label: string }[] = [
    { key: "status", label: "حالة البوت" },
    { key: "channels", label: "القنوات" },
    { key: "review", label: "مراجعة الدروس" },
    { key: "stats", label: "الإحصائيات" },
  ];

  return (
    <div>
      <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "0 0 1rem 0" }}>بوت Telegram + مراقبة القنوات</h2>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.375rem", marginBottom: "1.25rem", borderBottom: `2px solid ${C.line}`, paddingBottom: "0" }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{
              padding: "0.5rem 1rem",
              border: "none",
              background: "none",
              cursor: "pointer",
              fontWeight: tab === t.key ? 700 : 400,
              fontSize: "0.875rem",
              color: tab === t.key ? C.emeraldDeep : C.inkSoft,
              borderBottom: tab === t.key ? `3px solid ${C.emeraldDeep}` : "3px solid transparent",
              marginBottom: "-2px",
              transition: "all 0.15s",
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "status" && <StatusTab />}
      {tab === "channels" && <ChannelsTab />}
      {tab === "review" && <ReviewTab />}
      {tab === "stats" && <StatsTab />}
    </div>
  );
}

// ── Shared UI primitives ──────────────────────────────────────────────────────

function Spinner() {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
      <div style={{ width: 28, height: 28, border: `3px solid ${C.line}`, borderTop: `3px solid ${C.emerald}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div style={{ textAlign: "center", color: C.inkSoft, padding: "2rem", fontSize: "0.875rem" }}>{text}</div>;
}

function Badge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "0.3rem",
      padding: "0.2rem 0.6rem", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 600,
      background: ok ? "#dcfce7" : "#fee2e2", color: ok ? "#166534" : "#991b1b",
    }}>
      {ok ? "✓" : "✗"} {label}
    </span>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.625rem", padding: "0.875rem 1rem" }}>
      <div style={{ fontWeight: 700, fontSize: "0.85rem", marginBottom: "0.625rem", color: C.inkSoft }}>{title}</div>
      <div style={{ display: "grid", gap: "0.3rem" }}>{children}</div>
    </div>
  );
}

function Row({ label, value, mono = false, error = false }: { label: string; value: string; mono?: boolean; error?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", fontSize: "0.82rem", alignItems: "flex-start" }}>
      <span style={{ color: C.inkSoft, flexShrink: 0 }}>{label}</span>
      <span style={{ fontFamily: mono ? "monospace" : "inherit", textAlign: "left", wordBreak: "break-all", color: error ? "#dc2626" : C.ink }}>{value}</span>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.625rem", padding: "1rem", textAlign: "center" }}>
      <div style={{ fontSize: "1.6rem", fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: "0.75rem", color: C.inkSoft, marginTop: "0.25rem" }}>{label}</div>
    </div>
  );
}

function ProgressRow({ label, value, total, color = C.emerald }: { label: string; value: number; total: number; color?: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div style={{ fontSize: "0.82rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.15rem" }}>
        <span>{label}</span>
        <span style={{ color: C.inkSoft }}>{value} ({pct}%)</span>
      </div>
      <div style={{ height: 4, background: C.line, borderRadius: 2 }}>
        <div style={{ height: 4, width: `${pct}%`, background: color, borderRadius: 2, transition: "width 0.4s" }} />
      </div>
    </div>
  );
}

function Btn({
  children, onClick, loading = false, variant = "primary", small = false, style: extraStyle,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  loading?: boolean;
  variant?: "primary" | "secondary" | "danger";
  small?: boolean;
  style?: React.CSSProperties;
}) {
  const bg = variant === "primary" ? C.emeraldDeep : variant === "danger" ? "#dc2626" : C.line;
  const color = variant === "secondary" ? C.ink : "#fff";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      style={{
        padding: small ? "0.3rem 0.65rem" : "0.45rem 1rem",
        fontSize: small ? "0.78rem" : "0.85rem",
        fontWeight: 600,
        background: loading ? C.line : bg,
        color: loading ? C.inkSoft : color,
        border: "none",
        borderRadius: "0.375rem",
        cursor: loading ? "not-allowed" : "pointer",
        transition: "opacity 0.15s",
        whiteSpace: "nowrap",
        ...extraStyle,
      }}
    >
      {loading ? "…" : children}
    </button>
  );
}
