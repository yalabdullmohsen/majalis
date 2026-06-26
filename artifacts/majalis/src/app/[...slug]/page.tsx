import { notFound } from "next/navigation";
import CatchAllClient from "./CatchAllClient";

export const dynamic = "force-dynamic";

type CatchAllPageProps = {
  params: Promise<{ slug: string[] }>;
};

export default async function CatchAllPage({ params }: CatchAllPageProps) {
  const { slug } = await params;

  // Root catch-all must not swallow /api/* — those are handled by Vercel serverless (vercel.json rewrites).
  if (slug[0] === "api") {
    notFound();
  }

  return <CatchAllClient />;
}
