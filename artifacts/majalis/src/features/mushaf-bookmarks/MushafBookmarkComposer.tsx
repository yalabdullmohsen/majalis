import { memo, useCallback, useMemo, useState } from "react";
import {
  getBookmarkKindMeta,
  MUSHAF_BOOKMARK_KINDS,
  type MushafBookmarkKind,
  type MushafWirdSlot,
} from "@/lib/quran-bookmark-kinds";
import { addTypedBookmark } from "@/lib/quran-my-bookmarks-ops";
import { haptics } from "@/lib/haptics";
import { getSurahMeta } from "@/lib/quran-api";
import { toArabicIndicDigits as toArabicDigits } from "@/lib/numerals";
import { parseVerseKey } from "@/features/mushaf-madinah/mushaf-page-for-ayah";

type Props = {
  verseKey: string;
  page: number;
  onClose: () => void;
  onSaved?: (message: string) => void;
};

const CUSTOM_SWATCHES = ["#5c564c", "#3d6a96", "#2f6b4f", "#b06a32", "#5c4f7a", "#9a7a2e"] as const;

/**
 * Composer فاصل متقدم — يفتح من قائمة الآية دون تغطية نص المصحف (شريط سفلي).
 */
export const MushafBookmarkComposer = memo(function MushafBookmarkComposer({
  verseKey,
  page,
  onClose,
  onSaved,
}: Props) {
  const [kind, setKind] = useState<MushafBookmarkKind>("hifz");
  const [note, setNote] = useState("");
  const [customName, setCustomName] = useState("");
  const [customColor, setCustomColor] = useState<string>(CUSTOM_SWATCHES[0]!);
  const [wirdSlot, setWirdSlot] = useState<MushafWirdSlot>("any");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsed = parseVerseKey(verseKey);
  const heading = useMemo(() => {
    if (!parsed) return verseKey;
    return `${getSurahMeta(parsed.surah).name} · آية ${toArabicDigits(parsed.ayah)}`;
  }, [parsed, verseKey]);

  const save = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    const meta = getBookmarkKindMeta(kind);
    const result = await addTypedBookmark({
      ayahKey: verseKey,
      page,
      kind,
      label:
        kind === "custom" && customName.trim()
          ? customName.trim()
          : `${meta.label} · ${heading}`,
      note: note.trim() || undefined,
      customName: kind === "custom" ? customName.trim() || undefined : undefined,
      customColor: kind === "custom" ? customColor : undefined,
      wirdSlot: kind === "wird" ? wirdSlot : undefined,
    });
    setBusy(false);
    if (!result.ok) {
      haptics.error();
      setError(result.error);
      return;
    }
    haptics.success();
    onSaved?.("تم حفظ الفاصل");
    onClose();
  }, [busy, verseKey, page, kind, note, customName, customColor, wirdSlot, onClose, onSaved]);

  return (
    <div
      className="rb-composer"
      data-testid="mushaf-bookmark-composer"
      role="dialog"
      aria-label="إضافة فاصل"
    >
      <div className="rb-composer__head">
        <button type="button" className="rb-composer__close" onClick={onClose} aria-label="إغلاق">
          إغلاق
        </button>
        <div className="rb-composer__title">
          <span className="rb-composer__eyebrow">إضافة فاصل</span>
          <strong>{heading}</strong>
        </div>
      </div>

      <div className="rb-composer__kinds" role="listbox" aria-label="نوع الفاصل">
        {MUSHAF_BOOKMARK_KINDS.map((k) => (
          <button
            key={k.id}
            type="button"
            role="option"
            aria-selected={kind === k.id}
            className={`rb-composer__kind${kind === k.id ? " is-active" : ""}`}
            style={{ ["--rb-kind" as string]: k.color }}
            onClick={() => setKind(k.id)}
          >
            <span className="rb-composer__kind-dot" aria-hidden="true" />
            {k.label}
          </button>
        ))}
      </div>

      {kind === "wird" ? (
        <div className="rb-composer__slots" role="group" aria-label="وقت الورد">
          {(
            [
              ["any", "عام"],
              ["morning", "صباحي"],
              ["evening", "مسائي"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`rb-composer__slot${wirdSlot === id ? " is-active" : ""}`}
              onClick={() => setWirdSlot(id)}
            >
              {label}
            </button>
          ))}
        </div>
      ) : null}

      {kind === "custom" ? (
        <div className="rb-composer__custom">
          <input
            className="rb-composer__input"
            dir="rtl"
            placeholder="اسم الفاصل"
            maxLength={48}
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            aria-label="اسم الفاصل المخصص"
          />
          <div className="rb-composer__swatches" role="group" aria-label="لون مخصص">
            {CUSTOM_SWATCHES.map((c) => (
              <button
                key={c}
                type="button"
                className={`rb-composer__swatch${customColor === c ? " is-active" : ""}`}
                style={{ background: c }}
                aria-label={`لون ${c}`}
                aria-pressed={customColor === c}
                onClick={() => setCustomColor(c)}
              />
            ))}
          </div>
        </div>
      ) : null}

      <label className="rb-composer__note">
        <span>ملاحظة اختيارية</span>
        <textarea
          dir="rtl"
          rows={2}
          maxLength={240}
          placeholder="مثال: مراجعة سورة البقرة"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </label>

      {error ? (
        <p className="rb-composer__error" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        className="rb-composer__save"
        disabled={busy}
        onClick={() => void save()}
      >
        {busy ? "جاري الحفظ…" : "حفظ الفاصل"}
      </button>
    </div>
  );
});
