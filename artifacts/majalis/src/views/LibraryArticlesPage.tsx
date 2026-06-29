import LibraryTypeListPage from "@/views/LibraryTypeListPage";

export default function LibraryArticlesPage(props: { initialItems?: any[] }) {
  return <LibraryTypeListPage contentType="article" initialItems={props.initialItems} />;
}
