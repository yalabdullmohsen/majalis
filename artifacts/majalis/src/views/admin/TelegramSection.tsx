import { useCallback, useEffect, useState } from "react";
import { useAdminShell } from "@/views/admin/AdminShell";
import { Building2, CalendarDays, Clock, Folder, MapPin, Send, User } from "lucide-react";

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
  needs_review: "#5E655F",
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

function Spinner() {
  return (
    <div className="tgm-spinner">
      <div className="tgm-spinner-ring" />
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="tgm-empty">{text}</div>;
}

function Badge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`tgm-badge tgm-badge--${ok ? "ok" : "error"}`}
    >
      {ok ? "✓" : "✗"} {label}
    </span>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="tgm-info-card">
      <div className="tgm-info-title">{title}</div>
      <div className="tgm-info-body">{children}</div>
    </div>
  );
}

function Row({ label, value, mono = false, error = false }: { label: string; value: string; mono?: boolean; error?: boolean }) {
  return (
    <div className="tgm-row">
      <span className="tgm-row-label">{label}</span>
      <span className={`tgm-row-val${mono ? " tgm-row-val--mono" : ""}${error ? " tgm-row-val--err" : ""}`}>{value}</span>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="tgm-stat-card">
      <div className="tgm-stat-val" style={{ "--tgm-sv-color": color } as React.CSSProperties}>{value}</div>
      <div className="tgm-stat-label">{label}</div>
    </div>
  );
}

function ProgressRow({ label, value, total, color = "var(--majalis-emerald)" }: { label: string; value: number; total: number; color?: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="tgm-progress-row">
      <div className="tgm-progress-head">
        <span>{label}</span>
        <span className="tgm-progress-sub">{value} ({pct}%)</span>
      </div>
      <div className="tgm-progress-bar">
        <div className="tgm-progress-fill" style={{ "--tgm-pf-w": `${pct}%`, "--tgm-pf-color": color } as React.CSSProperties} />
      </div>
    </div>
  );
}

function Btn({
  children, onClick, loading = false, variant = "primary", small = false, className: extraClass,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  loading?: boolean;
  variant?: "primary" | "secondary" | "danger";
  small?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={`tgm-btn tgm-btn--${variant}${small ? " tgm-btn--small" : ""}${extraClass ? ` ${extraClass}` : ""}`}
    >
      {loading ? "…" : children}
    </button>
  );
}

function StatusTab() {
  const { showSuccess, showError } = useAdminShell();
  const [data, setData] = useState<BotStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState("https://www.majlisilm.com/api/webhook/telegram");

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
    <div className="tgm-status-grid">
      <div className="tgm-badges-row">
        <Badge ok={data.tokenConfigured} label="Telegram Token" />
        <Badge ok={data.anthropicConfigured} label="Anthropic API" />
        <Badge ok={!!data.bot} label="البوت متصل" />
        <Badge ok={!!data.webhook?.url} label="Webhook نشط" />
      </div>

      {data.bot && (
        <InfoCard title="معلومات البوت">
          <Row label="الاسم" value={data.bot.first_name} />
          <Row label="المعرف" value={`@${data.bot.username}`} />
          <Row label="المشتركون" value={String(data.subscribers)} />
          <Row label="القنوات المُراقَبة" value={`${data.channels.active} نشطة من ${data.channels.total}`} />
        </InfoCard>
      )}

      <InfoCard title="Webhook التيليغرام">
        <Row label="الرابط" value={data.webhook?.url || "غير مُعيَّن"} mono />
        {data.webhook?.pending_update_count !== undefined && (
          <Row label="طلبات معلقة" value={String(data.webhook.pending_update_count)} />
        )}
        {data.webhook?.last_error_message && (
          <Row label="آخر خطأ" value={data.webhook.last_error_message} error />
        )}
      </InfoCard>

      <InfoCard title="ضبط الـ Webhook">
        <div className="tgm-webhook-row">
          <input
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            className="tgm-webhook-input"
          />
        </div>
        <div className="tgm-btn-group">
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
    <div className="tgm-grid-gap">
      <InfoCard title="إضافة قناة جديدة">
        <div className="tgm-ch-add-row">
          <input
            placeholder="@channel_username"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addChannel()}
            className="tgm-ch-input"
          />
          <Btn loading={adding} onClick={addChannel}>إضافة</Btn>
        </div>
      </InfoCard>

      {loading ? <Spinner /> : channels.length === 0 ? (
        <EmptyState text="لا توجد قنوات مُراقَبة." />
      ) : (
        <div className="tgm-channels-list">
          {channels.map((ch) => (
            <div key={ch.id} className="tgm-ch-card">
              <span
                className={`tgm-ch-dot${ch.is_active ? " tgm-ch-dot--active" : ""}`}
              />
              <div className="tgm-ch-info">
                <div className="tgm-ch-name">
                  @{ch.channel_username}
                  {ch.channel_title && <span className="tgm-ch-title-span">{ch.channel_title}</span>}
                </div>
                <div className="tgm-ch-meta">
                  <span>رسائل: {ch.total_messages || 0}</span>
                  <span>دروس: {ch.total_lessons || 0}</span>
                  <span>مكررة: {ch.total_duplicates || 0}</span>
                  {ch.last_message_at && <span>آخر رسالة: {new Date(ch.last_message_at).toLocaleDateString("ar-KW")}</span>}
                </div>
              </div>
              <div className="tgm-ch-actions">
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
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div className="tgm-grid-gap">
      <div className="tgm-filters-row">
        {["all", "complete", "needs_review", "incomplete"].map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => setQualityFilter(q)}
            className={`tgm-filter-btn${qualityFilter === q ? " tgm-filter-btn--active" : ""}`}
          >
            {q === "all" ? "الكل" : QUALITY_AR[q] || q}
          </button>
        ))}
        {selected.size > 0 && (
          <Btn loading={acting === "bulk"} small onClick={bulkApprove} className="tgm-btn--auto">
            موافقة جماعية ({selected.size})
          </Btn>
        )}
        <Btn small variant="secondary" onClick={load}>↻ تحديث</Btn>
      </div>

      {loading ? <Spinner /> : lessons.length === 0 ? (
        <EmptyState text="لا توجد دروس معلقة." />
      ) : (
        <div className="tgm-lessons-list">
          {lessons.map((lesson) => {
            const isExpanded = expanded === lesson.id;
            const raw = lesson.tg_raw_messages;
            return (
              <div
                key={lesson.id}
                className={`tgm-lesson-card${selected.has(lesson.id) ? " tgm-lesson-card--selected" : ""}`}
              >
                <div className="tgm-lesson-header">
                  <input
                    type="checkbox"
                    checked={selected.has(lesson.id)}
                    onChange={() => toggleSelect(lesson.id)}
                    className="tgm-lesson-check"
                  />
                  <div className="tgm-lesson-info">
                    <div className="tgm-lesson-title">
                      {lesson.title || <span className="tgm-no-title">بدون عنوان</span>}
                    </div>
                    <div className="tgm-lesson-meta">
                      {lesson.sheikh_name && <span><User size={11} className="inline ml-0.5" aria-hidden="true" /> {lesson.sheikh_name}</span>}
                      {lesson.mosque && <span><Building2 size={11} className="inline ml-0.5" aria-hidden="true" /> {lesson.mosque}</span>}
                      {lesson.area && <span><MapPin size={11} className="inline ml-0.5" aria-hidden="true" /> {lesson.area}</span>}
                      {lesson.event_date && <span><CalendarDays size={11} className="inline ml-0.5" />{lesson.event_date}</span>}
                      {lesson.event_time && <span><Clock size={11} className="inline ml-0.5" />{lesson.event_time}</span>}
                      {lesson.category && <span><Folder size={11} className="inline ml-0.5" />{lesson.category}</span>}
                    </div>
                  </div>
                  <span
                    className="tgm-quality-badge"
                    style={{
                      "--tgm-qb-bg": `${QUALITY_COLORS[lesson.quality_status] ?? "#999999"}20`,
                      "--tgm-qb-color": QUALITY_COLORS[lesson.quality_status] || "var(--majalis-ink-soft)",
                    } as React.CSSProperties}
                  >
                    {QUALITY_AR[lesson.quality_status] || lesson.quality_status}
                    {lesson.quality_score > 0 && ` (${Math.round(lesson.quality_score * 100)}%)`}
                  </span>
                </div>

                {raw && (
                  <div className="tgm-raw-source">
                    {raw.channel_username && <span><Send size={11} className="inline ml-0.5" aria-hidden="true" /> @{raw.channel_username}</span>}
                    {raw.message_date && <span className="tgm-date-span"><CalendarDays size={11} className="inline ml-0.5" />{new Date(raw.message_date).toLocaleDateString("ar-KW")}</span>}
                  </div>
                )}

                {(raw?.raw_text || raw?.raw_caption || lesson.description) && (
                  <button
                    type="button"
                    onClick={() => setExpanded(isExpanded ? null : lesson.id)}
                    className="tgm-expand-btn"
                  >
                    {isExpanded ? "▲ إخفاء النص الأصلي" : "▼ عرض النص الأصلي"}
                  </button>
                )}
                {isExpanded && (
                  <pre className="tgm-raw-pre">
                    {raw?.raw_caption || raw?.raw_text || lesson.description}
                  </pre>
                )}

                <div className="tgm-lesson-actions">
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
    <div className="tgm-grid-gap">
      <div className="tgm-stats-grid">
        <StatCard label="إجمالي الرسائل" value={raw.total ?? 0} color="var(--majalis-emerald)" />
        <StatCard label="دروس مُستخرجة" value={lessons.total ?? 0} color="#2563eb" />
        <StatCard label="بانتظار المراجعة" value={lessons.byReview?.pending ?? 0} color="#5E655F" />
        <StatCard label="مُعتمدة" value={lessons.byReview?.approved ?? 0} color="#16a34a" />
        <StatCard label="معدل النجاح" value={`${data.successRate}%`} color="#7c3aed" />
      </div>

      <div className="tgm-panels-grid">
        <InfoCard title="حالة استخراج الرسائل">
          {Object.entries(raw.byStatus ?? {}).map(([status, count]) => (
            <ProgressRow key={status} label={status} value={count as number} total={raw.total ?? 0} />
          ))}
        </InfoCard>

        <InfoCard title="حالة المراجعة">
          {Object.entries(lessons.byReview ?? {}).map(([status, count]) => (
            <ProgressRow key={status} label={status} value={count as number} total={lessons.total ?? 0} />
          ))}
        </InfoCard>

        <InfoCard title="جودة الدروس">
          {Object.entries(lessons.byQuality ?? {}).map(([q, count]) => (
            <ProgressRow key={q} label={QUALITY_AR[q] || q} value={count as number} total={lessons.total ?? 0} color={QUALITY_COLORS[q]} />
          ))}
        </InfoCard>

        <InfoCard title="أكثر المشايخ حضوراً">
          {(lessons.topSheikhs ?? []).length === 0 ? (
            <span className="tgm-sheikh-empty">لا توجد بيانات.</span>
          ) : (lessons.topSheikhs ?? []).map((s) => (
            <div key={s.name} className="tgm-sheikh-row">
              <span>{s.name}</span>
              <span className="tgm-sheikh-count">{s.count}</span>
            </div>
          ))}
        </InfoCard>

      </div>

      {data.channels.list.length > 0 && (
        <InfoCard title="القنوات">
          <div className="tgm-table-wrap">
            <table className="tgm-table">
              <thead>
                <tr className="tgm-thead-row">
                  <th className="tgm-th">القناة</th>
                  <th className="tgm-th tgm-th--center">رسائل</th>
                  <th className="tgm-th tgm-th--center">دروس</th>
                  <th className="tgm-th tgm-th--center">مكررة</th>
                  <th className="tgm-th tgm-th--center">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {data.channels.list.map((ch) => (
                  <tr key={ch.channel_username} className="tgm-tr">
                    <td className="tgm-td">@{ch.channel_username}</td>
                    <td className="tgm-td tgm-td--center">{ch.total_messages || 0}</td>
                    <td className="tgm-td tgm-td--center">{ch.total_lessons || 0}</td>
                    <td className="tgm-td tgm-td--center">{ch.total_duplicates || 0}</td>
                    <td className="tgm-td tgm-td--center">
                      <span className={ch.is_active ? "tgm-ch-active-badge" : "tgm-ch-inactive-badge"}>
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
      <h2 className="tgm-title">بوت Telegram + مراقبة القنوات</h2>

      <div className="tgm-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`tgm-tab${tab === t.key ? " tgm-tab--active" : ""}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "status" && <StatusTab />}
      {tab === "channels" && <ChannelsTab />}
      {tab === "review" && <ReviewTab />}
      {tab === "stats" && <StatsTab />}
    </div>
  );
}
