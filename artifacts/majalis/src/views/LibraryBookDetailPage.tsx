import { useParams } from "wouter";
import LibraryItemDetailPage from "@/views/LibraryItemDetailPage";

export default function LibraryBookDetailPage() {
  const params = useParams<{ id: string }>();
  return <LibraryItemDetailPage params={{ id: params.id || "" }} contentType="book" />;
}
