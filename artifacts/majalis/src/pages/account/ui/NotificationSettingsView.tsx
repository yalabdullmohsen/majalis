import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { Link } from "wouter";
import {
  Archive,
  Bell,
  BookOpen,
  CalendarHeart,
  CheckCheck,
  GraduationCap,
  HandHeart,
  HeartHandshake,
  MoonStar,
  Sparkles,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/ui-common";
import { hapticTap, isNative } from "@/lib/capacitor-utils";
import { toArabicDigits } from "@/lib/utils";
import {
  loadNotifPrefs,
  saveNotifPrefs,
  updateNotifSection,
  type NotifPrefs,
  type PrayerNotifModes,
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
import { UtilityScreen } from "@/components/design-system/screens";
import { SettingsList, SettingsToggleRow } from "@/components/design-system/SettingsList";
import {
  NOTIF_SECTIONS,
  WEEKDAY_LABELS,
  formatSectionStatus,
  previewSectionMessage,
  type NotifSectionId,
  type NotifSectionPrefs,
  type Weekday,
} from "@/lib/notifications/sections-config";

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
  return d.toLocaleDateString("ar-KW", {
    day: "numeric",
    month: "long",
    year: diffDays > 300 ? "numeric" : undefined,
  });
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

const SWIPE_REVEAL = 76;

function NotifRow({
  rec,
  onRead,
  onArchive,
  onDelete,
}: {
  rec: NotifRecord;
  onRead: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const timeStr = new Date(rec.createdAt).toLocaleTimeString("ar-KW", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef<number | null>(null);
  const baseX = useRef(0);
  const pointerId = useRef<number | null>(null);
  const revealed = useRef(false);

  const onPointerDown = (e: ReactPointerEvent) => {
    if (e.pointerType === "mouse") return;
    startX.current = e.clientX;
    baseX.current = dragX;
    pointerId.current = e.pointerId;
    revealed.current = dragX <= -SWIPE_REVEAL / 2;
  };
  const onPointerMove = (e: ReactPointerEvent) => {
    if (startX.current === null || pointerId.current !== e.pointerId) return;
    const next = Math.min(
      0,
      Math.max(baseX.current + (e.clientX - startX.current), -SWIPE_REVEAL - 24),
    );
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
        onClick={() => {
          setDragX(0);
          onDelete();
        }}
        aria-label={`حذف: ${rec.title}`}
        tabIndex={dragX <= -SWIPE_REVEAL / 2 ? 0 : -1}
      >
        <Trash2 size={18} strokeWidth={2} aria-hidden="true" />
      </button>
      <div
        className={`nh-row${rec.isRead ? " nh-row--read" : ""}`}
        style={
          dragX !== 0 || dragging
            ? { transform: `translateX(${dragX}px)`, transition: dragging ? "none" : undefined }
            : undefined
        }
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClick={() => {
          if (dragX === 0) onRead();
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onRead()}
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
        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
        <div className="nh-row__actions" onClick={(e) => e.stopPropagation()}>
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

const SECTION_ICONS: Record<NotifSectionId, ReactNode> = {
  prayer: <MoonStar size={18} strokeWidth={1.8} aria-hidden />,
  quran: <BookOpen size={18} strokeWidth={1.8} aria-hidden />,
  adhkar: <Sparkles size={18} strokeWidth={1.8} aria-hidden />,
  salawat: <HeartHandshake size={18} strokeWidth={1.8} aria-hidden />,
  istighfar: <HandHeart size={18} strokeWidth={1.8} aria-hidden />,
  lessons: <GraduationCap size={18} strokeWidth={1.8} aria-hidden />,
  seekingKnowledge: <BookOpen size={18} strokeWidth={1.8} aria-hidden />,
  fridayOccasions: <CalendarHeart size={18} strokeWidth={1.8} aria-hidden />,
};

function hourLabel(h: number): string {
  return `${toArabicDigits(h)}:٠٠`;
}

function SectionDetailPanel({
  sectionId,
  sectionPrefs,
  prayerModes,
  dhikrPhraseReminder,
  canToggle,
  onClose,
  onPatchSection,
  onPrayerModes,
  onDhikrPhrase,
}: {
  sectionId: NotifSectionId;
  sectionPrefs: NotifSectionPrefs;
  prayerModes: PrayerNotifModes;
  dhikrPhraseReminder: boolean;
  canToggle: boolean;
  onClose: () => void;
  onPatchSection: (patch: Partial<NotifSectionPrefs>) => void;
  onPrayerModes: (patch: Partial<PrayerNotifModes>) => void;
  onDhikrPhrase: (v: boolean) => void;
}) {
  const meta = NOTIF_SECTIONS.find((s) => s.id === sectionId)!;
  const preview = previewSectionMessage(sectionId);
  const [customCount, setCustomCount] = useState(String(sectionPrefs.dailyCount));

  useEffect(() => {
    setCustomCount(String(sectionPrefs.dailyCount));
  }, [sectionPrefs.dailyCount, sectionId]);

  const toggleWeekday = (day: Weekday) => {
    const set = new Set(sectionPrefs.weekdays);
    if (set.has(day)) set.delete(day);
    else set.add(day);
    const next = [...set].sort((a, b) => a - b) as Weekday[];
    onPatchSection({ weekdays: next.length ? next : ([0, 1, 2, 3, 4, 5, 6] as Weekday[]) });
  };

  return (
    <div className="soft-card soft-card--on-light notif-card nsp-detail" dir="rtl">
      <div className="nsp-detail__head">
        <button type="button" className="nh-btn" onClick={onClose}>
          رجوع
        </button>
        <h2 className="notif-card__title" style={{ margin: 0 }}>
          {meta.title}
        </h2>
      </div>
      <p className="notif-row__sub">{meta.description}</p>

      <SettingsToggleRow
        id={`sec-${sectionId}-enabled`}
        title="تفعيل القسم"
        description={sectionPrefs.enabled ? "مفعّل" : "متوقف"}
        checked={sectionPrefs.enabled}
        onChange={(v) => onPatchSection({ enabled: v })}
        disabled={!canToggle}
      />

      {sectionId === "prayer" && (
        <div className="nsp-prayer-modes" aria-label="أنماط تنبيه الصلاة">
          <SettingsToggleRow
            id="prayer-pre"
            title="تنبيه قبل الأذان"
            description="اقترب أذان الفجر — ص ٤:١١"
            checked={prayerModes.preEnabled}
            onChange={(v) => onPrayerModes({ preEnabled: v })}
            disabled={!canToggle || !sectionPrefs.enabled}
          />
          <SettingsToggleRow
            id="prayer-adhan"
            title="إشعار الأذان"
            description="أذان الفجر — ص ٤:١١"
            checked={prayerModes.adhanEnabled}
            onChange={(v) => onPrayerModes({ adhanEnabled: v })}
            disabled={!canToggle || !sectionPrefs.enabled}
          />
          <SettingsToggleRow
            id="prayer-post"
            title="تنبيه بعد الأذان"
            description="تذكير بصلاة الفجر — ص ٤:١١"
            checked={prayerModes.postEnabled}
            onChange={(v) => onPrayerModes({ postEnabled: v })}
            disabled={!canToggle || !sectionPrefs.enabled}
          />
          {meta.href ? (
            <Link href={meta.href} className="profile-quick-link nsp-inline-link">
              إعدادات الأذان التفصيلية
            </Link>
          ) : null}
        </div>
      )}

      <div className="nsp-field">
        <p className="nsp-field__label">عدد الإشعارات يوميًا</p>
        {meta.countPresets ? (
          <div className="nsp-chip-row" role="group" aria-label="عدد التذكيرات">
            {meta.countPresets.map((n) => (
              <button
                key={n}
                type="button"
                className={`ads-chip${sectionPrefs.dailyCount === n ? " is-active" : ""}`}
                disabled={!canToggle || !sectionPrefs.enabled}
                onClick={() => onPatchSection({ dailyCount: n })}
              >
                {toArabicDigits(n)}
              </button>
            ))}
            <label className="nsp-custom-count">
              <span>مخصص</span>
              <input
                type="number"
                min={meta.countMin}
                max={meta.countMax}
                value={customCount}
                disabled={!canToggle || !sectionPrefs.enabled}
                onChange={(e) => setCustomCount(e.target.value)}
                onBlur={() => {
                  const n = Math.min(
                    meta.countMax,
                    Math.max(meta.countMin, Number(customCount) || meta.countMin),
                  );
                  setCustomCount(String(n));
                  onPatchSection({ dailyCount: n });
                }}
              />
            </label>
          </div>
        ) : (
          <input
            type="number"
            className="notif-time__input"
            min={meta.countMin}
            max={meta.countMax}
            value={sectionPrefs.dailyCount}
            disabled={!canToggle || !sectionPrefs.enabled}
            onChange={(e) =>
              onPatchSection({
                dailyCount: Math.min(
                  meta.countMax,
                  Math.max(meta.countMin, Number(e.target.value) || meta.countMin),
                ),
              })
            }
          />
        )}
      </div>

      <div className="nsp-field">
        <p className="nsp-field__label">الفترة الزمنية</p>
        <div className="notif-time">
          <label className="notif-time__label" htmlFor={`win-start-${sectionId}`}>
            من
          </label>
          <select
            id={`win-start-${sectionId}`}
            className="notif-time__input"
            value={sectionPrefs.windowStartHour}
            disabled={!canToggle || !sectionPrefs.enabled}
            onChange={(e) => onPatchSection({ windowStartHour: Number(e.target.value) })}
          >
            {Array.from({ length: 24 }, (_, h) => (
              <option key={h} value={h}>
                {hourLabel(h)}
              </option>
            ))}
          </select>
          <label className="notif-time__label" htmlFor={`win-end-${sectionId}`}>
            إلى
          </label>
          <select
            id={`win-end-${sectionId}`}
            className="notif-time__input"
            value={sectionPrefs.windowEndHour}
            disabled={!canToggle || !sectionPrefs.enabled}
            onChange={(e) => onPatchSection({ windowEndHour: Number(e.target.value) })}
          >
            {Array.from({ length: 24 }, (_, h) => (
              <option key={h} value={h}>
                {hourLabel(h)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="nsp-field">
        <p className="nsp-field__label">أيام الأسبوع</p>
        <div className="nsp-chip-row" role="group" aria-label="أيام التفعيل">
          {([0, 1, 2, 3, 4, 5, 6] as Weekday[]).map((day) => {
            const active = sectionPrefs.weekdays.includes(day);
            return (
              <button
                key={day}
                type="button"
                className={`ads-chip${active ? " is-active" : ""}`}
                disabled={!canToggle || !sectionPrefs.enabled}
                onClick={() => toggleWeekday(day)}
              >
                {WEEKDAY_LABELS[day]}
              </button>
            );
          })}
        </div>
      </div>

      {sectionId === "adhkar" && (
        <SettingsToggleRow
          id="notif-dhikr-phrase"
          title="تذكير الذكر"
          description="سبحان الله، الحمد لله، الله أكبر… ضمن ساعات اليقظة"
          checked={dhikrPhraseReminder}
          onChange={onDhikrPhrase}
          disabled={!canToggle}
        />
      )}

      <div className="nsp-preview" aria-label="معاينة الإشعار">
        <p className="nsp-field__label">معاينة الإشعار</p>
        <div className="nsp-preview__card">
          <strong>{preview.title}</strong>
          <span>{preview.body}</span>
        </div>
      </div>
    </div>
  );
}

export default function NotificationSettingsPage() {
  const [prefs, setPrefs] = useState<NotifPrefs>(loadNotifPrefs);
  const [activeSection, setActiveSection] = useState<NotifSectionId | null>(null);

  useEffect(() => {
    applyPageSeo({
      path: "/notification-settings",
      title: "الإشعارات | سُنّة",
      description: "إدارة إشعارات سُنّة: الصلاة والقرآن والأذكار والدروس والمناسبات.",
      keywords: ["إشعارات", "إعدادات أذان", "تذكيرات"],
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

  useEffect(() => {
    refreshHistory();
  }, [searchQ, histTab]);

  const handleEnable = async () => {
    setRequesting(true);
    const granted = await requestNotificationPermission();
    const status = await getNotificationPermissionStatus();
    setPermission(status);
    if (granted) {
      setPrefs((p) => ({ ...p, enabled: true }));
      void import("@/lib/notifications/apns-scaffold").then(({ maybeRegisterRemotePush }) => {
        void maybeRegisterRemotePush({ requestPermission: true });
      });
    }
    setRequesting(false);
  };

  const handleTestTrigger = async () => {
    setTestStatus("يُرسل…");
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

  const update = (patch: Partial<NotifPrefs>) => setPrefs((p) => ({ ...p, ...patch }));

  const isGranted = permission === "granted";
  const isUnsupported = permission === "unsupported";
  const isDenied = permission === "denied";
  const canToggle = isGranted && prefs.enabled;

  const visibleHistory = history.filter((r) =>
    histTab === "archived" ? r.isArchived : !r.isArchived,
  );
  const unread = history.filter((r) => !r.isRead && !r.isArchived).length;
  const dayGroups = useMemo(() => groupByDay(visibleHistory), [visibleHistory]);

  const handleMarkRead = (id: string) => {
    markRead(id);
    refreshHistory();
  };
  const handleArchive = (id: string) => {
    archiveRecord(id);
    refreshHistory();
  };
  const handleDelete = (id: string) => {
    void hapticTap("medium");
    deleteRecord(id);
    refreshHistory();
  };
  const handleMarkAll = () => {
    void hapticTap("light");
    markAllRead();
    refreshHistory();
  };
  const handleClearAll = () => {
    clearAll();
    setHistory([]);
    setConfirmClear(false);
  };

  return (
    <UtilityScreen compose="mark">
      <div className="page-shell narrow" dir="rtl">
        <PageHeader
          eyebrow="الإعدادات"
          title="الإشعارات"
          subtitle="تذكيرات منظمة للصلاة والقرآن والأذكار وطلب العلم."
        />

        {!isNative && (
          <section className="soft-card soft-card--on-light notif-card" aria-label="إشعارات الدفع عبر الويب">
            <h2 className="notif-card__title">إشعارات الدفع (PWA)</h2>
            <p className="notif-row__sub" style={{ marginBottom: "0.75rem" }}>
              تُرسل عبر متصفحك عند تثبيت التطبيق أو السماح بالإشعارات.
            </p>
            <PushPrompt />
          </section>
        )}

        {isNative && (
          <section className="soft-card soft-card--on-light notif-card" aria-label="إشعارات التطبيق">
            <h2 className="notif-card__title">إشعارات التطبيق</h2>
            <p className="notif-row__sub">
              على iOS تُستخدم الإشعارات المحلية لأوقات الصلاة وورد القرآن والتذكيرات اليومية.
            </p>
          </section>
        )}

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
              ? "الإشعارات محجوبة من إعدادات النظام. افتح الإعدادات ← سُنّة ← الإشعارات وفعّلها."
              : "الإشعارات محجوبة من إعدادات المتصفح. فعّلها يدويًا ثم أعد المحاولة."}
          </div>
        )}
        {permission === "prompt" && !prefs.enabled && (
          <div className="notif-banner notif-banner--warn">
            الإذن لم يُمنَح بعد — فعّل الإشعارات بالزر أدناه.
          </div>
        )}

        <div className="soft-card soft-card--on-light notif-card">
          <SettingsToggleRow
            id="notif-enabled"
            title="تفعيل الإشعارات"
            description={
              isGranted ? "مفعّلة" : isUnsupported ? "غير مدعوم" : isDenied ? "محجوبة" : "اضغط للسماح"
            }
            checked={prefs.enabled && isGranted}
            onChange={(v) => {
              if (v && !isGranted) void handleEnable();
              else update({ enabled: v });
            }}
            disabled={isUnsupported || isDenied || requesting}
          />
        </div>

        {activeSection ? (
          <SectionDetailPanel
            sectionId={activeSection}
            sectionPrefs={prefs.sections[activeSection]}
            prayerModes={prefs.prayerModes}
            dhikrPhraseReminder={prefs.dhikrPhraseReminder}
            canToggle={canToggle}
            onClose={() => setActiveSection(null)}
            onPatchSection={(patch) => {
              const next = updateNotifSection(activeSection, patch);
              setPrefs(next);
            }}
            onPrayerModes={(patch) =>
              update({ prayerModes: { ...prefs.prayerModes, ...patch } })
            }
            onDhikrPhrase={(v) => update({ dhikrPhraseReminder: v })}
          />
        ) : (
          <div className="soft-card soft-card--on-light notif-card">
            <SettingsList
              title="الإشعارات"
              rows={NOTIF_SECTIONS.map((section) => {
                const sectionPrefs = prefs.sections[section.id];
                return {
                  id: section.id,
                  title: section.title,
                  description: section.description,
                  icon: SECTION_ICONS[section.id],
                  value: (
                    <span className="nsp-row-status">
                      <span className={`nsp-dot${sectionPrefs.enabled ? " is-on" : ""}`} aria-hidden />
                      {formatSectionStatus(sectionPrefs)}
                    </span>
                  ),
                  onClick: () => setActiveSection(section.id),
                  testId: `notif-section-${section.id}`,
                };
              })}
            />
          </div>
        )}

        {isGranted && (
          <div className="soft-card soft-card--on-light notif-card">
            <button type="button" className="notif-test-btn" onClick={() => void handleTestTrigger()}>
              إرسال إشعار اختباري
            </button>
            {testStatus && (
              <p className="notif-row__sub" style={{ marginTop: "0.5rem" }}>
                {testStatus}
              </p>
            )}
          </div>
        )}

        {showDevTools && (
          <div className="soft-card soft-card--on-light notif-card" aria-label="أدوات مطوّر الإشعارات">
            <h3 className="notif-card__title">تشخيص الإشعارات (مطوّر)</h3>
            <p className="notif-row__sub" style={{ marginBottom: "0.75rem" }}>
              منصة: {isNative ? "Capacitor أصلي" : "ويب"} · الإذن: {permission}
            </p>
            <button type="button" className="notif-test-btn" onClick={() => void handleTestTrigger()}>
              Test Notification Trigger
            </button>
          </div>
        )}

        {saved && <div className="notif-saved">تم حفظ الإعدادات</div>}

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
                  تعليم الكل مقروءًا
                </button>
              )}
              {!confirmClear ? (
                <button type="button" className="nh-btn nh-btn--danger" onClick={() => setConfirmClear(true)}>
                  حذف الكل
                </button>
              ) : (
                <span className="nsp-confirm-row">
                  <span className="nsp-confirm-label">تأكيد؟</span>
                  <button type="button" className="nh-btn nh-btn--danger" onClick={handleClearAll}>
                    نعم
                  </button>
                  <button type="button" className="nh-btn" onClick={() => setConfirmClear(false)}>
                    إلغاء
                  </button>
                </span>
              )}
            </div>
          </div>

          <div className="nh-search-wrap">
            <input
              ref={searchRef}
              className="nh-search"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="ابحث في الإشعارات…"
              aria-label="بحث في الإشعارات"
            />
            {searchQ && (
              <button
                type="button"
                aria-label="مسح البحث"
                className="nh-search-clear"
                onClick={() => setSearchQ("")}
              >
                ✕
              </button>
            )}
          </div>

          <div className="nh-tabs" role="tablist" aria-label="تبويبات الإشعارات">
            <button
              role="tab"
              type="button"
              className={`nh-tab${histTab === "inbox" ? " nh-tab--active" : ""}`}
              onClick={() => setHistTab("inbox")}
              aria-selected={histTab === "inbox"}
            >
              الصندوق {unread > 0 && `(${toArabicDigits(unread)})`}
            </button>
            <button
              role="tab"
              type="button"
              className={`nh-tab${histTab === "archived" ? " nh-tab--active" : ""}`}
              onClick={() => setHistTab("archived")}
              aria-selected={histTab === "archived"}
            >
              المؤرشف
            </button>
          </div>

          <div className="nh-list">
            {visibleHistory.length === 0 ? (
              <div className="nh-empty">
                <div className="nh-empty__ring" aria-hidden="true">
                  <Bell size={26} strokeWidth={1.5} />
                </div>
                <p className="nh-empty__msg">
                  {searchQ
                    ? `لا نتائج لـ «${searchQ}».`
                    : histTab === "archived"
                      ? "لا توجد إشعارات مؤرشفة."
                      : "لا توجد إشعارات جديدة."}
                </p>
              </div>
            ) : (
              dayGroups.map((group) => (
                <div key={group.label} className="nh-day-group">
                  <div className="nh-day-group__label">{group.label}</div>
                  {group.items.map((rec) => (
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
          <Link href="/adhan-settings" className="profile-quick-link">
            إعدادات الأذان
          </Link>
          <Link href="/settings" className="profile-quick-link">
            الإعدادات
          </Link>
        </nav>
      </div>
    </UtilityScreen>
  );
}
