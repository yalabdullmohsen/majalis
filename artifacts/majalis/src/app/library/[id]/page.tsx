import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchLibraryBookByIdForServer } from "../../../lib/supabase/server-data";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const book = await fetchLibraryBookByIdForServer(id);
  if (!book) return { title: "كتاب غير موجود" };

  return {
    title: `${book.title} | المكتبة العلمية`,
    description: book.description || book.title,
    openGraph: {
      title: `${book.title} | المجلس العلمي`,
      description: book.description,
      locale: "ar_AR",
      type: "article",
      url: `https://majlisilm.com/library/${book.id}`,
    },
  };
}

export default async function LibraryBookPage({ params }: Props) {
  const { id } = await params;
  const book = await fetchLibraryBookByIdForServer(id);
  if (!book) notFound();

  return (
    <section className="page-shell narrow" aria-label={book.title}>
      <h1>{book.title}</h1>
      <p>{book.author}</p>
      <p>{book.description}</p>
      {book.external_url && (
        <p>
          <a href={book.external_url} rel="noreferrer">
            قراءة المصدر
          </a>
        </p>
      )}
    </section>
  );
}
