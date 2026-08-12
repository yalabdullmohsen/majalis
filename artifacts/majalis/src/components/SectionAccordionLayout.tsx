import { useState } from "react";
import { PageHeader } from "@/components/ui-common";
import { ExploreAlsoNav, type ExploreAlsoLink } from "@/components/ExploreAlsoNav";
import type { DarsSection } from "@/lib/dars-types";

type Props = {
  eyebrow: string;
  title: string;
  sections: DarsSection[];
  stat3Label?: string;
  stat3Value?: number;
  /** روابط تربط الصفحة ببقية المنصة — تمنع نهاية مسدودة */
  relatedLinks?: ExploreAlsoLink[];
  relatedTitle?: string;
};

export function SectionAccordionLayout({
  eyebrow,
  title,
  sections,
  stat3Label,
  stat3Value,
  relatedLinks,
  relatedTitle,
}: Props) {
  const [openId, setOpenId] = useState<string | null>(null);
  const totalLessons = sections.reduce((s, sec) => s + sec.lessons.length, 0);
  const avg = Math.round(totalLessons / sections.length);

  return (
    <div className="page-shell" dir="rtl">
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        subtitle={`فهرس دراسي — ${sections.length} بابًا · ${totalLessons} موضوعًا (ملخصات ومتون موجزة للتعلّم الذاتي)`}
      />

      <div className="max-w-3xl mx-auto px-4 mb-8">
        <div className="grid grid-cols-3 gap-3">
          <StatBox value={sections.length} label="باب" color="#16a34a" />
          <StatBox value={totalLessons} label="موضوع" color="#0284c7" />
          <StatBox
            value={stat3Value ?? avg}
            label={stat3Label ?? "موضوع/باب"}
            color="#b45309"
          />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pb-8 space-y-3">
        {sections.map((sec) => (
          <SectionCard
            key={sec.id}
            section={sec}
            open={openId === sec.id}
            onToggle={() => setOpenId((prev) => (prev === sec.id ? null : sec.id))}
          />
        ))}
      </div>

      {relatedLinks && relatedLinks.length > 0 && (
        <div className="max-w-3xl mx-auto px-4 pb-20">
          <ExploreAlsoNav title={relatedTitle ?? "استكشف أيضًا"} links={relatedLinks} />
        </div>
      )}
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
          <span className="text-xs text-gray-400">{section.lessons.length} موضوعًا</span>
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
                  <span className="leading-snug">
                    {lesson.title}
                    {lesson.summary && (
                      <span className="block mt-1 text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-normal">
                        {lesson.summary}
                      </span>
                    )}
                    {lesson.body && (
                      <span className="block mt-1.5 text-xs text-gray-600 dark:text-gray-300 leading-relaxed font-normal border-r-2 pr-2" style={{ borderColor: section.color }}>
                        {lesson.body}
                      </span>
                    )}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
