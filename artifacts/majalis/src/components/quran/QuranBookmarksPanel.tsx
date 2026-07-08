/**
 * QuranBookmarksPanel — إشارات مرجعية وملاحظات وتقدم الحفظ
 */
import { useCallback, useEffect, useState } from "react";
import { BookOpen, BookmarkCheck, Brain, PenLine } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  getBookmarks,
  getBookmarkLists,
  removeBookmark,
  getHifzProgress,
  type QuranBookmark,
  type HifzSurahProgress,
} from "@/lib/quran-personal";

type Tab = "bookmarks" | "notes" | "hifz";

type Props = {
  onGoTo: (surahNum: number, ayahNum: number) => void;
  onClose: () => void;
};

const HIFZ_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  not_started: { label: "لم يُبدأ",   color: "var(--majalis-ink-soft)" },
  memorizing:  { label: "جارٍ الحفظ", color: "var(--majalis-emerald, #0E6E52)" },
  memorized:   { label: "محفوظ ✓",    color: "var(--majalis-emerald-deep, #0A5040)" },
  reviewing:   { label: "مراجعة",     color: "#1E40AF" },
};

function HifzList() {
  const [progress, setProgress] = useState<HifzSurahProgress[]>([]);
  useEffect(() => { setProgress(getHifzProgress()); }, []);

  if (progress.length === 0) {
    return (
      <div className="qbp-empty">
        <p className="qbp-empty__icon"><BookOpen size={32} strokeWidth={1.3} /></p>
        <p className="qbp-empty__text">لا يوجد سور مضافة لمتابعة الحفظ بعد.</p>
        <p className="qbp-empty__hint">اضغط مطولاً على أي آية ثم اختر "إضافة للحفظ".</p>
      </div>
    );
  }

  return (
    <div>
      {progress.map((h) => {
        const pct    = h.totalAyahs > 0 ? Math.round((h.memorizedAyahs / h.totalAyahs) * 100) : 0;
        const status = HIFZ_STATUS_LABELS[h.status] ?? { label: h.status, color: "var(--majalis-ink-soft)" };
        return (
          <div key={h.surahNum} className="qbp-hifz-row">
            <div className="qbp-hifz-head">
              <span className="qbp-hifz-name">سورة رقم {h.surahNum}</span>
              <span className="qbp-hifz-status" style={{ "--qbp-hifz-status-color": status.color } as React.CSSProperties}>{status.label}</span>
            </div>
            <div className="qbp-hifz-bar-wrap">
              <div className="qbp-hifz-bar">
                <div className="qbp-hifz-fill" style={{ "--qbp-fill-w": `${pct}%` } as React.CSSProperties} />
              </div>
              <span className="qbp-hifz-pct">{h.memorizedAyahs}/{h.totalAyahs} ({pct}%)</span>
            </div>
            {h.nextReviewAt && (
              <p className="qbp-hifz-review">
                موعد المراجعة: {new Date(h.nextReviewAt).toLocaleDateString("ar")}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function NotesList({ onGoTo }: { onGoTo: (s: number, a: number) => void }) {
  const [noteKeys] = useState<{ surahNum: number; ayahNum: number; text: string; updatedAt: number }[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("mj-quran-notes-v1") || "[]");
    } catch { return []; }
  });

  if (noteKeys.length === 0) {
    return (
      <div className="qbp-empty">
        <p className="qbp-empty__icon"><PenLine size={32} strokeWidth={1.3} /></p>
        <p className="qbp-empty__text">لا توجد ملاحظات بعد.</p>
        <p className="qbp-empty__hint">اضغط مطولاً على أي آية وأضف ملاحظة خاصة بك.</p>
      </div>
    );
  }

  return (
    <div>
      {noteKeys.map((note) => (
        <button
          key={`${note.surahNum}-${note.ayahNum}`}
          type="button"
          onClick={() => onGoTo(note.surahNum, note.ayahNum)}
          className="qbp-note-btn"
        >
          <span className="qbp-note-ref">السورة {note.surahNum} · الآية {note.ayahNum}</span>
          <span className="qbp-note-text">
            {note.text.slice(0, 120)}{note.text.length > 120 ? "…" : ""}
          </span>
        </button>
      ))}
    </div>
  );
}

function BookmarksList({ onGoTo }: { onGoTo: (s: number, a: number) => void }) {
  const [bookmarks, setBookmarks] = useState<QuranBookmark[]>([]);
  const [activeList, setActiveList] = useState<string>("all");
  const [lists, setLists]           = useState<string[]>([]);

  useEffect(() => {
    const all = getBookmarks();
    setBookmarks(all);
    setLists(["all", ...getBookmarkLists()]);
  }, []);

  const filtered = activeList === "all" ? bookmarks : bookmarks.filter((b) => b.list === activeList);

  const handleRemove = useCallback((surahNum: number, ayahNum: number) => {
    removeBookmark(surahNum, ayahNum);
    setBookmarks(getBookmarks());
  }, []);

  if (bookmarks.length === 0) {
    return (
      <div className="qbp-empty">
        <p className="qbp-empty__icon"><BookmarkCheck size={32} strokeWidth={1.3} /></p>
        <p className="qbp-empty__text">لا توجد إشارات مرجعية بعد.</p>
        <p className="qbp-empty__hint">اضغط مطولاً على أي آية وأضفها للمفضلة.</p>
      </div>
    );
  }

  return (
    <div>
      {lists.length > 2 && (
        <div className="qbp-list-filters">
          {lists.map((l) => {
            const active = activeList === l;
            return (
              <button
                key={l}
                type="button"
                onClick={() => setActiveList(l)}
                className={`qbp-list-chip${active ? " qbp-list-chip--active" : ""}`}
              >
                {l === "all" ? "الكل" : l}
              </button>
            );
          })}
        </div>
      )}

      {filtered.map((bk) => (
        <div key={`${bk.surahNum}-${bk.ayahNum}`} className="qbp-bk-row">
          <button type="button" onClick={() => onGoTo(bk.surahNum, bk.ayahNum)} className="qbp-bk-nav-btn">
            <span className="qbp-bk-ref">{bk.surahName} · الآية {bk.ayahNum}</span>
            <span dir="rtl" lang="ar" className="qbp-bk-text">{bk.text}</span>
          </button>
          <button
            type="button"
            onClick={() => handleRemove(bk.surahNum, bk.ayahNum)}
            aria-label="حذف الإشارة"
            className="qbp-bk-del"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

const TABS: { id: Tab; label: string; Icon: LucideIcon }[] = [
  { id: "bookmarks", label: "إشارات",  Icon: BookmarkCheck },
  { id: "notes",     label: "ملاحظات", Icon: PenLine       },
  { id: "hifz",      label: "الحفظ",   Icon: Brain         },
];

export function QuranBookmarksPanel({ onGoTo, onClose }: Props) {
  const [tab, setTab] = useState<Tab>("bookmarks");

  const handleGoTo = (surahNum: number, ayahNum: number) => {
    onClose();
    onGoTo(surahNum, ayahNum);
  };

  return (
    <>
      <div className="qbp-backdrop" onClick={onClose} aria-hidden="true" />
      <div role="dialog" aria-modal="true" aria-label="المفضلة والملاحظات والحفظ" className="qbp-drawer">
        <div aria-hidden className="eap-handle" />

        <div className="qbp-header">
          <h2 className="qbp-title">مكتبتي الشخصية</h2>
          <button type="button" onClick={onClose} aria-label="إغلاق" className="qbp-close">✕</button>
        </div>

        <div className="qbp-tabs" role="tablist">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                role="tab"
                aria-selected={active}
                className={`qbp-tab${active ? " qbp-tab--active" : ""}`}
              >
                {(() => { const I = t.Icon; return <I size={13} className="inline ml-1" />; })()} {t.label}
              </button>
            );
          })}
        </div>

        <div className="qbp-body">
          {tab === "bookmarks" && <BookmarksList onGoTo={handleGoTo} />}
          {tab === "notes"     && <NotesList onGoTo={handleGoTo} />}
          {tab === "hifz"      && <HifzList />}
        </div>
      </div>
    </>
  );
}
