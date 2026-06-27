import { TAFSIR_SOURCES } from "@/lib/quran-tafsir";

type Props = {
  activeId: string;
  onChange: (id: string) => void;
};

export function TafsirTabs({ activeId, onChange }: Props) {
  return (
    <div className="quran-tafsir-tabs" role="tablist" aria-label="مصادر التفسير">
      {TAFSIR_SOURCES.map((source) => (
        <button
          key={source.id}
          type="button"
          role="tab"
          aria-selected={activeId === source.id}
          className={`quran-tafsir-tab${activeId === source.id ? " is-active" : ""}`}
          onClick={() => onChange(source.id)}
        >
          {source.name}
        </button>
      ))}
    </div>
  );
}
