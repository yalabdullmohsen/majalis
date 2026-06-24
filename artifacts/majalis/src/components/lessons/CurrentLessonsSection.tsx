import { useMemo, useState } from "react";
import { Link } from "wouter";
import { lessonAds, sortLessonAds, type LessonAd } from "@/lib/lesson-ads";
import { LessonAdCard } from "./LessonAdCard";
import { LessonAdModal } from "./LessonAdModal";

export function CurrentLessonsSection() {
  const [activeItem, setActiveItem] = useState<LessonAd | null>(null);

  const sortedItems = useMemo(() => sortLessonAds(lessonAds), []);

  return (
    <section className="la-home-section lad-section" aria-labelledby="lesson-announcements-heading">
      <div className="la-section-bar">
        <div>
          <p className="la-section-bar__eyebrow">الدروس الحالية</p>
          <h2 id="lesson-announcements-heading">إعلانات الالمجلس العلميية والبرامج التعليمية</h2>
          <p className="la-section-bar__sub">
            عرض موحّد ونظيف للدروس: صورة الشيخ، الموعد، المكان، وروابط مباشرة للخريطة والبث
            والمادة العلمية — بدون الاعتماد على QR داخل الصورة.
          </p>
        </div>
        <Link href="/announcements" className="la-section-bar__link">
          عرض الكل
        </Link>
      </div>

      <div className="home-container lad-home-grid">
        {sortedItems.map((item) => (
          <LessonAdCard key={item.id} item={item} compact onOpen={setActiveItem} />
        ))}
      </div>

      <div className="home-container la-home-cta-row">
        <Link href="/announcements" className="la-home-cta">
          جميع إعلانات الدروس
        </Link>
        <Link href="/courses" className="la-home-cta la-home-cta--outline">
          الدورات الكاملة
        </Link>
      </div>

      <LessonAdModal item={activeItem} onClose={() => setActiveItem(null)} />
    </section>
  );
}
