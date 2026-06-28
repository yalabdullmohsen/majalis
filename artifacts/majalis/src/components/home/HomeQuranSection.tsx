import { Link } from "wouter";
import { BookOpen } from "lucide-react";

export function HomeQuranSection() {
  return (
    <section className="home-section" aria-labelledby="home-quran-heading">
      <div className="home-section-head">
        <div>
          <p className="home-eyebrow">الكتاب</p>
          <h2 id="home-quran-heading">القرآن الكريم</h2>
          <p>مصحف، تلاوة، تفسير، وقصص السور.</p>
        </div>
        <Link href="/quran" className="home-section-link">فتح المصحف</Link>
      </div>
      <div className="home-hub-grid">
        <Link href="/quran" className="home-hub-card ui-card">
          <BookOpen size={20} aria-hidden="true" />
          <strong>المصحف</strong>
          <span>قراءة وتصفّح</span>
        </Link>
        <Link href="/quran/tajweed" className="home-hub-card ui-card">
          <strong>التجويد</strong>
          <span>أحكام التلاوة</span>
        </Link>
        <Link href="/quran/surah-stories" className="home-hub-card ui-card">
          <strong>قصص السور</strong>
          <span>معاني وعبر</span>
        </Link>
      </div>
    </section>
  );
}

export default HomeQuranSection;
