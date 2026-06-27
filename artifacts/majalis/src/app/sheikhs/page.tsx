import type { Metadata } from "next";
import { fetchSheikhsForServer } from "../../../lib/supabase/server-data";
import SheikhsPageClient from "@/components/seo/SheikhsPageClient";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const sheikhs = await fetchSheikhsForServer();
  return {
    title: "المشايخ",
    description: `${sheikhs.length} شيخ معتمد — سير وإجازات وتخصصات ودروس مرتبطة.`,
    openGraph: {
      title: "المشايخ | المجلس العلمي",
      description: "تعرّف على المشايخ المعتمدين ودروسهم.",
      locale: "ar_AR",
      type: "website",
      url: "https://majlisilm.com/sheikhs",
    },
  };
}

export default async function SheikhsPage() {
  const sheikhs = await fetchSheikhsForServer();
  return <SheikhsPageClient sheikhs={sheikhs} />;
}
