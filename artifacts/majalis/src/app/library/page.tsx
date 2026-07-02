import type { Metadata } from "next";
import { fetchLibraryForServer } from "../../../lib/supabase/server-data";
import LibraryPageClient from "@/components/seo/LibraryPageClient";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const items = await fetchLibraryForServer();
  return {
    title: "المكتبة العلمية",
    description: `مكتبة علمية تضم ${items.length} كتابًا أساسيًا — حديث وتفسير وعقيدة وفقه وسيرة.`,
    openGraph: {
      title: "المكتبة العلمية | المجلس العلمي",
      description: "كتب أساسية في الحديث والتفسير والعقيدة والفقه — مرتبة وموثقة.",
      locale: "ar_AR",
      type: "website",
      url: "https://majlisilm.com/library",
    },
  };
}

export default async function LibraryPage() {
  const items = await fetchLibraryForServer();

  return (
    <>
      <section className="page-shell" aria-label="فهرس المكتبة">
        <h1 className="home-section-title">المكتبة العلمية</h1>
        <p className="seo-listing-intro">
          كتب أساسية في الحديث والتفسير والعقيدة والفقه والسيرة — مرتبة وموثقة.
        </p>
        <div className="seo-listing-links">
          {items.map((item) => (
            <p key={item.id}>
              <a href={`/library/${item.id}`}>
                <strong>{item.title}</strong>
              </a>
              {item.author ? ` — ${item.author}` : ""}
              {item.category ? ` (${item.category})` : ""}
            </p>
          ))}
        </div>
      </section>
      <LibraryPageClient initialItems={items} />
    </>
  );
}
