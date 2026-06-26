import type { Metadata } from "next";
import { fetchMiraclesForServer } from "../../../lib/supabase/server-data";
import MiraclesPageClient from "@/components/seo/MiraclesPageClient";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const items = await fetchMiraclesForServer();
  return {
    title: "الإعجاز العلمي",
    description: `${items.length} مقالة موثقة في الإعجاز العلمي ودلائل القدرة في القرآن والسنة.`,
    openGraph: {
      title: "الإعجاز العلمي | المجلس العلمي",
      description: "مقالات موثقة في الإعجاز العلمي ودلائل القدرة.",
      locale: "ar_AR",
      type: "website",
      url: "https://majlisilm.com/miracles",
    },
  };
}

export default async function MiraclesPage() {
  const items = await fetchMiraclesForServer();

  return (
    <>
      <section className="page-shell" aria-label="فهرس الإعجاز العلمي">
        <h1 className="home-section-title">الإعجاز العلمي</h1>
        <p className="seo-listing-intro">
          {items.length.toLocaleString("ar-EG")} مقالة موثقة.
        </p>
        <div className="seo-listing-links">
          {items.slice(0, 10).map((item) => (
            <p key={item.id}>
              <strong>{item.title}</strong>
              {item.body ? ` — ${String(item.body).slice(0, 140)}` : ""}
            </p>
          ))}
        </div>
      </section>
      <MiraclesPageClient initialItems={items} />
    </>
  );
}
