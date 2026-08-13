/**
 * صفحة /more — فهرس الأقسام (بديل حقيقي عن 404 / التحويل للرئيسية).
 * المصدر: moreSections + services-center-nav.
 */
import { useEffect } from "react";
import { Link } from "wouter";
import { MORE_FEATURED_SECTIONS } from "@/features/more/moreSections";
import { applyPageSeo } from "@/lib/seo";
import { ContentHubLayout } from "@/components/layout/ContentHubLayout";
import "@/styles/components/more-bottom-sheet.css";

export default function MorePage() {
  useEffect(() => {
    applyPageSeo({
      title: "المزيد — المجلس العلمي",
      description: "أبواب العلم والخدمة: سين جيم، القصص، التفسير، السيرة، المكتبة والمزيد.",
      path: "/more",
    });
  }, []);

  return (
    <ContentHubLayout
      title="المزيد"
      subtitle="أبواب العلم والخدمة"
    >
      <ul className="more-page-grid" style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: "0.75rem", gridTemplateColumns: "repeat(auto-fill, minmax(9.5rem, 1fr))" }}>
        {MORE_FEATURED_SECTIONS.map((s) => {
          const Icon = s.icon;
          return (
            <li key={s.id}>
              <Link
                href={s.route}
                className="mj-card mj-card--link"
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", padding: "1rem 0.75rem", textAlign: "center", minHeight: 88 }}
                aria-label={s.title}
              >
                <Icon size={28} aria-hidden="true" />
                <span style={{ fontSize: "0.9rem", fontWeight: 600 }}>{s.title}</span>
                {s.subtitle ? (
                  <span style={{ fontSize: "0.72rem", opacity: 0.75 }}>{s.subtitle}</span>
                ) : null}
              </Link>
            </li>
          );
        })}
        <li>
          <Link href="/library" className="mj-card mj-card--link" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", padding: "1rem", minHeight: 88 }} aria-label="المكتبة">
            <span style={{ fontSize: "0.9rem", fontWeight: 600 }}>المكتبة</span>
          </Link>
        </li>
        <li>
          <Link href="/adhkar" className="mj-card mj-card--link" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", padding: "1rem", minHeight: 88 }} aria-label="الأذكار">
            <span style={{ fontSize: "0.9rem", fontWeight: 600 }}>الأذكار</span>
          </Link>
        </li>
        <li>
          <Link href="/updates" className="mj-card mj-card--link" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", padding: "1rem", minHeight: 88 }} aria-label="التحديثات">
            <span style={{ fontSize: "0.9rem", fontWeight: 600 }}>التحديثات</span>
          </Link>
        </li>
        <li>
          <Link href="/knowledge-graph" className="mj-card mj-card--link" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", padding: "1rem", minHeight: 88 }} aria-label="الرسم المعرفي">
            <span style={{ fontSize: "0.9rem", fontWeight: 600 }}>الرسم المعرفي</span>
          </Link>
        </li>
        <li>
          <Link href="/settings" className="mj-card mj-card--link" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", padding: "1rem", minHeight: 88 }} aria-label="الإعدادات">
            <span style={{ fontSize: "0.9rem", fontWeight: 600 }}>الإعدادات</span>
          </Link>
        </li>
      </ul>
    </ContentHubLayout>
  );
}
