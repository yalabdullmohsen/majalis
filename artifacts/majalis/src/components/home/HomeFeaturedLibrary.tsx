import { BookOpen } from "lucide-react";
import { Link } from "wouter";
import { IslamicHeadingOrnament } from "@/components/islamic/IslamicOrnament";
import { getFeaturedLibraryBooks } from "@/lib/library-service";

export function HomeFeaturedLibrary() {
  const books = getFeaturedLibraryBooks(6);

  return (
    <section className="home-section home-library-section ds-section" aria-labelledby="home-library-heading">
      <div className="ds-section__head home-section-head">
        <div>
          <p className="home-eyebrow">المراجع العلمية</p>
          <h2 id="home-library-heading" className="ds-section__title">
            المكتبة
          </h2>
          <IslamicHeadingOrnament />
        </div>
        <Link href="/library" className="ds-section__link">
          عرض الكل
        </Link>
      </div>
      <div className="home-library-grid">
        {books.map((book) => (
          <Link key={book.id} href={`/library/${book.id}`} className="ui-card home-library-card ui-card--ornate">
            <span className="home-library-icon" aria-hidden="true">
              <BookOpen size={20} strokeWidth={1.75} />
            </span>
            <div>
              <span className="page-tag">{book.category}</span>
              <h3>{book.title}</h3>
              <p>{book.author}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default HomeFeaturedLibrary;
