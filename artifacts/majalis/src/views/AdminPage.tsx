import { Suspense, lazy, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { AdminShell, type AdminSection } from "@/views/admin/AdminShell";

const DashboardSection          = lazy(() => import("@/views/admin/DashboardSection").then(m => ({ default: m.DashboardSection })));
const LessonsSection            = lazy(() => import("@/views/admin/LessonsSection").then(m => ({ default: m.LessonsSection })));
const SheikhsSection            = lazy(() => import("@/views/admin/SheikhsSection").then(m => ({ default: m.SheikhsSection })));
const LibrarySection            = lazy(() => import("@/views/admin/LibrarySection").then(m => ({ default: m.LibrarySection })));
const MiraclesSection           = lazy(() => import("@/views/admin/MiraclesSection").then(m => ({ default: m.MiraclesSection })));
const AdhkarSection             = lazy(() => import("@/views/admin/AdhkarSection").then(m => ({ default: m.AdhkarSection })));
const FawaidSection             = lazy(() => import("@/views/admin/FawaidSection").then(m => ({ default: m.FawaidSection })));
const QaSection                 = lazy(() => import("@/views/admin/QaSection").then(m => ({ default: m.QaSection })));
const UsersSection              = lazy(() => import("@/views/admin/UsersSection").then(m => ({ default: m.UsersSection })));
const SettingsSection           = lazy(() => import("@/views/admin/SettingsSection").then(m => ({ default: m.SettingsSection })));
const AggregatorSection         = lazy(() => import("@/views/admin/AggregatorSection").then(m => ({ default: m.AggregatorSection })));
const ReportsSection            = lazy(() => import("@/views/admin/ReportsSection").then(m => ({ default: m.ReportsSection })));
const FiqhCouncilSection        = lazy(() => import("@/views/admin/FiqhCouncilSection").then(m => ({ default: m.FiqhCouncilSection })));
const FatwaAdminSection         = lazy(() => import("@/views/admin/FatwaAdminSection").then(m => ({ default: m.FatwaAdminSection })));
const RulingsSection            = lazy(() => import("@/views/admin/RulingsSection").then(m => ({ default: m.RulingsSection })));
const AnnualCoursesSection      = lazy(() => import("@/views/admin/AnnualCoursesSection").then(m => ({ default: m.AnnualCoursesSection })));
const UpdatesSection            = lazy(() => import("@/views/admin/UpdatesSection").then(m => ({ default: m.UpdatesSection })));
const KnowledgeEngineSection    = lazy(() => import("@/views/admin/KnowledgeEngineSection").then(m => ({ default: m.KnowledgeEngineSection })));
const ScholarlyVerificationSection = lazy(() => import("@/views/admin/ScholarlyVerificationSection").then(m => ({ default: m.ScholarlyVerificationSection })));
const VerifiedKnowledgeSection  = lazy(() => import("@/views/admin/VerifiedKnowledgeSection").then(m => ({ default: m.VerifiedKnowledgeSection })));
const KnowledgeReasoningSection = lazy(() => import("@/views/admin/KnowledgeReasoningSection").then(m => ({ default: m.KnowledgeReasoningSection })));
const SearchAnalyticsSection    = lazy(() => import("@/views/admin/SearchAnalyticsSection").then(m => ({ default: m.SearchAnalyticsSection })));
const DigitalLearningSection    = lazy(() => import("@/views/admin/DigitalLearningSection").then(m => ({ default: m.DigitalLearningSection })));
const AutonomousAiSection       = lazy(() => import("@/views/admin/AutonomousAiSection").then(m => ({ default: m.AutonomousAiSection })));
const GlobalReferenceSection    = lazy(() => import("@/views/admin/GlobalReferenceSection").then(m => ({ default: m.GlobalReferenceSection })));
const IslamicIntelligenceSection = lazy(() => import("@/views/admin/IslamicIntelligenceSection").then(m => ({ default: m.IslamicIntelligenceSection })));
const OpenPlatformSection       = lazy(() => import("@/views/admin/OpenPlatformSection").then(m => ({ default: m.OpenPlatformSection })));
const GovernanceSection         = lazy(() => import("@/views/admin/GovernanceSection").then(m => ({ default: m.GovernanceSection })));
const SmartCmsSection           = lazy(() => import("@/views/admin/SmartCmsSection").then(m => ({ default: m.SmartCmsSection })));
const SubmissionsSection        = lazy(() => import("@/views/admin/SubmissionsSection").then(m => ({ default: m.SubmissionsSection })));
const QuizSection               = lazy(() => import("@/views/admin/QuizSection").then(m => ({ default: m.QuizSection })));
const RelationshipsSection      = lazy(() => import("@/views/admin/RelationshipsSection").then(m => ({ default: m.RelationshipsSection })));
const TelegramSection           = lazy(() => import("@/views/admin/TelegramSection").then(m => ({ default: m.TelegramSection })));
const UniversitiesSection       = lazy(() => import("@/views/admin/UniversitiesAdminPage").then(m => ({ default: m.UniversitiesSection })));
const ProphetStoriesSection     = lazy(() => import("@/views/admin/ProphetStoriesSection").then(m => ({ default: m.ProphetStoriesSection })));
const IslamicStoriesSection     = lazy(() => import("@/views/admin/IslamicStoriesSection").then(m => ({ default: m.IslamicStoriesSection })));
const ImageImportSection        = lazy(() => import("@/views/admin/ImageImportSection").then(m => ({ default: m.ImageImportSection })));
const HaramainLessonsSection    = lazy(() => import("@/views/admin/HaramainLessonsSection").then(m => ({ default: m.HaramainLessonsSection })));

function AdminSectionFallback() {
  return <div className="admin-section-loading" aria-label="جارٍ التحميل…" />;
}

export default function AdminPage() {
  const [location] = useLocation();
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
      <Suspense fallback={<AdminSectionFallback />}>
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
        {section === "haramain-lessons" && <HaramainLessonsSection />}
      </Suspense>
    </AdminShell>
  );
}
