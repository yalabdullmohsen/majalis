import { useEffect, useMemo, useState } from "react";
import { Check, Search, Volume2, X } from "lucide-react";
import type { SettingsSoundOption } from "@/lib/adhan-settings-sound-catalog";
import { listProductionApprovedAudio } from "@/lib/prayer-audio-rights-registry";

type Props = {
  open: boolean;
  options: SettingsSoundOption[];
  selectedId: string;
  playingId: string | null;
  onClose: () => void;
  onSelect: (opt: SettingsSoundOption) => void;
  onPreview: (opt: SettingsSoundOption) => void;
  title?: string;
};

/**
 * منتقي أصوات الصلاة — ورقة كاملة بدل شبكة مزدحمة في الصفحة الرئيسية.
 */
export function PrayerAudioPicker({
  open,
  options,
  selectedId,
  playingId,
  onClose,
  onSelect,
  onPreview,
  title = "اختيار صوت الصلاة",
}: Props) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "adhan" | "tone">("all");
  const approvedIds = useMemo(
    () => new Set(listProductionApprovedAudio().map((r) => r.audioId)),
    [],
  );

  useEffect(() => {
    if (!open) {
      setQuery("");
      setFilter("all");
    }
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim();
    return options.filter((o) => {
      if (o.id === "qatami") return false;
      if (filter !== "all" && o.group !== filter) return false;
      if (q && !o.label.includes(q)) return false;
      return true;
    });
  }, [options, query, filter]);

  if (!open) return null;

  return (
    <div className="prayer-audio-picker" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" className="prayer-audio-picker__backdrop" aria-label="إغلاق" onClick={onClose} />
      <div className="prayer-audio-picker__sheet">
        <header className="prayer-audio-picker__head">
          <h2>{title}</h2>
          <button type="button" className="prayer-audio-picker__close" onClick={onClose} aria-label="إغلاق">
            <X size={18} strokeWidth={2} aria-hidden />
          </button>
        </header>

        <label className="prayer-audio-picker__search">
          <Search size={16} strokeWidth={2} aria-hidden />
          <span className="sr-only">بحث في الأصوات</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث عن صوت…"
            autoComplete="off"
          />
        </label>

        <div className="prayer-audio-picker__filters" role="tablist" aria-label="تصفية الأصوات">
          {(
            [
              ["all", "الكل"],
              ["tone", "تنبيهات"],
              ["adhan", "أذان"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={filter === id}
              className={`prayer-audio-picker__chip${filter === id ? " is-active" : ""}`}
              onClick={() => setFilter(id)}
            >
              {label}
            </button>
          ))}
        </div>

        <ul className="prayer-audio-picker__list" role="listbox" aria-label={title}>
          {filtered.map((opt) => {
            const selected = opt.id === selectedId;
            const playing = playingId === opt.id;
            const productionOk =
              approvedIds.has(opt.id) ||
              opt.group === "tone" ||
              opt.id === "makkah" ||
              opt.id === "silent" ||
              opt.id === "kuwait";
            return (
              <li key={opt.id} className={`prayer-audio-picker__row${selected ? " is-selected" : ""}`}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className="prayer-audio-picker__select"
                  onClick={() => onSelect(opt)}
                >
                  <span className="prayer-audio-picker__name">{opt.label}</span>
                  <span className="prayer-audio-picker__meta">
                    {opt.group === "adhan" ? "أذان داخل التطبيق" : "صوت إشعار"}
                    {!productionOk ? " · قيد المراجعة الحقوقية" : ""}
                  </span>
                </button>
                <button
                  type="button"
                  className={`prayer-audio-picker__preview${playing ? " is-playing" : ""}`}
                  aria-label={playing ? `إيقاف ${opt.label}` : `معاينة ${opt.label}`}
                  onClick={() => onPreview(opt)}
                  disabled={opt.playbackMode === "silent"}
                >
                  <Volume2 size={16} strokeWidth={2} aria-hidden />
                </button>
                {selected ? (
                  <span className="prayer-audio-picker__check" aria-hidden>
                    <Check size={16} strokeWidth={2.4} />
                  </span>
                ) : null}
              </li>
            );
          })}
          {filtered.length === 0 ? (
            <li className="prayer-audio-picker__empty" role="status">
              لا نتائج لهذا البحث.
            </li>
          ) : null}
        </ul>

        <p className="prayer-audio-picker__note">
          عند فشل الملف يُستخدم صوت النظام. التفاصيل في{" "}
          <a href="/data-licenses">الأصوات والتراخيص</a>.
        </p>
      </div>
    </div>
  );
}
