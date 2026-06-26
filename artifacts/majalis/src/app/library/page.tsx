import type { Metadata } from "next";
import { fetchLibraryForServer } from "../../../lib/supabase/server-data";
import LibraryPageClient from "@/components/seo/LibraryPageClient";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const items = await fetchLibraryForServer();
  return {
    title: "المكتبة العلمية",
    description: `مكتبة علمية تضم ${items.length} مادة — كتب ومتون وتفريغات وملخصات ومواد صوتية ومرئية لطالب العلم.`,
    openGraph: {
      title: "المكتبة العلمية | المجلس العلمي",
      description: "كتب ومتون وتفريغات وملخصات ومواد مسموعة ومرئية لطالب العلم.",
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
          {items.length.toLocaleString("ar-EG")} مادة علمية معتمدة — كتب، متون، تفريغات، وملخصات.
        </p>
        <div className="seo-listing-links">
          {items.slice(0, 12).map((item) => (
            <p key={item.id}>
              <strong>{item.title}</strong>
              {item.type ? ` (${item.type})` : ""}
              {item.description ? ` — ${item.description.slice(0, 120)}` : ""}
            </p>
          ))}
        </div>
      </section>
      <LibraryPageClient initialItems={items} />
    </>
  );
}
