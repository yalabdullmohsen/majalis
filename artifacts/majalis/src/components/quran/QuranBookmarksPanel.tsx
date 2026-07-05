/**
 * QuranBookmarksPanel — إشارات مرجعية وملاحظات وتقدم الحفظ
 */
import { useCallback, useEffect, useState } from "react";
import { C } from "@/lib/theme";
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

// ── Hifz status labels ─────────────────────────────────────────────────────
const HIFZ_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  not_started: { label: "لم يُبدأ",   color: C.inkSoft },
  memorizing:  { label: "جارٍ الحفظ", color: "#0E6E52" },
  memorized:   { label: "محفوظ ✓",    color: "#065F46" },
  reviewing:   { label: "مراجعة",     color: "#1E40AF" },
};

function HifzList() {
  const [progress, setProgress] = useState<HifzSurahProgress[]>([]);
  useEffect(() => { setProgress(getHifzProgress()); }, []);

  if (progress.length === 0) {
    return (
      <div style={{ padding: "2rem 1rem", textAlign: "center", color: C.inkSoft }}>
        <p style={{ fontSize: "1.5rem", margin: "0 0 0.5rem" }}>📖</p>
        <p style={{ margin: 0 }}>لا يوجد سور مضافة لمتابعة الحفظ بعد.</p>
        <p style={{ margin: "0.5rem 0 0", fontSize: "0.82rem" }}>
          اضغط مطولاً على أي آية ثم اختر "إضافة للحفظ".
        </p>
      </div>
    );
  }

  return (
    <div>
      {progress.map((h) => {
        const pct = h.totalAyahs > 0 ? Math.round((h.memorizedAyahs / h.totalAyahs) * 100) : 0;
        const status = HIFZ_STATUS_LABELS[h.status] ?? { label: h.status, color: C.inkSoft };
        return (
          <div
            key={h.surahNum}
            style={{
              padding: "0.75rem 1rem",
              borderBottom: `1px solid ${C.line}`,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
              <span style={{ fontWeight: 600, color: "var(--majalis-ink, #2c2412)", fontSize: "0.9rem" }}>
                سورة رقم {h.surahNum}
              </span>
              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: status.color }}>
                {status.label}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div style={{ flex: 1, height: "6px", background: "#e5e3dd", borderRadius: "3px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: C.emerald, borderRadius: "3px", transition: "width 0.3s" }} />
              </div>
              <span style={{ fontSize: "0.72rem", color: C.inkSoft, flexShrink: 0 }}>
                {h.memorizedAyahs}/{h.totalAyahs} ({pct}%)
              </span>
            </div>
            {h.nextReviewAt && (
              <p style={{ margin: "0.2rem 0 0", fontSize: "0.7rem", color: C.inkSoft }}>
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
  // Notes are loaded from localStorage — we'll show a simple list
  const [noteKeys] = useState<{ surahNum: number; ayahNum: number; text: string; updatedAt: number }[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("mj-quran-notes-v1") || "[]");
    } catch { return []; }
  });

  if (noteKeys.length === 0) {
    return (
      <div style={{ padding: "2rem 1rem", textAlign: "center", color: C.inkSoft }}>
        <p style={{ fontSize: "1.5rem", margin: "0 0 0.5rem" }}>📝</p>
        <p style={{ margin: 0 }}>لا توجد ملاحظات بعد.</p>
        <p style={{ margin: "0.5rem 0 0", fontSize: "0.82rem" }}>
          اضغط مطولاً على أي آية وأضف ملاحظة خاصة بك.
        </p>
      </div>
    );
  }

  return (
    <div>
      {noteKeys.map((note) => (
        <button
          key={`${note.surahNum}-${note.ayahNum}`}
          type="button"
          onClick={() => { onGoTo(note.surahNum, note.ayahNum); }}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            width: "100%",
            padding: "0.75rem 1rem",
            background: "none",
            border: "none",
            borderBottom: `1px solid ${C.line}`,
            cursor: "pointer",
            textAlign: "right",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = C.sage; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "none"; }}
        >
          <span style={{ fontSize: "0.72rem", color: C.emeraldDeep, fontWeight: 700, marginBottom: "0.2rem" }}>
            السورة {note.surahNum} · الآية {note.ayahNum}
          </span>
          <span style={{ fontSize: "0.875rem", color: "var(--majalis-ink, #2c2412)", lineHeight: 1.5 }}>
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
  const [lists, setLists] = useState<string[]>([]);

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
      <div style={{ padding: "2rem 1rem", textAlign: "center", color: C.inkSoft }}>
        <p style={{ fontSize: "1.5rem", margin: "0 0 0.5rem" }}>🔖</p>
        <p style={{ margin: 0 }}>لا توجد إشارات مرجعية بعد.</p>
        <p style={{ margin: "0.5rem 0 0", fontSize: "0.82rem" }}>
          اضغط مطولاً على أي آية وأضفها للمفضلة.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* List filter chips */}
      {lists.length > 2 && (
        <div style={{ display: "flex", gap: "0.35rem", padding: "0.5rem 1rem", overflowX: "auto", scrollbarWidth: "none" }}>
          {lists.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setActiveList(l)}
              style={{
                flexShrink: 0,
                padding: "0.25rem 0.75rem",
                borderRadius: "2rem",
                border: `1px solid ${activeList === l ? C.emerald : C.line}`,
                background: activeList === l ? C.sage : "transparent",
                color: activeList === l ? C.emeraldDeep : C.inkSoft,
                fontWeight: activeList === l ? 700 : 400,
                fontSize: "0.8rem",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {l === "all" ? "الكل" : l}
            </button>
          ))}
        </div>
      )}

      {filtered.map((bk) => (
        <div
          key={`${bk.surahNum}-${bk.ayahNum}`}
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "0.5rem",
            padding: "0.75rem 1rem",
            borderBottom: `1px solid ${C.line}`,
          }}
        >
          <button
            type="button"
            onClick={() => onGoTo(bk.surahNum, bk.ayahNum)}
            style={{
              flex: 1,
              background: "none",
              border: "none",
              cursor: "pointer",
              textAlign: "right",
              padding: 0,
            }}
          >
            <div style={{ fontSize: "0.72rem", color: C.emeraldDeep, fontWeight: 700, marginBottom: "0.2rem" }}>
              {bk.surahName} · الآية {bk.ayahNum}
            </div>
            <div
              dir="rtl"
              lang="ar"
              style={{
                fontSize: "0.9rem",
                fontFamily: '"Amiri Quran", serif',
                lineHeight: 1.7,
                color: "var(--majalis-ink, #2c2412)",
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
              }}
            >
              {bk.text}
            </div>
          </button>
          <button
            type="button"
            onClick={() => handleRemove(bk.surahNum, bk.ayahNum)}
            aria-label="حذف الإشارة"
            style={{
              border: "none",
              background: "none",
              cursor: "pointer",
              color: "#dc2626",
              fontSize: "0.9rem",
              flexShrink: 0,
              minWidth: "32px",
              minHeight: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "bookmarks", label: "إشارات",   icon: "🔖" },
  { id: "notes",     label: "ملاحظات",  icon: "📝" },
  { id: "hifz",      label: "الحفظ",    icon: "🧠" },
];

export function QuranBookmarksPanel({ onGoTo, onClose }: Props) {
  const [tab, setTab] = useState<Tab>("bookmarks");

  const handleGoTo = (surahNum: number, ayahNum: number) => {
    onClose();
    onGoTo(surahNum, ayahNum);
  };

  return (
    <>
      <div
        style={{ position: "fixed", inset: 0, zIndex: 8900, background: "rgba(0,0,0,0.4)" }}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="المفضلة والملاحظات والحفظ"
        style={{
          position: "fixed",
          bottom: 0, right: 0, left: 0,
          zIndex: 8901,
          background: "var(--majalis-parchment, #faf9f6)",
          borderRadius: "1.25rem 1.25rem 0 0",
          boxShadow: "0 -12px 40px rgba(0,0,0,0.2)",
          maxHeight: "80dvh",
          display: "flex",
          flexDirection: "column",
          direction: "rtl",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {/* Handle */}
        <div aria-hidden style={{ width: "40px", height: "4px", borderRadius: "2px", background: "#c9c6c0", margin: "0.75rem auto 0", flexShrink: 0 }} />

        {/* Header */}
        <div style={{ padding: "0.5rem 1rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: C.emeraldDeep }}>
            مكتبتي الشخصية
          </h2>
          <button type="button" onClick={onClose} aria-label="إغلاق"
            style={{ border: "none", background: "none", cursor: "pointer", fontSize: "1rem", color: C.inkSoft, minWidth: "44px", minHeight: "44px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: `1px solid ${C.line}`, flexShrink: 0 }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              role="tab"
              aria-selected={tab === t.id}
              style={{
                flex: 1,
                padding: "0.6rem 0.5rem",
                border: "none",
                borderBottom: `2px solid ${tab === t.id ? C.emerald : "transparent"}`,
                background: "none",
                color: tab === t.id ? C.emeraldDeep : C.inkSoft,
                fontWeight: tab === t.id ? 700 : 400,
                fontSize: "0.82rem",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
          {tab === "bookmarks" && <BookmarksList onGoTo={handleGoTo} />}
          {tab === "notes"     && <NotesList onGoTo={handleGoTo} />}
          {tab === "hifz"      && <HifzList />}
        </div>
      </div>
    </>
  );
}
