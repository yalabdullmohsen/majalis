import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  fetchSheikhByIdForServer,
} from "../../../../lib/supabase/server-data";
import SheikhDetailClient from "@/components/seo/SheikhDetailClient";
import { personJsonLd, breadcrumbJsonLd } from "@/lib/seo-structured-data";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const { sheikh } = await fetchSheikhByIdForServer(id);

  if (!sheikh) {
    return {
      title: "شيخ غير موجود",
      robots: { index: false, follow: true },
    };
  }

  const description = [
    sheikh.ijazah,
    sheikh.city,
    Array.isArray(sheikh.specialties) ? sheikh.specialties.join("، ") : "",
  ]
    .filter(Boolean)
    .join(" — ")
    .slice(0, 160);

  return {
    title: sheikh.name,
    description: description || `${sheikh.name} — ملف الشيخ على المجلس العلمي`,
    openGraph: {
      title: `${sheikh.name} | المجلس العلمي`,
      description,
      locale: "ar_AR",
      type: "profile",
      url: `https://majlisilm.com/sheikhs/${sheikh.id}`,
      images: sheikh.photo_url
        ? [{ url: sheikh.photo_url, alt: sheikh.name }]
        : [{ url: "/logo.png", alt: sheikh.name }],
    },
  };
}

export default async function SheikhDetailPage({ params }: PageProps) {
  const { id } = await params;
  const { sheikh, lessons } = await fetchSheikhByIdForServer(id);

  if (!sheikh) {
    notFound();
  }

  const jsonLd = [
    breadcrumbJsonLd([
      { name: "الرئيسية", path: "/" },
      { name: "المشايخ", path: "/sheikhs" },
      { name: sheikh.name, path: `/sheikhs/${sheikh.id}` },
    ]),
    personJsonLd({
      name: sheikh.name,
      description: sheikh.bio || undefined,
      url: `/sheikhs/${sheikh.id}`,
      image: sheikh.photo_url || undefined,
      jobTitle: sheikh.ijazah || "عالم",
      knowsAbout: Array.isArray(sheikh.specialties) ? sheikh.specialties : undefined,
    }),
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SheikhDetailClient sheikh={sheikh} lessons={lessons} />
    </>
  );
}
