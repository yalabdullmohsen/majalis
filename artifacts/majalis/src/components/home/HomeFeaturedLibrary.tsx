import { BookOpen } from "lucide-react";
import { Link } from "wouter";
import { getFeaturedLibraryBooks } from "@/lib/library-service";

export function HomeFeaturedLibrary() {
  const books = getFeaturedLibraryBooks(6);

  return (
    <section className="home-section home-library-section ds-section" aria-labelledby="home-library-heading">
      <div className="ds-section__head">
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18">
            <polygon points="9,1 11.5,6.5 18,6.5 13,10.5 15,17 9,13 3,17 5,10.5 0.5,6.5 6.5,6.5" fill="none" stroke="#173D35" strokeWidth="1.2"/>
            <circle cx="9" cy="9" r="2.8" fill="#173D35" opacity="0.3"/>
          </svg>
          <div>
            <p className="home-eyebrow">الكتب الأساسية</p>
            <h2 id="home-library-heading" className="ds-section__title">
              المكتبة العلمية
            </h2>
          </div>
        </div>
        <Link href="/library" className="ds-section__link">
          عرض الكل
        </Link>
      </div>
      <div className="home-library-grid">
        {books.map((book) => (
          <Link key={book.id} href={`/library/${book.id}`} className="ui-card home-library-card">
            <span className="home-library-icon" aria-hidden>
              <BookOpen size={20} strokeWidth={1.5} />
            </span>
            <div>
              <span className="page-tag">{book.category}</span>
              <h3 className="home-library-card__title">{book.title}</h3>
              <p>{book.author}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default HomeFeaturedLibrary;
