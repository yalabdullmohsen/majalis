import QaPage from "@/views/QaPage";

export default function QaPageClient({
  initialCategories,
  initialQuestions,
}: {
  initialCategories: any[];
  initialQuestions: any[];
}) {
  return (
    <QaPage
      initialCategories={initialCategories}
      initialQuestions={initialQuestions}
    />
  );
}
