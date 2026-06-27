import { TAFSIR_SOURCES } from "@/lib/quran-tafsir";

type Props = {
  selectedId: string;
  onSelect: (id: string) => void;
  tafsirAyahs: { ayah: number; text: string }[];
  loading: boolean;
  surahName: string;
};

export function TafsirSection({ selectedId, onSelect, tafsirAyahs, loading, surahName }: Props) {
  const selected = TAFSIR_SOURCES.find((t) => t.id === selectedId) || TAFSIR_SOURCES[0];

  return (
    <section className="quran-v2-tafsir ui-card" aria-labelledby="tafsir-heading">
      <h3 id="tafsir-heading" className="quran-v2-section-title">التفسير</h3>
      <div className="quran-v2-tafsir-grid">
        {TAFSIR_SOURCES.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`quran-v2-tafsir-card${t.id === selectedId ? " is-active" : ""}`}
            onClick={() => onSelect(t.id)}
          >
            <strong>{t.name}</strong>
            <span>{t.author}</span>
          </button>
        ))}
      </div>
      <p className="quran-v2-tafsir-desc">{selected.description}</p>
      {loading ? (
        <p className="quran-v2-muted">جاري تحميل التفسير…</p>
      ) : selected.apiEdition && tafsirAyahs.length > 0 ? (
        <div className="quran-v2-tafsir-text">
          {tafsirAyahs.map((t) => (
            <p key={t.ayah} className="quran-v2-tafsir-ayah">
              <span className="quran-v2-ayah-badge">{t.ayah}</span>
              {t.text}
            </p>
          ))}
        </div>
      ) : selected.searchHref ? (
        <a href={selected.searchHref(surahName)} className="quran-v2-tafsir-link">
          اقرأ {selected.name} عبر البحث في المنصة ←
        </a>
      ) : (
        <p className="quran-v2-muted">التفسير غير متاح مباشرة لهذا المصدر.</p>
      )}
    </section>
  );
}
