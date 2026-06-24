import { useEffect, useState } from "react";
import { Link } from "wouter";
import { PageHeader, Loading } from "@/components/ui-common";
import { getBooks } from "@/lib/platform-api";
import type { Book } from "@/lib/platform-types";
import { FavoriteButton } from "@/components/platform/FavoriteButton";

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBooks().then(setBooks).finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-shell">
      <PageHeader eyebrow="المكتبة" title="الكتب" subtitle="كتب علمية مع غلاف وقراءة وتحميل." />
      {loading && <Loading />}
      <div className="books-grid books-page-grid">
        {books.map((book) => (
          <article key={book.id} className="ui-card book-card">
            <img src={book.cover_url || "/logo-icon.png"} alt="" className="book-cover" loading="lazy" />
            <div>
              <span className="home-tag">{book.category}</span>
              <h3>{book.title}</h3>
              <p>{book.author}</p>
              <p>{book.description}</p>
              <div className="book-card-actions">
                {book.pdf_url && book.pdf_url !== "#" && (
                  <a href={book.pdf_url} target="_blank" rel="noopener noreferrer" className="ui-card-btn">تحميل PDF</a>
                )}
                <FavoriteButton itemType="book" itemId={book.id} />
              </div>
            </div>
          </article>
        ))}
      </div>
      <p className="page-note"><Link href="/library">المكتبة العلمية الكاملة</Link></p>
    </div>
  );
}
