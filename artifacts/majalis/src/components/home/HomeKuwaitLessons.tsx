import { Link } from "wouter";
import { SheikhAvatar } from "@/components/lessons/SheikhAvatar";
import { KUWAIT_LESSONS } from "@/lib/home-content";

export function HomeKuwaitLessons() {
  return (
    <section className="home-section" aria-labelledby="kuwait-lessons-heading">
      <div className="home-section-head">
        <div>
          <p className="home-eyebrow">الكويت</p>
          <h2 id="kuwait-lessons-heading">دروس الكويت</h2>
          <p>دروس علمية محدّثة في مساجد الكويت — بيانات أولية قابلة للتعديل.</p>
        </div>
        <Link href="/lessons" className="home-section-link">عرض الكل</Link>
      </div>
      <div className="home-kuwait-grid">
        {KUWAIT_LESSONS.map((lesson) => (
          <article key={lesson.id} className="ui-card home-kuwait-card">
            <div className="home-kuwait-card-top">
              <SheikhAvatar src={lesson.sheikhImage} name={lesson.sheikhName} size="responsive" />
              <div>
                <p className="home-kuwait-sheikh">{lesson.sheikhName}</p>
                <h3>{lesson.title}</h3>
              </div>
            </div>
            <dl className="home-kuwait-meta">
              <div><dt>اليوم</dt><dd>{lesson.day}</dd></div>
              <div><dt>الوقت</dt><dd>{lesson.time}</dd></div>
              <div><dt>المسجد</dt><dd>{lesson.mosque}</dd></div>
              <div><dt>المنطقة</dt><dd>{lesson.region}</dd></div>
            </dl>
            {lesson.note && <p className="home-kuwait-note">{lesson.note}</p>}
            <Link href="/announcements" className="ui-card-btn">عرض التفاصيل</Link>
          </article>
        ))}
      </div>
    </section>
  );
}
