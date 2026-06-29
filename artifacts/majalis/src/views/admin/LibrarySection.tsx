import { Link } from "wouter";
import { C } from "@/lib/theme";

/** Legacy admin library hub — links to split sections */
export function LibrarySection() {
  return (
    <div>
      <h2 style={{ margin: "0 0 1rem", color: C.emeraldDeep }}>المكتبة — إدارة منفصلة</h2>
      <p style={{ marginBottom: "1.5rem", color: C.inkSoft }}>
        تم فصل إدارة المحتوى إلى ثلاثة أقسام مستقلة. اختر القسم المناسب:
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxWidth: "24rem" }}>
        <Link href="/admin/library-books" style={{ padding: "1rem", borderRadius: "0.5rem", background: C.parchmentDeep, textDecoration: "none", color: C.emeraldDeep, fontWeight: 600 }}>
          📚 إدارة الكتب
        </Link>
        <Link href="/admin/library-articles" style={{ padding: "1rem", borderRadius: "0.5rem", background: C.parchmentDeep, textDecoration: "none", color: C.emeraldDeep, fontWeight: 600 }}>
          📝 إدارة المقالات
        </Link>
        <Link href="/admin/scientific-research" style={{ padding: "1rem", borderRadius: "0.5rem", background: C.parchmentDeep, textDecoration: "none", color: C.emeraldDeep, fontWeight: 600 }}>
          🎓 إدارة الأبحاث
        </Link>
      </div>
    </div>
  );
}
