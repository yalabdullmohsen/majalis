import { Link } from "wouter";
import { PageHeader } from "@/components/ui-common";
import { MASARAT, type Masar } from "@/lib/masarat-data";

export default function MasaratPage() {
  return (
    <div className="page-shell" dir="rtl">
      <PageHeader
        eyebrow="مسارات التعلم"
        title="ابدأ من هنا"
        subtitle="اختر مسارًا يناسب هدفك، وسيرشدك خطوة بخطوة"
      />

      <div className="max-w-4xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {MASARAT.map((masar) => (
            <MasarCard key={masar.id} masar={masar} />
          ))}
        </div>
      </div>
    </div>
  );
}

function MasarCard({ masar }: { masar: Masar }) {
  return (
    <div
      className="rounded-2xl border overflow-hidden bg-white dark:bg-gray-900 shadow-sm flex flex-col"
      style={{ borderColor: `${masar.color}40` }}
    >
      {/* Header */}
      <div
        className="px-5 pt-5 pb-4"
        style={{ background: `${masar.color}0e` }}
      >
        <div className="flex items-start justify-between gap-3 mb-2">
          <span className="text-3xl">{masar.icon}</span>
          <div className="flex gap-2 flex-shrink-0">
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: `${masar.color}20`, color: masar.color }}
            >
              {masar.level}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 dark:bg-gray-800 text-gray-500">
              {masar.duration}
            </span>
          </div>
        </div>
        <h2
          className="text-lg font-extrabold leading-tight"
          style={{ color: masar.color }}
        >
          {masar.title}
        </h2>
        <p className="text-sm text-gray-500 mt-1 leading-snug">{masar.subtitle}</p>
      </div>

      {/* Steps */}
      <div className="px-5 py-4 flex-1">
        <ol className="space-y-2">
          {masar.steps.map((step, idx) => (
            <li key={step.id} className="flex items-start gap-3">
              <span
                className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5"
                style={{ background: masar.color, opacity: 0.8 }}
              >
                {idx + 1}
              </span>
              {step.href ? (
                <Link
                  href={step.href}
                  className="text-sm text-gray-700 dark:text-gray-300 hover:underline leading-snug"
                >
                  {step.title}
                </Link>
              ) : (
                <span className="text-sm text-gray-700 dark:text-gray-300 leading-snug">
                  {step.title}
                </span>
              )}
            </li>
          ))}
        </ol>
      </div>

      {/* CTA */}
      <div className="px-5 pb-5">
        <div
          className="h-px mb-4 rounded-full"
          style={{ background: `${masar.color}20` }}
        />
        <Link
          href={masar.steps[0]?.href ?? "#"}
          className="block w-full text-center text-sm font-bold py-2.5 rounded-xl text-white transition-opacity hover:opacity-90"
          style={{ background: masar.color }}
        >
          ابدأ المسار ←
        </Link>
      </div>
    </div>
  );
}
