import { Link } from "wouter";
import { getFeaturedLibraryBooks } from "@/lib/library-service";

export function HomeFeaturedLibrary() {
  const books = getFeaturedLibraryBooks(6);

  return (
    <section className="home-section home-library-section ds-section" aria-labelledby="home-library-heading">
      <div className="ds-section__head">
        <div>
          <p className="home-eyebrow">الكتب الأساسية</p>
          <h2 id="home-library-heading" className="ds-section__title">
            المكتبة العلمية
          </h2>
        </div>
        <Link href="/library/books" className="ds-section__link">
          عرض الكل
        </Link>
      </div>
      <div className="home-library-grid">
        {books.map((book) => (
          <Link key={book.id} href={`/library/books/${book.id}`} className="ui-card home-library-card">
            <span className="home-library-icon" aria-hidden>
              📖
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
