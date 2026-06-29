import { useEffect } from "react";
import { Redirect, useLocation } from "wouter";
import { AdminShell, type AdminSection } from "@/views/admin/AdminShell";
import { DashboardSection } from "@/views/admin/DashboardSection";
import { LessonsSection } from "@/views/admin/LessonsSection";
import { SheikhsSection } from "@/views/admin/SheikhsSection";
import { LibrarySection } from "@/views/admin/LibrarySection";
import { MiraclesSection } from "@/views/admin/MiraclesSection";
import { AdhkarSection } from "@/views/admin/AdhkarSection";
import { FawaidSection } from "@/views/admin/FawaidSection";
import { QaSection } from "@/views/admin/QaSection";
import { CondolencesSection } from "@/views/admin/CondolencesSection";
import { UsersSection } from "@/views/admin/UsersSection";
import { SettingsSection } from "@/views/admin/SettingsSection";
import { AggregatorSection } from "@/views/admin/AggregatorSection";
import { ReportsSection } from "@/views/admin/ReportsSection";
import { FiqhCouncilSection } from "@/views/admin/FiqhCouncilSection";
import { FatwaAdminSection } from "@/views/admin/FatwaAdminSection";
import { RulingsSection } from "@/views/admin/RulingsSection";
import { AnnualCoursesSection } from "@/views/admin/AnnualCoursesSection";
import { QuranScientificCirclesSection } from "@/views/admin/QuranScientificCirclesSection";
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
import { SinJeemSection } from "@/views/admin/SinJeemSection";
import { ScientificResearchSection } from "@/views/admin/ScientificResearchSection";
import { ContactMessagesSection } from "@/views/admin/ContactMessagesSection";
import { ContactChatSection } from "@/views/admin/ContactChatSection";
import {
  adminSectionPath,
  resolveAdminSectionFromPath,
  resolveLegacyAdminSection,
} from "@/lib/admin-navigation";

function useAdminSection(): AdminSection {
  const [location] = useLocation();
  const fromPath = resolveAdminSectionFromPath(location);
  if (fromPath) return fromPath;

  if (typeof window !== "undefined") {
    const legacy = resolveLegacyAdminSection(window.location.search);
    if (legacy) return legacy;
  }

  return "dashboard";
}

export default function AdminPage() {
  const [location, navigate] = useLocation();
  const section = useAdminSection();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const legacy = resolveLegacyAdminSection(window.location.search);
    if (!legacy) return;
    if (location === "/admin" || location === "/admin/") {
      navigate(adminSectionPath(legacy));
    }
  }, [location, navigate]);

  const unknownSlug =
    location.startsWith("/admin/") &&
    location !== "/admin" &&
    resolveAdminSectionFromPath(location) === null;

  if (unknownSlug) {
    return <Redirect to="/admin" />;
  }

  return (
    <AdminShell section={section}>
      <SectionContent section={section} />
    </AdminShell>
  );
}

function SectionContent({ section }: { section: AdminSection }) {
  switch (section) {
    case "dashboard":
      return <DashboardSection />;
    case "aggregator":
      return <AggregatorSection />;
    case "knowledge-engine":
      return <KnowledgeEngineSection />;
    case "scholarly-verification":
      return <ScholarlyVerificationSection />;
    case "verified-knowledge":
      return <VerifiedKnowledgeSection />;
    case "knowledge-reasoning":
      return <KnowledgeReasoningSection />;
    case "search-analytics":
      return <SearchAnalyticsSection />;
    case "digital-learning":
      return <DigitalLearningSection />;
    case "autonomous-ai":
      return <AutonomousAiSection />;
    case "global-reference":
      return <GlobalReferenceSection />;
    case "islamic-intelligence":
      return <IslamicIntelligenceSection />;
    case "open-platform":
      return <OpenPlatformSection />;
    case "smart-cms":
      return <SmartCmsSection />;
    case "governance":
      return <GovernanceSection />;
    case "lessons":
      return <LessonsSection />;
    case "sheikhs":
      return <SheikhsSection />;
    case "library":
      return <LibrarySection />;
    case "scientific-research":
      return <ScientificResearchSection />;
    case "miracles":
      return <MiraclesSection />;
    case "adhkar":
      return <AdhkarSection />;
    case "fawaid":
      return <FawaidSection />;
    case "qa":
      return <QaSection />;
    case "question-answer":
      return <SinJeemSection />;
    case "condolences":
      return <CondolencesSection />;
    case "users":
      return <UsersSection />;
    case "settings":
      return <SettingsSection />;
    case "reports":
      return <ReportsSection />;
    case "fiqh-council":
      return <FiqhCouncilSection />;
    case "fatwa":
      return <FatwaAdminSection />;
    case "rulings":
      return <RulingsSection />;
    case "annual-courses":
      return <AnnualCoursesSection />;
    case "quran-scientific-circles":
      return <QuranScientificCirclesSection />;
    case "updates":
      return <UpdatesSection />;
    case "contact-messages":
      return <ContactMessagesSection />;
    case "contact-chat":
      return <ContactChatSection />;
    default:
      return <DashboardSection />;
  }
}
