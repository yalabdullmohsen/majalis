"use client";

import LibraryBooksPage from "@/views/LibraryBooksPage";

export default function LibraryPageClient({
  initialItems,
}: {
  initialItems: any[];
}) {
  return <LibraryBooksPage initialItems={initialItems} />;
}
