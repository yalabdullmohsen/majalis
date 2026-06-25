import { useState } from "react";
import { AdminShell, type AdminSection } from "@/pages/admin/AdminShell";
import { DashboardSection } from "@/pages/admin/DashboardSection";
import { LessonsSection } from "@/pages/admin/LessonsSection";
import { SheikhsSection } from "@/pages/admin/SheikhsSection";
import { LibrarySection } from "@/pages/admin/LibrarySection";
import { MiraclesSection } from "@/pages/admin/MiraclesSection";
import { AdhkarSection } from "@/pages/admin/AdhkarSection";
import { FawaidSection } from "@/pages/admin/FawaidSection";
import { QaSection } from "@/pages/admin/QaSection";
import { CondolencesSection } from "@/pages/admin/CondolencesSection";
import { UsersSection } from "@/pages/admin/UsersSection";
import { SettingsSection } from "@/pages/admin/SettingsSection";
import { AggregatorSection } from "@/pages/admin/AggregatorSection";
import { ReportsSection } from "@/pages/admin/ReportsSection";
import { FiqhCouncilSection } from "@/pages/admin/FiqhCouncilSection";
import { FatwaAdminSection } from "@/pages/admin/FatwaAdminSection";
import { RulingsSection } from "@/pages/admin/RulingsSection";
import { AnnualCoursesSection } from "@/pages/admin/AnnualCoursesSection";
import { UpdatesSection } from "@/pages/admin/UpdatesSection";
import { KnowledgeEngineSection } from "@/pages/admin/KnowledgeEngineSection";

export default function AdminPage() {
  const [section, setSection] = useState<AdminSection>("dashboard");

  return (
    <AdminShell section={section} onSectionChange={setSection}>
      {section === "dashboard" && <DashboardSection />}
      {section === "aggregator" && <AggregatorSection />}
      {section === "knowledge-engine" && <KnowledgeEngineSection />}
      {section === "lessons" && <LessonsSection />}
      {section === "sheikhs" && <SheikhsSection />}
      {section === "library" && <LibrarySection />}
      {section === "miracles" && <MiraclesSection />}
      {section === "adhkar" && <AdhkarSection />}
      {section === "fawaid" && <FawaidSection />}
      {section === "qa" && <QaSection />}
      {section === "condolences" && <CondolencesSection />}
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
