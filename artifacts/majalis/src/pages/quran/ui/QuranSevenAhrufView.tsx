/**
 * نزول القرآن على سبعة أحرف — قسم داخل مركز القرآن الكريم.
 */
import { useEffect } from "react";
import { Link } from "wouter";
import { applyPageSeo } from "@/lib/seo";
import { SectionTemplatePage } from "@/components/topic/TopicPage";
import { SectionQuiz } from "@/components/ui/SectionQuiz";
import { AHRUF_SECTIONS } from "@/lib/quran-ahruf/content";
import "@/styles/pages/qiraat.css";

export default function QuranSevenAhrufView() {
  useEffect(() => {
    applyPageSeo({
      path: "/quran-hub/seven-ahruf",
      title: "الأحرف السبعة — سُنّة",
      description:
        "معنى نزول القرآن على سبعة أحرف، أحاديث الصحيحين، الفرق عن القراءات العشر، وجمع عثمان — موثّق لأهل السنة.",
      keywords: ["أحرف سبعة", "سبعة أحرف", "قراءات", "عثمان", "عمر وهشام"],
    });
  }, []);

  return (
    <SectionTemplatePage
      route="/quran-hub/seven-ahruf"
      title="الأحرف السبعة"
      subtitle="نزول القرآن على سبعة أحرف: معناه، أدلته، والفرق بينه وبين القراءات العشر."
      groupTitle="أبواب الأحرف السبعة"
    >
      <div className="qr-page" dir="rtl" data-quran-seven-ahruf="1">
        <p className="qr-note" role="note">
          المحتوى على منهج أهل السنة والجماعة. كل نقل بمصدره الظاهر تحت كل باب.
        </p>

        <nav className="qr-related" aria-label="روابط ذات صلة">
          <Link href="/quran-hub/qiraat">القراءات العشر</Link>
          <Link href="/quran-hub/tajweed">التجويد</Link>
          <Link href="/mushaf">المصحف</Link>
        </nav>

        {AHRUF_SECTIONS.map((sec) => (
          <section key={sec.id} className="qr-section" id={sec.id}>
            <h2>{sec.title}</h2>
            {sec.body.map((p) => (
              <p key={p.slice(0, 32)}>{p}</p>
            ))}
            <p className="qr-source">
              <strong>المصادر:</strong> {sec.sources.join(" · ")}
            </p>
          </section>
        ))}

        <SectionQuiz
          sectionId="quran"
          title="اختبر معلوماتك في الأحرف السبعة"
          count={4}
        />
      </div>
    </SectionTemplatePage>
  );
}
