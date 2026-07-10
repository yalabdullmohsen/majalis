import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { Archive, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/ui-common";
import {
  loadNotifPrefs,
  saveNotifPrefs,
  requestPermission,
  getPermissionStatus,
  sendLocalNotification,
  type NotifPrefs,
} from "@/lib/local-notifications";
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

type Permission = ReturnType<typeof getPermissionStatus>;
type HistoryTab = "inbox" | "archived";

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
function NotifRow({ rec, onRead, onArchive, onDelete }: {
  rec: NotifRecord;
  onRead: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const date = new Date(rec.createdAt);
  const dateStr = date.toLocaleDateString("ar-KW", { month: "short", day: "numeric" });
  const timeStr = date.toLocaleTimeString("ar-KW", { hour: "2-digit", minute: "2-digit" });

  return (
    <div
      className={`nh-row${rec.isRead ? " nh-row--read" : ""}`}
      onClick={onRead}
      role="button"
      tabIndex={0}
      onKeyDown={e => (e.key === "Enter" || e.key === " ") && onRead()}
    >
      <div className="nh-row__dot" aria-hidden="true" />
      <div className="nh-row__body">
        <div className="nh-row__title">{rec.title}</div>
        {rec.body && <div className="nh-row__body-text">{rec.body}</div>}
        <div className="nh-row__meta">{dateStr} · {timeStr}</div>
      </div>
      <div className="nh-row__actions" onClick={e => e.stopPropagation()}>
        {!rec.isArchived && (
          <button type="button" className="nh-action" onClick={onArchive} title="أرشفة" aria-label="أرشفة">
            <Archive size={14} strokeWidth={2} aria-hidden="true" />
          </button>
        )}
        <button type="button" className="nh-action nh-action--del" onClick={onDelete} title="حذف" aria-label="حذف">
          <Trash2 size={14} strokeWidth={2} aria-hidden="true" />
        </button>
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
      title: "إعدادات الإشعارات | المجلس العلمي",
      description: "إدارة إشعارات المجلس العلمي، صلاة الأذان والتذكيرات الشرعية والأحداث العلمية.",
      keywords: ["إشعارات", "إعدادات أذان", "تذكيرات إسلامية"],
      robots: "noindex, follow",
    });
  }, []);
  const [permission, setPermission] = useState<Permission>(getPermissionStatus);
  const [requesting, setRequesting] = useState(false);
  const [saved, setSaved] = useState(false);

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
    return () => clearTimeout(t);
  }, [prefs]);

  useEffect(() => { refreshHistory(); }, [searchQ, histTab]);

  const handleEnable = async () => {
    setRequesting(true);
    const result = await requestPermission();
    setPermission(result);
    if (result === "granted") {
      setPrefs(p => ({ ...p, enabled: true }));
      sendLocalNotification("الإشعارات مفعّلة", { body: "سنذكّرك بمراجعة البطاقات والدروس." });
    }
    setRequesting(false);
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

  const handleMarkRead = (id: string) => { markRead(id); refreshHistory(); };
  const handleArchive = (id: string) => { archiveRecord(id); refreshHistory(); };
  const handleDelete = (id: string) => { deleteRecord(id); refreshHistory(); };
  const handleMarkAll = () => { markAllRead(); refreshHistory(); };
  const handleClearAll = () => { clearAll(); setHistory([]); setConfirmClear(false); };

  return (
    <div className="page-shell narrow" dir="rtl">
      <PageHeader
        eyebrow="الإعدادات"
        title="الإشعارات"
        subtitle="تذكّرات مخصصة تساعدك على المثابرة في طلب العلم."
      />

      {/* ── حالة الصلاحية ── */}
      {isUnsupported && (
        <div className="notif-banner notif-banner--warn">
          متصفحك لا يدعم الإشعارات. جرّب Chrome أو Firefox.
        </div>
      )}
      {isDenied && (
        <div className="notif-banner notif-banner--err">
          الإشعارات محجوبة من إعدادات المتصفح. فعّلها يدوياً ثم أعد المحاولة.
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
        <ToggleRow label="تنبيه الصلاة" sub="إشعار قبل 10 دقائق من وقت الصلاة" checked={prefs.prayerReminder} onChange={v => update({ prayerReminder: v })} disabled={!canToggle} />
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
          <button type="button" className="notif-test-btn" onClick={() => sendLocalNotification("اختبار الإشعارات", { body: "هذا إشعار تجريبي من منصة المجالس." })}>
            إرسال إشعار تجريبي
          </button>
        </div>
      )}

      {saved && <div className="notif-saved">تم حفظ الإعدادات</div>}

      {/* ══ تاريخ الإشعارات ══ */}
      <div className="nh-section">
        <div className="nh-header">
          <h2 className="nh-header__title">
            سجل الإشعارات
            {unread > 0 && <span className="nh-header__badge">{unread}</span>}
          </h2>
          <div className="nh-header__actions">
            {unread > 0 && (
              <button type="button" className="nh-btn" onClick={handleMarkAll}>تعليم الكل مقروءاً</button>
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
        <div className="nh-tabs">
          <button type="button" className={`nh-tab${histTab === "inbox" ? " nh-tab--active" : ""}`} onClick={() => setHistTab("inbox")} aria-pressed={histTab === "inbox"}>
            الصندوق {unread > 0 && `(${unread})`}
          </button>
          <button type="button" className={`nh-tab${histTab === "archived" ? " nh-tab--active" : ""}`} onClick={() => setHistTab("archived")} aria-pressed={histTab === "archived"}>
            المؤرشف
          </button>
        </div>

        {/* القائمة */}
        <div className="nh-list">
          {visibleHistory.length === 0 ? (
            <p className="nh-empty">
              {searchQ ? `لا نتائج لـ «${searchQ}»` : histTab === "archived" ? "لا توجد إشعارات مؤرشفة." : "لا توجد إشعارات بعد."}
            </p>
          ) : (
            visibleHistory.map(rec => (
              <NotifRow
                key={rec.id}
                rec={rec}
                onRead={() => handleMarkRead(rec.id)}
                onArchive={() => handleArchive(rec.id)}
                onDelete={() => handleDelete(rec.id)}
              />
            ))
          )}
        </div>
      </div>

      <nav className="profile-quick-links nsp-quick-links" aria-label="روابط">
        <Link href="/flashcards" className="profile-quick-link">البطاقات</Link>
        <Link href="/learning-plan" className="profile-quick-link">خطة التعلّم</Link>
        <Link href="/settings" className="profile-quick-link">الإعدادات</Link>
      </nav>
    </div>
  );
}
