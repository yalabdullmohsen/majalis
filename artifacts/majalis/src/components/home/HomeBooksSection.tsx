import { useEffect, useState } from "react";
import { Link } from "wouter";
import { getBooks } from "@/lib/platform-api";
import type { Book } from "@/lib/platform-types";

export function HomeBooksSection() {
  const [books, setBooks] = useState<Book[]>([]);

  useEffect(() => {
    getBooks().then((items) => setBooks(items.slice(0, 4)));
  }, []);

  return (
    <section className="home-section" aria-labelledby="books-heading">
      <div className="home-section-head">
        <div>
          <p className="home-eyebrow">المكتبة</p>
          <h2 id="books-heading">الكتب</h2>
        </div>
        <Link href="/books" className="home-section-link">عرض الكل</Link>
      </div>
      <div className="books-grid">
        {books.map((book) => (
          <article key={book.id} className="ui-card book-card">
            <img src={book.cover_url || "/logo-icon.png"} alt="" className="book-cover" loading="lazy" />
            <div>
              <span className="home-tag">{book.category}</span>
              <h3>{book.title}</h3>
              <p>{book.author}</p>
              <div className="book-card-actions">
                {book.pdf_url && book.pdf_url !== "#" && (
                  <a href={book.pdf_url} target="_blank" rel="noopener noreferrer" className="ui-card-btn">تحميل</a>
                )}
                <Link href="/books" className="ui-card-btn ui-card-btn--ghost">قراءة</Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
