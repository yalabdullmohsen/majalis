import type { Metadata } from "next";
import { fetchFawaidForServer } from "../../../lib/supabase/server-data";
import FawaidPageClient from "@/components/seo/FawaidPageClient";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const fawaid = await fetchFawaidForServer();
  return {
    title: "الفوائد الدينية",
    description: `${fawaid.length} فائدة دينية مختصرة ومراجعة تساعد طالب العلم على الانتفاع الموثق.`,
    openGraph: {
      title: "الفوائد الدينية | المجلس العلمي",
      description: "فوائد دينية مختارة ومراجعة مع المصادر.",
      locale: "ar_AR",
      type: "website",
      url: "https://majlisilm.com/fawaid",
    },
  };
}

export default async function FawaidPage() {
  const fawaid = await fetchFawaidForServer();

  return (
    <>
      <section className="page-shell" aria-label="فهرس الفوائد">
        <h1 className="home-section-title">الفوائد الدينية</h1>
        <p className="seo-listing-intro">
          {fawaid.length.toLocaleString("ar-EG")} فائدة مختصرة وموثقة.
        </p>
        <div className="seo-listing-links">
          {fawaid.slice(0, 10).map((item) => (
            <p key={item.id}>{item.text?.slice(0, 180)}</p>
          ))}
        </div>
      </section>
      <FawaidPageClient initialFawaid={fawaid} />
    </>
  );
}
