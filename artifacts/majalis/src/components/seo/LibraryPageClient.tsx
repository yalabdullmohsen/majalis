import LibraryPage from "@/views/LibraryPage";

export default function LibraryPageClient({
  initialItems,
}: {
  initialItems: any[];
}) {
  return <LibraryPage initialItems={initialItems} />;
}
