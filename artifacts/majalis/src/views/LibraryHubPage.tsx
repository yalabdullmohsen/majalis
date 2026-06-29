import { Link } from "wouter";
import { ContentHubLayout } from "@/components/layout/ContentHubLayout";
import { LibraryHubCards } from "@/components/library/LibraryHubCards";
import "@/styles/library-hub.css";

export default function LibraryHubPage() {
  return (
    <ContentHubLayout
      className="content-hub library-hub-page"
      eyebrow="الأرشيف العلمي"
      title="المكتبة العلمية"
      subtitle="ثلاث مكتبات مستقلة — كتب · مقالات · أبحاث — بدون خلط بين أنواع المحتوى."
      stats={[
        { label: "أقسام", value: 3 },
      ]}
    >
      <LibraryHubCards />
      <nav className="library-hub-links" aria-label="روابط سريعة">
        <Link href="/library/books">📚 الكتب</Link>
        <Link href="/library/articles">📝 المقالات</Link>
        <Link href="/research">🎓 الأبحاث</Link>
      </nav>
    </ContentHubLayout>
  );
}
