import LibraryTypeListPage from "@/views/LibraryTypeListPage";

export default function LibraryBooksPage(props: { initialItems?: any[] }) {
  return <LibraryTypeListPage contentType="book" initialItems={props.initialItems} />;
}
