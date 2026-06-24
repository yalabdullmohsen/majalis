import { useEffect, useState } from "react";
import { Link } from "wouter";
import { getSheikhById } from "@/lib/supabase";
import { getBooks, getLessonSeries, getPlatformLessons } from "@/lib/platform-api";
import { Loading, Empty } from "@/components/ui-common";
import { FollowSheikhButton } from "@/components/platform/FavoriteButton";
import { SheikhAvatar } from "@/components/lessons/SheikhAvatar";
import { resolveSheikhImageUrl } from "@/lib/sheikh-image";
import { FavoriteButton } from "@/components/platform/FavoriteButton";

export default function SheikhDetailPage({ params }: { params: { id: string } }) {
  const [sheikh, setSheikh] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [series, setSeries] = useState<any[]>([]);
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getSheikhById(params.id),
      getLessonSeries(),
      getBooks(),
      getPlatformLessons(),
    ]).then(([{ sheikh: s, lessons: l }, allSeries, allBooks, platformLessons]) => {
      setSheikh(s);
      setLessons(l || []);
      const name = s?.name || "";
      setSeries(allSeries.filter((item) => item.sheikh_name?.includes(name.split(" ")[0])));
      setBooks(allBooks.slice(0, 3));
      const extra = platformLessons.filter((pl) => pl.sheikh_name?.includes(name.split(" ")[0]));
      setLessons([...(l || []), ...extra]);
      setLoading(false);
    });
  }, [params.id]);

  if (loading) return <Loading />;
  if (!sheikh) return <Empty text="لم يُعثر على الشيخ." />;

  const socials = [
    { label: "الموقع", url: sheikh.official_website },
    { label: "تويتر", url: sheikh.twitter_url },
    { label: "إنستغرام", url: sheikh.instagram_url },
    { label: "يوتيوب", url: sheikh.youtube_url },
  ].filter((s) => s.url);

  return (
    <div className="page-shell page-shell--narrow">
      <Link href="/sheikhs" className="page-back-link">العودة إلى المشايخ</Link>

      <article className="ui-card sheikh-detail-card">
        <div className="sheikh-detail-head">
          <SheikhAvatar src={resolveSheikhImageUrl(sheikh)} name={sheikh.name} size={100} />
          <div>
            <h1>{sheikh.name}</h1>
            {sheikh.title && <p className="sheikh-title">{sheikh.title}</p>}
            {sheikh.is_verified && <span className="home-tag">معتمد</span>}
          </div>
        </div>

        {sheikh.ijazah && <p><strong>الإجازة:</strong> {sheikh.ijazah}</p>}
        {sheikh.city && <p><strong>المحافظة:</strong> {sheikh.city}</p>}
        {sheikh.bio && <p>{sheikh.bio}</p>}
        {sheikh.biography && (
          <div>
            <h2>السيرة</h2>
            <p>{sheikh.biography}</p>
          </div>
        )}

        {socials.length > 0 && (
          <div className="sheikh-socials">
            <h2>الحسابات الرسمية</h2>
            <div className="sheikh-social-links">
              {socials.map((s) => (
                <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer" className="ui-card-btn ui-card-btn--ghost">
                  {s.label}
                </a>
              ))}
            </div>
          </div>
        )}

        <FollowSheikhButton sheikhId={sheikh.id} />
      </article>

      {lessons.length > 0 && (
        <section className="home-section">
          <h2>الدروس</h2>
          <div className="calendar-lesson-list">
            {lessons.map((l: any) => (
              <article key={l.id} className="ui-card calendar-lesson-row">
                <div>
                  <h3>{l.title}</h3>
                  <p>{[l.mosque || l.mosque_name, l.city || l.governorate, l.schedule || l.day].filter(Boolean).join(" · ")}</p>
                </div>
                <FavoriteButton itemType="lesson" itemId={l.id} />
              </article>
            ))}
          </div>
        </section>
      )}

      {series.length > 0 && (
        <section className="home-section">
          <h2>السلاسل العلمية</h2>
          <div className="series-grid">
            {series.map((s) => (
              <Link key={s.id} href="/series" className="ui-card series-card">
                <h3>{s.title}</h3>
                <p>{s.completed_lessons} من {s.total_lessons}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {books.length > 0 && (
        <section className="home-section">
          <h2>كتب مرتبطة</h2>
          <div className="books-grid">
            {books.map((b) => (
              <article key={b.id} className="ui-card book-card">
                <h3>{b.title}</h3>
                <p>{b.author}</p>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
