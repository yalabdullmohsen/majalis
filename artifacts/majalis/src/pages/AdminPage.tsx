import { useState } from "react";
import { AdminShell, type AdminSection } from "@/pages/admin/AdminShell";
import { LessonsSection } from "@/pages/admin/LessonsSection";
import { SheikhsSection } from "@/pages/admin/SheikhsSection";
import { AdhkarSection } from "@/pages/admin/AdhkarSection";
import { FawaidSection } from "@/pages/admin/FawaidSection";
import { QaSection } from "@/pages/admin/QaSection";
import { CondolencesSection } from "@/pages/admin/CondolencesSection";
import { UsersSection } from "@/pages/admin/UsersSection";
import { SettingsSection } from "@/pages/admin/SettingsSection";
import { ReportsSection } from "@/pages/admin/ReportsSection";

export default function AdminPage() {
  const [section, setSection] = useState<AdminSection>("lessons");

  return (
    <AdminShell section={section} onSectionChange={setSection}>
      {section === "lessons" && <LessonsSection />}
      {section === "sheikhs" && <SheikhsSection />}
      {section === "adhkar" && <AdhkarSection />}
      {section === "fawaid" && <FawaidSection />}
      {section === "qa" && <QaSection />}
      {section === "condolences" && <CondolencesSection />}
      {section === "users" && <UsersSection />}
      {section === "settings" && <SettingsSection />}
      {section === "reports" && <ReportsSection />}
    </AdminShell>
  );
}
