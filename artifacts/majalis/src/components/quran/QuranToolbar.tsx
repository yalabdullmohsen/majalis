import type { QuranPreferences } from "@/hooks/useQuranPreferences";

type Props = {
  prefs: QuranPreferences;
  onBumpFont: (delta: number) => void;
  onSetPref: <K extends keyof QuranPreferences>(key: K, value: QuranPreferences[K]) => void;
  surahSearch: string;
  onSurahSearch: (v: string) => void;
  onJumpAyah: (n: number) => void;
  maxAyah: number;
  targetAyah: number;
};

const TOOLBAR_ITEMS: {
  key: keyof QuranPreferences | "fontUp" | "fontDown";
  label: string;
  icon: string;
  toggle?: boolean;
}[] = [
  { key: "fontUp", label: "تكبير الخط", icon: "A+" },
  { key: "fontDown", label: "تصغير الخط", icon: "A−" },
  { key: "fontId", label: "الخط", icon: "ف" },
  { key: "showAyahNumbers", label: "أرقام الآيات", icon: "①", toggle: true },
  { key: "showWaqf", label: "الوقوف", icon: "ۖ", toggle: true },
  { key: "nightMode", label: "الوضع الليلي", icon: "☾", toggle: true },
  { key: "readingMode", label: "وضع القراءة", icon: "📖", toggle: true },
  { key: "hideTashkeel", label: "إخفاء التشكيل", icon: "◌", toggle: true },
];

export function QuranToolbar({
  prefs,
  onBumpFont,
  onSetPref,
  surahSearch,
  onSurahSearch,
  onJumpAyah,
  maxAyah,
  targetAyah,
}: Props) {
  const handleTool = (key: string) => {
    if (key === "fontUp") return onBumpFont(2);
    if (key === "fontDown") return onBumpFont(-2);
    if (key === "fontId") {
      const order = ["uthmani", "naskh", "amiri"] as const;
      const idx = order.indexOf(prefs.fontId);
      onSetPref("fontId", order[(idx + 1) % order.length]);
      return;
    }
    const item = TOOLBAR_ITEMS.find((t) => t.key === key);
    if (item?.toggle) {
      onSetPref(key as keyof QuranPreferences, !prefs[key as keyof QuranPreferences] as never);
    }
  };

  return (
    <section className="quran-v2-toolbar ui-card" aria-label="أدوات القراءة">
      <div className="quran-v2-toolbar__search-row">
        <input
          type="search"
          className="quran-v2-toolbar__search"
          placeholder="بحث داخل السورة أو اسم سورة..."
          value={surahSearch}
          onChange={(e) => onSurahSearch(e.target.value)}
          aria-label="بحث"
        />
        <label className="quran-v2-toolbar__jump">
          <span>آية</span>
          <input
            type="number"
            min={1}
            max={maxAyah}
            value={targetAyah}
            onChange={(e) => onJumpAyah(Number(e.target.value) || 1)}
            aria-label="الانتقال إلى آية"
          />
        </label>
      </div>
      <div className="quran-v2-toolbar__tools" role="toolbar">
        {TOOLBAR_ITEMS.map((item) => {
          const active = item.toggle && prefs[item.key as keyof QuranPreferences];
          return (
            <button
              key={item.key}
              type="button"
              className={`quran-v2-tool${active ? " is-active" : ""}`}
              title={item.label}
              aria-label={item.label}
              aria-pressed={item.toggle ? Boolean(active) : undefined}
              onClick={() => handleTool(item.key)}
            >
              <span className="quran-v2-tool__icon">{item.icon}</span>
              <span className="quran-v2-tool__label">{item.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
