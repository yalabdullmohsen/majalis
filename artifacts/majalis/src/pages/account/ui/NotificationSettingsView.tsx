import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Link } from "wouter";
import { Archive, Bell, CheckCheck, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/ui-common";
import { hapticTap, isNative } from "@/lib/capacitor-utils";
import { toArabicDigits } from "@/lib/utils";
import {
  loadNotifPrefs,
  saveNotifPrefs,
  type NotifPrefs,
} from "@/lib/local-notifications";
import {
  getNotificationPermissionStatus,
  requestNotificationPermission,
  type PermissionStatus,
} from "@/lib/prayer-local-notifications";
import {
  loadHistory,
  markRead,
  markAllRead,
  archiveRecord,
  deleteRecord,
  clearAll,
  searchHistory,
  type NotifRecord,
} from "@/lib/notification-history";
import { applyPageSeo } from "@/lib/seo";
import { PushPrompt } from "@/components/PushPrompt";
import { fireTestLocalNotification } from "@/lib/notifications/test-trigger";
import "@/styles/pages/notifications.css";

type HistoryTab = "inbox" | "archived";

function isDevToolsVisible(): boolean {
  try {
    if (typeof window === "undefined") return false;
    if (import.meta.env.DEV) return true;
    return new URLSearchParams(window.location.search).get("notifDebug") === "1";
  } catch {
    return false;
  }
}

/** تسمية اليوم بالعربية لرأس التجميع: اليوم / أمس / تاريخ مختصر. */
function dayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diffDays = Math.round((startOf(today) - startOf(d)) / 86_400_000);
  if (diffDays === 0) return "اليوم";
  if (diffDays === 1) return "أمس";
  return d.toLocaleDateString("ar-KW", { day: "numeric", month: "long", year: diffDays > 300 ? "numeric" : undefined });
}

/** تجميع سجل مرتّب تنازليًا حسب اليوم — يحافظ على الترتيب الزمني داخل كل مجموعة. */
function groupByDay(records: NotifRecord[]): { label: string; items: NotifRecord[] }[] {
  const groups: { label: string; items: NotifRecord[] }[] = [];
  for (const rec of records) {
    const label = dayLabel(rec.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(rec);
    else groups.push({ label, items: [rec] });
  }
  return groups;
}

// ── مكوّن Toggle ────────────────────────────────────────────────────────────
function ToggleRow({
  label, sub, checked, onChange, disabled,
}: {
  label: string; sub?: string; checked: boolean;
  onChange: (v: boolean) => void; disabled?: boolean;
}) {
  return (
    <label className={`notif-row${disabled ? " notif-row--disabled" : ""}`}>
      <div className="notif-row__text">
        <span className="notif-row__label">{label}</span>
        {sub && <span className="notif-row__sub">{sub}</span>}
      </div>
      <div
        className={`notif-toggle${checked ? " notif-toggle--on" : ""}`}
        onClick={() => !disabled && onChange(!checked)}
        role="switch"
        aria-checked={checked}
        tabIndex={0}
        onKeyDown={(e) => (e.key === " " || e.key === "Enter") && !disabled && onChange(!checked)}
      >
        <span className="notif-toggle__thumb" />
      </div>
    </label>
  );
}

// ── صف إشعار ────────────────────────────────────────────────────────────────
/** أقصى إزاحة سحب (px) لكشف زر الحذف خلف البطاقة — لمسة iOS القياسية. */
const SWIPE_REVEAL = 76;

function NotifRow({ rec, onRead, onArchive, onDelete }: {
  rec: NotifRecord;
  onRead: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const timeStr = new Date(rec.createdAt).toLocaleTimeString("ar-KW", { hour: "2-digit", minute: "2-digit" });

  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef<number | null>(null);
  const baseX = useRef(0);
  const pointerId = useRef<number | null>(null);
  const revealed = useRef(false);

  const onPointerDown = (e: ReactPointerEvent) => {
    if (e.pointerType === "mouse") return; // السحب للمس فقط؛ سطح المكتب يستخدم أزرار الإجراءات الظاهرة عند hover
    startX.current = e.clientX;
    baseX.current = dragX;
    pointerId.current = e.pointerId;
    revealed.current = dragX <= -SWIPE_REVEAL / 2;
  };
  const onPointerMove = (e: ReactPointerEvent) => {
    if (startX.current === null || pointerId.current !== e.pointerId) return;
    const next = Math.min(0, Math.max(baseX.current + (e.clientX - startX.current), -SWIPE_REVEAL - 24));
    setDragging(true);
    setDragX(next);
    const nowRevealed = next <= -SWIPE_REVEAL / 2;
    if (nowRevealed !== revealed.current) {
      revealed.current = nowRevealed;
      void hapticTap("light");
    }
  };
  const endDrag = () => {
    if (startX.current === null) return;
    setDragX(revealed.current ? -SWIPE_REVEAL : 0);
    startX.current = null;
    pointerId.current = null;
    setDragging(false);
  };

  return (
    <div className="nh-row-wrap">
      <button
        type="button"
        className="nh-row__swipe-del"
        onClick={() => { setDragX(0); onDelete(); }}
        aria-label={`حذف: ${rec.title}`}
        tabIndex={dragX <= -SWIPE_REVEAL / 2 ? 0 : -1}
      >
        <Trash2 size={18} strokeWidth={2} aria-hidden="true" />
      </button>

      <div
        className={`nh-row${rec.isRead ? " nh-row--read" : ""}`}
        style={dragX !== 0 || dragging ? { transform: `translateX(${dragX}px)`, transition: dragging ? "none" : undefined } : undefined}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClick={() => { if (dragX === 0) onRead(); }}
        role="button"
        tabIndex={0}
        onKeyDown={e => (e.key === "Enter" || e.key === " ") && onRead()}
      >
        <div className="nh-row__icon" aria-hidden="true">
          <Bell size={16} strokeWidth={1.8} />
        </div>
        <div className="nh-row__body">
          <div className="nh-row__title">{rec.title}</div>
          {rec.body && <div className="nh-row__body-text">{rec.body}</div>}
          <div className="nh-row__meta">{timeStr}</div>
        </div>
        {!rec.isRead && <span className="nh-row__unread" aria-label="غير مقروء" />}
        {/* onClick لمنع انتشار النقر إلى صف الإشعار الأب — لا إجراء فعلي هنا
            يحتاج مكافئ لوحة مفاتيح؛ الأزرار الفعلية داخل هذا الصف قابلة للوصول
            بلوحة المفاتيح أصلًا. */}
        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
        <div className="nh-row__actions" onClick={e => e.stopPropagation()}>
          {!rec.isArchived && (
            <button type="button" className="nh-action" onClick={onArchive} aria-label="أرشفة">
              <Archive size={14} strokeWidth={2} aria-hidden="true" />
            </button>
          )}
          <button type="button" className="nh-action nh-action--del" onClick={onDelete} aria-label="حذف">
            <Trash2 size={14} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── الصفحة الرئيسية ─────────────────────────────────────────────────────────
export default function NotificationSettingsPage() {
  const [prefs, setPrefs] = useState<NotifPrefs>(loadNotifPrefs);

  useEffect(() => {
    applyPageSeo({
      path: "/notification-settings",
      title: "إعدادات الإشعارات | سُنّة",
      description: "إدارة إشعارات سُنّة، صلاة الأذان والتذكيرات الشرعية والأحداث العلمية.",
      keywords: ["إشعارات", "إعدادات أذان", "تذكيرات إسلامية"],
      robots: "noindex, follow",
    });
  }, []);
  const [permission, setPermission] = useState<PermissionStatus>("prompt");
  const [requesting, setRequesting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const showDevTools = isDevToolsVisible();

  useEffect(() => {
    void getNotificationPermissionStatus().then(setPermission);
  }, []);

  // تاريخ الإشعارات
  const [history, setHistory] = useState<NotifRecord[]>(() => loadHistory());
  const [histTab, setHistTab] = useState<HistoryTab>("inbox");
  const [searchQ, setSearchQ] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const refreshHistory = () =>
    setHistory(searchQ ? searchHistory(searchQ, histTab === "archived") : loadHistory());

  useEffect(() => {
    saveNotifPrefs(prefs);
    setSaved(true);
    const t = setTimeout(() => setSaved(false), 1500);
    void import("@/lib/smart-local-notifications").then(({ syncSmartLocalNotifications }) => {
      void syncSmartLocalNotifications();
    });
    return () => clearTimeout(t);
  }, [prefs]);

  useEffect(() => { refreshHistory(); }, [searchQ, histTab]);

  const handleEnable = async () => {
    setRequesting(true);
    const granted = await requestNotificationPermission();
    const status = await getNotificationPermissionStatus();
    setPermission(status);
    if (granted) {
      setPrefs(p => ({ ...p, enabled: true }));
    }
    setRequesting(false);
  };

  const handleTestTrigger = async () => {
    setTestStatus("جاري الإرسال…");
    const result = await fireTestLocalNotification();
    if (result.ok) {
      setTestStatus(result.platform === "native" ? "سيظهر خلال ثانية ونصف" : "تم الإرسال");
    } else if (result.reason === "permission") {
      setTestStatus("الإذن غير ممنوح");
    } else {
      setTestStatus("فشل الإرسال");
    }
    window.setTimeout(() => setTestStatus(null), 4000);
  };

  const update = (patch: Partial<NotifPrefs>) => setPrefs(p => ({ ...p, ...patch }));

  const isGranted = permission === "granted";
  const isUnsupported = permission === "unsupported";
  const isDenied = permission === "denied";
  const canToggle = isGranted && prefs.enabled;

  const visibleHistory = history.filter(r =>
    histTab === "archived" ? r.isArchived : !r.isArchived,
  );
  const unread = history.filter(r => !r.isRead && !r.isArchived).length;
  const dayGroups = useMemo(() => groupByDay(visibleHistory), [visibleHistory]);

  const handleMarkRead = (id: string) => { markRead(id); refreshHistory(); };
  const handleArchive = (id: string) => { archiveRecord(id); refreshHistory(); };
  const handleDelete = (id: string) => { void hapticTap("medium"); deleteRecord(id); refreshHistory(); };
  const handleMarkAll = () => { void hapticTap("light"); markAllRead(); refreshHistory(); };
  const handleClearAll = () => { clearAll(); setHistory([]); setConfirmClear(false); };

  return (
    <div className="page-shell narrow" dir="rtl">
      <PageHeader
        eyebrow="الإعدادات"
        title="الإشعارات"
        subtitle="تذكّرات مخصصة تساعدك على المثابرة في طلب العلم."
      />

      {!isNative && (
        <section className="notif-card" aria-label="إشعارات الدفع عبر الويب">
          <h2 className="notif-card__title">إشعارات الدفع (PWA)</h2>
          <p className="notif-row__sub" style={{ marginBottom: "0.75rem" }}>
            تُرسل عبر متصفحك عند تثبيت التطبيق أو السماح بالإشعارات.
          </p>
          <PushPrompt />
        </section>
      )}

      {isNative && (
        <section className="notif-card" aria-label="إشعارات التطبيق">
          <h2 className="notif-card__title">إشعارات التطبيق</h2>
          <p className="notif-row__sub">
            على iOS تُستخدم الإشعارات المحلية لأوقات الصلاة وورد القرآن اليومي (٥ مساءً) وتذكير الذكر الصوتي.
            إشعارات الويب (Web Push) معطّلة هنا عمداً لتفادي التعارض.
          </p>
        </section>
      )}

      {/* ── حالة الصلاحية ── */}
      {isUnsupported && (
        <div className="notif-banner notif-banner--warn">
          {isNative
            ? "هذا الجهاز لا يدعم الإشعارات المحلية."
            : "متصفحك لا يدعم الإشعارات. جرّب Chrome أو Firefox."}
        </div>
      )}
      {isDenied && (
        <div className="notif-banner notif-banner--err">
          {isNative
            ? "الإشعارات محجوبة من إعدادات النظام. افتح الإعدادات ← سُنّة ← الإشعارات وفعّلها، ثم أعد فتح التطبيق."
            : "الإشعارات محجوبة من إعدادات المتصفح. فعّلها يدوياً ثم أعد المحاولة."}
        </div>
      )}
      {permission === "prompt" && !prefs.enabled && (
        <div className="notif-banner notif-banner--warn">
          الإذن لم يُمنَح بعد — فعّل الإشعارات بالزر أدناه لتصل تنبيهات الصلاة والورد.
        </div>
      )}

      {/* ── تفعيل ── */}
      <div className="notif-card">
        <ToggleRow
          label="تفعيل الإشعارات"
          sub={isGranted ? "مفعّلة" : isUnsupported ? "غير مدعوم" : isDenied ? "محجوبة" : "اضغط للسماح"}
          checked={prefs.enabled && isGranted}
          onChange={v => { if (v && !isGranted) handleEnable(); else update({ enabled: v }); }}
          disabled={isUnsupported || isDenied || requesting}
        />
      </div>

      {/* ── أنواع التذكّرات ── */}
      <div className="notif-card">
        <h3 className="notif-card__title">أنواع التذكّرات</h3>
        <ToggleRow label="مراجعة البطاقات" sub="تذكير يومي عند وجود بطاقات مستحقة" checked={prefs.flashcardsReminder} onChange={v => update({ flashcardsReminder: v })} disabled={!canToggle} />
        <ToggleRow label="تابع من حيث توقفت" sub="تذكير بالدرس أو الكتاب الذي لم تُكمله" checked={prefs.resumeReminder} onChange={v => update({ resumeReminder: v })} disabled={!canToggle} />
        <ToggleRow
          label="تنبيهات الصلاة"
          sub={
            isNative
              ? "تذكير داخل الصفحة؛ التنبيه الأصلي من صفحة إعدادات الأذان (نصوص وصوت متنوعان)"
              : "إشعار تقريبي قبل الصلاة (الويب)؛ التنبيه الأصلي من إعدادات الأذان"
          }
          checked={prefs.prayerReminder}
          onChange={v => update({ prayerReminder: v })}
          disabled={!canToggle}
        />
        <ToggleRow
          label="ورد اليوم"
          sub="تذكير يومي الساعة 5 مساءً (17:00) لقراءة الورد — ليس 5 صباحاً"
          checked={prefs.quranDailyReminder}
          onChange={(v) => {
            void (async () => {
              if (v) {
                const { scheduleDailyReminder } = await import("@/lib/quran-daily-reminder");
                await scheduleDailyReminder();
              } else {
                const { cancelDailyReminder } = await import("@/lib/quran-daily-reminder");
                await cancelDailyReminder();
              }
              setPrefs(loadNotifPrefs());
            })();
          }}
          disabled={!canToggle}
        />
        <ToggleRow
          label="تذكير الذكر"
          sub="سبحان الله، الحمد لله، الله أكبر… إشعار صوتي كل ساعتين من 8 صباحًا حتى 8 مساءً"
          checked={prefs.dhikrPhraseReminder}
          onChange={v => update({ dhikrPhraseReminder: v })}
          disabled={!canToggle}
        />
        <ToggleRow
          label="تذكير الأذكار"
          sub="أذكار الصباح والمساء — يُفعَّل من هنا فقط، دون طلب إذن عند فتح التطبيق"
          checked={prefs.adhkarReminder}
          onChange={v => update({ adhkarReminder: v })}
          disabled={!canToggle}
        />
      </div>

      {/* ── وقت التذكير ── */}
      <div className="notif-card">
        <h3 className="notif-card__title">وقت التذكير اليومي</h3>
        <div className="notif-time">
          <label htmlFor="notif-hour" className="notif-time__label">الساعة</label>
          <input id="notif-hour" type="number" className="notif-time__input" min={0} max={23} value={prefs.reminderHour} onChange={e => update({ reminderHour: Math.min(23, Math.max(0, Number(e.target.value))) })} disabled={!canToggle} />
          <span className="notif-time__sep" aria-hidden="true">:</span>
          <label htmlFor="notif-minute" className="notif-time__label">الدقيقة</label>
          <input id="notif-minute" type="number" className="notif-time__input" min={0} max={59} value={prefs.reminderMinute} onChange={e => update({ reminderMinute: Math.min(59, Math.max(0, Number(e.target.value))) })} disabled={!canToggle} />
        </div>
        <p className="notif-time__hint">التذكيرات تعمل فقط عندما يكون المتصفح مفتوحاً.</p>
      </div>

      {/* ── اختبار ── */}
      {isGranted && (
        <div className="notif-card">
          <button type="button" className="notif-test-btn" onClick={() => void handleTestTrigger()}>
            إرسال إشعار اختباري
          </button>
          {testStatus && <p className="notif-row__sub" style={{ marginTop: "0.5rem" }}>{testStatus}</p>}
        </div>
      )}

      {showDevTools && (
        <div className="notif-card" aria-label="أدوات مطوّر الإشعارات">
          <h3 className="notif-card__title">تشخيص الإشعارات (مطوّر)</h3>
          <p className="notif-row__sub" style={{ marginBottom: "0.75rem" }}>
            منصة: {isNative ? "Capacitor أصلي" : "ويب"} · الإذن: {permission}
            {!import.meta.env.DEV && " · ?notifDebug=1"}
          </p>
          <button
            type="button"
            className="notif-test-btn"
            onClick={() => void handleTestTrigger()}
          >
            Test Notification Trigger
          </button>
          {testStatus && <p className="notif-row__sub" style={{ marginTop: "0.5rem" }}>{testStatus}</p>}
        </div>
      )}

      {saved && <div className="notif-saved">تم حفظ الإعدادات</div>}

      {/* ══ تاريخ الإشعارات ══ */}
      <div className="nh-section">
        <div className="nh-header">
          <h2 className="nh-header__title">
            سجل الإشعارات
            {unread > 0 && <span className="nh-header__badge">{toArabicDigits(unread)}</span>}
          </h2>
          <div className="nh-header__actions">
            {unread > 0 && (
              <button type="button" className="nh-btn nh-btn--mark-all" onClick={handleMarkAll}>
                <CheckCheck size={14} strokeWidth={2} aria-hidden="true" />
                تعليم الكل مقروءاً
              </button>
            )}
            {!confirmClear ? (
              <button type="button" className="nh-btn nh-btn--danger" onClick={() => setConfirmClear(true)}>
                حذف الكل
              </button>
            ) : (
              <span className="nsp-confirm-row">
                <span className="nsp-confirm-label">تأكيد؟</span>
                <button type="button" className="nh-btn nh-btn--danger" onClick={handleClearAll}>نعم</button>
                <button type="button" className="nh-btn" onClick={() => setConfirmClear(false)}>إلغاء</button>
              </span>
            )}
          </div>
        </div>

        {/* بحث */}
        <div className="nh-search-wrap">
          <input
            ref={searchRef}
            className="nh-search"
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            placeholder="ابحث في الإشعارات…"
            aria-label="بحث في الإشعارات"
          />
          {searchQ && <button type="button" aria-label="مسح البحث" className="nh-search-clear" onClick={() => setSearchQ("")}>✕</button>}
        </div>

        {/* تبويبات */}
        <div className="nh-tabs" role="tablist" aria-label="تبويبات الإشعارات">
          <button role="tab" type="button" className={`nh-tab${histTab === "inbox" ? " nh-tab--active" : ""}`} onClick={() => setHistTab("inbox")} aria-selected={histTab === "inbox"}>
            الصندوق {unread > 0 && `(${toArabicDigits(unread)})`}
          </button>
          <button role="tab" type="button" className={`nh-tab${histTab === "archived" ? " nh-tab--active" : ""}`} onClick={() => setHistTab("archived")} aria-selected={histTab === "archived"}>
            المؤرشف
          </button>
        </div>

        {/* القائمة — مجمّعة حسب اليوم */}
        <div className="nh-list">
          {visibleHistory.length === 0 ? (
            <div className="nh-empty">
              <div className="nh-empty__ring" aria-hidden="true">
                <Bell size={26} strokeWidth={1.5} />
              </div>
              <p className="nh-empty__msg">
                {searchQ ? `لا نتائج لـ «${searchQ}». جرّب كلمة أخرى.` : histTab === "archived" ? "لا توجد إشعارات مؤرشفة." : "لا توجد إشعارات جديدة."}
              </p>
              {!searchQ && <p className="nh-empty__sub">سنُخبرك هنا بكل جديد يخصّ رحلتك العلمية</p>}
            </div>
          ) : (
            dayGroups.map(group => (
              <div key={group.label} className="nh-day-group">
                <div className="nh-day-group__label">{group.label}</div>
                {group.items.map(rec => (
                  <NotifRow
                    key={rec.id}
                    rec={rec}
                    onRead={() => handleMarkRead(rec.id)}
                    onArchive={() => handleArchive(rec.id)}
                    onDelete={() => handleDelete(rec.id)}
                  />
                ))}
              </div>
            ))
          )}
        </div>
      </div>

      <nav className="profile-quick-links nsp-quick-links" aria-label="روابط">
        <Link href="/flashcards" className="profile-quick-link">البطاقات</Link>
        <Link href="/lessons" className="profile-quick-link">الدروس والدورات</Link>
        <Link href="/settings" className="profile-quick-link">الإعدادات</Link>
      </nav>
    </div>
  );
}
