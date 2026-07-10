import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import "@/styles/admin.css";
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
import { FiqhCouncilSection } from "@/views/admin/FiqhCouncilSection";
import { FatwaAdminSection } from "@/views/admin/FatwaAdminSection";
import { RulingsSection } from "@/views/admin/RulingsSection";
import { AnnualCoursesSection } from "@/views/admin/AnnualCoursesSection";
import { UpdatesSection } from "@/views/admin/UpdatesSection";
import { KnowledgeEngineSection } from "@/views/admin/KnowledgeEngineSection";
import { ScholarlyVerificationSection } from "@/views/admin/ScholarlyVerificationSection";
import { VerifiedKnowledgeSection } from "@/views/admin/VerifiedKnowledgeSection";
import { KnowledgeReasoningSection } from "@/views/admin/KnowledgeReasoningSection";
import { SearchAnalyticsSection } from "@/views/admin/SearchAnalyticsSection";
import { DigitalLearningSection } from "@/views/admin/DigitalLearningSection";
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

export default function AdminPage() {
  const [location] = useLocation();

  useEffect(() => {
    document.title = "لوحة الإدارة | المجلس العلمي";
    const meta = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    if (meta) meta.content = "noindex, nofollow";
    else {
      const m = document.createElement("meta");
      m.name = "robots"; m.content = "noindex, nofollow";
      document.head.appendChild(m);
    }
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
      {section === "digital-learning" && <DigitalLearningSection />}
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
      {section === "fiqh-council" && <FiqhCouncilSection />}
      {section === "fatwa" && <FatwaAdminSection />}
      {section === "rulings" && <RulingsSection />}
      {section === "annual-courses" && <AnnualCoursesSection />}
      {section === "updates" && <UpdatesSection />}
    </AdminShell>
  );
}
