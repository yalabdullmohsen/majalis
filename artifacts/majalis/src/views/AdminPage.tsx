import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import "@/styles/admin.css";
import { applyPageSeo } from "@/lib/seo";
import { AdminShell, type AdminSection } from "@/views/admin/AdminShell";
import { DashboardSection } from "@/views/admin/DashboardSection";
import { LessonsSection } from "@/views/admin/LessonsSection";
import { SheikhsSection } from "@/views/admin/SheikhsSection";
import { LibrarySection } from "@/views/admin/LibrarySection";
import { MiraclesSection } from "@/views/admin/MiraclesSection";
import { AdhkarSection } from "@/views/admin/AdhkarSection";
import { FawaidSection } from "@/views/admin/FawaidSection";
import { QaSection } from "@/views/admin/QaSection";
import { UsersSection } from "@/views/admin/UsersSection";
import { SettingsSection } from "@/views/admin/SettingsSection";
import { AggregatorSection } from "@/views/admin/AggregatorSection";
import { ReportsSection } from "@/views/admin/ReportsSection";
import { ClientErrorLogsSection } from "@/views/admin/ClientErrorLogsSection";
import { FiqhCouncilSection } from "@/views/admin/FiqhCouncilSection";
import { RulingsSection } from "@/views/admin/RulingsSection";
import { AnnualCoursesSection } from "@/views/admin/AnnualCoursesSection";
import { DawahSection } from "@/views/admin/DawahSection";
import { LearningPathsSection } from "@/views/admin/LearningPathsSection";
import { CategoriesSection } from "@/views/admin/CategoriesSection";
import { UpdatesSection } from "@/views/admin/UpdatesSection";
import { KnowledgeEngineSection } from "@/views/admin/KnowledgeEngineSection";
import { ScholarlyVerificationSection } from "@/views/admin/ScholarlyVerificationSection";
import { VerifiedKnowledgeSection } from "@/views/admin/VerifiedKnowledgeSection";
import { KnowledgeReasoningSection } from "@/views/admin/KnowledgeReasoningSection";
import { SearchAnalyticsSection } from "@/views/admin/SearchAnalyticsSection";
import { AutonomousAiSection } from "@/views/admin/AutonomousAiSection";
import { GlobalReferenceSection } from "@/views/admin/GlobalReferenceSection";
import { IslamicIntelligenceSection } from "@/views/admin/IslamicIntelligenceSection";
import { OpenPlatformSection } from "@/views/admin/OpenPlatformSection";
import { GovernanceSection } from "@/views/admin/GovernanceSection";
import { SmartCmsSection } from "@/views/admin/SmartCmsSection";
import { SubmissionsSection } from "@/views/admin/SubmissionsSection";
import { QuizSection } from "@/views/admin/QuizSection";
import { RelationshipsSection } from "@/views/admin/RelationshipsSection";
import { TelegramSection } from "@/views/admin/TelegramSection";
import { UniversitiesSection } from "@/views/admin/UniversitiesAdminPage";
import { ProphetStoriesSection } from "@/views/admin/ProphetStoriesSection";
import { IslamicStoriesSection } from "@/views/admin/IslamicStoriesSection";
import { ImageImportSection } from "@/views/admin/ImageImportSection";
import { WeekDayFactsSection } from "@/views/admin/WeekDayFactsSection";
import { ArbaeenLoveSection } from "@/views/admin/ArbaeenLoveSection";

export default function AdminPage() {
  const [location] = useLocation();

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

  return (
    <AdminShell section={section} onSectionChange={setSection}>
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
    </AdminShell>
  );
}
