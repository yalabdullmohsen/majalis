import { useState } from "react";
import { PageHeader } from "@/components/ui-common";
import { Chip } from "@/components/ui-common";
import { TasbeehCounter } from "@/components/reading/TasbeehCounter";
import { incrementTaskProgress } from "@/lib/daily-progress";

const PRESETS = [
  { id: "takbir", label: "التكبير", phrase: "الله أكبر", target: 33 },
  { id: "tahleel", label: "التهليل", phrase: "لا إله إلا الله", target: 100 },
  { id: "tasbih", label: "التسبيح", phrase: "سبحان الله", target: 100 },
  { id: "istighfar", label: "الاستغفار", phrase: "أستغفر الله", target: 100 },
  { id: "salawat", label: "الصلاة على النبي", phrase: "اللهم صلّ على محمد", target: 100 },
];

const STORAGE = "majalis-tasbih-v1";

export default function TasbihPage() {
  const [active, setActive] = useState(PRESETS[2]);
  const [saved, setSaved] = useState<Record<string, number>>(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE) || "{}");
    } catch {
      return {};
    }
  });

  const persist = () => {
    const next = { ...saved, [active.id]: active.target };
    setSaved(next);
    localStorage.setItem(STORAGE, JSON.stringify(next));
    incrementTaskProgress("tasbih", 1);
  };

  return (
    <div className="page-shell narrow">
      <PageHeader eyebrow="الأذكار" title="التسابيح" subtitle="مسبحة إلكترونية مع أهداف يومية." />

      <div className="page-chip-row">
        {PRESETS.map((p) => (
          <Chip key={p.id} active={active.id === p.id} onClick={() => setActive(p)}>
            {p.label}
          </Chip>
        ))}
      </div>

      <div className="ui-card tasbih-page-card">
        <p className="tasbih-phrase">{active.phrase}</p>
        <TasbeehCounter target={active.target} label={active.label} />
        {saved[active.id] != null && (
          <p className="tasbih-saved">آخر حفظ: {saved[active.id]}</p>
        )}
        <button type="button" className="ui-card-btn" onClick={persist}>
          حفظ الإنجاز
        </button>
      </div>
    </div>
  );
}
