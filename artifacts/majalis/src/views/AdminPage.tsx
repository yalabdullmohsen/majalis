import { Suspense, useEffect, useState } from "react";
import { useLocation } from "wouter";
import "@/styles/admin.css";
import { applyPageSeo } from "@/lib/seo";
import { lazyWithRetry } from "@/lib/lazy-with-retry";
import { Loading } from "@/components/ui-common";
import { AdminShell, type AdminSection } from "@/views/admin/AdminShell";

// كانت جميع أقسام لوحة التحكم (42 قسمًا) تُستورد وتُنفَّذ دفعة واحدة عند
// دخول /admin مهما كان القسم المعروض فعليًا — هذا هو السبب الجذري لـ"تعليق"
// لوحة التحكم بالكامل. حُوِّلت إلى تحميل كسول (نفس نمط lazyWithRetry
// المستخدم في App.tsx) بحيث لا يُحمَّل كود أي قسم إلا عند فتحه فعلاً.
const DashboardSection = lazyWithRetry(
  () => import("@/views/admin/DashboardSection").then((m) => ({ default: m.DashboardSection })),
  "DashboardSection",
);
const LessonsSection = lazyWithRetry(
  () => import("@/views/admin/LessonsSection").then((m) => ({ default: m.LessonsSection })),
  "LessonsSection",
);
const SheikhsSection = lazyWithRetry(
  () => import("@/views/admin/SheikhsSection").then((m) => ({ default: m.SheikhsSection })),
  "SheikhsSection",
);
const LibrarySection = lazyWithRetry(
  () => import("@/views/admin/LibrarySection").then((m) => ({ default: m.LibrarySection })),
  "LibrarySection",
);
const MiraclesSection = lazyWithRetry(
  () => import("@/views/admin/MiraclesSection").then((m) => ({ default: m.MiraclesSection })),
  "MiraclesSection",
);
const AdhkarSection = lazyWithRetry(
  () => import("@/views/admin/AdhkarSection").then((m) => ({ default: m.AdhkarSection })),
  "AdhkarSection",
);
const FawaidSection = lazyWithRetry(
  () => import("@/views/admin/FawaidSection").then((m) => ({ default: m.FawaidSection })),
  "FawaidSection",
);
const QaSection = lazyWithRetry(
  () => import("@/views/admin/QaSection").then((m) => ({ default: m.QaSection })),
  "QaSection",
);
const UsersSection = lazyWithRetry(
  () => import("@/views/admin/UsersSection").then((m) => ({ default: m.UsersSection })),
  "UsersSection",
);
const SettingsSection = lazyWithRetry(
  () => import("@/views/admin/SettingsSection").then((m) => ({ default: m.SettingsSection })),
  "SettingsSection",
);
const AggregatorSection = lazyWithRetry(
  () => import("@/views/admin/AggregatorSection").then((m) => ({ default: m.AggregatorSection })),
  "AggregatorSection",
);
const ReportsSection = lazyWithRetry(
  () => import("@/views/admin/ReportsSection").then((m) => ({ default: m.ReportsSection })),
  "ReportsSection",
);
const ClientErrorLogsSection = lazyWithRetry(
  () => import("@/views/admin/ClientErrorLogsSection").then((m) => ({ default: m.ClientErrorLogsSection })),
  "ClientErrorLogsSection",
);
const FiqhCouncilSection = lazyWithRetry(
  () => import("@/views/admin/FiqhCouncilSection").then((m) => ({ default: m.FiqhCouncilSection })),
  "FiqhCouncilSection",
);
const RulingsSection = lazyWithRetry(
  () => import("@/views/admin/RulingsSection").then((m) => ({ default: m.RulingsSection })),
  "RulingsSection",
);
const AnnualCoursesSection = lazyWithRetry(
  () => import("@/views/admin/AnnualCoursesSection").then((m) => ({ default: m.AnnualCoursesSection })),
  "AnnualCoursesSection",
);
const DawahSection = lazyWithRetry(
  () => import("@/views/admin/DawahSection").then((m) => ({ default: m.DawahSection })),
  "DawahSection",
);
const LearningPathsSection = lazyWithRetry(
  () => import("@/views/admin/LearningPathsSection").then((m) => ({ default: m.LearningPathsSection })),
  "LearningPathsSection",
);
const CategoriesSection = lazyWithRetry(
  () => import("@/views/admin/CategoriesSection").then((m) => ({ default: m.CategoriesSection })),
  "CategoriesSection",
);
const UpdatesSection = lazyWithRetry(
  () => import("@/views/admin/UpdatesSection").then((m) => ({ default: m.UpdatesSection })),
  "UpdatesSection",
);
const KnowledgeEngineSection = lazyWithRetry(
  () => import("@/views/admin/KnowledgeEngineSection").then((m) => ({ default: m.KnowledgeEngineSection })),
  "KnowledgeEngineSection",
);
const ScholarlyVerificationSection = lazyWithRetry(
  () =>
    import("@/views/admin/ScholarlyVerificationSection").then((m) => ({
      default: m.ScholarlyVerificationSection,
    })),
  "ScholarlyVerificationSection",
);
const VerifiedKnowledgeSection = lazyWithRetry(
  () => import("@/views/admin/VerifiedKnowledgeSection").then((m) => ({ default: m.VerifiedKnowledgeSection })),
  "VerifiedKnowledgeSection",
);
const KnowledgeReasoningSection = lazyWithRetry(
  () => import("@/views/admin/KnowledgeReasoningSection").then((m) => ({ default: m.KnowledgeReasoningSection })),
  "KnowledgeReasoningSection",
);
const SearchAnalyticsSection = lazyWithRetry(
  () => import("@/views/admin/SearchAnalyticsSection").then((m) => ({ default: m.SearchAnalyticsSection })),
  "SearchAnalyticsSection",
);
const AutonomousAiSection = lazyWithRetry(
  () => import("@/views/admin/AutonomousAiSection").then((m) => ({ default: m.AutonomousAiSection })),
  "AutonomousAiSection",
);
const GlobalReferenceSection = lazyWithRetry(
  () => import("@/views/admin/GlobalReferenceSection").then((m) => ({ default: m.GlobalReferenceSection })),
  "GlobalReferenceSection",
);
const IslamicIntelligenceSection = lazyWithRetry(
  () => import("@/views/admin/IslamicIntelligenceSection").then((m) => ({ default: m.IslamicIntelligenceSection })),
  "IslamicIntelligenceSection",
);
const OpenPlatformSection = lazyWithRetry(
  () => import("@/views/admin/OpenPlatformSection").then((m) => ({ default: m.OpenPlatformSection })),
  "OpenPlatformSection",
);
const GovernanceSection = lazyWithRetry(
  () => import("@/views/admin/GovernanceSection").then((m) => ({ default: m.GovernanceSection })),
  "GovernanceSection",
);
const SmartCmsSection = lazyWithRetry(
  () => import("@/views/admin/SmartCmsSection").then((m) => ({ default: m.SmartCmsSection })),
  "SmartCmsSection",
);
const SubmissionsSection = lazyWithRetry(
  () => import("@/views/admin/SubmissionsSection").then((m) => ({ default: m.SubmissionsSection })),
  "SubmissionsSection",
);
const QuizSection = lazyWithRetry(
  () => import("@/views/admin/QuizSection").then((m) => ({ default: m.QuizSection })),
  "QuizSection",
);
const RelationshipsSection = lazyWithRetry(
  () => import("@/views/admin/RelationshipsSection").then((m) => ({ default: m.RelationshipsSection })),
  "RelationshipsSection",
);
const TelegramSection = lazyWithRetry(
  () => import("@/views/admin/TelegramSection").then((m) => ({ default: m.TelegramSection })),
  "TelegramSection",
);
const UniversitiesSection = lazyWithRetry(
  () => import("@/views/admin/UniversitiesAdminPage").then((m) => ({ default: m.UniversitiesSection })),
  "UniversitiesSection",
);
const ProphetStoriesSection = lazyWithRetry(
  () => import("@/views/admin/ProphetStoriesSection").then((m) => ({ default: m.ProphetStoriesSection })),
  "ProphetStoriesSection",
);
const IslamicStoriesSection = lazyWithRetry(
  () => import("@/views/admin/IslamicStoriesSection").then((m) => ({ default: m.IslamicStoriesSection })),
  "IslamicStoriesSection",
);
const ImageImportSection = lazyWithRetry(
  () => import("@/views/admin/ImageImportSection").then((m) => ({ default: m.ImageImportSection })),
  "ImageImportSection",
);
const WeekDayFactsSection = lazyWithRetry(
  () => import("@/views/admin/WeekDayFactsSection").then((m) => ({ default: m.WeekDayFactsSection })),
  "WeekDayFactsSection",
);
const ArbaeenLoveSection = lazyWithRetry(
  () => import("@/views/admin/ArbaeenLoveSection").then((m) => ({ default: m.ArbaeenLoveSection })),
  "ArbaeenLoveSection",
);

export default function AdminPage() {
  const [location, navigate] = useLocation();

  useEffect(() => {
    applyPageSeo({
      path: "/admin",
      title: "لوحة الإدارة | المجلس العلمي",
      description: "لوحة إدارة محتوى منصة المجلس العلمي — للمديرين المعتمدين فقط.",
      robots: "noindex, nofollow",
    });
  }, []);

  const initialSection = (() => {
    if (typeof window === "undefined") return "dashboard" as AdminSection;
    const params = new URLSearchParams(window.location.search);
    const section = params.get("section");
    return (section as AdminSection) || "dashboard";
  })();
  const [section, setSection] = useState<AdminSection>(initialSection);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const next = params.get("section") as AdminSection | null;
    if (next) setSection(next);
  }, [location]);

  // كان تبديل القسم يحدّث حالة React الداخلية فقط (setSection) بلا أي
  // تسجيل في سجل المتصفح — فيرى المستخدم "لا يوجد خيار تراجع واضح"، وضغط
  // زر الرجوع (أو GlobalBackButton) يقفز مباشرة لما قبل دخول لوحة التحكم
  // بالكامل (لا يوجد سوى إدخال سجلّ واحد لكل زيارة /admin). أصبح تبديل
  // القسم يدفع إدخالًا حقيقيًا في السجل (?section=...)، فيعمل الرجوع خطوة
  // بخطوة عبر الأقسام كأي تصفّح ويب طبيعي.
  const handleSectionChange = (next: AdminSection) => {
    setSection(next);
    const params = new URLSearchParams(window.location.search);
    if (params.get("section") === next) return; // لا تكرار لنفس القسم في السجل
    params.set("section", next);
    navigate(`/admin?${params.toString()}`);
  };

  return (
    <AdminShell section={section} onSectionChange={handleSectionChange}>
      <Suspense fallback={<Loading />}>
      {section === "image-import" && <ImageImportSection />}
      {section === "telegram" && <TelegramSection />}
      {section === "universities" && <UniversitiesSection />}
      {section === "prophet-stories" && <ProphetStoriesSection />}
      {section === "islamic-stories" && <IslamicStoriesSection />}
      {section === "submissions" && <SubmissionsSection />}
      {section === "dashboard" && <DashboardSection />}
      {section === "aggregator" && <AggregatorSection />}
      {section === "knowledge-engine" && <KnowledgeEngineSection />}
      {section === "scholarly-verification" && <ScholarlyVerificationSection />}
      {section === "verified-knowledge" && <VerifiedKnowledgeSection />}
      {section === "knowledge-reasoning" && <KnowledgeReasoningSection />}
      {section === "search-analytics" && <SearchAnalyticsSection />}
      {section === "autonomous-ai" && <AutonomousAiSection />}
      {section === "global-reference" && <GlobalReferenceSection />}
      {section === "islamic-intelligence" && <IslamicIntelligenceSection />}
      {section === "open-platform" && <OpenPlatformSection />}
      {section === "smart-cms" && <SmartCmsSection />}
      {section === "governance" && <GovernanceSection />}
      {section === "knowledge-graph" && <RelationshipsSection />}
      {section === "quiz" && <QuizSection />}
      {section === "lessons" && <LessonsSection />}
      {section === "sheikhs" && <SheikhsSection />}
      {section === "library" && <LibrarySection />}
      {section === "miracles" && <MiraclesSection />}
      {section === "adhkar" && <AdhkarSection />}
      {section === "fawaid" && <FawaidSection />}
      {section === "qa" && <QaSection />}
      {section === "users" && <UsersSection />}
      {section === "settings" && <SettingsSection />}
      {section === "reports" && <ReportsSection />}
      {section === "error-logs" && <ClientErrorLogsSection />}
      {section === "fiqh-council" && <FiqhCouncilSection />}
      {section === "rulings" && <RulingsSection />}
      {section === "annual-courses" && <AnnualCoursesSection />}
      {section === "dawah" && <DawahSection />}
      {section === "learning-paths" && <LearningPathsSection />}
      {section === "week-day-facts" && <WeekDayFactsSection />}
      {section === "arbaeen-love" && <ArbaeenLoveSection />}
      {section === "categories" && <CategoriesSection />}
      {section === "updates" && <UpdatesSection />}
      </Suspense>
    </AdminShell>
  );
}
