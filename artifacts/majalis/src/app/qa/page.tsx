import type { Metadata } from "next";
import { fetchQaForServer } from "../../../lib/supabase/server-data";
import QaPageClient from "@/components/seo/QaPageClient";
import { faqPageJsonLd } from "@/lib/seo-structured-data";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { questions } = await fetchQaForServer();
  return {
    title: "الأسئلة الشرعية",
    description: `${questions.length} سؤال علمي عام مدعوم بالأدلة الشرعية.`,
    openGraph: {
      title: "الأسئلة الشرعية | المجلس العلمي",
      description: "أسئلة علمية عامة مع أدلة ومصادر.",
      locale: "ar_AR",
      type: "website",
      url: "https://majlisilm.com/qa",
    },
  };
}

export default async function QaPage() {
  const { categories, questions } = await fetchQaForServer();

  const faqJsonLd = faqPageJsonLd(
    questions.slice(0, 50).map((item) => ({
      question: item.question,
      answer: String(item.answer || "").slice(0, 500),
    })),
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <section className="page-shell" aria-label="فهرس الأسئلة">
        <h1 className="home-section-title">الأسئلة الشرعية</h1>
        <p className="seo-listing-intro">
          {questions.length.toLocaleString("ar-EG")} سؤالاً منشوراً في {categories.length.toLocaleString("ar-EG")} تصنيفاً.
        </p>
        <div className="seo-listing-links">
          {questions.slice(0, 10).map((item) => (
            <p key={item.id}>
              <strong>{item.question}</strong>
              {item.answer ? ` — ${String(item.answer).slice(0, 140)}` : ""}
            </p>
          ))}
        </div>
      </section>
      <QaPageClient initialCategories={categories} initialQuestions={questions} />
    </>
  );
}
