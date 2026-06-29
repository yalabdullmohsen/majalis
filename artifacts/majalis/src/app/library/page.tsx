import type { Metadata } from "next";
import { fetchLibraryForServer } from "../../../lib/supabase/server-data";
import LibraryPageClient from "@/components/seo/LibraryPageClient";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const items = await fetchLibraryForServer();
  return {
    title: "المكتبة العلمية",
    description: `مكتبة علمية — ${items.length} كتاب · مقالات · أبحاث في أقسام منفصلة.`,
    openGraph: {
      title: "المكتبة العلمية | المجلس العلمي",
      description: "كتب · مقالات · أبحاث — ثلاث مكتبات مستقلة.",
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
          ثلاث مكتبات مستقلة:{" "}
          <a href="/library/books">الكتب</a> ·{" "}
          <a href="/library/articles">المقالات</a> ·{" "}
          <a href="/research">الأبحاث</a>
        </p>
        <div className="seo-listing-links">
          {items.map((item) => (
            <p key={item.id}>
              <a href={`/library/books/${item.id}`}>
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
