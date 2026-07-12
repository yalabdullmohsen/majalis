import { useState } from "react";
import { PageHeader } from "@/components/ui-common";
import { DURUS_MUTANAWWIA } from "@/lib/durus-mutanawwia-data";
import type { DarsSection } from "@/lib/durus-imaniyya-data";

export default function DurusMutanawwiaPage() {
  const [openId, setOpenId] = useState<string | null>(null);
  const toggle = (id: string) => setOpenId((prev) => (prev === id ? null : id));
  const totalLessons = DURUS_MUTANAWWIA.reduce((s, sec) => s + sec.lessons.length, 0);
  const avgLessons = Math.round(totalLessons / DURUS_MUTANAWWIA.length);

  return (
    <div className="page-shell" dir="rtl">
      <PageHeader
        eyebrow="المحتوى التعليمي"
        title="دروس متنوعة"
        subtitle={`فهرس شامل — ${DURUS_MUTANAWWIA.length} بابًا · ${totalLessons}+ درسًا`}
      />

      {/* إحصاء */}
      <div className="max-w-3xl mx-auto px-4 mb-8">
        <div className="grid grid-cols-3 gap-3">
          <StatBox value={DURUS_MUTANAWWIA.length} label="باب" color="#16a34a" />
          <StatBox value={totalLessons} label="درس" color="#0284c7" />
          <StatBox value={avgLessons} label="درس/باب" color="#b45309" />
        </div>
      </div>

      {/* الأبواب */}
      <div className="max-w-3xl mx-auto px-4 pb-20 space-y-3">
        {DURUS_MUTANAWWIA.map((sec) => (
          <SectionCard
            key={sec.id}
            section={sec}
            open={openId === sec.id}
            onToggle={() => toggle(sec.id)}
          />
        ))}
      </div>
    </div>
  );
}

function StatBox({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div
      className="rounded-2xl p-4 text-center"
      style={{ background: `${color}12`, border: `1px solid ${color}30` }}
    >
      <div className="text-2xl font-extrabold" style={{ color }}>{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}

function SectionCard({
  section,
  open,
  onToggle,
}: {
  section: DarsSection;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className="rounded-2xl border overflow-hidden bg-white dark:bg-gray-900 shadow-sm"
      style={{ borderColor: open ? `${section.color}60` : "#e5e7eb" }}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-right flex items-center gap-3 px-5 py-4 transition-colors"
        style={{ background: open ? `${section.color}10` : undefined }}
      >
        <span
          className="flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-full text-white hidden sm:inline"
          style={{ background: section.color }}
        >
          {section.num}
        </span>
        <span className="text-2xl flex-shrink-0">{section.icon}</span>
        <div className="flex-1 min-w-0">
          <h3 className="font-extrabold text-gray-900 dark:text-white text-base leading-tight">
            {section.title}
          </h3>
          <span className="text-xs text-gray-400">{section.lessons.length} درسًا</span>
        </div>
        <span
          className="flex-shrink-0 text-lg transition-transform duration-200"
          style={{ color: section.color, transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          ▾
        </span>
      </button>

      {open && (
        <div className="px-5 pb-5">
          <div className="h-0.5 mb-4 rounded-full" style={{ background: `${section.color}30` }} />
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {section.lessons.map((lesson, idx) => (
              <li key={lesson.id}>
                <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <span
                    className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5"
                    style={{ background: section.color, opacity: 0.85 }}
                  >
                    {idx + 1}
                  </span>
                  <span className="leading-snug">{lesson.title}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
