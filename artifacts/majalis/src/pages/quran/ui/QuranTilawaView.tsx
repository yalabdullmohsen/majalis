/**
 * التلاوة والقرّاء — اختيار قارئ وفتح المصحف للاستماع (حفص).
 */
import { useEffect } from "react";
import { Link } from "wouter";
import { applyPageSeo } from "@/lib/seo";
import { useVerifiedReciters } from "@/hooks/useVerifiedReciters";
import { formatArabicNumber } from "@/lib/numerals";
import "@/styles/pages/tilawa.css";

export default function QuranTilawaView() {
  const reciters = useVerifiedReciters();

  useEffect(() => {
    applyPageSeo({
      path: "/quran-hub/tilawa",
      title: "التلاوة والقرّاء — المجلس العلمي",
      description: "اختر قارئًا واستمع عبر مصحف المدينة برواية حفص.",
      keywords: ["تلاوة", "قرّاء", "استماع", "حفص"],
    });
  }, []);

  return (
    <div className="tl-page" dir="rtl" data-quran-tilawa="1">
      <nav className="tl-crumb" aria-label="مسار">
        <Link href="/quran-hub">مركز القرآن الكريم</Link>
        <span aria-hidden="true"> · </span>
        <span>التلاوة والقرّاء</span>
      </nav>
      <header className="tl-head">
        <h1>التلاوة والقرّاء</h1>
        <p>
          قائمة القرّاء المتاحين للاستماع داخل المصحف برواية حفص عن عاصم. لأحكام التجويد انظر{" "}
          <Link href="/quran-hub/tajweed">قسم التجويد</Link>.
        </p>
      </header>
      <ul className="tl-list">
        {reciters.map((r, i) => (
          <li key={r.id}>
            <Link href="/mushaf" className="tl-card">
              <span className="tl-card__n">{formatArabicNumber(i + 1)}</span>
              <span className="tl-card__name">{r.nameAr}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
