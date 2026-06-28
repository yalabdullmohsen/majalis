import { Link } from "wouter";
import { ANNUAL_COURSES_SEED } from "@/lib/annual-courses-seed";

export function HomeAnnualCoursesSection() {
  const courses = ANNUAL_COURSES_SEED.slice(0, 3);

  return (
    <section className="home-v4-courses" aria-labelledby="home-courses-heading">
      <div className="home-container">
        <div className="home-section-head">
          <div>
            <p className="home-eyebrow">برامج علمية</p>
            <h2 id="home-courses-heading">الدورات العلمية</h2>
          </div>
          <Link href="/annual-courses" className="home-section-link">كل الدورات</Link>
        </div>
        <ol className="home-v4-courses__timeline">
          {courses.map((c) => (
            <li key={c.id}>
              <Link href={`/annual-courses/${c.id}`}>
                <span className="home-v4-courses__type">{c.course_type}</span>
                <strong>{c.title}</strong>
                {c.venue_city && <span>{c.venue_city}</span>}
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
