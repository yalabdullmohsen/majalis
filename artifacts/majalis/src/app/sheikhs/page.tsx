import type { Metadata } from "next";
import { fetchSheikhsForServer } from "../../../lib/supabase/server-data";
import SheikhsPageClient from "@/components/seo/SheikhsPageClient";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const sheikhs = await fetchSheikhsForServer();
  return {
    title: "المشايخ والدعاة",
    description: `${sheikhs.length} شيخ وعالم معتمد — سير وإجازات وتخصصات ودروس مرتبطة.`,
    openGraph: {
      title: "المشايخ والدعاة | المجلس العلمي",
      description: "تعرّف على المشايخ والدعاة المعتمدين ودروسهم.",
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
